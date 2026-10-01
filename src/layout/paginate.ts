/**
 * Lays out a document's pages as Word does, to find the page each bookmark starts on.
 *
 * Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller,
 * and in columns, the first column and then the next, with each line broken at the width of the column it is in. The
 * columns on the page before a continuous section break are balanced, as short as what is in them fits in. A section
 * that starts in the next column starts in the next column of the page when the section before has as many columns and
 * one is left, and on a new page otherwise.
 * Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
 * rows break across pages between the lines of their cells, unless they are kept whole, and the table's header rows are
 * repeated at the top of each page and column. The footnotes of each page's lines take room at its bottom, laid out in
 * the section's columns in a section in columns, and one that doesn't fit below its reference continues at the bottom of
 * the next page, or pages, broken as the body is. The endnotes follow the body.
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
import { fitColumns, tableWidths } from "./column-widths";
import { formatNumber } from "./number-format";
import type {
    Block,
    DocumentContent,
    HeadersOrFooters,
    LayoutItem,
    ParagraphBlock,
    Section,
    TableBlock,
    TableCell,
    TableRow,
} from "./read-document";

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

/**
 * The width of a paragraph's lines from each of them on (`from`, by its index): those of the columns they go in, for a
 * paragraph that goes on into a column of another width
 */
type LineWidths = readonly { readonly from: number; readonly width: number }[];

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
 * The lines of paragraphs without page references, by the measurer and widths they were laid out with. They are the same
 * each time the pages are laid out again with the page numbers worked out before.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const laidOutLines = new WeakMap<TextMeasurer, WeakMap<ParagraphBlock, Map<string, readonly LaidOutLine[]>>>();

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

/** A point in a footnote: in its blocks (`block`), before a line of a paragraph or a row of a table (`line`) */
type NotePoint = { readonly block: number; readonly line: number };

/** The rest of a footnote from a point in it, which continues at the bottom of the next page */
type NoteRest = { readonly name: string; readonly from: NotePoint };

/** A part of a footnote: from a point in it, or its start, up to another, or its end */
type NotePart = { readonly name: string; readonly from?: NotePoint; readonly to?: NotePoint };

/** Where the layout was at the start of a block, from which the blocks can be laid out again */
type Snapshot = {
    readonly index: number;
    readonly pageCount: number;
    readonly pageNumber: number;
    readonly top: number;
    readonly pageBottom: number;
    readonly position: number;
    readonly column: number;
    readonly columnTop: number;
    readonly placedInColumn: boolean;
    readonly deepest: number;
    readonly columnBroken: boolean;
    readonly pageNotes: readonly string[];
    readonly noteArea: number;
    readonly notesInColumns: number | undefined;
    readonly filledEnd: number;
    readonly continued: NoteRest | undefined;
    readonly carried: NoteRest | undefined;
    readonly held: readonly string[];
    readonly spaceAfter: number;
    readonly sectionSpaceAfter: number | undefined;
};

/** Thrown to stop laying out at something that can't be laid out yet */
class Unsupported extends Error {}

/** Thrown to stop laying out columns being balanced in a height they don't fit in */
class Overflow extends Error {}

/**
 * Thrown to lay out the columns of a page again when its footnotes take more room than the columns before the one being
 * filled were laid out above (`area`)
 */
class NotesGrew extends Error {
    public constructor(public readonly area: number) {
        super();
    }
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * How many of a paragraph's lines, from one of them, fit in the room left on a page (`fits`), and how many of those go on
 * it (`count`): with widow control, a paragraph's first line isn't left alone at the bottom of a page, nor its last line
 * at the top of the next, and with keepLines, a paragraph that doesn't fit moves to the next page whole. The first lines
 * can need room below them too, for their footnotes, or for the space after a paragraph that ends in a table cell
 * (`roomBelow`, from the number of lines).
 */
const linesThatFit = (
    lines: readonly LaidOutLine[],
    room: number,
    { keepLines, widowControl }: Pick<MeasuredParagraph, "keepLines" | "widowControl">,
    isFirstLine: boolean,
    roomBelow: (count: number) => number = () => 0,
): { readonly fits: number; readonly count: number } => {
    const ends = lines.map((_, line) => sum(lines.slice(0, line + 1).map(({ height }) => height)));
    const fits = ends.findIndex((end, line) => end + roomBelow(line + 1) > room + TOLERANCE);
    return fits === -1
        ? { fits: lines.length, count: lines.length }
        : { fits, count: linesKept(lines.length, fits, { keepLines, widowControl }, isFirstLine) };
};

/** How many of a paragraph's lines (`total`, from one of them) go on a page where some of them fit (`fits`) */
const linesKept = (
    total: number,
    fits: number,
    { keepLines, widowControl }: Pick<MeasuredParagraph, "keepLines" | "widowControl">,
    isFirstLine: boolean,
): number => {
    if (keepLines && isFirstLine) {
        return 0;
    }
    if (!widowControl || total < 2) {
        return fits;
    }
    // Leave at least two lines on the next page, and don't leave the first line alone on this one
    const withoutWidow = total - fits === 1 ? fits - 1 : fits;
    return isFirstLine && withoutWidow === 1 ? 0 : withoutWidow;
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
    const byParagraph = laidOutLines.get(measurer) ?? new WeakMap<ParagraphBlock, Map<string, readonly LaidOutLine[]>>();
    laidOutLines.set(measurer, byParagraph);
    /** A paragraph's lines, broken at a width, or at the width of each line from those given on */
    const linesOf = (paragraph: ParagraphBlock, widths: number | LineWidths): readonly LaidOutLine[] => {
        const given = typeof widths === "number" ? [{ from: 0, width: widths }] : widths;
        const key = given.map(({ from, width }) => `${from}:${width}`).join(" ");
        const layOut = (): readonly LaidOutLine[] =>
            layoutLines(itemsOf(paragraph.items), {
                width: given.length === 1 ? given[0].width : (line) => given.findLast(({ from }) => from <= line)!.width,
                format: paragraph.format,
                tabStops: paragraph.tabStops,
                defaultTabStop,
                markFont: paragraph.markFont,
                measurer,
            });
        if (paragraph.items.some(({ type }) => type === "pageReference" || type === "pageCount")) {
            return layOut();
        }
        const byWidths = byParagraph.get(paragraph) ?? new Map<string, readonly LaidOutLine[]>();
        byParagraph.set(paragraph, byWidths);
        const lines = byWidths.get(key) ?? layOut();
        // eslint-disable-next-line functional/immutable-data
        byWidths.set(key, lines);
        return lines;
    };

    const measureParagraph = (paragraph: ParagraphBlock, width: number, before?: Block, after?: Block): MeasuredParagraph => {
        const { format } = paragraph;
        const lines = linesOf(paragraph, width);
        // With contextual spacing, Word leaves out a paragraph's own share of the space between it and one of the same
        // style next to it: the first's space after, and the part of the second's space before that is more than the
        // first's space after. The other paragraph's share stays, so 200 after a contextual paragraph and 400 before the
        // next leave 200, where LibreOffice leaves 400 (`word-rules.docx` P1, `word-rules2.docx` Q1). With the space after
        // and before added, each paragraph's share is its own
        const contextual = (one: ParagraphBlock, other?: Block): boolean =>
            one.format.contextualSpacing === true && other?.type === "paragraph" && other.style === one.style;
        const spaceBefore = format.spaceBefore ?? 0;
        const shareBefore =
            before?.type === "paragraph" && !before.sectionBreak && contextual(before, paragraph) && !addsParagraphSpacing
                ? Math.max(0, spaceBefore - (before.format.spaceAfter ?? 0))
                : spaceBefore;
        return {
            lines,
            spaceBefore: contextual(paragraph, before) ? 0 : shareBefore,
            spaceAfter: contextual(paragraph, after) ? 0 : (format.spaceAfter ?? 0),
            keepNext: format.keepNext === true,
            keepLines: format.keepLines === true,
            // Word controls widows and orphans unless a paragraph or its style turns it off
            widowControl: format.widowControl !== false,
            pageBreakBefore: format.pageBreakBefore === true,
        };
    };

    const linesHeight = (lines: readonly LaidOutLine[]): number => sum(lines.map(({ height }) => height));

    /** How narrow and how wide the paragraphs and tables in a table cell can be */
    const contentWidths = (stack: readonly Block[]): ContentWidths =>
        stack.reduce<ContentWidths>(
            (widths, block) => {
                const { min, max } =
                    block.type === "table"
                        ? tableWidths(block, contentWidths)
                        : measureContentWidths(itemsOf(block.items), {
                              format: block.format,
                              tabStops: block.tabStops,
                              defaultTabStop,
                              measurer,
                          });
                return { min: Math.max(widths.min, min), max: Math.max(widths.max, max) };
            },
            { min: 0, max: 0 },
        );

    // Tables sized to their text, or with columns widened for long words, by the width they are in
    // eslint-disable-next-line functional/prefer-readonly-type
    const fittedTables = new Map<TableBlock, Map<number, TableBlock>>();
    /**
     * A table as it is laid out in a width: with its columns sized to their text, or widened for words longer than its
     * cells give them, when Word sizes them so. It says why when Word's sizing of it isn't known
     */
    const fitted = (table: TableBlock, width: number): TableBlock => {
        if (!table.fit && !table.widen) {
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
    /** A table sized to be laid out in a width, which stops the layout when Word's sizing of it isn't known */
    const sizedToPlace = (table: TableBlock, width: number): TableBlock => {
        const sized = fitted(table, width);
        if (sized.unsupported) {
            throw new Unsupported(sized.unsupported);
        }
        return sized;
    };

    /** The heights of blocks stacked in a width, with the space before and after each */
    const stackParts = (stack: readonly Block[], width: number): readonly StackPart[] =>
        stack.map((block, index) => {
            if (block.type === "table") {
                return { height: sum(rowHeights(sizedToPlace(block, width))), before: 0, after: 0 };
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

    const cellHeight = (cell: TableCell): number => cell.marginTop + stackHeight(cell.blocks, cell.width) + cell.marginBottom;

    /** The cells merged down several rows of a table: the row each starts in, its last row, and the height its text needs */
    const mergesOf = ({ rows }: TableBlock): readonly { readonly first: number; readonly last: number; readonly height: number }[] =>
        rows.flatMap(({ cells }, first) =>
            cells
                .filter(({ verticalMerge }) => verticalMerge === "restart")
                .map((cell) => {
                    // The rest of the merge is in the same column of the grid, which cells spanning columns can put at another index
                    const span = rows
                        .slice(first + 1)
                        .findIndex((row) => row.cells.find((other) => other.column === cell.column)?.verticalMerge !== "continue");
                    return { first, last: span === -1 ? rows.length - 1 : first + span, height: cellHeight(cell) };
                }),
        );

    /**
     * The height of each row of a table: its tallest cell, with the cell's margins, or the row's own height, and its
     * borders. Cells merged down several rows make the last of them taller when their text needs more room.
     */
    const rowHeights = (table: TableBlock, merges = mergesOf(table)): readonly number[] => {
        const { rows } = table;
        const heights = rows.map(({ cells, height, borderTop, borderBottom }) => {
            const natural = Math.max(0, ...cells.filter(({ verticalMerge }) => verticalMerge === undefined).map(cellHeight));
            const rowHeight = height === undefined ? natural : height.rule === "exact" ? height.value : Math.max(height.value, natural);
            return rowHeight + borderTop + borderBottom;
        });
        return merges.reduce((current, { first, last, height }) => {
            const missing = height - sum(current.slice(first, last + 1));
            return missing > 0 && rows[last].height?.rule !== "exact"
                ? current.map((value, index) => (index === last ? value + missing : value))
                : current;
        }, heights);
    };

    const markersOf = (block: Block): readonly string[] =>
        block.type === "paragraph"
            ? block.items.flatMap((item) => (item.type === "marker" ? [item.name] : []))
            : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));

    // The state of the page being filled
    const bookmarks = new Map<string, string>();
    // The page each bookmark was placed on, counted from the first
    const markedOn = new Map<string, number>();
    // The height of each header and footer, by the section it is in, whose number of pages it can show
    // eslint-disable-next-line functional/prefer-readonly-type
    const headerHeights = new Map<readonly Block[], Map<number, number>>();
    let pageCount = 0;
    let pageNumber = 0;
    // The first and last page of each section, and the sections whose pages aren't theirs alone
    const firstPages = new Map<number, number>([[0, 1]]);
    const lastPages = new Map<number, number>();
    const sharingPages = new Set<number>();
    // Where the page's body starts and ends, where its columns end, and where the next line goes, in points from the top
    // of the page
    let top = 0;
    let pageBottom = 0;
    let bottom = 0;
    let position = 0;
    // The column being filled, from the first, and where the page's columns start, below what is above them on the page
    let column = 0;
    let columnTop = 0;
    // Whether anything is in the column yet: on the page, for a page of one column
    let placedInColumn = false;
    // The bottom of the lowest of the columns before the one being filled, with the space after its last paragraph when it
    // ends with one, and whether a column break started one
    let deepest = 0;
    let columnBroken = false;
    // The page whose columns are being balanced, and the height they are being laid out in
    let balancing: { readonly page: number; readonly height: number } | undefined;
    // The footnotes at the bottom of the page, by their markers, and the room they take with their separator, which every
    // column of the page ends above
    let pageNotes: readonly string[] = [];
    let noteArea = 0;
    // The section in columns whose columns the page's footnotes are laid out in, when its footnote is the page's first,
    // and where the lines of the columns of the page before the one being filled end, the lowest of them
    let notesInColumns: number | undefined;
    let filledEnd = 0;
    // The room kept at the bottom of pages for their footnotes, by the number of the page, counted from the first, when
    // their columns are laid out again for footnotes referred to from a later column
    const reserves = new Map<number, number>();
    // The rest of a footnote continued from the page before, above the page's own, and of one continued on the next page
    let continued: NoteRest | undefined;
    let carried: NoteRest | undefined;
    // The footnotes of the lines of a paragraph kept with the next, which go below the next's lines
    let held: readonly string[] = [];
    // The space after the last paragraph, which goes before what is next on the page
    let spaceAfter = 0;
    // Until something of the section is placed, the space after the paragraph before it, or 0 at the start of the
    // document. The space before the section's first paragraph isn't left out at the top of a page, or of the column the
    // section starts in, but only as much of it as is more than this goes there
    let sectionSpaceAfter: number | undefined = 0;
    // The column the section starts in: the first, unless it starts in the next column
    let sectionColumn = 0;

    /** Whether nothing of the section is placed yet, in the column it starts in or the first of a page */
    const atSectionStart = (): boolean => sectionSpaceAfter !== undefined && (column === 0 || column === sectionColumn);

    /**
     * The space above a paragraph with this space before, below what is above it. At the start of a section, that is only
     * as much of it as is more than the space after the section's last paragraph. When that is the empty paragraph that
     * ends the section, its space after isn't on the page itself, in Word: 0 after the section's last line, 200 after the
     * empty paragraph and 0 before leave none (`word-rules2.docx` Q6b and Q7b, `word-contextual.docx` X1). When it is a
     * paragraph of text, its space after is still to come, and the larger of the two goes there, as between any two
     */
    const spaceAboveOf = (spaceBefore: number): number =>
        atSectionStart() ? spaceAfter + between(sectionSpaceAfter!, spaceBefore) - sectionSpaceAfter! : between(spaceAfter, spaceBefore);

    /** Where the layout is at the start of a block, to lay out the blocks from it again */
    const snapshot = (index: number): Snapshot => ({
        index,
        pageCount,
        pageNumber,
        top,
        pageBottom,
        position,
        column,
        columnTop,
        placedInColumn,
        deepest,
        columnBroken,
        pageNotes,
        noteArea,
        notesInColumns,
        filledEnd,
        continued,
        carried,
        held,
        spaceAfter,
        sectionSpaceAfter,
    });
    // Where the block being laid out started, and where the block started whose text the page's columns start with
    let blockStart: Snapshot | undefined;
    let columnsStart: Snapshot | undefined;

    /** The bottom of the page's columns: the page's, or less when they are being balanced */
    const columnsBottom = (): number => (balancing?.page === pageCount ? Math.min(pageBottom, columnTop + balancing.height) : pageBottom);

    /**
     * Goes back to where the layout was at the start of a block. The bookmarks placed since are kept, as laying the blocks
     * out again only moves them between the columns of the same page
     */
    const restore = (state: Snapshot): void => {
        ({
            pageCount,
            pageNumber,
            top,
            pageBottom,
            position,
            column,
            columnTop,
            placedInColumn,
            deepest,
            columnBroken,
            pageNotes,
            noteArea,
            notesInColumns,
            filledEnd,
            continued,
            carried,
            held,
            spaceAfter,
            sectionSpaceAfter,
        } = state);
        bottom = columnsBottom();
        noteArea = Math.max(noteArea, reserved());
    };

    /** Stops laying out columns being balanced where they are too short for what has to go at the top of one */
    const stopIfBalancing = (): void => {
        if (balancing?.page === pageCount) {
            throw new Overflow();
        }
    };

    /**
     * Stops at something on the page that Word might lay out differently, without its bookmarks, as Word might put some
     * of them on the next page
     */
    const stopOnPage = (reason: string): never => {
        for (const [name, page] of markedOn) {
            if (page === pageCount) {
                // eslint-disable-next-line functional/immutable-data
                bookmarks.delete(name);
            }
        }
        throw new Unsupported(reason);
    };

    const section = (): Section => sections[sectionIndex];
    /** The width of the text across the page, as its headers, footers and footnotes are, unless those are in columns */
    const textWidth = (current = section()): number => current.pageWidth - current.marginLeft - current.marginRight - current.gutter;

    /**
     * The columns the page's footnotes are laid out in, when they are in columns: those of the section of its first
     * footnote, as Word lays them out, or of the section being laid out until it has one. Those of a page whose first
     * footnote is referred to from text across it are across it, whatever the columns of those after
     * (`word-footnotes-in-columns.docx` N8)
     */
    const noteColumns = (): readonly number[] | undefined => {
        const first = pageNotes.length > 0 || continued !== undefined ? notesInColumns : sectionIndex;
        return first !== undefined && sections[first].columns.length > 1 ? sections[first].columns : undefined;
    };
    /** The width the page's footnotes are laid out in */
    const noteWidth = (): number => noteColumns()?.[0] ?? textWidth();
    /** The room kept at the bottom of the page for its footnotes, when its columns were laid out again for them */
    const reserved = (): number => reserves.get(pageCount) ?? 0;

    /**
     * How far down the column being filled its lines go: to the footnotes at the bottom of the page, with more that take
     * this much more room (`more`), or the bottom of columns being balanced, which are above them
     */
    const linesBottom = (more = 0): number => Math.min(bottom, pageBottom - noteArea - more);
    /** How much higher the lines of the column being filled end for more footnotes that take this much more room */
    const noteCost = (more: number): number => linesBottom() - linesBottom(more);

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
        if (balancing !== undefined && pageCount >= balancing.page) {
            // The columns being balanced don't fit on their page in the height they are laid out in
            throw new Overflow();
        }
        checkReserve();
        const current = section();
        pageNumber = isFirstOfSection && current.firstNumber !== undefined ? current.firstNumber : pageNumber + 1;
        // A header or footer taller than the margin pushes the body away from it, unless the margin is negative
        const headerBottom = current.header + partHeight(current.headers, isFirstOfSection);
        const footerTop = current.footer + partHeight(current.footers, isFirstOfSection);
        pageCount++;
        top = current.marginTop < 0 ? -current.marginTop : Math.max(current.marginTop, headerBottom);
        pageBottom = current.pageHeight - (current.marginBottom < 0 ? -current.marginBottom : Math.max(current.marginBottom, footerTop));
        position = top;
        column = 0;
        columnTop = top;
        bottom = columnsBottom();
        placedInColumn = false;
        deepest = 0;
        columnBroken = false;
        columnsStart = blockStart;
        spaceAfter = 0;
        pageNotes = [];
        notesInColumns = undefined;
        filledEnd = 0;
        continued = carried;
        carried = undefined;
        noteArea = Math.max(areaOf([], undefined, continued), reserved());
        if (continued !== undefined && current.columns.length > 1) {
            throw new Unsupported("a footnote across pages in columns");
        }
        if (continued !== undefined && noteArea > bottom - top + TOLERANCE) {
            // The rest of the footnote is longer than the page, so the page is all footnote, as much of it as fits, and the
            // rest continues on the next page. The text goes on above its last part, on the page it ends on
            // (`word-probes.docx` U2o, U2q)
            if (isFirstOfSection) {
                // Which section Word puts its pages in, which can change the page numbers, isn't known
                throw new Unsupported("a footnote continued across a section break onto a page of its own");
            }
            const { name, from } = continued;
            const to = fillNote(name, from, (point) => areaOf([], undefined, { name, from, to: point }) <= bottom - top + TOLERANCE);
            if (to.block === from.block && to.line === from.line) {
                throw new Unsupported("a footnote line taller than a page");
            }
            carried = { name, from: to };
            startPage();
        }
    };

    /** Moves to the top of the next column, or of the next page after the last column */
    const nextColumn = (): void => {
        if (column + 1 >= section().columns.length) {
            startPage();
            return;
        }
        deepest = Math.max(deepest, position + spaceAfter);
        filledEnd = Math.max(filledEnd, position);
        column++;
        position = columnTop;
        placedInColumn = false;
        spaceAfter = 0;
    };

    /** Whether a section starts on the page the section before it ends on: a continuous one, on pages of the same size */
    const continuesOnPage = (previous: Section, current: Section): boolean =>
        current.start === "continuous" && previous.pageWidth === current.pageWidth && previous.pageHeight === current.pageHeight;

    /**
     * Whether a section starts in the next column of the page the section before it ends on, as Word starts one that
     * starts in the next column when the section before has as many columns, on pages of the same size, and one is left
     * after the column it ends in (`word-rules2.docx` Q5a, `word-next-column.docx` N4 and N5). Otherwise it starts on a
     * new page: after 2 columns into 3, 3 into 2, 1 into 2, or the last column started (Q5b to Q5d, N3)
     */
    const startsInNextColumn = (previous: Section, current: Section): boolean =>
        current.start === "nextColumn" &&
        previous.pageWidth === current.pageWidth &&
        previous.pageHeight === current.pageHeight &&
        previous.columns.length === current.columns.length &&
        column + 1 < current.columns.length;

    /** Whether the columns on the page start with a section that started in the next column */
    const startedInColumn = (): boolean => columnsStart!.pageCount === pageCount && columnsStart!.column > 0;

    /**
     * Ends the columns on the page before a continuous section break, as Word does. Unless a column break is in them, they
     * are balanced: what is in them, up to the section's next block (`end`), is laid out again in the shortest columns it
     * fits in, filled from the first, which halving the height tried finds. Nor are they when a section in them started
     * in the next column, which Word leaves as they are (`word-next-column.docx` N6). The next section starts below the
     * lowest of the columns and the space after the paragraph each ends with, and its space before is only as much as is
     * more than the space after the section's last paragraph: the empty one that ends it, when there is one, whose space
     * after is not below the columns itself (`word-rules2.docx` Q7b). Their footnotes stay at the bottom of the page, in
     * their columns, below what follows (`word-rules2.docx` Q6b, `word-footnotes-in-columns.docx` N6).
     */
    const endColumns = (end: number): void => {
        if (!columnBroken && !startedInColumn()) {
            balanceColumns(end);
        }
        position = Math.max(deepest, position + spaceAfter) - spaceAfter;
    };

    const balanceColumns = (end: number): void => {
        const from = columnsStart!;
        const page = pageCount;
        // The empty paragraph that ends the section after a table isn't evened out with the rest. Word puts its line below
        // the last column, so 20 rows go 10 and 10 with it below the second (`word-header-columns.docx` H1 and H8)
        const balanced = endsAfterTable(end - 1) ? end - 1 : end;
        const layOut = (height: number): void => {
            balancing = { page, height };
            restore(from);
            placeBlocks(from.index, balanced);
        };
        const fitsIn = (height: number): boolean => {
            try {
                layOut(height);
                return true;
            } catch (error) {
                if (error instanceof Overflow) {
                    return false;
                }
                throw error;
            }
        };
        let short = 0;
        let tall = pageBottom - columnTop;
        while (tall - short > TOLERANCE) {
            const middle = (short + tall) / 2;
            if (fitsIn(middle)) {
                tall = middle;
            } else {
                short = middle;
            }
        }
        layOut(tall);
        balancing = undefined;
        bottom = pageBottom;
        placeBlocks(balanced, end);
    };

    /**
     * Starts a section, from its first block (`firstBlock`): on a new page, or below what is on the page for a continuous
     * one, after the columns before it are ended
     */
    const startSection = (index: number, firstBlock: number): void => {
        const previous = section();
        const current = sections[index];
        // eslint-disable-next-line functional/immutable-data
        lastPages.set(sectionIndex, pageCount);
        // A section with no paragraphs of its own, which isn't laid out
        for (let skipped = sectionIndex + 1; skipped < index; skipped++) {
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(skipped);
        }
        if (current.unsupported) {
            throw new Unsupported(current.unsupported);
        }
        const continuous = continuesOnPage(previous, current);
        if (continuous && previous.columns.length > 1 && (placedInColumn || column > 0)) {
            if (startedInColumn() && columnsStart!.column < previous.columns.length - 1) {
                // Word leaves a section that started in the next column as it is in the last column, but whether it
                // evens it out across the columns after it isn't known
                throw new Unsupported("columns evened out after a section that starts in the next column");
            }
            endColumns(firstBlock);
        }
        const inNextColumn = startsInNextColumn(previous, current);
        if (inNextColumn && previous.columns.some((width, at) => width !== current.columns[at])) {
            // Word starts it in the next column of the page's columns, but which width its lines are broken at isn't known
            throw new Unsupported("a section that starts in the next column of columns of other widths");
        }
        // The columns of the page before one that starts in the next column end above its footnotes too
        filledEnd = inNextColumn ? Math.max(filledEnd, position) : 0;
        // The space after the empty paragraph that ends the section, when there is one, which isn't on the page itself
        const end = blocks[firstBlock - 1].block;
        sectionSpaceAfter = end.type === "paragraph" && end.sectionBreak ? (end.format.spaceAfter ?? 0) : spaceAfter;
        sectionColumn = 0;
        const before = sectionIndex;
        sectionIndex = index;
        if (continuous) {
            // The section's columns start below what is on the page
            column = 0;
            columnTop = position;
            // eslint-disable-next-line functional/immutable-data
            firstPages.set(index, pageCount);
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(before).add(index);
            return;
        }
        if (inNextColumn) {
            // The columns before it aren't evened out, and it starts at the top of the next column (`word-rules2.docx` Q5a),
            // of columns below what is on the page too (`word-next-column.docx` N6). The space after the empty paragraph
            // that ends the section before isn't kept below its column (N6), but its space before is kept as it is at the
            // top of a page (N1 and N2)
            deepest = Math.max(deepest, position);
            column++;
            sectionColumn = column;
            position = columnTop;
            placedInColumn = false;
            spaceAfter = 0;
            // eslint-disable-next-line functional/immutable-data
            firstPages.set(index, pageCount);
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(before).add(index);
            return;
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
     * The height of the tallest of the columns footnotes are laid out in when they fit in columns of a height, or
     * undefined when they don't: one paragraph after the other from the first column, breaking between lines as widow
     * control and keepLines let them, below the separator at the top of each (`separator`, with the space after it,
     * `separatorAfter`)
     */
    const fillNoteColumns = (
        paragraphs: readonly MeasuredParagraph[],
        count: number,
        separator: number,
        separatorAfter: number | undefined,
        height: number,
    ): number | undefined => {
        let noteColumn = 0;
        let used = separator;
        let above = separatorAfter;
        let tallest = separator;
        for (const paragraph of paragraphs) {
            let from = 0;
            while (from < paragraph.lines.length) {
                const space = above === undefined ? 0 : between(above, from === 0 ? paragraph.spaceBefore : 0);
                const rest = paragraph.lines.slice(from);
                const placed = linesThatFit(rest, height - used - space, paragraph, from === 0).count;
                used += placed > 0 ? space + linesHeight(rest.slice(0, placed)) : 0;
                tallest = Math.max(tallest, used);
                from += placed;
                if (from < paragraph.lines.length) {
                    noteColumn++;
                    if (noteColumn >= count) {
                        return undefined;
                    }
                    used = separator;
                    above = separatorAfter;
                }
            }
            above = paragraph.spaceAfter;
        }
        return tallest;
    };

    /** The blocks of a part of a footnote, each with the first of its lines or rows in the part, and the one after the last */
    const piecesOf = ({
        name,
        from = { block: 0, line: 0 },
        to,
    }: NotePart): readonly { readonly block: Block; readonly start: number; readonly end?: number }[] =>
        footnotes.get(name)!.flatMap((block, index) =>
            index < from.block || (to !== undefined && (index > to.block || (index === to.block && to.line === 0)))
                ? []
                : [
                      {
                          block,
                          start: index === from.block ? from.line : 0,
                          end: to !== undefined && index === to.block ? to.line : undefined,
                      },
                  ],
        );

    /**
     * The room footnotes take at the bottom of the page: the separator's line above them, the rest of a footnote
     * continued from the page before (`from`), their blocks, and the first part of one continued on the next page
     * (`split`), without the space before the first or after the last, as LibreOffice lays them out. In columns
     * (`columns`), Word lays them out in the columns, one after the other from the first, with the separator at the top of
     * each, and evens them out, as it evens out columns before a continuous section break: the room is the tallest, in the
     * shortest height they fit in (`word-footnotes-in-columns.docx` N2, N4 and N9)
     */
    const areaOf = (notes: readonly string[], split: NotePart | undefined, from: NotePart | undefined, columns = noteColumns()): number => {
        if (notes.length === 0 && split === undefined && from === undefined) {
            return 0;
        }
        const separator = from === undefined ? footnoteSeparator : footnoteContinuationSeparator;
        const pieces = [
            ...separator.map((block) => ({ block, start: 0, end: undefined })),
            ...(from === undefined ? [] : piecesOf(from)),
            ...notes.flatMap((name) => piecesOf({ name })),
            ...(split === undefined ? [] : piecesOf(split)),
        ];
        const unsupported = pieces.find(({ block }) => block.unsupported !== undefined)?.block.unsupported;
        if (unsupported) {
            throw new Unsupported(unsupported);
        }
        if (columns?.some((columnWidth) => columnWidth !== columns[0])) {
            // Word has only been seen to lay out footnotes in columns of the same width
            stopOnPage("footnotes in columns of different widths");
        }
        const width = columns?.[0] ?? textWidth();
        /** A piece's paragraph, with only its lines in the piece, or its table's rows as a line that doesn't break */
        const measured = ({ block, start, end }: (typeof pieces)[number], index: number): MeasuredParagraph => {
            if (block.type === "table") {
                return { ...UNBROKEN, lines: [{ height: sum(rowHeights(sizedToPlace(block, width)).slice(start, end)), markers: [] }] };
            }
            const paragraph = measureParagraph(block, width, pieces[index - 1]?.block, pieces[index + 1]?.block);
            return { ...paragraph, lines: paragraph.lines.slice(start, end) };
        };
        // The lines continued from the page before have no space before them
        const parts = pieces.map((piece, index): StackPart => {
            const { lines, spaceBefore, spaceAfter: after } = measured(piece, index);
            return { height: linesHeight(lines), before: from !== undefined && index === separator.length ? 0 : spaceBefore, after };
        });
        if (columns !== undefined) {
            // The rest of a footnote continued from the page before isn't laid out in columns: the layout stops there
            const separatorParts = parts.slice(0, separator.length);
            const paragraphs = pieces.slice(separator.length).map((piece, index) => measured(piece, separator.length + index));
            const separatorHeight = heightOf(separatorParts, false);
            const separatorAfter = separatorParts[separatorParts.length - 1]?.after;
            const fill = (height: number): number | undefined =>
                fillNoteColumns(paragraphs, columns.length, separatorHeight, separatorAfter, height);
            let short = separatorHeight;
            let tall = fill(Infinity)!;
            while (tall - short > TOLERANCE) {
                const middle = (short + tall) / 2;
                if (fill(middle) === undefined) {
                    short = middle;
                } else {
                    tall = middle;
                }
            }
            return fill(tall)!;
        }
        return heightOf(parts, false);
    };

    const notesIn = (markers: readonly string[]): readonly string[] => markers.filter((name) => footnotes.has(name));

    /** The room footnotes take at the bottom of the page, or the room kept for them there, when that is more */
    const pageArea = (notes: readonly string[], split?: NotePart): number => Math.max(reserved(), areaOf(notes, split, continued));

    /**
     * The room footnotes take below those on the page already. It stops at one referred to from another section than
     * the page's first, when that is in columns, which Word hasn't been seen to lay out
     */
    const moreNoteRoom = (notes: readonly string[]): number => {
        if (notes.length === 0) {
            return 0;
        }
        if (notesInColumns !== undefined && notesInColumns !== sectionIndex) {
            stopOnPage("a footnote on a page whose footnotes are in another section's columns");
        }
        return pageArea([...pageNotes, ...notes]) - noteArea;
    };

    /**
     * Puts footnotes at the bottom of the page. Every column of the page ends above them, whichever it is they are
     * referred to from, as in Word (`word-footnotes-in-columns.docx` N1 and N3), so the columns before the one being
     * filled are laid out again when they go down further than these leave room for
     */
    const addNotes = (notes: readonly string[]): void => {
        if (notes.length > 0) {
            if (pageNotes.length === 0 && continued === undefined && section().columns.length > 1) {
                notesInColumns = sectionIndex;
            }
            pageNotes = [...pageNotes, ...notes];
            noteArea = pageArea(pageNotes);
            // Only when they take more room than was kept for them, as a line that doesn't fit in a column at all can still
            // go down further
            if (noteArea > reserved() + TOLERANCE && filledEnd > pageBottom - noteArea + TOLERANCE) {
                if (startedInColumn()) {
                    // The columns before it are the section before's, which aren't laid out again, and what Word does
                    // with them isn't known
                    stopOnPage("a footnote in a section that starts in the next column, below a longer column");
                }
                throw new NotesGrew(noteArea);
            }
        }
    };

    /**
     * Stops at a page whose columns were laid out again to leave room for footnotes that moved a reference to one of
     * them on to the next page, so the room left is more than the footnotes on the page take: what Word does then isn't
     * known
     */
    const checkReserve = (): void => {
        if (reserved() > areaOf(pageNotes, undefined, continued) + TOLERANCE) {
            stopOnPage("a footnote in columns that moves its reference to the next page");
        }
    };

    /**
     * Whether a table row could break across pages between the lines of its cells: one not kept whole, with more than a
     * line in a cell
     */
    const canSplit = (row: TableRow): boolean =>
        !row.cantSplit &&
        row.height?.rule !== "exact" &&
        row.cells.some(
            ({ blocks: stack, width }) =>
                stack.length > 1 || stack.some((block) => block.type === "table" || linesOf(block, width).length > 1),
        );

    /**
     * Where the least of a footnote that goes on a page with its reference ends, when the rest of it can continue on the
     * next page, as Word continues it: the first lines of its first paragraph that can't be left alone at the bottom of a
     * page, 2 with widow control, or all of a paragraph of 3 lines or fewer, or 1 without it, or the first row of a table
     * (`word-probes.docx` U2a to U2h). Undefined when that is all of it. In columns, where how Word continues a footnote
     * hasn't been seen, a line that fits with it stops when its footnote is placed
     */
    const leastPart = (name: string): NotePoint | undefined => {
        const note = footnotes.get(name)!;
        const [first] = note;
        if (first === undefined) {
            return undefined;
        }
        if (first.type === "table") {
            const { rows } = fitted(first, noteWidth());
            // Whether Word breaks a row of more than a line in a footnote isn't known, so the row needs no room, and the
            // layout stops when it doesn't fit
            const firstRows = rows.slice(0, 1).some(canSplit) ? 0 : 1;
            return note.length === 1 && firstRows >= rows.length ? undefined : { block: 0, line: firstRows };
        }
        const { lines, widowControl } = measureParagraph(first, noteWidth());
        const count = !widowControl ? 1 : lines.length <= 3 ? lines.length : 2;
        return note.length === 1 && count === lines.length ? undefined : { block: 0, line: count };
    };

    /**
     * The room footnotes take at the bottom of a page, below the rest of one continued from the page before (`from`),
     * with the last continued on the next page after the least of it that can go on this one, when it can be
     */
    const leastAreaOf = (notes: readonly string[], from: NotePart | undefined, columns = noteColumns()): number => {
        const name = notes[notes.length - 1];
        const to = name === undefined ? undefined : leastPart(name);
        return to === undefined ? areaOf(notes, undefined, from, columns) : areaOf(notes.slice(0, -1), { name, to }, from, columns);
    };

    /**
     * The least room footnotes take below those on the page: all of them, but the last only as far as it has to go on the
     * page, when it can continue on the next
     */
    const leastNoteRoom = (notes: readonly string[]): number => {
        const room = moreNoteRoom(notes);
        return notes.length === 0 ? room : Math.max(reserved(), leastAreaOf([...pageNotes, ...notes], continued)) - noteArea;
    };

    /**
     * Where the part of a footnote on a page ends, from where it starts (`from`), when not all of it fits (`fits`, up to
     * a point): after as many of its lines and table rows as fit, less those its paragraphs' widow and orphan control
     * hold back, as the body's are, so it breaks between its paragraphs and rows, or in a paragraph with 2 lines or more
     * on each page (`word-probes.docx` U2a to U2h). Whether Word keeps a footnote's paragraph together or with the next
     * across pages, or breaks a row of more than a line or repeats header rows in one, isn't known, so it stops there.
     */
    const fillNote = (name: string, from: NotePoint, fits: (to: NotePoint) => boolean): NotePoint => {
        const note = footnotes.get(name)!;
        const width = noteWidth();
        // The first line or row of the part that doesn't fit, which there is, as all of it doesn't
        const { block: index, line } = note
            .flatMap((part, at) =>
                Array.from({ length: part.type === "table" ? part.rows.length : linesOf(part, width).length }, (_, unit) => ({
                    block: at,
                    line: unit,
                })),
            )
            .filter((point) => point.block > from.block || (point.block === from.block && point.line >= from.line))
            .find((point) => !fits({ block: point.block, line: point.line + 1 }))!;
        const block = note[index];
        const previous = note[index - 1];
        /** The point the part ends at, before a line or row of the block */
        const breakBefore = (at: number): NotePoint => {
            if (at === 0 && index > from.block && previous.type === "paragraph" && previous.format.keepNext === true) {
                throw new Unsupported("a paragraph kept together or with the next in a footnote across pages");
            }
            return { block: index, line: at };
        };
        if (block.type === "table") {
            if (canSplit(fitted(block, width).rows[line])) {
                throw new Unsupported("a table row of more than one line in a footnote across pages");
            }
            if (line > 0 && block.rows[0].header) {
                throw new Unsupported("a table's header rows in a footnote across pages");
            }
            return breakBefore(line);
        }
        const begin = index === from.block ? from.line : 0;
        const { lines, widowControl, keepLines } = measureParagraph(block, width);
        const count = linesKept(lines.length - begin, line - begin, { keepLines: false, widowControl }, begin === 0);
        if (keepLines && count > 0) {
            throw new Unsupported("a paragraph kept together or with the next in a footnote across pages");
        }
        return breakBefore(begin + count);
    };

    /**
     * Puts the footnotes of the lines placed at the bottom of the page: all of them, or where they don't fit, the last as
     * far as it fits below the others, as the body's blocks fill a page, with the rest of it continued at the bottom of the
     * next page, as Word continues it. The footnote takes the rest of the page then, so what follows goes on the next. How
     * Word continues one in columns hasn't been seen.
     */
    const placeNotes = (notes: readonly string[]): void => {
        if (notes.length === 0 || position <= linesBottom(moreNoteRoom(notes)) + TOLERANCE) {
            addNotes(notes);
            return;
        }
        if (section().columns.length > 1) {
            stopOnPage("a footnote across pages in columns");
        }
        const whole = [...pageNotes, ...notes.slice(0, -1)];
        const name = notes[notes.length - 1];
        const to = fillNote(
            name,
            { block: 0, line: 0 },
            (point) => areaOf(whole, { name, to: point }, continued) <= bottom - position + TOLERANCE,
        );
        pageNotes = [...whole, name];
        noteArea = bottom - position;
        carried = { name, from: to };
    };

    /**
     * Stops where a line in columns fits without its footnotes (`notes`), which don't fit below it (`below`, less those of
     * the lines before, `before`), and part of one would: how Word continues a footnote in columns hasn't been seen. When
     * none of it would, the line goes on in the next column or on the next page with it
     */
    const stopAtPartOfFootnote = (before: readonly string[], notes: readonly string[], below: number): void => {
        const index = notes.findIndex((_, note) => noteCost(moreNoteRoom([...before, ...notes.slice(0, note + 1)])) > below + TOLERANCE);
        const name = notes[index];
        if (name === undefined || footnotes.get(name)!.length === 0) {
            // The line has no footnotes that don't fit, but those of the lines before, or an empty one
            return;
        }
        const firstLine = { name, to: { block: 0, line: 1 } };
        if (noteCost(pageArea([...pageNotes, ...before, ...notes.slice(0, index)], firstLine) - noteArea) <= below + TOLERANCE) {
            stopOnPage("a footnote across pages in columns");
        }
    };

    /** Whether a footnote could continue on the next page: one of more than a line */
    const canBreak = (name: string): boolean => {
        const [first, ...rest] = footnotes.get(name)!;
        return rest.length > 0 || first?.type === "table" || (first !== undefined && measureParagraph(first, noteWidth()).lines.length > 1);
    };

    const mark = (names: readonly string[]): void => {
        const text = formatNumber(pageNumber, section().numberFormat)!;
        for (const name of names) {
            if (!bookmarks.has(name) && !footnotes.has(name)) {
                // eslint-disable-next-line functional/immutable-data
                bookmarks.set(name, text);
                // eslint-disable-next-line functional/immutable-data
                markedOn.set(name, pageCount);
            }
        }
    };

    /** The lines from one (`from`) up to the next that ends with a page or column break, or to the paragraph's end */
    const linesToBreak = (lines: readonly LaidOutLine[], from: number): readonly LaidOutLine[] => {
        const end = lines.findIndex((line, index) => index >= from && line.breakAfter !== undefined);
        return lines.slice(from, end === -1 ? lines.length : end + 1);
    };

    /**
     * Places a paragraph's lines, breaking pages and columns between them where they don't fit, and at its page and
     * column breaks. Its lines are broken at the width of the column each goes in, so the part of it that goes on into a
     * column of another width is broken again there, as Word breaks it (`word-rules2.docx` Q7). A paragraph's first or
     * last line isn't left alone on a page with widow control, and its lines stay together with keepLines. Widow control
     * counts the lines left for the next column as they are broken in this one, as Word counts them, so the rest can still
     * go on one line of a wider column, where LibreOffice moves more lines on (`word-column-widths.docx` R1 to R4). The
     * space before a paragraph at the top of a page is left out, unless it is the first of the document or of its
     * section. Its footnotes go at the bottom of the page below its lines, unless they are held back to go below the
     * lines of the next paragraph (`holdNotes`).
     */
    const placeParagraph = (block: ParagraphBlock, paragraph: MeasuredParagraph, keptWithPrevious: boolean, holdNotes: boolean): void => {
        // The first paragraph of a section keeps its space before at the top of the new page, less the empty paragraph's
        // space after, as it does without the break: 1440 before after 200 is 1240 in Word, at the start of a section on a
        // new page, which is already new (word-rules2.docx Q2c), or of a continuous one (word-probes.docx U7a). Any other
        // paragraph's is left out below the page break, as it is below one in the text
        if (paragraph.pageBreakBefore && (placedInColumn || column > 0)) {
            startPage();
        }
        const { columns } = section();
        /** Whether its lines up to its first break are taller than a column, at a column's width */
        const tallerThanColumn = (width: number): boolean =>
            linesHeight(linesToBreak(linesOf(block, width), 0)) > pageBottom - top + TOLERANCE;
        const keptTall = paragraph.keepLines && columns.length > 1 && columns.some(tallerThanColumn);
        if (keptTall && columns.some((width) => width !== columns[0])) {
            // Word lays one out down the first column of each page, in columns of the same width, but whether it does in
            // columns of different widths, and which width it is too tall at, isn't known
            throw new Unsupported("a paragraph kept together taller than a column, in columns of different widths");
        }
        // A paragraph kept together that is taller than a column goes down only the first column of each page, in Word,
        // from the top of a new page unless it is at the top of this one. What follows it goes on below it in that column
        // and into the next, so the other columns of the pages before are left empty. LibreOffice breaks it across them all
        if (keptTall && (column > 0 || position > top + TOLERANCE)) {
            if (keptWithPrevious) {
                // Moving it would leave the paragraph kept with it behind, and what Word does then isn't known
                throw new Unsupported("a paragraph kept with the next before a paragraph kept together taller than a column");
            }
            startPage();
        }
        // The lines that go down only the first column of each page: those up to its first break, when it is kept together
        const firstColumnsOnly = keptTall ? linesToBreak(linesOf(block, columns[0]), 0).length : 0;
        /**
         * The space above the paragraph's first line: at the top of a page, or of the column its section starts in, only
         * the first of a section has any
         */
        const spaceAbove = (): number => (placedInColumn || atSectionStart() ? spaceAboveOf(paragraph.spaceBefore) : 0);
        // The width of its lines from each of them on: those of the columns they go in
        let widths: LineWidths = [];
        /** The widths with the lines from one (`from`) on at the width of a column, broken again there when it is another */
        const widthsFrom = (from: number, width: number): LineWidths =>
            widths.findLast((given) => given.from <= from)?.width === width
                ? widths
                : [...widths.filter((given) => given.from < from), { from, width }];
        // The first of its lines not yet placed
        let index = 0;
        for (;;) {
            widths = widthsFrom(index, section().columns[column]);
            const lines = linesOf(block, widths);
            const remaining = linesToBreak(lines, index);
            const isFirstLine = index === 0;
            const space = isFirstLine ? spaceAbove() : 0;
            // The footnotes of the lines up to one, after those held back from the paragraph kept with this one
            const heldNotes = held;
            const notesOf = (upTo: number): readonly string[] => [
                ...heldNotes,
                ...notesIn(remaining.slice(0, upTo).flatMap(({ markers }) => markers)),
            ];
            const room = linesBottom() - position - space;
            // The lines fit when their footnotes do, with the last continued on the next page when it can be. Widow control
            // and keepLines hold lines back from those, and the footnotes continue below the lines left on the page, as in
            // Word (`word-probes.docx` U2j, U2k)
            const { fits, count: kept } = linesThatFit(remaining, room, paragraph, isFirstLine, (upTo) =>
                noteCost(leastNoteRoom(notesOf(upTo))),
            );
            if (section().columns.length > 1 && linesThatFit(remaining, room, paragraph, isFirstLine).fits > fits) {
                // A line in columns that fits, but not with its footnotes, moves with them, unless part of one would fit
                const above = room - linesHeight(remaining.slice(0, fits));
                stopAtPartOfFootnote(notesOf(fits), notesIn(remaining[fits].markers), above - remaining[fits].height);
            }
            let count = kept;
            // Nothing fits on an empty page, so as much as fits goes on it, and at least a line, unless the end of a
            // footnote continued from the page before is on it, which leaves the next page for them
            if (count === 0 && !placedInColumn && continued === undefined) {
                if (fits === 0 && notesOf(1).length > 0) {
                    // In columns being balanced, which were laid out at their full height before, it's their height
                    stopIfBalancing();
                    throw new Unsupported("a line and its footnote taller than a page");
                }
                // Columns being balanced are too short for lines that would go at the top of a column as tall as the page's
                if (linesThatFit(remaining, pageBottom - noteArea - position - space, paragraph, isFirstLine).count > 0) {
                    stopIfBalancing();
                }
                count = Math.max(1, fits);
            }
            if (count > 0) {
                position += space;
                for (const line of remaining.slice(0, count)) {
                    mark(line.markers);
                    position += line.height;
                }
                // The space after the paragraph before is above these lines now, and this one's comes at its end
                spaceAfter = 0;
                const notes = notesOf(count);
                if (holdNotes && index + count === lines.length) {
                    // They go below the lines of the paragraph this one is kept with
                    held = notes;
                } else {
                    held = [];
                    placeNotes(notes);
                }
                placedInColumn = true;
                index += count;
            }
            // What is after a break goes on in the next column or on a new page, as the rest does when it doesn't fit
            const breakAfter = count === remaining.length ? remaining[count - 1].breakAfter : undefined;
            if (breakAfter === "column") {
                columnBroken = true;
                nextColumn();
            } else if (breakAfter === "page" || index < firstColumnsOnly) {
                startPage();
            } else if (index < lines.length) {
                nextColumn();
            }
            if (index === lines.length) {
                break;
            }
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
            // Widow control and keepLines hold lines back in a row that breaks across pages, as in Word, where LibreOffice
            // lets them go (`word-rules.docx` P8, `word-rules2.docx` Q3). A paragraph that ends in the cell's part on the
            // page needs room for its space after there too, as in Word (`word-line-heights.docx` T2)
            const { count } = linesThatFit(remaining, room - used - space, paragraph, from === 0, (upTo) =>
                upTo === remaining.length ? paragraph.spaceAfter : 0,
            );
            if (count > 0) {
                used += space + linesHeight(remaining.slice(0, count));
                placed = [...placed, ...remaining.slice(0, count)];
            }
            if (count < remaining.length) {
                return { height: used, lines: placed, rest: [{ paragraph, from: from + count }, ...paragraphs.slice(index + 1)] };
            }
            previousAfter = paragraph.spaceAfter;
        }
        return { height: used + (previousAfter ?? 0), lines: placed, rest: [] };
    };

    /**
     * Places a row that doesn't fit on the page by breaking it across pages between the lines of its cells, as Word
     * breaks a row unless it is kept whole. A row none of whose lines fit moves to the next page. The table's header rows
     * are repeated above the rest of it on each page and in each column.
     *
     * @param breakBorder - The border below the row on a page where the table breaks: the table's bottom border, which the
     * last row has counted already
     */
    const splitRow = (row: TableRow, height: number, breakBorder: number, startTablePage: () => void): void => {
        // A table in a cell is measured as a line that doesn't break, which is enough to tell whether the row breaks
        let parts = row.cells.map((cell): readonly CellParagraph[] =>
            cell.blocks.map((block, index) => ({
                paragraph:
                    block.type === "paragraph"
                        ? measureParagraph(block, cell.width, cell.blocks[index - 1], cell.blocks[index + 1])
                        : { ...UNBROKEN, lines: [{ height: sum(rowHeights(sizedToPlace(block, cell.width))), markers: markersOf(block) }] },
                from: 0,
            })),
        );
        let isFirstPart = true;
        for (;;) {
            const borders = row.borderTop + row.borderBottom;
            const room = linesBottom() - position - borders - breakBorder;
            const first = isFirstPart;
            const filled = parts.map((paragraphs, cell) =>
                fillCell(paragraphs, room - row.cells[cell].marginTop - row.cells[cell].marginBottom, first),
            );
            // The row only breaks where each of its cells with lines left keeps some of them on the page, as in Word. When
            // widow control or keepLines hold back all of a cell's lines, the row moves to the next page whole
            // (`word-rules2.docx` Q3c). A row of an at-least height only breaks where the page has room for its height, and
            // otherwise moves to the next page whole too (`word-line-heights.docx` T3)
            const placesLines =
                (!isFirstPart || row.height === undefined || row.height.value <= room + TOLERANCE) &&
                filled.some(({ lines }) => lines.length > 0) &&
                parts.every((paragraphs, cell) => paragraphs.length === 0 || filled[cell].lines.length > 0);
            const isLastPart = filled.every(({ rest }) => rest.length === 0);
            if (placesLines && !isLastPart) {
                if (row.cells.some(({ verticalMerge }) => verticalMerge !== undefined)) {
                    throw new Unsupported("a table row with merged cells across pages");
                }
                if (row.cells.some((cell) => cell.blocks.some(({ type }) => type === "table"))) {
                    throw new Unsupported("a table in a table row across pages");
                }
            }
            // A row at the top of a page that doesn't fit there whole is taller than a page, which the layout stops at, unless
            // the end of a footnote continued from the page before takes room on it, which leaves the next page for it
            const fitsWhole = !isFirstPart || position + height + breakBorder <= linesBottom() + TOLERANCE;
            if ((!placesLines || !fitsWhole) && !placedInColumn && continued === undefined) {
                stopIfBalancing();
                throw new Unsupported("a table row taller than a page");
            }
            if (placesLines && (fitsWhole || !isLastPart)) {
                mark(filled.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
            }
            const tallest = Math.max(...filled.map((part, cell) => row.cells[cell].marginTop + part.height + row.cells[cell].marginBottom));
            if (placesLines && isLastPart && fitsWhole) {
                // A row that moved to the next page whole is as tall there as it is anywhere
                position += (isFirstPart ? height - borders : tallest) + borders;
                placedInColumn = true;
                return;
            }
            if (placesLines && !isLastPart) {
                // The part of the row on this page or in this column, which columns being balanced end below
                position += tallest + borders + breakBorder;
                parts = filled.map(({ rest }) => rest);
                isFirstPart = false;
            }
            startTablePage();
        }
    };

    /** Whether the cells of a table are as wide as those of the same table laid out in another width */
    const sameWidths = (table: TableBlock, other: TableBlock): boolean =>
        table.rows.every(({ cells }, row) => cells.every(({ width }, cell) => other.rows[row].cells[cell].width === width));

    const placeTable = (block: TableBlock): void => {
        const width = section().columns[column];
        const table = sizedToPlace(block, width);
        const merges = mergesOf(table);
        const heights = rowHeights(table, merges);
        const headerRows = table.rows.findIndex(({ header }) => !header);
        const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
        // The space after the paragraph before the table
        position += spaceAfter;
        spaceAfter = 0;
        // A new column or page for the table, with its header rows repeated at the top, unless the row going on it is one
        // of them. Word and LibreOffice repeat them at the top of each column, as of each page (`word-rules2.docx` Q4)
        const startTablePage = (index: number): void => {
            nextColumn();
            // A table sized to its text keeps its columns' widths in a wider column, as in Word, where LibreOffice sizes one
            // of a share of the width again (`word-column-widths.docx` R5 and R6). What Word does in a narrower one, where
            // they might not fit, isn't known
            const next = section().columns[column];
            if (next < width && !sameWidths(table, fitted(block, next))) {
                throw new Unsupported("a table sized to its text that goes on into a narrower column");
            }
            if (index >= headerRows) {
                position += repeated;
            }
        };
        /** Whether a row fits on the page, with its footnotes */
        const rowFits = (height: number, notes: readonly string[]): boolean =>
            position + height <= linesBottom(moreNoteRoom(notes)) + TOLERANCE;
        const markersIn = (row: TableRow): readonly string[] => row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf));
        // Where a table breaks across pages, Word draws its bottom border below the last of it on the page, which takes room
        // there too, whether the table breaks between rows or in one (`word-line-heights.docx` T1 and T4)
        const bottomBorder = table.rows[table.rows.length - 1]?.borderBottom ?? 0;
        for (const [index, row] of table.rows.entries()) {
            const breakBorder = index < table.rows.length - 1 ? bottomBorder : 0;
            const height = heights[index];
            const roomNeeded = height + breakBorder;
            const markers = markersIn(row);
            const notes = notesIn(markers);
            if (!rowFits(roomNeeded, notes) && position + roomNeeded <= linesBottom() + TOLERANCE && notes.some(canBreak)) {
                throw new Unsupported("a footnote in a table row across pages");
            }
            const keptWhole = row.cantSplit || row.height?.rule === "exact";
            // On the next page, the end of a footnote continued from this one can leave too little room for it too, as for
            // a paragraph's lines, so it goes on the page after
            while (!rowFits(roomNeeded, notes) && keptWhole && (placedInColumn || continued !== undefined)) {
                startTablePage(index);
            }
            for (const { last, height: needed } of merges.filter(({ first }) => first === index)) {
                // The rows of the merge its cell's text reaches into, which go on the page together unless the page breaks
                // across the cell's lines
                const reached = heights
                    .slice(index, last + 1)
                    .findIndex((_, offset) => sum(heights.slice(index, index + offset + 1)) >= needed - TOLERANCE);
                const rows = table.rows.slice(index, reached === -1 ? last + 1 : index + reached + 1);
                if (rows.length > 1 && !rowFits(sum(heights.slice(index, index + rows.length)), notesIn(rows.flatMap(markersIn)))) {
                    // Word breaks the cell's lines with the row of the merge that crosses the page, where all of them would be
                    // put on this page with its first row (word-probes.docx U4a)
                    throw new Unsupported("a table row with merged cells across pages");
                }
            }
            if (!rowFits(roomNeeded, notes) && !keptWhole) {
                if (notes.length > 0) {
                    throw new Unsupported("a footnote in a table row across pages");
                }
                splitRow(row, height, breakBorder, () => startTablePage(index));
                continue;
            }
            if (!rowFits(roomNeeded, notes)) {
                stopIfBalancing();
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
     * the block they are kept with, from where the next line would go. With the footnotes of all their lines (`notes`)
     * and of the paragraphs kept with the next alone (`kept`), and what they are kept with: nothing in their section, all
     * of a paragraph's lines, or the first lines of a longer one, or a table's first row.
     */
    const keptHeight = (
        index: number,
        width: number,
    ): {
        readonly height: number;
        readonly notes: readonly string[];
        readonly kept: readonly string[];
        readonly keptWith: "nothing" | "whole" | "part";
    } => {
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
                    linesHeight(lines) + (offset === 0 ? spaceAboveOf(spaceBefore) : between(kept[offset - 1].spaceAfter, spaceBefore)),
            ),
        );
        const lastAfter = kept[kept.length - 1]?.spaceAfter ?? spaceAfter;
        const keptNotes = notesIn(kept.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
        const anchor = blocks[index + chain].block;
        if (anchor.type === "paragraph" && anchor.sectionBreak) {
            // The paragraph that ends the section takes no room, so they are kept with nothing
            return { height: keptLines, notes: keptNotes, kept: keptNotes, keptWith: "nothing" };
        }
        if (anchor.type === "table") {
            const [firstRow] = anchor.rows;
            // A table that can't be laid out has nothing kept with it, so what is kept is placed before the layout stops
            const sized = anchor.unsupported ? anchor : fitted(anchor, width);
            return {
                height: keptLines + lastAfter + (sized.unsupported ? 0 : (rowHeights(sized)[0] ?? 0)),
                notes: [...keptNotes, ...notesIn(firstRow ? firstRow.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)) : [])],
                kept: keptNotes,
                keptWith: "part",
            };
        }
        // As much of the next paragraph as can't be left at the bottom of a page on its own. The last paragraph of a
        // section is kept with nothing, and measured as the next itself
        const next = measured(index + chain);
        const firstLines = next.keepLines || (next.widowControl && next.lines.length <= 3) ? next.lines.length : next.widowControl ? 2 : 1;
        const nextLines = next.lines.slice(0, firstLines);
        return {
            height: keptLines + between(lastAfter, next.spaceBefore) + linesHeight(nextLines),
            notes: [...keptNotes, ...notesIn(nextLines.flatMap(({ markers }) => markers))],
            kept: keptNotes,
            keptWith: chain === 0 ? "nothing" : firstLines === next.lines.length && !next.pageBreakBefore ? "whole" : "part",
        };
    };

    /**
     * Whether a block is the empty paragraph that ends a section right after a table. Word gives it a line of its own, as
     * there is no line of a paragraph before it for its mark to go on (`word-header-columns.docx` H1 to H4, H7 and H8),
     * where LibreOffice gives it no room
     */
    const endsAfterTable = (index: number): boolean => {
        const block = blocks[index]?.block;
        return block?.type === "paragraph" && block.sectionBreak === true && blocks[index - 1]?.block.type === "table";
    };

    const placeBlock = (block: Block, index: number): void => {
        if (block.unsupported) {
            throw new Unsupported(block.unsupported);
        }
        const width = section().columns[column];
        if (block.type === "paragraph" && block.sectionBreak && !endsAfterTable(index)) {
            // The empty paragraph that ends a section after a paragraph takes no room, in Word and LibreOffice. In Word, the
            // space around it is still its own: the space after the paragraph before and its space before are the larger of
            // the two, and the next section's space before is only as much as is more than its space after, where
            // LibreOffice has the space after the paragraph before. Its space after is never on the page itself, so
            // contextual spacing leaves nothing more of it out
            const { spaceBefore } = measureParagraph(block, width, blocks[index - 1]?.block);
            if (placedInColumn) {
                position += between(spaceAfter, spaceBefore);
            }
            spaceAfter = 0;
            return;
        }
        if (block.type === "table") {
            placeTable(block);
            sectionSpaceAfter = undefined;
            return;
        }
        const paragraph = measureParagraph(block, width, blocks[index - 1]?.block, blocks[index + 1]?.block);
        let holdNotes = false;
        if (paragraph.keepNext) {
            /**
             * What is kept together, from where the next line goes, broken into lines at the width of the column it goes in,
             * with the footnotes held back from a paragraph kept with this one, which go below these lines too (`all`), and
             * whether it fits with its footnotes taking some room
             */
            const keptHere = (): ReturnType<typeof keptHeight> & {
                readonly all: readonly string[];
                readonly fitsWith: (noteRoom: number) => boolean;
            } => {
                const measured = keptHeight(index, section().columns[column]);
                return {
                    ...measured,
                    all: [...held, ...measured.notes],
                    fitsWith: (noteRoom) => position + measured.height <= linesBottom(noteRoom) + TOLERANCE,
                };
            };
            if (placedInColumn) {
                const here = keptHere();
                // They fit with their footnotes, the last continued on the next page when it can be, as in Word
                // (`word-probes.docx` U2l)
                const fitsHere = here.fitsWith(leastNoteRoom(here.all));
                // What is kept together moves to the next column, or to a new page when the columns of this one start too
                // low for it, unless it is too tall for those too. The next column ends above the page's footnotes with
                // theirs, and a new page has the rest of a footnote continued from this one. What is kept is broken into
                // lines at the width of the column it goes in
                const { columns } = section();
                const fitsBelow = (from: number, area: number, below: number): boolean =>
                    from + keptHeight(index, below).height <= Math.min(bottom, pageBottom - area) + TOLERANCE;
                if (
                    !fitsHere &&
                    column + 1 < columns.length &&
                    fitsBelow(columnTop, noteArea + moreNoteRoom(here.notes), columns[column + 1])
                ) {
                    nextColumn();
                } else if (
                    !fitsHere &&
                    fitsBelow(top, leastAreaOf(here.notes, carried, columns.length > 1 ? columns : undefined), columns[0])
                ) {
                    startPage();
                }
            }
            // Where they go, here or where they moved to, a footnote continued on the next page from the paragraphs kept with
            // the next goes below the lines they are kept with, which Word keeps on the page with them (U2l)
            const { notes, kept, keptWith, all, fitsWith } = keptHere();
            holdNotes =
                keptWith !== "nothing" &&
                [...held, ...kept].length > 0 &&
                notes.length === kept.length &&
                fitsWith(leastNoteRoom(all)) &&
                !fitsWith(moreNoteRoom(all));
            if (holdNotes && keptWith === "part") {
                // How much of a longer paragraph, or of a table, Word puts above it isn't known
                throw new Unsupported("a footnote continued below a paragraph kept with the next");
            }
        }
        const previous = blocks[index - 1];
        const keptWithPrevious =
            previous?.section === blocks[index].section && previous.block.type === "paragraph" && previous.block.format.keepNext === true;
        placeParagraph(block, paragraph, keptWithPrevious, holdNotes);
        sectionSpaceAfter = undefined;
    };

    /** Lays out the blocks from one (`from`) to the one before another (`to`), starting their sections */
    const placeBlocks = (from: number, to: number): void => {
        for (let index = from; index < to; index++) {
            const { block, section: blockSection } = blocks[index];
            const startsSection = blockSection !== sectionIndex;
            if (startsSection) {
                startSection(blockSection, index);
            }
            blockStart = snapshot(index);
            if (startsSection || columnsStart === undefined) {
                // The section's columns start with its first block, on the page it starts on or below what is on it
                columnsStart = blockStart;
            }
            try {
                placeBlock(block, index);
            } catch (error) {
                if (!(error instanceof NotesGrew)) {
                    throw error;
                }
                // The page's columns are laid out again from the block they start with, above the room its footnotes take
                // eslint-disable-next-line functional/immutable-data
                reserves.set(pageCount, error.area);
                restore(columnsStart!);
                index = columnsStart!.index - 1;
            }
        }
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
        placeBlocks(0, blocks.length);
        checkReserve();
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
