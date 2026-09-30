/**
 * Lays out a document's pages as Word does, to find the page each bookmark starts on.
 *
 * Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller,
 * and in columns, the first column and then the next.
 * Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
 * rows break across pages between the lines of their cells, unless they are kept whole, and the table's header rows are
 * repeated on each page. The footnotes of each page's lines take room at its bottom, and one that doesn't fit below its
 * reference continues at the bottom of the next page. The endnotes follow the body.
 * It stops at the first thing it can't lay out yet, and the bookmarks after it aren't placed.
 *
 * @module
 */
import {
    type ContentWidths,
    DEFAULT_MEASURER,
    type InlineItem,
    type LaidOutLine,
    type TextMeasurer,
    layoutLines,
    measureContentWidths,
} from "../text-layout";
import { fitColumns } from "./column-widths";
import { formatNumber } from "./number-format";
import type { Block, DocumentContent, HeadersOrFooters, LayoutItem, ParagraphBlock, Section, TableBlock, TableRow } from "./read-document";

/**
 * Where the pages of a document broke.
 */
export type Pagination = {
    /** The number of the page each bookmark starts on, as the page shows it */
    readonly bookmarks: ReadonlyMap<string, string>;
    /** How many pages were laid out */
    readonly pageCount: number;
    /**
     * How many pages each section has, in order: undefined for a section that shares a page with another, that has a
     * blank page before or after it, or that wasn't laid out to its end
     */
    readonly sectionPageCounts: readonly (number | undefined)[];
    /** What it stopped at, when it couldn't lay out all of the document */
    readonly stoppedAt?: string;
};

export type PaginateOptions = {
    /** The page numbers of bookmarks, which the results of the page references to them are. Those not in it are blank */
    readonly pageNumbers?: ReadonlyMap<string, string>;
    /** The number of pages of the document, and of each section, which page count fields show. They are blank without */
    readonly pageCount?: number;
    readonly sectionPageCounts?: readonly (number | undefined)[];
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

/** How a table in a table cell is placed when its row breaks across pages: whole, as a line that can't be broken */
const UNBROKEN: Omit<MeasuredParagraph, "lines"> = {
    spaceBefore: 0,
    spaceAfter: 0,
    keepNext: false,
    keepLines: true,
    widowControl: false,
    pageBreakBefore: false,
};

/** A paragraph in a table cell, and the first of its lines not yet placed */
type CellParagraph = { readonly paragraph: MeasuredParagraph; readonly from: number };

/** The height of a block stacked with others, and the space before and after it */
type StackPart = { readonly height: number; readonly before: number; readonly after: number };

/** Some of the lines of a footnote's paragraph: those on the page it starts on, or those it continues with on the next */
type NoteLines = { readonly paragraph: ParagraphBlock; readonly lines: readonly LaidOutLine[] };

/** Thrown to stop laying out at something that can't be laid out yet */
class Unsupported extends Error {}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * How many of a paragraph's lines, from one of them, fit in the room left on a page (`fits`), and how many of those go on
 * it (`count`): with widow control, a paragraph's first line isn't left alone at the bottom of a page, nor its last line
 * at the top of the next, and with keepLines, a paragraph that doesn't fit moves to the next page whole. The footnotes
 * of the first lines take room at the bottom of the page too (`notesRoom`, from the number of lines).
 */
const linesThatFit = (
    lines: readonly LaidOutLine[],
    room: number,
    { keepLines, widowControl }: Pick<MeasuredParagraph, "keepLines" | "widowControl">,
    isFirstLine: boolean,
    notesRoom: (count: number) => number = () => 0,
): { readonly fits: number; readonly count: number } => {
    const ends = lines.map((_, line) => sum(lines.slice(0, line + 1).map(({ height }) => height)));
    const fits = ends.findIndex((end, line) => end + notesRoom(line + 1) > room + TOLERANCE);
    if (fits === -1) {
        return { fits: lines.length, count: lines.length };
    }
    if (keepLines && isFirstLine) {
        return { fits, count: 0 };
    }
    if (!widowControl || lines.length < 2) {
        return { fits, count: fits };
    }
    // Leave at least two lines on the next page, and don't leave the first line alone on this one
    const withoutWidow = lines.length - fits === 1 ? fits - 1 : fits;
    return { fits, count: isFirstLine && withoutWidow === 1 ? 0 : withoutWidow };
};

/**
 * Lays out a document's pages, and finds the page each bookmark starts on.
 */
export const paginate = (
    content: DocumentContent,
    {
        pageNumbers = new Map(),
        pageCount: givenPageCount,
        sectionPageCounts: givenSectionPageCounts = [],
        measurer = DEFAULT_MEASURER,
    }: PaginateOptions = {},
): Pagination => {
    const {
        sections,
        defaultTabStop,
        evenAndOddHeaders,
        addsParagraphSpacing,
        footnotes,
        footnoteSeparator,
        footnoteContinuationSeparator,
        endnotes,
    } = content;
    // The body, and then its endnotes, which Word lays out after it
    const blocks = [...content.blocks, ...endnotes.map((block) => ({ block, section: sections.length - 1 }))];
    /** The space between two paragraphs: the larger of the space after the first and before the second, or both */
    const between = (after: number, before: number): number => (addsParagraphSpacing ? after + before : Math.max(after, before));

    // The section being laid out
    let sectionIndex = 0;

    /** The text of the results of fields that depend on the pages, from the numbers given */
    const itemsOf = (items: readonly LayoutItem[]): readonly InlineItem[] =>
        items.map((item) => {
            if (item.type === "pageReference") {
                return { type: "text", text: pageNumbers.get(item.bookmark) ?? "", font: item.font };
            }
            if (item.type === "pageCount") {
                const count = item.scope === "document" ? givenPageCount : givenSectionPageCounts[sectionIndex];
                return { type: "text", text: count === undefined ? "" : String(count), font: item.font };
            }
            return item;
        });

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
        if (paragraph.items.some(({ type }) => type === "pageReference" || type === "pageCount")) {
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

    /** How narrow and how wide the paragraphs in a table cell can be */
    const contentWidths = (stack: readonly Block[]): ContentWidths =>
        stack
            .filter((block): block is ParagraphBlock => block.type === "paragraph")
            .reduce<ContentWidths>(
                (widths, block) => {
                    const { min, max } = measureContentWidths(itemsOf(block.items), {
                        format: block.format,
                        tabStops: block.tabStops,
                        defaultTabStop,
                        measurer,
                    });
                    return { min: Math.max(widths.min, min), max: Math.max(widths.max, max) };
                },
                { min: 0, max: 0 },
            );

    // Tables sized to their text, by the width they are in
    // eslint-disable-next-line functional/prefer-readonly-type
    const fittedTables = new Map<TableBlock, Map<number, TableBlock>>();
    /** A table as it is laid out in a width: with its columns sized to their text, when Word sizes them so */
    const fitted = (table: TableBlock, width: number): TableBlock => {
        if (!table.fit) {
            return table;
        }
        const byWidth = fittedTables.get(table) ?? new Map<number, TableBlock>();
        // eslint-disable-next-line functional/immutable-data
        fittedTables.set(table, byWidth);
        const sized = byWidth.get(width) ?? fitColumns(table, width, contentWidths);
        // eslint-disable-next-line functional/immutable-data
        byWidth.set(width, sized);
        return sized;
    };

    /** The heights of blocks stacked in a width, with the space before and after each */
    const stackParts = (stack: readonly Block[], width: number): readonly StackPart[] =>
        stack.map((block, index) => {
            if (block.type === "table") {
                return { height: sum(rowHeights(fitted(block, width))), before: 0, after: 0 };
            }
            const { lines, spaceBefore: before, spaceAfter: after } = measureParagraph(block, width, stack[index - 1], stack[index + 1]);
            return { height: linesHeight(lines), before, after };
        });

    /**
     * The height of blocks stacked in a width, such as those in a table cell or a header, with the space before the
     * first and after the last, unless it is left out
     */
    const stackHeight = (stack: readonly Block[], width: number, withOuterSpace = true): number =>
        heightOf(stackParts(stack, width), withOuterSpace);

    /** The height of stacked parts, with the space between them, and before the first and after the last unless left out */
    const heightOf = (parts: readonly StackPart[], withOuterSpace: boolean): number => {
        const outer = withOuterSpace ? (parts[0]?.before ?? 0) + (parts[parts.length - 1]?.after ?? 0) : 0;
        return sum(parts.map(({ height, before }, index) => height + (index === 0 ? 0 : between(parts[index - 1].after, before)))) + outer;
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
                        .findIndex((row) => row.cells.find((other) => other.column === cell.column)?.verticalMerge !== "continue");
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
    // The height of each header and footer, by the section it is in, whose number of pages it can show
    // eslint-disable-next-line functional/prefer-readonly-type
    const headerHeights = new Map<readonly Block[], Map<number, number>>();
    let pageCount = 0;
    let pageNumber = 0;
    // The first and last page of each section, and the sections whose pages aren't theirs alone
    const firstPages = new Map<number, number>([[0, 1]]);
    const lastPages = new Map<number, number>();
    const sharingPages = new Set<number>();
    // Where the page's body starts and ends, and where the next line goes, in points from the top of the page
    let top = 0;
    let bottom = 0;
    let position = 0;
    // The column being filled, from the first, and where the page's columns start, below what is above them on the page
    let column = 0;
    let columnTop = 0;
    // Whether anything is in the column yet: on the page, for a page of one column
    let placedInColumn = false;
    // The footnotes at the bottom of the page, by their markers, and the room they take with their separator
    let pageNotes: readonly string[] = [];
    let noteArea = 0;
    // The rest of a footnote continued from the page before, above the page's own, and of one continued on the next page
    let continued: NoteLines | undefined;
    let carried: NoteLines | undefined;
    // The space after the last paragraph, which goes before what is next on the page
    let spaceAfter = 0;

    const section = (): Section => sections[sectionIndex];
    /** The width of the text across the page, as its headers, footers and footnotes are */
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
        const bySection = headerHeights.get(part) ?? new Map<number, number>();
        const height = bySection.get(sectionIndex) ?? stackHeight(part, textWidth());
        // eslint-disable-next-line functional/immutable-data
        headerHeights.set(part, bySection.set(sectionIndex, height));
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
        column = 0;
        columnTop = top;
        placedInColumn = false;
        spaceAfter = 0;
        pageNotes = [];
        continued = carried;
        carried = undefined;
        noteArea = areaOf([]);
        if (continued !== undefined && current.columns.length > 1) {
            throw new Unsupported("a footnote in columns");
        }
        if (noteArea > bottom - top + TOLERANCE) {
            throw new Unsupported("a footnote across more than two pages");
        }
    };

    /** Moves to the top of the next column, or of the next page after the last column */
    const nextColumn = (): void => {
        if (column + 1 >= section().columns.length) {
            startPage();
            return;
        }
        column++;
        position = columnTop;
        placedInColumn = false;
        spaceAfter = 0;
    };

    const startSection = (index: number): void => {
        const previous = section();
        // eslint-disable-next-line functional/immutable-data
        lastPages.set(sectionIndex, pageCount);
        // A section with no paragraphs of its own, which isn't laid out
        for (let skipped = sectionIndex + 1; skipped < index; skipped++) {
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(skipped);
        }
        const before = sectionIndex;
        sectionIndex = index;
        const current = section();
        if (current.unsupported) {
            throw new Unsupported(current.unsupported);
        }
        const samePage = previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight;
        if (current.start === "continuous" && samePage) {
            if (previous.columns.length > 1 && (placedInColumn || column > 0)) {
                throw new Unsupported("columns balanced before a continuous section break");
            }
            // The section's columns start below what is on the page
            column = 0;
            columnTop = position;
            // eslint-disable-next-line functional/immutable-data
            firstPages.set(index, pageCount);
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(before).add(index);
            return;
        }
        if (current.start === "nextColumn" && (previous.columns.length > 1 || current.columns.length > 1)) {
            throw new Unsupported("a section that starts in the next column");
        }
        const nextNumber = current.firstNumber ?? pageNumber + 1;
        if ((current.start === "evenPage" && nextNumber % 2 !== 0) || (current.start === "oddPage" && nextNumber % 2 === 0)) {
            // A blank page, so the section starts on an even or odd page, which isn't either section's
            pageCount++;
            pageNumber++;
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(before).add(index);
        }
        startPage(true);
        // eslint-disable-next-line functional/immutable-data
        firstPages.set(index, pageCount);
    };

    /**
     * The room footnotes take at the bottom of the page: the separator's line above them, the rest of a footnote
     * continued from the page before (`from`), their paragraphs, and the first lines of one continued on the next page
     * (`split`), without the space before the first or after the last, as LibreOffice lays them out
     */
    const areaOf = (notes: readonly string[], split?: NoteLines, from = continued): number => {
        if (notes.length === 0 && split === undefined && from === undefined) {
            return 0;
        }
        const separator = from === undefined ? footnoteSeparator : footnoteContinuationSeparator;
        const stack = [
            ...separator,
            ...(from === undefined ? [] : [from.paragraph]),
            ...notes.flatMap((name) => footnotes.get(name)!),
            ...(split === undefined ? [] : [split.paragraph]),
        ];
        const unsupported = stack.find((block) => block.unsupported !== undefined)?.unsupported;
        if (unsupported) {
            throw new Unsupported(unsupported);
        }
        // The lines continued from the page before have no space before them
        const parts = stackParts(stack, textWidth()).map((part, index) => {
            if (from !== undefined && index === separator.length) {
                return { ...part, height: linesHeight(from.lines), before: 0 };
            }
            return split !== undefined && index === stack.length - 1 ? { ...part, height: linesHeight(split.lines) } : part;
        });
        return heightOf(parts, false);
    };

    const notesIn = (markers: readonly string[]): readonly string[] => markers.filter((name) => footnotes.has(name));

    /** The room footnotes take below those on the page already */
    const moreNoteRoom = (notes: readonly string[]): number => {
        if (notes.length > 0 && section().columns.length > 1) {
            throw new Unsupported("a footnote in columns");
        }
        return notes.length === 0 ? 0 : areaOf([...pageNotes, ...notes]) - noteArea;
    };

    /** Puts footnotes at the bottom of the page */
    const addNotes = (notes: readonly string[]): void => {
        if (notes.length > 0) {
            pageNotes = [...pageNotes, ...notes];
            noteArea = areaOf(pageNotes);
        }
    };

    /**
     * The paragraph of a footnote that can continue on the next page with two of its lines or more on each: a footnote of
     * one paragraph of 4 lines or more, not kept together
     */
    const continuable = (name: string): ParagraphBlock | undefined => {
        const [first, ...rest] = footnotes.get(name)!;
        return rest.length === 0 &&
            first?.type === "paragraph" &&
            first.format.keepLines !== true &&
            linesOf(first, textWidth()).length >= 4
            ? first
            : undefined;
    };

    /**
     * The least room the footnotes of lines take below those on the page: all of those of the lines before the last
     * (`before`), and of the last line's (`last`), the last continued on the next page after two of its lines, when it can be
     */
    const leastNoteRoom = (before: readonly string[], last: readonly string[]): number => {
        const room = moreNoteRoom([...before, ...last]);
        const paragraph = last.length === 0 ? undefined : continuable(last[last.length - 1]);
        return paragraph === undefined
            ? room
            : areaOf([...pageNotes, ...before, ...last.slice(0, -1)], { paragraph, lines: linesOf(paragraph, textWidth()).slice(0, 2) }) -
                  noteArea;
    };

    /**
     * Puts the footnotes of the lines placed at the bottom of the page: all of them, or where they don't fit, as many
     * lines of the last as fit, with the rest of it continued at the bottom of the next page, as Word and LibreOffice
     * continue it. The footnote takes the rest of the page then, so what follows goes on the next.
     */
    const placeNotes = (notes: readonly string[]): void => {
        if (notes.length === 0 || moreNoteRoom(notes) <= bottom - noteArea - position + TOLERANCE) {
            addNotes(notes);
            return;
        }
        const whole = [...pageNotes, ...notes.slice(0, -1)];
        const paragraph = continuable(notes[notes.length - 1])!;
        const lines = linesOf(paragraph, textWidth());
        const count = lines.findIndex(
            (_, line) => areaOf(whole, { paragraph, lines: lines.slice(0, line + 1) }) > bottom - position + TOLERANCE,
        );
        // Word's widow control in footnotes isn't known, so neither page gets only one of its lines
        if (count > lines.length - 2) {
            throw new Unsupported("a footnote across pages with a line on its own");
        }
        pageNotes = [...whole, notes[notes.length - 1]];
        noteArea = bottom - position;
        carried = { paragraph, lines: lines.slice(count) };
    };

    /**
     * Stops where a line fits on the page without its footnotes (`notes`), which don't fit below it (`below`, less those
     * of the lines before, `before`), and Word might put it on the page with only a part of one, which isn't followed: a
     * line of one on its own, one of several paragraphs, or one continued with others after it
     */
    const stopAtPartOfFootnote = (before: readonly string[], notes: readonly string[], below: number): void => {
        const index = notes.findIndex((_, note) => moreNoteRoom([...before, ...notes.slice(0, note + 1)]) > below + TOLERANCE);
        const [first, ...rest] = footnotes.get(notes[index]) ?? [];
        if (first === undefined) {
            // The line has no footnotes that don't fit, but those of the lines before, or an empty one
            return;
        }
        if (first.type === "table") {
            throw new Unsupported("a footnote of several paragraphs across pages");
        }
        const firstLine = { paragraph: first, lines: linesOf(first, textWidth()).slice(0, 1) };
        if (areaOf([...pageNotes, ...before, ...notes.slice(0, index)], firstLine) - noteArea > below + TOLERANCE) {
            // None of it fits, so the line goes on the next page with it
            return;
        }
        if (rest.length > 0) {
            throw new Unsupported("a footnote of several paragraphs across pages");
        }
        throw new Unsupported(
            index < notes.length - 1 || first.format.keepLines === true
                ? "a footnote across pages"
                : "a footnote across pages with a line on its own",
        );
    };

    /** Whether a footnote could continue on the next page: one of more than a line */
    const canBreak = (name: string): boolean => {
        const [first, ...rest] = footnotes.get(name)!;
        return rest.length > 0 || first?.type === "table" || (first !== undefined && measureParagraph(first, textWidth()).lines.length > 1);
    };

    const mark = (names: readonly string[]): void => {
        const text = formatNumber(pageNumber, section().numberFormat)!;
        for (const name of names) {
            if (!bookmarks.has(name) && !footnotes.has(name)) {
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
            const space = placedInColumn && isStart && index === 0 ? between(spaceAfter, paragraph.spaceBefore) : 0;
            const remaining = lines.slice(index);
            const notesOf = (upTo: number): readonly string[] => notesIn(remaining.slice(0, upTo).flatMap(({ markers }) => markers));
            const room = bottom - noteArea - position - space;
            const isFirstLine = isStart && index === 0;
            // The footnotes of the lines before the last go on the page whole, and the last of the last line's can continue
            const { fits, count: kept } = linesThatFit(remaining, room, paragraph, isFirstLine, (upTo) =>
                leastNoteRoom(notesOf(upTo - 1), notesIn(remaining[upTo - 1].markers)),
            );
            if (fits === 0 && !placedInColumn && (notesOf(1).length > 0 || continued !== undefined)) {
                throw new Unsupported(notesOf(1).length > 0 ? "a footnote across pages" : "a footnote across more than two pages");
            }
            // A line that fits, but not with its footnotes, moves to the next page with them, unless Word might put it here
            // with a part of one. That can only be when the footnotes of the lines before it all fit, rather than one
            // continuing on the next page
            const above = room - linesHeight(remaining.slice(0, fits));
            const splits = fits > 0 && moreNoteRoom(notesOf(fits)) > above + TOLERANCE;
            if (linesThatFit(remaining, room, paragraph, isFirstLine).fits > fits && !splits) {
                stopAtPartOfFootnote(notesOf(fits), notesIn(remaining[fits].markers), above - remaining[fits].height);
            }
            let count = kept;
            if (count === 0 && !placedInColumn) {
                // Nothing fits on an empty page, so as much as fits goes on it, and at least a line
                count = Math.max(1, fits);
            }
            if (count < fits && splits) {
                // Widow control or keepLines would hold back the line of a footnote continued on the next page
                throw new Unsupported("a footnote across pages");
            }
            if (count > 0) {
                position += space;
                for (const line of remaining.slice(0, count)) {
                    mark(line.markers);
                    position += line.height;
                }
                placeNotes(notesOf(count));
                placedInColumn = true;
                index += count;
            }
            if (index < lines.length) {
                nextColumn();
            }
        }
    };

    const placeParagraph = (paragraph: MeasuredParagraph): void => {
        if (paragraph.pageBreakBefore && (placedInColumn || column > 0)) {
            startPage();
        }
        // Lines up to each page or column break, which start the rest on a new page, or in the next column
        const groups = paragraph.lines.reduce<readonly (readonly LaidOutLine[])[]>(
            (all, line) => {
                const last = all[all.length - 1];
                const current = [...last, line];
                return line.breakAfter ? [...all.slice(0, -1), current, []] : [...all.slice(0, -1), current];
            },
            [[]],
        );
        for (const [index, group] of groups.entries()) {
            if (index > 0 && groups[index - 1][groups[index - 1].length - 1].breakAfter === "column") {
                nextColumn();
            } else if (index > 0) {
                startPage();
            }
            placeLines(group, paragraph, index === 0);
        }
        ({ spaceAfter } = paragraph);
    };

    /**
     * Fills a cell's part of a row that breaks across pages: as many of the lines left of its paragraphs as fit in the
     * room. The space before a paragraph at the top of the part on the next page is left out, as it is at the top of a
     * page.
     */
    const fillCell = (
        paragraphs: readonly CellParagraph[],
        room: number,
        isFirstPart: boolean,
    ): { readonly height: number; readonly lines: readonly LaidOutLine[]; readonly rest: readonly CellParagraph[] } => {
        let used = 0;
        let previousAfter: number | undefined;
        let placed: readonly LaidOutLine[] = [];
        for (const [index, { paragraph, from }] of paragraphs.entries()) {
            const space =
                from > 0
                    ? 0
                    : previousAfter === undefined
                      ? isFirstPart
                          ? paragraph.spaceBefore
                          : 0
                      : between(previousAfter, paragraph.spaceBefore);
            const remaining = paragraph.lines.slice(from);
            // Widow control and keepLines don't hold lines back in a row that breaks across pages, as in Word and LibreOffice
            const { fits: count } = linesThatFit(remaining, room - used - space, paragraph, from === 0);
            if (count > 0) {
                used += space + linesHeight(remaining.slice(0, count));
                placed = [...placed, ...remaining.slice(0, count)];
            }
            if (count < remaining.length) {
                return { height: used, lines: placed, rest: [{ paragraph, from: from + count }, ...paragraphs.slice(index + 1)] };
            }
            previousAfter = paragraph.spaceAfter;
        }
        // The space after the last paragraph, as much of it as there is room for
        return { height: Math.min(used + (previousAfter ?? 0), Math.max(used, room)), lines: placed, rest: [] };
    };

    /**
     * Places a row that doesn't fit on the page by breaking it across pages between the lines of its cells, as Word
     * breaks a row unless it is kept whole. A row none of whose lines fit moves to the next page. The table's header rows
     * are repeated above the rest of it on each page.
     */
    const splitRow = (row: TableRow, height: number, startTablePage: () => void): void => {
        // A table in a cell is measured as a line that doesn't break, which is enough to tell whether the row breaks
        let parts = row.cells.map((cell): readonly CellParagraph[] =>
            cell.blocks.map((block, index) => ({
                paragraph:
                    block.type === "paragraph"
                        ? measureParagraph(block, cell.width, cell.blocks[index - 1], cell.blocks[index + 1])
                        : { ...UNBROKEN, lines: [{ height: sum(rowHeights(fitted(block, cell.width))), markers: markersOf(block) }] },
                from: 0,
            })),
        );
        let isFirstPart = true;
        for (;;) {
            const borders = row.borderTop + row.borderBottom;
            const room = bottom - noteArea - position - borders;
            const first = isFirstPart;
            const filled = parts.map((paragraphs, cell) =>
                fillCell(paragraphs, room - row.cells[cell].marginTop - row.cells[cell].marginBottom, first),
            );
            const placesLines = filled.some(({ lines }) => lines.length > 0);
            const isLastPart = filled.every(({ rest }) => rest.length === 0);
            if (placesLines && !isLastPart) {
                if (row.cells.some(({ verticalMerge }) => verticalMerge !== undefined)) {
                    throw new Unsupported("a table row with merged cells across pages");
                }
                if (row.height !== undefined && row.height.value >= height - borders - TOLERANCE) {
                    throw new Unsupported("a table row of a set height across pages");
                }
                if (row.cells.some((cell) => cell.blocks.some(({ type }) => type === "table"))) {
                    throw new Unsupported("a table in a table row across pages");
                }
            }
            // A row whose text fits, but not the height it is set to, moves to the next page whole, as in LibreOffice
            const fitsWhole = !isFirstPart || position + height <= bottom - noteArea + TOLERANCE;
            if ((!placesLines || !fitsWhole) && !placedInColumn) {
                throw new Unsupported("a table row taller than a page");
            }
            if (placesLines && (fitsWhole || !isLastPart)) {
                mark(filled.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
            }
            if (placesLines && isLastPart && fitsWhole) {
                const tallest = Math.max(
                    ...filled.map((part, cell) => row.cells[cell].marginTop + part.height + row.cells[cell].marginBottom),
                );
                // A row that moved to the next page whole is as tall there as it is anywhere
                position += (isFirstPart ? height - borders : tallest) + borders;
                placedInColumn = true;
                return;
            }
            startTablePage();
            if (placesLines && !isLastPart) {
                parts = filled.map(({ rest }) => rest);
                isFirstPart = false;
            }
        }
    };

    const placeTable = (table: TableBlock): void => {
        const heights = rowHeights(table);
        const headerRows = table.rows.findIndex(({ header }) => !header);
        const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
        // The space after the paragraph before the table
        position += spaceAfter;
        spaceAfter = 0;
        // A new page for the table, with its header rows repeated at the top, unless the row going on it is one of them
        const startTablePage = (index: number): void => {
            nextColumn();
            if (index >= headerRows && headerRows > 0) {
                if (column > 0) {
                    throw new Unsupported("a table's header rows repeated in a column");
                }
                position += repeated;
            }
        };
        /** Whether a row fits on the page, with its footnotes */
        const rowFits = (height: number, notes: readonly string[]): boolean =>
            position + height + moreNoteRoom(notes) <= bottom - noteArea + TOLERANCE;
        for (const [index, row] of table.rows.entries()) {
            const height = heights[index];
            const markers = row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf));
            const notes = notesIn(markers);
            if (!rowFits(height, notes) && position + height <= bottom - noteArea + TOLERANCE && notes.some(canBreak)) {
                throw new Unsupported("a footnote in a table row across pages");
            }
            if (!rowFits(height, notes) && !row.cantSplit && row.height?.rule !== "exact") {
                if (notes.length > 0) {
                    throw new Unsupported("a footnote in a table row across pages");
                }
                splitRow(row, height, () => startTablePage(index));
                continue;
            }
            if (!rowFits(height, notes) && placedInColumn) {
                startTablePage(index);
            }
            if (!rowFits(height, notes)) {
                throw new Unsupported(notes.length > 0 ? "a footnote across pages" : "a table row taller than a page");
            }
            mark(markers);
            addNotes(notes);
            position += height;
            placedInColumn = true;
        }
    };

    /**
     * The room the paragraphs kept with the next one, from this one, need on the page: all of them, and the start of
     * the block they are kept with, from where the next line would go.
     */
    const keptHeight = (index: number, width: number): { readonly height: number; readonly notes: readonly string[] } => {
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
        const keptNotes = notesIn(kept.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
        const anchor = blocks[index + chain].block;
        if (anchor.type === "table") {
            const [firstRow] = anchor.rows;
            return {
                height: keptLines + lastAfter + (anchor.unsupported ? 0 : (rowHeights(fitted(anchor, width))[0] ?? 0)),
                notes: [...keptNotes, ...notesIn(firstRow ? firstRow.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)) : [])],
            };
        }
        // As much of the next paragraph as can't be left at the bottom of a page on its own
        const next = measured(index + chain);
        const firstLines = next.keepLines || (next.widowControl && next.lines.length <= 3) ? next.lines.length : next.widowControl ? 2 : 1;
        const nextLines = next.lines.slice(0, firstLines);
        return {
            height: keptLines + between(lastAfter, next.spaceBefore) + linesHeight(nextLines),
            notes: [...keptNotes, ...notesIn(nextLines.flatMap(({ markers }) => markers))],
        };
    };

    /** The number of pages of each section whose pages are its alone, and that was laid out to its end */
    const countsOf = (): readonly (number | undefined)[] =>
        sections.map((_, index) => {
            const first = firstPages.get(index);
            const last = lastPages.get(index);
            return first === undefined || last === undefined || sharingPages.has(index) ? undefined : last - first + 1;
        });

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
                placeTable(fitted(block, section().columns[column]));
                continue;
            }
            const width = section().columns[column];
            const paragraph = measureParagraph(block, width, blocks[index - 1]?.block, blocks[index + 1]?.block);
            if (paragraph.keepNext && placedInColumn) {
                const { height: needed, notes } = keptHeight(index, width);
                const fitsHere = position + needed + moreNoteRoom(notes) <= bottom - noteArea + TOLERANCE;
                if (!fitsHere && position + needed + leastNoteRoom(notes.slice(0, -1), notes.slice(-1)) <= bottom - noteArea + TOLERANCE) {
                    // They fit only with a footnote continued on the next page
                    throw new Unsupported("a footnote across pages");
                }
                // Where what is kept together would start: the top of the next column, or of a new page after the last
                const nextTop = column + 1 < section().columns.length ? columnTop : top;
                if (!fitsHere && needed + areaOf(notes, undefined, carried) <= bottom - nextTop + TOLERANCE) {
                    nextColumn();
                }
            }
            placeParagraph(paragraph);
        }
        if (carried !== undefined) {
            // The rest of a footnote continued from the last page goes on a page of its own
            startPage();
        }
    } catch (error) {
        if (!(error instanceof Unsupported)) {
            throw error;
        }
        return { bookmarks, pageCount, sectionPageCounts: countsOf(), stoppedAt: error.message };
    }
    // eslint-disable-next-line functional/immutable-data
    lastPages.set(sectionIndex, pageCount);
    return { bookmarks, pageCount, sectionPageCounts: countsOf() };
};
