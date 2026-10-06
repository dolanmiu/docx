/**
 * Lays out a document's pages as Word does, to find the page each bookmark starts on.
 *
 * Each page's body is filled from the top, between the page's margins, or its header and footer where they are taller,
 * and in columns, the first column and then the next, with each line broken at the width of the column it is in. The
 * columns on the page before a continuous section break are balanced, as short as what is in them fits in. A section
 * that starts in the next column starts in the next column of the page when the section before has as many columns and
 * one is left, laid out in the page's columns, and on a new page otherwise.
 * Paragraphs break into lines, and pages break between lines, as their keep and widow control settings allow. Table
 * rows break across pages between the lines of their cells, and the rows and lines of the tables in them, unless they are
 * kept whole, and the table's header rows are repeated at the top of each page and column. The footnotes of each page's
 * lines, of the text and of table rows alike, take room at its bottom, laid out in the section's columns in a section in
 * columns, and one that doesn't fit below its reference continues at the bottom of the next page, or pages, broken as the
 * body is. The endnotes follow the body.
 * It stops at the first thing it can't lay out yet, and the bookmarks after it aren't placed, unless it is asked to
 * guess, when it lays out past each that it has a guess for, and notes on each page what it guessed at.
 *
 * @module
 */
import {
    type ContentWidths,
    DEFAULT_MEASURER,
    type InlineItem,
    type LaidOutLine,
    type LineRoom,
    type ParagraphFormat,
    type TextFont,
    type TextMeasurer,
    layoutLines,
    measureContentWidths,
    textMeasuredTogether,
} from "../text-layout";
import { fitColumns, tableWidths, verticalLineOf, verticalSpacing } from "./column-widths";
import {
    type Box,
    type DrawingFrame,
    type PlacedDrawing,
    type Span,
    keepOutOf,
    overlap,
    placeDrawing,
    roomBeside,
} from "./floating-drawings";
import type { BlockLayout, LineLayout, NoteLayout, PageLayout, RowLayout } from "./layout-document";
import { type FieldFormat, formatNumber, formatPageNumber, inFieldCapitals, writeFieldNumber, writesNumber } from "./number-format";
import {
    type Block,
    type DocumentContent,
    type FloatingDrawing,
    type HeadersOrFooters,
    JOINED_SPACING_MARKER,
    type LayoutItem,
    type ParagraphBlock,
    type Section,
    type TableBlock,
    type TableCell,
    type TableRow,
    isFieldMarker,
} from "./read-document";

/**
 * Where a bookmark, or a field whose result depends on the page it is on, was placed.
 */
export type PagePlace = {
    /** The page it is on, counted from the first */
    readonly page: number;
    /** The page's number, and how the page shows it, as a page reference to a bookmark there writes it */
    readonly pageNumber: number;
    readonly text: string;
    /** The section it is in, counted from 0 */
    readonly section: number;
    /** Where it is among the bookmarks and fields, counted in the order they were placed, which is the document's */
    readonly order: number;
};

/**
 * Where the pages of a document broke.
 */
export type Pagination = {
    /** The number of the page each bookmark starts on, as the page shows it */
    readonly bookmarks: ReadonlyMap<string, string>;
    /** Where each bookmark and each field whose result depends on the page it is on was placed, by its marker's name */
    readonly places: ReadonlyMap<string, PagePlace>;
    /**
     * The number of the page each bookmark starts on, without its chapter number, which a page reference to it in a format
     * of its own writes in that format
     */
    readonly bookmarkNumbers: ReadonlyMap<string, number>;
    /**
     * What each page reference with `\p` in the body writes, by the bookmark it refers to, in the order they are in the
     * body: "above" or "below" when it is on the bookmark's page, and "on page" and the bookmark's page otherwise, or
     * undefined for those whose page or bookmark wasn't placed
     */
    readonly relativePositions: ReadonlyMap<string, readonly (string | undefined)[]>;
    /** How many pages were laid out */
    readonly pageCount: number;
    /**
     * How many pages each section has, in order: undefined for a section that shares a page with another, that has a
     * blank page before or after it, or that wasn't laid out to its end
     */
    readonly sectionPageCounts: readonly (number | undefined)[];
    /** What it stopped at, when it couldn't lay out all of the document */
    readonly stoppedAt?: string;
    /** The pages laid out, and what is on each, with lengths in points */
    readonly pages: readonly PageLayout[];
};

export type PaginateOptions = {
    /** The page numbers of bookmarks, which the results of the page references to them are. Those not in it are blank */
    readonly pageNumbers?: ReadonlyMap<string, string>;
    /**
     * Where the bookmarks and fields were placed when the pages were laid out before, which the results of the page
     * references in formats of their own, those with `\p` and page numbers are worked out from. Those not in it are blank
     */
    readonly places?: ReadonlyMap<string, PagePlace>;
    /**
     * Where the bookmarks and fields were placed in any pass before, which says where a pass whose pass before stopped
     * earlier stops too: at a field whose number its format doesn't write there
     */
    readonly earlierPlaces?: ReadonlyMap<string, PagePlace>;
    /** The number of pages of the document, and of each section, which page count fields show. They are blank without */
    readonly pageCount?: number;
    readonly sectionPageCounts?: readonly (number | undefined)[];
    readonly measurer?: TextMeasurer;
    /**
     * Whether it lays out past what it can't lay out as Word does yet, with its best guess, rather than stopping there,
     * and notes on each page what it guessed at (see `stopAt`). It still stops where it has no guess
     */
    readonly guess?: boolean;
};

/**
 * The width of a paragraph's lines from each of them on (`from`, by its index): those of the columns they go in, for a
 * paragraph that goes on into a column of another width
 */
type LineWidths = readonly { readonly from: number; readonly width: number }[];

/** The room of each of a paragraph's lines that has room of its own, beside drawings that text flows around, by its index */
type LineRooms = ReadonlyMap<number, LineRoom>;

/** Line widths with the lines from one (`from`) on at a width, broken again there when it is another */
const widthsFrom = (widths: LineWidths, from: number, width: number): LineWidths =>
    widths.findLast((given) => given.from <= from)?.width === width
        ? widths
        : [...widths.filter((given) => given.from < from), { from, width }];

/** A paragraph broken into lines, with the space around it, and the room its borders take above and below its lines */
type MeasuredParagraph = {
    readonly lines: readonly LaidOutLine[];
    readonly spaceBefore: number;
    readonly spaceAfter: number;
    readonly borderAbove: number;
    readonly borderBelow: number;
    readonly keepNext: boolean;
    readonly keepLines: boolean;
    readonly widowControl: boolean;
    readonly pageBreakBefore: boolean;
    /** Whether it is in one box with the paragraph before, whose between border is another */
    readonly joinedUnlike?: boolean;
};

// How far past the bottom of a page a line may go, for the rounding of the heights
const TOLERANCE = 0.01;

// How much of a line Word puts above its text's baseline at exact spacing (`word-stops-top-spacing.docx` ST4a)
const EXACT_ABOVE_BASELINE = 0.8;
// How far down the first line of a page or column ends, or its text's baseline is at exact spacing, when the space above
// its text is left out (`suppressTopSpacing`), in points, in each font alike (`word-stops-top-spacing.docx` ST1 to ST3)
const TOP_SPACE_KEPT = 9.6;
// Why the layout stops where Word's way with the space above the first line of a page or column isn't known
const TOP_SPACING_UNKNOWN =
    "the first line of a page or column, at line spacing Word hasn't shown, in a document that suppresses the space above it";

// The narrowest gaps beside drawings Word 2010 and before were seen putting text in, in points. They put text aligned left
// in gaps of 1000 to 2500 twips beside a picture (`word-stops-compat2-14.docx`, `-12` CN6a to CN6d), of 1882 beside a
// table that text flows around (CN9), and of 2000 and 3000 beside a frame (CN7a, CN7b), and justified text in gaps of 1882
// beside a table (`word-stops-compat-14.docx` CM10) and 2880 beside a picture (CM9), but left one of 1000 beside a frame
// empty, of justified text (CM14), where Word 2013 puts words. Whether the frame or the justification left it empty isn't
// known, so narrower gaps beside a frame, or of text aligned otherwise than left, haven't been seen
const OLDER_LEAST_GAP = 50;
const OLDER_LEAST_GAP_ALIGNED = 94;
const OLDER_LEAST_GAP_BESIDE_FRAME = 100;

/**
 * Whether a line's room beside drawings is a gap they cut narrower than Word 2010 and before were seen putting text in, of
 * text aligned as it is: `width` of it, the room the paragraph's indents leave in it, in the line's row from `top` to
 * `bottom`, where a frame beside the row makes the gap one beside a frame
 */
const narrowGap = (
    span: Span,
    width: number,
    within: Span,
    row: { readonly top: number; readonly bottom: number },
    around: readonly PlacedDrawing[],
    alignment: ParagraphFormat["alignment"],
): boolean => {
    const beside = (edge: number, at: number): boolean => Math.abs(edge - at) <= TOLERANCE;
    const framed = around.some(
        ({ drawing, keepOut }) =>
            drawing.frame !== undefined &&
            keepOut.top < row.bottom &&
            row.top < keepOut.bottom &&
            (beside(keepOut.left, span.end) || beside(keepOut.right, span.start)),
    );
    const least = framed
        ? OLDER_LEAST_GAP_BESIDE_FRAME
        : alignment === undefined || alignment === "left"
          ? OLDER_LEAST_GAP
          : OLDER_LEAST_GAP_ALIGNED;
    return width < least && (span.start > within.start + TOLERANCE || span.end < within.end - TOLERANCE);
};

// Word's automatic space before and after a paragraph, in points (`word-watertight-text.docx` TX6a, TX6b)
const AUTOMATIC_SPACE = 14;

/**
 * The lines of paragraphs without page references, by the measurer and widths they were laid out with. They are the same
 * each time the pages are laid out again with the page numbers worked out before.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const laidOutLines = new WeakMap<TextMeasurer, WeakMap<ParagraphBlock, Map<string, readonly LaidOutLine[]>>>();

/** How the rows of a table in a footnote are measured: as a line that can't be broken */
const UNBROKEN: Omit<MeasuredParagraph, "lines"> = {
    spaceBefore: 0,
    spaceAfter: 0,
    borderAbove: 0,
    borderBelow: 0,
    keepNext: false,
    keepLines: true,
    widowControl: false,
    pageBreakBefore: false,
};

/**
 * A table in a table cell, as a row that breaks across pages fills it: the table as it is laid out in the cell, the
 * height of each of its rows, the first of them not yet placed, and, when that row broke across pages, the paragraphs
 * left in each of its cells (`broken`)
 */
type CellTable = {
    readonly table: TableBlock;
    readonly heights: readonly number[];
    readonly from: number;
    readonly broken?: readonly (readonly CellParagraph[])[];
};

/** A paragraph in a table cell, and the first of its lines not yet placed, or a table in the cell */
type CellParagraph = { readonly paragraph: MeasuredParagraph; readonly from: number } | CellTable;

/**
 * A cell's part of a row that breaks across pages: how tall it is, its lines, the paragraphs left for the next page, and
 * how many lines fit in the room it was filled in, with those widow control and keepLines hold back
 */
type CellPart = {
    readonly height: number;
    readonly lines: readonly LaidOutLine[];
    readonly rest: readonly CellParagraph[];
    readonly fits: number;
    /** Why the layout stops if the part goes on the page: a table in the cell that breaks there as Word's breaking isn't known */
    readonly unsupported?: string;
};

/**
 * A cell of the part of a row that breaks across pages, as it is filled: its paragraphs left, the room its margins take,
 * the room above the row its text has (`above`), which a cell merged down from a row above has, as its text starts at
 * the top of its rows on the page, whether the space before its first paragraph is kept, and whether the footnotes of its
 * lines go with the row's part, as they do unless they went with a row above
 */
type RowCell = {
    readonly paragraphs: readonly CellParagraph[];
    readonly margins: number;
    readonly above: number;
    readonly isFirst: boolean;
    readonly counted: boolean;
};

/**
 * A cell merged down rows of the table being placed whose text isn't all on a page yet: its first and last row, its
 * paragraphs left, where its rows start on the page once one of them is on it, whether its text went on from a page
 * before (`broken`), and whether it starts in the table's header rows
 */
type OpenMerge = {
    readonly first: number;
    readonly last: number;
    readonly cell: TableCell;
    readonly rest: readonly CellParagraph[];
    /** Where its rows on the page start, and the room of the border above the first of them */
    readonly start?: number;
    readonly startTop?: number;
    /** Whether some of its text is placed already */
    readonly broken: boolean;
    /** Whether its rows went on from a page before, with the text not yet placed */
    readonly moved?: boolean;
    readonly header: boolean;
};

/** The height of a block stacked with others, and the space before and after it */
type StackPart = { readonly height: number; readonly before: number; readonly after: number };

/**
 * A point in a footnote: in its blocks (`block`), before a line of a paragraph or a row of a table (`line`), or in a row
 * that breaks across pages, after its parts on the pages before, each its cells' lines that fit in a room for it, from
 * where the part before ends (`cut`)
 */
type NotePoint = { readonly block: number; readonly line: number; readonly cut?: readonly number[] };

/** The rest of a footnote from a point in it, which continues at the bottom of the next page */
type NoteRest = { readonly name: string; readonly from: NotePoint };

/** A part of a footnote: from a point in it, or its start, up to another, or its end */
type NotePart = { readonly name: string; readonly from?: NotePoint; readonly to?: NotePoint };

/**
 * A search for how much room Word gives a footnote too long for the columns of a page, as much as leaves its reference on
 * the page: the reference's marker, the room tried (`area`), the most room found to leave it there (`low`) and the least
 * found not to (`high`), whether it was placed on the page with the room tried, and whether the room was found
 */
type NoteSearch = {
    readonly marker: string;
    readonly area: number;
    readonly low?: number;
    readonly high: number;
    readonly placed: boolean;
    readonly found: boolean;
};

/** Whether a point in a footnote is its start */
const atStart = (point?: NotePoint): boolean => point === undefined || (point.block === 0 && point.line === 0 && point.cut === undefined);

/**
 * Where a line of a footnote laid out in columns goes: the paragraph it is of and its index there, the column it is in,
 * how far down the footnotes its top is, and the line, broken at the column's width
 */
type NotePlace = (paragraph: number, line: number, column: number, top: number, laidOut: LaidOutLine) => void;

/**
 * A block of the footnotes at the bottom of a page: a paragraph or table of a footnote, by its marker (`note`) and its
 * index in it, unless it is the separator's, with the first of its lines or rows there, and the one after the last
 */
type NotePiece = {
    readonly block: Block;
    readonly note?: string;
    readonly index: number;
    readonly start: number;
    readonly end?: number;
    /** Where a table's first row in the piece is the rest of one broken across pages, the rooms its parts before were cut at */
    readonly startCut?: readonly number[];
    /**
     * Where a table's last row in the piece breaks across pages, the rooms its parts were cut at, the last its part in the
     * piece
     */
    readonly endCut?: readonly number[];
};

/**
 * Something placed on the pages, in the order it was placed: the start of a page, a line or table row of a block, by the
 * block's index, the footnotes at the bottom of the page, or a guess at what the layout can't lay out as Word does, with
 * why, and the page it was made on, counted from the first
 */
type Placement =
    | { readonly type: "page"; readonly page: Omit<PageLayout, "body" | "footnotes" | "endnotes"> }
    | { readonly type: "line"; readonly block: number; readonly line: LineLayout }
    | { readonly type: "row"; readonly block: number; readonly row: RowLayout }
    | { readonly type: "footnotes"; readonly notes: readonly NoteLayout[] }
    | { readonly type: "guess"; readonly reason: string; readonly page: number };

/** A line or row placed on a page */
type BlockPlacement = Extract<Placement, { readonly type: "line" | "row" }>;

/** A line or row placed on a page, with the index of its block in what it is in */
type BlockPiece = { readonly index: number; readonly piece: BlockPlacement };

/** The blocks lines and rows are of, in order, with those of the same block one after the other together */
const blocksOf = (pieces: readonly BlockPiece[]): readonly BlockLayout[] =>
    pieces.reduce<readonly BlockLayout[]>((blocks, { index, piece }) => {
        const last = blocks[blocks.length - 1];
        if (piece.type === "line") {
            return last?.type === "paragraph" && last.index === index
                ? [...blocks.slice(0, -1), { ...last, lines: [...last.lines, piece.line] }]
                : [...blocks, { type: "paragraph", index, lines: [piece.line] }];
        }
        return last?.type === "table" && last.index === index
            ? [...blocks.slice(0, -1), { ...last, rows: [...last.rows, piece.row] }]
            : [...blocks, { type: "table", index, rows: [piece.row] }];
    }, []);

/** The blocks of footnotes, in order, by the footnotes they are in, with those of the same footnote together */
const groupedNotes = (
    blocks: readonly { readonly note: string; readonly block: BlockLayout }[],
    numberOf: (note: string) => string,
): readonly NoteLayout[] =>
    blocks
        .reduce<readonly { readonly note: string; readonly content: readonly BlockLayout[] }[]>((notes, { note, block }) => {
            const last = notes[notes.length - 1];
            return last?.note === note
                ? [...notes.slice(0, -1), { note, content: [...last.content, block] }]
                : [...notes, { note, content: [block] }];
        }, [])
        .map(({ note, content }) => ({ noteNumber: numberOf(note), content }));

/** Where the layout was at the start of a block, from which the blocks can be laid out again */
type Snapshot = {
    readonly index: number;
    readonly keptOn: KeptOn | undefined;
    readonly brokenAcross: ReadonlySet<number>;
    readonly pageCount: number;
    readonly pageNumber: number;
    readonly restart: number | undefined;
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
    readonly notesSection: number;
    readonly notesInColumns: number | undefined;
    readonly filledEnd: number;
    readonly continued: NoteRest | undefined;
    readonly carried: NoteRest | undefined;
    readonly held: readonly string[];
    readonly heldLines: number | undefined;
    readonly deferred: string | undefined;
    readonly pending: readonly string[];
    readonly spaceAfter: number;
    readonly sectionSpaceAfter: number | undefined;
    readonly placed: number;
    readonly marks: number;
    readonly finished: number;
    readonly pageColumns: number | undefined;
    readonly drawings: readonly PlacedDrawing[];
    readonly anchored: readonly string[];
};

/** A heading of a level, with its number as a chapter number, or why its chapter number isn't known */
type ChapterHeading = { readonly level: number; readonly chapter?: string; readonly unsupported?: string };

/** The headings of the text frames anchored in a block, which are before it in the text, whose chapter numbers aren't known yet */
const framedHeadings = (items: readonly LayoutItem[]): readonly ChapterHeading[] =>
    items
        .flatMap((item) => (item.type === "drawing" ? (item.drawing.frame?.blocks ?? []) : []))
        .flatMap(headingsIn)
        .map(({ level }) => ({ level, unsupported: "a chapter heading in a text frame" }));

/**
 * The headings in a block: a paragraph's own, and those in a table's cells and in the text frames anchored in either,
 * whose chapter numbers aren't known yet
 */
const headingsIn = (block: Block): readonly ChapterHeading[] =>
    block.type === "paragraph"
        ? [...framedHeadings(block.items), ...(block.heading ? [block.heading] : [])]
        : [
              ...framedHeadings(block.anchored ?? []),
              ...block.rows
                  .flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(headingsIn)))
                  .map(({ level }) => ({ level, unsupported: "a chapter heading in a table" })),
          ];

/** Whether a block is a paragraph with Word's automatic space before or after it */
const hasAutomaticSpace = (block: Block): boolean =>
    block.type === "paragraph" && (block.format.autoSpaceBefore === true || block.format.autoSpaceAfter === true);

/** Whether a block is a paragraph with borders or automatic spacing, which Word hasn't been seen with in some footnotes */
const boxedOrSpaced = (block: Block): boolean => (block.type === "paragraph" && block.borders !== undefined) || hasAutomaticSpace(block);
const BOXED_NOTE = "a paragraph border or automatic spacing in a footnote across pages or in columns";

/** Thrown to stop laying out at something that can't be laid out yet */
class Unsupported extends Error {}

/** Thrown to stop laying out columns being balanced in a height they don't fit in */
class Overflow extends Error {}

// Why the layout stops at text in a font the measurer doesn't know, at a character whose width in its font it doesn't, and
// at a page number in a format it can't write
const UNKNOWN_FONT = "a font not in the width tables";
const UNKNOWN_CHARACTER = "a character whose width in its font isn't known";
const UNWRITTEN_NUMBER = "a page number its format isn't written for yet";
// Why the layout stops at a footnote that goes on across pages in columns where Word's way isn't known
const FOOTNOTE_IN_COLUMNS = "a footnote across pages in columns";
// Why the layout stops at a footnote whose reference would move on and back as a page in columns is laid out again
const MOVES_ON_FROM_TOP = "a footnote in columns whose reference moves on to the next page from the top of a column";
// The space between footnotes' columns of their own, in points (stops2/word-stops-notes2.ts NT16b to NT16e)
const NOTE_COLUMN_SPACE = 36;
// The room for footnotes that Word's room for a footnote too long for a page's columns is looked for to within, in points
const NOTE_ROOM_STEP = 1;

/** The measurers the layout measures with, by those it is given, so the lines laid out with each are kept */
const stoppingMeasurers = new WeakMap<TextMeasurer, TextMeasurer>();

/**
 * A measurer that calls `atUnknown`, with why, where it would measure text in a font it doesn't know, or the height of a
 * line in one, as it measures them as another font, where Word draws them in their own, or in another again when it
 * doesn't have them (`word-watertight-text.docx` TX18), or from a file Word may not draw them from, as for a font Office
 * offers a copy of its own of. Otherwise, and after `atUnknown` when it returns, it measures as the measurer does: such a
 * font as the most similar font it knows, or from its file
 */
const atUnknownFonts = (measurer: TextMeasurer, atUnknown: (reason: string) => void): TextMeasurer => {
    const { unknownFont } = measurer;
    if (unknownFont === undefined) {
        return measurer;
    }
    /** The font, once `atUnknown` is called when the measurer doesn't know it, or this text in it */
    const known = (font: TextFont, text?: string): TextFont => {
        const unknown = unknownFont(font, text);
        if (unknown !== false) {
            atUnknown(unknown === true ? UNKNOWN_FONT : unknown);
        }
        return font;
    };
    return {
        ...measurer,
        measureWidth: (text, font) => measurer.measureWidth(text, known(font, text)),
        measureLineHeight: (font) => measurer.measureLineHeight(known(font)),
        measureDescent: (font) => measurer.measureDescent(known(font)),
    };
};

/** A measurer that stops the layout where it would measure text in a font it doesn't know (see {@link atUnknownFonts}) */
const stoppingAtUnknownFonts = (measurer: TextMeasurer): TextMeasurer => {
    const stopping =
        stoppingMeasurers.get(measurer) ??
        atUnknownFonts(measurer, (reason) => {
            throw new Unsupported(reason);
        });
    stoppingMeasurers.set(measurer, stopping);
    return stopping;
};

/**
 * Thrown to lay out the columns of a page again when its footnotes (`notes`) take more room than the columns before the one
 * being filled were laid out above (`area`), or, with `moved`, without that room, with the references to these footnotes
 * on the next page
 */
class NotesGrew extends Error {
    public constructor(
        public readonly area: number,
        public readonly notes: readonly string[],
        public readonly moved?: readonly string[],
    ) {
        super();
    }
}

const BESIDE_NOTES = "a drawing that text flows around beside the footnotes at the bottom of its page";

/**
 * Thrown to lay out a table again from the next page or column, when its header rows would be alone at the foot of this
 * one, with what was guessed at in moving them (`guesses`), or, with the paragraphs kept with the next before it, from the
 * first of them (`kept`), which go on to the next page with it
 */
class HeaderRowsAlone extends Error {
    public constructor(
        public readonly guesses: readonly string[],
        public readonly kept?: number,
    ) {
        super();
    }
}

/** Thrown to lay out the page again with a block (`block`) starting the next page (`page`) */
class StartsNextPage extends Error {
    public constructor(
        public readonly block: number,
        public readonly page: number,
    ) {
        super();
    }
}

/**
 * Thrown to lay out a page again when a drawing that text flows around is placed beside text that was placed before it
 * on the page, with the drawing on the page from its start
 */
class DrawingAbove extends Error {
    public constructor(public readonly drawing: PlacedDrawing) {
        super();
    }
}

const PUSHED_ON = "a drawing whose paragraph goes on to the next page as the text before it goes round it";

// A table that text flows around anchored at the top of a table that moves on to the next page stays where it was placed
// (`word-stops-floats2.docx` TF1); where Word puts a text frame anchored there isn't known
const FRAME_BEFORE_TABLE_MOVING_ON = "a text frame before a table that moves on";

/**
 * Thrown to lay out a page again when the paragraph of a drawing placed from the page's top went on to the next page as
 * the text before it went round the drawing, with the paragraph starting on the next page (`block`), and its drawing with
 * it, as Word lays it out (`word-stops-drawings.docx` DR8). Where the page isn't laid out again, as it ends other than
 * in placing a block, the layout stops there
 */
class PushedOn extends Unsupported {
    public constructor(
        public readonly block: number,
        public readonly page: number,
    ) {
        super(PUSHED_ON);
    }
}

// How many times a page is laid out again for its drawings before the layout stops at them
const MOST_PAGE_LAYOUTS = 5;

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * A row down a column of a paragraph's lines: one, or more beside a drawing, with text on both sides of it. Its line is
 * the row as fitting the lines on a page counts it: as tall as the gap above it and its tallest line, with the bookmarks
 * of all its lines, and the break of its last.
 */
type Row = {
    /** Its first line, by its index in the paragraph, and how many lines it has */
    readonly first: number;
    readonly count: number;
    /** How far below the row before it it is, when it is moved down below a drawing */
    readonly skip: number;
    /** How tall it is: its tallest line */
    readonly height: number;
    /** Where it is down the page, when it is laid out beside drawings and is above the bottom of the column */
    readonly top?: number;
    readonly line: LaidOutLine;
};

/** A row of lines, the first of them a paragraph's line `first`, `skip` below the row before it, at `top` */
const rowOf = (lines: readonly LaidOutLine[], first: number, skip = 0, top?: number): Row => {
    const height = Math.max(...lines.map((line) => line.height));
    const { breakAfter } = lines[lines.length - 1];
    const { spacingBelow, belowOnGrid } = lines.find((line) => line.height === height)!;
    return {
        first,
        count: lines.length,
        skip,
        height,
        ...(top === undefined ? {} : { top }),
        line: {
            height: skip + height,
            markers: lines.flatMap(({ markers }) => markers),
            text: lines.map(({ text }) => text).join(""),
            textWidth: sum(lines.map(({ textWidth }) => textWidth)),
            ...(breakAfter === undefined ? {} : { breakAfter }),
            ...(spacingBelow === undefined ? {} : { spacingBelow }),
            ...(belowOnGrid === undefined ? {} : { belowOnGrid }),
        },
    };
};

/**
 * A drawing of a paragraph placed on a page, the paragraph's line it is anchored in, and where it is in its items. A table
 * that text flows around before the paragraph is one of its drawings, anchored in its first line, at no item of its own,
 * with the index of its block and the heights of its rows (`table`)
 */
type AnchoredDrawing = {
    readonly line: number;
    readonly item: number;
    readonly drawing: PlacedDrawing;
    readonly table?: FloatingTable;
};

/** A table that text flows around, as a drawing of the paragraph after it: its block's index and its rows' heights */
type FloatingTable = { readonly index: number; readonly heights: readonly number[] };

const KEPT_FLOATING = "a paragraph kept with the next before a table that text flows around";

/**
 * Word lays out a paragraph kept with the next beside a drawing, with a drawing of its own or before a table, where it is,
 * when the next starts on its page (`word-stops-drawings.docx` DR12a, DR12b), and moves one with a drawing of its own to
 * the next page with the next, and the drawing with it, as any kept paragraph (`word-stops-floats2.docx` KP1a). How much
 * room Word finds for one kept with a table, or with a drawing of its own that the next's text goes above and below,
 * where it moves on, hasn't been seen, so it is laid out where it is, and the layout stops where the next starts
 * elsewhere
 */
const KEPT_BESIDE =
    "a paragraph kept with the next beside a drawing, kept with a table or with a drawing of its own the text goes above and below, apart from the next";

/**
 * The block a paragraph kept with the next is kept with, the page and column the paragraph ended in, and why the layout
 * stops where the block starts elsewhere
 */
type KeptOn = { readonly next: number; readonly page: number; readonly column: number; readonly reason: string };

// How much wider than its rows Word makes the room of a table that text flows around without borders left and right, in
// points (`word-floats3.docx` H1, H8, `word-floats2.docx` G25)
const BORDERLESS_FLOAT = 0.75;

/** Whether a table has no borders round it: none left or right, above its first row or below its last */
const borderlessOutside = ({ borderLeft, borderRight, rows }: TableBlock): boolean =>
    !borderLeft && !borderRight && !rows[0]?.borderTop && !rows.at(-1)?.borderBottom;

/** Whether a table has no borders round it, nor between its rows */
const borderless = (table: TableBlock): boolean =>
    borderlessOutside(table) && table.rows.every(({ borderTop, borderBottom }) => !borderTop && !borderBottom);

/** Whether a block is a table that text flows around */
const isFloating = (block: Block): block is TableBlock & { readonly float: NonNullable<TableBlock["float"]> } =>
    block.type === "table" && block.float !== undefined;

/** The width of a table's rows, with its cells' margins and the halves of its borders outside them */
const tableWidthOf = (table: TableBlock): number =>
    Math.max(0, ...table.rows.map(({ cells }) => sum(cells.map((cell) => cell.width + cell.marginLeft + cell.marginRight)))) +
    ((table.borderLeft ?? 0) + (table.borderRight ?? 0)) / 2;

// How many times a paragraph's lines are broken again beside drawings, each time in the room the last left them, with
// rooms that change, before the layout stops at them
const MOST_ATTEMPTS = 10;

/** Whether some lines' rooms are those of others, with rooms for more lines */
const extendsRooms = (more: LineRooms, fewer: LineRooms): boolean =>
    more.size > fewer.size &&
    [...fewer].every(([line, { start, end }]) => {
        const room = more.get(line);
        return room !== undefined && Math.abs(room.start - start) < TOLERANCE && Math.abs(room.end - end) < TOLERANCE;
    });

/** Whether two sets of lines' rooms are the same */
const sameRooms = (one: LineRooms, other: LineRooms): boolean =>
    one.size === other.size &&
    [...one].every(([line, { start, end }]) => {
        const room = other.get(line);
        return room !== undefined && Math.abs(room.start - start) < TOLERANCE && Math.abs(room.end - end) < TOLERANCE;
    });

/**
 * How many of a paragraph's lines, from one of them, fit in the room left on a page (`fits`), and how many of those go on
 * it (`count`): with widow control, a paragraph's first line isn't left alone at the bottom of a page, nor its last line
 * at the top of the next, and with keepLines, a paragraph that doesn't fit moves to the next page whole. The first lines
 * can need room below them too, for their footnotes, or for the space after a paragraph that ends in a table cell
 * (`roomBelow`, from the number of lines).
 *
 * A line that fits only without the space its multiple spacing adds below its text goes on the page when `hangs` says
 * it can, from the number of lines, as Word lets that space go below the bottom of a page: 26 lines of 544.09 twips fit
 * on a page of 13958, the last without its 268.55 (`word-mixed-heights.docx` MH1c), as do 20 lines of a picture beside
 * text at 1.15 lines (`word-watertight-text.docx` TX8c). Without `hangs`, it doesn't.
 */
const linesThatFit = (
    lines: readonly LaidOutLine[],
    room: number,
    { keepLines, widowControl }: Pick<MeasuredParagraph, "keepLines" | "widowControl">,
    isFirstLine: boolean,
    roomBelow: (count: number) => number = () => 0,
    hangs?: (count: number) => boolean,
): { readonly fits: number; readonly count: number } => {
    const ends = lines.map((_, line) => sum(lines.slice(0, line + 1).map(({ height }) => height)));
    const past = ends.findIndex((end, line) => end + roomBelow(line + 1) > room + TOLERANCE);
    const hung =
        past !== -1 && ends[past] - (lines[past].spacingBelow ?? 0) + roomBelow(past + 1) <= room + TOLERANCE && hangs?.(past + 1) === true;
    const fits = hung && past + 1 < lines.length ? past + 1 : hung ? -1 : past;
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

/** The result of a field that depends on the pages */
type PageField = Exclude<LayoutItem, InlineItem | { readonly type: "drawing" | "textBox" }>;

const PAGE_FIELDS: ReadonlySet<string> = new Set(["pageReference", "pageCount", "pageNumber", "sectionNumber", "noteNumber"]);

/** The name of the marker at a drawing that text flows around, by where it is in its paragraph's items */
const drawingMarker = (index: number): string => `drawing ${index}`;

/** Whether a marker is at a drawing that text flows around, rather than a bookmark, a field or a note's reference */
const isDrawingMarker = (name: string): boolean => name.startsWith("drawing ");

/** Whether an item is the result of a field that depends on the pages */
const isPageField = (item: LayoutItem): item is PageField => PAGE_FIELDS.has(item.type);

/**
 * What a page reference with `\p` writes, from where its bookmark (`target`) and the reference (`at`) were placed: "above"
 * or "below" on the same page, by the order of the text, even across columns and table cells, and "on page" and the
 * bookmark's page as the page shows it otherwise, as Word writes them (`word-watertight-fields.docx` FD2,
 * `word-page-fields.docx` PF1 to PF3). A bookmark in a footnote or endnote, which isn't in the text of the body
 * (`sameStory`), is "on page" its reference's page, even on the reference's page (PF8d and PF8e). Undefined when either
 * wasn't placed.
 */
const relativeText = (target: PagePlace | undefined, at: PagePlace | undefined, sameStory: boolean): string | undefined => {
    if (target === undefined || at === undefined) {
        return undefined;
    }
    if (target.page !== at.page || !sameStory) {
        return `on page ${target.text}`;
    }
    return target.order < at.order ? "above" : "below";
};

/**
 * Lays out a document's pages, and finds the page each bookmark starts on.
 */
export const paginate = (
    content: DocumentContent,
    {
        pageNumbers = new Map(),
        places: givenPlaces = new Map(),
        earlierPlaces = new Map(),
        pageCount: givenPageCount,
        sectionPageCounts: givenSectionPageCounts = [],
        measurer = DEFAULT_MEASURER,
        guess = false,
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
        endnoteContinuationSeparator,
        breakRules,
        hyphenation,
        footnoteNumbers,
        footnotesOnEachPage = new Map(),
        endnoteNumbers,
        compatibilityMode,
        suppressesTopSpacing,
    } = content;
    // The section at whose end each of the endnotes' blocks goes: the last, or each's where the settings say so
    const endnoteEnds = endnotes.map((_, index) => content.endnotesAfter?.[index] ?? sections.length - 1);
    // The body, with the endnotes after the section they go at the end of, which Word lays out after it. The separator
    // above them goes on the page of their first line, as Word puts it there when it would be alone at the bottom of a
    // page (`word-watertight-sections2.docx` SC5), so it is kept with the next
    const endnoteBlocks = (end: number): readonly { readonly block: Block; readonly section: number; readonly endnote: number }[] =>
        endnotes.flatMap((block, endnote) =>
            endnoteEnds[endnote] === end
                ? [
                      {
                          block:
                              block.type === "paragraph" && !endnoteNumbers.has(block)
                                  ? { ...block, format: { ...block.format, keepNext: true } }
                                  : block,
                          section: end,
                          endnote,
                      },
                  ]
                : [],
        );
    // After a section's last block, its endnotes, and those of the sections up to the next block's, which have no blocks of
    // their own, or of the last section, which has none of the body only where it is laid out on its own. Those of the
    // sections before the first block's, which have none either, go before it, and all go alone where the body has none
    const sectionsUpTo = (from: number, to: number): readonly number[] => Array.from({ length: to - from }, (_, after) => from + after);
    const blocks: readonly { readonly block: Block; readonly section: number; readonly endnote?: number; readonly body?: number }[] = [
        ...sectionsUpTo(0, content.blocks[0]?.section ?? sections.length).flatMap(endnoteBlocks),
        ...content.blocks.flatMap((entry, body) => [
            { ...entry, body },
            ...sectionsUpTo(entry.section, content.blocks[body + 1]?.section ?? sections.length).flatMap(endnoteBlocks),
        ]),
    ];
    /** Whether a block is one of the endnotes', or their separator's */
    const isEndnote = (index: number): boolean => blocks[index]?.endnote !== undefined;
    /** The space between two paragraphs: the larger of the space after the first and before the second, or both */
    const between = (after: number, before: number): number => (addsParagraphSpacing ? after + before : Math.max(after, before));

    // The section being laid out
    let sectionIndex = 0;

    /**
     * A field's text in its format: its number in its number format or picture, or as it is, in its capitals. It stops the
     * layout where Word's text for the number isn't known, such as 781 in letters, or guessing, writes it in figures
     */
    const written = (value: number, text: string, format: FieldFormat = {}): string => {
        const inFormat = writesNumber(format) ? writeFieldNumber(value, format) : text;
        if (inFormat === undefined) {
            stopAt(UNWRITTEN_NUMBER);
        }
        return inFieldCapitals(inFormat ?? String(value), format.capitals);
    };

    /**
     * What a page reference writes, from where it and its bookmark were placed before: the page's number as the page shows
     * it, such as iv or 1-2, or, in a number format of its own, the page's number without its chapter number in that
     * format (`word-page-fields.docx` PF4), or, with `\p`, where the bookmark is from it
     */
    /**
     * Where a bookmark or field was placed in the pass before. When it wasn't, as that pass stopped before it, but one
     * before that placed it where its number in a field's format isn't written, this pass stops at the field too, so the
     * passes agree
     */
    const placeOf = (name: string, format?: FieldFormat): PagePlace | undefined => {
        const earlier = earlierPlaces.get(name);
        if (!givenPlaces.has(name) && earlier !== undefined && writesNumber(format)) {
            written(earlier.pageNumber, "", format);
        }
        return givenPlaces.get(name);
    };

    const referenceText = ({ bookmark, format, relative, inNote }: Extract<LayoutItem, { readonly type: "pageReference" }>): string => {
        if (relative === undefined && inNote === undefined && !writesNumber(format)) {
            return inFieldCapitals(pageNumbers.get(bookmark) ?? "", format?.capitals);
        }
        const target = placeOf(bookmark, format);
        // In a footnote or endnote, "on page" and the bookmark's page, on its page too (`word-page-fields.docx` PF8f, PF8g)
        const text =
            relative !== undefined
                ? relativeText(target, givenPlaces.get(relative), !homes.get(bookmark)?.inNote)
                : inNote && target !== undefined
                  ? `on page ${target.text}`
                  : target?.text;
        return text === undefined ? "" : written(target!.pageNumber, text, format);
    };

    /**
     * The number of a footnote numbered afresh on each page, by the marker at its reference: one more than the footnotes
     * numbered so whose references were before it on its page in the pass before, from the section's start number, as
     * Word numbered two footnotes on each of three pages 1 and 2 (`word-stops-notes.docx` NT14a), and those of a section
     * after two of another numbered so on the page, 3 and 4, but after two numbered on through the document, 1 and 2
     * (stops2/word-stops-notes2.ts NT19a, NT19b). Blank when the pass before didn't place it
     */
    const onPageNumber = (note: string): string => {
        const place = givenPlaces.get(note);
        const { start, format } = footnotesOnEachPage.get(note)!;
        if (place === undefined) {
            return "";
        }
        const before = [...footnotesOnEachPage.keys()].filter((other) => {
            const at = givenPlaces.get(other);
            return at !== undefined && at.page === place.page && at.order < place.order;
        }).length;
        const text = formatNumber(start + before, format);
        if (text === undefined) {
            stopAt("notes numbered in a format not yet written");
        }
        return text ?? String(start + before);
    };

    /** The text of the result of a field that depends on the pages, from the numbers given and the places of the pass before */
    const resultText = (item: PageField): string => {
        switch (item.type) {
            case "pageReference":
                return referenceText(item);
            case "pageCount": {
                const count = item.scope === "document" ? givenPageCount : givenSectionPageCounts[sectionIndex];
                return count === undefined ? "" : written(count, String(count), item.format);
            }
            case "pageNumber": {
                // The page's number as the page shows it, as a page reference to a bookmark at the field would write it
                // (`word-page-number-formats.docx` C8), and in a footnote or endnote its reference's (PF7g to PF7i)
                const place = placeOf(item.field, item.format);
                return place === undefined ? "" : written(place.pageNumber, place.text, item.format);
            }
            case "noteNumber":
                return onPageNumber(item.note);
            default: {
                // The section's number, counted from 1 (`word-watertight-pages.docx` PG7e): in a footnote or endnote, the
                // section of its reference (PF7g to PF7i)
                const index = item.field === undefined ? sectionIndex : givenPlaces.get(item.field)?.section;
                return index === undefined ? "" : written(index + 1, String(index + 1), item.format);
            }
        }
    };

    /**
     * The text of the results of fields that depend on the pages, and a marker where each drawing that text flows around
     * is anchored, named by where it is in the paragraph, which finds the line it is anchored in
     */
    const itemsOf = (items: readonly LayoutItem[]): readonly InlineItem[] =>
        items.map((item, index) =>
            item.type === "drawing"
                ? { type: "marker", name: drawingMarker(index), after: true }
                : item.type === "textBox"
                  ? { type: "box", width: item.width, height: textBoxHeight(item), font: item.font }
                  : isPageField(item)
                    ? { type: "text", text: resultText(item), font: item.font }
                    : item,
        );

    /**
     * Why the width of a character of a paragraph's content in its font isn't known to the measurer, when it isn't, such as
     * a mathematical symbol in Calibri, which Word draws in Cambria Math
     */
    const unknownCharacterIn = (inline: readonly InlineItem[]): string | undefined =>
        inline.some((item) => item.type === "text" && measurer.unknownCharacter?.(item.text, item.font) !== undefined)
            ? UNKNOWN_CHARACTER
            : undefined;

    /**
     * Why how Word kerns a paragraph's text, or joins its letters into ligatures, isn't known to the measurer, when it
     * isn't. Text in the same font, kerned or with ligatures, is measured across runs, and so is checked across them, but
     * not across a soft hyphen, which Word neither kerns nor joins letters across (see `textMeasuredTogether`)
     */
    const unknownShapingIn = (inline: readonly InlineItem[]): string | undefined =>
        textMeasuredTogether(inline)
            .map(({ text, font }) => measurer.unknownShaping?.(text, font))
            .find(Boolean);

    /**
     * How tall a text box in the line is: its paragraphs, broken in the room for its text, which is its width less its
     * insets and its outline (`word-stops-floats2.docx` TX1a to TX1k), and the room above and below them; or its own
     * height, when Word doesn't size it to its text, which its text must fit in (`word-stops-vml-text-boxes.docx` VM25a)
     */
    const textBoxHeight = (box: Extract<LayoutItem, { readonly type: "textBox" }>): number => {
        const { room, textWidth: inside, blocks: inBox, fixed } = box;
        const ofText = stackHeight(inBox, inside, true);
        if (fixed === undefined) {
            return room + ofText;
        }
        if (ofText > fixed.inner + TOLERANCE) {
            // Where its text goes past its bottom hasn't been seen
            throw new Unsupported("a text box whose text is taller than it");
        }
        return fixed.height;
    };

    /**
     * A paragraph's content, as it is measured, which stops the layout at a character whose width the measurer doesn't
     * know, such as a mathematical symbol in Calibri, which Word draws in Cambria Math, and at kerning and ligatures it
     * doesn't know. Guessing, they are measured as the measurer measures them, a character as an average letter of the
     * font, and the lines they are in say so (see `linesOf`)
     */
    const measurable = (items: readonly LayoutItem[]): readonly InlineItem[] => {
        const inline = itemsOf(items);
        const unknown = unknownCharacterIn(inline) ?? unknownShapingIn(inline);
        if (unknown !== undefined && !guess) {
            throw new Unsupported(unknown);
        }
        return inline;
    };

    // Text in a font the measurer doesn't know stops the layout where it is measured. Guessing, it is measured as the
    // measurer measures it, as the most similar font it knows, and the lines it is in say so (see `linesOf`)
    const measuring = guess ? measurer : stoppingAtUnknownFonts(measurer);
    // eslint-disable-next-line functional/prefer-readonly-type
    const byParagraph = laidOutLines.get(measurer) ?? new WeakMap<ParagraphBlock, Map<string, readonly LaidOutLine[]>>();
    laidOutLines.set(measurer, byParagraph);
    /**
     * A paragraph's lines, broken at a width, or at the width of each line from those given on, and in the room given for
     * each of those that have room of their own, beside drawings that text flows around. A line whose breaking, or height,
     * Word hasn't shown stops the layout, or guessing, is laid out as it was broken, and so are lines of text in a font or
     * with a character the measurer doesn't know, measured as it measures them
     */
    // Where each block of the body is, to find the tables that text flows around before a paragraph
    const blockIndexes = new Map<Block, number>(blocks.map(({ block }, index) => [block, index]));
    const linesOf = (paragraph: ParagraphBlock, widths: number | LineWidths, rooms: LineRooms = new Map()): readonly LaidOutLine[] => {
        const given = typeof widths === "number" ? [{ from: 0, width: widths }] : widths;
        const key = [
            ...given.map(({ from, width }) => `${from}:${width}`),
            ...[...rooms].map(([line, { start, end }]) => `${line}:${start}-${end}`),
        ].join(" ");
        const widthOf = (line: number): number => given.findLast(({ from }) => from <= line)!.width;
        const layOut = (): readonly LaidOutLine[] => {
            const inline = measurable(paragraph.items);
            let guessed = guess ? (unknownCharacterIn(inline) ?? unknownShapingIn(inline)) : undefined;
            const laidOut = layoutLines(inline, {
                width: given.length === 1 && rooms.size === 0 ? given[0].width : (line) => rooms.get(line) ?? widthOf(line),
                format: paragraph.format,
                tabStops: paragraph.tabStops,
                defaultTabStop,
                markFont: paragraph.markFont,
                measurer: guess
                    ? atUnknownFonts(measurer, (reason) => {
                          guessed ??= reason;
                      })
                    : measuring,
                breakRules,
                numberAlignment: paragraph.numberAlignment,
                hyphenation,
                grid: paragraph.grid,
                compatibilityMode,
            });
            // The lines are kept with the guess they are, so a pass that lays them out again notes it too
            return guessed === undefined
                ? laidOut
                : laidOut.map((line) => (line.unsupported === undefined ? { ...line, unsupported: guessed } : line));
        };
        /** Its lines as they were laid out at these widths before, or are now */
        const kept = (): readonly LaidOutLine[] => {
            const byWidths = byParagraph.get(paragraph) ?? new Map<string, readonly LaidOutLine[]>();
            byParagraph.set(paragraph, byWidths);
            const laidOut = byWidths.get(key) ?? layOut();
            // eslint-disable-next-line functional/immutable-data
            byWidths.set(key, laidOut);
            return laidOut;
        };
        // Those of a paragraph with a page reference or page number change with the numbers, so aren't kept. Which cells a
        // line beside a drawing is on, on a grid that snaps to characters in columns of different widths, hasn't been seen
        if (paragraph.grid?.characterRoom !== undefined && rooms.size > 0) {
            stopAt("a line beside a drawing on a grid that snaps to characters in columns of different widths");
        }
        const lines = paragraph.items.some(isPageField) ? layOut() : kept();
        for (const reason of new Set(lines.flatMap(({ unsupported }) => (unsupported === undefined ? [] : [unsupported])))) {
            stopAt(reason);
        }
        // The footnotes of the tables that text flows around before it go on the page with its first line, which they are
        // anchored in, as Word puts them on the page with the table (`word-stops-floats.docx` FT3)
        const index = blockIndexes.get(paragraph);
        const floatNotes = index === undefined ? [] : floatsBefore(index).flatMap((table) => notesIn(markersOf(blocks[table].block)));
        return floatNotes.length === 0 ? lines : [{ ...lines[0], markers: [...floatNotes, ...lines[0].markers] }, ...lines.slice(1)];
    };

    /**
     * The space before or after a paragraph by its own formatting, next to a block on that side. Word's automatic spacing
     * is 14 points (`word-watertight-text.docx` TX6a, TX6b), but none above the first paragraph of the document, a table
     * cell or a header, nor below the last of a cell (TX6c, `word-paragraph-formats.docx` A0, A3), and none between two
     * paragraphs of the same list, of one level or two (stops2/word-stops-lists.ts LI12), where there is between a bulleted
     * and a numbered one (A1), and between lists of other definitions (LI12). What Word does between those of lists made
     * from the same definition isn't known: guessing, none, as in one list
     */
    const ownSpace = (paragraph: ParagraphBlock, side: "before" | "after", next: Block | undefined, inCell: boolean): number => {
        const { format, list } = paragraph;
        if (!(side === "before" ? format.autoSpaceBefore : format.autoSpaceAfter)) {
            return (side === "before" ? format.spaceBefore : format.spaceAfter) ?? 0;
        }
        if (next === undefined) {
            return side === "before" || inCell ? 0 : AUTOMATIC_SPACE;
        }
        const other = next.type === "paragraph" ? next.list : undefined;
        if (list === undefined || other === undefined || (list.id !== other.id && list.definition !== other.definition)) {
            return AUTOMATIC_SPACE;
        }
        if (list.id !== other.id) {
            stopAt("automatic spacing between paragraphs of lists made from the same definition");
        }
        return 0;
    };

    /**
     * Whether a paragraph is in one box of borders with a block next to it: a paragraph with the same borders and indents,
     * whatever their between borders (`word-paragraph-formats.docx` B5f, scripts/layout-probes/stops2/word-stops-text.ts
     * PB1a to PB1c), unless a page break comes between them, where Word ends the box at the foot of one page and starts
     * another, with its top border, on the next (PB3b). The empty paragraph that ends a section is in a box of its own, after
     * a table too, where it takes a line, so the boxes either side of it end there (stops2/word-stops-text2.ts PB3c to PB3e)
     */
    const sharesBorders = (one: ParagraphBlock, other: Block | undefined, side: "before" | "after"): boolean => {
        if (
            one.borders === undefined ||
            one.sectionBreak ||
            other?.type !== "paragraph" ||
            other.sectionBreak ||
            other.borders === undefined
        ) {
            return false;
        }
        return other.borders.outline === one.borders.outline && !(side === "before" ? one : other).format.pageBreakBefore;
    };

    const measureParagraph = (
        paragraph: ParagraphBlock,
        width: number | LineWidths,
        before?: Block,
        after?: Block,
        inCell = false,
    ): MeasuredParagraph => {
        const { format, borders } = paragraph;
        const lines = linesOf(paragraph, width);
        // With contextual spacing, Word leaves out a paragraph's own share of the space between it and one of the same
        // style next to it: the first's space after, and the part of the second's space before that is more than the
        // first's space after. The other paragraph's share stays, so 200 after a contextual paragraph and 400 before the
        // next leave 200, where LibreOffice leaves 400 (`word-rules.docx` P1, `word-rules2.docx` Q1). With the space after
        // and before added, each paragraph's share is its own. A paragraph left out between them, as it shows nothing,
        // takes no room, but is the one next to each, by its style (`word-hidden-paragraphs.docx` HP6c, HP6d)
        const contextual = (one: ParagraphBlock, other?: Block): boolean =>
            one.format.contextualSpacing === true && other?.type === "paragraph" && other.style === one.style;
        const spaceBefore = ownSpace(paragraph, "before", before, inCell);
        const shareBefore =
            before?.type === "paragraph" &&
            !before.sectionBreak &&
            contextual(before, before.hiddenAfter ?? paragraph) &&
            !addsParagraphSpacing
                ? Math.max(0, spaceBefore - ownSpace(before, "after", paragraph, inCell))
                : spaceBefore;
        // At a table cell's edges, it is compared with the paragraph next to it in the document's order, outside the cell,
        // when it is read (`word-stops-text.docx` PB6)
        const { leftOut } = paragraph;
        return {
            lines,
            spaceBefore: leftOut?.before || contextual(paragraph, paragraph.hiddenBefore ?? before) ? 0 : shareBefore,
            spaceAfter:
                leftOut?.after || contextual(paragraph, paragraph.hiddenAfter ?? after) ? 0 : ownSpace(paragraph, "after", after, inCell),
            // The top border is above the first paragraph of a box, and a between border above each of the others, and
            // they stay above it at the top of a page, where the box goes on with no border otherwise. A between border
            // leaves its space below each paragraph of the box but the last, so 15 twips of it 20 from the text are 55
            // between two paragraphs, and 35 above one at the top of a page (`word-watertight-text.docx` TX5b, TX5h). Between
            // two paragraphs whose between borders differ, Word draws the first's, with its space below the first and the
            // second's space above the second: 91 twips between them for a border of 10 twips 80 from the text on the first
            // only, 110 for one of 30, and 81 for one of 10 on the second only (word-stops-text.ts PB1a to PB1c)
            borderAbove:
                borders === undefined
                    ? 0
                    : sharesBorders(paragraph, before, "before")
                      ? (before as ParagraphBlock).borders!.between -
                        (before as ParagraphBlock).borders!.betweenSpace +
                        borders.betweenSpace
                      : borders.top,
            borderBelow: borders === undefined ? 0 : sharesBorders(paragraph, after, "after") ? borders.betweenSpace : borders.bottom,
            ...(borders !== undefined &&
            sharesBorders(paragraph, before, "before") &&
            (before as ParagraphBlock).borders!.box !== borders.box
                ? { joinedUnlike: true }
                : {}),
            keepNext: format.keepNext === true,
            keepLines: format.keepLines === true,
            // Word controls widows and orphans unless a paragraph or its style turns it off
            widowControl: format.widowControl !== false,
            pageBreakBefore: format.pageBreakBefore === true,
        };
    };

    const linesHeight = (lines: readonly LaidOutLine[]): number => sum(lines.map(({ height }) => height));
    /** The space below the text of the last line of what is kept together, which may go below the page */
    const belowOf = (last: LaidOutLine | undefined): { readonly spacingBelow: number } => ({ spacingBelow: last?.spacingBelow ?? 0 });
    /** How tall lines are on a page, at the bottom of which the multiple spacing of their last can go below it */
    const heightToFit = (lines: readonly LaidOutLine[]): number => linesHeight(lines) - (lines.at(-1)?.spacingBelow ?? 0);
    /**
     * Whether what is kept together, `height` tall from `from`, fits above `end`, with its last line's multiple spacing
     * below it when that can be (`hangsBelow`)
     */
    const fitsAbove = (
        from: number,
        { height, spacingBelow }: { readonly height: number; readonly spacingBelow: number },
        end: number,
        aboveNotes: boolean,
    ): boolean => from + height <= end + TOLERANCE || (from + height - spacingBelow <= end + TOLERANCE && hangsBelow(aboveNotes));

    /**
     * How narrow and how wide the paragraphs and tables in a table cell can be, and whether Word may hyphenate a word as
     * wide as the narrowest of them
     */
    const contentWidths = (stack: readonly Block[]): ContentWidths =>
        stack.reduce<ContentWidths>(
            (widths, block) => {
                const own =
                    block.type === "table"
                        ? tableWidths(block, contentWidths, measuring.measureLineHeight)
                        : measureContentWidths(measurable(block.items), {
                              format: block.format,
                              tabStops: block.tabStops,
                              defaultTabStop,
                              measurer: measuring,
                              breakRules,
                              numberAlignment: block.numberAlignment,
                              hyphenation,
                          });
                const hyphenated =
                    own.min > widths.min ? own.hyphenated : own.min < widths.min ? widths.hyphenated : own.hyphenated || widths.hyphenated;
                return { min: Math.max(widths.min, own.min), max: Math.max(widths.max, own.max), ...(hyphenated ? { hyphenated } : {}) };
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
        const sized = byWidth.get(width) ?? fitColumns(table, width, contentWidths, measuring.measureLineHeight);
        // eslint-disable-next-line functional/immutable-data
        byWidth.set(width, sized);
        return sized;
    };
    /**
     * A table sized to be laid out in a width, which stops the layout when Word's sizing of it isn't known, or guessing, is
     * laid out as it is sized: as near Word's sizing as the layout gets, or as it was read
     */
    const sizedToPlace = (table: TableBlock, width: number): TableBlock => {
        const sized = fitted(table, width);
        stopAtRead(sized);
        return sized;
    };

    /** The heights of blocks stacked in a width, with the space before and after each */
    const stackParts = (stack: readonly Block[], width: number, inCell: boolean): readonly StackPart[] =>
        stack.map((block, index) => {
            if (block.type === "table") {
                return { height: sum(rowHeights(sizedToPlace(block, width))), before: 0, after: 0 };
            }
            const measured = measureParagraph(block, width, stack[index - 1], stack[index + 1], inCell);
            return {
                height: measured.borderAbove + linesHeight(measured.lines) + measured.borderBelow,
                before: measured.spaceBefore,
                after: measured.spaceAfter,
            };
        });

    /**
     * The height of blocks stacked in a width, those in a table cell or a header, with the space before the first and
     * after the last
     */
    const stackHeight = (stack: readonly Block[], width: number, inCell: boolean): number =>
        heightOf(stackParts(stack, width, inCell), true);

    /** The height of stacked parts, with the space between them, and before the first and after the last unless left out */
    const heightOf = (parts: readonly StackPart[], withOuterSpace: boolean): number => {
        const outer = withOuterSpace ? (parts[0]?.before ?? 0) + (parts[parts.length - 1]?.after ?? 0) : 0;
        return sum(parts.map(({ height, before }, index) => height + (index === 0 ? 0 : between(parts[index - 1].after, before)))) + outer;
    };

    /**
     * The blocks of a cell that take room: all of them, but an empty paragraph that ends a cell whose mark takes none
     * (`w:hideMark`), as in Word (`word-watertight-tables.docx` TB7), or that ends it right after a table, which Word gives
     * none either, as a cell's end after a table (`word-probes.docx` U1n to U1p, `word-stops-tables.docx` RW1, RW2, RW12)
     */
    const blocksWithRoom = ({ blocks: stack, hideMark }: TableCell): readonly Block[] => {
        const last = stack[stack.length - 1];
        const empty = last?.type === "paragraph" && last.items.every(({ type }) => type === "marker");
        return empty && (hideMark || stack[stack.length - 2]?.type === "table") ? stack.slice(0, -1) : stack;
    };

    /**
     * The width a cell's text is laid out in: its own, or for text fitted to the cell, as wide as each paragraph's longest
     * line, as Word squeezes it onto one line (`word-stops-tables.docx` TS8)
     */
    const textWidthOf = (cell: TableCell): number => (cell.fitText ? Math.max(cell.width, contentWidths(cell.blocks).max) : cell.width);

    /**
     * How tall a cell's text makes its row. Text that runs up or down a cell makes it as tall as a line of its last
     * paragraph's mark, as far apart as Word lays out its lines (`verticalLineOf`), at its line spacing, whatever its text's
     * size, as Word breaks the text into lines as long as the row is tall (`word-watertight-tables.docx` TB6,
     * `word-table-formats.docx` VT1, `word-table-formats2.docx` VT5 to VT7, `word-stops-vertical-cells2.docx` VC5a to
     * VC5h: marks of 8 and 20 points beside text of 8, 16 and 20, the last of two paragraphs', and a style's). In a font
     * whose lines Word's PDFs haven't shown, guessing, as tall as a line of it across the page, and one with a table in it
     * as tall as a line of its last paragraph's mark, as a cell ends with a paragraph. One with no paragraph at all, as a
     * cell of only a bookmark, needs no room, as a cell of nothing across the page
     */
    const contentHeight = (cell: TableCell): number => {
        if (!cell.vertical) {
            return stackHeight(blocksWithRoom(cell), textWidthOf(cell), true);
        }
        const last = cell.blocks.findLast((block): block is ParagraphBlock => block.type === "paragraph");
        if (last === undefined) {
            return 0;
        }
        const line = verticalLineOf(last.markFont, measuring.measureLineHeight);
        return line === undefined
            ? linesHeight(measureParagraph({ ...last, items: [] }, cell.width, undefined, undefined, true).lines)
            : verticalSpacing(line, last.format.lineSpacing);
    };

    /** How tall a cell makes its row with its own margins, as a cell merged down rows does */
    const cellHeight = (cell: TableCell): number => cell.marginTop + contentHeight(cell) + cell.marginBottom;

    /**
     * The cells merged down several rows of a table: the row each starts in, its last row, the cell, and the height its
     * text needs
     */
    const mergesOf = ({
        rows,
    }: TableBlock): readonly { readonly first: number; readonly last: number; readonly cell: TableCell; readonly height: number }[] =>
        rows.flatMap(({ cells }, first) =>
            cells
                .filter(({ verticalMerge, vertical }) => verticalMerge === "restart" && !vertical)
                .map((cell) => {
                    // The rest of the merge is in the same column of the grid, which cells spanning columns can put at another index
                    const span = rows
                        .slice(first + 1)
                        .findIndex((row) => row.cells.find((other) => other.column === cell.column)?.verticalMerge !== "continue");
                    return { first, last: span === -1 ? rows.length - 1 : first + span, cell, height: cellHeight(cell) };
                }),
        );

    /**
     * The height of each row of a table: its tallest cell's text, with the largest of its cells' margins, or the row's own
     * height, and its borders. Cells merged down several rows make the last of them taller when their text needs more room.
     */
    const rowHeights = (table: TableBlock, merges = mergesOf(table)): readonly number[] => {
        const { rows } = table;
        const heights = rows.map(({ cells, height, borderTop, borderBottom }) => {
            const own = cells.filter(({ verticalMerge }) => verticalMerge === undefined);
            const largest = (lengths: readonly number[]): number => Math.max(0, ...lengths);
            // Text that runs up or down a cell makes no row taller that has cells of text across it: a mark of 20 points
            // beside a line of 11 doesn't (word-stops-vertical-cells.docx TV5b, word-stops-vertical-cells2.docx VC1g, VC1h)
            const across = own.filter(({ vertical }) => !vertical);
            // The tallest cell's text, and the largest margins above and below of the row's cells, which needn't be its
            // (word-table-formats2.docx MG1 to MG4)
            const natural =
                own.length === 0
                    ? 0
                    : largest(own.map(({ marginTop }) => marginTop)) +
                      largest((across.length > 0 ? across : own).map(contentHeight)) +
                      largest(own.map(({ marginBottom }) => marginBottom));
            // A row exactly as tall as it says has its border above it inside that height, where one at least as tall has
            // it outside, in a table without space between its cells (word-stops-tables2.docx TS15: rows of exactly 400
            // twips and at least 1000 beside borders of half a point; word-stops-tables.docx TS1a)
            if (height?.rule === "exact" && table.cellSpacing === undefined) {
                return Math.max(height.value, borderTop) + borderBottom;
            }
            const rowHeight = height === undefined ? natural : height.rule === "exact" ? height.value : Math.max(height.value, natural);
            return rowHeight + borderTop + borderBottom;
        });
        // A cell merged down rows has its text between the border above the first of them and the one below the last
        return merges.reduce((current, { first, last, height }) => {
            const missing = rows[first].borderTop + height + rows[last].borderBottom - sum(current.slice(first, last + 1));
            return missing > 0 && rows[last].height?.rule !== "exact"
                ? current.map((value, index) => (index === last ? value + missing : value))
                : current;
        }, heights);
    };

    // The chapter of each block, by the level of the headings that number chapters: the last numbered heading of the
    // level at or before the block, as Word numbers the pages of a page reference by where its bookmark is on the page
    let lastHeadings: readonly (ChapterHeading | undefined)[] = [];
    const chapterHeadings = blocks.map(({ block }) => {
        for (const heading of headingsIn(block)) {
            if (heading.chapter !== undefined || heading.unsupported !== undefined) {
                lastHeadings = Object.assign([...lastHeadings], { [heading.level - 1]: heading });
            }
        }
        return lastHeadings;
    });

    const markersOf = (block: Block): readonly string[] =>
        block.type === "paragraph"
            ? block.items.flatMap((item) => (item.type === "marker" ? [item.name] : []))
            : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));

    // The bookmarks and fields in each footnote and endnote, by the marker at its reference: Word gives them its reference's
    // page and section, even those in the part of a footnote continued on the next page, and an endnote's at the end of the
    // document (`word-watertight-fields.docx` FD4, `word-page-fields.docx` PF7g to PF8c)
    const inNotes = new Map(
        [...footnotes, ...content.endnoteReferences].map(([name, noteBlocks]) => [name, noteBlocks.flatMap(markersOf)] as const),
    );
    // Whether each bookmark of the body and its notes is in a footnote or endnote
    const homes = new Map<string, { readonly inNote: boolean }>();
    for (const { block } of content.blocks) {
        for (const name of markersOf(block)) {
            for (const bookmark of inNotes.get(name) ?? [name]) {
                // eslint-disable-next-line functional/immutable-data
                homes.set(bookmark, { inNote: inNotes.has(name) });
            }
        }
    }

    // The state of the page being filled
    const bookmarks = new Map<string, string>();
    // Where each bookmark and field was placed
    const places = new Map<string, PagePlace>();
    // The height of each header and footer, by the section it is in, whose number of pages it can show
    // eslint-disable-next-line functional/prefer-readonly-type
    const headerHeights = new Map<readonly Block[], Map<number, number>>();
    let pageCount = 0;
    let pageNumber = 0;
    // The first number of a continuous section numbered afresh that started on the page, which the next page is numbered
    // on from
    let restart: number | undefined;
    // The number of each page of the rest of a footnote continued before a continuous section numbered afresh, which Word
    // numbers with the section's first number
    let restNumber: number | undefined;
    // The section whose header and footer the pages of the rest of a footnote before it show, which starts on the page
    // after them
    let restBefore: number | undefined;
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
    // The section whose text's width the page's footnotes were last laid out in, which they are given in
    let notesSection = 0;
    // The section in columns whose columns the page's footnotes are laid out in, when its footnote is the page's first,
    // and where the lines of the columns of the page before the one being filled end, the lowest of them
    let notesInColumns: number | undefined;
    let filledEnd = 0;
    // The room kept at the bottom of pages for their footnotes, by the number of the page, counted from the first, when
    // their columns are laid out again for footnotes referred to from a later column, the footnotes it is kept for, and
    // those whose references are on the next page, as they moved on from the page when it was laid out again
    const reserves = new Map<number, number>();
    // The search, by page, for how much room Word gives a footnote too long for the columns of a page
    const noteSearches = new Map<number, NoteSearch>();
    const reservedFor = new Map<number, readonly string[]>();
    const movedOn = new Map<number, readonly string[]>();
    // The pages whose lines whose footnotes moved on move on from the top of a later column too, guessing
    const movingOn = new Set<number>();
    // The rest of a footnote continued from the page before, above the page's own, and of one continued on the next page
    let continued: NoteRest | undefined;
    let carried: NoteRest | undefined;
    // The footnotes of the lines of a paragraph kept with the next, which go below the next's lines, or below as many of
    // them as it is kept with (`heldLines`) when they continue on the next page
    let held: readonly string[] = [];
    let heldLines: number | undefined;
    // A footnote referred to from the page, none of which goes on it, as it starts on the next, and the footnotes referred
    // to after it, which go after it, on the page it ends on
    let deferred: string | undefined;
    let pending: readonly string[] = [];
    // The space after the last paragraph, which goes before what is next on the page
    let spaceAfter = 0;
    // The cells merged down rows of the table being placed whose text isn't all on a page yet
    let openMerges: readonly OpenMerge[] = [];
    // Whether a header row of the table being placed is taller than a page, and cut off at its bottom
    let cutHeader = false;
    // Until something of the section is placed, the space after the paragraph before it, or 0 at the start of the
    // document. The space before the section's first paragraph isn't left out at the top of a page, or of the column the
    // section starts in, but only as much of it as is more than this goes there
    let sectionSpaceAfter: number | undefined = 0;
    // The column the section starts in: the first, unless it starts in the next column
    let sectionColumn = 0;
    // The section whose columns the page's are, when the section being laid out started in the next column of columns of
    // other widths on it, which Word lays it out in on that page
    let pageColumns: number | undefined;
    // What has been placed on the pages, which laying out blocks again takes back, the last page whose footnotes are
    // placed, the index of the block being placed, and the page the layout stopped on, whose lines might not be Word's
    // eslint-disable-next-line functional/prefer-readonly-type
    const placements: Placement[] = [];
    let finished = 0;
    let blockIndex = 0;
    let stoppedOnPage: number | undefined;
    // The drawings that text flows around on the page, placed with the paragraphs they are anchored in, or from the top of
    // the page when they are beside text before them on it, by the number of the page, counted from the first, and the
    // anchors of those whose paragraphs have been placed on the page
    let drawings: readonly PlacedDrawing[] = [];
    const pinned = new Map<number, readonly PlacedDrawing[]>();
    let anchored: readonly string[] = [];
    // How many times each page has been laid out again for its drawings
    const pageLayouts = new Map<number, number>();

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
        keptOn,
        brokenAcross,
        pageCount,
        pageNumber,
        restart,
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
        notesSection,
        notesInColumns,
        filledEnd,
        continued,
        carried,
        held,
        heldLines,
        deferred,
        pending,
        spaceAfter,
        sectionSpaceAfter,
        placed: placements.length,
        marks: places.size,
        finished,
        pageColumns,
        drawings,
        anchored,
    });
    // The paragraph kept with the next laid out where it is, which the next must start in the page and column of
    let keptOn: KeptOn | undefined;
    // The tables that text flows around broken across pages, whose rows are placed, by their blocks' indexes
    let brokenAcross: ReadonlySet<number> = new Set();
    /** Stops where a block a paragraph is kept with (`keptOn`) starts in another page or column than it ended in */
    const checkKept = (block: number): void => {
        if (keptOn?.next === block) {
            if (keptOn.page !== pageCount || keptOn.column !== column) {
                stopAt(keptOn.reason);
            }
            keptOn = undefined;
        }
    };
    // Where the block being laid out started, and where the block started whose text the page's columns start with
    let blockStart: Snapshot | undefined;
    let columnsStart: Snapshot | undefined;

    /** The bottom of the page's columns: the page's, or less when they are being balanced */
    const columnsBottom = (): number => (balancing?.page === pageCount ? Math.min(pageBottom, columnTop + balancing.height) : pageBottom);

    /**
     * Goes back to where the layout was at the start of a block. The bookmarks placed since are kept, as laying the blocks
     * out again to even out columns only moves them between the columns of the same page
     */
    const restore = (state: Snapshot): void => {
        ({
            keptOn,
            brokenAcross,
            pageCount,
            pageNumber,
            restart,
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
            notesSection,
            notesInColumns,
            filledEnd,
            continued,
            carried,
            held,
            heldLines,
            deferred,
            pending,
            spaceAfter,
            sectionSpaceAfter,
            finished,
            pageColumns,
            drawings,
            anchored,
        } = state);
        // Those placed from the top of the page are on it from the start
        drawings = withPinned(drawings);
        // eslint-disable-next-line functional/immutable-data
        placements.length = Math.min(placements.length, state.placed);
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
        stoppedOnPage = pageCount;
        for (const [name, { page }] of places) {
            if (page === pageCount) {
                // eslint-disable-next-line functional/immutable-data
                bookmarks.delete(name);
                // eslint-disable-next-line functional/immutable-data
                places.delete(name);
            }
        }
        throw new Unsupported(reason);
    };

    // The page what is guessed at is on when it isn't the one being laid out: the next, for its header and footer
    let guessPage: number | undefined;

    /**
     * Stops at what the layout can't lay out as Word does yet, for why (`reason`). Guessing, it goes on instead, with the
     * best guess it has: what is laid out from there is laid out as the layout lays it out without it, so that what was read
     * is laid out as it was read, a line as it was broken, text in a font or with a character the measurer doesn't know as
     * it measures it, and a page as the rule the layout follows nearest to Word's lays it out, as each place that calls
     * this says. The guess is noted on the page it is made on (`page`), once. Where the layout has no guess, it doesn't
     * call this, and stops even when guessing.
     */
    const stopAt = (reason: string, page = guessPage ?? Math.max(pageCount, 1)): void => {
        if (!guess) {
            throw new Unsupported(reason);
        }
        const pageStart = placements.findLastIndex(({ type }) => type === "page");
        const noted = placements
            .slice(pageStart + 1)
            .some((placement) => placement.type === "guess" && placement.reason === reason && placement.page === page);
        if (!noted) {
            // eslint-disable-next-line functional/immutable-data
            placements.push({ type: "guess", reason, page });
        }
    };

    /**
     * Stops at what was read that can't be laid out as Word does yet (see {@link stopAt}): a block, a section, the document,
     * or a table as it is sized. Guessing, it is laid out as it was read, with the guess the reader made, unless the reader
     * had nothing to lay out in its place (`noGuess`), where it stops
     */
    const stopAtRead = ({ unsupported, noGuess }: { readonly unsupported?: string; readonly noGuess?: boolean }, page?: number): void => {
        if (unsupported === undefined) {
            return;
        }
        if (noGuess === true) {
            throw new Unsupported(unsupported);
        }
        stopAt(unsupported, page);
    };

    const section = (): Section => sections[sectionIndex];
    /**
     * The section whose columns the text is laid out in: the one being laid out, or the one whose columns the page's are,
     * for a section that started in the next column of columns of other widths. Word lays that out in the next column of
     * the page, where it is and as wide as it is: after 2 columns of 4153 twips, one of 2000 and 6306 goes on at 4873, its
     * lines broken at 4153 (`word-watertight-stops.docx` SP10, `word-next-column.docx` N4). It goes on in its own columns
     * on the next page, and its footnotes are laid out in its own columns, at 0 and 2720, where its text is at 4873
     * (`word-column-stops.docx` CS1 and CS2)
     */
    const columnsSection = (): Section => sections[pageColumns ?? sectionIndex];
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
        return first === undefined ? undefined : columnsOfNotes(sections[first]);
    };
    /** The columns a section's footnotes are laid out in: their own, or the section's, when it has several */
    const columnsOfNotes = (current: Section): readonly number[] | undefined =>
        current.noteColumns ?? (current.columns.length > 1 ? current.columns : undefined);
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

    /** Which of a section's headers or footers a page shows: the first page's, an even page's or the default, if it has it */
    const kindOf = (parts: HeadersOrFooters, isFirst: boolean): keyof HeadersOrFooters | undefined => {
        const kind = section().titlePage && isFirst ? "first" : evenAndOddHeaders && pageNumber % 2 === 0 ? "even" : "default";
        return parts[kind] ? kind : undefined;
    };

    /** A page's number as its section writes it, unless it starts with a chapter number, which isn't known for the page */
    const pageNumberOf = (current: Section): { readonly pageNumber?: string } => {
        const text = current.chapters ? undefined : formatPageNumber(pageNumber, current.numberFormat);
        return text === undefined ? {} : { pageNumber: text };
    };

    /**
     * Whether the space a line's multiple spacing adds below its text, or a document grid leaves below it (`onGrid`), can go
     * below the bottom of the page, as Word lets it (`word-mixed-heights.docx` MH1c, `word-grid.docx` G1), for a line that
     * fits only without it, and below the bottom of columns evened out by a continuous section break (scripts/layout-probes/stops2/word-stops-text.ts
     * PB7b: the last of four lines at double spacing at the foot of the second column, as it would be without its space
     * below counted). Above footnotes, neither can go into them: a line at double spacing that fits above the page's
     * footnote only without its space below goes on to the next page (stops2/word-stops-text2.ts PB7e), and so does a line
     * on a grid of 360 twips whose room below its text would go a twip to 41 into them (stops2/word-stops-text3.ts PB7h to
     * PB7j). Stops where Word hasn't shown it: room above a paragraph's border below. Guessing, it goes there
     */
    const hangsBelow = (aboveNotes: boolean, aboveBorder = false): boolean => {
        if (aboveNotes) {
            return false;
        }
        if (aboveBorder) {
            stopAt("a line whose room below its text goes below the page, above its paragraph's border");
        }
        return true;
    };

    /** The blocks of the header or footer a page shows, or none */
    const partBlocks = (parts: HeadersOrFooters, isFirst: boolean): readonly Block[] => {
        const kind = kindOf(parts, isFirst);
        return kind === undefined ? [] : parts[kind]!;
    };

    const partHeight = (parts: HeadersOrFooters, isFirst: boolean, width = textWidth()): number => {
        const kind = kindOf(parts, isFirst);
        if (!kind) {
            return 0;
        }
        const part = parts[kind]!;
        part.forEach((block) => stopAtRead(block));
        const bySection = headerHeights.get(part) ?? new Map<number, number>();
        const height = bySection.get(sectionIndex) ?? stackHeight(part, width, false);
        // eslint-disable-next-line functional/immutable-data
        headerHeights.set(part, bySection.set(sectionIndex, height));
        return height;
    };

    /** How many pages the endnotes being laid out are on, those after the same section */
    const endnotePages = (): number => {
        const pages = new Set<number>();
        let page = 0;
        for (const placement of placements) {
            page += placement.type === "page" ? 1 : 0;
            if (
                (placement.type === "line" || placement.type === "row") &&
                isEndnote(placement.block) &&
                blocks[placement.block].section === blocks[blockIndex].section
            ) {
                // eslint-disable-next-line functional/immutable-data
                pages.add(page);
            }
        }
        return pages.size;
    };

    /** Whether the endnotes are on the pages before, so they go on below the continuation separator on the next */
    const endnotesGoOn = (): boolean =>
        isEndnote(blockIndex) &&
        placements.some(
            (placement) =>
                (placement.type === "line" || placement.type === "row") &&
                isEndnote(placement.block) &&
                blocks[placement.block].section === blocks[blockIndex].section,
        );

    /**
     * The room the endnotes' continuation separator takes above them, which is read as Word lays it out, a line tall
     * whatever its own formatting (see `readEndnoteSeparator`)
     */
    const continuationHeight = (): number => {
        endnoteContinuationSeparator.forEach((block) => stopAtRead(block));
        return stackHeight(endnoteContinuationSeparator, textWidth(), false);
    };

    /** Whether a line or row of the section being laid out is on the page */
    const sectionOnPage = (): boolean =>
        placements
            .slice(placements.findLastIndex(({ type }) => type === "page"))
            .some(
                (placement) => (placement.type === "line" || placement.type === "row") && blocks[placement.block].section === sectionIndex,
            );

    const startPage = (isFirstOfSection = false): void => {
        if (balancing !== undefined && pageCount >= balancing.page) {
            // The columns being balanced don't fit on their page in the height they are laid out in
            throw new Overflow();
        }
        // A section laid out in the columns of the page it started in goes on in its own on the next page, as in Word
        // (`word-column-stops.docx` CS1)
        pageColumns = undefined;
        settleNoteSearch();
        checkReserve();
        deferred = undefined;
        checkAnchors();
        checkBeneathText();
        finishPage();
        const current = section();
        // A continuous section none of which is on the page it started on, as its first line didn't fit there, starts on
        // the next, as a section on a new page does: Word numbers that page with the section's first number
        // (`word-watertight-sections.docx` SC2a, SC2c)
        const first =
            isFirstOfSection || (current.start === "continuous" && firstPages.get(sectionIndex) === pageCount && !sectionOnPage());
        // After a continuous section numbered afresh, the page it starts on keeps its number, and the next is numbered on
        // from the section's first number, as Word numbers them (`word-watertight-pages.docx` PG2,
        // `word-watertight-sections.docx` SC2b, SC2d)
        pageNumber = first && current.firstNumber !== undefined ? current.firstNumber : (restNumber ?? (restart ?? pageNumber) + 1);
        restart = undefined;
        // A header or footer taller than the margin pushes the body away from it, unless the margin is negative. What is
        // guessed at in them is on the page they are measured for. On a page of text that runs down it, they are across the
        // page as it is, and a header doesn't push the lines down (scripts/layout-probes/word-grid3.ts VH1), but how a
        // footer would push them up isn't known. The section's page is then turned on its side: the page's width is its
        // height, and the page's bottom margin its right one
        const down = current.textRunsDown;
        const across = down === undefined ? textWidth() : current.pageHeight - current.marginTop - current.marginBottom;
        guessPage = pageCount + 1;
        // The header and footer the page shows: its section's, or before a section, those of the section after the rest of
        // a footnote on it
        const shown: Section =
            restBefore === undefined
                ? current
                : {
                      ...current,
                      header: sections[restBefore].header,
                      footer: sections[restBefore].footer,
                      headers: sections[restBefore].headers,
                      footers: sections[restBefore].footers,
                  };
        // The header's lines go round its drawings and the footer's that are beside them, but a footer's beside its own
        // lines, which may too, stop the layout
        const partsDrawn = [...partDrawings(shown, first, "headers"), ...partDrawings(shown, first, "footers")];
        const plainHeader = partHeight(shown.headers, first, across);
        const textLeft = columnLeft(current, 0);
        /** The drawings beside the text of a header or footer, from its top to its bottom, across the text of the page */
        const besideText = (from: number, to: number): readonly PlacedDrawing[] =>
            partsDrawn.filter(({ keepOut }) =>
                overlap(keepOut, { left: textLeft, right: textLeft + textWidth(current), top: from, bottom: to }),
            );
        const besideHeader = besideText(shown.header, shown.header + plainHeader);
        const headerBottom =
            shown.header +
            (besideHeader.length > 0 ? headerBeside(partBlocks(shown.headers, first), besideHeader, shown.header, shown) : plainHeader);
        const footerTop = shown.footer + partHeight(shown.footers, first, across);
        const besideFooter = besideText(shown.pageHeight - footerTop, shown.pageHeight - shown.footer);
        if (besideFooter.length > 0) {
            stopAt("a drawing that text flows around in a header or footer, beside a footer's text");
        }
        if (down !== undefined && footerTop > current.marginRight + TOLERANCE) {
            stopAt("a footer that goes above the bottom margin of text that runs down the page");
        }
        guessPage = undefined;
        pageCount++;
        const header = kindOf(shown.headers, first);
        const footer = kindOf(shown.footers, first);
        // eslint-disable-next-line functional/immutable-data
        placements.push({
            type: "page",
            page: {
                ...pageNumberOf(current),
                section: sectionIndex,
                width: down === undefined ? current.pageWidth : current.pageHeight,
                height: down === undefined ? current.pageHeight : current.pageWidth,
                ...(down === undefined ? {} : { textRunsDown: down }),
                ...(header ? { header } : {}),
                ...(footer ? { footer } : {}),
            },
        });
        // A gutter at the top is below the top margin, and a header taller than both pushes the body below it, as in Word,
        // where the header stays where it is (`word-watertight-sections.docx` SC3). It is at the top of every page with
        // mirrored margins too, and below a negative top margin, which the header doesn't push the body below
        // (`word-stops-pages.docx` GT1a, GT1b)
        top =
            down !== undefined
                ? current.marginTop
                : current.marginTop < 0
                  ? -current.marginTop + current.topGutter
                  : Math.max(current.marginTop + current.topGutter, headerBottom);
        // On each page after the first the endnotes are on, the continuation separator is above them, whether one of them
        // goes on to it or the next starts there (`word-watertight-pages.docx` PG8, `word-watertight-sections.docx` SC4).
        // In columns, guessing, it is across the top of the page
        const endnotesOn = endnotesGoOn();
        const continuation = endnotesOn ? continuationHeight() : 0;
        // In columns, the continuation separator is at the top of the first only, and the others start at the top of the
        // page (`word-stops-endnotes.docx` NE1). Whether the first then goes past the margin, as the endnotes do across the
        // page, isn't known: they are laid out above it, and where they don't fit on the page that way, the layout stops
        const endnoteColumns = endnotesOn && current.columns.length > 1;
        if (endnoteColumns && endnotePages() > 1) {
            stopAt("endnotes in columns across more than two pages");
        }
        top += continuation;
        // Below it, Word puts as many lines of endnotes as fit on the page without it, so they can go past the margin by as
        // much as it takes: 48 lines exactly 288 twips tall below one 268.55 tall, where 47 end above the margin, and a line
        // of 183 and 47 of 288 (`word-watertight-endnotes1.docx` to `3`), as 51 lines of Calibri 11 fit below it as they
        // do on a page of text (`word-watertight-sections.docx` SC4). No footnote goes on to such a page, as one only goes
        // on from a line of the body, which ends its page
        pageBottom =
            current.pageHeight -
            (down !== undefined
                ? current.marginBottom
                : current.marginBottom < 0
                  ? -current.marginBottom
                  : Math.max(current.marginBottom, footerTop)) +
            (endnoteColumns ? 0 : continuation);
        position = top;
        column = 0;
        columnTop = endnoteColumns ? top - continuation : top;
        bottom = columnsBottom();
        placedInColumn = false;
        deepest = 0;
        columnBroken = false;
        columnsStart = blockStart;
        spaceAfter = 0;
        pageNotes = [];
        notesInColumns = undefined;
        filledEnd = 0;
        drawings = [...withPinned([]), ...partsDrawn.filter((drawing) => !besideFooter.includes(drawing))];
        anchored = [];
        continued = carried;
        carried = undefined;
        if (continued !== undefined && columnsOfNotes(current) !== undefined) {
            // The rest of a footnote goes on at the foot of the next page's columns, as Word continues it (FN2, FN3)
            notesInColumns = sectionIndex;
        }
        noteArea = Math.max(areaOf([], undefined, continued), reserved());
        notesSection = sectionIndex;
        if (noteArea > 0 && drawings.some(({ keepOut }) => keepOut.bottom > linesBottom() + TOLERANCE)) {
            // A header's or footer's drawing beside the rest of a footnote continued from the page before, which Word may lay
            // out round it. Guessing, as if it were above it
            stopAt(BESIDE_NOTES);
        }
        if (continued !== undefined && noteArea > bottom - top + TOLERANCE) {
            // The rest of the footnote is longer than the page, so the page is all footnote, as much of it as fits, and the
            // rest continues on the next page. The text goes on above its last part, on the page it ends on
            // (`word-probes.docx` U2o, U2q)
            if (first && current.firstNumber !== undefined) {
                // Before a section on a new page, its pages are the section before's (`word-watertight-stops.docx` SP2),
                // and after a continuous one that starts on the page of a line whose footnote starts on the next page, the
                // section after's, with its header and footer, as Word numbered them on, and showed the footer both have,
                // as it shows the header and footer of the section after the rest of one continued (stops2/word-stops-notes2.ts
                // NT2c, NT2d). How Word numbers them before one numbered afresh, as each of those pages has its first number
                // where the rest of a footnote continued goes before it (NT2b), isn't known. Guessing, from its first number
                stopAt("a footnote that starts on the page after its reference's, before a continuous section numbered afresh");
            }
            const { name, from } = continued;
            // As where it first breaks (see `splitLast`), which one that starts on the page after its reference's hasn't been
            if (footnotes.get(name)!.some(boxedOrSpaced)) {
                stopAt(BOXED_NOTE);
            }
            const to = fillNote(name, from, (point) => areaOf([], undefined, { name, from, to: point }) <= bottom - top + TOLERANCE, true);
            if (to.block === from.block && to.line === from.line && to.cut?.length === from.cut?.length) {
                throw new Unsupported("a footnote line taller than a page");
            }
            carried = { name, from: to };
            startPage();
            return;
        }
        if (pending.length > 0) {
            // The footnotes referred to after one that started on the page after its reference's go below its end, on the
            // page it ends on, though they would fit on their references' page (`word-watertight-notes.docx` FN8), and the
            // last of them goes on to the next page as far as it doesn't fit there: 3 lines of one of 10 below the end of
            // one of 95, and 7 on the next (stops2/word-stops-notes2.ts NT3b)
            pageNotes = pending;
            pending = [];
            noteArea = Math.max(areaOf(pageNotes, undefined, continued), reserved());
            if (noteArea > bottom - top + TOLERANCE) {
                if (leastAreaOf(pageNotes, continued) > bottom - top + TOLERANCE) {
                    // Where none of the last fits below its end, whether Word moves it on whole isn't known
                    throw new Unsupported(
                        "footnotes after one that starts on the next page, the last of which doesn't start below its end",
                    );
                }
                splitLast(pageNotes.slice(0, -1), pageNotes[pageNotes.length - 1], bottom - top);
            }
        }
    };

    /** Moves to the top of the next column, or of the next page after the last column */
    const nextColumn = (): void => {
        if (column + 1 >= columnsSection().columns.length) {
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

    /** Whether two sections' pages have the same margins */
    const sameMargins = (one: Section, other: Section): boolean =>
        one.marginTop === other.marginTop &&
        one.marginBottom === other.marginBottom &&
        one.marginLeft === other.marginLeft &&
        one.marginRight === other.marginRight &&
        one.gutter === other.gutter &&
        one.topGutter === other.topGutter;

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
     * in the next column, which Word leaves as they are, in the last column (`word-next-column.docx` N6) and with columns
     * after it: 10 lines in the second of 3 stay there (`word-watertight-stops.docx` SP11). The next section starts below
     * the lowest of the columns and the space after the paragraph each ends with, and its space before is only as much as
     * is more than the space after the section's last paragraph: the empty one that ends it, when there is one, whose
     * space after is not below the columns itself (`word-rules2.docx` Q7b). Their footnotes stay at the bottom of the page, in
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
        if ((pinned.get(pageCount) ?? []).length > 0) {
            // Word evens columns out with drawings in them as without (`word-floats2.docx` G21), but how with drawings laid
            // out from the top of the page, beside text before them, isn't known
            throw new Unsupported("columns evened out beside a drawing placed beside text before it");
        }
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
        try {
            while (tall - short > TOLERANCE) {
                const middle = (short + tall) / 2;
                if (fitsIn(middle)) {
                    tall = middle;
                } else {
                    short = middle;
                }
            }
            layOut(tall);
        } catch (error) {
            // Where the columns would be isn't known, so what is in them isn't placed
            restore(from);
            throw error;
        }
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
        // The rest of a footnote continued from the section's last page goes on pages of the section, with no text, and the
        // next section starts on the page after them, as in Word: its last part too, which would have room for text, and
        // a continuous section too, which starts on a new page then (`word-watertight-stops.docx` SP2,
        // `word-watertight-notes.docx` FN4, FN5). After a line whose footnote starts on the next page, there is room for a
        // continuous section on its page, and it goes on there
        const restOnPages =
            carried !== undefined &&
            !startsInNextColumn(previous, current) &&
            (deferred === undefined || !continuesOnPage(previous, current));
        if (carried !== undefined && previous.columns.length > 1 && startsInNextColumn(previous, current)) {
            // In columns, the text goes on above a footnote that continues, and whether Word puts a section that starts in
            // the next column there isn't known. Before a continuous one, the rest goes on pages of its own, in the columns,
            // evened out on the last, and the section starts on the next, as across the page (stops2/word-stops-notes2.ts
            // NT4b)
            throw new Unsupported("a footnote continued from columns before a section in the next column");
        }
        if (restOnPages && continuesOnPage(previous, current)) {
            // Before a continuous section, Word numbers each of those pages with the section's first number, when it has one,
            // as it numbers a page the section starts on but none of it is on (SC2a, SC2c): pages of a footnote of 120 lines,
            // before a section numbered from 1, were each page 1, and so was the section's own first page, and each
            // section's number of pages was 1 (`word-stops-notes.docx` NT2b). The next section's is its own pages, as Word
            // counted it after a footnote's rest on pages numbered on too (`word-watertight-notes.docx` FN5), but the first
            // section's, which leaves out its pages of the footnote, isn't followed, so it isn't known, nor which section's
            // headers and footers the pages have where they differ, which would change how much of the footnote goes on them
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(sectionIndex);
            restNumber = current.firstNumber;
            // They show the next section's header and footer, as Word showed a taller footer of its own, which leaves room
            // for fewer lines of the footnote (stops2/word-stops-notes2.ts NT2c). With a first page of its own, or other
            // margins, which the pages may have too, they haven't been seen
            restBefore = index;
            if (current.titlePage || !sameMargins(previous, current)) {
                // Guessing, on the first of those pages, which the page after this starts
                stopAt(
                    "a footnote continued across a continuous section break onto pages of its own, before a section with a first page or margins of its own",
                    pageCount + 1,
                );
            }
        }
        if (restOnPages) {
            // As many pages as the rest takes, with that of a footnote after it that goes on past its end (NT3b)
            do {
                startPage();
            } while (carried !== undefined);
            restNumber = undefined;
            restBefore = undefined;
        }
        // eslint-disable-next-line functional/immutable-data
        lastPages.set(sectionIndex, pageCount);
        // A section with no paragraphs of its own, which isn't laid out
        for (let skipped = sectionIndex + 1; skipped < index; skipped++) {
            // eslint-disable-next-line functional/immutable-data
            sharingPages.add(skipped);
        }
        // Guessing, a section is laid out as it was read, on the page it starts on
        stopAtRead(current, continuesOnPage(previous, current) || startsInNextColumn(previous, current) ? pageCount : pageCount + 1);
        const continuous = continuesOnPage(previous, current) && !restOnPages;
        if (continuous && previous.columns.length > 1 && (placedInColumn || column > 0)) {
            endColumns(firstBlock);
        }
        const inNextColumn = startsInNextColumn(previous, current);
        // One that starts in the next column of columns of other widths, or of columns that start elsewhere across the
        // page, is laid out in the page's columns, as Word lays it out
        const onPage = columnsSection();
        pageColumns =
            inNextColumn &&
            onPage.columns.some((width, at) => width !== current.columns[at] || columnLeft(onPage, at) !== columnLeft(current, at))
                ? (pageColumns ?? sectionIndex)
                : undefined;
        // The columns of the page before one that starts in the next column end above its footnotes too
        filledEnd = inNextColumn ? Math.max(filledEnd, position) : 0;
        // The space after the empty paragraph that ends the section, when there is one, which isn't on the page itself
        const end = blocks[firstBlock - 1].block;
        sectionSpaceAfter =
            end.type === "paragraph" && end.sectionBreak
                ? end.format.autoSpaceAfter === true
                    ? 0
                    : (end.format.spaceAfter ?? 0)
                : spaceAfter;
        sectionColumn = 0;
        const before = sectionIndex;
        sectionIndex = index;
        if (continuous) {
            // The section's columns start below what is on the page. One numbered afresh numbers the pages after this one
            column = 0;
            columnTop = position;
            restart = current.firstNumber ?? restart;
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
        // Word goes by the page's number before the section numbers its pages from its own first number: after page 6, it
        // leaves a blank page before a section that starts on an even page numbered from 2 (word-positions.docx H3). Whether
        // it goes by the number or by where the page is in the document, which are the same there, isn't known
        const nextNumber = (restart ?? pageNumber) + 1;
        if ((current.start === "evenPage" && nextNumber % 2 !== 0) || (current.start === "oddPage" && nextNumber % 2 === 0)) {
            // A blank page, so the section starts on an even or odd page, which isn't either section's. It has no header
            // or footer in Word (word-positions.docx H1 and H2)
            finishPage();
            pageCount++;
            pageNumber = nextNumber;
            restart = undefined;
            finished = pageCount;
            // eslint-disable-next-line functional/immutable-data
            placements.push({
                type: "page",
                page: { ...pageNumberOf(previous), section: before, width: previous.pageWidth, height: previous.pageHeight },
            });
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
     * `separatorAfter`). Each paragraph (`measure`, by its index, of `count`) is broken into lines at the width of the
     * column each goes in (`columns`), so the part of it that goes on into a column of another width is broken again there,
     * as Word breaks it (`word-watertight-stops.docx` SP7). Each line placed is given to `place`, with the column it is in,
     * how far down it its top is, and the line
     */
    const fillNoteColumns = (
        count: number,
        measure: (paragraph: number, widths: LineWidths) => MeasuredParagraph,
        columns: readonly number[],
        separator: number,
        separatorAfter: number | undefined,
        height: number,
        place: NotePlace = () => undefined,
    ): number | undefined => {
        let noteColumn = 0;
        let used = separator;
        let above = separatorAfter;
        let tallest = separator;
        for (let at = 0; at < count; at++) {
            let from = 0;
            let widths: LineWidths = [];
            for (;;) {
                widths = widthsFrom(widths, from, columns[noteColumn]);
                const paragraph = measure(at, widths);
                if (from >= paragraph.lines.length) {
                    above = paragraph.spaceAfter;
                    break;
                }
                const space = above === undefined ? 0 : between(above, from === 0 ? paragraph.spaceBefore : 0);
                const rest = paragraph.lines.slice(from);
                const placed = linesThatFit(rest, height - used - space, paragraph, from === 0).count;
                for (const [offset, line] of rest.slice(0, placed).entries()) {
                    place(at, from + offset, noteColumn, used + space + linesHeight(rest.slice(0, offset)), line);
                }
                used += placed > 0 ? space + linesHeight(rest.slice(0, placed)) : 0;
                tallest = Math.max(tallest, used);
                from += placed;
                if (from < paragraph.lines.length) {
                    noteColumn++;
                    if (noteColumn >= columns.length) {
                        return undefined;
                    }
                    used = separator;
                    above = separatorAfter;
                }
            }
        }
        return tallest;
    };

    /** The blocks of a part of a footnote, each with the first of its lines or rows in the part, and the one after the last */
    const piecesOf = ({ name, from = { block: 0, line: 0 }, to }: NotePart): readonly NotePiece[] =>
        footnotes.get(name)!.flatMap((block, index) =>
            index < from.block || (to !== undefined && (index > to.block || (index === to.block && to.line === 0 && to.cut === undefined)))
                ? []
                : [
                      {
                          block,
                          note: name,
                          index,
                          start: index === from.block ? from.line : 0,
                          end: to !== undefined && index === to.block ? to.line + (to.cut === undefined ? 0 : 1) : undefined,
                          ...(index === from.block && from.cut !== undefined ? { startCut: from.cut } : {}),
                          ...(to !== undefined && index === to.block && to.cut !== undefined ? { endCut: to.cut } : {}),
                      },
                  ],
        );

    // The parts of the table rows in footnotes filled on the page, by the rooms they were cut at, one after the other, which
    // the search for a row's cut and the notes' heights ask for again and again: filled afresh on each page, as its lines
    // may be measured with its page number
    // eslint-disable-next-line functional/prefer-readonly-type
    type FilledParts = { readonly parts: readonly CellPart[]; readonly after: Map<number, FilledParts> };
    // eslint-disable-next-line functional/prefer-readonly-type
    let filledNoteParts = { page: 0, rows: new WeakMap<TableRow, Map<number, FilledParts>>() };

    /**
     * Each cell's part of a table row in a footnote that breaks across pages, in the room for the row's last part, after
     * its parts in the rooms before (`cuts`), with the row's margins around it, as a row of the text breaks (see `splitRow`)
     */
    const notePartsOf = (row: TableRow, cuts: readonly number[]): readonly CellPart[] => {
        if (filledNoteParts.page !== pageCount) {
            filledNoteParts = { page: pageCount, rows: new WeakMap() };
        }
        let filled = filledNoteParts.rows.get(row) ?? new Map<number, FilledParts>();
        filledNoteParts.rows.set(row, filled);
        let parts: readonly CellPart[] = [];
        for (const [at, cut] of cuts.entries()) {
            const before = parts;
            const known = filled.get(cut) ?? {
                parts: row.cells.map((cell, index) =>
                    fillCell(at === 0 ? cellParagraphs(cell) : before[index].rest, cut - rowMarginsOf(row), at === 0),
                ),
                after: new Map<number, FilledParts>(),
            };
            // eslint-disable-next-line functional/immutable-data
            filled.set(cut, known);
            ({ parts } = known);
            filled = known.after;
        }
        return parts;
    };

    /**
     * Why Word's breaking of a table row in a footnote isn't known, when it isn't: one with cells merged down rows, a table
     * in a cell, text that runs up or down a cell, or a height of its own
     */
    const unbrokenInNote = ({ cells, height }: TableRow): string | undefined =>
        height !== undefined ||
        cells.some(
            ({ verticalMerge, vertical, blocks: stack }) =>
                verticalMerge !== undefined || vertical || stack.some(({ type }) => type === "table"),
        )
            ? "a table row in a footnote across pages with cells merged down rows, a table in a cell, text running up or down or a height"
            : undefined;

    /**
     * The room a table row in a footnote that breaks across pages is cut at, after its parts cut before (`before`), as low as
     * it fits (`fits`), as a row of the text is: each time the part doesn't fit, just above the bottom of the lowest of its
     * cells' lines. Undefined where a cell with lines left would have none of them, as widow control holds them back, and
     * the row moves to the next page whole, as Word moved a row whose cell of 3 lines couldn't go beside 2 of the other's 6
     * (`word-notes-across-pages.docx` NP3), as a row of the text does. Where the rest of the row doesn't fit, no part taller
     * than the page does either, so the search goes on from there, rather than a line at a time from the rest's end, which
     * would take as many tries as the rest has lines on each page it goes on to
     */
    const noteRowCut = (row: TableRow, fits: (cut: number) => boolean, before: readonly number[] = []): number | undefined => {
        const margins = rowMarginsOf(row);
        const { pageWidth, pageHeight } = section();
        const page = Math.max(pageWidth, pageHeight);
        const withLines =
            before.length === 0
                ? row.cells.map((cell) => cellParagraphs(cell).length > 0)
                : notePartsOf(row, before).map(({ rest }) => rest.length > 0);
        let cut = Infinity;
        for (;;) {
            const parts = notePartsOf(row, [...before, cut]);
            if (parts.some(({ lines }, cell) => withLines[cell] && lines.length === 0)) {
                return undefined;
            }
            if (fits(cut)) {
                return cut;
            }
            cut = Math.min(margins + Math.max(...parts.map(({ height }) => height)) - 2 * TOLERANCE, page);
        }
    };

    /**
     * How tall the rows of a table in a footnote are from one (`start`) to the one before another (`end`), with the rest of
     * the first and the first part of the last where they break across pages, as a row of the text's are: each part with the
     * row's borders and margins, and the first with the table's bottom border below it, where the table breaks
     */
    const noteRowHeights = (
        table: TableBlock,
        { start, end = table.rows.length, startCut, endCut }: Pick<NotePiece, "start" | "end" | "startCut" | "endCut">,
    ): readonly number[] => {
        const bottomBorder = table.rows[table.rows.length - 1].borderBottom;
        return rowHeights(table)
            .slice(start, end)
            .map((height, offset) => {
                const index = start + offset;
                const row = table.rows[index];
                const tallest = (parts: readonly CellPart[]): number =>
                    rowMarginsOf(row) + Math.max(0, ...parts.map((part) => part.height)) + row.borderTop + row.borderBottom;
                if (index === end - 1 && endCut !== undefined) {
                    return tallest(notePartsOf(row, endCut)) + (index < table.rows.length - 1 ? (row.breakBorder ?? bottomBorder) : 0);
                }
                return index === start && startCut !== undefined
                    ? tallest(notePartsOf(row, startCut).map(({ rest }) => fillCell(rest, Infinity, false)))
                    : height;
            });
    };

    /**
     * The footnotes at the bottom of the page: the separator's line above them, the rest of a footnote continued from the
     * page before (`from`), their blocks, and the first part of one continued on the next page (`split`), without the space
     * before the first or after the last, as LibreOffice lays them out, with the room they take (`area`). In columns
     * (`columns`), Word lays them out in the columns, one after the other from the first, with the separator at the top of
     * each, and evens them out, as it evens out columns before a continuous section break: the room is the tallest, in the
     * shortest height they fit in (`word-footnotes-in-columns.docx` N2, N4 and N9), and `fillColumns` says where each of
     * their lines goes then. Across the page, they are as wide as its text (`fullWidth`)
     */
    const noteStack = (
        notes: readonly string[],
        split: NotePart | undefined,
        from: NotePart | undefined,
        columns = noteColumns(),
        fullWidth = textWidth(),
    ): {
        readonly pieces: readonly NotePiece[];
        readonly parts: readonly StackPart[];
        readonly separatorCount: number;
        readonly width: number;
        readonly area: number;
        readonly measured: (piece: NotePiece, index: number) => MeasuredParagraph;
        readonly fillColumns?: (place: NotePlace) => void;
    } => {
        // The rest of a footnote from the page before has the continuation separator above it, but one that starts on the
        // page, after its reference's page (`word-watertight-stops.docx` SP5), has the separator
        const continuedFrom = from !== undefined && !atStart(from.from);
        const separator = continuedFrom ? footnoteContinuationSeparator : footnoteSeparator;
        const pieces = [
            ...separator.map((block, index): NotePiece => ({ block, index, start: 0, end: undefined })),
            ...(from === undefined ? [] : piecesOf(from)),
            ...notes.flatMap((name) => piecesOf({ name })),
            ...(split === undefined ? [] : piecesOf(split)),
        ];
        pieces.forEach(({ block }) => stopAtRead(block));
        // Borders and automatic spacing take room in a footnote as in the text: a box's top border above its first
        // paragraph, its bottom border below its last, 14 points of automatic spacing below the separator and between
        // paragraphs, and the last paragraph's automatic space after kept at the foot of the page (scripts/layout-probes/stops2/word-stops-notes.ts
        // NT13a to NT13c). Word's way with them in a footnote across pages (see `splitLast`) or in columns, and with one
        // box across two footnotes, hasn't been seen. Guessing, they are as in a footnote on its page
        if (columns !== undefined && pieces.some(({ block }) => boxedOrSpaced(block))) {
            stopAt(BOXED_NOTE);
        }
        if (
            pieces.some(
                ({ block, note }, index) =>
                    block.type === "paragraph" &&
                    block.borders !== undefined &&
                    index > 0 &&
                    pieces[index - 1].note !== note &&
                    pieces[index - 1].block.type === "paragraph" &&
                    (pieces[index - 1].block as ParagraphBlock).borders?.outline === block.borders.outline,
            )
        ) {
            stopAt("footnotes next to each other with the same borders");
        }
        const width = columns?.[0] ?? fullWidth;
        /**
         * A piece's paragraph, with only its lines in the piece, broken at a width or at the widths of the columns its
         * lines go in, or its table's rows as a line that doesn't break, at the width of the column it goes in
         */
        const measured = (piece: NotePiece, index: number, widths: number | LineWidths = width): MeasuredParagraph => {
            const { block, start, end } = piece;
            if (block.type === "table") {
                const tableWidth = typeof widths === "number" ? widths : widths[0].width;
                return {
                    ...UNBROKEN,
                    lines: [{ height: sum(noteRowHeights(sizedToPlace(block, tableWidth), piece)), markers: [], text: "", textWidth: 0 }],
                };
            }
            const paragraph = measureParagraph(block, widths, pieces[index - 1]?.block, pieces[index + 1]?.block);
            // The lines continued from the page before have no space before them
            const spaceBefore = continuedFrom && index === separator.length ? 0 : paragraph.spaceBefore;
            return { ...paragraph, spaceBefore, lines: paragraph.lines.slice(start, end) };
        };
        const parts = pieces.map((piece, index): StackPart => {
            const { lines, spaceBefore, spaceAfter: after, borderAbove, borderBelow } = measured(piece, index);
            return { height: borderAbove + linesHeight(lines) + borderBelow, before: spaceBefore, after };
        });
        const stack = { pieces, parts, separatorCount: separator.length, width, measured };
        if (columns !== undefined) {
            // The rest of a footnote continued from the page before isn't laid out in columns: the layout stops there
            const separatorParts = parts.slice(0, separator.length);
            const separatorHeight = heightOf(separatorParts, false);
            const separatorAfter = separatorParts[separatorParts.length - 1]?.after;
            const fill = (height: number, place?: NotePlace): number | undefined =>
                fillNoteColumns(
                    pieces.length - separator.length,
                    (paragraph, widths) => measured(pieces[separator.length + paragraph], separator.length + paragraph, widths),
                    columns,
                    separatorHeight,
                    separatorAfter,
                    height,
                    place,
                );
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
            return { ...stack, area: fill(tall)!, fillColumns: (place) => void fill(tall, place) };
        }
        const last = pieces[pieces.length - 1]?.block;
        const keptAfter = last?.type === "paragraph" && last.format.autoSpaceAfter === true ? parts[parts.length - 1].after : 0;
        return { ...stack, area: heightOf(parts, false) + keptAfter };
    };

    /** The room footnotes take at the bottom of the page, as {@link noteStack} lays them out */
    const areaOf = (notes: readonly string[], split: NotePart | undefined, from: NotePart | undefined, columns = noteColumns()): number =>
        notes.length === 0 && split === undefined && from === undefined ? 0 : noteStack(notes, split, from, columns).area;

    /** Where a section's text, or one of its columns, starts across the page, in points from its left edge */
    const columnLeft = (current: Section, index: number): number => {
        const { columns } = current;
        const space = columns.length > 1 ? (textWidth(current) - sum(columns)) / (columns.length - 1) : 0;
        return current.marginLeft + current.gutter + sum(columns.slice(0, index)) + index * space;
    };

    /**
     * A line placed with its top at a height (`y`), in the room between its paragraph's indents in a width that starts at
     * `left`: a column, or the page's text. The first line of a paragraph starts at its first line indent
     */
    const placedLine = (
        line: LaidOutLine,
        { indentLeft = 0, indentRight = 0, firstLineIndent = 0 }: ParagraphFormat,
        isFirst: boolean,
        left: number,
        width: number,
        y: number,
        room?: LineRoom,
    ): LineLayout => {
        const indent = room?.start ?? line.start ?? indentLeft + (isFirst ? firstLineIndent : 0);
        return {
            text: line.text,
            x: left + indent,
            y,
            width: (room?.end ?? width - indentRight) - indent,
            height: line.height,
            textWidth: line.textWidth,
        };
    };

    /**
     * The footnotes at the bottom of the page, with where their lines and rows are: across the page, in the width of the
     * text of the section they were laid out in, or in the columns of the section whose columns they are laid out in. The last of them is cut
     * where it continues on the next page, and the rest of one continued from the page before is only as much of it as
     * fits, when the page is all footnote
     */
    const footnotesOnPage = (): readonly NoteLayout[] => {
        if (pageNotes.length === 0 && continued === undefined) {
            return [];
        }
        // The width the page's footnotes were laid out in when the room for them was worked out
        const current = sections[notesSection];
        const split =
            carried !== undefined && pageNotes[pageNotes.length - 1] === carried.name
                ? { name: carried.name, to: carried.from }
                : undefined;
        const from = continued && { ...continued, ...(carried !== undefined && split === undefined ? { to: carried.from } : {}) };
        const columns = noteColumns();
        const stack = noteStack(split ? pageNotes.slice(0, -1) : pageNotes, split, from, columns, textWidth(current));
        // Below the text of the page, when their section puts them there (`word-stops-notes.docx` NT14c)
        const notesTop = current.footnotesBeneathText ? Math.min(position, pageBottom - stack.area) : pageBottom - stack.area;
        /** A line of a piece placed: the line, where its room starts across the page and its top, and its width */
        type PlacedLine = {
            readonly line: LaidOutLine;
            readonly isFirst: boolean;
            readonly left: number;
            readonly y: number;
            readonly width: number;
        };
        /** A piece's lines, each at a height, in a column, or its table's rows from a height, in its column's width */
        const blockAt = (piece: NotePiece, at: readonly PlacedLine[]): BlockLayout => {
            const { block, start } = piece;
            if (block.type === "table") {
                const heights = noteRowHeights(sizedToPlace(block, at[0].width), piece);
                return {
                    type: "table",
                    index: piece.index,
                    rows: heights.map((height, row) => ({ index: start + row, y: at[0].y + sum(heights.slice(0, row)), height })),
                };
            }
            return {
                type: "paragraph",
                index: piece.index,
                lines: at.map(({ line, isFirst, left, y, width }) => placedLine(line, block.format, isFirst, left, width, y)),
            };
        };
        // eslint-disable-next-line functional/prefer-readonly-type
        const placed: PlacedLine[][] = stack.pieces.map(() => []);
        if (stack.fillColumns !== undefined) {
            const noteSection = sections[notesInColumns!];
            stack.fillColumns((paragraph, line, noteColumn, offset, laidOut) => {
                const { start } = stack.pieces[stack.separatorCount + paragraph];
                const noteWidths = columnsOfNotes(noteSection)!;
                // eslint-disable-next-line functional/immutable-data
                placed[stack.separatorCount + paragraph].push({
                    line: laidOut,
                    isFirst: start + line === 0,
                    left:
                        noteSection.noteColumns === undefined
                            ? columnLeft(noteSection, noteColumn)
                            : noteSection.marginLeft +
                              noteSection.gutter +
                              sum(noteWidths.slice(0, noteColumn)) +
                              noteColumn * NOTE_COLUMN_SPACE,
                    y: notesTop + offset,
                    width: noteWidths[noteColumn],
                });
            });
        } else {
            let y = notesTop;
            for (const [index, piece] of stack.pieces.entries()) {
                y += index === 0 ? 0 : stack.parts[index - 1].height + between(stack.parts[index - 1].after, stack.parts[index].before);
                const { lines, borderAbove } = stack.measured(piece, index);
                for (const [line, laidOut] of lines.entries()) {
                    // eslint-disable-next-line functional/immutable-data
                    placed[index].push({
                        line: laidOut,
                        isFirst: piece.start + line === 0,
                        left: columnLeft(current, 0),
                        y: y + borderAbove + linesHeight(lines.slice(0, line)),
                        width: stack.width,
                    });
                }
            }
        }
        return groupedNotes(
            stack.pieces.flatMap((piece, index) =>
                piece.note === undefined || placed[index].length === 0 ? [] : [{ note: piece.note, block: blockAt(piece, placed[index]) }],
            ),
            (note) => (footnotesOnEachPage.has(note) ? onPageNumber(note) : footnoteNumbers.get(note)!),
        );
    };

    /** Places the footnotes at the bottom of the page when it is full, once */
    const finishPage = (): void => {
        if (finished === pageCount) {
            return;
        }
        finished = pageCount;
        const notes = footnotesOnPage();
        if (notes.length > 0) {
            // eslint-disable-next-line functional/immutable-data
            placements.push({ type: "footnotes", notes });
        }
    };

    /** Places a row of the table being placed, or the part of it on the page */
    const placeRow = (index: number, y: number, height: number): void => {
        checkKept(blockIndex);
        // eslint-disable-next-line functional/immutable-data
        placements.push({ type: "row", block: blockIndex, row: { index, y, height } });
    };

    const notesIn = (markers: readonly string[]): readonly string[] => markers.filter((name) => footnotes.has(name));

    /** Places the rows of a table that text flows around down from the top of where it was placed */
    const placeFloatingRows = ({ index, heights }: FloatingTable, from: number): void => {
        mark(markersOf(blocks[index].block));
        heights.reduce((y, height, row) => {
            // eslint-disable-next-line functional/immutable-data
            placements.push({ type: "row", block: index, row: { index: row, y, height } });
            return y + height;
        }, from);
    };

    /** The room footnotes take at the bottom of the page, or the room kept for them there, when that is more */
    const pageArea = (notes: readonly string[], split?: NotePart): number => Math.max(reserved(), areaOf(notes, split, continued));

    /**
     * The room footnotes take below those on the page already. Those of another section are laid out in the columns of
     * the page's first footnote's section with the others, one after the other from the first column, whatever its own
     * columns (`word-watertight-stops.docx` SP6, `word-watertight-notes.docx` FN14 and FN15). Those referred to after a
     * footnote that starts on the next page take none, as they go after it
     */
    const moreNoteRoom = (notes: readonly string[]): number =>
        notes.length === 0 || deferred !== undefined ? 0 : pageArea([...pageNotes, ...notes]) - noteArea;

    /**
     * Whether footnotes referred to below one that continues on the next page in columns, where the text goes on above it,
     * have no room on the page: Word put the line referring to one on the next page, below the rest of the one that
     * continues, though the second column had room for it at its top (stops2/word-stops-notes2.ts NT5b)
     */
    const belowContinued = (): boolean => carried !== undefined && columnsSection().columns.length > 1;

    /**
     * Puts footnotes at the bottom of the page. Every column of the page ends above them, whichever it is they are
     * referred to from, as in Word (`word-footnotes-in-columns.docx` N1 and N3), so the columns before the one being
     * filled are laid out again when they go down further than these leave room for
     */
    const addNotes = (notes: readonly string[]): void => {
        startNoteColumns();
        const before = pageNotes;
        pageNotes = [...pageNotes, ...notes];
        noteArea = pageArea(pageNotes);
        notesSection = sectionIndex;
        // Only when they take more room than was kept for them, as a line that doesn't fit in a column at all can still go
        // down further
        if (noteArea > reserved() + TOLERANCE && filledEnd > pageBottom - noteArea + TOLERANCE) {
            if (startedInColumn()) {
                // The columns before it are the section before's, which aren't laid out again: the last footnote goes on
                // the page as far as it fits below them, and the rest on the next page, as Word continues one referred to
                // from the first line of such a section (`word-watertight-notes.docx` FN2)
                splitLast([...before, ...notes.slice(0, -1)], notes[notes.length - 1], pageBottom - filledEnd);
                return;
            }
            throw new NotesGrew(noteArea, pageNotes);
        }
    };

    /** Lays the page's footnotes out in the section's columns, when it is in columns and they are its first */
    const startNoteColumns = (): void => {
        if (pageNotes.length === 0 && continued === undefined && columnsOfNotes(section()) !== undefined) {
            notesInColumns = sectionIndex;
        }
    };

    /**
     * Puts footnotes at the bottom of the page, the last of them only as far as it fits in a room, with the rest of it
     * continued at the bottom of the next page. Across the page, it takes the rest of the page, so what follows goes on
     * the next (`word-probes.docx` U2), but in the columns the page's footnotes are laid out in, the text goes on above it,
     * as in Word (`word-watertight-notes.docx` FN2, FN3). It stops where none of it fits, but where more room is tried for
     * one too long for the page's columns (see `searchNoteRoom`), and in columns of different widths, where its lines on
     * the page and on the next aren't known to be those it is broken into in the first column
     */
    const splitLast = (whole: readonly string[], name: string, room: number): void => {
        if (footnotes.get(name)!.some(boxedOrSpaced)) {
            stopAt(BOXED_NOTE);
        }
        const fits = (point: NotePoint): boolean => areaOf(whole, { name, to: point }, continued) <= room + TOLERANCE;
        let to = fillNote(name, { block: 0, line: 0 }, fits);
        // Widow control can hold back a line from a part that fits to leave one that doesn't, in columns, and less of it
        // is tried then
        while (!atStart(to) && !fits(to)) {
            const limit = to;
            to = fillNote(
                name,
                { block: 0, line: 0 },
                (point) => fits(point) && (point.block < limit.block || (point.block === limit.block && point.line < limit.line)),
            );
        }
        const columns = noteColumns();
        if (atStart(to) && noteSearches.get(pageCount)?.marker === name) {
            // Looking for the room Word gives the footnote, the reference went on the page with too little of it for any of
            // the footnote, so more is tried
            settleNoteSearch();
        }
        if (atStart(to) && columns === undefined) {
            // Only a footnote that starts with a table row that can break needs none of its room on its reference's page (see
            // `leastPart`), and how much of the row Word keeps with the reference isn't known
            stopOnPage("a footnote that starts with a table row that breaks across pages, none of which fits below its reference");
        }
        if (atStart(to) || columns?.some((width) => width !== columns[0])) {
            stopOnPage(FOOTNOTE_IN_COLUMNS);
        }
        pageNotes = [...whole, name];
        noteArea = columns === undefined || columnsSection().columns.length === 1 ? room : areaOf(whole, { name, to }, continued);
        notesSection = sectionIndex;
        carried = { name, from: to };
    };

    /** The footnotes whose references are on the next page, as they moved on from this one when it was laid out again */
    const movedFromPage = (): readonly string[] => movedOn.get(pageCount) ?? [];

    /**
     * Lays out a page again whose columns were laid out again to leave room for footnotes that moved a reference to one
     * of them on to the next page, so the room left is more than the footnotes on the page take: without the room, and
     * with the page ending above the reference, as Word moves the reference on and leaves the page as it is without the
     * footnote (`word-watertight-notes.docx` FN1), with table rows on it too (stops2/word-stops-notes2.ts NT6b). It stops
     * where a reference moves on again, as its line stayed at the top of a later column, as at the top of any column, so
     * the page would be laid out again for the footnote, and again without it. Whether Word moves the line on from
     * there, as from below the top, or what is above it too, isn't known. Guessing, it moves on
     */
    const checkReserve = (): void => {
        if (reserved() > areaOf(pageNotes, undefined, continued) + TOLERANCE) {
            const moving = reservedFor.get(pageCount)!.filter((name) => !pageNotes.includes(name));
            if (moving.some((name) => movedFromPage().includes(name))) {
                stopAt(MOVES_ON_FROM_TOP);
                // eslint-disable-next-line functional/immutable-data
                movingOn.add(pageCount);
            }
            throw new NotesGrew(0, [], [...new Set([...movedFromPage(), ...moving])]);
        }
    };

    /**
     * Looks for the room Word gives a footnote too long for the columns of a page whose reference doesn't fit at the top of
     * a column after the first: Word lays the columns out again above as much of the footnote as leaves its reference on
     * the page (`word-watertight-notes.docx` FN3: a 120-line footnote from line 11 of the first of 2 columns takes 44 lines
     * of each, the columns above it 6, and its reference goes on in the second). The page is laid out again with the room
     * halved between the most found to leave the reference on the page and the least found not to, until they are within a
     * point (see `settleNoteSearch`). Here, the reference didn't fit at the top of a column with the room tried, so the
     * room is less, or it is the first try, from all of the page's
     */
    const searchNoteRoom = (marker: string): never => {
        const all = pageBottom - top;
        const search = noteSearches.get(pageCount) ?? { marker, area: all, high: all, placed: false, found: false };
        throw new NotesGrew(nextNoteRoom(search, false), []);
    };

    /**
     * The room for footnotes to lay the page out again with next, from the room tried, with which the reference went on
     * the page (`placed`), so the room is at least as much, or didn't, so it is less: halfway between the most found to
     * leave it there and the least found not to, or the most, once they are within a point
     */
    const nextNoteRoom = (search: NoteSearch, placed: boolean): number => {
        const { marker, area } = search;
        const low = placed ? area : search.low;
        const high = placed ? search.high : area;
        const found = high - (low ?? 0) <= NOTE_ROOM_STEP;
        if (found && (low === undefined || search.found)) {
            // No room leaves the reference on the page, or it didn't fit even with the room found
            throw new Unsupported(FOOTNOTE_IN_COLUMNS);
        }
        const next = found ? low! : ((low ?? 0) + high) / 2;
        // eslint-disable-next-line functional/immutable-data
        noteSearches.set(pageCount, { marker, area: next, high, placed: false, found, ...(low === undefined ? {} : { low }) });
        return next;
    };

    /**
     * At the end of a page whose room for a footnote too long for its columns is being looked for, the page is laid out
     * again with the room to try next, until it is found
     */
    const settleNoteSearch = (): void => {
        const search = noteSearches.get(pageCount);
        if (search !== undefined && !search.found) {
            throw new NotesGrew(nextNoteRoom(search, search.placed), []);
        }
    };

    /**
     * Stops at footnotes below the text of their page that Word hasn't been seen to place: below the space after the last
     * paragraph of a page whose text goes on to the next, or of the document, which Word may put above them or not. Word
     * put them below the space after the last paragraph of a section (stops2/word-stops-notes2.ts NT20a), and the rest of
     * one that went on across pages below the text of the next page, as a page's own (NT20b)
     */
    const checkBeneathText = (): void => {
        if (sections[notesSection].footnotesBeneathText && (pageNotes.length > 0 || continued !== undefined) && spaceAfter > 0) {
            stopAt("footnotes below the text after space below the last paragraph of a page or of the document");
        }
    };

    /**
     * Whether Word keeps a table row with the next: when the first paragraph of its first cell is kept with the next
     * (`word-watertight-tables.docx` TB5, `word-table-formats.docx` KR1). Its other paragraphs don't keep it (KR2)
     */
    const keptWithNext = ({ cells }: TableRow): boolean => {
        const [first] = cells[0]?.blocks ?? [];
        return first?.type === "paragraph" && first.format.keepNext === true;
    };

    /**
     * The last of the rows of a table from one (`index`) that are kept together, because each but the last is kept with
     * the next. The row itself when it isn't kept with the next, or is the table's last
     */
    const keptRowsEnd = ({ rows }: TableBlock, index: number): number => {
        let end = index;
        while (end < rows.length - 1 && keptWithNext(rows[end])) {
            end++;
        }
        return end;
    };

    /**
     * The largest margins above and below of a row's cells, which Word puts around every cell's text in the row
     * (`word-table-formats2.docx` MG1 to MG4)
     */
    const rowMarginsOf = ({ cells }: TableRow): number =>
        Math.max(0, ...cells.map(({ marginTop }) => marginTop)) + Math.max(0, ...cells.map(({ marginBottom }) => marginBottom));

    /**
     * The least of a row that goes on a page when it breaks across pages after the rows kept with it, as the paragraphs
     * kept with the next keep the next paragraph's first lines: in each cell, its first paragraph's first lines, all of them
     * when it is kept together or widow control keeps them together, with the row's margins around them
     */
    const leastPartOf = (row: TableRow): number =>
        row.borderTop +
        rowMarginsOf(row) +
        Math.max(
            0,
            ...row.cells
                .filter(({ vertical }) => !vertical)
                .map((cell) => {
                    const [first, second] = blocksWithRoom(cell);
                    if (first === undefined) {
                        return 0;
                    }
                    if (first.type === "table") {
                        // A table first in the cell breaks as its rows do, so the least of it is its first row's
                        const sized = sizedToPlace(first, textWidthOf(cell));
                        const [firstRow] = sized.rows;
                        return firstRow === undefined ? 0 : canSplit(firstRow) ? leastPartOf(firstRow) : rowHeights(sized)[0];
                    }
                    const {
                        lines,
                        spaceBefore,
                        spaceAfter: after,
                        keepLines,
                        widowControl,
                    } = measureParagraph(first, textWidthOf(cell), undefined, second, true);
                    const count = keepLines || (widowControl && lines.length <= 3) ? lines.length : widowControl ? 2 : 1;
                    return spaceBefore + linesHeight(lines.slice(0, count)) + (count >= lines.length ? after : 0);
                }),
        );

    /**
     * Whether a table row could break across pages between the lines of its cells: one not kept whole, with more than a
     * line in a cell
     */
    const canSplit = (row: TableRow): boolean =>
        !row.cantSplit &&
        row.height?.rule !== "exact" &&
        row.cells.some(
            (cell) =>
                cell.blocks.length > 1 ||
                cell.blocks.some((block) => block.type === "table" || linesOf(block, textWidthOf(cell)).length > 1),
        );

    /**
     * Whether widow control and keepLines keep all of a table row's lines on one page: those of a row whose cells each
     * have a paragraph of 3 lines or fewer with widow control, or one kept together, which can't break with lines on
     * both pages
     */
    const heldWhole = (row: TableRow): boolean =>
        row.cells.every((cell) => {
            const [first, ...rest] = blocksWithRoom(cell);
            if (cell.vertical || first === undefined) {
                return true;
            }
            if (rest.length > 0 || first.type === "table") {
                return false;
            }
            const { lines, keepLines, widowControl } = measureParagraph(first, textWidthOf(cell), undefined, undefined, true);
            return keepLines || lines.length === 1 || (widowControl && lines.length <= 3);
        });

    /**
     * Whether a footnote breaks across pages before a table row: one that widow control and keepLines keep whole does, and
     * goes on the next page whole, as Word moves a row of 3 lines there (`word-watertight-stops.docx` SP3c). Whether Word
     * breaks a row of a footnote whose lines could go on both pages isn't known
     */
    const breaksBeforeRow = (row: TableRow): boolean => !canSplit(row) || heldWhole(row);

    /**
     * Where the least of a footnote that goes on a page with its reference ends, when the rest of it can continue on the
     * next page, as Word continues it: the first lines of its first paragraph that can't be left alone at the bottom of a
     * page, 2 with widow control, or all of a paragraph of 3 lines or fewer, or 1 without it, or the first row of a table
     * (`word-probes.docx` U2a to U2h). A first paragraph kept together goes on the page whole, and one kept with the next
     * goes with the least of what follows it, so a reference whose footnote starts with either moves to the next page with
     * it where that doesn't fit (`word-watertight-stops.docx` SP3a, SP3b). Undefined when that is all of it. A row that
     * can break needs none of it, as how much of it Word keeps with the reference isn't known, and the layout stops where
     * none of it fits (see `splitLast`)
     */
    const leastPart = (name: string): NotePoint | undefined => {
        const note = footnotes.get(name)!;
        // The paragraphs kept with the next from the first, and the block they are kept with
        const kept = note.findIndex((part) => part.type !== "paragraph" || part.format.keepNext !== true);
        const index = kept === -1 ? note.length - 1 : kept;
        const block = note[index];
        if (block === undefined) {
            return undefined;
        }
        const point = (line: number, length: number): NotePoint | undefined =>
            index === note.length - 1 && line >= length ? undefined : { block: index, line };
        if (block.type === "table") {
            const { rows } = fitted(block, noteWidth());
            // With its header rows, which aren't left alone at the bottom of a page (`word-watertight-notes.docx` FN12)
            let headers = 0;
            while (headers < rows.length - 1 && rows[headers].header) {
                headers++;
            }
            return point(breaksBeforeRow(rows[headers]) ? headers + 1 : 0, rows.length);
        }
        const { lines, widowControl, keepLines } = measureParagraph(block, noteWidth());
        return point(keepLines || (widowControl && lines.length <= 3) ? lines.length : widowControl ? 2 : 1, lines.length);
    };

    /**
     * The room footnotes take at the bottom of a page, below the rest of one continued from the page before (`from`),
     * with the last continued on the next page after the least of it that can go on this one, when it can be. In columns,
     * all of it, as Word moves a reference to the next column or page with all of its footnote, rather than continue it,
     * even where part of it would fit (`word-watertight-stops.docx` SP1a, SP1b), but for one too long for the page's
     * columns whose room is being looked for (see `searchNoteRoom`)
     */
    const leastAreaOf = (notes: readonly string[], from: NotePart | undefined, columns = noteColumns()): number => {
        const name = notes[notes.length - 1];
        // But for the footnote too long for the columns whose room is being looked for, which continues below them, and in
        // footnotes' columns of their own below text in one column, where one continues as across the page
        // (stops2/word-stops-notes2.ts NT16e)
        const continues =
            columns === undefined ||
            columnsSection().columns.length === 1 ||
            (name !== undefined && noteSearches.get(pageCount)?.marker === name);
        const to = name === undefined || !continues ? undefined : leastPart(name);
        return to === undefined ? areaOf(notes, undefined, from, columns) : areaOf(notes.slice(0, -1), { name, to }, from, columns);
    };

    /**
     * Whether the least part of a footnote, which goes on the page with its reference, is taller than a page in the page's
     * columns, as one kept together that is
     */
    const leastTallerThanPage = (name: string): boolean => {
        const to = leastPart(name);
        return (
            (to === undefined ? areaOf([name], undefined, undefined) : areaOf([], { name, to }, undefined)) > pageBottom - top + TOLERANCE
        );
    };

    /**
     * Whether a footnote can't go on a page with its reference: the least of it that has to go there, with the separator,
     * is taller than the page, as a paragraph kept together of 55 lines is (`word-watertight-stops.docx` SP5)
     */
    const startsOnNextPage = (name: string): boolean => leastAreaOf([name], undefined, undefined) > pageBottom - top + TOLERANCE;

    /**
     * The least room footnotes take below those on the page: all of them, but the last only as far as it has to go on the
     * page, when it can continue on the next
     */
    const leastNoteRoom = (notes: readonly string[]): number => {
        if (notes.length === 0 || deferred !== undefined) {
            return 0;
        }
        return belowContinued() ? Infinity : Math.max(reserved(), leastAreaOf([...pageNotes, ...notes], continued)) - noteArea;
    };

    /**
     * Where the part of a footnote on a page ends, from where it starts (`from`), when not all of it fits (`fits`, up to
     * a point): after as many of its lines and table rows as fit, less those its paragraphs' widow and orphan control
     * hold back, as the body's are, so it breaks between its paragraphs and rows, or in a paragraph with 2 lines or more
     * on each page (`word-probes.docx` U2a to U2h). A paragraph kept together goes on the next page whole, and those kept
     * with the next go with the paragraph they are kept with, as the body's do (`word-watertight-notes.docx` FN9, FN10).
     * A row that widow control keeps whole goes on the next page, and a table's header rows aren't repeated above the rest
     * of it there (`word-watertight-stops.docx` SP3c, SP3d), nor left alone at the bottom of a page, as the table goes on
     * the next page whole then (FN12). On a page of footnotes alone (`ownPage`), a paragraph kept together that starts it
     * and is taller than the page breaks where the page ends, as the body's does (SP5). A row whose lines could go on both
     * pages breaks between its cells' lines, as the body's does (FN11), and paragraphs kept with the next that start the
     * part, which would leave none of it, break as without them, as the body's do at the top of a page.
     */
    const fillNote = (name: string, from: NotePoint, fits: (to: NotePoint) => boolean, ownPage = false): NotePoint => {
        const note = footnotes.get(name)!;
        const width = noteWidth();
        // The first line or row of the part that doesn't fit, which there is, as all of it doesn't: the one after the last
        // that does, as in columns, a part of a paragraph can fit where less of it doesn't, as widow control keeps 3 lines
        // in one column and evens 4 out in two
        const points = note
            .flatMap((part, at) =>
                Array.from({ length: part.type === "table" ? part.rows.length : linesOf(part, width).length }, (_, unit) => ({
                    block: at,
                    line: unit,
                })),
            )
            .filter((point) => point.block > from.block || (point.block === from.block && point.line >= from.line));
        const { block: index, line } = points[points.findLastIndex((point) => fits({ block: point.block, line: point.line + 1 })) + 1];
        const block = note[index];
        const withNext = (at: number): boolean => {
            const kept = note[at];
            return kept.type === "paragraph" && kept.format.keepNext === true;
        };
        /** The point the part ends at, before a line or row of the block, and before its first, before those kept with it */
        const breakBefore = (at: number): NotePoint => {
            let start = index;
            while (at === 0 && start > from.block && withNext(start - 1)) {
                start--;
            }
            // Those that start the part would leave none of it, so it breaks as without them, as the body's do at the top
            // of a page
            return { block: start === from.block ? index : start, line: at };
        };
        const begin = index === from.block ? from.line : 0;
        if (block.type === "table") {
            const row = fitted(block, width).rows[line];
            if (!breaksBeforeRow(row)) {
                // It breaks between its cells' lines, as a row of the text does (`word-watertight-notes.docx` FN11), as low as
                // its part and the footnotes before it fit, and moves to the next page whole where none of them would be on
                // the page
                const unknown = unbrokenInNote(row);
                if (unknown !== undefined) {
                    stopAt(unknown);
                } else if (from.cut !== undefined && index === from.block && line === from.line) {
                    // The rest of it breaks again, as Word broke a row of 120 lines in a footnote 38, 50 and 32 across three
                    // pages (`word-notes-across-pages.docx` NP1)
                    const before = from.cut;
                    const cut = noteRowCut(row, (at) => fits({ block: index, line, cut: [...before, at] }), before);
                    if (cut !== undefined) {
                        return { block: index, line, cut: [...before, cut] };
                    }
                    // Where a cell of it would have none of its lines, which hasn't been seen. Guessing, the rest goes on the page
                    // whole
                    stopAt("the rest of a table row in a footnote across pages, a cell of which would have none of its lines on the page");
                    return { block: index, line: line + 1 };
                } else {
                    const cut = noteRowCut(row, (at) => fits({ block: index, line, cut: [at] }));
                    if (cut !== undefined) {
                        return { block: index, line, cut: [cut] };
                    }
                }
            }
            return breakBefore(begin === 0 && block.rows.slice(0, line).every(({ header }) => header) ? 0 : line);
        }
        const { lines, widowControl, keepLines } = measureParagraph(block, width);
        const count =
            keepLines && !(ownPage && index === from.block)
                ? 0
                : linesKept(lines.length - begin, line - begin, { keepLines: false, widowControl }, begin === 0);
        return breakBefore(begin + count);
    };

    /**
     * Puts the footnotes of the lines placed at the bottom of the page: all of them, or where they don't fit, the last as
     * far as it fits below the others, as the body's blocks fill a page, with the rest of it continued at the bottom of the
     * next page, as Word continues it. The footnote takes the rest of the page then, so what follows goes on the next. In
     * columns, Word moves a line or row with its footnotes rather than continue one (`word-watertight-stops.docx` SP1), so
     * they fit here.
     *
     * @param below - The room below the lines that the footnotes don't take: that of the bottom border of a table that
     * breaks across pages below them
     */
    const placeNotes = (notes: readonly string[], below = 0): void => {
        if (notes.length === 0) {
            return;
        }
        if (deferred !== undefined) {
            // A footnote referred to below one that starts on the next page goes after it (`word-watertight-notes.docx` FN8)
            pending = [...pending, ...notes.filter((name) => name !== deferred)];
            return;
        }
        if (position + below <= linesBottom(moreNoteRoom(notes)) + TOLERANCE) {
            addNotes(notes);
            return;
        }
        // In columns, a line whose footnotes don't fit is at the top of the page's columns, or of the column a section
        // starts in, where it stays, and they go below the lines of every column on the page (FN2, FN3)
        startNoteColumns();
        if (section().columns.length > 1 && noteColumns() === undefined) {
            // Below footnotes across the page, which those of columns go on below, how Word continues one isn't known
            stopOnPage(FOOTNOTE_IN_COLUMNS);
        }
        splitLast([...pageNotes, ...notes.slice(0, -1)], notes[notes.length - 1], bottom - Math.max(position + below, filledEnd));
    };

    /**
     * The number of the page as the section writes it, after the chapter number when it has one. Guessing, a number in a
     * format the layout can't write is in figures, and one whose chapter number isn't known has none
     */
    const pageText = (): string => {
        const { numberFormat, chapters } = section();
        const page = formatPageNumber(pageNumber, numberFormat);
        if (page === undefined) {
            stopAt(UNWRITTEN_NUMBER);
        }
        const heading = chapters && chapterHeadings[blockStart!.index][chapters.level - 1];
        if (heading?.unsupported) {
            stopAt(heading.unsupported);
        }
        const text = page ?? String(pageNumber);
        return heading?.chapter === undefined ? text : `${heading.chapter}${chapters!.separator}${text}`;
    };

    /**
     * Places the bookmarks and fields of a line or row placed on the page, as it shows its number there, and those of the
     * footnotes and endnotes it refers to with them
     */
    const mark = (names: readonly string[]): void => {
        const text = pageText();
        const search = noteSearches.get(pageCount);
        if (search !== undefined && names.includes(search.marker)) {
            // eslint-disable-next-line functional/immutable-data
            noteSearches.set(pageCount, { ...search, placed: true });
        }
        // The marker at the reference of a footnote numbered afresh on each page is placed too, as its page numbers it
        const placed = names.flatMap((marker) => [
            ...(footnotesOnEachPage.has(marker) ? [marker] : []),
            ...(inNotes.get(marker) ?? (isDrawingMarker(marker) || marker === JOINED_SPACING_MARKER ? [] : [marker])),
        ]);
        for (const name of placed) {
            if (!places.has(name)) {
                // eslint-disable-next-line functional/immutable-data
                places.set(name, { page: pageCount, pageNumber, text, section: sectionIndex, order: places.size });
                if (!isFieldMarker(name) && !footnotesOnEachPage.has(name)) {
                    // eslint-disable-next-line functional/immutable-data
                    bookmarks.set(name, text);
                }
            }
        }
    };

    /** The lines from one (`from`) up to the next that ends with a page or column break, or to the paragraph's end */
    const linesToBreak = (lines: readonly LaidOutLine[], from: number): readonly LaidOutLine[] => {
        const end = lines.findIndex((line, index) => index >= from && line.breakAfter !== undefined);
        return lines.slice(from, end === -1 ? lines.length : end + 1);
    };

    /** Whether the next line goes at the top of the page, in its first column */
    const atTopOfPage = (): boolean => column === 0 && position <= top + TOLERANCE;

    /**
     * Which of the columns a paragraph kept together is taller than, up to its first break, each at its own width: none
     * when it isn't kept together, or isn't in columns
     */
    const columnsTallerThan = (block: ParagraphBlock): readonly boolean[] => {
        const { columns } = columnsSection();
        return block.format.keepLines !== true || columns.length < 2
            ? []
            : columns.map((width) => heightToFit(linesToBreak(linesOf(block, width), 0)) > pageBottom - top + TOLERANCE);
    };

    /**
     * The drawings that text flows around in the header or footer a page shows, placed on it, which the body's text goes
     * round as round its own, as Word has it (`word-watertight-pages.docx` PG4, `word-stops-drawings.docx` DH1a to DH1d,
     * `word-vml.docx` VM13). Those placed against the column are placed against the text across the page, which a header is
     * in, as Word placed one 1 inch from the column's left in a section of 2 columns 1 inch from the margin
     * (`word-stops-edges.docx` DH2d). Word placed one against its paragraph or line, in the first line of a header's first
     * paragraph, against the top of that line, where the header starts (DH2a, DH2b). It stops where Word's way with them
     * isn't known, and guessing, leaves them out: on a page of text that runs down it, lined up with a column of a section
     * of several, which may be the first or the text across the page, placed against its paragraph or line in a footer, or
     * in a header but in the first line of its first paragraph, and beside a footnote continued from the page before (see
     * `startPage`)
     */
    const partDrawings = (current: Section, first: boolean, parts: "headers" | "footers"): readonly PlacedDrawing[] => {
        const kind = kindOf(current[parts], first);
        const part = partBlocks(current[parts], first);
        const width = textWidth(current);
        const left = columnLeft(current, 0);
        return part.flatMap((block, index) =>
            block.type === "table"
                ? []
                : block.items.flatMap((item, at): readonly PlacedDrawing[] => {
                      if (item.type !== "drawing") {
                          return [];
                      }
                      const { drawing } = item;
                      const { horizontal, vertical } = drawing;
                      const againstText = vertical.from === "paragraph" || vertical.from === "line";
                      const measured = againstText ? measureParagraph(block, width, undefined, part[index + 1]) : undefined;
                      const firstLine = measured?.lines[0];
                      const where = placeDrawing(drawing, {
                          section: current,
                          oddPage: pageNumber % 2 === 1,
                          column: { start: left, end: left + width },
                          paragraph: current.header,
                          line: { top: current.header, height: firstLine?.height ?? 0 },
                          character: 0,
                      });
                      const reason =
                          typeof where === "string"
                              ? where
                              : current.textRunsDown !== undefined
                                ? "a drawing that text flows around in a header or footer of text that runs down the page"
                                : horizontal.from === "column" &&
                                    current.columns.length > 1 &&
                                    (horizontal.align !== undefined || horizontal.share !== undefined)
                                  ? "a drawing that text flows around in a header or footer, lined up with a column of several"
                                  : measured !== undefined &&
                                      (parts === "footers" ||
                                          index > 0 ||
                                          measured.spaceBefore + measured.borderAbove > 0 ||
                                          !firstLine!.markers.includes(drawingMarker(at)))
                                    ? "a drawing that text flows around, placed against its paragraph or line in a footer, or below a header's first line"
                                    : undefined;
                      if (reason !== undefined || typeof where === "string") {
                          stopAt(reason!);
                          return [];
                      }
                      return [{ drawing, box: where, keepOut: keepOutOf(drawing, where), anchor: `${parts} ${kind} ${index} ${at}` }];
                  }),
        );
    };

    /**
     * How tall a header is, from its top (`from`), with its lines beside the drawings that text flows around placed on the
     * page from it and its footer, as Word lays them out beside them, as the body's: a header of 3 lines in the room right
     * of a picture placed against the page beside them was 4 lines, its first narrowed too (`word-stops-edges.docx` DH2c).
     * It stops where Word's way isn't known: a line with room either side of a drawing, or below it, and a table beside one.
     * Guessing, the line is laid out as without it
     */
    const headerBeside = (part: readonly Block[], placed: readonly PlacedDrawing[], from: number, current: Section): number => {
        const width = textWidth(current);
        const left = columnLeft(current, 0);
        const within: Span = { start: left, end: left + width };
        const stacked = stackParts(part, width, false);
        let y = from + (stacked[0]?.before ?? 0);
        part.forEach((block, index) => {
            y += index === 0 ? 0 : between(stacked[index - 1].after, stacked[index].before);
            const besideIt = (height: number): boolean =>
                placed.some(({ keepOut }) => overlap(keepOut, { left: within.start, right: within.end, top: y, bottom: y + height }));
            if (block.type === "table") {
                if (besideIt(stacked[index].height)) {
                    stopAt("a table in a header beside a drawing that text flows around");
                }
                y += stacked[index].height;
                return;
            }
            const { borderAbove, borderBelow } = measureParagraph(block, width, part[index - 1], part[index + 1]);
            const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = block.format;
            // Each line in the room beside the drawings where it is, from the first, as those before it don't change with it
            const rooms = new Map<number, LineRoom>();
            let lines = linesOf(block, width);
            for (let line = 0, lineTop = y + borderAbove; line < lines.length; lineTop += lines[line].height, line++) {
                const room = roomBeside(placed, lineTop, lines[line].height, within);
                if (!("spans" in room) || room.spans.length > 1) {
                    stopAt("a line of a header with room either side of a drawing that text flows around, or none");
                } else if (room.spans[0].start > within.start + TOLERANCE || room.spans[0].end < within.end - TOLERANCE) {
                    const [span] = room.spans;
                    const start = Math.max(span.start - left, indentLeft) + (line === 0 ? firstLineIndent : 0);
                    const end = Math.min(span.end - left, width - indentRight);
                    if (end <= start + TOLERANCE) {
                        stopAt("a line of a header with room either side of a drawing that text flows around, or none");
                        continue;
                    }
                    // eslint-disable-next-line functional/immutable-data
                    rooms.set(line, { start, end });
                    lines = linesOf(block, width, new Map(rooms));
                }
            }
            y += borderAbove + linesHeight(lines) + borderBelow;
        });
        return y + (stacked[stacked.length - 1]?.after ?? 0) - from;
    };

    /** The drawings placed from the top of the page and those on it, once each */
    const withPinned = (onPage: readonly PlacedDrawing[]): readonly PlacedDrawing[] =>
        [...(pinned.get(pageCount) ?? []), ...onPage].filter(
            (drawing, index, all) => all.findIndex(({ anchor }) => anchor === drawing.anchor) === index,
        );

    /**
     * Stops at a drawing placed from the top of the page whose paragraph didn't stay on it, as the text before it went
     * round it, which Word lays out in ways not yet followed
     */
    const checkAnchors = (): void => {
        const away = (pinned.get(pageCount) ?? []).find(({ anchor }) => !anchored.includes(anchor));
        if (away === undefined) {
            return;
        }
        // The paragraph of one of its own, rather than of a table that text flows around, starts on the next page, with all
        // its drawings placed from this page's top. It started on this page, as only the text of another block before it
        // on a page has a drawing placed from the page's top, and on the next it is the first, with no text before it. A
        // text frame anchored at a table's top goes on with the table
        if (isTableDrawing(away)) {
            throw new Unsupported(PUSHED_ON);
        }
        const block = Number(away.anchor.split(" ")[0]);
        if (blocks[block].block.type === "table") {
            throw new Unsupported(FRAME_BEFORE_TABLE_MOVING_ON);
        }
        throw new PushedOn(block, pageCount);
    };
    // The paragraphs that start on the next page after the page they would start on, by that page
    const startsNextPage = new Map<number, number>();

    // The tables that text flows around that are laid out in the text instead, guessing, where Word's way with them isn't
    // known, by their blocks' indexes
    const inlined = new Set<number>();
    // The tables that text flows around left on the page where they were placed when the paragraph kept with the next they
    // are anchored in moved on (see `leaveFloats`)
    const leftBehind = new Set<number>();

    /** Whether a block is a table that text flows around, laid out round the paragraph after it */
    const floatsAt = (index: number): boolean => {
        const entry = blocks[index];
        return entry !== undefined && isFloating(entry.block) && !inlined.has(index) && !brokenAcross.has(index) && !leftBehind.has(index);
    };

    /**
     * Breaks a table that text flows around that goes past the bottom of the page across pages, as Word breaks it: the rows
     * that fit stay where it was placed, the rest go at the top of the next pages, where it is across the page, below its
     * header rows, which go at the top of each page again, and the paragraph after it starts at the top of the page its
     * last rows are on, beside them, as beside a drawing there. A page between holds its rows only
     * (`word-stops-floats.docx` FT5b to FT5d, `word-floats2.docx` G28, `word-stops-floats2.docx` TF2a, TF2b). Where it has
     * footnotes or a distance from the text above it, is in columns, and where its first row doesn't fit, a row that would
     * go on to the next page has more than one line and can split, which Word splits as a row of a table it doesn't flow
     * around (TF2c), or a row is taller than a page, Word's way isn't followed, and it isn't broken: whether it is
     */
    const breakAcross = ({ drawing, table }: AnchoredDrawing & { readonly table: FloatingTable }): boolean => {
        const block = blocks[table.index].block as TableBlock;
        const { distances } = drawing.drawing;
        const { heights } = table;
        const headerRows = Math.max(
            0,
            block.rows.findIndex(({ header }) => !header),
        );
        const repeated = sum(heights.slice(0, headerRows));
        // The rows on each page, from the first, each page's from the top of its text, below the header rows there
        const first = heights.findIndex((_, at) => drawing.box.top + sum(heights.slice(0, at + 1)) > linesBottom() + TOLERANCE);
        if (first <= headerRows) {
            // All its rows fit, and only its distance from the text below it goes past, or its first row below its header rows
            // doesn't
            return false;
        }
        const room = pageBottom - top - repeated;
        const { parts } = heights
            .slice(first)
            .reduce<{ readonly parts: readonly number[]; readonly used: number }>(
                ({ parts: counts, used }, height) =>
                    counts.length > 0 && used + height <= room + TOLERANCE
                        ? { parts: [...counts.slice(0, -1), counts[counts.length - 1] + 1], used: used + height }
                        : { parts: [...counts, height <= room + TOLERANCE ? 1 : 0], used: height },
                { parts: [], used: 0 },
            );
        // The rows that go at the top of the next pages, which Word moves whole when they are of one line, or can't split, and
        // which it may split otherwise
        const starts = parts.map((_, part) => first + sum(parts.slice(0, part)));
        const whole = starts.every((start) => {
            const { cantSplit, cells } = block.rows[start];
            return (
                cantSplit ||
                cells.every(
                    ({ blocks: [only, ...rest], width }) =>
                        rest.length === 0 && only?.type === "paragraph" && linesOf(only, width).length === 1,
                )
            );
        });
        if (
            !whole ||
            carried !== undefined ||
            parts.includes(0) ||
            notesIn(markersOf(block)).length > 0 ||
            distances.top > 0 ||
            columnsSection().columns.length > 1
        ) {
            return false;
        }
        /** Places some of its rows from where they go down the page, with their bookmarks and fields on that page */
        const placeRows = (from: number, count: number, y: number): void => {
            heights.slice(from, from + count).reduce((rowTop, height, offset) => {
                mark(block.rows[from + offset].cells.flatMap((cell) => cell.blocks.flatMap(markersOf)));
                // eslint-disable-next-line functional/immutable-data
                placements.push({ type: "row", block: table.index, row: { index: from + offset, y: rowTop, height } });
                return rowTop + height;
            }, y);
        };
        placeRows(0, first, drawing.box.top);
        let row = first;
        for (const count of parts) {
            startPage();
            // Its header rows again at the top of the page, as a table's that doesn't float (TF2a)
            placeRows(0, headerRows, position);
            placeRows(row, count, position + repeated);
            row += count;
        }
        // The last of them, at the top of the page, are beside the paragraph after it
        const box = { ...drawing.box, top: position, bottom: position + repeated + sum(heights.slice(row - parts[parts.length - 1])) };
        drawings = [...drawings, { ...drawing, box, keepOut: keepOutOf(drawing.drawing, box) }];
        brokenAcross = new Set([...brokenAcross, table.index]);
        return true;
    };

    /**
     * The tables that text flows around right before a block, which the paragraph after them goes round. Those before a
     * paragraph are in its section, as those that aren't stop the layout
     */
    const floatsBefore = (index: number): readonly number[] => {
        let first = index;
        while (floatsAt(first - 1)) {
            first--;
        }
        return Array.from({ length: index - first }, (_, offset) => first + offset);
    };

    /** The tables that text flows around from one, one after the other */
    const floatsFrom = (index: number): readonly number[] => {
        let end = index;
        while (floatsAt(end)) {
            end++;
        }
        return Array.from({ length: end - index }, (_, offset) => index + offset);
    };

    /**
     * Why Word's way with the tables that text flows around from one (`index`) isn't known: with nothing after them in
     * their section to place them against, which a document read doesn't have, as each section ends with a paragraph
     * and the body with the one Word adds after them, before a paragraph kept with the next, or with a footnote in one
     * before a table. Word places them against the top of what comes after them: a paragraph, the empty one that ends
     * their section, which takes a line after them, and a table (`word-stops-floats.docx` FT1a to FT1e), and their
     * footnotes go on the page with them (FT3). One with borders between its rows only has the room of its rows, as its
     * borders count as borders (`word-stops-floats2.docx` TF3)
     */
    const floatsUnknown = (index: number): string | undefined => {
        const run = floatsFrom(index);
        const after = blocks[index + run.length];
        if (after?.section !== blocks[index].section) {
            return "a table that text flows around without a paragraph after it";
        }
        return after.block.type === "table" && run.some((table) => notesIn(markersOf(blocks[table].block)).length > 0)
            ? "a footnote in a table that text flows around before a table"
            : undefined;
    };

    /**
     * Stops at tables that text flows around, one after the other, where Word's way with them isn't known (`reason`), or,
     * guessing, lays them out in the text, as tables it doesn't flow around, from where they are
     */
    const inlineFloats = (run: readonly number[], reason: string): void => {
        stopAt(reason);
        for (const table of run) {
            // eslint-disable-next-line functional/immutable-data
            inlined.add(table);
        }
    };

    /**
     * A table that text flows around, sized in the column, as a drawing with square wrapping the size of its rows, as Word
     * puts the text beside it (`word-floats2.docx` G24 to G29), with its rows' heights. It is as wide as its rows with the
     * halves of its borders left and right, from half a point to 3 points, on both sides or one, and without borders at
     * all, 0.75 points wider, at the left of the margins and at the right: 3010, 3020, 3060 and 3015 twips for 3000
     * (`word-floats3.docx` H1 to H5, H8), 3030 with 3 points on one side, and 3000 with a border above or below it only
     * (`word-stops-floats.docx` FT2a to FT2e). Its cells' margins don't change it, and its indent doesn't move it (H6, H7)
     */
    const floatingTable = (index: number): { readonly drawing: FloatingDrawing; readonly table: FloatingTable } => {
        const block = blocks[index].block as TableBlock;
        const { horizontal, vertical, distances, mayOverlap } = block.float!;
        const table = sizedToPlace(block, columnsSection().columns[column]);
        const heights = rowHeights(table);
        return {
            drawing: {
                wrap: "square",
                side: "bothSides",
                width: tableWidthOf(table) + (borderless(table) ? BORDERLESS_FLOAT : 0),
                height: sum(heights),
                effects: { top: 0, bottom: 0, left: 0, right: 0 },
                distances,
                horizontal,
                vertical,
                mayOverlap,
            },
            table: { index, heights },
        };
    };

    /**
     * Places a table beside the drawings that text flows around on its page when it fits beside them, as Word places one of
     * 3000 twips beside a drawing on the right or the left, moving it to the right past one on the left
     * (`word-floats2.docx` G14, G15), and moves one that doesn't down below them, as Word moves one as wide as the text
     * (`word-floats.docx` F40). Where it goes across is its indent, which must leave it beside the drawings, or past one on
     * its left, with its indent from there (`word-stops-drawings.docx` DR11b). Its rows are as tall wherever it goes across
     * the column, so only where it goes down the page counts here. A table sized to its text that is as wide sized in the
     * room beside a drawing as in the column goes beside it (DR11a); whether Word sizes one in that room isn't known.
     */
    const placeBesideDrawings = (table: TableBlock, heights: readonly number[], block: TableBlock): void => {
        const current = columnsSection();
        const columnStart = columnLeft(current, column);
        const within = { start: columnStart, end: columnStart + current.columns[column] };
        const tableWidth = tableWidthOf(table);
        const tableHeight = sum(heights);
        const indent = table.indent ?? 0;
        for (;;) {
            const at = position;
            const beside = drawings.filter(
                ({ keepOut }) =>
                    keepOut.top < at + tableHeight && at < keepOut.bottom && keepOut.left < within.end && within.start < keepOut.right,
            );
            if (beside.length === 0) {
                return;
            }
            const room = roomBeside(beside, at, tableHeight, within);
            const spans = "spans" in room ? room.spans : [];
            // At its indent, its left edge is in the room from the column's start, or from one on its left, where it ends
            const left = columnStart + indent;
            const atIndent = spans.find(
                ({ start, end }) => start <= Math.max(columnStart, left) + TOLERANCE && left + tableWidth <= end + TOLERANCE,
            );
            // Past one on its left, with its indent from there (DR11b)
            const pastLeft = spans.find(
                ({ start, end }) =>
                    start > Math.max(columnStart, left) + TOLERANCE && end - start >= Math.max(0, indent) + tableWidth - TOLERANCE,
            );
            const goesIn = atIndent ?? pastLeft;
            if (goesIn !== undefined) {
                if (
                    table.fit !== undefined &&
                    Math.abs(tableWidthOf(sizedToPlace(block, goesIn.end - goesIn.start)) - tableWidth) > TOLERANCE
                ) {
                    throw new Unsupported("a table sized to its text beside a drawing that text flows around");
                }
                if (atIndent === undefined && indent < 0) {
                    throw new Unsupported("an indented table moved past a drawing on its left");
                }
                return;
            }
            // Below the highest of the drawings beside it, where the room beside them changes
            position = Math.min(...beside.map(({ keepOut }) => keepOut.bottom));
        }
    };

    /**
     * Places the tables that text flows around right before a table, and the text frames anchored in it, against its top,
     * where Word places them with no paragraph between (`word-stops-floats.docx` FT1a, FR1a, FR1d): the text after the table
     * goes round them, and the table goes below those it would go beside, as below a drawing. Where one goes past the bottom
     * of the page, as the table it is anchored in would move on without it, Word's way isn't known. Whether any were placed
     */
    /** Where a drawing is drawn on its page, placed against what its positions say, or stops where that isn't known */
    const placeOrStop = (drawing: FloatingDrawing, frame: DrawingFrame): Box => {
        const box = placeDrawing(drawing, frame);
        if (typeof box === "string") {
            throw new Unsupported(box);
        }
        return box;
    };

    const placeBeforeTable = (table: TableBlock, index: number): boolean => {
        const frames = table.anchored ?? [];
        const own = [
            ...floatsBefore(index).map((one, offset) => ({ ...floatingTable(one), item: -1 - offset })),
            ...frames.flatMap((item, at) => (item.type === "drawing" ? [{ drawing: item.drawing, item: at, table: undefined }] : [])),
        ];
        if (own.length === 0) {
            return false;
        }
        const markers = frames.flatMap((item) => (item.type === "marker" ? [item.name] : []));
        if (notesIn(markers).length > 0) {
            throw new Unsupported("a footnote or endnote in a text frame before a table");
        }
        mark(markers);
        const current = columnsSection();
        const left = columnLeft(current, column);
        const placed = own.map(({ drawing: unsized, item, table: floating }): AnchoredDrawing => {
            const drawing = sizedFrame(unsized);
            const anchor = floating === undefined ? `${index} ${item}` : `${floating.index} table`;
            const withTable = floating === undefined ? {} : { table: floating };
            const pin = (pinned.get(pageCount) ?? []).find((one) => one.anchor === anchor);
            if (pin !== undefined) {
                return { line: 0, item, drawing: pin, ...withTable };
            }
            const box = placeOrStop(drawing, {
                section: section(),
                oddPage: pageNumber % 2 === 1,
                column: { start: left, end: left + current.columns[column] },
                paragraph: position,
                line: { top: position, height: 0 },
                character: 0,
            });
            const keepOut = keepOutOf(drawing, box);
            if (keepOut.bottom > linesBottom() + TOLERANCE || box.top - drawing.effects.top < top - TOLERANCE) {
                throw new Unsupported(
                    floating === undefined
                        ? "a text frame before a table going past the top or bottom of the page's text"
                        : "a table that text flows around before a table going past the top or bottom of the page's text",
                );
            }
            return { line: 0, item, drawing: { drawing, box, keepOut, anchor }, ...withTable };
        });
        placeDrawings(placed);
        for (const { drawing, table: floating } of placed) {
            if (floating !== undefined) {
                placeFloatingRows(floating, drawing.box.top);
            }
        }
        return true;
    };

    /**
     * A text frame at the size its paragraphs give it: as wide as their widest line when it has no width of its own, and
     * as tall as they are, at least its own height, or its own height exactly, as its height rule says. Another drawing
     * is as it is
     */
    const sizedFrame = (drawing: FloatingDrawing): FloatingDrawing => {
        const { frame } = drawing;
        if (frame === undefined) {
            return drawing;
        }
        const { inset = { top: 0, bottom: 0, left: 0, right: 0 } } = frame;
        const width = frame.fitsWidth ? contentWidths(frame.blocks).max + inset.left + inset.right : drawing.width;
        const ofText = stackHeight(frame.blocks, width - inset.left - inset.right, false) + inset.top + inset.bottom;
        const shadowed = frame.blocks.some(({ format }) =>
            [format.borderTop, format.borderBottom, format.borderBetween].some(
                (one) => one?.shadow === true && one.style !== "none" && one.style !== "nil",
            ),
        );
        if (shadowed && frame.heightRule !== "exact" && ofText > drawing.height + TOLERANCE) {
            // Word doesn't double a shadowed border above or below a frame's text, as it does a paragraph's (`word-stops-floats.docx`
            // FR2i), and how tall that makes one as tall as its text isn't known
            throw new Unsupported("a text frame with a shadowed border, as tall as its text");
        }
        const height =
            frame.heightRule === "exact" ? drawing.height : frame.heightRule === "atLeast" ? Math.max(drawing.height, ofText) : ofText;
        return { ...drawing, width, height };
    };

    /** Whether a drawing that text flows around on the page goes down below where the next line goes */
    const besideDrawing = (): boolean => drawings.some(({ keepOut }) => keepOut.bottom > position + TOLERANCE);

    /** Whether a drawing on the page is a table that text flows around */
    const isTableDrawing = ({ anchor }: PlacedDrawing): boolean => anchor.endsWith(" table");

    /**
     * Whether two drawings on the page, of which one may not overlap the other, overlap where Word moves one out of the way:
     * pictures and shapes by their boxes (`word-stops-drawings.docx` DR2a to DR2e), and tables that text flows around by
     * the room they keep the text out of (`word-stops-floats.docx` FT8a to FT8c). Others by the room they keep the text
     * out of, as it isn't known
     */
    const clash = (one: PlacedDrawing, other: PlacedDrawing): boolean => {
        if (one.drawing.mayOverlap && other.drawing.mayOverlap) {
            return false;
        }
        const pictures = [one, other].every((drawing) => !isTableDrawing(drawing) && drawing.drawing.frame === undefined);
        return pictures ? overlap(one.box, other.box) : overlap(one.keepOut, other.keepOut);
    };

    /**
     * The drawings of a paragraph moved out of the way of the drawings on the page, and of those before them, that one of
     * them may not overlap, as Word moves the later one: across the page, at the height it was placed at, a picture placed at
     * a distance to the right, until its box is beside the other's (`word-stops-drawings.docx` DR2a to DR2e), and one lined
     * up at the right to the left (`word-floats2.docx` G3), and a table placed at a distance to the right, until the rooms
     * they keep the text out of are beside each other (`word-stops-floats.docx` FT8a to FT8c). Where Word moves one that may
     * overlap out of the way of one that may not, one with effects, one lined up otherwise, one moved past the column, and
     * a picture out of the way of a table or a text frame, isn't known
     */
    const outOfTheWay = (placed: readonly AnchoredDrawing[], within: Span): readonly AnchoredDrawing[] =>
        placed.reduce<readonly AnchoredDrawing[]>((moved, one) => {
            const others = [
                ...drawings.filter(({ anchor }) => !placed.some((item) => item.drawing.anchor === anchor)),
                ...moved.map((item) => item.drawing),
            ];
            /** It moved past the other it may not overlap, and past those it then overlaps, a few times at the most */
            const away = (drawing: PlacedDrawing, attempts: number): PlacedDrawing => {
                const other = others.find((placedOne) => clash(drawing, placedOne));
                if (other === undefined) {
                    return drawing;
                }
                const { drawing: own, box, keepOut } = drawing;
                const { effects } = own;
                const table = isTableDrawing(drawing);
                const kind = table === isTableDrawing(other) && own.frame === undefined && other.drawing.frame === undefined;
                const still = Math.max(effects.top, effects.bottom, effects.left, effects.right) === 0;
                const { align } = own.horizontal;
                const right = align === undefined || (table && align === "left");
                const left = align === "right";
                if (own.mayOverlap || !kind || !still || !(right || left) || attempts > others.length) {
                    throw new Unsupported("drawings that text flows around that may not overlap, overlapping");
                }
                const width = box.right - box.left;
                const fits = (candidate: Box): boolean =>
                    candidate.left >= within.start - TOLERANCE && candidate.right <= within.end + TOLERANCE;
                const shiftedTo = (to: number): Box => ({ ...box, left: to, right: to + width });
                // Where its left edge goes: a picture's box beside the other's, on its right or its left, and a table's room
                // past the other's, with its own distance from the text, to the right, or to the left when it has no room on
                // the right, or is lined up at the right (`word-stops-floats2.docx` NR1a to NR1c)
                const toRight = table ? other.keepOut.right + (box.left - keepOut.left) : other.box.right;
                const toLeft = table ? other.keepOut.left - (keepOut.right - box.left) : other.box.left - width;
                const tried = table ? (right ? [toRight, toLeft] : [toLeft, toRight]) : [right ? toRight : toLeft];
                const shifted = tried.map(shiftedTo).find(fits);
                if (shifted === undefined) {
                    throw new Unsupported("drawings that text flows around that may not overlap, overlapping, with no room beside");
                }
                return away({ ...drawing, box: shifted, keepOut: keepOutOf(own, shifted) }, attempts + 1);
            };
            return [...moved, { ...one, drawing: away(one.drawing, 0) }];
        }, []);

    /**
     * Puts the drawings of the paragraph being placed on the page, where the text after them goes round them. It stops
     * where Word's way with them isn't known yet: drawings that overlap, and one beside text placed before it on the page,
     * which Word lays out again. One beside the page's footnotes leaves their lines as they are, as Word does
     * (`word-stops-floats2.docx` FN1).
     */
    const placeDrawings = (placed: readonly AnchoredDrawing[]): void => {
        const before = placements.slice(placements.findLastIndex(({ type }) => type === "page") + 1);
        const anchorBlock = blockIndex;
        for (const { drawing } of placed) {
            const { keepOut } = drawing;
            anchored = [...anchored, drawing.anchor];
            if ((pinned.get(pageCount) ?? []).some(({ anchor }) => anchor === drawing.anchor)) {
                // It was placed from the top of the page, and stays where it was first placed, though its paragraph moved
                // down as the text before it went round it (`word-floats2.docx` G4)
                continue;
            }
            const others = [
                ...drawings,
                ...placed
                    .slice(
                        0,
                        placed.findIndex((one) => one.drawing === drawing),
                    )
                    .map((one) => one.drawing),
            ];
            if (others.some((other) => other.anchor !== drawing.anchor && clash(drawing, other))) {
                // Word moves one that may not overlap out of the way, as those of a paragraph are moved before it is laid out
                // beside them, in ways not yet followed for others. Those that may overlap keep the text out of all their room
                // (`word-floats2.docx` G1, G2)
                throw new Unsupported("drawings that text flows around that may not overlap, overlapping");
            }
            // Lines before it on the page beside it, and rows of tables beside it down the page, are laid out again with it
            const besideEarlier = before.some((placement) =>
                placement.type === "line"
                    ? placement.block !== anchorBlock &&
                      overlap(keepOut, {
                          left: placement.line.x,
                          right: placement.line.x + placement.line.width,
                          top: placement.line.y,
                          bottom: placement.line.y + placement.line.height,
                      })
                    : placement.type === "row" &&
                      !floatsAt(placement.block) &&
                      placement.row.y + placement.row.height > keepOut.top &&
                      placement.row.y < keepOut.bottom,
            );
            if (besideEarlier) {
                // The page is laid out again with it on the page from the top, so the text before it goes round it too
                throw new DrawingAbove(drawing);
            }
        }
        drawings = [
            ...drawings.filter(({ anchor }) => !placed.some(({ drawing }) => drawing.anchor === anchor)),
            ...placed.map(({ drawing }) => drawing),
        ];
    };

    /**
     * A paragraph's lines from one (`from`) to its next page or column break, or its end, in rows down the column from
     * `rowsTop`, beside the drawings that text flows around on the page, and its own anchored in those lines. A row is a
     * line of the paragraph, or the lines either side of a drawing, moved down below the drawings beside it when they leave
     * it no room, and broken in the room beside them. The lines below the bottom of the column are in rows of their own as
     * they are broken in the column, as widow control counts them. With the rows, the room each line was broken in
     * (`rooms`), and the drawings of its own placed, by the line each is anchored in. A paragraph without drawings beside it,
     * or of its own, has a row for each line.
     *
     * Its drawings are placed against its top (`paragraph.top`), the top of its space before (`word-floats.docx` F15, F22),
     * or the line they are anchored in as it is laid out before they are: the line of the text right before the anchor, which
     * the text going round the drawing can move to the next line, where the drawing stays (F16). One that would go above the
     * top of the page's text goes down to it, as Word moves it (F38b, F38c). When its first line goes below a drawing, its
     * own space before goes below the drawing with it (`paragraph.own`), as Word puts it (F37). On a page it goes on to, those
     * anchored there are placed against the top of its part on it (`word-floats2.docx` G20), and those `excluded`, anchored
     * on a later page, aren't placed.
     */
    const rowsOf = (
        block: ParagraphBlock,
        widths: LineWidths,
        given: LineRooms,
        from: number,
        rowsTop: number,
        paragraph: { readonly top: number; readonly own: number },
        excluded: ReadonlySet<number> = new Set(),
        at = blockIndex,
    ): {
        readonly lines: readonly LaidOutLine[];
        readonly rows: readonly Row[];
        readonly rooms: LineRooms;
        readonly placed: readonly AnchoredDrawing[];
    } => {
        const current = columnsSection();
        const left = columnLeft(current, column);
        const within: Span = { start: left, end: left + current.columns[column] };
        const earlier: LineRooms = new Map([...given].filter(([line]) => line < from));
        const firstLines = linesOf(block, widths, earlier);
        // The tables that text flows around before it are anchored in its first line, at no item of their own
        const anchorLine = (lines: readonly LaidOutLine[], index: number): number =>
            index < 0 ? 0 : lines.findIndex(({ markers }) => markers.includes(drawingMarker(index)));
        // Its own drawings anchored in its lines from this one on, by where they are in its items, but for those left for a
        // later page: those before were placed with the lines they are anchored in. The tables before it go with its first
        const own: readonly { readonly drawing: FloatingDrawing; readonly index: number; readonly table?: FloatingTable }[] = [
            ...(from === 0 ? floatsBefore(at).map((table, offset) => ({ ...floatingTable(table), index: -1 - offset })) : []),
            ...block.items.flatMap((item, index) =>
                item.type === "drawing" && anchorLine(firstLines, index) >= from && !excluded.has(index)
                    ? [{ drawing: item.drawing, index }]
                    : [],
            ),
        ];
        const beside = drawings.filter(({ keepOut }) => keepOut.bottom > rowsTop + TOLERANCE);
        if (own.length === 0 && beside.length === 0) {
            return {
                lines: firstLines,
                rows: linesToBreak(firstLines, from).map((line, offset) => rowOf([line], from + offset)),
                rooms: earlier,
                placed: [],
            };
        }
        const { indentLeft = 0, indentRight = 0, firstLineIndent = 0 } = block.format;
        const columnEnd = linesBottom();
        /** Places one of its own drawings, against its paragraph's top, or the top of a line from `lineTop`, `height` tall */
        const place = (
            { drawing: unsized, index, table }: (typeof own)[number],
            line: number,
            lineTop: number,
            height: number,
        ): AnchoredDrawing => {
            const drawing = sizedFrame(unsized);
            if (drawing.horizontal.from === "character") {
                throw new Unsupported("a drawing placed against where it is anchored along its line");
            }
            const anchor = table === undefined ? `${at} ${index}` : `${table.index} table`;
            const withTable = table === undefined ? {} : { table };
            // One placed from the top of the page stays where it was first placed (`word-floats2.docx` G4)
            const pin = (pinned.get(pageCount) ?? []).find((one) => one.anchor === anchor);
            if (pin !== undefined) {
                return { line, item: index, drawing: pin, ...withTable };
            }
            const where = placeDrawing(drawing, {
                section: section(),
                oddPage: pageNumber % 2 === 1,
                column: within,
                // On a page the paragraph goes on to, against the top of its part there (G20)
                paragraph: from > 0 ? rowsTop : paragraph.top,
                line: { top: lineTop, height },
                character: 0,
            });
            if (typeof where === "string") {
                throw new Unsupported(where);
            }
            // One that moves with the text goes no higher than the top of the page's text, with its effects
            const movesWithText = drawing.vertical.from === "paragraph" || drawing.vertical.from === "line";
            const over = movesWithText ? top - (where.top - drawing.effects.top) : 0;
            if (over > TOLERANCE && drawing.distances.top > 0) {
                throw new Unsupported("a drawing that would go above the page's text, with a distance from the text above it");
            }
            const box = over > TOLERANCE ? { ...where, top: where.top + over, bottom: where.bottom + over } : where;
            return { line, item: index, drawing: { drawing, box, keepOut: keepOutOf(drawing, box), anchor }, ...withTable };
        };
        /**
         * The room of each line of a row from `y`, `height` tall, its first line `line`, beside some drawings: the room beside
         * them, in the paragraph's indents, which start at a drawing's edge when it is further in, with the first line
         * indented from there (`word-floats.docx` F30). None when its indents leave it no room, as they would without the
         * drawings, or how far down it goes below the drawings when they leave it none in its indents (`below`)
         */
        const roomOfRow = (
            around: readonly PlacedDrawing[],
            y: number,
            height: number,
            line: number,
        ): { readonly below: number } | { readonly spans: readonly LineRoom[] } => {
            const room = roomBeside(around, y, height, within);
            if ("below" in room) {
                return room;
            }
            // The room in each gap within the paragraph's indents
            const rooms = room.spans.map((span, offset) => ({
                span,
                inIndents: {
                    start: Math.max(span.start - left, indentLeft) + (line + offset === 0 ? firstLineIndent : 0),
                    end: Math.min(span.end - left, within.end - left - indentRight),
                },
            }));
            // Word 2010 and before leave a gap beside a frame 1000 twips wide empty, of justified text, where Word 2013 puts
            // words, and put text in wider ones as it does (see `OLDER_LEAST_GAP`). How narrow a gap they leave empty isn't
            // known. One the paragraph's indents leave no room in takes no text anyway, and one they narrow is as narrow as
            // the room they leave. The paragraph's first line goes in the first gap of its row its first line indent leaves
            // room in, which is measured with the indent, and a hanging indent widens no gap: where Word starts a first line
            // that hangs past a drawing's edge hasn't been seen
            const indentOf = (offset: number): number => (offset > 0 ? Math.max(0, firstLineIndent) : 0);
            const firstLine =
                line === 0 ? rooms.findIndex(({ inIndents: { start, end } }, offset) => end - start - indentOf(offset) > TOLERANCE) : -1;
            const narrow = ({ span, inIndents: { start, end } }: (typeof rooms)[number], offset: number): boolean => {
                const width = end - Math.max(start, span.start - left) - (offset === firstLine ? indentOf(offset) : 0);
                return (
                    end > start + TOLERANCE &&
                    narrowGap(span, width, within, { top: y, bottom: y + height }, around, block.format.alignment)
                );
            };
            if (compatibilityMode !== undefined && rooms.some(narrow)) {
                stopAt(
                    "a line beside a drawing or frame in a gap narrower than Word was seen putting text in, in a document in compatibility mode",
                );
            }
            const spans = rooms.map(({ inIndents }) => inIndents).filter((span) => span.end > span.start + TOLERANCE);
            const ownRoom = within.end - left - indentRight - (indentLeft + (line === 0 ? firstLineIndent : 0)) > TOLERANCE;
            if (spans.length === 0 && ownRoom) {
                // The room beside the drawings is outside the paragraph's indents, so the line goes below them, as it does
                // when they leave it no room at all
                const besideLine = around.filter(
                    ({ keepOut }) =>
                        keepOut.top < y + height && y < keepOut.bottom && keepOut.left < within.end && within.start < keepOut.right,
                );
                return { below: Math.min(...besideLine.map(({ keepOut }) => keepOut.bottom)) };
            }
            return { spans };
        };
        /** Whether a row's only room is all of the paragraph's, as a line not beside a drawing has */
        const isWhole = (spans: readonly LineRoom[], line: number): boolean =>
            spans.length === 1 &&
            spans[0].start <= indentLeft + (line === 0 ? firstLineIndent : 0) + TOLERANCE &&
            spans[0].end >= within.end - left - indentRight - TOLERANCE;
        /** The rows of the lines broken in some rooms beside some of its own drawings, and the rooms they put the lines in */
        // Where the lines whose rooms beside the drawings took none of their words go: below the drawings, as Word moves a
        // line whose only room is too narrow for its first word, though wide enough for text, to just below the table that
        // text flows around beside it (`word-stops-floats2.docx` CO1a, CO1b)
        const jumps = new Map<number, number>();
        /** The bottom of the nearest of the drawings beside a row from `y`, `height` tall, when there is one */
        const belowDrawings = (all: readonly PlacedDrawing[], y: number, height: number): number | undefined => {
            const bottoms = all
                .filter(
                    ({ keepOut }) =>
                        keepOut.top < y + height && y < keepOut.bottom && keepOut.left < within.end && within.start < keepOut.right,
                )
                .map(({ keepOut }) => keepOut.bottom);
            return bottoms.length === 0 ? undefined : Math.min(...bottoms);
        };
        const walk = (
            lines: readonly LaidOutLine[],
            around: readonly AnchoredDrawing[],
        ): { readonly rows: readonly Row[]; readonly rooms: LineRooms } => {
            const all = [...beside, ...around.map(({ drawing }) => drawing)];
            const end = from + linesToBreak(lines, from).length;
            const rooms = new Map(earlier);
            // eslint-disable-next-line functional/prefer-readonly-type
            const rows: Row[] = [];
            let y = rowsTop;
            let line = from;
            while (line < end) {
                if (y + lines[line].height > columnEnd + TOLERANCE) {
                    // Below the bottom of the column, it is in a row of its own, as it is broken there
                    // eslint-disable-next-line functional/immutable-data
                    rows.push(rowOf([lines[line]], line));
                    line++;
                    continue;
                }
                const rowTop = y;
                // Below the drawings its rooms took none of its words beside, where it was found to go
                const jump = jumps.get(line);
                if (jump !== undefined && jump > y) {
                    y = jump;
                }
                let { height } = lines[line];
                // The room of each line on the row, or none of their own for lines whose indents leave them none
                let spans: readonly LineRoom[];
                for (;;) {
                    const room = roomOfRow(all, y, height, line);
                    if ("below" in room) {
                        // No room beside the drawings, so the line goes down below them, with the paragraph's own space before
                        // when it is its first line
                        y = room.below + (line === 0 ? paragraph.own : 0);
                        continue;
                    }
                    spans = room.spans.slice(0, end - line);
                    const tallest = Math.max(height, ...lines.slice(line, line + spans.length).map((one) => one.height));
                    if (tallest > height + TOLERANCE) {
                        height = tallest;
                        continue;
                    }
                    const taking = Math.max(1, spans.length);
                    const below = belowDrawings(all, y, height);
                    const emptied = lines.slice(line, line + taking).every(({ text }) => text.trim() === "");
                    if (!isWhole(spans, line) && emptied && line + taking < end && below !== undefined && !jumps.has(line)) {
                        // Its rooms took none of its words, so it goes below the drawings beside it, and is broken again there
                        // eslint-disable-next-line functional/immutable-data
                        jumps.set(line, below);
                        y = below;
                        continue;
                    }
                    break;
                }
                const onRow = Math.max(1, spans.length);
                if (spans.length > 0 && !isWhole(spans, line)) {
                    for (const [offset, span] of spans.entries()) {
                        // eslint-disable-next-line functional/immutable-data
                        rooms.set(line + offset, span);
                    }
                }
                // eslint-disable-next-line functional/immutable-data
                rows.push(rowOf(lines.slice(line, line + onRow), line, y - rowTop, y));
                y += height;
                line += onRow;
            }
            return { rows, rooms };
        };
        /** The lines broken in the rooms beside some of its own drawings, laid out again until their rooms settle */
        const settle = (
            around: readonly AnchoredDrawing[],
        ): { readonly lines: readonly LaidOutLine[]; readonly rows: readonly Row[]; readonly rooms: LineRooms } => {
            let rooms = earlier;
            let changes = 0;
            for (;;) {
                const lines = linesOf(block, widths, rooms);
                const laid = walk(lines, around);
                if (sameRooms(laid.rooms, rooms)) {
                    return { lines, ...laid };
                }
                // Rooms given to more of the lines, those given before the same, settle a line or a few at a time, as many times
                // as it takes: those that change go round, and are tried a few times only
                if (!extendsRooms(laid.rooms, rooms)) {
                    changes++;
                    if (changes >= MOST_ATTEMPTS) {
                        throw new Unsupported("lines beside a drawing that don't settle");
                    }
                }
                ({ rooms } = laid);
            }
        };
        // Those placed against the paragraph or the page first, and those placed against a line where it is beside them
        const byPage = outOfTheWay(
            own
                .filter(({ drawing }) => drawing.vertical.from !== "line")
                .map((item) => place(item, anchorLine(firstLines, item.index), rowsTop, 0)),
            within,
        );
        const byLine = own.filter(({ drawing }) => drawing.vertical.from === "line");
        /** The lines settled beside the drawings, with the line each is anchored in among them */
        const settled = (placed: readonly AnchoredDrawing[]): ReturnType<typeof rowsOf> => {
            const laid = settle(placed);
            return { ...laid, placed: placed.map((one) => ({ ...one, line: anchorLine(laid.lines, one.item) })) };
        };
        const first = settled(byPage);
        if (byLine.length === 0) {
            return first;
        }
        return settled(
            outOfTheWay(
                [
                    ...byPage,
                    ...byLine.flatMap((item) => {
                        const line = anchorLine(first.lines, item.index);
                        const row = first.rows.find((one) => line >= one.first && line < one.first + one.count);
                        return row?.top === undefined ? [] : [place(item, line, row.top, row.height)];
                    }),
                ],
                within,
            ),
        );
    };

    /**
     * What is left out above a paragraph's line at the top of a page or column, in a document that suppresses the space
     * above it (`suppressTopSpacing`), in points. Word leaves out the space above the text of the line there: at exact
     * spacing, all but 9.6 points of the 80% of the line above its baseline, and at least a height, all but 9.6 points of
     * that height, whether the line is taller or shorter than it: a line of Calibri 11 at least 12 points ends 2.4 points
     * higher. So it did in Calibri 11, Times New Roman 12, Courier New 11 and Calibri 24 alike, at the top of a page after
     * a page break, with the space before the paragraph, which is left out there, at the top of a column, and of a section
     * on a new page, below the space before its first paragraph there (`word-stops-top-spacing.docx` ST1 to ST5,
     * `word-stops-top-spacing2.docx` ST6, ST10, ST12), and for a paragraph's later line at the top of the next page too
     * (ST8). It leaves a line of single or multiple spacing as it is (ST4b, ST7), and the first line of a paragraph with a
     * border above it (ST11). Multiple spacing of less than a line, a line on a document grid, and a later line of a
     * paragraph with a border above it haven't been seen. Guessing, nothing is left out
     */
    const cutAbove = (block: ParagraphBlock, isFirstLine: boolean, borderAbove: number): number => {
        const spacing = block.format.lineSpacing;
        if (spacing === undefined || (spacing.rule === "multiple" && spacing.multiple >= 1) || (isFirstLine && borderAbove > 0)) {
            return 0;
        }
        const cut =
            spacing.rule === "exact"
                ? Math.max(0, EXACT_ABOVE_BASELINE * spacing.height - TOP_SPACE_KEPT)
                : spacing.rule === "atLeast"
                  ? Math.max(0, spacing.height - TOP_SPACE_KEPT)
                  : undefined;
        if (cut === undefined || (cut > 0 && (borderAbove > 0 || block.grid?.linePitch !== undefined))) {
            stopAt(TOP_SPACING_UNKNOWN);
            return 0;
        }
        return cut;
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
    const placeParagraph = (block: ParagraphBlock, paragraph: MeasuredParagraph, holdNotes: boolean): void => {
        // The first paragraph of a section keeps its space before at the top of the new page, less the empty paragraph's
        // space after, as it does without the break: 1440 before after 200 is 1240 in Word, at the start of a section on a
        // new page, which is already new (word-rules2.docx Q2c), or of a continuous one (word-probes.docx U7a). Any other
        // paragraph's is left out below the page break, as it is below one in the text
        if (paragraph.pageBreakBefore && (placedInColumn || column > 0)) {
            if (carried !== undefined && columnsSection().columns.length === 1) {
                // The rest of a footnote continued from the page goes on a page of its own before the page break, as Word
                // put it (`word-stops-notes.docx` NT10b), and before a section on a new page (`word-watertight-stops.docx`
                // SP2)
                startPage();
            }
            startPage();
        }
        const { columns } = columnsSection();
        // A paragraph kept together that is taller than a column goes down only the first column of each page, in Word,
        // from the top of a new page unless it is at the top of this one. What follows it goes on below it in that column
        // and into the next, so the other columns of the pages before are left empty. LibreOffice breaks it across them all.
        // In columns of different widths, it does when it is taller than each of them, at the first column's width
        // (`word-watertight-stops.docx` SP12). Those kept with it stay where they are, at the top of a page, where they were
        // or moved to with it (SP13)
        const taller = columnsTallerThan(block);
        const keptTall = taller.length > 0 && taller.every((tall) => tall);
        if (keptTall && !atTopOfPage()) {
            startPage();
        }
        // One taller than some of the columns but not others goes in the first, from where it is, that it fits in, as any
        // paragraph kept together does, and moves on from the top of one it is taller than, as Word moves it: from the top
        // of a narrow first column to the wide second, and past a narrow second column to a new page
        // (`word-column-stops.docx` CS3 to CS6), and in 3 columns as in 2 (`word-stops-pages.docx` CO1a, CO1b)
        const movesOn = !keptTall && taller.some((tall) => tall);
        // The lines that go down only the first column of each page: those up to its first break, when it is kept together
        const firstColumnsOnly = keptTall ? linesToBreak(linesOf(block, columns[0]), 0).length : 0;
        /**
         * The space above the paragraph's first line: at the top of a page, or of the column its section starts in, only
         * the first of a section has any
         */
        const spaceAbove = (): number => (placedInColumn || atSectionStart() ? spaceAboveOf(paragraph.spaceBefore) : 0);
        // The width of its lines from each of them on: those of the columns they go in, and the room of those beside drawings
        let widths: LineWidths = [];
        let rooms: LineRooms = new Map();
        // The first of its lines not yet placed, and its drawings, by where they are in its items, anchored in lines that go
        // on to the next page or column, which are left for it
        let index = 0;
        let excluded: ReadonlySet<number> = new Set();
        let excludedAt = "";
        for (;;) {
            // The footnote of the line being placed that starts on the next page, after its others go on this one, found
            // afresh each time the line is tried, as a line tried again may fit with all of them
            let startsAfter: string | undefined;
            // Those left for the next page or column are left only where they were found to be
            if (excludedAt !== `${pageCount} ${column} ${index}`) {
                excluded = new Set();
            }
            widths = widthsFrom(widths, index, columnsSection().columns[column]);
            const isFirstLine = index === 0;
            if (movesOn && isFirstLine && !placedInColumn && taller[column]) {
                nextColumn();
                continue;
            }
            // A first line of only a page break at the top of a page whose footnote goes on from the page before, as the rest
            // of the page before took the room it would have had, takes no room there and starts no page of its own: the text
            // after it goes on that page, as Word put it (stops2/word-stops-notes2.ts NT21)
            const [first] = isFirstLine && !placedInColumn && continued !== undefined ? linesOf(block, widths) : [];
            if (first?.breakAfter === "page" && first.textWidth === 0) {
                mark(first.markers);
                index = 1;
                if (index === linesOf(block, widths).length) {
                    break;
                }
                continue;
            }
            // The border above the first line stays at the top of a page, as the space before doesn't. Which of two between
            // borders that differ Word draws there hasn't been seen
            if (isFirstLine && !placedInColumn && paragraph.joinedUnlike === true) {
                stopAt("a paragraph at the top of a page in one box with the one before, whose between border is another");
            }
            if (!placedInColumn && block.unknownAtTop !== undefined) {
                stopAt(block.unknownAtTop);
            }
            const above = isFirstLine ? spaceAbove() + paragraph.borderAbove : 0;
            const atTop = suppressesTopSpacing === true && !placedInColumn;
            const space = above - (atTop ? cutAbove(block, isFirstLine, paragraph.borderAbove) : 0);
            // Its lines in rows down the column, beside the drawings on the page and its own, placed against its top. The space
            // after the paragraph before is that paragraph's, so its top is below it, and only the rest of the space above it
            // is its own (`word-floats2.docx` G7 to G10)
            const theirs = Math.min(spaceAfter, isFirstLine ? spaceAbove() : 0);
            const laid = rowsOf(block, widths, rooms, index, position + space, { top: position + theirs, own: above - theirs }, excluded);
            const { lines, rows } = laid;
            const remaining = rows.map(({ line }) => line);
            /** How many of its lines are on the rows up to one */
            const linesUpTo = (upTo: number): number => sum(rows.slice(0, upTo).map(({ count: onRow }) => onRow));
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
            // A paragraph's last line needs room for its border below it too, or the space a between border leaves, and
            // goes to the next page without it (`word-paragraph-formats.docx` B4a, B4b)
            const ends = index + linesUpTo(rows.length) === lines.length;
            const notesOnPage = noteArea > 0 || reserved() > 0;
            const hangs = (upTo: number): boolean =>
                hangsBelow(notesOnPage || notesOf(upTo).length > 0, ends && upTo === remaining.length && paragraph.borderBelow > 0);

            const { fits, count: kept } = linesThatFit(
                remaining,
                room,
                paragraph,
                isFirstLine,
                (upTo) => noteCost(leastNoteRoom(notesOf(upTo))) + (ends && upTo === remaining.length ? paragraph.borderBelow : 0),
                hangs,
            );
            // A line whose footnote moved on from the page when it was laid out again goes on the next page, and what follows
            // it (`word-watertight-notes.docx` FN1)
            const moved = movedFromPage();
            const movedLine = remaining.findIndex(({ markers }) => markers.some((marker) => moved.includes(marker)));
            const beforeMoved = movedLine === -1 ? Infinity : linesKept(remaining.length, movedLine, paragraph, isFirstLine);
            // The footnotes held back from the paragraph kept with this one that continue on the next page go below as many
            // of its lines as it is kept with, and take the rest of the page (`word-watertight-stops.docx` SP4)
            let count = Math.min(
                heldLines !== undefined && heldNotes.length > 0 && !holdNotes ? Math.min(kept, heldLines) : kept,
                beforeMoved,
            );
            /** Whether its first line fits without its footnotes, when it doesn't with them */
            const fitsAlone = (): boolean => fits === 0 && linesThatFit(remaining, room, paragraph, isFirstLine, undefined, hangs).fits > 0;
            const lineNotes = notesOf(1);
            // Guessing, a line whose footnote moved on goes on from the top of a later column too (see `checkReserve`)
            const referenceMovesOn = movingOn.has(pageCount) && beforeMoved === 0 && column > 0 && !placedInColumn;
            if (referenceMovesOn) {
                stopAt(MOVES_ON_FROM_TOP);
            }
            // Nothing fits on an empty page, so as much as fits goes on it, and at least a line, unless the end of a
            // footnote continued from the page before is on it, which leaves the next page for them
            if (count === 0 && !placedInColumn && continued === undefined && !referenceMovesOn) {
                if (fits === 0 && lineNotes.length > 0 && belowContinued()) {
                    // Below a footnote that continues on the next page in columns, at the top of a column, it goes on the
                    // next page with its footnotes (NT5b)
                    startPage();
                    continue;
                }
                if (fits === 0 && lineNotes.length > 0) {
                    // In columns being balanced, which were laid out at their full height before, it's their height
                    stopIfBalancing();
                    if (!fitsAlone()) {
                        throw new Unsupported("a line and its footnote taller than a page");
                    }
                    const laterColumn = column > 0 && !(startedInColumn() && column === sectionColumn);
                    if (columnsSection().columns.length > 1 && lineNotes.length === 1 && leastTallerThanPage(lineNotes[0])) {
                        // A line whose footnote can't go on a page with it, as its least is taller than a page, goes on the next
                        // page from the top of a later column, and at the top of the page's columns stays there without it,
                        // and the footnote starts on the next page, as across the page (SP5): Word put a line at the top of the
                        // second column whose footnote was 55 lines kept together at the top of the next page, and the footnote
                        // on the next two (`word-notes-across-pages.docx` NP2)
                        if (laterColumn) {
                            startPage();
                            continue;
                        }
                        [deferred] = lineNotes;
                        carried = { name: deferred, from: { block: 0, line: 0 } };
                        count = 1;
                    } else if (columnsSection().columns.length > 1) {
                        // At the top of the page's columns, or of the column a section starts in after the section before's,
                        // a line whose footnotes don't fit stays, and the last of them continues on the next page
                        // (`word-watertight-notes.docx` FN2, FN3). At the top of another column, Word lays out the columns
                        // before it again above as much of the footnote as leaves the line on the page (FN3)
                        if (laterColumn) {
                            searchNoteRoom(lineNotes[lineNotes.length - 1]);
                        }
                        count = 1;
                    } else if (lineNotes.length === 1 && startsOnNextPage(lineNotes[0])) {
                        // At the top of a page, a line whose footnote can't go on a page with it, as its least is taller than
                        // a page, stays there without it, and the footnote starts on the next page (SP5)
                        [deferred] = lineNotes;
                        carried = { name: deferred, from: { block: 0, line: 0 } };
                        count = 1;
                    } else if (
                        lineNotes.length > 1 &&
                        linesThatFit(remaining, room, paragraph, isFirstLine, () => noteCost(moreNoteRoom(lineNotes.slice(0, -1))), hangs)
                            .fits > 0
                    ) {
                        // At the top of a page, a line whose last footnote doesn't fit below the others stays there with them,
                        // and that one starts on the next page: the first of two footnotes of 30 lines kept together below the
                        // line, and the second on the next page (stops2/word-stops-notes2.ts NT9d)
                        startsAfter = lineNotes[lineNotes.length - 1];
                        count = 1;
                    } else {
                        throw new Unsupported("a line and its footnote taller than a page");
                    }
                } else {
                    // Columns being balanced are too short for lines that would go at the top of a column as tall as the page's
                    if (linesThatFit(remaining, pageBottom - noteArea - position - space, paragraph, isFirstLine).count > 0) {
                        stopIfBalancing();
                    }
                    count = Math.max(1, fits);
                }
            }
            // A drawing anchored in a line that goes on to the next column or page goes there with it, against the top of
            // the paragraph's part there (`word-floats2.docx` G20), so the lines here are laid out again without it. Where
            // the lines without it bring its anchor back, Word's way isn't known
            const placedEnd = index + linesUpTo(count);
            const later = count > 0 ? laid.placed.filter(({ line }) => line >= placedEnd) : [];
            if (later.length > 0) {
                excluded = new Set([...excluded, ...later.map(({ item }) => item)]);
                excludedAt = `${pageCount} ${column} ${index}`;
                continue;
            }
            if (
                count > 0 &&
                [...excluded].some((item) => lines.findIndex(({ markers }) => markers.includes(drawingMarker(item))) < placedEnd)
            ) {
                throw new Unsupported("a drawing whose anchor's page changes as the text goes round it");
            }
            // A drawing of its own that moves with the text and would go past the bottom of the page's text moves to the next
            // column or page with the paragraph, as Word moves it, rather than its lines go beside it (`word-floats.docx` F20,
            // `word-floats2.docx` G17), above footnotes too (`word-stops-drawings.docx` DR10c). Where it goes at the top of a
            // column, or when only its distance from the text below it goes past, isn't known
            const onPage = Math.max(placedEnd, index + 1);
            const sinking = laid.placed.filter(
                ({ line, drawing: { drawing, keepOut } }) =>
                    line < onPage &&
                    (drawing.vertical.from === "paragraph" || drawing.vertical.from === "line") &&
                    keepOut.bottom > linesBottom() + TOLERANCE,
            );
            const brokenTable = sinking.find((one): one is AnchoredDrawing & { readonly table: FloatingTable } => one.table !== undefined);
            if (
                brokenTable !== undefined &&
                sinking.length === 1 &&
                floatsBefore(blockIndex).length === 1 &&
                laid.placed.length === 1 &&
                breakAcross(brokenTable)
            ) {
                // Broken across the pages, with the paragraph laid out again at the top of the page its last rows are on
                continue;
            }
            if (sinking.some(({ table }) => table !== undefined)) {
                // Word breaks one with others before the paragraph, or drawings of the paragraph's own, across pages in ways not
                // yet followed. Guessing, the tables before the paragraph are laid out in the text, and it after them
                const run = floatsBefore(blockIndex);
                inlineFloats(run, "a table that text flows around going past the bottom of the page");
                const paragraphIndex = blockIndex;
                for (const table of run) {
                    blockIndex = table;
                    placeTable(blocks[table].block as TableBlock);
                }
                blockIndex = paragraphIndex;
                continue;
            }
            if (sinking.length > 0) {
                // Columns being evened out are too short for it, so they are tried taller
                stopIfBalancing();
                const fitting = sinking.every(
                    ({ drawing: { drawing, box } }) => box.bottom + drawing.effects.bottom > linesBottom() + TOLERANCE,
                );
                if (!fitting || !placedInColumn) {
                    throw new Unsupported("a drawing that moves with its paragraph past the bottom of the page's text");
                }
                nextColumn();
                continue;
            }
            if (count > 0) {
                // The tables that text flows around before it are on the page where they were placed, before its lines
                for (const { drawing, table } of laid.placed) {
                    if (table !== undefined) {
                        placeFloatingRows(table, drawing.box.top);
                    }
                }
                position += space;
                checkKept(blockIndex);
                const current = columnsSection();
                const placedLines = linesUpTo(count);
                for (const row of rows.slice(0, count)) {
                    position += row.skip;
                    for (const offset of Array.from({ length: row.count }, (_, line) => row.first + line)) {
                        const line = lines[offset];
                        mark(line.markers);
                        // eslint-disable-next-line functional/immutable-data
                        placements.push({
                            type: "line",
                            block: blockIndex,
                            line: placedLine(
                                line,
                                block.format,
                                offset === 0,
                                columnLeft(current, column),
                                current.columns[column],
                                position,
                                laid.rooms.get(offset),
                            ),
                        });
                    }
                    position += row.height;
                }
                // Its drawings anchored in the lines placed are on the page, beside what comes after them, and those left for
                // the next are placed there
                placeDrawings(laid.placed);
                ({ rooms } = laid);
                if (index + placedLines === lines.length) {
                    position += paragraph.borderBelow;
                }
                // The space after the paragraph before is above these lines now, and this one's comes at its end
                spaceAfter = 0;
                // That of a line whose footnote starts on the next page isn't placed on this one
                const startsLater = deferred ?? startsAfter;
                const notes = notesOf(count).filter((name) => name !== startsLater);
                if (holdNotes && index + placedLines === lines.length) {
                    // They go below the lines of the paragraph this one is kept with
                    held = notes;
                } else {
                    held = [];
                    heldLines = undefined;
                    placeNotes(notes);
                }
                if (startsAfter !== undefined) {
                    deferred = startsAfter;
                    carried = { name: deferred, from: { block: 0, line: 0 } };
                }
                placedInColumn = true;
                index += placedLines;
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
     * room, or as many up to a line (`limit`, counted from the part's first) as widow control lets the part end at. The
     * space before a paragraph at the top of the part on the next page is left out, as it is at the top of a page. It
     * says how many lines fit in the room too (`fits`), with those widow control and keepLines hold back.
     */
    const fillCell = (paragraphs: readonly CellParagraph[], room: number, isFirstPart: boolean, limit = Infinity): CellPart => {
        let used = 0;
        let previousAfter: number | undefined;
        let placed: readonly LaidOutLine[] = [];
        for (const [index, item] of paragraphs.entries()) {
            if (!("paragraph" in item)) {
                // A table has no space of its own, so the space after the paragraph before it is kept above it, as where the
                // row is whole
                const above = item.from > 0 || item.broken !== undefined ? 0 : (previousAfter ?? 0);
                const part = fillTable(item, room - used - above);
                const placedAbove = placed.length;
                if (part.lines.length > 0) {
                    used += above + part.height;
                    placed = [...placed, ...part.lines];
                }
                if (part.rest.length > 0) {
                    return {
                        ...part,
                        height: used,
                        lines: placed,
                        rest: [...part.rest, ...paragraphs.slice(index + 1)],
                        fits: placedAbove + part.fits,
                    };
                }
                previousAfter = 0;
                continue;
            }
            const { paragraph, from } = item;
            if (from === 0 && previousAfter === undefined && !isFirstPart && paragraph.joinedUnlike === true) {
                stopAt("a paragraph at the top of a page in one box with the one before, whose between border is another");
            }
            const space =
                from > 0
                    ? 0
                    : (previousAfter === undefined
                          ? isFirstPart
                              ? paragraph.spaceBefore
                              : 0
                          : between(previousAfter, paragraph.spaceBefore)) + paragraph.borderAbove;
            const remaining = paragraph.lines.slice(from);
            // Widow control and keepLines hold lines back in a row that breaks across pages, as in Word, where LibreOffice
            // lets them go (`word-rules.docx` P8, `word-rules2.docx` Q3). A paragraph that ends in the cell's part on the
            // page needs room for its space after there too, as in Word (`word-line-heights.docx` T2), and for its border.
            // Whether a line's multiple spacing can go below the bottom of the page at the end of a row's part isn't known
            const { fits, count: kept } = linesThatFit(
                remaining,
                room - used - space,
                paragraph,
                from === 0,
                (upTo) => (upTo === remaining.length ? paragraph.borderBelow + paragraph.spaceAfter : 0),
                () => {
                    throw new Unsupported("a table row across pages whose line's multiple spacing goes below the page");
                },
            );
            const upToLimit = limit - placed.length;
            const count = fits <= upToLimit ? kept : upToLimit > 0 ? linesKept(remaining.length, upToLimit, paragraph, from === 0) : 0;
            const before = placed.length;
            if (count > 0) {
                used += space + linesHeight(remaining.slice(0, count)) + (count === remaining.length ? paragraph.borderBelow : 0);
                placed = [...placed, ...remaining.slice(0, count)];
            }
            if (count < remaining.length) {
                return {
                    height: used,
                    lines: placed,
                    rest: [{ paragraph, from: from + count }, ...paragraphs.slice(index + 1)],
                    fits: before + fits,
                };
            }
            previousAfter = paragraph.spaceAfter;
        }
        return { height: used + (previousAfter ?? 0), lines: placed, rest: [], fits: placed.length };
    };

    /**
     * Fills a table in a cell's part of a row that breaks across pages: as many of its rows left as fit in the room, and
     * then as many of the next row's lines as fit, broken as a row of the body breaks, as Word breaks a table in a cell
     * between its rows, and in them between their lines, keeping to widow control (`word-probes.docx` U4c, U4d), and as it
     * breaks a table in the body, with its borders and its cells' margins (`word-nested-tables.docx` N1 to N8). Each row
     * on the page, or part of one, is a line of the cell's part. It says why where Word's breaking of the table isn't known.
     */
    const fillTable = ({ table, heights, from, broken }: CellTable, room: number): CellPart => {
        const last = table.rows.length - 1;
        const bottomBorder = table.rows.at(-1)?.borderBottom ?? 0;
        // Word doesn't repeat the header rows of a table in a cell on the next page (`word-stops-tables.docx` RW1), and
        // breaks one with cells merged down its rows, whose text is all in their first rows, as any other (RW2), and one
        // whose text goes on past its first row, where all of its rows are on the page (`word-stops-rows2.docx` RW20). How it
        // breaks the text of one whose rows go on across the break, and what it draws where one with space between its
        // cells breaks, aren't known
        const ownHeights = rowHeights(table, []);
        const goingOn = mergesOf(table).filter(
            ({ first, height }) => table.rows[first].borderTop + height > ownHeights[first] - table.rows[first].borderBottom + TOLERANCE,
        );
        /** Why where the table breaks at a row (`index`), before it or in it, isn't known */
        const unknownAt = (index: number): string | undefined =>
            goingOn.some(({ first, last: end }) => first <= index && index <= end)
                ? "a cell merged down the rows of a table in a table cell, whose text goes on past its first row, across pages"
                : table.cellSpacing === undefined
                  ? undefined
                  : "a table with space between its cells in a table cell across pages";
        let used = 0;
        let placed: readonly LaidOutLine[] = [];
        /** The cell's part where the table breaks before a row (`index`), or in it with the paragraphs left in its cells */
        const breaksAt = (
            index: number,
            cells: readonly (readonly CellParagraph[])[] | undefined,
            unsupported: string | undefined,
        ): CellPart => ({
            height: used,
            lines: placed,
            rest: [{ table, heights, from: index, ...(cells === undefined ? {} : { broken: cells }) }],
            fits: placed.length,
            ...(placed.length === 0 || unsupported === undefined ? {} : { unsupported }),
        });
        for (let index = from; index <= last; index++) {
            const row = table.rows[index];
            // The border below the row where the table breaks after it, which takes room on the page as in the body
            const breakBorder = index < last ? (row.breakBorder ?? bottomBorder) : 0;
            // The paragraphs left in the row's cells, when it broke across pages on the page before
            const brokenCells = index === from ? broken : undefined;
            // Where the table goes on from the page before, the first of its rows on the page has the table's top border
            // above it, as Word draws it, whatever the border between the rows (`word-nested-tables.docx` N1c)
            const borderTop = index === from && (from > 0 || broken !== undefined) ? table.rows[0].borderTop : row.borderTop;
            const whole = heights[index] - row.borderTop + borderTop;
            if (brokenCells === undefined && used + whole + breakBorder <= room + TOLERANCE) {
                placed = [
                    ...placed,
                    {
                        height: whole,
                        markers: row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf)),
                        text: "",
                        textWidth: 0,
                    },
                ];
                used += whole;
                continue;
            }
            const unknown = unknownAt(index);
            if (unknown !== undefined) {
                return breaksAt(index, brokenCells, unknown);
            }
            const borders = borderTop + row.borderBottom;
            const margins = rowMarginsOf(row);
            const cells = brokenCells ?? row.cells.map(cellParagraphs);
            const cellRoom = room - used - borders - margins - breakBorder;
            const parts = cells.map((paragraphs) => fillCell(paragraphs, cellRoom, brokenCells === undefined));
            // As a row of the body, it breaks only where each of its cells with lines left keeps some of them on the page,
            // and not when it is kept whole (N4, N7). One of an at-least height breaks only where its height fits (N5). Its
            // margins above and below are around its cells' lines on each page (N3)
            const placesLines =
                (brokenCells !== undefined ||
                    (!row.cantSplit &&
                        row.height?.rule !== "exact" &&
                        (row.height?.value ?? 0) <= room - used - borders - breakBorder + TOLERANCE)) &&
                parts.some(({ lines }) => lines.length > 0) &&
                cells.every((paragraphs, cell) => paragraphs.length === 0 || parts[cell].lines.length > 0);
            if (!placesLines) {
                // The table breaks before the row, with the border below the row above it (N1)
                used += index > from ? (table.rows[index - 1].breakBorder ?? bottomBorder) : 0;
                return breaksAt(index, brokenCells, undefined);
            }
            const rows = parts.map(({ rest }) => rest);
            const height = Math.max(...parts.map((part) => part.height)) + margins + borders;
            placed = [
                ...placed,
                {
                    height,
                    markers: [
                        ...parts.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)),
                        ...(brokenCells === undefined ? row.cells.flatMap(roomlessOf) : []),
                    ],
                    text: "",
                    textWidth: 0,
                },
            ];
            used += height;
            if (rows.some((rest) => rest.length > 0)) {
                // The row breaks, with the border below it where the table breaks (N2), as a row in the text breaks, the text
                // that runs up or down one of its cells on the page of its first part
                used += breakBorder;
                return breaksAt(index, rows, parts.find((part) => part.unsupported !== undefined)?.unsupported);
            }
        }
        return { height: used, lines: placed, rest: [], fits: placed.length };
    };

    /**
     * A cell's paragraphs, as a row that breaks across pages fills them. Text that runs up or down a cell, and an empty
     * paragraph whose mark takes no room, take none here
     */
    const cellParagraphs = (cell: TableCell): readonly CellParagraph[] =>
        (cell.vertical ? [] : blocksWithRoom(cell)).map((block, index, stack): CellParagraph => {
            if (block.type === "paragraph") {
                return { paragraph: measureParagraph(block, textWidthOf(cell), stack[index - 1], stack[index + 1], true), from: 0 };
            }
            const table = sizedToPlace(block, textWidthOf(cell));
            return { table, heights: rowHeights(table), from: 0 };
        });

    /** The markers of what in a cell takes no room: text that runs up or down it, and an empty paragraph whose mark takes none */
    const roomlessOf = (cell: TableCell): readonly string[] =>
        (cell.vertical ? cell.blocks : cell.blocks.slice(blocksWithRoom(cell).length)).flatMap(markersOf);

    /** Whether a cell starts a merge down rows, whose text is laid out with the rows it is merged down */
    const startsMerge = ({ verticalMerge, vertical }: TableCell): boolean => verticalMerge === "restart" && !vertical;

    /**
     * The markers of the lines of paragraphs left, from the first not yet placed, and of the rows of tables left, from the
     * first not yet placed, all of whose markers are given, as those of a row that broke placed already stay where they are
     */
    const markersLeft = (paragraphs: readonly CellParagraph[]): readonly string[] =>
        paragraphs.flatMap((item) =>
            "paragraph" in item
                ? item.paragraph.lines.slice(item.from).flatMap(({ markers }) => markers)
                : item.table.rows.slice(item.from).flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf))),
        );

    /**
     * The text of a cell merged down rows left after it filled its rows on a page, which goes on from the top of its rows on
     * the next page, as a paragraph's lines go on, keeping to widow control: beside the rest of a row that breaks across
     * three pages (`word-stops-rows2.docx` RW13), and, where none of it goes on the page, as one line of a paragraph of more
     * would be alone at its foot, all of it in the rows on the next (RW14a, RW14b, RW16a). Undefined when all of it is placed
     */
    const goesOn = (merge: OpenMerge, rest: readonly CellParagraph[], placed: boolean): OpenMerge | undefined => {
        if (rest.length === 0) {
            return undefined;
        }
        if (notesIn(merge.cell.blocks.flatMap(markersOf)).length > 0) {
            // Its footnotes went with the first of its rows, and stay there guessing
            stopAt("a footnote in a cell merged down table rows whose text goes on across pages");
        }
        if (merge.header) {
            // Whether Word repeats the part of it in the header rows above the rest of it isn't known: guessing, it doesn't
            stopAt("a cell merged down from a table's header rows whose text goes on across pages");
        }
        if (columnsSection().columns.length > 1) {
            // Whether it goes on into the next column as onto the next page hasn't been seen: guessing, it does
            stopAt("a cell merged down table rows whose text goes on across columns");
        }
        return { ...merge, rest, start: undefined, startTop: undefined, broken: merge.broken || placed, moved: true };
    };

    /**
     * Ends the part of the text of the cells merged down rows that have rows on the page that goes in them, where the page
     * breaks below them (`end`). The rest goes on in their rows on the next page (`goesOn`)
     */
    const closeMerges = (end: number): void => {
        openMerges = openMerges.flatMap((merge) => {
            const { cell, rest, start, broken } = merge;
            if (start === undefined) {
                return [merge];
            }
            const { lines, rest: left } = fillCell(rest, end - start - cell.marginTop - cell.marginBottom, !broken);
            mark(lines.flatMap(({ markers }) => markers));
            const next = goesOn(merge, left, lines.length > 0);
            return next === undefined ? [] : [next];
        });
    };

    /**
     * Places a row of a set height taller than the page, at the top of one: it takes the rest of the page, cut off at its
     * bottom, so what follows goes on the next page, as Word lays out one set to exactly or at least 15000 twips, with
     * 13958 of room (`word-probes.docx` U5c, U5d), as LibreOffice does. In columns, it goes in the first column of a page,
     * and what follows goes on the next page (`word-stops-rows2.docx` RW19b).
     *
     * The text of a cell merged down from it or to it from a row above goes in it, in all of its height where that is
     * exact, past the bottom of the page (`word-stops-tables.docx` RW5a, RW16a, RW16b: 58 lines of 60 in a row of 16000
     * twips, the last two, kept together by widow control, in the row after it on the next page), and the rest of the text of
     * one merged down past it goes on in the rows after it on the next page (`goesOn`). What Word does with the text of one
     * that ends in it and doesn't fit isn't known.
     *
     * Its footnotes go at the bottom of the next page, the first starting there as one does that can't go on a page with its
     * line, and those after it below it (RW5c, RW15a). A header row isn't repeated on the next page, and what comes after the
     * table goes on the page after the one it ends on (RW5b, RW18)
     */
    const placeCutRow = (row: TableRow, index: number): void => {
        const own = row.cells.filter((cell) => !startsMerge(cell)).flatMap((cell) => cell.blocks.flatMap(markersOf));
        const markers = [...own, ...row.cells.filter(startsMerge).flatMap(roomlessOf)];
        const height = linesBottom() - position;
        const room = row.height?.rule === "exact" ? row.height.value - row.borderTop : height - row.borderTop - row.borderBottom;
        // Its footnotes, those of its own cells and of the text of cells merged down it that ends in it. Nothing else is on
        // the page, at whose top it is
        let notes = notesIn(own);
        openMerges = openMerges.flatMap((merge) => {
            const { lines, rest } = fillCell(merge.rest, room - merge.cell.marginTop - merge.cell.marginBottom, !merge.broken);
            const placed = lines.flatMap(({ markers: lineMarkers }) => lineMarkers);
            mark(placed);
            notes = [...notes, ...notesIn(placed)];
            if (rest.length > 0 && merge.last === index) {
                throw new Unsupported("the text of a cell merged down into a table row of a set height taller than a page, longer than it");
            }
            const next = goesOn(merge, rest, lines.length > 0);
            return next === undefined ? [{ ...merge, rest: [] }] : [next];
        });
        mark(markers);
        placeRow(index, position, height);
        position = linesBottom();
        placedInColumn = true;
        if (notes.length > 0) {
            [deferred] = notes;
            carried = { name: deferred, from: { block: 0, line: 0 } };
            pending = [...pending, ...notes.slice(1)];
        }
        cutHeader ||= row.header;
        // The other columns of the page are left empty
        while (column < columnsSection().columns.length - 1) {
            nextColumn();
            position = linesBottom();
            placedInColumn = true;
        }
    };

    /**
     * Places a row that doesn't fit on the page with its footnotes by breaking it across pages between the lines of its
     * cells, as Word breaks a row unless it is kept whole, with the footnotes of the lines on each page at its bottom. A
     * row none of whose lines fit with their footnotes moves to the next page. The table's header rows are repeated above
     * the rest of it on each page and in each column.
     *
     * The text of a cell merged down rows starts at the top of its first row, and goes down across its rows, so the row of
     * them that breaks across pages breaks it with its own cells, as far down the page as its lines go, keeping to its
     * widow control (`word-probes.docx` U4a). The rest of it goes on from the top of its rows on the next page: in the
     * row's part there when it is the last row of the merge (U4a), and otherwise across the rows after it, which go below
     * the rest of the row, as the next row of a merge whose text is all on the page does (U4b)
     *
     * @param breakBorder - The border below the row on a page where the table breaks: the table's bottom border, which the
     * last row has counted already
     * @param table - Whether the row before is kept with this one, and whether the row is the last of a table with space
     * between its cells
     */
    const splitRow = (
        row: TableRow,
        rowIndex: number,
        height: number,
        breakBorder: number,
        startTablePage: (continuing: boolean, newPage?: boolean) => void,
        table: { readonly kept: boolean },
    ): void => {
        // The cells that start a merge are laid out with the rows they are merged down
        const own = row.cells.filter((cell) => !startsMerge(cell));
        let parts = own.map(cellParagraphs);
        let isFirstPart = true;
        // Whether it is a row of an at-least height taller than a page whose text is too, whose parts each fill their page
        let fillsPages = false;
        // Whether it goes down the first column of each page, as one whose paragraph kept together is taller than a column
        let firstColumnsOnly = false;
        // The bookmarks of what takes no room start with the row's first part
        const roomless = row.cells.flatMap(roomlessOf);
        if (notesIn(roomless).length > 0) {
            throw new Unsupported("a footnote in text that runs up or down a table cell");
        }
        const borders = row.borderTop + row.borderBottom;
        // The largest margins above and below of the row's cells, around each of its own cells' text
        const rowMargins = rowMarginsOf(row);
        // The cells of the row's part being filled: its own, then those merged down to it whose text goes on in it
        let cells: readonly RowCell[] = [];
        /** The room for a cell's text in a room for the row's part */
        const roomOf = (cell: number, room: number): number => room - cells[cell].margins + cells[cell].above;
        /** How tall a cell's part makes the row's, with its margins */
        const heightInRow = (part: CellPart, cell: number): number => cells[cell].margins + part.height - cells[cell].above;
        const tallestOf = (cellParts: readonly CellPart[]): number => Math.max(0, ...cellParts.map(heightInRow));
        const notesOfPart = (part: CellPart, cell: number): readonly string[] =>
            cells[cell].counted ? notesIn(part.lines.flatMap(({ markers }) => markers)) : [];
        const notesOf = (cellParts: readonly CellPart[]): readonly string[] => cellParts.flatMap(notesOfPart);
        /** The room for the row's part on the page, above footnotes that take this much more room */
        const roomAbove = (more: number): number => linesBottom(more) - position - borders - breakBorder;
        const fitsWith = (cellParts: readonly CellPart[], more: number): boolean => tallestOf(cellParts) <= roomAbove(more) + TOLERANCE;
        /**
         * The cells' parts on the page, with the footnotes of their lines and the room those take, and the parts they would
         * have without the footnotes (`whole`). The lines fit where their footnotes fit below them, the last continued on
         * the next page when it can be, as a line's do, so each line's footnote goes on the page the line is on
         * (`word-probes.docx` U3a to U3c, U3e). Where they don't, the part is cut higher, until they do or none of its lines
         * are left.
         */
        const partOnPage = (): {
            readonly whole: readonly CellPart[];
            readonly filled: readonly CellPart[];
            readonly notes: readonly string[];
            readonly noteRoom: number;
        } => {
            /** Each cell's part in a room for the row's, or the part given for one of them (`cut`) */
            const fill = (room: number, cut?: { readonly cell: number; readonly part: CellPart }): readonly CellPart[] =>
                cells.map(({ paragraphs, isFirst }, cell) =>
                    cell === cut?.cell ? cut.part : fillCell(paragraphs, roomOf(cell, room), isFirst),
                );
            const placesAny = (cellParts: readonly CellPart[]): boolean => cellParts.some(({ lines }) => lines.length > 0);
            const whole = fill(roomAbove(0));
            let cutAt = roomAbove(0);
            let filled = whole;
            /**
             * Just above the bottom of the lowest of the cells' lines, so the part loses a line, even beside a cell without lines
             * that its margins make taller
             */
            const lowest = (cellParts: readonly CellPart[]): number =>
                Math.max(...cellParts.map((part, cell) => (part.lines.length > 0 ? heightInRow(part, cell) : 0))) - 2 * TOLERANCE;
            while (placesAny(filled) && !fitsWith(filled, leastNoteRoom(notesOf(filled)))) {
                cutAt = lowest(filled);
                filled = fill(cutAt);
            }
            // Where its footnotes fit whole below fewer of its lines, with the lines that refer to them, it is cut there, as Word
            // cuts a row with a table in a cell beside a line whose footnote would otherwise continue (`word-stops-notes.docx`
            // NT11)
            const referred = notesOf(filled);
            for (
                let at = cutAt, fitting = filled;
                referred.length > 0 && notesOf(fitting).length === referred.length;
                at = lowest(fitting), fitting = fill(at)
            ) {
                if (fitsWith(fitting, moreNoteRoom(referred))) {
                    cutAt = at;
                    filled = fitting;
                    break;
                }
            }
            const continues = placesAny(filled) && !fitsWith(filled, moreNoteRoom(notesOf(filled)));
            if (continues) {
                // The last footnote continues on the next page, and the row breaks after the line that refers to it, or the
                // first line after that widow control lets it break after, so the footnote takes the rest of the page. Word
                // doesn't put more of the row's lines above less of the footnote (U3d)
                const name = notesOf(filled)[notesOf(filled).length - 1];
                const cell = filled.findLastIndex(({ lines }) => lines.some(({ markers }) => markers.includes(name)));
                const { paragraphs, isFirst } = cells[cell];
                const reference = filled[cell].lines.findIndex(({ markers }) => markers.includes(name)) + 1;
                let part = fillCell(paragraphs, roomOf(cell, cutAt), isFirst, reference);
                for (let limit = reference + 1; part.lines.length < reference; limit++) {
                    part = fillCell(paragraphs, roomOf(cell, cutAt), isFirst, limit);
                }
                filled = fill(heightInRow(part, cell), { cell, part });
            }
            const notes = notesOf(filled);
            const noteRoom = fitsWith(filled, moreNoteRoom(notes)) ? moreNoteRoom(notes) : leastNoteRoom(notes);
            if (!fitsWith(whole, moreNoteRoom(notesOf(whole)))) {
                // Footnotes cut the row higher than its lines go without them. Where a cell has fewer lines on the page than
                // fit above them, held back by widow control or by the cut, which of them Word keeps beside the cell that
                // refers to them isn't known. A cell with no more lines on the page without the footnotes, as one kept
                // together that doesn't fit beside the row's other lines, keeps them as the row is cut: Word moved a row whose
                // second cell of 6 lines kept together didn't fit in the 4 lines left, with the first cell's footnote, to the
                // next page (`word-stops-notes.docx` NT7)
                const referring = whole.flatMap((part, cell) => (notesOfPart(part, cell).length > 0 ? [cell] : []));
                const heldRoom = continues ? tallestOf(filled) : roomAbove(noteRoom);
                const heldBack = (part: CellPart, cell: number): boolean =>
                    referring.some((other) => other !== cell) &&
                    part.lines.length < whole[cell].lines.length &&
                    fillCell(cells[cell].paragraphs, roomOf(cell, heldRoom), cells[cell].isFirst).fits > part.lines.length;
                if (filled.some(heldBack)) {
                    // Guessing, the cells keep their lines as the row is cut
                    stopAt("a footnote in a table row beside a cell whose lines it holds back");
                }
            }
            return { whole, filled, notes, noteRoom };
        };
        for (;;) {
            // Where the row's part goes, and whether it is its first
            const at = position;
            const isFirst = isFirstPart;
            // The cells merged down to the row whose text goes on in its part: all of them in its first part, and after that
            // those it is the last row of, as the text of the others goes on in the rows after it on the next page
            const flowing = openMerges.filter(({ last }) => isFirst || last === rowIndex);
            cells = [
                ...parts.map((paragraphs) => ({ paragraphs, margins: rowMargins, above: 0, isFirst, counted: true })),
                ...flowing.map(({ first, cell, rest, start = at, startTop = row.borderTop, broken }) => ({
                    paragraphs: rest,
                    margins: cell.marginTop + cell.marginBottom,
                    // Its text starts at the top of its rows on the page, below the border above the first of them, and goes
                    // down across the borders between them, as its height does where it makes the last of them taller, to
                    // above the last's border below (`word-stops-tables.docx` RW4a, RW4b)
                    above: at - start + row.borderTop - startTop,
                    isFirst: !broken,
                    // Its footnotes went with the first of its rows, when that is above
                    counted: first === rowIndex,
                })),
            ];
            const { whole, filled, notes, noteRoom } = partOnPage();
            // Whether a cell ends with the row, rather than going on in the rows after it: its own cells, and the cells merged
            // down to it that it is the last row of
            const ends = (cell: number): boolean => cell < own.length || flowing[cell - own.length].last === rowIndex;
            const isLastPart = filled.every(({ rest }, cell) => rest.length === 0 || !ends(cell));
            // The cells that decide where the row breaks: all of them where it breaks, and otherwise those that end with it,
            // as the text of the others goes on in the rows after it on the page
            const decides = (cell: number): boolean => !isLastPart || ends(cell);
            // The row only breaks where each of its cells with lines left keeps some of them on the page, as in Word. When
            // widow control or keepLines hold back all of a cell's lines, the row moves to the next page whole
            // (`word-rules2.docx` Q3c). A row of an at-least height only breaks where the page has room for its height above
            // the footnotes, and otherwise moves to the next page whole too (`word-line-heights.docx` T3), as a row that
            // would go on it whole does when its height doesn't fit
            const placesLines =
                (!isFirstPart ||
                    fillsPages ||
                    (isLastPart ? height - borders : (row.height?.value ?? 0)) <= roomAbove(noteRoom) + TOLERANCE) &&
                filled.some(({ lines }, cell) => decides(cell) && lines.length > 0) &&
                cells.every(({ paragraphs }, cell) => !decides(cell) || paragraphs.length === 0 || filled[cell].lines.length > 0);
            // Where Word's breaking of the row isn't known, guessing, it breaks as other rows do
            if (placesLines && !isLastPart) {
                filled.forEach((part) => stopAtRead(part));
            }
            // A row at the top of a page that doesn't fit there whole is taller than a page, unless the end of a footnote
            // continued from the page before takes room on it, which leaves the next page for it. It breaks there, as Word
            // breaks one that can't break or whose paragraph is kept together (`word-probes.docx` U5b, U8c2). The layout
            // stops at one that fits, but not with its footnotes
            const fitsWhole = !isFirstPart || position + height + breakBorder <= linesBottom() + TOLERANCE;
            const atTop = !placedInColumn && continued === undefined;
            if ((!placesLines || !fitsWhole) && atTop) {
                stopIfBalancing();
                if (fitsWhole && notesOf(whole).length === 1 && deferred === undefined) {
                    // Its footnote starts on the next page, and it stays there whole, as a line does (SP5): Word put a row of 5
                    // lines whose first referred to a footnote of 50 lines kept together there, and the footnote on the next
                    // two pages (stops2/word-stops-notes2.ts NT8c)
                    [deferred] = notesOf(whole);
                    carried = { name: deferred, from: { block: 0, line: 0 } };
                    continue;
                }
                if (fitsWhole && notesOf(whole).length > 0) {
                    throw new Unsupported("a table row and its footnotes taller than a page");
                }
            }
            if (!placesLines && atTop) {
                if (isFirstPart && isLastPart) {
                    // All of its text fits, but not the height it is set to
                    placeCutRow(row, rowIndex);
                    return;
                }
                // A paragraph kept together at the top of a cell's part breaks there when the row's lines can't go on the
                // page without it, as one does at the top of a page in the text: 60 lines kept together in a row go 51
                // and 9 (U8c1 to U8c3)
                const kept = parts.some(
                    ([first]) => first !== undefined && "paragraph" in first && first.paragraph.keepLines && first.from === 0,
                );
                const tallerThanPage = isFirstPart && row.height !== undefined && row.height.value > roomAbove(0) + TOLERANCE;
                // A row of an at-least height taller than a page whose text is taller than one too breaks where its text
                // does, and each part of it fills its page, as Word lays it out (`word-stops-tables.docx` RW6). One with
                // footnotes hasn't been seen
                if (tallerThanPage && !fillsPages && notesOf(whole).length === 0 && filled.some(({ lines }) => lines.length > 0)) {
                    fillsPages = true;
                    continue;
                }
                if (!kept) {
                    throw new Unsupported(
                        tallerThanPage
                            ? "a table row whose text and set height are both taller than a page"
                            : "a line in a table cell taller than a page",
                    );
                }
                if (section().columns.length > 1) {
                    // Word lays a row whose paragraph kept together is taller than a column down the first column of each
                    // page, from a new page unless it is at the top of one, as it lays the paragraph out
                    // (`word-stops-rows2.docx` RW19a)
                    firstColumnsOnly = true;
                    if (column > 0) {
                        closeMerges(position);
                        startTablePage(!isFirstPart, true);
                        continue;
                    }
                }
                parts = parts.map((paragraphs) =>
                    paragraphs.map((part, index) =>
                        index === 0 && "paragraph" in part ? { ...part, paragraph: { ...part.paragraph, keepLines: false } } : part,
                    ),
                );
                continue;
            }
            if (!placesLines && isFirstPart && table.kept) {
                // The rows kept with this one stayed on the page for its first lines, which would then move to the next.
                // Guessing, it moves on its own
                stopAt("a table row kept with the next before a row that moves to the next page");
            }
            if (!placesLines) {
                // The row goes to the next page whole, so the text of the cells merged down to it from rows above ends in those
                closeMerges(position);
                startTablePage(!isFirstPart, firstColumnsOnly);
                continue;
            }
            mark([
                ...filled.flatMap(({ lines }, cell) => (decides(cell) ? lines.flatMap(({ markers }) => markers) : [])),
                ...(isFirstPart ? roomless : []),
            ]);
            // A row that moved to the next page whole is as tall there as it is anywhere. The part of a row on this page or in
            // this column, which columns being balanced end below, has the table's bottom border below it
            const rowPart = fillsPages
                ? linesBottom() - position
                : isLastPart
                  ? (isFirstPart ? height - borders : tallestOf(filled)) + borders
                  : tallestOf(filled) + borders + breakBorder;
            placeRow(rowIndex, position, rowPart);
            position += rowPart;
            // Its footnotes go below it, and one that continues takes the rest of the page, below the table's bottom border
            // when the table breaks after it
            placeNotes(notes, isLastPart ? breakBorder : 0);
            // The text of the cells merged down to the row that is in its part ends there, and the rest goes on from the top
            // of their rows on the next page. The rows of a merge start where the first of them on the page does
            openMerges = openMerges.flatMap((merge): readonly OpenMerge[] => {
                const index = flowing.indexOf(merge);
                const placed = { ...merge, start: merge.start ?? at, startTop: merge.startTop ?? row.borderTop };
                if (index === -1 || !decides(own.length + index)) {
                    return [placed];
                }
                const { rest, lines } = filled[own.length + index];
                const next = goesOn(merge, rest, lines.length > 0);
                return next === undefined ? [] : [next];
            });
            if (isLastPart) {
                placedInColumn = true;
                return;
            }
            // The text of the cells merged down to the row that doesn't go on in its part ends above the break
            closeMerges(position - breakBorder);
            parts = filled.slice(0, own.length).map(({ rest }) => rest);
            isFirstPart = false;
            startTablePage(true, firstColumnsOnly);
        }
    };

    /**
     * Places a table, with as much of it on each page as fits there. Word doesn't leave a table's header rows alone at the
     * foot of a page or column: when none of the row after them goes there, as it is of a set height or kept with the next,
     * they go on to the next page with it (`word-stops-floats.docx` HR1a, HR1d, and the `tables-across-pages` demo), and
     * where it can break, as many of its lines as fit go there with them (HR1c, HR1e to HR1g)
     */
    const placeTable = (block: TableBlock, onNextPage = false): void => {
        const start = snapshot(blockIndex);
        try {
            layOutTable(block, onNextPage);
        } catch (error) {
            if (!(error instanceof HeaderRowsAlone)) {
                throw error;
            }
            if (error.kept !== undefined) {
                throw new StartsNextPage(error.kept, pageCount);
            }
            unmarkSince(start.marks);
            restore(start);
            // What was guessed at in moving the header rows is still guessed at, but not what was in laying the table out here
            error.guesses.forEach((reason) => stopAt(reason));
            placeTable(block, true);
        }
    };

    const layOutTable = (block: TableBlock, onNextPage: boolean): void => {
        const width = columnsSection().columns[column];
        const table = sizedToPlace(block, width);
        const merges = mergesOf(table);
        const heights = rowHeights(table, merges);
        const headerRows = table.rows.findIndex(({ header }) => !header);
        const repeated = headerRows > 0 ? sum(heights.slice(0, headerRows)) : 0;
        // The space after the paragraph before the table
        position += spaceAfter;
        spaceAfter = 0;
        placeBesideDrawings(table, heights, block);
        // Where the table starts: below what is in the column, its header rows can go on to the next column with its first
        // row
        const below = !onNextPage && placedInColumn && headerRows > 0 ? { page: pageCount, column, placed: placements.length } : undefined;
        /** Whether only the table's header rows are in the column, below what is above them */
        const headersAlone = (index: number): boolean =>
            below !== undefined &&
            index >= headerRows &&
            below.page === pageCount &&
            below.column === column &&
            placements.slice(below.placed).every((placement) => placement.type !== "row" || placement.row.index < headerRows);
        // A new column or page for the table, with its header rows repeated at the top, unless the row going on it is one
        // of them. Word and LibreOffice repeat them at the top of each column, as of each page (`word-rules2.docx` Q4). A
        // table sized to its text keeps the widths it was sized to in the column it starts in, in each column it goes on
        // into, as in Word: in a wider one, where LibreOffice sizes one of a share of the width again
        // (`word-column-widths.docx` R5 and R6), and in a narrower one, past whose edge it goes, with its rows as tall as
        // they were (`word-watertight-stops.docx` SP16)
        const startTablePage = (index: number, newPage = false, continuing = false): void => {
            if (headersAlone(index)) {
                // The paragraphs kept with the next before the table go on to the next page with them, as Word moved a
                // heading kept with the next there with them (`word-stops-edges.docx` HR2b), unless they start the page
                const kept = keptBefore(blockIndex);
                const pageStart = placements.findLastIndex(({ type }) => type === "page");
                const first = placements.slice(pageStart).find((placement) => placement.type === "line" || placement.type === "row");
                const inColumns = columnsSection().columns.length > 1;
                const moving = kept < blockIndex && !inColumns && first !== undefined && (first as BlockPlacement).block < kept;
                // Whether Word moves those kept with the next with them to the next column, or from the top of a page, hasn't
                // been seen. Guessing, they stay
                const guesses =
                    kept < blockIndex && !moving
                        ? ["a paragraph kept with the next before a table whose header rows go on, at the top of a page or in columns"]
                        : [];
                guesses.forEach((reason) => stopAt(reason));
                throw new HeaderRowsAlone(guesses, moving ? kept : undefined);
            }
            const page = pageCount;
            nextColumn();
            // To the first column of a new page, past the other columns of this one
            while (newPage && pageCount === page) {
                nextColumn();
            }
            // A header row taller than a page isn't repeated (RW5b, RW18)
            if (index >= headerRows && !cutHeader) {
                heights.slice(0, Math.max(0, headerRows)).reduce((y, rowHeight, row) => {
                    placeRow(row, y, rowHeight);
                    return y + rowHeight;
                }, position);
                position += repeated;
            }
            // A table with space between its cells has its top border above the rest of it on the next page, and the space
            // above its row, where the row or the one before it breaks (word-stops-table-borders.docx TB7a to TB7c). Below
            // its header rows repeated there, which have the table's top border above them, the row is as far below them as
            // on the page before (word-stops-table-borders2.docx BT4c). The part of a row that breaks there hasn't been seen
            const { breakTop = 0 } = table.rows[index];
            const belowHeaders = headerRows > 0 && index >= headerRows && !cutHeader;
            if (breakTop > 0 && (index > 0 || continuing)) {
                if (belowHeaders && continuing) {
                    stopAt("a table row with space between its cells that breaks across pages below header rows");
                }
                position += belowHeaders ? 0 : breakTop;
            }
        };
        /** Whether a row fits on the page, with its footnotes */
        const rowFits = (height: number, notes: readonly string[]): boolean =>
            position + height <= linesBottom(moreNoteRoom(notes)) + TOLERANCE;
        /**
         * Whether a row stays on the page whole, with its footnotes, the last continued on the next page when it can be, as
         * a line's do: a row whose footnote doesn't fit below it moves to the next page with it, and one whose footnote can
         * continue stays (`word-probes.docx` U3a, U3b)
         */
        const rowStays = (height: number, notes: readonly string[]): boolean =>
            position + height <= linesBottom(leastNoteRoom(notes)) + TOLERANCE;
        const markersIn = (row: TableRow): readonly string[] => row.cells.flatMap((cell) => cell.blocks.flatMap(markersOf));
        // The heights of the rows without the cells merged down them, whose text makes the last of them taller
        const ownHeights = rowHeights(table, []);
        /**
         * The height of a row: as tall as the text of the cells merged down to it that end in it needs, from the top of their
         * rows on the page, when it went on from the page before. It is the height the table's rows give it otherwise
         */
        const heightAt = (index: number): number => {
            const ending = openMerges.filter(({ last }) => last === index);
            if (!ending.some(({ broken, moved }) => broken || moved) || table.rows[index].height?.rule === "exact") {
                return heights[index];
            }
            return Math.max(
                ownHeights[index],
                // Their rows on the page start with the rest of the row that broke on the page before, below the border above
                // the first of them, and end above the last's border below (`word-stops-tables.docx` RW4a, RW4b)
                // Those whose text went on from a page before with none of their rows on this one yet start with this one
                ...ending.map(
                    ({ cell, rest, start = position, startTop = table.rows[index].borderTop, broken }) =>
                        start +
                        startTop +
                        cell.marginTop +
                        fillCell(rest, Infinity, !broken).height +
                        cell.marginBottom +
                        table.rows[index].borderBottom -
                        position,
                ),
            );
        };
        /**
         * What the table's last row is kept with when it is kept with the next: the first lines of the paragraph after the
         * table, or what keeps with them, as for a paragraph kept with the next, when it is in the same section
         */
        const afterTable = (): { readonly height: number; readonly notes: readonly string[] } => {
            const next = blocks[blockIndex + 1];
            return next === undefined || next.section !== blocks[blockIndex].section
                ? { height: 0, notes: [] }
                : keptHeight(blockIndex + 1, columnsSection().columns[column]);
        };
        // The last row of rows kept with the next that were laid out from the top of a page, which they don't fit on, and
        // so break across pages
        let brokenUntil = -1;
        /**
         * Moves the rows kept with the next from one (`index`) to the next page or column, with what they are kept with, when
         * they don't fit on this one with it, as Word keeps them (`word-watertight-tables.docx` TB5): the next row, or the
         * first lines of the paragraph after the table when the last row is kept with the next (`word-table-formats.docx`
         * KR3, KR4), or, where the next row breaks across pages, as much of it as must go on the page with them (KR7). Rows
         * that don't fit on a page of their own break across pages where it ends, as Word breaks them (KR5)
         */
        const placeKeptRows = (index: number): void => {
            const end = keptRowsEnd(table, index);
            const last = table.rows.length - 1;
            const keptPastTable = end === last && keptWithNext(table.rows[last]);
            if ((end === index && !keptPastTable) || index <= brokenUntil) {
                return;
            }
            const following = keptPastTable ? afterTable() : undefined;
            const kept = table.rows.slice(index, end + 1);
            const keptNotes = [...notesIn(kept.flatMap(markersIn)), ...(following?.notes ?? [])];
            const together = sum(heights.slice(index, end + 1)) + (end < last ? (table.rows[end].breakBorder ?? bottomBorder) : 0);
            const fitsHere = (): boolean =>
                rowStays(together + (following?.height ?? 0), keptNotes) ||
                (!keptPastTable &&
                    canSplit(table.rows[end]) &&
                    rowStays(
                        sum(heights.slice(index, end)) + leastPartOf(table.rows[end]) + (table.rows[end].breakBorder ?? bottomBorder),
                        keptNotes,
                    ));
            if (fitsHere()) {
                return;
            }
            if (placedInColumn || continued !== undefined) {
                // The text of the cells merged down to them from rows above ends in those
                closeMerges(position);
                startTablePage(index);
            }
            if (!fitsHere()) {
                brokenUntil = end;
            }
        };
        // Where a table breaks across pages, Word draws its bottom border below the last of it on the page, which takes room
        // there too, whether the table breaks between rows or in one (`word-line-heights.docx` T1 and T4)
        const bottomBorder = table.rows[table.rows.length - 1]?.borderBottom ?? 0;
        openMerges = [];
        cutHeader = false;
        if (onNextPage) {
            startTablePage(0);
        }
        for (const [index, row] of table.rows.entries()) {
            openMerges = [
                ...openMerges,
                ...merges
                    .filter(({ first }) => first === index)
                    .map(({ first, last, cell }) => ({
                        first,
                        last,
                        cell,
                        rest: cellParagraphs(cell),
                        broken: false,
                        header: first < headerRows,
                    })),
            ];
            const breakBorder = index < table.rows.length - 1 ? (row.breakBorder ?? bottomBorder) : 0;
            const height = heightAt(index);
            const roomNeeded = height + breakBorder;
            const markers = markersIn(row);
            // The footnotes held back from the paragraph kept with the table go below the rows it is kept with, which go on
            // the page whole, and take the rest of the page, as Word puts one below its first row (`word-watertight-notes.docx`
            // FN13)
            const holding = held.length > 0 && heldLines !== undefined && index < heldLines;
            const notes = [...(holding && index === heldLines! - 1 ? held : []), ...notesIn(markers)];
            const keptWhole = holding || row.cantSplit || row.height?.rule === "exact";
            if (notes.length > 0 && belowContinued()) {
                // Word put a line referring to one on the next page (NT5b), but a row hasn't been seen
                stopOnPage("a table row referring to a footnote below one that continues on the next page in columns");
            }
            placeKeptRows(index);
            // On the next page, the end of a footnote continued from this one can leave too little room for it too, as for
            // a paragraph's lines, so it goes on the page after
            while (keptWhole && !rowStays(roomNeeded, notes) && (placedInColumn || continued !== undefined)) {
                // The text of the cells merged down to it from rows above ends in those
                closeMerges(position);
                startTablePage(index);
            }
            // A row kept whole that is still too tall for the page is at the top of one, and taller than it. One that fits
            // without its footnote stays there whole, and its footnote starts on the next page, as a line's does (SP5): Word
            // put a row of 45 lines that can't break there, and its footnote of 10 lines kept together on the next page
            // (stops2/word-stops-notes2.ts NT8b)
            if (keptWhole && !rowStays(roomNeeded, notes) && notes.length === 1 && position + roomNeeded <= linesBottom() + TOLERANCE) {
                stopIfBalancing();
                [deferred] = notes;
                carried = { name: deferred, from: { block: 0, line: 0 } };
            }
            const tooTall = keptWhole && !rowStays(roomNeeded, notes);
            if (tooTall) {
                stopIfBalancing();
                if (notes.length > 0 && position + roomNeeded <= linesBottom() + TOLERANCE) {
                    throw new Unsupported("a table row and its footnotes taller than a page");
                }
            }
            // In columns, one taller than a column goes down the first column of each page, from a new page unless it is at
            // the top of one, as Word lays a paragraph kept together out (`word-stops-tables.docx` RW11,
            // `word-stops-rows2.docx` RW19b)
            const firstColumns = tooTall && section().columns.length > 1;
            if (firstColumns && column > 0) {
                closeMerges(position);
                startTablePage(index, true);
            }
            if (tooTall && row.height?.rule === "exact") {
                placeCutRow(row, index);
                continue;
            }
            // One that can't break breaks there as other rows do, as in Word: 60 lines go 51 and 9 (`word-probes.docx` U5a,
            // U5b), as LibreOffice breaks them
            if (tooTall || (!rowFits(roomNeeded, notes) && !keptWhole)) {
                splitRow(
                    row,
                    index,
                    height,
                    breakBorder,
                    (continuing, newPage) => startTablePage(index, firstColumns || newPage, continuing),
                    {
                        // Rows kept with the next that are too tall for a page break where the page ends (KR5)
                        kept: index > brokenUntil && index > 0 && keptWithNext(table.rows[index - 1]),
                    },
                );
                continue;
            }
            // The text of a cell merged down from the row is placed with the rows it goes down, and its footnotes with it
            mark(row.cells.flatMap((cell) => (startsMerge(cell) ? roomlessOf(cell) : cell.blocks.flatMap(markersOf))));
            const at = position;
            openMerges = openMerges.map((merge) => (merge.start === undefined ? { ...merge, start: at, startTop: row.borderTop } : merge));
            placeRow(index, position, height);
            position += height;
            // Its footnotes go below it, and one that continues takes the rest of the page, below the table's bottom border
            // when the table breaks after it
            placeNotes(notes, breakBorder);
            if (holding && index === heldLines! - 1) {
                held = [];
                heldLines = undefined;
            }
            // The cells merged down to the row end in it, with the rest of their text
            mark(openMerges.filter(({ last }) => last === index).flatMap(({ rest }) => markersLeft(rest)));
            openMerges = openMerges.filter(({ last }) => last !== index);
            placedInColumn = true;
        }
        // What comes after a table whose header row is taller than a page goes on the page after the one it ends on (RW5b,
        // RW18). After one that ends a section, whether Word leaves a page between them isn't known: guessing, it doesn't
        const after = blocks[blockIndex + 1];
        if (cutHeader && after !== undefined) {
            if (after.section === blocks[blockIndex].section) {
                startPage();
            } else {
                stopAt("a table whose header row is taller than a page, at the end of its section");
            }
        }
    };

    /** The first of the paragraphs kept with the next, in its section, that go before a block, or the block itself */
    const keptBefore = (index: number): number => {
        let first = index;
        while (
            first > 0 &&
            blocks[first - 1].section === blocks[index].section &&
            blocks[first - 1].block.type === "paragraph" &&
            (blocks[first - 1].block as ParagraphBlock).format.keepNext === true
        ) {
            first--;
        }
        return first;
    };

    /** How many paragraphs from one (`index`) on are kept with the next block of their section, one after the other */
    const keptChain = (index: number): number =>
        blocks.slice(index).findIndex(({ block, section: blockSection }, offset) => {
            const following = blocks[index + offset + 1];
            return !(block.type === "paragraph" && block.format.keepNext === true && following && following.section === blockSection);
        });

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
        /** The space the multiple spacing of its last line, or a document grid, leaves below the line's text */
        readonly spacingBelow: number;
        readonly notes: readonly string[];
        readonly kept: readonly string[];
        readonly keptWith: "nothing" | "whole" | "part";
        /** The lines of the paragraph, or the rows of the table, they are kept with that go with them, when they are only part of it */
        readonly keptLines?: number;
    } => {
        const chain = keptChain(index);
        const measured = (offset: number): MeasuredParagraph =>
            measureParagraph(blocks[offset].block as ParagraphBlock, width, blocks[offset - 1]?.block, blocks[offset + 1]?.block);
        const kept = Array.from({ length: chain }, (_, offset) => measured(index + offset));
        const keptLines = sum(
            kept.map(
                ({ lines, spaceBefore, borderAbove, borderBelow }, offset) =>
                    borderAbove +
                    linesHeight(lines) +
                    borderBelow +
                    (offset === 0 ? spaceAboveOf(spaceBefore) : between(kept[offset - 1].spaceAfter, spaceBefore)),
            ),
        );
        const lastAfter = kept[kept.length - 1]?.spaceAfter ?? spaceAfter;
        const keptNotes = notesIn(kept.flatMap(({ lines }) => lines.flatMap(({ markers }) => markers)));
        const anchor = blocks[index + chain].block;
        if (anchor.type === "paragraph" && anchor.sectionBreak) {
            // The paragraph that ends the section takes no room, so they are kept with nothing
            return {
                height: keptLines,
                ...belowOf(kept[kept.length - 1]?.lines.at(-1)),
                notes: keptNotes,
                kept: keptNotes,
                keptWith: "nothing",
            };
        }
        if (anchor.type === "table") {
            // A table that can't be laid out has nothing kept with it, so what is kept is placed before the layout stops,
            // but guessing, one with a guess is laid out as it is. They are kept with its first row, and the rows kept with it
            const stops = ({ unsupported, noGuess }: TableBlock): boolean => unsupported !== undefined && (!guess || noGuess === true);
            const sized = stops(anchor) ? anchor : fitted(anchor, width);
            const rows = stops(sized) ? [] : sized.rows.slice(0, keptRowsEnd(sized, 0) + 1);
            return {
                height: keptLines + lastAfter + sum(stops(sized) ? [] : rowHeights(sized).slice(0, rows.length)),
                spacingBelow: 0,
                notes: [...keptNotes, ...notesIn(rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersOf))))],
                kept: keptNotes,
                keptWith: "part",
                keptLines: rows.length,
            };
        }
        // As much of the next paragraph as can't be left at the bottom of a page on its own. The last paragraph of a
        // section is kept with nothing, and measured as the next itself
        const next = measured(index + chain);
        const firstLines = next.keepLines || (next.widowControl && next.lines.length <= 3) ? next.lines.length : next.widowControl ? 2 : 1;
        const nextLines = next.lines.slice(0, firstLines);
        return {
            height:
                keptLines +
                between(lastAfter, next.spaceBefore) +
                next.borderAbove +
                linesHeight(nextLines) +
                (nextLines.length === next.lines.length ? next.borderBelow : 0),
            // Below a border, the spacing of the last line isn't known to go below the bottom of the page
            ...belowOf(nextLines.length === next.lines.length && next.borderBelow > 0 ? undefined : nextLines.at(-1)),
            notes: [...keptNotes, ...notesIn(nextLines.flatMap(({ markers }) => markers))],
            kept: keptNotes,
            keptWith: chain === 0 ? "nothing" : firstLines === next.lines.length && !next.pageBreakBefore ? "whole" : "part",
            ...(next.pageBreakBefore ? {} : { keptLines: firstLines }),
        };
    };

    /**
     * The room the paragraphs kept with the next one, from this one, need on the page beside its drawings, as `keptHeight`
     * gives it: each laid out in rows from where it goes, beside the drawings on the page and those of the paragraph they
     * are kept with, as they are placed, and none of it fitting when a drawing of that paragraph that moves with it would go
     * past the bottom of the page. Word moves a heading kept with the next to the next page with a paragraph that moves
     * there with its drawing (`word-floats2.docx` G11, G12), and keeps one beside a drawing with as many of the next
     * paragraph's lines, beside it, as widow control keeps together (G13). Those with drawings of their own, or kept with a
     * table, aren't measured here (see {@link KEPT_BESIDE}).
     */
    const keptBeside = (index: number, width: number): ReturnType<typeof keptHeight> => {
        const chain = keptChain(index);
        const anchor = blocks[index + chain].block as ParagraphBlock;
        const kept = blocks.slice(index, index + chain).map(({ block }) => block as ParagraphBlock);
        const widths: LineWidths = [{ from: 0, width }];
        let y = position;
        let after = spaceAfter;
        /**
         * The rows of a paragraph of the chain, from where the one before ends, and the space and border above them, moving on
         * to where it ends
         */
        const rowsHere = (
            paragraph: ParagraphBlock,
            offset: number,
            measured: MeasuredParagraph,
        ): ReturnType<typeof rowsOf> & { readonly space: number } => {
            const space = (offset === 0 ? spaceAboveOf(measured.spaceBefore) : between(after, measured.spaceBefore)) + measured.borderAbove;
            const theirs = Math.min(after, space - measured.borderAbove);
            const laid = rowsOf(
                paragraph,
                widths,
                new Map(),
                0,
                y + space,
                { top: y + theirs, own: space - theirs },
                new Set(),
                index + offset,
            );
            y += space + sum(laid.rows.map(({ line }) => line.height)) + measured.borderBelow;
            after = measured.spaceAfter;
            return { ...laid, space };
        };
        const measuredAt = (offset: number): MeasuredParagraph =>
            measureParagraph(
                blocks[index + offset].block as ParagraphBlock,
                width,
                blocks[index + offset - 1]?.block,
                blocks[index + offset + 1]?.block,
            );
        const keptLines = kept.flatMap((paragraph, offset) => rowsHere(paragraph, offset, measuredAt(offset)).rows.map(({ line }) => line));
        const keptNotes = notesIn(keptLines.flatMap(({ markers }) => markers));
        const keptHeightSoFar = y - position;
        if (anchor.type === "paragraph" && anchor.sectionBreak) {
            return {
                height: keptHeightSoFar,
                ...belowOf(keptLines.at(-1)),
                notes: keptNotes,
                kept: keptNotes,
                keptWith: "nothing",
            };
        }
        const next = measuredAt(chain);
        const { rows, placed, space: nextSpace } = rowsHere(anchor as ParagraphBlock, chain, next);
        // As much of it as can't be left at the bottom of a page on its own, counted in rows
        const firstRows = next.keepLines || (next.widowControl && rows.length <= 3) ? rows.length : next.widowControl ? 2 : 1;
        const nextRows = rows.slice(0, firstRows);
        // A drawing anchored in those lines that would go past the bottom of the page moves them, and what is kept with them,
        // to the next page. One anchored after them goes on to the next page with its anchor
        const nextLines = sum(nextRows.map(({ count }) => count));
        const sinks = placed.some(
            ({ line, drawing: { drawing, keepOut } }) =>
                line < nextLines &&
                (drawing.vertical.from === "paragraph" || drawing.vertical.from === "line") &&
                keepOut.bottom > linesBottom() + TOLERANCE,
        );
        const lastRow = nextRows.at(-1)?.line;
        return {
            height: sinks
                ? Number.POSITIVE_INFINITY
                : keptHeightSoFar +
                  nextSpace +
                  sum(nextRows.map(({ line }) => line.height)) +
                  (nextRows.length === rows.length ? next.borderBelow : 0),
            ...belowOf(nextRows.length === rows.length && next.borderBelow > 0 ? undefined : lastRow),
            notes: [...keptNotes, ...notesIn(nextRows.flatMap(({ line }) => line.markers))],
            kept: keptNotes,
            keptWith: chain === 0 ? "nothing" : firstRows === rows.length && !next.pageBreakBefore ? "whole" : "part",
            ...(next.pageBreakBefore ? {} : { keptLines: nextLines }),
        };
    };

    /**
     * Places the tables that text flows around anchored in a paragraph kept with the next, which moves on to the next column
     * or page, on this page, where they would have been with the paragraph, as Word leaves them where it first placed them
     * (`word-stops-floats2.docx` KP1b), so that the paragraph is laid out without them where it goes
     */
    const leaveFloats = (index: number, paragraph: MeasuredParagraph): void => {
        const current = columnsSection();
        const left = columnLeft(current, column);
        // The paragraph's top, below the space after the paragraph before, as it is where a paragraph is placed: it isn't at
        // the top of a page, as it moves on from here
        const paragraphTop = position + Math.min(spaceAfter, spaceAboveOf(paragraph.spaceBefore));
        for (const one of floatsBefore(index)) {
            const { drawing, table } = floatingTable(one);
            const box = placeOrStop(drawing, {
                section: section(),
                oddPage: pageNumber % 2 === 1,
                column: { start: left, end: left + current.columns[column] },
                paragraph: paragraphTop,
                line: { top: paragraphTop, height: 0 },
                character: 0,
            });
            const keepOut = keepOutOf(drawing, box);
            if (keepOut.bottom > linesBottom() + TOLERANCE) {
                throw new Unsupported("a table that text flows around going past the bottom of the page");
            }
            placeDrawings([{ line: 0, item: -1, drawing: { drawing, box, keepOut, anchor: `${one} table` }, table }]);
            placeFloatingRows(table, box.top);
            // eslint-disable-next-line functional/immutable-data
            leftBehind.add(one);
        }
    };

    /**
     * Whether a block is the empty paragraph that ends a section and takes a line. Word gives it a line of its own right
     * after a table, as there is no line of a paragraph before it for its mark to go on (`word-header-columns.docx` H1 to
     * H4, H7 and H8), where LibreOffice gives it no room, and with text frames anchored in it, as after a frame
     * (`word-stops-floats.docx` FR1b)
     */
    const endsAfterTable = (index: number): boolean => {
        const block = blocks[index]?.block;
        return (
            block?.type === "paragraph" &&
            block.sectionBreak === true &&
            (blocks[index - 1]?.block.type === "table" ||
                block.items.some((item) => item.type === "drawing" && item.drawing.frame !== undefined))
        );
    };

    const placeBlock = (block: Block, index: number): void => {
        blockIndex = index;
        stopAtRead(block);
        const endnotesStart = isEndnote(index) && !isEndnote(index - 1) && section().columns.length > 1;
        if (endnotesStart) {
            // Word evens out the columns of the text above the endnotes, as before a continuous section, and lays them out
            // in the columns below, from below their separator in the first, in each column, and evens out the columns they
            // end in (`word-stops-endnotes.docx` NE1, stops2/word-stops-notes2.ts NE4a to NE4c). Evening the text out lays
            // its blocks out again, so this one is laid out after them
            endColumns(index);
            blockIndex = index;
            column = 0;
            columnTop = position;
            if (block.type !== "paragraph" || endnoteNumbers.has(block)) {
                // Word has been seen with them only below a separator, which an empty separator note leaves out
                stopAt("endnotes in columns with no separator above them");
            }
        }
        if (keptOn !== undefined && index > keptOn.next) {
            // The block it is kept with took no room, as the empty paragraph that ends a section
            stopAt(keptOn.reason);
            keptOn = undefined;
        }
        const width = columnsSection().columns[column];
        const previous = blocks[index - 1];
        if (block.type === "paragraph") {
            const next = blocks[index + 1]?.block;
            if (
                block.sectionBreak &&
                block.format.autoSpaceAfter === true &&
                next?.type === "paragraph" &&
                (next.format.autoSpaceBefore === true || (next.format.spaceBefore ?? 0) > 0)
            ) {
                // Its borders and its automatic spacing take no room (word-stops-text.ts PB2a, PB2b), but whether its
                // automatic space after leaves out some of the space before the next section's first paragraph, as its own
                // space after does, isn't known. Guessing, it doesn't
                stopAt("automatic spacing after the empty paragraph that ends a section, before space of the next section's");
            }
            if (previous !== undefined && sharesBorders(block, previous.block, "before") && previous.section !== blocks[index].section) {
                // Whether Word's box of borders goes on across a section break isn't known. Guessing, it goes on
                stopAt("paragraphs with the same borders either side of a section break");
            }
        }
        if (block.type === "paragraph" && block.sectionBreak && !endsAfterTable(index)) {
            // The empty paragraph that ends a section after a paragraph takes no room, in Word and LibreOffice. In Word, the
            // space around it is still its own: the space after the paragraph before and its space before are the larger of
            // the two, and the next section's space before is only as much as is more than its space after, where
            // LibreOffice has the space after the paragraph before. Its space after is never on the page itself, so
            // contextual spacing leaves nothing more of it out
            // Its automatic space before takes none either (word-stops-text.ts PB2b)
            const spaceBefore =
                block.format.autoSpaceBefore === true ? 0 : measureParagraph(block, width, blocks[index - 1]?.block).spaceBefore;
            if (placedInColumn) {
                // Below the text, the page's footnotes go below that space too, as Word put them
                // (stops2/word-stops-notes2.ts NT20a)
                position += between(spaceAfter, spaceBefore);
            }
            spaceAfter = 0;
            return;
        }
        if (floatsAt(index)) {
            // It goes round the paragraph after it, against which Word places it, with those after it before that paragraph.
            // Where Word's way with them isn't known, guessing, they are laid out in the text
            const unknown = floatsAt(index - 1) ? undefined : floatsUnknown(index);
            if (unknown === undefined) {
                // The space after the paragraph before is above them, and the paragraph after them has all its space before
                // below that, as after a table: 200 after and 300 before put its first line 500 below the paragraph before
                // (`word-floats3.docx` H9)
                position += spaceAfter;
                spaceAfter = 0;
                return;
            }
            inlineFloats(floatsFrom(index), unknown);
        }
        if (block.type === "table") {
            const framed = (block.anchored ?? []).some((item) => item.type === "drawing");
            if (placeBeforeTable(block, index) && framed && keptOn === undefined) {
                // Whether Word moves a frame anchored at the top of a table that starts on the next page with it isn't known;
                // a table that text flows around stays where it was placed (`word-stops-floats2.docx` TF1)
                keptOn = {
                    next: index,
                    page: pageCount,
                    column,
                    reason: FRAME_BEFORE_TABLE_MOVING_ON,
                };
            }
            placeTable(block);
            sectionSpaceAfter = undefined;
            return;
        }
        if (startsNextPage.get(index) === pageCount) {
            startPage();
        }
        const paragraph = measureParagraph(block, width, blocks[index - 1]?.block, blocks[index + 1]?.block);
        let holdNotes = false;
        if (paragraph.keepNext) {
            const chain = blocks.slice(index, index + keptChain(index) + 1).map(({ block: one }) => one);
            if (floatsAt(index + keptChain(index))) {
                // How Word keeps them with tables that text flows around isn't known. Guessing, those are laid out in the text
                inlineFloats(floatsFrom(index + keptChain(index)), KEPT_FLOATING);
            }
            // Those with tables that text flows around anchored in them move on as any kept paragraph, and the tables stay
            // where they were placed (`word-stops-floats2.docx` KP1b)
            const withFloating = chain.slice(0, -1).some((_, offset) => floatsBefore(index + offset).length > 0);
            // Beside drawings, with drawings or tables that text flows around of their own, or kept with a paragraph with a
            // drawing, they are measured as they are laid out beside them
            const beside =
                besideDrawing() ||
                withFloating ||
                chain.some((one) => one.type === "paragraph" && one.items.some(({ type }) => type === "drawing"));
            /**
             * What is kept together, from where the next line goes, broken into lines at the width of the column it goes in,
             * with the footnotes held back from a paragraph kept with this one, which go below these lines too (`all`), and
             * whether it fits with its footnotes taking some room
             */
            const keptHere = (): ReturnType<typeof keptHeight> & {
                readonly all: readonly string[];
                readonly fitsWith: (noteRoom: number) => boolean;
            } => {
                const measured = (beside ? keptBeside : keptHeight)(index, columnsSection().columns[column]);
                const withHeld = [...held, ...measured.notes];
                return {
                    ...measured,
                    all: withHeld,
                    fitsWith: (noteRoom) => fitsAbove(position, measured, linesBottom(noteRoom), noteArea > 0 || withHeld.length > 0),
                };
            };
            const keptWithPrevious =
                previous?.section === blocks[index].section &&
                previous.block.type === "paragraph" &&
                previous.block.format.keepNext === true;
            // Those kept with one that is taller than some of the columns but not others are kept with it as with any
            // paragraph (`word-stops-pages.docx` CO2a, CO2b)
            const anchor = blocks[index + keptChain(index)].block;
            const anchorTaller = anchor.type === "paragraph" ? columnsTallerThan(anchor) : [];
            const tallAnchor = anchorTaller.length > 0 && anchorTaller.every((tall) => tall);
            // Those with drawings of their own move to the next page with the next, and the drawings with them, as any kept
            // paragraph (`word-stops-floats2.docx` KP1a), but for one the text goes above and below, which moves the next's
            // lines in ways not measured here
            const ownDrawings = chain
                .slice(0, -1)
                .flatMap((one) => (one as ParagraphBlock).items.flatMap((item) => (item.type === "drawing" ? [item.drawing] : [])));
            const unmeasured = beside && (anchor.type === "table" || ownDrawings.some(({ wrap }) => wrap === "topAndBottom"));
            if (unmeasured && tallAnchor) {
                stopAt(KEPT_BESIDE);
            } else if (unmeasured) {
                // Laid out where it is, the next starting in its page and column
                placeParagraph(block, paragraph, false);
                keptOn = { next: index + 1, page: pageCount, column, reason: KEPT_BESIDE };
                sectionSpaceAfter = undefined;
                return;
            }
            if (tallAnchor) {
                // Kept with a paragraph kept together that is taller than a column, they move to a new page with it, unless
                // they start at the top of this one, and it moves on again to the next, as it isn't at the top of that one:
                // a line kept with one of 60 lines in 2 columns is alone on a page in Word (`word-watertight-stops.docx`
                // SP13), where LibreOffice puts it in the next column. Two lines go together, and one at the top of a page
                // stays there, and one at the top of the second column moves (`word-column-stops.docx` CS7 to CS9)
                if (!keptWithPrevious && !atTopOfPage()) {
                    startPage();
                }
            } else if (placedInColumn) {
                const here = keptHere();
                // They fit with their footnotes, the last continued on the next page when it can be, as in Word
                // (`word-probes.docx` U2l)
                const fitsHere = here.fitsWith(leastNoteRoom(here.all));
                // What is kept together moves to the next column, or to a new page when the columns of this one start too
                // low for it, unless it is too tall for those too. The next column ends above the page's footnotes with
                // theirs, and a new page has the rest of a footnote continued from this one, and as much room as this one
                // otherwise, as the continuation separator above endnotes takes none from them. What is kept is broken into
                // lines at the width of the column it goes in
                const { columns } = columnsSection();
                const fitsBelow = (from: number, area: number, below: number): boolean =>
                    fitsAbove(from, keptHeight(index, below), Math.min(bottom, pageBottom - area), area > 0 || here.notes.length > 0);
                const toNextColumn =
                    !fitsHere &&
                    column + 1 < columns.length &&
                    fitsBelow(columnTop, noteArea + moreNoteRoom(here.notes), columns[column + 1]);
                const toNextPage =
                    !fitsHere &&
                    !toNextColumn &&
                    fitsBelow(top, leastAreaOf(here.notes, carried, columns.length > 1 ? columns : undefined), columns[0]);
                if ((toNextColumn || toNextPage) && withFloating) {
                    leaveFloats(index, paragraph);
                }
                if (toNextColumn) {
                    nextColumn();
                } else if (toNextPage) {
                    startPage();
                }
            }
            // Where they go, here or where they moved to, a footnote continued on the next page from the paragraphs kept with
            // the next goes below the lines they are kept with, which Word keeps on the page with them (U2l), and of a longer
            // paragraph, below as many of its first lines as they are kept with, as Word puts as much of the footnote as fits
            // below those, rather than more of the paragraph (`word-watertight-stops.docx` SP4), and of a table, below the
            // rows they are kept with (`word-watertight-notes.docx` FN13)
            const { notes, kept, keptWith, keptLines, all, fitsWith } = keptHere();
            // Kept with a paragraph with a page break before it, which starts a new page all the same, they keep their
            // footnotes below their own lines, as much of the last as fits: Word put 16 lines of a 40-line footnote below
            // the paragraph kept with one, and the rest on a page of its own before the next paragraph's
            // (`word-stops-notes.docx` NT10b)
            const beforePageBreak = keptWith === "part" && keptLines === undefined;
            holdNotes =
                !beforePageBreak &&
                keptWith !== "nothing" &&
                [...held, ...kept].length > 0 &&
                notes.length === kept.length &&
                fitsWith(leastNoteRoom(all)) &&
                !fitsWith(moreNoteRoom(all));
            heldLines = holdNotes && keptWith === "part" ? keptLines : undefined;
        }
        placeParagraph(block, paragraph, holdNotes);
        sectionSpaceAfter = undefined;
        if (endnotesStart) {
            // The columns start below the separator, which is in the first, as they all start at the same height, and so are
            // evened out from the next block
            columnTop = position;
            columnsStart = undefined;
        }
    };

    /**
     * Puts a drawing on the page from its top, to lay the page out again from the block its columns start with. It stops
     * where that block is below the start of the page, after a section that starts on it, whose text before it isn't laid
     * out again, and after the page has been laid out again for its drawings a few times
     */
    const placeAbove = (drawing: PlacedDrawing): void => {
        const layouts = (pageLayouts.get(pageCount) ?? 0) + 1;
        if (layouts > MOST_PAGE_LAYOUTS) {
            throw new Unsupported("drawings whose places on the page don't settle as the text goes round them");
        }
        const onPage = placements.slice(placements.findLastIndex(({ type }) => type === "page") + 1, columnsStart!.placed);
        if (columnsStart!.pageCount === pageCount && onPage.length > 0) {
            throw new Unsupported("a drawing beside text of a section before on its page");
        }
        // eslint-disable-next-line functional/immutable-data
        pageLayouts.set(pageCount, layouts);
        // eslint-disable-next-line functional/immutable-data
        pinned.set(pageCount, [...(pinned.get(pageCount) ?? []).filter(({ anchor }) => anchor !== drawing.anchor), drawing]);
    };

    /** Takes back the bookmarks and fields placed since some were, to place them again as what is after them is laid out again */
    const unmarkSince = (marks: number): void => {
        for (const [name, { order }] of places) {
            if (order >= marks) {
                // eslint-disable-next-line functional/immutable-data
                places.delete(name);
                // eslint-disable-next-line functional/immutable-data
                bookmarks.delete(name);
            }
        }
    };

    /** Keeps the room at the bottom of the page the footnotes take, to lay its columns out again from the block they start with */
    const reserveFor = (error: NotesGrew): void => {
        // eslint-disable-next-line functional/immutable-data
        reserves.set(pageCount, error.area);
        // eslint-disable-next-line functional/immutable-data
        reservedFor.set(pageCount, error.notes);
        if (error.moved !== undefined) {
            // eslint-disable-next-line functional/immutable-data
            movedOn.set(pageCount, error.moved);
        }
        // The bookmarks placed since are placed again, as a reference can move on to the next page
        unmarkSince(columnsStart!.marks);
    };

    /** Lays out the blocks from one (`from`) to the one before another (`to`), starting their sections */
    const placeBlocks = (from: number, to: number): void => {
        for (let index = from; index < to; index++) {
            const { block, section: blockSection } = blocks[index];
            const startsSection = blockSection !== sectionIndex;
            if (startsSection) {
                // The block being laid out is the section's first, on the page the section starts: one that isn't one of the
                // endnotes has no continuation separator above it
                blockIndex = index;
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
                if (error instanceof DrawingAbove) {
                    placeAbove(error.drawing);
                } else if (error instanceof StartsNextPage) {
                    // eslint-disable-next-line functional/immutable-data
                    startsNextPage.set(error.block, error.page);
                    // The bookmarks placed since are placed again, on the next page
                    unmarkSince(columnsStart!.marks);
                } else if (error instanceof PushedOn) {
                    // The page is laid out again without the drawing, its paragraph starting on the next page
                    // eslint-disable-next-line functional/immutable-data
                    startsNextPage.set(error.block, error.page);
                    // eslint-disable-next-line functional/immutable-data
                    pinned.set(
                        error.page,
                        pinned.get(error.page)!.filter(({ anchor }) => Number(anchor.split(" ")[0]) !== error.block),
                    );
                } else if (!(error instanceof NotesGrew)) {
                    throw error;
                } else {
                    reserveFor(error);
                }
                restore(columnsStart!);
                index = columnsStart!.index - 1;
            }
        }
    };

    // The endnote each of the endnotes' blocks is in, by the marker at its reference, which tells those with marks of their
    // own apart, as they have no number
    const endnoteOf = new Map(
        [...content.endnoteReferences].flatMap(([marker, noteBlocks]) => noteBlocks.map((block) => [block, marker] as const)),
    );
    /** The note, number and index of the endnote each of the endnotes' blocks is in, or nothing for those of their separator */
    const endnoteParts = endnotes.map((block, index) => {
        const noteNumber = endnoteNumbers.get(block);
        const note = endnoteOf.get(block) ?? noteNumber;
        return noteNumber === undefined
            ? undefined
            : {
                  note,
                  noteNumber,
                  index: endnotes.slice(0, index).filter((other) => (endnoteOf.get(other) ?? endnoteNumbers.get(other)) === note).length,
              };
    });

    /**
     * The pages, from what was placed on them, with what was guessed at on each, once each. The blocks after the body's are
     * its endnotes'. The page the layout stopped on because Word might lay it out differently has nothing on it
     */
    const pagesOf = (): readonly PageLayout[] => {
        const starts = placements.flatMap((placement, index) => (placement.type === "page" ? [index] : []));
        const guessesOn = (page: number): readonly string[] => [
            ...new Set(
                placements.flatMap((placement) => (placement.type === "guess" && placement.page === page ? [placement.reason] : [])),
            ),
        ];
        return starts.map((start, page) => {
            const guesses = guessesOn(page + 1);
            const placed = page + 1 === stoppedOnPage ? [] : placements.slice(start + 1, starts[page + 1]);
            const pieces = placed.filter((placement): placement is BlockPlacement => placement.type === "line" || placement.type === "row");
            const endnotePieces = pieces.flatMap((piece) => {
                const { endnote } = blocks[piece.block];
                const note = endnote === undefined ? undefined : endnoteParts[endnote];
                return note === undefined ? [] : [{ ...note, piece }];
            });
            const notes = endnotePieces.reduce<
                readonly { readonly note?: string; readonly noteNumber: string; readonly pieces: readonly BlockPiece[] }[]
            >((all, { note, noteNumber, index, piece }) => {
                const last = all[all.length - 1];
                return last?.note === note
                    ? [...all.slice(0, -1), { note, noteNumber, pieces: [...last.pieces, { index, piece }] }]
                    : [...all, { note, noteNumber, pieces: [{ index, piece }] }];
            }, []);
            return {
                ...(placements[start] as Extract<Placement, { readonly type: "page" }>).page,
                body: blocksOf(
                    pieces.flatMap((piece) => {
                        const { body } = blocks[piece.block];
                        return body === undefined ? [] : [{ index: body, piece }];
                    }),
                ),
                footnotes: placed.flatMap((placement) => (placement.type === "footnotes" ? placement.notes : [])),
                endnotes: notes.map(({ noteNumber, pieces: notePieces }) => ({ noteNumber, content: blocksOf(notePieces) })),
                ...(guesses.length > 0 ? { guesses } : {}),
            };
        });
    };

    /** The number of pages of each section whose pages are its alone, and that was laid out to its end */
    const countsOf = (): readonly (number | undefined)[] =>
        sections.map((_, index) => {
            const first = firstPages.get(index);
            const last = lastPages.get(index);
            return first === undefined || last === undefined || sharingPages.has(index) ? undefined : last - first + 1;
        });

    /** Where the pages broke, and what was placed on them, with what was worked out from where */
    const paginationOf = (stoppedAt?: string): Pagination => ({
        bookmarks,
        places,
        bookmarkNumbers: new Map([...bookmarks.keys()].map((name) => [name, places.get(name)!.pageNumber])),
        relativePositions: new Map(
            [...content.relativeReferences].map(([bookmark, fields]) => [
                bookmark,
                fields.map((field) => relativeText(places.get(bookmark), places.get(field), !homes.get(bookmark)?.inNote)),
            ]),
        ),
        pageCount,
        sectionPageCounts: countsOf(),
        ...(stoppedAt === undefined ? {} : { stoppedAt }),
        pages: pagesOf(),
    });

    try {
        // Guessing, the document and its first section are laid out as they were read, from the first page
        stopAtRead(content);
        stopAtRead(section());
        startPage(true);
        placeBlocks(0, blocks.length);
        // The room for a footnote too long for the columns of the last page is looked for as on the others
        for (let search = noteSearches.get(pageCount); search?.found === false; search = noteSearches.get(pageCount)) {
            reserveFor(new NotesGrew(nextNoteRoom(search, search.placed), []));
            restore(columnsStart!);
            placeBlocks(columnsStart!.index, blocks.length);
        }
        // The columns the endnotes end in are evened out (`word-stops-endnotes.docx` NE1, stops2/word-stops-notes2.ts NE4a
        // to NE4c)
        if (isEndnote(blocks.length - 1) && section().columns.length > 1 && columnsStart !== undefined && isEndnote(columnsStart.index)) {
            endColumns(blocks.length);
        }
        checkAnchors();
        checkReserve();
        checkBeneathText();
        // The rest of a footnote continued from the last page goes on pages of its own, as many as it takes, with that of a
        // footnote after it that goes on past its end (NT3b)
        while (carried !== undefined) {
            startPage();
        }
    } catch (error) {
        if (!(error instanceof Unsupported)) {
            throw error;
        }
        finishPage();
        return paginationOf(error.message);
    }
    finishPage();
    // eslint-disable-next-line functional/immutable-data
    lastPages.set(sectionIndex, pageCount);
    return paginationOf();
};
