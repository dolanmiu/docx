/**
 * Lays out a document's pages as Word does, to find the page each bookmark starts on.
 *
 * Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller.
 * Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
 * rows move to the next page whole, and the table's header rows are repeated there. It stops at the first thing it
 * can't lay out yet, and the bookmarks after it aren't placed.
 *
 * @module
 */
import { DEFAULT_MEASURER, type InlineItem, type LaidOutLine, type TextMeasurer, layoutLines } from "../text-layout";
import { formatNumber } from "./number-format";
import type { Block, DocumentContent, HeadersOrFooters, LayoutItem, ParagraphBlock, Section, TableBlock } from "./read-document";

/**
 * Where the pages of a document broke.
 */
export type Pagination = {
    /** The number of the page each bookmark starts on, as the page shows it */
    readonly bookmarks: ReadonlyMap<string, string>;
    /** How many pages were laid out */
    readonly pageCount: number;
    /** What it stopped at, when it couldn't lay out all of the document */
    readonly stoppedAt?: string;
};

export type PaginateOptions = {
    /** The page numbers of bookmarks, which the results of the page references to them are. Those not in it are blank */
    readonly pageNumbers?: ReadonlyMap<string, string>;
    readonly measurer?: TextMeasurer;
};

/** A paragraph broken into lines, with the space around it */
type MeasuredParagraph = {
    readonly lines: readonly LaidOutLine[];
    readonly spaceBefore: number;
    readonly spaceAfter: number;
    readonly keepNext: boolean;
    readonly keepLines: boolean;
    readonly widowControl: boolean;
    readonly pageBreakBefore: boolean;
};

// How far past the bottom of a page a line may go, for the rounding of the heights
const TOLERANCE = 0.01;

/**
 * The lines of paragraphs without page references, by the measurer and width they were laid out with. They are the same
 * each time the pages are laid out again with the page numbers worked out before.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const laidOutLines = new WeakMap<TextMeasurer, WeakMap<ParagraphBlock, Map<number, readonly LaidOutLine[]>>>();

/** Thrown to stop laying out at something that can't be laid out yet */
class Unsupported extends Error {}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * Lays out a document's pages, and finds the page each bookmark starts on.
 */
export const paginate = (
    content: DocumentContent,
    { pageNumbers = new Map(), measurer = DEFAULT_MEASURER }: PaginateOptions = {},
): Pagination => {
    const { blocks, sections, defaultTabStop, evenAndOddHeaders, addsParagraphSpacing } = content;
    /** The space between two paragraphs: the larger of the space after the first and before the second, or both */
    const between = (after: number, before: number): number => (addsParagraphSpacing ? after + before : Math.max(after, before));

    const itemsOf = (items: readonly LayoutItem[]): readonly InlineItem[] =>
        items.map((item) =>
            item.type === "pageReference" ? { type: "text", text: pageNumbers.get(item.bookmark) ?? "", font: item.font } : item,
        );

    // eslint-disable-next-line functional/prefer-readonly-type
    const byParagraph = laidOutLines.get(measurer) ?? new WeakMap<ParagraphBlock, Map<number, readonly LaidOutLine[]>>();
    laidOutLines.set(measurer, byParagraph);
    const linesOf = (paragraph: ParagraphBlock, width: number): readonly LaidOutLine[] => {
        const layOut = (): readonly LaidOutLine[] =>
            layoutLines(itemsOf(paragraph.items), {
                width,
                format: paragraph.format,
                tabStops: paragraph.tabStops,
                defaultTabStop,
                markFont: paragraph.markFont,
                measurer,
            });
        if (paragraph.items.some(({ type }) => type === "pageReference")) {
            return layOut();
        }
        const byWidth = byParagraph.get(paragraph) ?? new Map<number, readonly LaidOutLine[]>();
        byParagraph.set(paragraph, byWidth);
        const lines = byWidth.get(width) ?? layOut();
        // eslint-disable-next-line functional/immutable-data
        byWidth.set(width, lines);
        return lines;
    };

    const measureParagraph = (paragraph: ParagraphBlock, width: number, before?: Block, after?: Block): MeasuredParagraph => {
        const { format } = paragraph;
        const lines = linesOf(paragraph, width);
        // With contextual spacing, there is no space between paragraphs of the same style
        const sameStyle = (other?: Block): boolean =>
            format.contextualSpacing === true && other?.type === "paragraph" && other.style === paragraph.style;
        return {
            lines,
            spaceBefore: sameStyle(before) ? 0 : (format.spaceBefore ?? 0),
            spaceAfter: sameStyle(after) ? 0 : (format.spaceAfter ?? 0),
            keepNext: format.keepNext === true,
            keepLines: format.keepLines === true,
            // Word controls widows and orphans unless a paragraph or its style turns it off
            widowControl: format.widowControl !== false,
            pageBreakBefore: format.pageBreakBefore === true,
        };
    };

    const linesHeight = (lines: readonly LaidOutLine[]): number => sum(lines.map(({ height }) => height));

    /**
     * The height of blocks stacked in a width, such as those in a table cell or a header, with the space before the
     * first and after the last
     */
    const stackHeight = (stack: readonly Block[], width: number): number => {
        const parts = stack.map((block, index) => {
            if (block.type === "table") {
                return { height: sum(rowHeights(block)), before: 0, after: 0 };
            }
            const { lines, spaceBefore: before, spaceAfter: after } = measureParagraph(block, width, stack[index - 1], stack[index + 1]);
            return { height: linesHeight(lines), before, after };
        });
        return (
            sum(parts.map(({ height, before }, index) => height + (index === 0 ? before : between(parts[index - 1].after, before)))) +
            (parts[parts.length - 1]?.after ?? 0)
        );
    };

    /**
     * The height of each row of a table: its tallest cell, with the cell's margins, or the row's own height, and its
     * borders. Cells merged down several rows make the last of them taller when their text needs more room.
     */
    const rowHeights = ({ rows }: TableBlock): readonly number[] => {
        const cellHeight = (cell: TableBlock["rows"][number]["cells"][number]): number =>
            cell.marginTop + stackHeight(cell.blocks, cell.width) + cell.marginBottom;
        const heights = rows.map(({ cells, height, borderTop, borderBottom }) => {
            const natural = Math.max(0, ...cells.filter(({ verticalMerge }) => verticalMerge === undefined).map(cellHeight));
            const rowHeight = height === undefined ? natural : height.rule === "exact" ? height.value : Math.max(height.value, natural);
            return rowHeight + borderTop + borderBottom;
        });
        return rows.reduce<readonly number[]>(
            (all, { cells }, rowIndex) =>
                cells.reduce((current, cell) => {
                    if (cell.verticalMerge !== "restart") {
                        return current;
                    }
                    // The rest of the merge is in the same column of the grid, which cells spanning columns can put at another index
                    const span = rows
                        .slice(rowIndex + 1)
                        .findIndex((row) => row.cells.find(({ column }) => column === cell.column)?.verticalMerge !== "continue");
                    const last = span === -1 ? rows.length - 1 : rowIndex + span;
                    const missing = cellHeight(cell) - sum(current.slice(rowIndex, last + 1));
                    return missing > 0 && rows[last].height?.rule !== "exact"
                        ? current.map((value, index) => (index === last ? value + missing : value))
                        : current;
                }, all),
            heights,
        );
    };

    const markersOf = (block: Block): readonly string[] =>
        block.type === "paragraph"
            ? block.items.flatMap((item) => (item.type === "marker" ? [item.name] : []))
            : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));

    // The state of the page being filled
    const bookmarks = new Map<string, string>();
    const headerHeights = new Map<readonly Block[], number>();
    let pageCount = 0;
    let pageNumber = 0;
    let sectionIndex = 0;
    // Where the page's body starts and ends, and where the next line goes, in points from the top of the page
    let top = 0;
    let bottom = 0;
    let position = 0;
    // Whether anything is on the page yet
    let placedOnPage = false;
    // The space after the last paragraph, which goes before what is next on the page
    let spaceAfter = 0;

    const section = (): Section => sections[sectionIndex];
    const textWidth = (current = section()): number => current.pageWidth - current.marginLeft - current.marginRight - current.gutter;

    const partHeight = (parts: HeadersOrFooters, isFirst: boolean): number => {
        const current = section();
        const part = current.titlePage && isFirst ? parts.first : evenAndOddHeaders && pageNumber % 2 === 0 ? parts.even : parts.default;
        if (!part) {
            return 0;
        }
        if (part.some((block) => block.unsupported !== undefined)) {
            throw new Unsupported(part.find((block) => block.unsupported !== undefined)!.unsupported);
        }
        const height = headerHeights.get(part) ?? stackHeight(part, textWidth());
        // eslint-disable-next-line functional/immutable-data
        headerHeights.set(part, height);
        return height;
    };

    const startPage = (isFirstOfSection = false): void => {
        const current = section();
        pageNumber = isFirstOfSection && current.firstNumber !== undefined ? current.firstNumber : pageNumber + 1;
        // A header or footer taller than the margin pushes the body away from it, unless the margin is negative
        const headerBottom = current.header + partHeight(current.headers, isFirstOfSection);
        const footerTop = current.footer + partHeight(current.footers, isFirstOfSection);
        pageCount++;
        top = current.marginTop < 0 ? -current.marginTop : Math.max(current.marginTop, headerBottom);
        bottom = current.pageHeight - (current.marginBottom < 0 ? -current.marginBottom : Math.max(current.marginBottom, footerTop));
        position = top;
        placedOnPage = false;
        spaceAfter = 0;
    };

    const startSection = (index: number): void => {
        const previous = section();
        sectionIndex = index;
        const current = section();
        if (current.unsupported) {
            throw new Unsupported(current.unsupported);
        }
        const samePage = previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight;
        if (current.start === "continuous" && samePage) {
            return;
        }
        const nextNumber = current.firstNumber ?? pageNumber + 1;
        if ((current.start === "evenPage" && nextNumber % 2 !== 0) || (current.start === "oddPage" && nextNumber % 2 === 0)) {
            // A blank page, so the section starts on an even or odd page
            pageCount++;
            pageNumber++;
        }
        startPage(true);
    };

    const mark = (names: readonly string[]): void => {
        const text = formatNumber(pageNumber, section().numberFormat)!;
        for (const name of names) {
            if (!bookmarks.has(name)) {
                // eslint-disable-next-line functional/immutable-data
                bookmarks.set(name, text);
            }
        }
    };

    /**
     * Places lines of a paragraph, breaking pages between them where they don't fit. A paragraph's first or last line
     * isn't left alone on a page with widow control, and its lines stay together with keepLines. The space before a
     * paragraph at the top of a page is left out.
     */
    const placeLines = (lines: readonly LaidOutLine[], paragraph: MeasuredParagraph, isStart: boolean): void => {
        let index = 0;
        while (index < lines.length) {
            const space = placedOnPage && isStart && index === 0 ? between(spaceAfter, paragraph.spaceBefore) : 0;
            const room = bottom - position - space;
            const remaining = lines.slice(index);
            // How many of the lines fit on the page
            const ends = remaining.map((_, line) => sum(remaining.slice(0, line + 1).map(({ height }) => height)));
            const fits = ends.filter((end) => end <= room + TOLERANCE).length;
            let count = fits;
            if (fits < remaining.length) {
                const isFirstLine = isStart && index === 0;
                if (paragraph.keepLines && isFirstLine) {
                    count = 0;
                } else if (paragraph.widowControl && remaining.length >= 2) {
                    // Leave at least two lines on the next page, and don't leave the first line alone on this one
                    count = remaining.length - count === 1 ? count - 1 : count;
                    count = isFirstLine && count === 1 ? 0 : count;
                }
            }
            if (count === 0 && !placedOnPage) {
                // Nothing fits on an empty page, so as much as fits goes on it, and at least a line
                count = Math.max(1, fits);
            }
            if (count > 0) {
                position += space;
                for (const line of remaining.slice(0, count)) {
                    mark(line.markers);
                    position += line.height;
                }
                placedOnPage = true;
                index += count;
            }
            if (index < lines.length) {
                startPage();
            }
        }
    };

    const placeParagraph = (paragraph: MeasuredParagraph): void => {
        if (paragraph.pageBreakBefore && placedOnPage) {
            startPage();
        }
        // Lines up to each page or column break, which start the rest on a new page
        const groups = paragraph.lines.reduce<readonly (readonly LaidOutLine[])[]>(
            (all, line) => {
                const last = all[all.length - 1];
                const current = [...last, line];
                return line.breakAfter ? [...all.slice(0, -1), current, []] : [...all.slice(0, -1), current];
            },
            [[]],
        );
        for (const [index, group] of groups.entries()) {
            if (index > 0) {
                startPage();
            }
            placeLines(group, paragraph, index === 0);
        }
        ({ spaceAfter } = paragraph);
    };

    const placeTable = (table: TableBlock): void => {
        const heights = rowHeights(table);
        const headerRows = table.rows.findIndex(({ header }) => !header);
        const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
        // The space after the paragraph before the table
        position += spaceAfter;
        spaceAfter = 0;
        for (const [index, row] of table.rows.entries()) {
            const height = heights[index];
            if (position + height > bottom + TOLERANCE && placedOnPage) {
                startPage();
                if (index >= headerRows && headerRows > 0) {
                    position += repeated;
                }
            }
            if (height > bottom - position + TOLERANCE) {
                throw new Unsupported("a table row taller than a page");
            }
            mark(row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));
            position += height;
            placedOnPage = true;
        }
    };

    /**
     * The room the paragraphs kept with the next one, from this one, need on the page: all of them, and the start of
     * the block they are kept with, from where the next line would go.
     */
    const keptHeight = (index: number, width: number): number => {
        const chain = blocks.slice(index).findIndex(({ block, section: blockSection }, offset) => {
            const following = blocks[index + offset + 1];
            return !(block.type === "paragraph" && block.format.keepNext === true && following && following.section === blockSection);
        });
        const measured = (offset: number): MeasuredParagraph =>
            measureParagraph(blocks[offset].block as ParagraphBlock, width, blocks[offset - 1]?.block, blocks[offset + 1]?.block);
        const kept = Array.from({ length: chain }, (_, offset) => measured(index + offset));
        const keptLines = sum(
            kept.map(
                ({ lines, spaceBefore }, offset) =>
                    linesHeight(lines) + between(offset === 0 ? spaceAfter : kept[offset - 1].spaceAfter, spaceBefore),
            ),
        );
        const lastAfter = kept[kept.length - 1]?.spaceAfter ?? spaceAfter;
        const anchor = blocks[index + chain].block;
        if (anchor.type === "table") {
            return keptLines + lastAfter + (anchor.unsupported ? 0 : (rowHeights(anchor)[0] ?? 0));
        }
        // As much of the next paragraph as can't be left at the bottom of a page on its own
        const next = measured(index + chain);
        const firstLines = next.keepLines || (next.widowControl && next.lines.length <= 3) ? next.lines.length : next.widowControl ? 2 : 1;
        return keptLines + between(lastAfter, next.spaceBefore) + linesHeight(next.lines.slice(0, firstLines));
    };

    try {
        if (content.unsupported) {
            throw new Unsupported(content.unsupported);
        }
        if (section().unsupported) {
            throw new Unsupported(section().unsupported);
        }
        startPage(true);
        for (const [index, { block, section: blockSection }] of blocks.entries()) {
            if (blockSection !== sectionIndex) {
                startSection(blockSection);
            }
            if (block.unsupported) {
                throw new Unsupported(block.unsupported);
            }
            if (block.type === "table") {
                placeTable(block);
                continue;
            }
            const width = textWidth();
            const paragraph = measureParagraph(block, width, blocks[index - 1]?.block, blocks[index + 1]?.block);
            if (paragraph.keepNext && placedOnPage) {
                const needed = keptHeight(index, width);
                if (position + needed > bottom + TOLERANCE && needed <= bottom - top + TOLERANCE) {
                    startPage();
                }
            }
            placeParagraph(paragraph);
        }
    } catch (error) {
        if (!(error instanceof Unsupported)) {
            throw error;
        }
        return { bookmarks, pageCount, stoppedAt: error.message };
    }
    return { bookmarks, pageCount };
};
