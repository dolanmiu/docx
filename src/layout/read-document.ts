/**
 * Reads a document, as it is written, into what its pages are laid out from: its paragraphs, with their text, pictures,
 * bookmarks and formatting, its tables, and its sections, with their pages, margins, headers and footers.
 *
 * What can't be laid out yet, such as a picture that text wraps around, is marked as unsupported, with why, so the page
 * numbers after it are left blank rather than guessed. Read to be laid out with a guess, the reader reads past it with
 * one: what it can read of it as it is written, and what it can't left out, with why kept where it would stop, so the
 * layout notes the guess where it lays it out.
 *
 * @module
 */
import type { IContext, IXmlableObject } from "docx";

import {
    BORDER_WIDTHS,
    DEFAULT_FONT_SIZE,
    FURTHEST_BORDER,
    type FontData,
    type FontFace,
    type Hyphenation,
    type InlineItem,
    type KinsokuList,
    type LineBreakRules,
    NARROWEST_BORDER,
    type ParagraphBorder,
    type ParagraphFormat,
    READING_CONTEXT,
    type RunFormat,
    TWIPS_PER_POINT,
    type TabStop,
    type TabStopSetting,
    type TextFont,
    type TextGrid,
    type TextStyles,
    WIDEST_BORDER,
    type XmlObject,
    attributesOf,
    childrenOf,
    combine,
    find,
    fontOf,
    getTextStyles,
    isEastAsianRun,
    isMonospacedEastAsianFont,
    isObject,
    isOff,
    kinsokuLanguageOf,
    numberOf,
    onOff,
    pointsOf,
    readCellMargins,
    readFontFile,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    stringOf,
    styleChain,
    unknownLengthIn,
    unknownRunFormatting,
    valueOf,
    withoutUndefined,
} from "../text-layout";
import { type DataStores, withBoundTextWritten } from "./bound-controls";
import { layOutEquation } from "./equations";
import {
    type FieldCapitals,
    type FieldFormat,
    formatNumber,
    formatPageNumber,
    isFieldNumberFormat,
    isFieldPicture,
    writesNumber,
} from "./number-format";
import {
    type BorderSet,
    type CellPosition,
    type Margins,
    type TableGeometry,
    type TableLook,
    conditionalTypesOf,
    isDrawn,
    readBorderSet,
    readCellSpacing,
    readTableLook,
    roomOf,
    tableGeometry,
} from "./table-formats";
import { type FrameProperties, readFrameProperties } from "./text-frames";
import { type VmlShape, isVmlFalse, readVmlFloating, vmlLength, vmlShapeOf } from "./vml-drawings";

/**
 * A paragraph's content: text, tabs, breaks, pictures and bookmarks, and the results of fields that depend on the pages
 * being worked out: the page of a bookmark a page reference refers to, the number of pages of the document or of the
 * section it is in, and the number of the page or section it is on, each in its field's own format, if it has one. A page
 * reference with `\p` writes where its bookmark is from it (`relative`, the name of the marker at the field). A page
 * number's field is at a marker (`field`), as is a section number's in a footnote or endnote, as its page and section are
 * where the marker is placed.
 */
export type LayoutItem =
    | InlineItem
    | {
          readonly type: "pageReference";
          readonly bookmark: string;
          readonly font: TextFont;
          readonly format?: FieldFormat;
          readonly relative?: string;
          /**
           * Whether it is a page reference with `\p` in a footnote or endnote, which writes "on page" and its bookmark's page
           * on any page, its bookmark's too (`word-page-fields.docx` PF8f, PF8g)
           */
          readonly inNote?: boolean;
      }
    | { readonly type: "pageCount"; readonly scope: "document" | "section"; readonly font: TextFont; readonly format?: FieldFormat }
    | { readonly type: "pageNumber"; readonly field: string; readonly font: TextFont; readonly format?: FieldFormat }
    | { readonly type: "sectionNumber"; readonly font: TextFont; readonly format?: FieldFormat; readonly field?: string }
    /** A drawing that text flows around, anchored where it is in the paragraph */
    | { readonly type: "drawing"; readonly drawing: FloatingDrawing }
    /**
     * A text box in the line (a VML shape with `v:textbox`), with its run's font: as wide in the line as it is with its
     * outline, and as tall as its paragraphs, broken into lines in the room for its text (`textWidth`), and the room it
     * takes above and below them (`room`): its insets, what Word adds to a box sized to its text, and its outline
     */
    | {
          readonly type: "textBox";
          readonly width: number;
          readonly textWidth: number;
          readonly room: number;
          readonly blocks: readonly Block[];
          readonly font: TextFont;
      };

/** Lengths on each side of something, in points */
export type Sides = { readonly top: number; readonly bottom: number; readonly left: number; readonly right: number };

/**
 * Where a drawing that text flows around is, across or down the page (`wp:positionH`, `wp:positionV`): from what, and
 * lined up with it or at a distance from it.
 */
export type DrawingPosition = {
    /** What it is placed from (`relativeFrom`), such as the margins, the page, the column, the paragraph or the line */
    readonly from: string;
    /** How it lines up with that (`wp:align`), such as left, centre or right, or top, centre or bottom */
    readonly align?: string;
    /** How far it is from the start of that, in points (`wp:posOffset`) */
    readonly offset?: number;
    /**
     * How far it is from the start of that as a share of its width or height, such as 0.5 for half, as Word 2010 and later
     * place it (`wp14:pctPosHOffset`, `wp14:pctPosVOffset`), in place of `offset`
     */
    readonly share?: number;
};

/**
 * A drawing that text flows around (`wp:anchor`), anchored in a paragraph: a picture, a shape, a chart or a group of
 * them. Lengths are in points.
 */
export type FloatingDrawing = {
    /** How the text goes round it: beside its box, its outline, through its outline, or above and below it only */
    readonly wrap: "square" | "tight" | "through" | "topAndBottom";
    /** Which sides of it the text goes beside it on (`wrapText`): both, the left, the right, or the larger */
    readonly side: "bothSides" | "left" | "right" | "largest";
    /** Its size (`wp:extent`) */
    readonly width: number;
    readonly height: number;
    /**
     * Its width or height as a share of what it is sized by, such as 0.25 of the width between the margins, as Word 2010
     * and later size it (`wp14:sizeRelH`, `wp14:sizeRelV`), in place of `width` or `height`
     */
    readonly relativeWidth?: { readonly from: string; readonly share: number };
    readonly relativeHeight?: { readonly from: string; readonly share: number };
    /** The room its effects, such as a shadow or its turning, take beyond its size on each side (`wp:effectExtent`) */
    readonly effects: Sides;
    /** How far the text keeps from it on each side (`distT`, `distB`, `distL`, `distR`) */
    readonly distances: Sides;
    readonly horizontal: DrawingPosition;
    readonly vertical: DrawingPosition;
    /**
     * Whether it may overlap other drawings (`allowOverlap`), as docx writes it unless told otherwise. Word moves one that
     * may not out of the way (`word-floats2.docx` G3)
     */
    readonly mayOverlap: boolean;
    /**
     * The paragraphs of a text frame (`w:framePr`), when it is one, which are laid out in its box, and size it: its width,
     * when it is as wide as its text, and its height, as its height rule says
     */
    readonly frame?: TextFrame;
};

/**
 * A text frame's paragraphs, and how they size it: its height is theirs, at least its own, or its own exactly, and its
 * width is its own, or theirs (`fitsWidth`)
 */
export type TextFrame = {
    readonly blocks: readonly ParagraphBlock[];
    readonly heightRule: "auto" | "atLeast" | "exact";
    readonly fitsWidth: boolean;
};

export type ParagraphBlock = {
    readonly type: "paragraph";
    readonly items: readonly LayoutItem[];
    /** Its formatting, combined from its styles and its own */
    readonly format: ParagraphFormat;
    readonly tabStops: readonly TabStop[];
    /** The font of its mark */
    readonly markFont: TextFont;
    /**
     * Whether it shows nothing and its mark is hidden, so it takes no room, and is left out once it is read, its bookmarks
     * starting with the block after it
     */
    readonly hidden?: boolean;
    /**
     * The paragraphs with nothing shown and their marks hidden just before and after it, when there are any, which take no
     * room, but which Word's contextual spacing goes by, as their styles are those of the paragraphs next to it
     * (`word-hidden-paragraphs.docx` HP6c, HP6d)
     */
    readonly hiddenBefore?: ParagraphBlock;
    readonly hiddenAfter?: ParagraphBlock;
    /**
     * Its space before, at the top of a table cell, and after, at its bottom, when Word leaves it out for contextual
     * spacing with the paragraph next to it in the document's order, outside the cell (see `withCellEdges`)
     */
    readonly leftOut?: { readonly before?: boolean; readonly after?: boolean };
    readonly style?: string;
    /**
     * When its style is one of Word's headings ("heading 1" to "heading 9"), the heading's level, and its number as the
     * chapter number of the pages after it, when its style numbers it
     */
    readonly heading?: { readonly level: number; readonly chapter?: string };
    /** Whether it is empty but for its section's properties, as docx writes the end of each section but the last */
    readonly sectionBreak?: boolean;
    /**
     * The list it is numbered in, when it is: the list's id, its level in it, and the definition the list numbers by,
     * which lists made from the same definition share
     */
    readonly list?: { readonly id: string; readonly level: number; readonly definition: object };
    /**
     * How its list number lines up at the start of its first line, when not to the left: right-aligned it ends there, and
     * centred its middle is there (`w:lvlJc`)
     */
    readonly numberAlignment?: "center" | "right";
    /** The room its borders take above and below its lines, when it has a border there */
    readonly borders?: ParagraphBorders;
    /** The document grid its lines, or its characters, are laid out on, when its section has one */
    readonly grid?: TextGrid;
    /**
     * The text frame it is in (`w:framePr`), when it is in one, which takes it out of the text, to be anchored in the
     * paragraph after it once it is read
     */
    readonly frame?: FrameProperties;
    /** Why it can't be laid out as Word lays it out, when it can't */
    readonly unsupported?: string;
    /**
     * Whether a layout that guesses has no guess for it either, as it stands in for what couldn't be read, such as an
     * imported document, and has nothing of it to lay out
     */
    readonly noGuess?: boolean;
};

/**
 * The room a paragraph's borders take above and below its lines, in points: each border's width and the space between it
 * and the text. Word puts paragraphs next to each other with the same borders in one box, with the top border above the
 * first, the bottom border below the last, and a between border, if they have one, between each two
 * (`word-watertight-text.docx` TX5b, TX5h).
 */
export type ParagraphBorders = {
    readonly top: number;
    readonly bottom: number;
    /** The room a between border takes above each paragraph of the box after the first */
    readonly between: number;
    /** The space a between border leaves below each paragraph of the box before the last */
    readonly betweenSpace: number;
    /** What the paragraphs of one box share: their borders, and their left and right indents */
    readonly box: string;
    /** The same, but for the between border */
    readonly outline: string;
};

export type TableCell = {
    /** The column of the table's grid the cell starts in, counted from 0 */
    readonly column: number;
    /** How many columns of the grid the cell is across, when it is across more than one */
    readonly span?: number;
    /** The width of the text in the cell, in points: the cell's, less its margins */
    readonly width: number;
    /** The width the cell gives itself, in points: its own, or for a share of the table's width, the grid's */
    readonly ownWidth?: number;
    readonly blocks: readonly Block[];
    /** The space around the text in the cell, in points */
    readonly marginTop: number;
    readonly marginBottom: number;
    readonly marginLeft: number;
    readonly marginRight: number;
    /** Whether it is the first of cells merged down the rows, or one of the rest */
    readonly verticalMerge?: "restart" | "continue";
    /**
     * Whether its text runs up or down it (`w:textDirection` btLr or tbRl), so that it takes no room in the row's height,
     * as in Word (`word-watertight-tables.docx` TB6)
     */
    readonly vertical?: boolean;
    /** Whether the mark that ends it takes no room when its last paragraph is empty (`w:hideMark`), as in Word (TB7) */
    readonly hideMark?: boolean;
    /**
     * What is in it as Word sizes its table's columns by it, when that isn't `blocks`: with its deleted text in, which
     * Word counts in the widths of columns it sizes to their text or widens for long words, though it lays out the lines
     * without it (`word-tracked-changes.docx` MK11j)
     */
    readonly sizing?: readonly Block[];
};

export type TableRow = {
    readonly cells: readonly TableCell[];
    readonly height?: { readonly value: number; readonly rule: "atLeast" | "exact" };
    /** Whether it is repeated at the top of each page the table is on */
    readonly header: boolean;
    /** Whether it moves to the next page whole, rather than breaking across the pages, when it doesn't fit */
    readonly cantSplit: boolean;
    /**
     * The room above the row's cells, in points: the border between it and the row above, or the table's top border, and
     * the space between cells. For the last row, the same below it
     */
    readonly borderTop: number;
    readonly borderBottom: number;
    /** The room of the border below the row where the table breaks across pages after it, in points */
    readonly breakBorder?: number;
};

export type TableBlock = {
    readonly type: "table";
    readonly rows: readonly TableRow[];
    /**
     * Given when Word sizes the table's columns to their text, as it does when some of its cells have no widths, with the
     * table's own width, in points or as a share of the width it is in. Its cells' widths are then worked out as it is
     * laid out, in place of those read
     */
    readonly fit?: { readonly width?: number; readonly share?: number };
    /**
     * Given when Word widens a column for a word longer than the width its cells give it, as it does in a table whose
     * cells all have widths, unless its layout is fixed, with the table's own width, as for `fit`. `uneven` when its rows
     * give a column different widths, which Word evens out to the widest each gives it, and `fixed` when it is laid out
     * fixed, which Word evens out so too, but widens no column of for a long word (`word-watertight-stops.docx` SP14)
     */
    readonly widen?: { readonly width?: number; readonly share?: number; readonly uneven?: true; readonly fixed?: true };
    /** The width of the borders left and right of the table, in points */
    readonly borderLeft?: number;
    readonly borderRight?: number;
    /** How far it is indented from the start of the width it is in, in points (`w:tblInd`) */
    readonly indent?: number;
    /** The space between its cells, in points, when it has any (`w:tblCellSpacing`) */
    readonly cellSpacing?: number;
    /**
     * Its rows deleted in a tracked change, which take no room, but which Word counts in the widths of the columns it sizes
     * to their text or widens for long words (`word-tracked-changes.docx` MK11h, MK11i). Given when it sizes or widens them
     */
    readonly deletedRows?: readonly TableRow[];
    /** Where it floats, when text flows around it (`w:tblpPr`) */
    readonly float?: TableFloat;
    readonly unsupported?: string;
    /** Whether a layout that guesses has no guess for it either, for what is in one of its cells */
    readonly noGuess?: boolean;
};

/**
 * Where a table that text flows around is (`w:tblpPr`): across and down the page, from the page, its margins, or the
 * column and the top of the paragraph after it, at a distance or lined up with it, and how far the text keeps from it.
 */
export type TableFloat = {
    readonly horizontal: DrawingPosition;
    readonly vertical: DrawingPosition;
    readonly distances: Sides;
    /** Whether it may overlap other tables that text flows around (`w:tblOverlap`) */
    readonly mayOverlap: boolean;
};

export type Block = ParagraphBlock | TableBlock;

/** The headers or footers of a section, by the pages they are on */
export type HeadersOrFooters = {
    readonly default?: readonly Block[];
    readonly first?: readonly Block[];
    readonly even?: readonly Block[];
};

/**
 * A section's pages. Lengths are in points.
 */
export type Section = {
    readonly pageWidth: number;
    readonly pageHeight: number;
    readonly marginTop: number;
    readonly marginBottom: number;
    readonly marginLeft: number;
    readonly marginRight: number;
    /** The distance from the top of the page to the header, and from the bottom to the footer */
    readonly header: number;
    readonly footer: number;
    /** The room kept for binding beside the page's text, on its left */
    readonly gutter: number;
    /** The room kept for binding above the page's text instead, when the document puts it at the top (`w:gutterAtTop`) */
    readonly topGutter: number;
    /** How the section starts: on a new page, an even or odd one, or on the same page as the one before */
    readonly start: "nextPage" | "continuous" | "evenPage" | "oddPage" | "nextColumn";
    /** Whether its first page has a header and footer of its own */
    readonly titlePage: boolean;
    /** The width of each of its columns, from the first: the width of the page's text for a section of one column */
    readonly columns: readonly number[];
    readonly numberFormat: string;
    /**
     * When its page numbers start with a chapter number: the level of the headings that number the chapters, and what
     * goes between the chapter number and the page's
     */
    readonly chapters?: { readonly level: number; readonly separator: string };
    /** The number of its first page, when it doesn't carry on from the section before */
    readonly firstNumber?: number;
    readonly headers: HeadersOrFooters;
    readonly footers: HeadersOrFooters;
    /**
     * When its text runs down the page, whether its lines go across it from the right or from the left. Its page, margins
     * and columns are then those of the page turned on its side, so that its lines run along it: its width is the page's
     * height, its left margin the page's top margin and its top margin the right one, or the left
     */
    readonly textRunsDown?: "fromRight" | "fromLeft";
    readonly unsupported?: string;
};

/**
 * A document, read to be laid out.
 */
export type DocumentContent = {
    /** The blocks of its body, with the index of the section each is in */
    readonly blocks: readonly { readonly block: Block; readonly section: number }[];
    readonly sections: readonly Section[];
    /** The distance between default tab stops, in points */
    readonly defaultTabStop: number;
    /** Whether even pages have headers and footers of their own */
    readonly evenAndOddHeaders: boolean;
    /**
     * Whether the space between paragraphs is the space after the first and the space before the second added together,
     * as it is with the compatibility setting `doNotUseHTMLParagraphAutoSpacing`, rather than the larger of them
     */
    readonly addsParagraphSpacing: boolean;
    /** The footnotes the body refers to, by the names of the markers at their references */
    readonly footnotes: ReadonlyMap<string, readonly Block[]>;
    /** What is above the footnotes at the bottom of a page: the paragraph of the line that separates them from the text */
    readonly footnoteSeparator: readonly Block[];
    /** What is above them instead when a footnote continues from the page before: the paragraph of a longer line */
    readonly footnoteContinuationSeparator: readonly Block[];
    /** The endnotes the body refers to, in order, after their separator: they follow the body, as Word lays them out */
    readonly endnotes: readonly Block[];
    /** What is above the endnotes on each page after the first they are on: the paragraph of a longer line */
    readonly endnoteContinuationSeparator: readonly Block[];
    /** Where its lines break: the characters that can't start or end a line, where it gives its own */
    readonly breakRules?: LineBreakRules;
    /** Word's automatic hyphenation of its words, with its settings, when it has it on */
    readonly hyphenation?: Hyphenation;
    /** The number each footnote shows, by the name of its marker */
    readonly footnoteNumbers: ReadonlyMap<string, string>;
    /** The number of the endnote each of the endnotes' blocks is in: all but their separator's */
    readonly endnoteNumbers: ReadonlyMap<Block, string>;
    /**
     * The page references with `\p` in the body to each bookmark, in the order they are in it, by the names of the markers
     * at them
     */
    readonly relativeReferences: ReadonlyMap<string, readonly string[]>;
    /** The endnotes the body refers to, by the names of the markers at their references */
    readonly endnoteReferences: ReadonlyMap<string, readonly Block[]>;
    /** The faces of the fonts it embeds, which Word draws text in those fonts in */
    readonly fonts?: readonly FontFace[];
    /** Why none of it can be laid out, when a setting of the whole document changes its lines in ways not yet followed */
    readonly unsupported?: string;
};

type NumberingLevel = {
    /** The paragraph style the level is for, which numbers its paragraphs at this level (`w:pStyle`) */
    readonly style?: string;
    readonly format: string;
    readonly text: string;
    readonly suffix: string;
    readonly start: number;
    /** How its number lines up at the start of its paragraph's first line (`w:lvlJc`), when not to the left */
    readonly alignment?: "center" | "right";
    /**
     * Which level it starts again after, counted from 1, or 0 for none (`w:lvlRestart`). Unless it gives one, or gives
     * itself or one below it, it starts again after any level above it
     */
    readonly restart?: number;
    /** Whether its text writes the numbers of every level in decimal, whatever their formats (`w:isLgl`) */
    readonly legal?: boolean;
    readonly paragraph: ParagraphFormat;
    readonly run: RunFormat;
    /** Why its number isn't written or placed as Word does, when it isn't */
    readonly unsupported?: string;
};

/**
 * Where the lists made from one definition are in their counting, which they share: the number each level is at, and
 * which of their own first numbers they have started levels at, as each list's id and the level
 */
type ListCount = { readonly numbers: readonly (number | undefined)[]; readonly started: readonly string[] };

/** A list paragraphs are numbered in (`w:num`) */
type NumberingList = {
    /** Its levels: its definition's, or those it gives in their place */
    readonly levels: readonly NumberingLevel[];
    /** The id of the definition it is made from (`w:abstractNum`) */
    readonly definition: string;
    /** The levels of the definition, which every list made from it shares */
    readonly shared: readonly NumberingLevel[];
    /**
     * The first numbers it starts levels at, in place of where the lists made from its definition are (`w:startOverride`,
     * or the first number of a level it gives), by level
     */
    readonly starts: ReadonlyMap<number, number>;
    /** Why its numbers aren't written as Word writes them, when they aren't */
    readonly unsupported?: string;
};

type NoteKind = "footnote" | "endnote";

/**
 * What a reference to a footnote or endnote shows: its number, and the marker its note's bookmarks and fields are placed
 * by, unless it is only numbered to size a table's columns
 */
type NoteReference = { readonly label: string; readonly marker?: string };

/** Reads the footnotes and endnotes references in the body refer to, and numbers them */
type NoteReader = {
    /** Reads the note a reference refers to, and numbers it */
    readonly read: (kind: NoteKind, id: string) => NoteReference;
    /** Counts a note whose reference is deleted, which Word numbers but doesn't show (`word-tracked-changes.docx` MK10e) */
    readonly skip: (kind: NoteKind) => void;
    /** A reader that numbers notes as this one would from here, without reading them or counting them in this one */
    readonly preview: () => NoteReader;
};

/** A complex field being read */
type OpenField = {
    // eslint-disable-next-line functional/prefer-readonly-type
    instruction: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    inResult: boolean;
    /** Whether its result depends on the pages, so it is worked out rather than read */
    // eslint-disable-next-line functional/prefer-readonly-type
    replaced: boolean;
    /** Whether its start is deleted in a tracked change, or moved elsewhere, as all of it then is */
    readonly deleted?: boolean;
};

/**
 * The markers at the body's fields whose results depend on the page they are on: how many there are, and those of the
 * page references with `\p`, by the bookmarks they refer to
 */
type FieldMarkers = {
    // eslint-disable-next-line functional/prefer-readonly-type
    count: number;
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly relative: Map<string, string[]>;
};

/**
 * What a part of a document, such as its body or a header, is read with. The fields and list numbers carry on from one
 * paragraph to the next.
 */
type Reader = {
    /** Reads the notes the references refer to: the body's. References elsewhere have no notes */
    readonly notes?: NoteReader;
    /** The number of the footnote or endnote being read, which the mark at its start shows */
    readonly noteNumber?: string;
    readonly styles: TextStyles;
    /** Each list, by the id its paragraphs refer to it by */
    readonly numbering: ReadonlyMap<string, NumberingList>;
    /** The number of each list a paragraph may refer to by another id, such as the placeholder docx writes */
    readonly listIds: ReadonlyMap<string, string>;
    /** Whether it is a header or footer, where drawings that text doesn't flow around don't matter */
    readonly inHeader: boolean;
    /** Whether it is a footnote or endnote, whose fields are where its reference is */
    readonly inNote?: boolean;
    /** The markers at the fields whose pages are worked out, in the body and its notes */
    readonly markers: FieldMarkers;
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly fields: OpenField[];
    /** Where the lists made from each definition are in their counting, by the definition's id */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly counters: Map<string, ListCount>;
    /** Whether deleted text is read as text, as Word sizes a table's columns by it */
    readonly showDeleted?: boolean;
    /** Whether it reads the cells of a table whose columns Word sizes to their text or widens for long words */
    readonly inSizedTable?: boolean;
    /** The character the document's settings line up at decimal tab stops (`w:decimalSymbol`), if they give one */
    readonly decimalSymbol?: string;
    /** Whether it reads the cells of a table */
    readonly inCell?: boolean;
    /** Whether it reads past what can't be laid out as Word does, with a guess (see {@link guessedOr}) */
    readonly guess?: boolean;
    /** The document grid of the section being read, which its body's paragraphs and footnotes are on */
    readonly grid?: TextGrid;
    /** The document grid of the section a table being read is in, which the lines of its cells aren't on */
    readonly cellGrid?: TextGrid;
    /** Whether the text of the section being read runs down the page */
    readonly down?: boolean;
    /** Whether it reads the paragraphs of a text box */
    readonly inTextBox?: boolean;
    /** Why its equations can't be laid out as Word does for the document's maths settings, when they can't */
    readonly maths?: string;
};

// Word's defaults for a section that doesn't give its page: Letter, with inch margins
const DEFAULT_SECTION: Omit<Section, "headers" | "footers" | "columns"> = {
    pageWidth: 612,
    pageHeight: 792,
    marginTop: 72,
    marginBottom: 72,
    marginLeft: 72,
    marginRight: 72,
    header: 36,
    footer: 36,
    gutter: 0,
    topGutter: 0,
    start: "nextPage",
    titlePage: false,
    numberFormat: "decimal",
};
/** What goes between a chapter number and a page number, by `w:chapSep`. Word puts a hyphen when it isn't given */
const CHAPTER_SEPARATORS: Readonly<Record<string, string>> = { hyphen: "-", period: ".", colon: ":", emDash: "\u2014", enDash: "\u2013" };
const EMUS_PER_POINT = 12700;
/** How far apart, in points, the widths two rows give a column can be before they differ: rounding, not a choice */
const WIDTH_TOLERANCE = 1;
/** The most columns a table in Word can have */
const MOST_COLUMNS = 63;
// Border widths are in eighths of a point
const EIGHTHS_PER_POINT = 8;
// Shares of a width, such as a table's of the page's, are in fiftieths of a percent, unless they are written with a %
const FIFTIETHS_OF_A_PERCENT = 5000;
// Formatting switches that don't change how a field writes a number, and those of the capitals of text, which don't change
// a number in figures
// cspell:ignore mergeformatinet firstcap
const PLAIN_FORMATS = new Set(["mergeformat", "charformat", "mergeformatinet"]);
const CASE_FORMATS = new Set(["upper", "lower", "firstcap", "caps"]);
// Word fills a content control bound to custom XML in from it when it opens the document, so what it shows there may not
// be what is written. Where it is the XML's text already, the binding is taken out as it is read (see `bound-controls.ts`)
const BOUND_CONTROL = "a content control Word fills in from custom XML with other text than is written in it";
// What a deleted run has that takes room, other than its text. Word lays its lines out without it (`word-tracked-changes.docx`
// MK10), but how it sizes a table's columns by it hasn't been seen, as it has for deleted text (MK11j)
const REMOVED_ROOM = new Set(["w:tab", "w:ptab", "w:br", "w:cr", "w:drawing", "mc:AlternateContent", "w:pict", "w:object"]);
const REMOVED_NOTES = new Set(["w:footnoteReference", "w:endnoteReference"]);
const SIZED_REMOVAL = "a deleted picture, tab, break or note reference in a table whose columns Word sizes to their text";
const PARTLY_DELETED_FIELD = "a field partly deleted in a tracked change";
// A mark of its own in place of a note's number, which Word may not count in the numbers of the others
const OWN_NOTE_MARK = "a footnote or endnote with a mark of its own";
// Whether a box of borders around text goes on round a tab in it isn't known
const TAB_IN_BORDER = "a tab in text with a border";

// The start of the name of a marker that stands in a paragraph's items for what the reader guessed at, read to be laid
// out with a guess, with why after it. The paragraph takes the first as why it can't be laid out as Word does, and leaves
// them out of its items
const GUESS = "docx-layout:guess ";

/** A marker that stands in a paragraph's items for what the reader guessed at, for why */
const guessMarker = (reason: string): LayoutItem => ({ type: "marker", name: `${GUESS}${reason}` });

/** Why the reader guessed at what an item stands for, when it is the marker of a guess */
const guessOf = (item: LayoutItem): string | undefined =>
    item.type === "marker" && item.name.startsWith(GUESS) ? item.name.slice(GUESS.length) : undefined;

/**
 * Why the layout stops at what is being read, in its place, or, read to be laid out with a guess, the reader's guess at
 * it (`guess`), after the marker of why, so the paragraph it is in is laid out with the guess, and says why. Where the
 * reader has no better guess, it returns why alone, and the paragraph is laid out without what it stands for (see
 * {@link itemsOf}).
 */
const guessedOr = (reader: Reader, reason: string, guess: () => readonly LayoutItem[] | string): readonly LayoutItem[] | string =>
    reader.guess ? [guessMarker(reason), ...(itemsOf([guess()], reader) as readonly LayoutItem[])] : reason;

const nameOf = (element: XmlObject): string => Object.keys(element)[0];

/** The content of an element, including its text. An element without content has its attributes, or nothing */
const contentOf = (element: XmlObject): readonly unknown[] => {
    const content = element[nameOf(element)];
    return Array.isArray(content) ? content : [content];
};

/** Whether an attribute that is on or off, such as `w:combine`, is on: it is off when it isn't given */
const isOn = (value: unknown): boolean => value !== undefined && !isOff(value);

/** Whether a note's reference has a mark of its own in place of its number (`w:customMarkFollows`) */
const hasOwnMark = (reference: XmlObject): boolean => isOn(attributesOf(reference[nameOf(reference)])["w:customMarkFollows"]);

/** Whether a content control (`w:sdt`) is bound to custom XML (`w:dataBinding`), which Word fills it in from */
const isBound = (control: XmlObject): boolean =>
    find(childrenOf(find(childrenOf(control["w:sdt"]), "w:sdtPr")), "w:dataBinding") !== undefined;

/**
 * The elements of a part of a document, such as a table's rows or a cell's paragraphs, with those in its content controls
 * and custom XML in their place. A content control bound to custom XML is kept whole, as it can't be laid out, unless it
 * is read to be laid out with a guess (`guess`) and starts with a paragraph: then what is written in it is read as it is,
 * and its first paragraph says why it is a guess.
 */
const unwrap = (elements: readonly unknown[], guess = false): readonly XmlObject[] =>
    elements.filter(isObject).flatMap((element) => {
        const name = nameOf(element);
        if (name === "w:sdt") {
            const content = unwrap(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), guess);
            if (!isBound(element)) {
                return content;
            }
            const first = content.find((child) => BLOCK_ELEMENTS.has(nameOf(child)));
            return guess && first !== undefined && "w:p" in first
                ? content.map((child) => (child === first ? stopIn(child, BOUND_CONTROL) : child))
                : [element];
        }
        return name === "w:customXml" ? unwrap(contentOf(element), guess) : [element];
    });

/** The name of the bookmark a bookmark's start (`w:bookmarkStart`) starts */
const bookmarkOf = (element: XmlObject): string | undefined => stringOf(attributesOf(element["w:bookmarkStart"])["w:name"]);

/** A bookmark's start (`w:bookmarkStart`), as a marker where it starts */
const markerOf = (element: XmlObject): readonly LayoutItem[] => {
    const bookmark = bookmarkOf(element);
    return bookmark === undefined ? [] : [{ type: "marker", name: bookmark }];
};

/** The names of the bookmarks that start among elements, in order */
const bookmarksIn = (elements: readonly XmlObject[]): readonly string[] =>
    elements.flatMap((element) => {
        const bookmark = "w:bookmarkStart" in element ? bookmarkOf(element) : undefined;
        return bookmark === undefined ? [] : [bookmark];
    });

/**
 * The elements of a name in a part of a document, such as the rows of a table, each with the names of the bookmarks
 * that start between it and the one before. A bookmark there starts with the element, as it starts where the element's
 * text does. Those after the last are left out.
 */
const withBookmarks = (
    elements: readonly XmlObject[],
    name: string,
): readonly { readonly element: XmlObject; readonly bookmarks: readonly string[] }[] => {
    const indexes = elements.flatMap((element, index) => (name in element ? [index] : []));
    return indexes.map((at, index) => ({
        element: elements[at],
        bookmarks: bookmarksIn(elements.slice(index === 0 ? 0 : indexes[index - 1] + 1, at)),
    }));
};

/**
 * The number of a footnote or endnote, at its reference or at the start of the note, in its run's font: in superscript
 * where its style has it, as docx's FootnoteReference and EndnoteReference do.
 */
const noteNumber = (text: string, font: TextFont): LayoutItem => ({ type: "text", text, font });

/** A length in points, from twips or from a universal measure, such as "1in" */
const twips = (value: unknown): number | undefined => pointsOf(value, TWIPS_PER_POINT);

/** How a field writes its number, and whether it writes where its bookmark is (`\p`), or why Word's text isn't known */
type NumberSwitches = { readonly format?: FieldFormat; readonly relative: boolean; readonly unsupported?: string };

const FORMAT_UNSUPPORTED = "a number in a field format not yet written";

/**
 * Reads the switches of a field that writes a number, after its name and bookmark: `\p`, a number format (`\* roman`) or
 * picture (`\# "00"`), and capitals (`\* Upper`). Word's text isn't known for a format other than those
 * {@link isFieldNumberFormat} and {@link isFieldPicture} say, such as `\* CardText`, for `\* Caps`, or for two of a kind
 * or a format with a picture.
 */
const numberSwitchesOf = (switches: string): NumberSwitches => {
    const parts = switches.match(/"[^"]*"|\S+/g) ?? [];
    let numberFormat: string | undefined;
    let picture: string | undefined;
    // eslint-disable-next-line functional/prefer-readonly-type
    const capitals: string[] = [];
    let relative = false;
    let unsupported: string | undefined;
    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        // A switch's argument is after it, or, without a space, in it, as `\*roman`
        const argument = (): string => (part.length > 2 ? part.slice(2) : (parts[++index] ?? "")).replace(/^"(.*)"$/, "$1");
        if (/^\\p$/i.test(part)) {
            relative = true;
        } else if (part.startsWith("\\#")) {
            const value = argument();
            unsupported ??= picture === undefined && isFieldPicture(value) ? undefined : "a number written with a picture not yet written";
            picture ??= value;
        } else if (part.startsWith("\\*")) {
            const name = argument();
            const lower = name.toLowerCase();
            if (CASE_FORMATS.has(lower)) {
                // eslint-disable-next-line functional/immutable-data
                capitals.push(lower);
            } else if (name !== "" && !PLAIN_FORMATS.has(lower)) {
                unsupported ??= numberFormat === undefined && isFieldNumberFormat(name) ? undefined : FORMAT_UNSUPPORTED;
                numberFormat ??= name;
            }
        }
    }
    const unseen = capitals.length > 1 || capitals[0] === "caps" || (numberFormat !== undefined && picture !== undefined);
    const format = withoutUndefined({ numberFormat, picture, capitals: capitals[0] as FieldCapitals | undefined });
    return {
        relative,
        ...(Object.keys(format).length > 0 ? { format } : {}),
        ...withoutUndefined({ unsupported: unsupported ?? (unseen ? FORMAT_UNSUPPORTED : undefined) }),
    };
};

// The fields Word writes itself when it opens the document, from the computer's clock
const DATE_FIELDS = new Set(["DATE", "TIME"]);
const DATE_UNSUPPORTED = "a date or time, which Word writes when it opens the document";
// Why the layout stops at fields whose results Word writes in ways not yet followed, which, guessing, are read as they
// are written
const WRITTEN_GUESSES: ReadonlySet<string> = new Set([DATE_UNSUPPORTED]);

/** A marker at a field whose result depends on where it is placed */
const fieldMarker = (markers: FieldMarkers): Extract<LayoutItem, { readonly type: "marker" }> => {
    // eslint-disable-next-line functional/immutable-data
    markers.count++;
    return { type: "marker", name: `field ${markers.count}` };
};

/**
 * A reader whose fields' markers are named on from the reader's, but whose page references with `\p` aren't counted:
 * for what is read again to size a table's columns, and deleted text, which docx doesn't count them in either
 */
const uncounted = (reader: Reader): Reader => ({ ...reader, markers: { count: reader.markers.count, relative: new Map() } });

/** Whether a marker is at a field (see {@link fieldMarker}), rather than a bookmark or a note's reference */
export const isFieldMarker = (name: string): boolean => name.startsWith("field ");

/**
 * The result of a field that depends on the pages being worked out, rather than read: the page of the bookmark a PAGEREF
 * field refers to, or where it is from it, with `\p`; the number of pages of the document (NUMPAGES) or of its section
 * (SECTIONPAGES); and outside headers and footers, the number of the page (PAGE) or section (SECTION) it is on, which in
 * a footnote or endnote are those of its reference, as Word writes them (`word-page-fields.docx` PF7g to PF7i). Why it
 * can't be laid out when Word's text for it isn't known, and at a date or time anywhere but a header or footer, as Word
 * writes the date it opens the document on (`word-watertight-pages.docx` PG7a). Undefined for other fields, which are read
 * as they are written, as PAGE and SECTION are in headers and footers.
 */
const workedOutResultOf = (instruction: string, font: TextFont, reader: Reader): readonly LayoutItem[] | string | undefined => {
    const field = /^\s*(PAGEREF|NUMPAGES|SECTIONPAGES|PAGE|SECTION|DATE|TIME)\b(.*)$/is.exec(instruction);
    if (!field) {
        return undefined;
    }
    const name = field[1].toUpperCase();
    const { inHeader, inNote, markers } = reader;
    if (DATE_FIELDS.has(name)) {
        return inHeader ? undefined : DATE_UNSUPPORTED;
    }
    if (name === "PAGEREF") {
        const reference = /^\s*("?)([^\s"\\]+)\1(.*)$/s.exec(field[2]);
        if (!reference) {
            return undefined;
        }
        const [, , bookmark, switches] = reference;
        const switched = numberSwitchesOf(switches);
        // Each page reference with \p in the body is counted, whatever it writes, as docx counts them to write them
        const at = switched.relative && !inHeader && !inNote ? fieldMarker(markers) : undefined;
        if (at) {
            // Added to in place, as a document can have any number of them to one bookmark
            const references = markers.relative.get(bookmark) ?? [];
            // eslint-disable-next-line functional/immutable-data
            markers.relative.set(bookmark, references);
            // eslint-disable-next-line functional/immutable-data
            references.push(at.name);
        }
        if (switched.unsupported) {
            // Guessing, the page reference writes its bookmark's page as the page shows it
            return guessedOr(reader, switched.unsupported, () => workedOutResultOf(`PAGEREF ${bookmark}`, font, reader)!);
        }
        const own = withoutUndefined({ format: switched.format });
        if (!switched.relative || writesNumber(switched.format)) {
            // With a number format or picture, one with \p writes its bookmark's page's number (PF3c)
            return [{ type: "pageReference", bookmark, font, ...own }];
        }
        if (inHeader) {
            // Where a header's bookmark is from it isn't worked out, so it is read as it is written
            return undefined;
        }
        return at
            ? [at, { type: "pageReference", bookmark, font, relative: at.name, ...own }]
            : [{ type: "pageReference", bookmark, font, inNote: true, ...own }];
    }
    const { format, unsupported } = numberSwitchesOf(field[2]);
    // Guessing, a number in a format not yet written is written as the page or section shows it, or in figures
    const unformatted = (): readonly LayoutItem[] | string => workedOutResultOf(name, font, reader)!;
    if (name === "NUMPAGES" || name === "SECTIONPAGES") {
        return unsupported === undefined
            ? [{ type: "pageCount", scope: name === "NUMPAGES" ? "document" : "section", font, ...withoutUndefined({ format }) }]
            : guessedOr(reader, unsupported, unformatted);
    }
    if (inHeader) {
        return undefined;
    }
    if (unsupported) {
        return guessedOr(reader, unsupported, unformatted);
    }
    if (name === "SECTION" && !inNote) {
        return [{ type: "sectionNumber", font, ...withoutUndefined({ format }) }];
    }
    const marker = fieldMarker(markers);
    return [
        marker,
        name === "SECTION"
            ? { type: "sectionNumber", field: marker.name, font, ...withoutUndefined({ format }) }
            : { type: "pageNumber", field: marker.name, font, ...withoutUndefined({ format }) },
    ];
};

/** Whether what is read now is shown: not in a field's instruction, nor in a result that is worked out */
const isShown = ({ fields }: Reader): boolean => fields.every((field) => field.inResult && !field.replaced);

/** Adds the tab stops of a paragraph, or of its style, to those of the styles before */
const addTabs = (stops: readonly TabStopSetting[], settings: readonly TabStopSetting[] = []): readonly TabStopSetting[] =>
    settings.reduce(
        (all, setting) => [
            ...all.filter((stop) => Math.abs(stop.position - setting.position) > 0.01),
            ...(setting.alignment === "clear" ? [] : [setting]),
        ],
        stops,
    );

const tabStopsOf = (formats: readonly ParagraphFormat[]): readonly TabStop[] =>
    formats
        .reduce<readonly TabStopSetting[]>((stops, { tabs }) => addTabs(stops, tabs), [])
        .filter((stop): stop is TabStop => stop.alignment !== "bar" && stop.alignment !== "clear");

const IN_CELL_OR_NOTE = "a drawing that text flows around in a table cell, footnote, endnote or text box";

/**
 * A drawing that text flows around, in a header or footer as in the body: one in a header or footer is on each page that
 * shows it, and the body's text goes round it, as round one of its own (`word-watertight-pages.docx` PG4,
 * `word-stops-drawings.docx` DH1a to DH1d, `word-vml.docx` VM13). Or why it can't be laid out: one placed against its
 * paragraph or line in a header or footer, whose place on the page hasn't been seen, nor what the header's own text does
 * beside it
 */
const floatingItem = (floating: FloatingDrawing, reader: Reader): readonly LayoutItem[] | string => {
    const { horizontal, vertical } = floating;
    return reader.inHeader && (vertical.from === "paragraph" || vertical.from === "line" || horizontal.from === "character")
        ? "a drawing that text flows around in a header or footer, placed against its paragraph or line"
        : [{ type: "drawing", drawing: floating }];
};

/**
 * Reads a drawing in a run (`w:drawing`): a picture in the line is a box, with its run's font, and one that text doesn't
 * flow around, such as one behind the text, takes up no room.
 */
const readDrawing = (element: XmlObject, font: TextFont, reader: Reader): readonly LayoutItem[] | string => {
    const [drawing] = childrenOf(element["w:drawing"]);
    const inline = drawing["wp:inline"];
    if (inline !== undefined) {
        const children = childrenOf(inline);
        const extent = attributesOf(find(children, "wp:extent"));
        const effect = attributesOf(find(children, "wp:effectExtent"));
        const around = attributesOf(inline);
        const emus = (...values: readonly unknown[]): number => values.reduce<number>((total, value) => total + (numberOf(value) ?? 0), 0);
        return [
            {
                type: "box",
                width: emus(extent.cx, effect.l, effect.r, around.distL, around.distR) / EMUS_PER_POINT,
                height: emus(extent.cy, effect.t, effect.b, around.distT, around.distB) / EMUS_PER_POINT,
                font,
            },
        ];
    }
    const anchor = childrenOf(drawing["wp:anchor"]);
    const flowsAround = !anchor.some((child) => "wp:wrapNone" in child);
    if (!flowsAround) {
        return [];
    }
    if (reader.inCell || reader.inNote || reader.inTextBox) {
        return IN_CELL_OR_NOTE;
    }
    const floating = readFloating(drawing["wp:anchor"]);
    return typeof floating === "string" ? floating : floatingItem(floating, reader);
};

/**
 * Reads a VML drawing (`w:pict`), as Word lays it out (scripts/layout-probes/word-vml.ts). A shape in the line is a box of
 * its size, with its run's font, standing on the baseline, as a picture is (VM7), and a text box in it is a box sized to
 * its text (VM1 to VM5). One placed on the page (`position:absolute`) that text flows around (`w10:wrap`) is a drawing
 * that text flows around, as a DrawingML one is (VM9 to VM11, VM15), and one with no wrapping is in front of the text or
 * behind it, and takes no room (VM6), in a header or footer too, as docx's watermarks are. One in a header or footer that
 * text flows around is one the body's text goes round (VM13), as a DrawingML one is. It says why where Word's way with it
 * isn't known: a picture, which Word drew at a size other than its own (VM8), a shape with an outline, which takes room
 * around it (VM1), tight or through wrapping, which Word doesn't wrap as square wrapping (VM14), and one in a header's
 * line, whose room there doesn't follow the body's (VM12).
 */
const readVml = (pict: unknown, font: TextFont, reader: Reader): readonly LayoutItem[] | string => {
    const shape = vmlShapeOf(pict);
    if (typeof shape === "string") {
        return shape;
    }
    const { style, element } = shape;
    const children = childrenOf(element[nameOf(element)]);
    const attributes = attributesOf(element[nameOf(element)]);
    const width = vmlLength(style.get("width"));
    const height = vmlLength(style.get("height"));
    const outlined = !isVmlFalse(attributes.stroked ?? "t") && style.get("visibility") !== "hidden";
    const unsized = (): string => (typeof width === "string" ? width : typeof height === "string" ? height : "a VML drawing with no size");
    if (style.get("position") === "absolute") {
        const wrap = find(children, "w10:wrap");
        if (wrap === undefined || attributesOf(wrap).type === "none") {
            return [];
        }
        const reason =
            reader.inCell || reader.inNote || reader.inTextBox
                ? IN_CELL_OR_NOTE
                : shape.text !== undefined
                  ? "a text box that text flows around"
                  : find(children, "v:imagedata") !== undefined
                    ? "a VML picture"
                    : outlined
                      ? "a VML drawing with an outline that text flows around"
                      : typeof width !== "number" || typeof height !== "number"
                        ? unsized()
                        : undefined;
        if (reason !== undefined) {
            return reason;
        }
        const floating = readVmlFloating(shape, wrap as XmlObject, width as number, height as number);
        return typeof floating === "string" ? floating : floatingItem(floating, reader);
    }
    // Guessing, a shape in the line of a size Word's way with isn't known takes that size
    const sized = (reason: string): readonly LayoutItem[] | string =>
        typeof width === "number" && typeof height === "number"
            ? guessedOr(reader, reason, () => [{ type: "box", width, height, font }])
            : reason;
    if (reader.inHeader || reader.inTextBox) {
        return sized("a VML drawing in the line of a header, footer or text box");
    }
    if (shape.text !== undefined) {
        return readTextBox(shape, width, font, outlined, reader);
    }
    if (find(children, "v:imagedata") !== undefined) {
        return sized("a VML picture");
    }
    if (outlined) {
        return sized("a VML shape with an outline in the line");
    }
    return typeof width !== "number" || typeof height !== "number" ? unsized() : [{ type: "box", width, height, font }];
};

// The room between a text box's edges and its text when it doesn't say (`v:textbox`'s inset): 0.1 inch left and right,
// and 0.05 inch above and below
const TEXT_BOX_INSETS: Sides = { left: 7.2, top: 3.6, right: 7.2, bottom: 3.6 };
// What Word adds to the height of a text box sized to its text, besides its insets, and the room its outline takes in the
// line, across and down, in points (`word-vml.docx` VM1 to VM5): a box of one line of Calibri 11 is 271132 EMUs, 21.35
// points, and of three lines 612108, which is the lines, the insets and 0.72 points, and its line is 0.72 taller again,
// as a hidden one's, which Word draws no outline for, isn't (VM4)
const TEXT_BOX_FIT = 0.72;
const TEXT_BOX_OUTLINE = 0.72;

/**
 * Reads a text box in the line (docx's `Textbox`): its paragraphs, and the box they are in, which Word sizes to them, as
 * docx writes it to be (`mso-fit-shape-to-text`), whatever height it gives (`word-vml.docx` VM3). The bookmarks and fields
 * in it are where it is, in the paragraph it is in. Or why it can't be laid out: one Word doesn't size to its text, one
 * with insets of its own or an outline of another weight, which Word hasn't been seen with, and one with notes or lists
 * in it, which Word may number in an order not yet followed
 */
const readTextBox = (
    shape: VmlShape,
    width: number | string | undefined,
    font: TextFont,
    outlined: boolean,
    reader: Reader,
): readonly LayoutItem[] | string => {
    const attributes = attributesOf(shape.element[nameOf(shape.element)]);
    const textbox = find(childrenOf(shape.element[nameOf(shape.element)]), "v:textbox");
    const references = elementsIn(shape.text!, (name) => name === "w:footnoteReference" || name === "w:endnoteReference");
    const reason =
        typeof width !== "number"
            ? (width ?? "a VML drawing with no size")
            : shape.textStyle?.get("mso-fit-shape-to-text") !== "t"
              ? "a text box not sized to its text"
              : attributesOf(textbox).inset !== undefined
                ? "a text box with insets of its own"
                : attributes.strokeweight !== undefined
                  ? "a text box with an outline of its own"
                  : references.length > 0
                    ? "a footnote or endnote in a text box"
                    : undefined;
    if (reason !== undefined) {
        return reason;
    }
    const blocks = readBlocks(shape.text!, { ...reader, inTextBox: true });
    const unsupported =
        blocks.map(({ unsupported: why }) => why).find((why) => why !== undefined) ??
        (blocks.some((block) => block.type === "paragraph" && block.list !== undefined) ? "a list in a text box" : undefined);
    if (unsupported !== undefined) {
        return unsupported;
    }
    const outline = outlined ? TEXT_BOX_OUTLINE : 0;
    const { left, right, top, bottom } = TEXT_BOX_INSETS;
    const markers = markersIn(blocks).map((name) => ({ type: "marker" as const, name }));
    return [
        ...markers,
        {
            type: "textBox",
            width: (width as number) + outline,
            textWidth: (width as number) - left - right,
            room: top + bottom + TEXT_BOX_FIT + outline,
            blocks,
            font,
        },
    ];
};

// The wrapping of a drawing that text flows around, by its element
const WRAPS: Readonly<Record<string, FloatingDrawing["wrap"]>> = {
    "wp:wrapSquare": "square",
    "wp:wrapTight": "tight",
    "wp:wrapThrough": "through",
    "wp:wrapTopAndBottom": "topAndBottom",
};
const SIDES = new Set<string>(["bothSides", "left", "right", "largest"]);
// Shares of a width or height, such as `wp14:pctPosHOffset`, are in thousandths of a percent
const THOUSANDTHS_OF_A_PERCENT = 100000;

/** The text of an element, such as `wp:align`'s */
const textIn = (element: unknown): string =>
    (Array.isArray(element) ? element : [element])
        .filter((part) => typeof part === "string")
        .join("")
        .trim();

/**
 * An element of a drawing, or the one Word 2010 and later read in its place, in Word's choice of what is written for
 * which versions (`mc:AlternateContent`)
 */
const drawingPart = (children: readonly XmlObject[], name: string): unknown => {
    const alternate = find(children, "mc:AlternateContent");
    const choice = find(childrenOf(alternate), "mc:Choice");
    return find(children, name) ?? find(childrenOf(choice), name);
};

/**
 * Where a drawing is across or down the page (`wp:positionH`, `wp:positionV`). The schema requires an alignment or an
 * offset, so Word and docx write one: one with neither, which isn't a document they write, is read as at the start of
 * what it is placed against, as an offset of 0 places it
 */
const readPosition = (element: unknown, share: string): DrawingPosition => {
    const children = childrenOf(element);
    const from = String(attributesOf(element).relativeFrom ?? "");
    const percentage = numberOf(textIn(drawingPart(children, share)));
    if (percentage !== undefined) {
        return { from, share: percentage / THOUSANDTHS_OF_A_PERCENT };
    }
    const align = find(children, "wp:align");
    const alternate = find(childrenOf(find(children, "mc:AlternateContent")), "mc:Fallback");
    const offset = numberOf(textIn(find(children, "wp:posOffset") ?? find(childrenOf(alternate), "wp:posOffset")));
    return align === undefined ? { from, offset: (offset ?? 0) / EMUS_PER_POINT } : { from, align: textIn(align) };
};

/** A drawing's width or height as a share of what it is sized by (`wp14:sizeRelH`, `wp14:sizeRelV`) */
const readRelativeSize = (element: unknown, name: string): { readonly from: string; readonly share: number } | undefined => {
    const share = numberOf(textIn(find(childrenOf(element), name)));
    return element === undefined || share === undefined
        ? undefined
        : { from: String(attributesOf(element).relativeFrom), share: share / THOUSANDTHS_OF_A_PERCENT };
};

/** Reads a drawing that text flows around (`wp:anchor`), or why it can't be laid out */
const readFloating = (element: unknown): FloatingDrawing | string => {
    const children = childrenOf(element);
    const attributes = attributesOf(element);
    if (isOn(attributes.simplePos)) {
        // Word places it by its offsets, and its simple position is for other applications
        return "a drawing placed by its simple position";
    }
    const wrapName = Object.keys(WRAPS).find((name) => find(children, name) !== undefined);
    if (wrapName === undefined) {
        return "a drawing that text flows around in a way not yet followed";
    }
    const wrapElement = find(children, wrapName);
    const wrapAttributes = attributesOf(wrapElement);
    const side = String(wrapAttributes.wrapText ?? "bothSides");
    const horizontal = readPosition(find(children, "wp:positionH"), "wp14:pctPosHOffset");
    const vertical = readPosition(find(children, "wp:positionV"), "wp14:pctPosVOffset");
    const extent = attributesOf(find(children, "wp:extent"));
    const effect = attributesOf(find(children, "wp:effectExtent"));
    const points = (value: unknown): number => (numberOf(value) ?? 0) / EMUS_PER_POINT;
    // The distances its wrapping gives, and the anchor's where it gives none
    const distance = (name: string): number => points(wrapAttributes[name] ?? attributes[name]);
    return {
        wrap: WRAPS[wrapName],
        side: SIDES.has(side) ? (side as FloatingDrawing["side"]) : "bothSides",
        width: points(extent.cx),
        height: points(extent.cy),
        ...withoutUndefined({
            relativeWidth: readRelativeSize(drawingPart(children, "wp14:sizeRelH"), "wp14:pctWidth"),
            relativeHeight: readRelativeSize(drawingPart(children, "wp14:sizeRelV"), "wp14:pctHeight"),
        }),
        effects: { top: points(effect.t), bottom: points(effect.b), left: points(effect.l), right: points(effect.r) },
        distances: { top: distance("distT"), bottom: distance("distB"), left: distance("distL"), right: distance("distR") },
        horizontal,
        vertical,
        mayOverlap: attributes.allowOverlap === undefined || isOn(attributes.allowOverlap),
    };
};

/**
 * Reads a field character (`w:fldChar`). The result of a field that depends on the pages is worked out, rather than read,
 * and is nothing in hidden text, which takes no room, even where it couldn't be laid out. Why it can't be laid out, when
 * it can't.
 */
const readFieldCharacter = (element: XmlObject, format: RunFormat, reader: Reader, deleted = false): readonly LayoutItem[] | string => {
    const type = attributesOf(element["w:fldChar"])["w:fldCharType"];
    const { fields } = reader;
    const field = fields[fields.length - 1];
    if (type === "begin") {
        // eslint-disable-next-line functional/immutable-data
        fields.push({ instruction: "", inResult: false, replaced: false, ...(deleted ? { deleted } : {}) });
    } else if ((type === "separate" || type === "end") && field !== undefined && (field.deleted === true) !== deleted) {
        // Word shows nothing of a field deleted in a tracked change, start to end, but how it shows one only part of which
        // is deleted hasn't been seen
        return PARTLY_DELETED_FIELD;
    } else if (type === "end") {
        // eslint-disable-next-line functional/immutable-data
        fields.pop();
    } else if (type === "separate" && field) {
        const result = deleted ? undefined : workedOutResultOf(field.instruction, fontOf(format), reader);
        // eslint-disable-next-line functional/immutable-data
        field.inResult = true;
        if (typeof result === "string" && reader.guess === true && WRITTEN_GUESSES.has(result) && isShown(reader)) {
            // Guessing, its result is read as it is written
            return format.hidden ? [] : guessedOr(reader, result, () => []);
        }
        if (result !== undefined && isShown(reader)) {
            // eslint-disable-next-line functional/immutable-data
            field.replaced = true;
            return format.hidden ? [] : result;
        }
    }
    return [];
};

/**
 * Why a run's own formatting changes the room its text takes in a way not yet followed, when it does: text fitted to a
 * width (`w:fitText`), and two lines in one or text across in vertical text (`w:eastAsianLayout`).
 */
const unsupportedFormatOf = (properties: readonly XmlObject[]): string | undefined => {
    const { "w:combine": combined, "w:vert": across } = attributesOf(find(properties, "w:eastAsianLayout"));
    if (find(properties, "w:fitText") !== undefined) {
        return "text fitted to a width";
    }
    if (isOn(combined)) {
        return "two lines in one";
    }
    return isOn(across) ? "text across in vertical text" : undefined;
};

/**
 * Reads a run (`w:r`) in the paragraph's formatting, as its character style and its own formatting change it, and when it
 * is deleted (`removed`), as Word sizes a table's columns by it.
 */
const readRun = (element: XmlObject, paragraphRun: RunFormat, reader: Reader, removed = false): readonly LayoutItem[] | string => {
    const { styles } = reader;
    const children = contentOf(element).filter(isObject);
    const properties = find(children, "w:rPr");
    const characterStyle = valueOf(childrenOf(properties), "w:rStyle") ?? styles.defaultCharacterStyle;
    const format = combine([
        paragraphRun,
        ...styleChain(styles, characterStyle, "character").map(({ run }) => run),
        readRunFormat(properties, styles.themeFonts),
    ]);
    const font = fontOf(format);
    const unsupportedFormat = unsupportedFormatOf(childrenOf(properties)) ?? (format.hidden ? undefined : unknownRunFormatting(format));
    // Whether what is shown of the run is read past its formatting, with a guess
    let formatGuessed = false;
    const items: readonly (readonly LayoutItem[] | string)[] = children.map((child): readonly LayoutItem[] | string => {
        const name = nameOf(child);
        if (name === "w:fldChar") {
            return readFieldCharacter(child, format, removed ? uncounted(reader) : reader);
        }
        const field = reader.fields[reader.fields.length - 1];
        if (name === "w:instrText" || name === "w:delInstrText") {
            if (field && !field.inResult) {
                // eslint-disable-next-line functional/immutable-data
                field.instruction += contentOf(child)
                    .filter((part) => typeof part === "string")
                    .join("");
            }
            return [];
        }
        if (!isShown(reader) || name === "w:rPr") {
            return [];
        }
        // What isn't deleted of the result of a field whose start is
        if (reader.fields.some((open) => open.deleted === true)) {
            return PARTLY_DELETED_FIELD;
        }
        if (removed && (REMOVED_ROOM.has(name) || REMOVED_NOTES.has(name))) {
            return SIZED_REMOVAL;
        }
        if (unsupportedFormat !== undefined) {
            // Read to be laid out with a guess, the run is read as if it weren't formatted so
            if (!reader.guess) {
                return unsupportedFormat;
            }
            formatGuessed = true;
        }
        switch (name) {
            case "w:t":
            case "w:delText": {
                // A tab in the text is a tab, as Word lays it out, which is how docx writes those in a TextRun's text
                const content = contentOf(child)
                    .filter((part) => typeof part === "string")
                    .join("");
                const read = (): readonly LayoutItem[] =>
                    content.split("\t").flatMap((part, index): readonly LayoutItem[] => [
                        ...(index > 0 && !format.hidden ? [{ type: "tab" as const, font }] : []),
                        ...(part.length === 0 ? [] : spansOf(part, format)).map(({ text, ...spanFont }) => ({
                            type: "text" as const,
                            text,
                            font: spanFont,
                            // Where its lines break depends on its language, and whether its run is East Asian
                            ...(format.eastAsianLanguage === undefined ? {} : { language: format.eastAsianLanguage }),
                            ...(isEastAsianRun(format) ? { eastAsian: true } : {}),
                            ...hyphenationOf(format),
                        })),
                    ]);
                // Whether a box goes on round a tab, or ends before it, isn't known. Guessing, it goes on
                return font.border && !format.hidden && content.includes("\t") ? guessedOr(reader, TAB_IN_BORDER, read) : read();
            }
            case "w:tab":
            case "w:ptab":
                return format.hidden
                    ? []
                    : font.border
                      ? guessedOr(reader, TAB_IN_BORDER, () => [{ type: "tab", font }])
                      : [{ type: "tab", font }];
            case "w:br": {
                // A page break in hidden text breaks nothing (`word-hidden-paragraphs.docx` HP4a, HP4b)
                const kind = attributesOf(child["w:br"])["w:type"];
                return format.hidden ? [] : [{ type: "break", kind: kind === "page" || kind === "column" ? kind : "line", font }];
            }
            case "w:cr":
                return format.hidden ? [] : [{ type: "break", kind: "line", font }];
            case "w:noBreakHyphen":
                return format.hidden ? [] : [{ type: "text", text: "\u2011", font }];
            case "w:softHyphen":
                // Where a word may break, with a hyphen drawn there (`word-watertight-text.docx` TX10a). Whether a box goes
                // on round its hyphen, and whether Word sizes a table's columns by the parts of a word between them, hasn't
                // been seen
                return format.hidden
                    ? []
                    : font.border
                      ? guessedOr(reader, "a soft hyphen in text with a border", () => [{ type: "softHyphen", font }])
                      : reader.inSizedTable
                        ? guessedOr(reader, "a soft hyphen in a table whose columns Word sizes to their text", () => [
                              { type: "softHyphen", font },
                          ])
                        : [{ type: "softHyphen", font }];
            case "w:sym": {
                // A symbol is a character of its own font: most often a symbol font's own, such as Wingdings' tick, F0FC,
                // whose width isn't known, so the layout stops there, as it does at other characters it can't measure. Its
                // character is four hexadecimal digits (ST_ShortHexNumber); docx writes what it is given, so a symbol written
                // otherwise, which Word may not read, stops the layout too
                const { "w:font": symbolFont, "w:char": character } = attributesOf(child["w:sym"]);
                const code = String(character);
                if (format.hidden) {
                    return [];
                }
                return /^[0-9a-f]{4}$/i.test(code)
                    ? [
                          {
                              type: "text",
                              text: String.fromCodePoint(parseInt(code, 16)),
                              font: symbolFont === undefined ? font : { ...font, font: String(symbolFont) },
                          },
                      ]
                    : "a symbol whose character isn't four hexadecimal digits";
            }
            case "w:footnoteReference":
            case "w:endnoteReference": {
                /** The reference, with its note's number, unless a mark of its own follows it in its place */
                const reference = (numbered: boolean): readonly LayoutItem[] => {
                    const note = reader.notes?.read(
                        name === "w:footnoteReference" ? "footnote" : "endnote",
                        String(attributesOf(child[name])["w:id"]),
                    );
                    return note === undefined
                        ? []
                        : [
                              ...(note.marker ? [{ type: "marker" as const, name: note.marker }] : []),
                              ...(numbered ? [noteNumber(note.label, font)] : []),
                          ];
                };
                if (hasOwnMark(child)) {
                    // Guessing, a note with a mark of its own is numbered as the others are, with its mark in its number's
                    // place, and one in hidden text isn't laid out
                    return guessedOr(reader, OWN_NOTE_MARK, () => (format.hidden ? [] : reference(false)));
                }
                // Word doesn't lay out a note whose reference is hidden (`word-hidden-paragraphs.docx` HP4d, HP4e), but whether
                // it counts it in the numbers of the notes after it hasn't been seen
                return format.hidden ? "a footnote or endnote reference in hidden text" : reference(true);
            }
            case "w:footnoteRef":
            case "w:endnoteRef":
                return reader.noteNumber === undefined ? [] : [noteNumber(reader.noteNumber, font)];
            case "w:drawing":
                // A picture in hidden text takes no room (`word-hidden-paragraphs.docx` HP4c)
                return format.hidden
                    ? []
                    : font.border
                      ? guessedOr(reader, "a picture in text with a border", () => readDrawing(child, font, reader))
                      : readDrawing(child, font, reader);
            case "mc:AlternateContent": {
                // The drawing Word reads, rather than the one for older versions
                const choice = childrenOf(child["mc:AlternateContent"]).find((option) => "mc:Choice" in option);
                return choice && !format.hidden
                    ? readRun({ "w:r": [...childrenOf(choice["mc:Choice"])] }, paragraphRun, reader, removed)
                    : [];
            }
            case "w:pict":
                return format.hidden
                    ? []
                    : font.border
                      ? guessedOr(reader, "a picture in text with a border", () => readVml(child["w:pict"], font, reader))
                      : readVml(child["w:pict"], font, reader);
            case "w:object":
                // An object embedded in the document, such as a spreadsheet or an old equation, whose picture Word may draw at
                // a size other than its own, as it does a VML picture (`word-vml.docx` VM8), in a header or footer too, where it
                // takes room in the line
                return format.hidden ? [] : "an embedded object";
            case "w:dayShort":
            case "w:dayLong":
            case "w:monthShort":
            case "w:monthLong":
            case "w:yearShort":
            case "w:yearLong":
                // Word writes the date it opens the document on (`word-watertight-pages.docx` PG7b). A header's is read as it
                // is written, as nothing, as is one in hidden text, which takes no room, and guessing, any
                return reader.inHeader || format.hidden ? [] : guessedOr(reader, DATE_UNSUPPORTED, () => []);
            case "w:pgNum": {
                // The number of the page it is on, as a PAGE field writes it (PG7c). A header's is read as it is written
                if (reader.inHeader || format.hidden) {
                    return [];
                }
                const marker = fieldMarker(reader.markers);
                return [marker, { type: "pageNumber", field: marker.name, font }];
            }
            case "w:ruby":
                // Its text is in its base and in the guide above it, which makes the line taller. Guessing, its base alone
                return guessedOr(reader, "text with a phonetic guide", () =>
                    readInline(childrenOf(find(childrenOf(child["w:ruby"]), "w:rubyBase")), paragraphRun, reader, removed),
                );
            case "w:contentPart":
                return "a content part, such as ink";
            default:
                return [];
        }
    });
    return itemsOf(formatGuessed ? [[guessMarker(unsupportedFormat!)], ...items] : items, reader);
};

// Elements in a paragraph that hold runs and are read through
const RUN_CONTAINERS = new Set(["w:hyperlink", "w:ins", "w:moveTo", "w:smartTag", "w:customXml", "w:dir", "w:bdo", "w:sdtContent"]);
// Elements in a paragraph that hold runs deleted (`w:del`) or moved to elsewhere (`w:moveFrom`) in a tracked change
const REMOVALS = new Set(["w:del", "w:moveFrom"]);
// An element no document has, which stands in a paragraph's content for why the layout stops there, when the reason is
// found before the paragraph is read
const STOP = "docx-layout:unsupported";
// An element no document has, which stands in a paragraph joined to the one before by its hidden mark for the paragraph of
// the same list it was, whose number Word counts though it doesn't show it
const COUNTED = "docx-layout:counted";
// An element no document has, which stands in a paragraph with nothing shown and its mark hidden, which is read where it
// is, for its fields and number, and then left out, as it takes no room
const LEFT_OUT = "docx-layout:left-out";

/**
 * The items of the parts of a paragraph, or why it can't be laid out. Read to be laid out with a guess, a part that can't
 * be is left out, with the marker of why in its place
 */
const itemsOf = (parts: readonly (readonly LayoutItem[] | string)[], reader: Reader): readonly LayoutItem[] | string => {
    if (reader.guess) {
        return parts.flatMap((part) => (typeof part === "string" ? [guessMarker(part)] : part));
    }
    const unsupported = parts.find((part): part is string => typeof part === "string");
    return unsupported ?? parts.flatMap((part) => part as readonly LayoutItem[]);
};

/**
 * Reads what is deleted (`w:del`), or moved to elsewhere (`w:moveFrom`), in a tracked change: nothing, as Word shows it in
 * the markup area beside the page, and breaks the lines without it, pictures, tabs and breaks too (`word-watertight-markup.docx`
 * MK1, `word-tracked-changes.docx` MK10), but for its bookmarks. Word numbers a footnote whose reference is deleted, though
 * it doesn't show it (MK10e). A deleted endnote reference, and a note reference moved, haven't been seen.
 */
const readRemoved = (elements: readonly unknown[], kind: string, reader: Reader): readonly LayoutItem[] | string =>
    itemsOf(
        elements.filter(isObject).map((element): readonly LayoutItem[] | string => {
            const name = nameOf(element);
            if (name === "w:r") {
                const children = contentOf(element).filter(isObject);
                const references = children.filter((child) => REMOVED_NOTES.has(nameOf(child)));
                if (references.length > 0 && kind === "w:moveFrom") {
                    return "a note reference moved in a tracked change";
                }
                if (references.some((reference) => "w:endnoteReference" in reference)) {
                    return "a deleted endnote reference";
                }
                if (references.some(hasOwnMark)) {
                    return OWN_NOTE_MARK;
                }
                references.forEach(() => reader.notes?.skip("footnote"));
                // Its field characters, which keep the fields' places, so a field partly deleted is found
                return itemsOf(
                    children.map((child) => (nameOf(child) === "w:fldChar" ? readFieldCharacter(child, {}, reader, true) : [])),
                    reader,
                );
            }
            if (name === "w:bookmarkStart") {
                return markerOf(element);
            }
            if (name === "w:sdt") {
                return readRemoved(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), kind, reader);
            }
            return RUN_CONTAINERS.has(name) || REMOVALS.has(name) || name === "w:fldSimple"
                ? readRemoved(contentOf(element), kind, reader)
                : [];
        }),
        reader,
    );

// Why the layout stops at an equation that doesn't fit in the room left on its line, which Word breaks after an
// operator (`word-equations.docx` EQ5), in a way not yet followed
const EQUATION_BROKEN = "an equation that doesn't fit on its line";

/**
 * Reads an equation (`m:oMath`), or a paragraph of one (`m:oMathPara`), as Word lays out one of text: a box as wide as it
 * is, which takes room above and below the baseline as a line of Cambria Math does, in the size of its paragraph's text,
 * with its bookmarks before it. Word shows one alone in its paragraph on a line of its own, centred, which is as tall
 * (`word-equations.docx` EQ2c, EQ2d). Or why it can't be laid out: one of more than text (see {@link layOutEquation}), a
 * paragraph of more than one equation, and one in a document whose maths settings aren't followed (see
 * {@link readMathsSettings})
 */
const readEquation = (element: XmlObject, paragraphRun: RunFormat, reader: Reader): readonly LayoutItem[] | string => {
    if (reader.maths !== undefined) {
        return reader.maths;
    }
    const name = nameOf(element);
    const equations = name === "m:oMath" ? [element] : childrenOf(element[name]).filter((child) => "m:oMath" in child);
    if (equations.length !== 1) {
        return equations.length === 0 ? [] : "a paragraph of more than one equation";
    }
    const [equation] = equations;
    const box = layOutEquation(equation["m:oMath"], fontOf(paragraphRun).size ?? DEFAULT_FONT_SIZE);
    if (typeof box === "string") {
        return box;
    }
    const bookmarks = elementsIn(contentOf(equation), (inner) => inner === "w:bookmarkStart").flatMap((bookmark) => markerOf(bookmark));
    return [...bookmarks, { type: "box", width: box.width, height: box.ascent, descent: box.descent, unbroken: EQUATION_BROKEN }];
};

/**
 * Whether a paragraph's content has an equation displayed (`m:oMathPara`) that the reader reads: one among it, or in what
 * its text is in, such as a hyperlink, but not one in its runs' text boxes, nor one deleted or moved elsewhere in a tracked
 * change, unless deleted text is read as text (see {@link readInline})
 */
const isDisplayedIn = (elements: readonly unknown[], reader: Reader): boolean =>
    elements.filter(isObject).some((element) => {
        const name = nameOf(element);
        const read = name !== "w:r" && name !== "_attr" && (reader.showDeleted === true || !REMOVALS.has(name));
        return name === "m:oMathPara" || (read && isDisplayedIn(contentOf(element), reader));
    });

/**
 * A paragraph's content, as read, or why it can't be laid out for the equations in it. Word shows an equation in a line of
 * text in the line, and one alone in its paragraph displayed, on a line of its own (`word-equations.docx` EQ2). One in
 * `m:oMathPara`, which is displayed, beside text in its paragraph, more than one alone in a paragraph, and one alone after
 * its list's number haven't been seen.
 */
const withEquations = (
    elements: readonly unknown[],
    read: readonly LayoutItem[] | string,
    numbered: boolean,
    reader: Reader,
): readonly LayoutItem[] | string => {
    if (typeof read === "string") {
        return read;
    }
    const shown = read.filter((item) => item.type !== "marker");
    // The equations read, which are the boxes that stop where they don't fit on their line
    const equations = shown.filter((item) => item.type === "box" && item.unbroken === EQUATION_BROKEN).length;
    if (equations === 0) {
        return read;
    }
    const reason =
        shown.length > equations && isDisplayedIn(elements, reader)
            ? "an equation displayed (`m:oMathPara`) beside text in its paragraph"
            : shown.length === equations && (equations > 1 || numbered)
              ? "an equation alone in its paragraph beside another, or after its list's number"
              : undefined;
    return reason === undefined ? read : guessedOr(reader, reason, () => read);
};

/**
 * Reads the content of a paragraph, or of an element in it, such as a hyperlink, and when it is deleted (`removed`), as
 * Word sizes a table's columns by it.
 */
const readInline = (
    elements: readonly unknown[],
    paragraphRun: RunFormat,
    reader: Reader,
    removed = false,
): readonly LayoutItem[] | string =>
    itemsOf(
        elements.filter(isObject).map((element): readonly LayoutItem[] | string => {
            const name = nameOf(element);
            if (name === "w:r") {
                return readRun(element, paragraphRun, reader, removed);
            }
            if (REMOVALS.has(name)) {
                return reader.showDeleted
                    ? readInline(contentOf(element), paragraphRun, reader, true)
                    : readRemoved(contentOf(element), name, reader);
            }
            if (RUN_CONTAINERS.has(name)) {
                return readInline(contentOf(element), paragraphRun, reader, removed);
            }
            if (name === "w:sdt") {
                // Guessing, what is written in one bound to custom XML is read as it is
                const written = (): readonly LayoutItem[] | string =>
                    readInline(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), paragraphRun, reader, removed);
                return isBound(element) ? guessedOr(reader, BOUND_CONTROL, written) : written();
            }
            if (name === "w:fldSimple") {
                const result = workedOutResultOf(
                    String(attributesOf(element[name])["w:instr"]),
                    fontOf(paragraphRun),
                    removed ? uncounted(reader) : reader,
                );
                if (result === undefined || !isShown(reader)) {
                    return readInline(contentOf(element), paragraphRun, reader, removed);
                }
                if (typeof result === "string" && reader.guess === true && WRITTEN_GUESSES.has(result)) {
                    // Guessing, its result is read as it is written
                    return paragraphRun.hidden
                        ? []
                        : guessedOr(reader, result, () => readInline(contentOf(element), paragraphRun, reader, removed));
                }
                return paragraphRun.hidden ? [] : result;
            }
            if (name === "w:bookmarkStart") {
                return markerOf(element);
            }
            if (name === "w:subDoc") {
                return "a subdocument";
            }
            if (name === STOP) {
                return String(element[name]);
            }
            return name === "m:oMath" || name === "m:oMathPara" ? readEquation(element, paragraphRun, reader) : [];
        }),
        reader,
    );

/**
 * The number of a paragraph in a list, and what follows it, as its list's level writes it, and its number as a chapter
 * number. A paragraph is in the list it gives, or else in its style's. The list's numbers move on.
 */
const readListNumber = (
    properties: readonly XmlObject[],
    style: string | undefined,
    markRun: RunFormat,
    reader: Reader,
): {
    readonly items: readonly LayoutItem[];
    readonly level?: NumberingLevel;
    /** Whether it is in its style's list, or in one it gives itself, and its number as a chapter number, when it has one */
    readonly from?: "style" | "paragraph";
    readonly chapter?: string;
    readonly list?: ParagraphBlock["list"];
    /** How its number lines up at the start of its first line, when not to the left */
    readonly alignment?: "center" | "right";
    /** Why its number isn't written or placed as Word does, when it isn't */
    readonly unsupported?: string;
} => {
    const numbering = childrenOf(find(properties, "w:numPr"));
    const ownId = valueOf(numbering, "w:numId") ?? numberOf(attributesOf(find(numbering, "w:numId"))["w:val"])?.toString();
    const ownLevel = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
    // The list and level each from the nearest style that gives it, as a style based on another takes what it doesn't give
    const fromStyle = styleChain(reader.styles, style, "paragraph").reduce<{ readonly id?: string; readonly level?: number }>(
        (inherited, { numbering: given }) => ({ ...inherited, ...given }),
        {},
    );
    const id = ownId ?? fromStyle.id ?? "";
    const list = reader.numbering.get(id);
    if (list?.unsupported !== undefined) {
        return { items: [], unsupported: list.unsupported };
    }
    const levels = list?.levels;
    // A style's list numbers it at the level it gives, or else at the level that is for it
    const linked = levels?.findIndex((other) => other?.style !== undefined && other.style === style) ?? -1;
    const index = ownLevel ?? (ownId === undefined ? fromStyle.level : undefined) ?? Math.max(linked, 0);
    const level = levels?.[index];
    if (!list || !levels || !level) {
        return { items: [] };
    }
    const current = countIn(reader.counters, id, list, index);
    const { started } = reader.counters.get(list.definition)!;
    // A level not counted yet shows its first number: 1.1 and 3.1 for a list's first paragraph at level 1, whose level 0
    // starts at 1 and 3 (scripts/layout-probes/word-lists.ts LR4). A legal level writes every level's number in decimal
    // (LR3)
    const numberAt = (at: number): string | undefined => {
        const other = levels[at];
        return other && formatNumber(current[at] ?? other.start, level.legal ? "decimal" : other.format);
    };
    const referred = [...level.text.matchAll(/%([1-9])/g)].map(([, digit]) => Number(digit) - 1);
    // Whether a level not counted yet would show its first number or the list's own for it isn't known
    const ownStart = (at: number): boolean =>
        current[at] === undefined && !started.includes(`${id} ${at}`) && (list.starts.get(at) ?? levels[at]!.start) !== levels[at]!.start;
    // The number is in the formatting of its paragraph's mark, but for what its level gives it: in the mark's 20 points
    // or Courier New, or bold, beside text that isn't, and not bold beside bold text, and in its level's 8 points beside a
    // mark of 20 (LF1 to LF6)
    const font = fontOf(combine([markRun, level.run]));
    const unsupported =
        level.unsupported ??
        (referred.some((at) => levels[at] === undefined)
            ? "a list number of a level its list doesn't have"
            : referred.some((at) => numberAt(at) === undefined)
              ? "a list number in a format not yet written"
              : referred.some(ownStart)
                ? "a list number of a level not counted yet, which its list starts at a number of its own"
                : level.alignment === "center" && level.suffix === "space"
                  ? "a centred list number followed by a space"
                  : font.border !== undefined || font.emphasis !== undefined || (font.raise ?? 0) !== 0
                    ? "a list number with a border or emphasis marks, or raised or lowered"
                    : undefined);
    const text = level.text.replace(/%([1-9])/g, (_, digit: string) => numberAt(Number(digit) - 1) ?? "");
    // As a chapter number, Word writes the level's text from its first number to its last, so "Chapter %1" is 1 and
    // "%1.%2" is 1.2
    const numbers = /%[1-9](?:.*%[1-9])?/.exec(level.text)?.[0];
    // Word draws the space or tab after the number in Arial, and the space is as wide as Arial's: a right-aligned number
    // followed by a space in Calibri 11 ends 60.6 twips before the text (LJ4)
    const separator: TextFont = { ...font, listNumber: "separator" };
    const suffix: readonly LayoutItem[] =
        level.suffix === "nothing"
            ? []
            : level.suffix === "space"
              ? [{ type: "text", text: " ", font: { ...separator, font: "Arial" } }]
              : [{ type: "tab", font: separator }];
    return {
        items: [...(text.length > 0 ? [{ type: "text" as const, text, font: { ...font, listNumber: "number" as const } }] : []), ...suffix],
        level,
        from: ownId === undefined ? "style" : "paragraph",
        list: { id: reader.listIds.get(id) ?? id, level: index, definition: list.shared },
        ...withoutUndefined({
            chapter: numbers?.replace(/%([1-9])/g, (_, digit: string) => numberAt(Number(digit) - 1) ?? ""),
            alignment: text.length > 0 ? level.alignment : undefined,
            unsupported,
        }),
    };
};

/**
 * Counts a paragraph of a list at a level, and gives the numbers its levels are at with it. Lists made from the same
 * definition count on from one another, as Word counts them: two lists' paragraphs, one after the other, are numbered 1
 * to 5 (scripts/layout-probes/word-lists.ts LO1, LO9). A list's own first number for a level starts that level there, at
 * the list's first paragraph of that level, once: between the paragraphs of a list made from the same definition, a list
 * that starts at 1 goes 1, 2, then the other list goes on with 3 and 4, and the first list with 5 (LO2, LO3, LO5, LO6).
 * A level starts again at its first number after a level above it, or after the level it gives (`w:lvlRestart`), or never,
 * as the schema has it (LR1, LR2).
 */
const countIn = (
    // eslint-disable-next-line functional/prefer-readonly-type
    counters: Map<string, ListCount>,
    id: string,
    { levels, starts, definition }: NumberingList,
    index: number,
): readonly (number | undefined)[] => {
    const { numbers, started } = counters.get(definition) ?? { numbers: [], started: [] };
    const level = levels[index];
    const own = starts.get(index);
    const starting = own !== undefined && !started.includes(`${id} ${index}`);
    const current = Array.from({ length: Math.max(numbers.length, index + 1) }, (_, at): number | undefined => {
        if (at < index) {
            return numbers[at];
        }
        if (at === index) {
            return starting ? own : (numbers[at] ?? level.start - 1) + 1;
        }
        // A level below starts again unless it starts again only after a level below this one, or never
        const restart = levels[at]?.restart;
        return restart !== undefined && restart <= at && restart <= index ? numbers[at] : undefined;
    });
    // eslint-disable-next-line functional/immutable-data
    counters.set(definition, { numbers: current, started: starting ? [...started, `${id} ${index}`] : started });
    return current;
};

// Letters of Thai and Arabic, which their justifications are for
const THAI_OR_ARABIC = /[\p{Script=Thai}\p{Script=Arabic}]/u;

// A line of space before or after a paragraph, in `w:beforeLines` and `w:afterLines`, is 12 points whatever the font: 100
// is 240 twips in Calibri 11, whose lines are 268.55 (`word-watertight-text.docx` TX7d)
const POINTS_PER_LINE = 12;
// Lines and characters are given in hundredths
const HUNDREDTHS = 100;

/**
 * How long a line of space before or after a paragraph is, and what a character of an indent is: the text's size and the
 * space after each, or a cell
 */
type Units = { readonly line: number; readonly characterSpace: number; readonly characterPitch?: number };

/**
 * The units of a paragraph's space in lines and indents in characters: 12 points and the text's size, or on a document
 * grid, its lines and characters. A line of space is a line of the grid, 360 twips on one of 360 and 312 on one of 312,
 * in a paragraph that isn't on the grid's lines too, and in a table cell, whose lines aren't on them (scripts/layout-probes/
 * word-grid.ts G6, word-grid3.ts H10, H11), and a character is the text's size and the space a grid of lines and
 * characters adds after each, or a cell of one that snaps to characters (word-grid.ts CA6, CB6, CC6, CD6)
 */
const unitsOf = ({ linePitch, characterSpace = 0, characterPitch }: TextGrid = {}): Units => ({
    line: linePitch ?? POINTS_PER_LINE,
    characterSpace,
    ...(characterPitch === undefined ? {} : { characterPitch }),
});

/**
 * A paragraph's formatting with its space in lines and its indents in characters in points, as Word takes them in place
 * of those in points when they aren't 0 (`word-paragraph-formats.docx` C7, C10, L2). A character is as wide as text is
 * tall: a first line or hanging indent's as the paragraph's first character, 2 of them 440 twips at 11 points and 800 at
 * 20, whatever the size of its mark or its other text (`word-watertight-text.docx` TX7a, TX7b, C5, C6, C12), and a left
 * indent's as its mark, 4 of them 880 beside 20-point text (C11). A hanging indent in characters puts the first line at
 * the left indent and the other lines that much further in, and the left indent is in characters then, 0 when it isn't
 * given: 2 characters hanging put the first line at 0 and the others at 440, with a left indent of 1440 twips or none
 * (TX7c, C3, C9). It says why when Word's way with them isn't known.
 */
const inPoints = (
    format: ParagraphFormat,
    { listNumber, items }: { readonly listNumber: readonly LayoutItem[]; readonly items: readonly LayoutItem[] },
    markFont: TextFont,
    styleFont: TextFont,
    { line, characterSpace, characterPitch }: Units = unitsOf(),
): ParagraphFormat | string => {
    const { spaceBeforeLines, spaceAfterLines, indentLeftChars, indentRightChars = 0, firstLineChars = 0 } = format;
    const lines = (count: number | undefined, points: number | undefined): number | undefined =>
        count ? (count / HUNDREDTHS) * line : points;
    const spaced = withoutUndefined({
        ...format,
        spaceBefore: lines(spaceBeforeLines, format.spaceBefore),
        spaceAfter: lines(spaceAfterLines, format.spaceAfter),
    });
    const leftChars = indentLeftChars ?? 0;
    if (leftChars === 0 && indentRightChars === 0 && firstLineChars === 0) {
        return spaced;
    }
    const sizeOf = (font: TextFont): number => font.size ?? DEFAULT_FONT_SIZE;
    const textOf = (from: readonly LayoutItem[]): readonly TextFont[] =>
        from.flatMap((item) =>
            (item.type === "text" && item.text.length > 0) || item.type === "pageReference" || item.type === "pageCount" ? [item.font] : [],
        );
    // The first character's size, which first line and hanging indents are in, and the mark's, which left and right
    // indents are in. Which of the mark's and its style's it is, and which the first character is of a list's number and
    // its text, isn't known where they differ, nor whether a right indent is in the mark's or the text's
    const first = sizeOf(textOf(items)[0] ?? markFont);
    const mark = sizeOf(markFont);
    if (firstLineChars !== 0 && textOf(listNumber).some((font) => sizeOf(font) !== first)) {
        return "an indent in characters in a list whose number is another size than its text";
    }
    if ((leftChars !== 0 || indentRightChars !== 0) && mark !== sizeOf(styleFont)) {
        return "an indent in characters left or right of a paragraph whose mark is another size than its style";
    }
    if (indentRightChars !== 0 && first !== mark) {
        return "an indent in characters right of text of another size than its mark";
    }
    const characters = (count: number, size: number): number => (count / HUNDREDTHS) * (characterPitch ?? size + characterSpace);
    const right = indentRightChars === 0 ? {} : { indentRight: characters(indentRightChars, mark) };
    if (firstLineChars < 0) {
        if (indentLeftChars === 0 && (format.indentLeft ?? 0) !== 0) {
            return "an indent in characters hanging from a left indent in twips";
        }
        return {
            ...spaced,
            ...right,
            indentLeft: characters(leftChars, mark) - characters(firstLineChars, first),
            firstLineIndent: characters(firstLineChars, first),
        };
    }
    if (leftChars !== 0 && firstLineChars === 0 && (format.firstLineIndent ?? 0) !== 0) {
        return "an indent in characters left of a first line indent in twips";
    }
    return {
        ...spaced,
        ...right,
        ...(leftChars === 0 ? {} : { indentLeft: characters(leftChars, mark) }),
        ...(firstLineChars === 0 ? {} : { firstLineIndent: characters(firstLineChars, first) }),
    };
};

// The styles of a border that draw none
const NO_BORDER = new Set(["none", "nil"]);

/**
 * The room a border of a paragraph takes, in points: its width and the space between it and the text, or why it isn't
 * known. A shadow doubles a single line (B6)
 */
const borderRoom = (border: ParagraphBorder | undefined): number | string => {
    if (border === undefined || NO_BORDER.has(border.style)) {
        return 0;
    }
    const style = BORDER_WIDTHS[border.style];
    if (style === undefined || border.frame || (border.shadow && border.style !== "single")) {
        return "a paragraph border of a style not yet followed";
    }
    const width =
        border.size === undefined || border.size < NARROWEST_BORDER || border.size > WIDEST_BORDER || border.space > FURTHEST_BORDER
            ? undefined
            : style(border.size);
    return width === undefined
        ? "a paragraph border of a width or space not yet followed"
        : ((border.shadow ? 2 : 1) * width) / EIGHTHS_PER_POINT + border.space;
};

/**
 * The room a paragraph's borders take above and below its lines, or why it isn't known. Left and right borders take
 * none, and leave the lines as wide as they are without them (`word-watertight-text.docx` TX5f). Word puts paragraphs
 * with the same borders and the same left and right indents in one box, whatever their first line indents, spacing and
 * alignment, and those with borders of other colours or at their sides, or other indents, in boxes of their own
 * (`word-paragraph-formats.docx` B5).
 */
const readBorders = (format: ParagraphFormat): ParagraphBorders | string | undefined => {
    const { borderTop, borderBottom, borderBetween } = format;
    const rooms = [borderTop, borderBottom, borderBetween].map(borderRoom);
    const unknown = rooms.find((room): room is string => typeof room === "string");
    if (unknown !== undefined) {
        return unknown;
    }
    const [top, bottom, between] = rooms as readonly number[];
    if (top === 0 && bottom === 0 && between === 0) {
        return undefined;
    }
    const keyOf = (border: ParagraphBorder | undefined): string => (border === undefined || NO_BORDER.has(border.style) ? "" : border.key);
    const outline = [borderTop, borderBottom, format.borderLeft, format.borderRight, format.borderBar].map(keyOf);
    const indents = [format.indentLeft ?? 0, format.indentRight ?? 0];
    return {
        top,
        bottom,
        between,
        betweenSpace: between > 0 ? borderBetween!.space : 0,
        box: JSON.stringify([...outline, keyOf(borderBetween), ...indents]),
        outline: JSON.stringify([...outline, ...indents]),
    };
};

/**
 * The paragraph and run formatting a table's style gives the paragraphs of one of its cells: its own and its base styles',
 * then those of the parts of it for the cell, such as its first row's, each over those before.
 */
type TableFormats = readonly { readonly run: RunFormat; readonly paragraph: ParagraphFormat }[];

// Half-width katakana, Hangul and symbols, which Word may turn or stand up down the page
const HALF_WIDTH = /[\uff61-\uffdc]/u;

/**
 * Why a paragraph of text that runs down the page can't be laid out yet, when it can't: Word's PDFs showed lines of
 * ideographs, kana and punctuation in fonts whose characters are all an em, each an em down the line, and Latin text on
 * its side, as wide as it is across a page (scripts/layout-probes/word-vertical.ts V1, V4), but not the rest
 */
const unknownDownOf = (
    items: readonly LayoutItem[],
    format: ParagraphFormat,
    borders: ParagraphBorders | string | undefined,
): string | undefined => {
    const texts = items.flatMap((item) => (item.type === "text" ? [item] : []));
    if (items.some((item) => item.type === "tab" || item.type === "box" || item.type === "softHyphen" || item.type === "drawing")) {
        return "a tab, soft hyphen, picture or drawing in text that runs down the page";
    }
    if (
        texts.some(
            ({ text, font }) =>
                HALF_WIDTH.test(text) ||
                (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text) &&
                    !isMonospacedEastAsianFont(font.font)),
        )
    ) {
        return "East Asian text down the page in a font whose characters aren't all an em, or half-width";
    }
    if (
        texts.some(
            ({ font }) =>
                font.border !== undefined || font.emphasis !== undefined || font.raise !== undefined || font.lineSize !== undefined,
        )
    ) {
        return "run formatting in text that runs down the page that Word hasn't been seen laying out";
    }
    if (borders !== undefined) {
        return "a paragraph border on text that runs down the page";
    }
    const spread = format.alignment === "justified" || format.alignment === "distributed";
    return spread && texts.some(({ text }) => / /.test(text)) ? "a justified line with spaces down the page" : undefined;
};

/**
 * The text frame a paragraph is in (`w:framePr`), its own or its style's, or why it can't be laid out: one in a table
 * cell, a footnote, an endnote, a header or a footer, one given by both the paragraph and its style differently, and one
 * with a note's reference in it, which aren't followed yet. Undefined when it isn't in one.
 */
const readFrameOf = (
    paragraph: XmlObject,
    properties: readonly XmlObject[],
    paragraphStyles: readonly { readonly frame?: unknown }[],
    reader: Reader,
): FrameProperties | string | undefined => {
    const own = find(properties, "w:framePr");
    const fromStyle = paragraphStyles.findLast((style) => style.frame !== undefined)?.frame;
    const element = own ?? fromStyle;
    if (element === undefined) {
        return undefined;
    }
    if (reader.inCell || reader.inNote || reader.inHeader || reader.inTextBox) {
        return "a text frame in a table cell, footnote, endnote, header, footer or text box";
    }
    const frame = readFrameProperties(element);
    if (typeof frame === "string") {
        return frame;
    }
    if (own !== undefined && fromStyle !== undefined) {
        const styled = readFrameProperties(fromStyle);
        if (typeof styled === "string" || styled.key !== frame.key) {
            return "a text frame given by both a paragraph and its style";
        }
    }
    const references = elementsIn(contentOf(paragraph), (name) => name === "w:footnoteReference" || name === "w:endnoteReference");
    return references.length > 0 ? "a footnote or endnote in a text frame" : frame;
};

/**
 * Reads a paragraph (`w:p`), in the formatting of its styles, and of its table's style when it is in a table.
 */
const readParagraph = (element: XmlObject, reader: Reader, tableFormats: TableFormats = []): ParagraphBlock => {
    const { styles } = reader;
    const children = contentOf(element);
    const properties = childrenOf(find(children.filter(isObject), "w:pPr"));
    const style = valueOf(properties, "w:pStyle") ?? styles.defaultParagraphStyle;
    const paragraphStyles = [...tableFormats, ...styleChain(styles, style, "paragraph")];
    const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);
    const markRun = combine([paragraphRun, readRunFormat(find(properties, "w:rPr"), styles.themeFonts)]);
    const list = readListNumber(properties, style, markRun, reader);
    // The number of each paragraph of the list joined to this one by its hidden mark is counted, but not shown: of three
    // numbered paragraphs, the first's mark hidden, Word numbers them 1 and 3 (`word-breaks-and-tabs.docx` HM4)
    children.filter((child) => isObject(child) && COUNTED in child).forEach(() => readListNumber(properties, style, markRun, reader));
    const headingLevel = /^heading ([1-9])$/i.exec(styleChain(styles, style, "paragraph").slice(-1)[0]?.name ?? "")?.[1];
    const formats = [
        styles.paragraph,
        ...paragraphStyles.map(({ paragraph }) => paragraph),
        ...(list.level ? [list.level.paragraph] : []),
        readParagraphFormat(properties),
    ];
    const read = withEquations(children, readInline(children, paragraphRun, reader), list.items.length > 0, reader);
    // Read to be laid out with a guess, the first thing the reader guessed at in the paragraph's content is why it can't be
    // laid out as Word does, and the markers of what it guessed at are left out of its items
    const guessed = typeof read === "string" ? undefined : read.map(guessOf).find((reason) => reason !== undefined);
    const items = typeof read === "string" ? read : read.filter((item) => guessOf(item) === undefined);
    const combined = combine(formats);
    const own = typeof items === "string" ? [] : items;
    const content = typeof items === "string" ? [] : [...list.items, ...items];
    const markFont = fontOf(markRun);
    // A paragraph's lines are on its section's grid unless it turns that off (`w:snapToGrid`), or is in a table cell, and
    // its characters on a grid of characters either way (scripts/layout-probes/word-grid.ts G7, G8, CA11, CC11,
    // word-grid3.ts H6)
    const { grid, cellGrid } = reader;
    const sectionGrid = grid ?? cellGrid;
    const paragraphGrid =
        sectionGrid &&
        withoutUndefined({
            linePitch: grid !== undefined && combined.snapToGrid !== false ? grid.linePitch : undefined,
            characterSpace: sectionGrid.characterSpace,
            characterPitch: sectionGrid.characterPitch,
        });
    const format = inPoints(combined, { listNumber: list.items, items: own }, markFont, fontOf(paragraphRun), unitsOf(sectionGrid));
    const borders = readBorders(typeof format === "string" ? combined : format);
    // A division of a web page (`w:divId`) has margins and borders of its own, in the document's web settings. Word breaks
    // the lines of Latin text justified for Thai or with a low kashida as justified ones, and those with a medium or high
    // kashida otherwise (`word-justify.docx` J14, `word-justify2.docx` K08, K09). Thai or Arabic text in them hasn't been
    // seen
    const forThaiOrArabic = combined.alignment === "thaiDistributed" || combined.alignment === "lowKashida";
    const tabStops = tabStopsOf(formats);
    // Word lined up the full stop of numbers at decimal stops (`word-watertight-text.docx` TX12a). Whether it lines up the
    // decimal symbol a document's settings give instead, or the computer's, hasn't been seen
    const otherDecimalSymbol =
        reader.decimalSymbol !== undefined && reader.decimalSymbol !== "." && tabStops.some(({ alignment }) => alignment === "decimal");
    // How Word lays out a grid that snaps to characters in footnotes, and over text spaced out by its run, isn't known
    const snapping = sectionGrid?.characterPitch !== undefined;
    const unknownOnGrid =
        snapping && reader.inNote === true
            ? "a footnote on a grid that snaps to characters"
            : snapping &&
                own.some((item) => item.type === "text" && (item.font.characterSpacing ?? 0) !== 0 && item.font.snapToGrid !== false)
              ? "text spaced out by its run on a grid that snaps to characters"
              : undefined;
    const frame = readFrameOf(element, properties, styleChain(styles, style, "paragraph"), reader);
    const unsupported =
        list.unsupported ??
        unknownOnGrid ??
        (reader.down === true && reader.inNote === true ? "a footnote or endnote on text that runs down the page" : undefined) ??
        (reader.down === true ? unknownDownOf(own, combined, borders) : undefined) ??
        (typeof frame === "string"
            ? frame
            : otherDecimalSymbol
              ? "a decimal tab stop in a document whose decimal symbol isn't a full stop"
              : find(properties, "w:divId") !== undefined
                ? "a paragraph in an HTML division"
                : combined.alignment === "mediumKashida" || combined.alignment === "highKashida"
                  ? "a paragraph justified for Arabic with a medium or high kashida"
                  : forThaiOrArabic &&
                      typeof items !== "string" &&
                      items.some((item) => item.type === "text" && THAI_OR_ARABIC.test(item.text))
                    ? "Thai or Arabic text justified for it"
                    : (unknownLengthIn(element) ??
                      (typeof format === "string" ? format : undefined) ??
                      (typeof borders === "string" ? borders : undefined)));
    return {
        type: "paragraph",
        items: content,
        format: typeof format === "string" ? combined : format,
        tabStops,
        markFont,
        // One that stops the layout is kept, for it to stop at
        ...(unsupported === undefined && typeof items !== "string" && children.some((child) => isObject(child) && LEFT_OUT in child)
            ? { hidden: true }
            : {}),
        ...(list.list ? { list: list.list } : {}),
        ...(list.alignment ? { numberAlignment: list.alignment } : {}),
        ...(typeof borders === "object" ? { borders } : {}),
        ...(paragraphGrid !== undefined && Object.keys(paragraphGrid).length > 0 ? { grid: paragraphGrid } : {}),
        ...(typeof frame === "object" ? { frame } : {}),
        style,
        // Word's chapter numbers are the numbers headings' styles give them, and it passes over headings numbered on their
        // own, or not at all
        ...(headingLevel === undefined
            ? {}
            : {
                  heading: {
                      level: Number(headingLevel),
                      ...withoutUndefined({ chapter: list.from === "style" ? list.chapter : undefined }),
                  },
              }),
        ...(typeof items === "string" || guessed || unsupported
            ? { unsupported: typeof items === "string" ? items : (guessed ?? unsupported) }
            : {}),
    };
};

/**
 * Why a cell's properties (`w:tcPr`) change how its text is laid out in a way not yet followed, when they do: cells merged
 * across columns as the oldest versions of Word wrote them (`w:hMerge`), text that doesn't wrap (`w:noWrap`), text
 * fitted to the cell (`w:tcFitText`), and text that runs down the cell with its East Asian characters upright, or across
 * with them on their side (`w:textDirection` tbLrV, tbRlV and lrTbV).
 */
const unsupportedCellOf = (properties: readonly XmlObject[]): string | undefined => {
    if (find(properties, "w:hMerge") !== undefined) {
        return "cells merged across columns as old versions of Word wrote them";
    }
    if (onOff(properties, "w:noWrap") === true) {
        return "a table cell whose text doesn't wrap";
    }
    if (onOff(properties, "w:tcFitText") === true) {
        return "text fitted to its table cell";
    }
    const direction = valueOf(properties, "w:textDirection");
    return direction === undefined || HORIZONTAL.has(direction) || VERTICAL.has(direction)
        ? undefined
        : "text in a table cell in a direction not yet followed";
};

/**
 * Why text that runs up or down a cell makes its row taller in a way not yet followed, when it does. Word makes the row
 * as tall as a line of the cell's paragraph marks, whatever the text's size and the space around its paragraphs
 * (`word-table-formats.docx` VT1, VT2, `word-table-formats2.docx` VT5 to VT7). Which line, for marks of different fonts or
 * sizes, isn't known, nor what a picture or a table in it does.
 */
const unsupportedVerticalOf = (blocks: readonly Block[]): string | undefined => {
    const paragraphs = blocks.filter((block): block is ParagraphBlock => block.type === "paragraph");
    const marks = new Set(paragraphs.map(({ markFont: { font, size } }) => `${font} ${size}`));
    const other = paragraphs.length < blocks.length || paragraphs.some(({ items }) => items.some(({ type }) => type === "box"));
    return marks.size > 1 || other ? "text running up or down a table cell with marks of different sizes, a picture or a table" : undefined;
};

// The directions of text in a cell (`w:textDirection`) across it, as transitional and strict documents write them, and
// those that run up and down it
const HORIZONTAL = new Set(["lrTb", "tb"]);
// The directions of a section's text that run across the page, as the section's text does without one: from the left,
// and from the left with East Asian characters on their side (scripts/layout-probes/word-vertical.ts V9, V12)
const HORIZONTAL_PAGES = new Set(["lrTb", "tb", "lrTbV", "tbV"]);
// Those that run down it, with its lines across it from the right, as Word lays out `tbRl` and `btLr`, and from the left,
// as it lays out `tbRlV` and `tbLrV` (V1, V8, V10, V11), as transitional and strict documents write them
const DOWN_FROM_RIGHT = new Set(["tbRl", "btLr", "rl", "lr"]);
const DOWN_FROM_LEFT = new Set(["tbRlV", "tbLrV", "rlV", "lrV"]);

/** Whether a section's text runs down the page (`w:textDirection`), from the right or the left. Undefined across it */
const downOf = (properties: readonly XmlObject[]): "fromRight" | "fromLeft" | undefined => {
    const direction = valueOf(properties, "w:textDirection") ?? "";
    return DOWN_FROM_RIGHT.has(direction) ? "fromRight" : DOWN_FROM_LEFT.has(direction) ? "fromLeft" : undefined;
};
const VERTICAL = new Set(["btLr", "tbRl", "lr", "rl"]);

/** A share of a width, as a fraction, from fiftieths of a percent or a percentage written with a % */
const shareOf = (value: unknown): number | undefined => {
    const amount = numberOf(value);
    if (amount === undefined) {
        return undefined;
    }
    return typeof value === "string" && value.trim().endsWith("%") ? amount / 100 : amount / FIFTIETHS_OF_A_PERCENT;
};

/** A table's own width (`w:tblW`): in points, or as a share of the width it is in. Neither when it is sized to its content */
const readTableWidth = (properties: readonly XmlObject[]): NonNullable<TableBlock["fit"]> => {
    const { "w:w": value, "w:type": type = "dxa" } = attributesOf(find(properties, "w:tblW"));
    const width = type === "dxa" ? twips(value) : undefined;
    const share = type === "pct" ? shareOf(value) : undefined;
    return {
        ...(width !== undefined && width > 0 ? { width } : {}),
        ...(share !== undefined && share > 0 ? { share } : {}),
    };
};

// Table, row and cell properties that don't change how a table's text is laid out, or that are read with the table's
// own: its style, shading, alignment, the parts of its style it shows, what describes it, and changes to it
const LAID_OUT_ALIKE = new Set([
    "w:tblStyle",
    "w:shd",
    "w:jc",
    "w:vAlign",
    "w:cnfStyle",
    "w:hidden",
    "w:headers",
    "w:tblLook",
    "w:tblStyleRowBandSize",
    "w:tblStyleColBandSize",
    "w:tblCaption",
    "w:tblDescription",
    "w:tblPrChange",
    "w:trPrChange",
    "w:tcPrChange",
    "w:tblPrExChange",
]);

/** Whether table, row or cell properties change how its text is laid out, beyond those that don't or are read */
const changesLines = (properties: readonly XmlObject[], read: ReadonlySet<string> = new Set()): boolean =>
    properties.some((property) => !LAID_OUT_ALIKE.has(nameOf(property)) && !read.has(nameOf(property)));

// The cell properties of a part of a table style for some of its cells that are followed: its borders and margins, which
// Word applies as the cell's own (word-table-formats.docx CF8, CF9)
const FOLLOWED_CELL_PROPERTIES = new Set(["w:tcBorders", "w:tcMar"]);

/** The last of a property given among properties, each over those before: those of a table's styles, then its own */
const lastOf = (properties: readonly (readonly XmlObject[])[], name: string): unknown =>
    properties.reduce<unknown>((found, given) => find(given, name) ?? found, undefined);

// Which parts of its style Word turns on for a table that doesn't say: its first row and column and its bands of rows, as
// it turns on in the tables it makes (word-table-formats.docx CF2, word-table-formats2.docx CF14)
const UNSAID_LOOK: TableLook = { firstRow: true, lastRow: false, firstColumn: true, lastColumn: false, rowBands: true, columnBands: false };

/** A cell as it is read, before the room around its text, from its borders and the space between cells, is worked out */
type ReadCell = TableCell & { readonly borders: BorderSet; readonly margins: Margins; readonly gridWidth: number };

/** Whether an element has any of these elements in it, at any depth */
const hasAnyOf = (element: unknown, names: ReadonlySet<string>): boolean =>
    Array.isArray(element)
        ? element.some((child) => hasAnyOf(child, names))
        : isObject(element) &&
          Object.entries(element).some(([name, value]) => names.has(name) || (name !== "_attr" && hasAnyOf(value, names)));

/**
 * A reader of what Word sizes a table's columns by: deleted text as text, unless `showDeleted` is false, with the notes and
 * lists numbered as they would be, but left for the reader it is made from to read and count.
 */
const sizingReaderOf = (reader: Reader, showDeleted = true, counted = false): Reader => ({
    ...(counted ? reader : uncounted(reader)),
    ...(reader.notes ? { notes: reader.notes.preview() } : {}),
    fields: [],
    counters: new Map(reader.counters),
    showDeleted,
});

/** The names of the bookmarks that start in blocks, in order: in their paragraphs, and their tables' cells */
const markersIn = (blocks: readonly Block[]): readonly string[] =>
    blocks.flatMap((block) =>
        block.type === "paragraph"
            ? block.items.flatMap((item) => (item.type === "marker" ? [item.name] : []))
            : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => markersIn(cell.blocks))),
    );

/** Whether blocks have anything in them that takes room */
const hasContent = (blocks: readonly Block[]): boolean =>
    blocks.some((block) => block.type === "table" || block.items.some((item) => item.type !== "marker"));

/**
 * The room around the rows of a table without space between its cells, laid out without its deleted rows, from the room
 * around those rows as though the deleted ones weren't there (`kept`), and around all its rows (`all`). Where deleted
 * rows are, Word draws one border between the rows around them, a deleted row's own too, so where the borders above,
 * between and below them all take the same room, the rows around them have that room between them, whatever their own
 * borders (`word-tracked-tables.docx` MK14a to MK14g). At the top and bottom of the table, Word has been seen to do so
 * only where that is the room the table's own top or bottom would take there. Why, where Word's room isn't known.
 */
const withDeletedBorders = (kept: TableGeometry, all: TableGeometry | string, deleted: readonly boolean[]): TableGeometry | string => {
    if (typeof all === "string") {
        return all;
    }
    // The room of the borders between all the rows: above each, and below the last
    const rooms = [...all.map(({ borderTop }) => borderTop), all[all.length - 1].borderBottom];
    const keptIndexes = deleted.flatMap((isDeleted, index) => (isDeleted ? [] : [index]));
    const last = keptIndexes.length - 1;
    // The room of the one border Word draws for these, or undefined where they don't all take the same
    const oneOf = (found: readonly number[]): number | undefined => (found.every((room) => room === found[0]) ? found[0] : undefined);
    const tops = keptIndexes.map((index, at) =>
        oneOf([...rooms.slice((keptIndexes[at - 1] ?? -1) + 1, index + 1), ...(at === 0 && index > 0 ? [kept[0].borderTop] : [])]),
    );
    const bottom = oneOf([
        ...rooms.slice(keptIndexes[last] + 1),
        ...(keptIndexes[last] < deleted.length - 1 ? [kept[last].borderBottom] : []),
    ]);
    return bottom === undefined || tops.includes(undefined)
        ? "a deleted table row with borders other than those around it"
        : kept.map((row, at) => ({ ...row, borderTop: tops[at]!, ...(at === last ? { borderBottom: bottom } : {}) }));
};

/**
 * Reads a table (`w:tbl`): the width, margins and content of each cell, and the height and borders of each row. Word
 * sizes the columns of a table whose cells don't all have widths to their text, and widens a column of one whose cells
 * all have widths for a word longer than they give it, unless its layout is fixed, so those are worked out as it is laid
 * out.
 *
 * The table takes its margins, borders, space between cells and indent from its style and the styles that is based on,
 * or the default table style when it has none that is a table style, then from itself, each over those before. Its
 * style's paragraph and run formatting applies to its cells' paragraphs, then the formatting of the parts of its style
 * for the cell, such as its first row's (`w:tblStylePr`), where the table turns them on (`w:tblLook`), with the cell
 * borders and margins they give. A cell's own borders and margins are over those.
 *
 * A row deleted in a tracked change takes no room, as Word lays it out, nor does a table all of whose rows are deleted,
 * which is read as nothing (`word-watertight-markup.docx` MK6, `word-tracked-changes.docx` MK11a, MK11g). Word sizes the
 * columns by its text, and by deleted text in the other rows, all the same (MK11h to MK11j), so those are kept to size
 * them by. A cell merged down from a deleted row starts the merge, empty, as Word lays it out (MK11c). Word draws one
 * border where deleted rows are, a deleted row's own too, and leaves out the space between cells around them
 * (`word-tracked-tables.docx` MK14a to MK14h). It applies the parts of a table style for the first and last rows and the
 * bands by each row's place among all the rows, the deleted ones too (MK14j to MK14l).
 */
const readTable = (element: XmlObject, reader: Reader): TableBlock | undefined => {
    const children = contentOf(element).filter(isObject);
    const properties = childrenOf(find(children, "w:tblPr"));
    const style = valueOf(properties, "w:tblStyle");
    // The margins of the table's style, or of the default table style when it has none that is a table style, and the
    // styles it is based on, then its own. Without any, Word gives cells none
    const ownStyles = styleChain(reader.styles, style, "table");
    const tableStyles = ownStyles.length > 0 ? ownStyles : styleChain(reader.styles, reader.styles.defaultTableStyle, "table");
    const allProperties = [...tableStyles.map(({ tableProperties = [] }) => tableProperties), properties];
    const tableMargins: Margins = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        ...Object.assign({}, ...tableStyles.map(({ cellMargins }) => cellMargins)),
        ...readCellMargins(find(properties, "w:tblCellMar")),
    };
    // Each of the table's borders from the last that gives it: its styles', then its own (word-table-formats.docx BC6)
    const tableBorders: BorderSet = Object.assign({}, ...allProperties.map((given) => readBorderSet(find(given, "w:tblBorders"))));
    const tableSpacing = readCellSpacing(lastOf(allProperties, "w:tblCellSpacing"));
    const { "w:w": indentValue, "w:type": indentType = "dxa" } = attributesOf(lastOf(allProperties, "w:tblInd"));
    const indent = indentType === "nil" ? 0 : indentType === "dxa" ? (twips(indentValue) ?? 0) : undefined;
    const grid = childrenOf(find(children, "w:tblGrid"))
        .filter((child) => "w:gridCol" in child)
        .map((column) => twips(attributesOf(column["w:gridCol"])["w:w"]) ?? 0);
    // The rows, and those in content controls and custom XML, with the bookmarks that start before each
    const parts = unwrap(children);
    const rows = withBookmarks(parts, "w:tr");
    const fixed = attributesOf(find(properties, "w:tblLayout"))["w:type"] === "fixed";
    // Whether Word sizes the columns to their text, or widens them for long words, by the cells' deleted text too
    const sized = !fixed || tableSpacing !== 0;
    // The lines of a table's cells aren't on its section's grid (scripts/layout-probes/word-grid.ts G8)
    const cellGrid = reader.grid ?? reader.cellGrid;
    const cellReader: Reader = {
        ...reader,
        inSizedTable: sized,
        inCell: true,
        grid: undefined,
        ...(cellGrid === undefined ? {} : { cellGrid }),
    };
    // Which rows are deleted in a tracked change
    const deletedFlags = rows.map(
        ({ element: row }) => find(childrenOf(find(contentOf(row).filter(isObject), "w:trPr")), "w:del") !== undefined,
    );
    // How many of the first rows are header rows, and how many of those are deleted
    const headerFlags = rows.map(
        ({ element: row }) => onOff(childrenOf(find(contentOf(row).filter(isObject), "w:trPr")), "w:tblHeader") === true,
    );
    const headerRows = headerFlags.includes(false) ? headerFlags.indexOf(false) : headerFlags.length;
    const deletedHeaderRows = deletedFlags.slice(0, headerRows).filter((deleted) => deleted).length;

    // The parts of the table's style for some of its cells, by their type, from each of its styles in turn
    const conditional = ownStyles.flatMap(({ conditional: given = new Map() }) => [...given]);
    const look = readTableLook(lastOf(allProperties, "w:tblLook")) ?? UNSAID_LOOK;
    const bandSize = (name: string): number | undefined => numberOf(attributesOf(lastOf(allProperties, name))["w:val"]);
    const bands = { rows: bandSize("w:tblStyleRowBandSize"), columns: bandSize("w:tblStyleColBandSize") };
    /**
     * The paragraph and run formatting the table's style gives a cell's paragraphs, with that of the parts of it for the
     * cell, the borders and margins those give the cell, and why a part of it for the cell changes its lines in a way not
     * yet followed: with table or row properties, or cell properties other than borders and margins
     */
    const formatsOf = (
        position: CellPosition,
    ): {
        readonly formats: TableFormats;
        readonly borders: BorderSet;
        readonly margins: Partial<Margins>;
        readonly unsupported?: string;
    } => {
        if (conditional.length === 0) {
            return UNFORMATTED;
        }
        const applying = conditionalTypesOf(position, look, bands).flatMap((type) => conditional.filter(([given]) => given === type));
        const unfollowed = applying.some(
            ([, format]) =>
                changesLines([...format.tableProperties, ...format.rowProperties]) ||
                changesLines(format.cellProperties, FOLLOWED_CELL_PROPERTIES),
        );
        return {
            formats: [...ownStyles, ...applying.map(([, format]) => format)],
            borders: Object.assign({}, ...applying.map(([, { cellProperties }]) => readBorderSet(find(cellProperties, "w:tcBorders")))),
            margins: Object.assign({}, ...applying.map(([, { cellProperties }]) => readCellMargins(find(cellProperties, "w:tcMar")))),
            ...withoutUndefined({
                unsupported: unfollowed ? "a table style's formatting for some of its cells" : unseenInHeaderOf(position, applying),
            }),
        };
    };

    // What a style without parts for some cells gives each cell
    const UNFORMATTED = { formats: ownStyles, borders: {}, margins: {} };

    /**
     * Why the parts of the table's style for a cell in a header of several rows apply in a way Word hasn't been seen to
     * apply them, when they do: its corners in the header's rows after the first, and its bands in a header of three rows
     * or more with its first row turned off. Word made all of a header of two or three rows its first row, and put one of
     * two in the second band (`word-compat-off.docx` CS2a, CS2b and CS2f)
     */
    const unseenInHeaderOf = (
        { row, headerRows: header = 0 }: CellPosition,
        applying: readonly (readonly [string, unknown])[],
    ): string | undefined => {
        const types = new Set(applying.map(([type]) => type));
        if (row > 0 && row < header && (types.has("nwCell") || types.has("neCell"))) {
            return "a table style's corner cells in a header of several rows";
        }
        return row < header && header > 2 && (types.has("band1Horz") || types.has("band2Horz"))
            ? "a table style's bands of rows in a header of three rows or more"
            : undefined;
    };

    const gridWidth = (from: number, to: number): number => grid.slice(from, to).reduce((total, value) => total + value, 0);

    const read = rows.map(
        (
            { element: row, bookmarks: rowBookmarks },
            rowIndex,
        ): {
            readonly cells: readonly ReadCell[];
            readonly deleted: boolean;
            readonly row: Omit<TableRow, "cells" | "borderTop" | "borderBottom">;
            readonly spacing: number | undefined;
            readonly edges: ReadonlyMap<number, number>;
            readonly end: number;
            readonly unsupported?: string;
            /** The bookmarks that start before the row, and before each of its cells */
            readonly bookmarks: readonly string[];
            readonly cellBookmarks: readonly (readonly string[])[];
        } => {
            const rowChildren = contentOf(row).filter(isObject);
            const rowProperties = childrenOf(find(rowChildren, "w:trPr"));
            const rowParts = unwrap(rowChildren);
            const rowCells = withBookmarks(rowParts, "w:tc");
            const heightAttributes = attributesOf(find(rowProperties, "w:trHeight"));
            const height = twips(heightAttributes["w:val"]);
            const { "w:hRule": rule } = heightAttributes;
            const skipped = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"]) ?? 0;
            const ownSpacing = find(rowProperties, "w:tblCellSpacing");
            const spacing = ownSpacing === undefined ? tableSpacing : readCellSpacing(ownSpacing);
            // A deleted row is read only as Word sizes the columns by it, with its notes and lists left uncounted, or, where
            // nothing sizes them, for its bookmarks, with its deleted runs read as nothing
            const deleted = deletedFlags[rowIndex];
            // A deleted row's page references with \p are counted, as docx counts them, but for those in its deleted text
            const rowReader = deleted ? sizingReaderOf(cellReader, sized, true) : cellReader;
            const counts = deleted ? JSON.stringify([...rowReader.counters]) : "";
            // Word applies the parts of the table's style to each row by its place among all the rows, the deleted ones
            // too: with the first row deleted, the second isn't the first row, nor is the one before a deleted last row
            // the last, and the bands count the deleted rows (word-tracked-tables.docx MK14j to MK14l). Whether a header
            // of several rows counts its deleted rows hasn't been seen, so where the parts that apply to a row would be
            // others without them, it isn't known which Word applies
            const unseenHeaderCount =
                !deleted &&
                deletedHeaderRows > 0 &&
                headerRows > 1 &&
                conditional.length > 0 &&
                rowCells.some((_, cell) => {
                    const typesAt = (at: number, count: number, header: number): string =>
                        JSON.stringify(
                            conditionalTypesOf({ row: at, rows: count, cell, cells: rowCells.length, headerRows: header }, look, bands),
                        );
                    const deletedBefore = deletedFlags.slice(0, Math.min(rowIndex, headerRows)).filter((flag) => flag).length;
                    return (
                        typesAt(rowIndex, rows.length, headerRows) !==
                        typesAt(rowIndex - deletedBefore, rows.length - deletedHeaderRows, headerRows - deletedHeaderRows)
                    );
                });
            // Where each cell's edges are, by the grid column they are at, to check the rows agree on them
            const {
                cells,
                edges,
                column: end,
                unsupported: cellsUnsupported,
            } = rowCells.reduce<{
                readonly column: number;
                readonly cells: readonly ReadCell[];
                readonly edges: ReadonlyMap<number, number>;
                readonly unsupported?: string;
            }>(
                ({ column, cells: done, edges: before, unsupported: unsupportedBefore }, { element: cell }, cellIndex) => {
                    const cellChildren = contentOf(cell).filter(isObject);
                    const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
                    const span = numberOf(attributesOf(find(cellProperties, "w:gridSpan"))["w:val"]) ?? 1;
                    const mergeElement = find(cellProperties, "w:vMerge");
                    const merge =
                        mergeElement === undefined ? undefined : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
                    const formatted = formatsOf({ row: rowIndex, rows: rows.length, cell: cellIndex, cells: rowCells.length, headerRows });
                    const margins = { ...tableMargins, ...formatted.margins, ...readCellMargins(find(cellProperties, "w:tcMar")) };
                    // Word lays a cell out at its own width in twips, when it has one, rather than the grid's. A share of the
                    // table's width is the grid's
                    const { "w:w": ownWidth, "w:type": widthType = "dxa" } = attributesOf(find(cellProperties, "w:tcW"));
                    const inTwips = widthType === "dxa" ? (twips(ownWidth) ?? 0) : 0;
                    const hasWidth = inTwips > 0 || (widthType === "pct" && (shareOf(ownWidth) ?? 0) > 0);
                    const width = inTwips > 0 ? inTwips : gridWidth(column, column + span);
                    const direction = valueOf(cellProperties, "w:textDirection");
                    // What Word sizes the columns by, with the cell's deleted text in, read before the cell is, so its lists
                    // are at the same numbers
                    const sizing =
                        sized && !deleted && hasAnyOf(cellChildren, REMOVALS)
                            ? readBlocks(cellChildren, sizingReaderOf(rowReader), formatted.formats)
                            : undefined;
                    const cellBlocks = readBlocks(cellChildren, rowReader, formatted.formats);
                    const vertical = direction !== undefined && VERTICAL.has(direction);
                    return {
                        column: column + span,
                        edges: new Map([...before, [column + span, before.get(column)! + width]]),
                        ...withoutUndefined({
                            unsupported:
                                unsupportedBefore ??
                                unsupportedCellOf(cellProperties) ??
                                formatted.unsupported ??
                                (vertical ? unsupportedVerticalOf(cellBlocks) : undefined),
                        }),
                        cells: [
                            ...done,
                            {
                                column,
                                ...(span > 1 ? { span } : {}),
                                width: width - margins.left - margins.right,
                                ...(hasWidth ? { ownWidth: width } : {}),
                                blocks: cellBlocks,
                                marginTop: margins.top,
                                marginBottom: margins.bottom,
                                marginLeft: margins.left,
                                marginRight: margins.right,
                                ...(merge ? { verticalMerge: merge } : {}),
                                ...(vertical ? { vertical: true } : {}),
                                ...(onOff(cellProperties, "w:hideMark") === true ? { hideMark: true } : {}),
                                ...(sizing ? { sizing } : {}),
                                borders:
                                    formatted === UNFORMATTED
                                        ? readBorderSet(find(cellProperties, "w:tcBorders"))
                                        : { ...formatted.borders, ...readBorderSet(find(cellProperties, "w:tcBorders")) },
                                margins,
                                gridWidth: width,
                            },
                        ],
                    };
                },
                { column: skipped, cells: [], edges: new Map([[skipped, gridWidth(0, skipped)]]) },
            );
            // A row of a division of a web page (`w:divId`) has the division's margins and borders, and one with table
            // properties of its own (`w:tblPrEx`) has borders, margins or widths of its own
            const rowUnsupported =
                find(rowProperties, "w:divId") !== undefined
                    ? "a table row in an HTML division"
                    : rowParts.some((part) => "w:sdt" in part)
                      ? BOUND_CONTROL
                      : changesLines(childrenOf(find(rowChildren, "w:tblPrEx")))
                        ? "a table row with table properties of its own"
                        : deleted && (hasAnyOf(rowChildren, REMOVED_NOTES) || JSON.stringify([...rowReader.counters]) !== counts)
                          ? "a list or a note in a deleted table row"
                          : unseenHeaderCount
                            ? "a deleted row in a table's header of several rows, whose style formats some of its rows"
                            : cellsUnsupported;
            return {
                cells,
                deleted,
                edges,
                end,
                spacing,
                ...withoutUndefined({ unsupported: rowUnsupported }),
                bookmarks: rowBookmarks,
                cellBookmarks: rowCells.map(({ bookmarks }) => bookmarks),
                row: {
                    // A height without a rule is the least the row can be, as Word writes it
                    ...(height !== undefined && rule !== "auto"
                        ? { height: { value: height, rule: rule === "exact" ? "exact" : "atLeast" } }
                        : {}),
                    header: onOff(rowProperties, "w:tblHeader") === true,
                    cantSplit: onOff(rowProperties, "w:cantSplit") === true,
                },
            };
        },
    );
    const kept = read.filter(({ deleted }) => !deleted);
    if (kept.length === 0 && read.length > 0) {
        // Every row is deleted, so the table takes no room, unless what Word does with a row hasn't been seen, which a
        // layout that guesses has no guess for either
        const reason = read.find((row) => row.unsupported !== undefined)?.unsupported;
        return reason === undefined
            ? undefined
            : { type: "table", rows: [], unsupported: reason, ...(reader.guess ? { noGuess: true } : {}) };
    }
    const tableCells = read.flatMap(({ cells }) => cells);
    const fits = !fixed && tableCells.some(({ ownWidth }) => ownWidth === undefined);
    // Space between cells that is a share of the table's width, or that a row has of its own, isn't known yet
    const spacingUnsupported =
        tableSpacing === undefined || read.some(({ spacing }) => spacing === undefined)
            ? "space between table cells as a share of the table's width"
            : read.some(({ spacing }) => spacing !== tableSpacing)
              ? "a table row with space between its cells of its own"
              : undefined;
    // The room around each row's and cell's text, from the borders and the space between cells, which every row has the
    // same of when it is followed
    const followedSpacing = spacingUnsupported === undefined ? tableSpacing! : 0;
    const geometryOf = (laidOut: typeof read): TableGeometry | string =>
        tableGeometry(
            laidOut.map(({ cells }) => ({ cells, spacing: followedSpacing })),
            { borders: tableBorders, spacing: followedSpacing },
        );
    const spaced = followedSpacing > 0;
    const keptGeometry = geometryOf(kept);
    // With space between cells, a deleted row takes no room, nor does the space around it (word-tracked-tables.docx
    // MK14h), but whether Word keeps its borders, or which of the table's the rows around it take, hasn't been seen
    const bordered = (): boolean =>
        [tableBorders.top, tableBorders.bottom, tableBorders.insideH].some(isDrawn) ||
        read.some(({ cells }) => cells.some(({ borders }) => isDrawn(borders.top) || isDrawn(borders.bottom)));
    const geometry =
        kept.length === read.length || typeof keptGeometry === "string"
            ? keptGeometry
            : !spaced
              ? withDeletedBorders(keptGeometry, geometryOf(read), deletedFlags)
              : bordered()
                ? "a deleted row in a table with borders and space between its cells"
                : keptGeometry;
    // The rows laid out. The bookmarks before each row and cell start where the text after them does: in the cell after
    // them, or in the next with any text when it has none. Those before a deleted row and its cells, and in its cells,
    // start in the next row laid out. Those after the last, as after a table's last row, aren't placed, so a page
    // reference to them is left blank
    // eslint-disable-next-line functional/prefer-readonly-type
    const tableRows: TableRow[] = [];
    let carried: readonly string[] = [];
    let unmerged: string | undefined;
    read.forEach(({ row, cells, deleted, bookmarks, cellBookmarks }, index) => {
        carried = [
            ...carried,
            ...bookmarks,
            ...(deleted ? cells.flatMap((cell, cellIndex) => [...cellBookmarks[cellIndex], ...markersIn(cell.blocks)]) : []),
        ];
        if (deleted) {
            return;
        }
        const placed = typeof geometry === "string" ? undefined : geometry[tableRows.length];
        const above = tableRows[tableRows.length - 1];
        // eslint-disable-next-line functional/immutable-data
        tableRows.push({
            ...row,
            borderTop: placed?.borderTop ?? 0,
            borderBottom: placed?.borderBottom ?? 0,
            ...withoutUndefined({ breakBorder: placed?.breakBorder }),
            cells: cells.map(({ borders: _, margins, gridWidth: __, ...cell }, cellIndex) => {
                const pending = [...carried, ...cellBookmarks[cellIndex]];
                const marked = pending.length === 0 ? undefined : startingAtFirst(cell.blocks, pending);
                carried = marked === undefined ? pending : [];
                const around = placed?.cells[cellIndex];
                // A cell's width with the space between cells is as wide as Word sizes its column from, as the table's columns
                // are narrowed to keep its width (word-table-formats2.docx CS9)
                const spacingRoom = around === undefined ? 0 : around.left - margins.left + around.right - margins.right;
                // A cell merged down from a deleted row starts the merge, as Word lays it out when it is empty (MK11c). What
                // it does with one with something in it hasn't been seen
                const orphan =
                    read[index - 1]?.deleted === true &&
                    cell.verticalMerge === "continue" &&
                    above?.cells.find((other) => other.column === cell.column)?.verticalMerge === undefined;
                unmerged ??= orphan && hasContent(cell.blocks) ? "a cell merged down from a deleted table row" : undefined;
                return {
                    ...cell,
                    ...(around === undefined ? {} : { width: around.width, marginLeft: around.left, marginRight: around.right }),
                    ...(spaced && cell.ownWidth !== undefined ? { ownWidth: cell.ownWidth + spacingRoom } : {}),
                    ...(marked === undefined ? {} : { blocks: marked }),
                    ...(orphan ? { verticalMerge: "restart" as const } : {}),
                };
            }),
        });
    });
    // Cells over the same columns whose widths put a column's edge in different places in different rows. Word makes each
    // column as wide as the widest a row gives it, then fits them to the table's own width in twips, laid out fixed or
    // not (`word-watertight-stops.docx` SP14). Without one, and with space between the cells, how isn't known
    const edgesAt = new Map<number, number>();
    const unequal = read.some(({ edges }) =>
        [...edges].some(([column, edge]) => {
            const other = edgesAt.get(column) ?? edge;
            // eslint-disable-next-line functional/immutable-data
            edgesAt.set(column, other);
            return Math.abs(other - edge) > WIDTH_TOLERANCE;
        }),
    );
    // The rows Word sizes the columns by, deleted ones too, and the blocks it lays out, or sizes the columns by
    const deletedRows: readonly TableRow[] = sized
        ? read
              .filter(({ deleted }) => deleted)
              .map(({ row, cells }) => ({
                  ...row,
                  borderTop: 0,
                  borderBottom: 0,
                  cells: cells.map(({ borders: _, margins: __, gridWidth: ___, ...cell }) => cell),
              }))
        : [];
    const blocks = [
        ...tableRows.flatMap(({ cells }) => cells.flatMap((cell) => [...cell.blocks, ...(cell.sizing ?? [])])),
        ...deletedRows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks)),
    ];
    // How Word lays out a table of more columns than it can have isn't known, and sizing one to its text would count a
    // column for each it says it has, however many
    const columns = read.reduce((most, { end }) => Math.max(most, end), 0);
    const unfitted = columns > MOST_COLUMNS ? `a table given no widths of more than ${MOST_COLUMNS} columns` : undefined;
    // The lengths of the table, its rows and its cells, whose paragraphs have their own
    const lengths = unknownLengthIn([
        find(children, "w:tblPr"),
        find(children, "w:tblGrid"),
        ...rows.flatMap(({ element: row }) => {
            const rowChildren = contentOf(row).filter(isObject);
            return [
                find(rowChildren, "w:trPr"),
                ...unwrap(rowChildren)
                    .filter((part) => "w:tc" in part)
                    .map((cell) => find(contentOf(cell).filter(isObject), "w:tcPr")),
            ];
        }),
    ]);
    // A table style's own row and cell properties apply to every row and cell, in a way not yet followed
    const styleUnsupported = tableStyles.some(({ rowProperties = [], cellProperties = [] }) =>
        changesLines([...rowProperties, ...cellProperties]),
    )
        ? "a table style with formatting of its rows or cells"
        : undefined;
    const givenWidth = readTableWidth(properties);
    // Word evens out the rows of a table whose cells all have widths, or of one laid out fixed, that give a column different
    // widths, with a width of its own in twips or none (`word-watertight-stops.docx` SP14, `word-table-widths.docx` TW1 to
    // TW6). With a share of the width, space between its cells, or a row that starts past the first column (`w:gridBefore`),
    // how isn't known
    const evenable = !spaced && givenWidth.share === undefined && read.every(({ edges }) => edges.has(0));
    const evened = unequal && evenable;
    // And fits a table laid out fixed to its own width in twips, when its rows aren't as wide (TW8, TW10)
    const tableTwips = givenWidth.width;
    const fixedFit =
        fixed &&
        evenable &&
        (unequal || (tableTwips !== undefined && read.some(({ edges, end }) => Math.abs(edges.get(end)! - tableTwips) > WIDTH_TOLERANCE)));
    // What is in a cell that a layout that guesses has no guess for is why it can't lay out the table either
    const withoutGuess = blocks.find((block) => block.noGuess === true);
    // Word puts the text after a floating table (`w:tblpPr`) beside it (`word-watertight-tables.docx` TB11), as it does
    // beside a drawing with square wrapping (`word-floats2.docx` G24 to G29). One in a table cell, a header or footer, or a
    // note hasn't been seen
    const floatElement = find(properties, "w:tblpPr");
    const float = floatElement === undefined ? undefined : readTableFloat(floatElement, find(properties, "w:tblOverlap"));
    const unsupported =
        withoutGuess?.unsupported ??
        (reader.down === true ? "a table on text that runs down the page" : undefined) ??
        (float !== undefined && (reader.inCell || reader.inNote || reader.inHeader)
            ? "a table that text flows around in a table cell, header, footer or note"
            : undefined) ??
        (typeof float === "string" ? float : undefined) ??
        (parts.some((part) => "w:sdt" in part) ? BOUND_CONTROL : undefined) ??
        read.find((row) => row.unsupported !== undefined)?.unsupported ??
        unmerged ??
        (fits ? unfitted : unequal && !evened ? "a table whose rows give a column different widths" : undefined) ??
        spacingUnsupported ??
        (typeof geometry === "string" ? geometry : undefined) ??
        (indent === undefined ? "a table indented by a share of the width" : undefined) ??
        styleUnsupported ??
        lengths ??
        blocks.find((block) => block.unsupported !== undefined)?.unsupported;
    // With space between cells, Word keeps a table's width, its own or its first row's cells', laid out fixed or not, and
    // narrows its columns for the space (word-table-formats2.docx CS9, CS10, CS14)
    const rowWidth = (read[0]?.cells ?? []).reduce((total, cell) => total + (cell.ownWidth ?? 0), 0);
    const tableWidth = spaced && givenWidth.width === undefined && givenWidth.share === undefined ? { width: rowWidth } : givenWidth;
    return {
        type: "table",
        rows: tableRows,
        ...(fits ? { fit: givenWidth } : {}),
        ...(!fits && (!fixed || spaced || fixedFit)
            ? {
                  widen: {
                      ...tableWidth,
                      ...(evened ? { uneven: true as const } : {}),
                      ...(fixed && !spaced ? { fixed: true as const } : {}),
                  },
              }
            : {}),
        borderLeft: roomOf(tableBorders.left) ?? 0,
        borderRight: roomOf(tableBorders.right) ?? 0,
        ...(indent ? { indent } : {}),
        ...(spaced ? { cellSpacing: followedSpacing } : {}),
        ...(deletedRows.length > 0 ? { deletedRows } : {}),
        ...(typeof float === "object" ? { float } : {}),
        ...(unsupported ? { unsupported } : {}),
        ...(withoutGuess ? { noGuess: true } : {}),
    };
};

// cspell:ignore tblp
// What a floating table is placed against across and down the page, by its `horzAnchor` and `vertAnchor`, as a drawing
// names the same, and what it can be lined up with them by (`tblpXSpec`, `tblpYSpec`)
const TABLE_AXES = {
    horzAnchor: {
        from: new Map([
            ["text", "column"],
            ["margin", "margin"],
            ["page", "page"],
        ]),
        alignments: new Set(["left", "center", "right", "inside", "outside"]),
    },
    vertAnchor: {
        from: new Map([
            ["text", "paragraph"],
            ["margin", "margin"],
            ["page", "page"],
        ]),
        alignments: new Set(["top", "center", "bottom", "inside", "outside"]),
    },
};

/** Where a table that text flows around is (`w:tblpPr`), or why it can't be followed */
const readTableFloat = (element: unknown, overlap: unknown): TableFloat | string => {
    const attributes = attributesOf(element);
    const position = (anchor: keyof typeof TABLE_AXES, spec: string, at: string): DrawingPosition | string => {
        const { from: anchors, alignments } = TABLE_AXES[anchor];
        const from = anchors.get(String(attributes[`w:${anchor}`]));
        const align = attributes[`w:${spec}`];
        if (from === undefined) {
            return "a table that text flows around placed against what isn't given";
        }
        if (align !== undefined) {
            return alignments.has(String(align))
                ? { from, align: String(align) }
                : "a table that text flows around lined up in a way not yet followed";
        }
        return { from, offset: twips(attributes[`w:${at}`]) ?? 0 };
    };
    const horizontal = position("horzAnchor", "tblpXSpec", "tblpX");
    const vertical = position("vertAnchor", "tblpYSpec", "tblpY");
    if (typeof horizontal === "string" || typeof vertical === "string") {
        return typeof horizontal === "string" ? horizontal : (vertical as string);
    }
    const distance = (name: string): number => twips(attributes[`w:${name}FromText`]) ?? 0;
    return {
        horizontal,
        vertical,
        distances: { top: distance("top"), bottom: distance("bottom"), left: distance("left"), right: distance("right") },
        mayOverlap: attributesOf(overlap)["w:val"] !== "never",
    };
};

/** A block in place of what can't be laid out, with why */
const unsupportedBlock = (unsupported: string): ParagraphBlock => ({
    type: "paragraph",
    items: [],
    format: {},
    tabStops: [],
    markFont: {},
    unsupported,
});

/**
 * A block with bookmarks that start where its text does: before its first item, or, for a table, in the first of its
 * cells with any text. Undefined when it has no text for them to start at, as a table without rows.
 */
const startingWith = (block: Block, bookmarks: readonly string[]): Block | undefined => {
    if (bookmarks.length === 0) {
        return block;
    }
    if (block.type === "paragraph") {
        return { ...block, items: [...bookmarks.map((name) => ({ type: "marker" as const, name })), ...block.items] };
    }
    for (const [rowIndex, row] of block.rows.entries()) {
        for (const [cellIndex, cell] of row.cells.entries()) {
            const blocks = startingAtFirst(cell.blocks, bookmarks);
            if (blocks !== undefined) {
                const cells = row.cells.map((other, index) => (index === cellIndex ? { ...cell, blocks } : other));
                return { ...block, rows: block.rows.map((other, index) => (index === rowIndex ? { ...row, cells } : other)) };
            }
        }
    }
    return undefined;
};

/**
 * Blocks with bookmarks that start where the text of the first of them with any text does. Undefined when none has any.
 */
const startingAtFirst = (blocks: readonly Block[], bookmarks: readonly string[]): readonly Block[] | undefined => {
    for (const [index, block] of blocks.entries()) {
        const marked = startingWith(block, bookmarks);
        if (marked !== undefined) {
            return [...blocks.slice(0, index), marked, ...blocks.slice(index + 1)];
        }
    }
    return undefined;
};

/**
 * A block with bookmarks that start where its text ends: after its last item, or, for a table, in the last paragraph of
 * its last cell. Undefined when it has no paragraph for them to start in, as a table without rows.
 */
const endingWith = (block: Block, bookmarks: readonly string[]): Block | undefined => {
    if (block.type === "paragraph") {
        return { ...block, items: [...block.items, ...bookmarks.map((name) => ({ type: "marker" as const, name }))] };
    }
    const row = block.rows[block.rows.length - 1];
    const cell = row?.cells[row.cells.length - 1];
    const last = cell?.blocks[cell.blocks.length - 1];
    const marked = last && endingWith(last, bookmarks);
    if (marked === undefined) {
        return undefined;
    }
    const cells = [...row.cells.slice(0, -1), { ...cell, blocks: [...cell.blocks.slice(0, -1), marked] }];
    return { ...block, rows: [...block.rows.slice(0, -1), { ...row, cells }] };
};

/**
 * Reads a paragraph or table, or what is in its place and can't be laid out: an imported document, an equation outside
 * a paragraph, or a content control bound to custom XML. Undefined for anything else, and for a table all of whose rows
 * are deleted in a tracked change.
 */
const readBlock = (element: XmlObject, reader: Reader, tableFormats?: TableFormats): Block | undefined => {
    // Read to be laid out with a guess, there is none for a content control whose first block isn't a paragraph, nor for
    // an imported document, which isn't read at all
    const noGuess = reader.guess ? { noGuess: true } : {};
    switch (nameOf(element)) {
        case "w:p":
            return readParagraph(element, reader, tableFormats);
        case "w:tbl":
            return readTable(element, reader);
        case "w:sdt":
            return { ...unsupportedBlock(BOUND_CONTROL), ...noGuess };
        case "w:altChunk":
            // The .docx adapter turns the documents it can into paragraphs and tables, as Word does, and says why it left
            // the others (see `imported-documents.ts`)
            return { ...unsupportedBlock(stringOf(attributesOf(element["w:altChunk"]).reason) ?? "an imported document"), ...noGuess };
        case "m:oMath":
        case "m:oMathPara":
            return unsupportedBlock("an equation");
        default:
            return undefined;
    }
};

// The elements of a part of a document that are blocks, or end a section, rather than marks between them, such as a
// bookmark's start
const BLOCK_ELEMENTS = new Set(["w:p", "w:tbl", "w:sdt", "w:customXml", "w:altChunk", "m:oMath", "m:oMathPara", "w:sectPr"]);
// What of a section's properties says how it starts, how its pages are numbered, and what headers and footers it has
const SECTION_START = new Set(["w:type", "w:titlePg", "w:pgNumType", "w:headerReference", "w:footerReference"]);

const paragraphPropertiesOf = (paragraph: XmlObject): readonly XmlObject[] =>
    childrenOf(find(contentOf(paragraph).filter(isObject), "w:pPr"));

/** How a paragraph's mark is removed in a tracked change, when it is: deleted (`w:del`), or moved elsewhere (`w:moveFrom`) */
const removedMarkOf = (paragraph: XmlObject): string | undefined =>
    childrenOf(find(paragraphPropertiesOf(paragraph), "w:rPr"))
        .map(nameOf)
        .find((name) => REMOVALS.has(name));

/** The elements of the names given among elements and in them, in order */
const elementsIn = (elements: readonly unknown[], named: (name: string) => boolean): readonly XmlObject[] =>
    elements
        .filter(isObject)
        .flatMap((element) =>
            named(nameOf(element)) ? [element] : nameOf(element) === "_attr" ? [] : elementsIn(contentOf(element), named),
        );

/** The run formatting a paragraph's styles give its text */
const paragraphRunOf = (paragraph: XmlObject, styles: TextStyles): RunFormat =>
    combine([
        styles.run,
        ...styleChain(styles, valueOf(paragraphPropertiesOf(paragraph), "w:pStyle") ?? styles.defaultParagraphStyle, "paragraph").map(
            ({ run }) => run,
        ),
    ]);

/**
 * Whether a paragraph's mark is hidden (`w:vanish`), by its own formatting or its style's. `w:specVanish` alone doesn't
 * hide it: Word lays out a paragraph whose mark has it on a line of its own (`word-breaks-and-tabs.docx` HM5a)
 */
const isMarkHidden = (paragraph: XmlObject, styles: TextStyles): boolean =>
    combine([paragraphRunOf(paragraph, styles), readRunFormat(find(paragraphPropertiesOf(paragraph), "w:rPr"), styles.themeFonts)])
        .hidden === true;

// What in a paragraph Word never shows: bookmarks, the marks of comments' and other ranges, and proofing errors
const NEVER_SHOWN = /^w:(bookmark(Start|End)|\w+Range(Start|End)|perm(Start|End)|proofErr|pPr)$|^_attr$/;

/**
 * Whether anything of a paragraph's content is shown: a run with something in it that isn't hidden, by its own formatting,
 * its character style's or its paragraph's, or anything but runs, which may be
 */
const showsSomething = (elements: readonly unknown[], paragraphRun: RunFormat, styles: TextStyles): boolean =>
    elements.filter(isObject).some((element) => {
        const name = nameOf(element);
        if (name === "w:r") {
            const children = contentOf(element).filter(isObject);
            const properties = find(children, "w:rPr");
            const characterStyle = valueOf(childrenOf(properties), "w:rStyle") ?? styles.defaultCharacterStyle;
            const format = combine([
                paragraphRun,
                ...styleChain(styles, characterStyle, "character").map(({ run }) => run),
                readRunFormat(properties, styles.themeFonts),
            ]);
            return children.some((child) => nameOf(child) !== "w:rPr") && format.hidden !== true;
        }
        return RUN_CONTAINERS.has(name)
            ? showsSomething(contentOf(element), paragraphRun, styles)
            : !REMOVALS.has(name) && !NEVER_SHOWN.test(name);
    });

/** Whether a paragraph is in a list, its own or its style's */
const isNumbered = (paragraph: XmlObject, styles: TextStyles): boolean => {
    const properties = paragraphPropertiesOf(paragraph);
    const style = valueOf(properties, "w:pStyle") ?? styles.defaultParagraphStyle;
    return (
        find(properties, "w:numPr") !== undefined ||
        styleChain(styles, style, "paragraph").some(({ numbering }) => numbering?.id !== undefined)
    );
};

// The parts of a paragraph's formatting a paragraph joined to the next by its hidden mark gives the joined one, where they
// differ: its alignment, left indent and space before, with the next one's space after (`word-breaks-and-tabs.docx` HM1a to
// HM1f), by the attributes of the elements they are in
const JOINED_FORMATTING: Readonly<Record<string, readonly string[] | undefined>> = {
    "w:jc": ["w:val"],
    "w:ind": ["w:left", "w:start"],
    "w:spacing": ["w:before", "w:after"],
};

/**
 * A paragraph's own formatting, but for its mark's, its style when it names the default one, as none does, and the parts
 * that may differ between paragraphs joined by a hidden mark
 */
const paragraphFormatOf = (paragraph: XmlObject, styles: TextStyles): string =>
    JSON.stringify(
        paragraphPropertiesOf(paragraph).flatMap((child) => {
            const name = nameOf(child);
            if (name === "w:rPr" || (name === "w:pStyle" && valueOf([child], "w:pStyle") === styles.defaultParagraphStyle)) {
                return [];
            }
            const joined = JOINED_FORMATTING[name];
            if (joined === undefined) {
                return [child];
            }
            const kept = Object.entries(attributesOf(child[name])).filter(([key]) => !joined.includes(key));
            return kept.length === 0 ? [] : [{ [name]: Object.fromEntries(kept) }];
        }),
    );

/** Whether an element has anything in its runs, deleted or not, but their formatting */
const hasRunContent = (element: unknown): boolean =>
    Array.isArray(element)
        ? element.some(hasRunContent)
        : isObject(element) &&
          Object.entries(element).some(([name, value]) =>
              name === "w:r"
                  ? childrenOf(value).some((child) => nameOf(child) !== "w:rPr" && nameOf(child) !== "_attr")
                  : name !== "_attr" && name !== "w:pPr" && hasRunContent(value),
          );

/** What of a section's properties says how it starts, numbers its pages, and what headers and footers it has */
const startOf = (section: unknown): string => JSON.stringify(childrenOf(section).filter((child) => SECTION_START.has(nameOf(child))));

/** The properties of the first section that ends among elements: in a paragraph, or the body's own */
const nextSectionIn = (elements: readonly XmlObject[]): unknown =>
    elements.map(sectionPropertiesOf).find((section) => section !== undefined);

/** A paragraph the layout stops at, for why */
const stopIn = (paragraph: XmlObject, reason: string): XmlObject => ({ "w:p": [...contentOf(paragraph), { [STOP]: reason }] });

/** A paragraph whose mark is deleted, joined to the next: the next, with the deleted one's content, then what is between them, first */
const joinedParagraph = (first: XmlObject, between: readonly unknown[], next: XmlObject): XmlObject => {
    const isHead = (child: unknown): boolean => isObject(child) && (nameOf(child) === "_attr" || nameOf(child) === "w:pPr");
    const content = contentOf(next);
    return {
        "w:p": [
            ...content.filter(isHead),
            ...contentOf(first).filter((child) => !isHead(child)),
            ...between,
            ...content.filter((child) => !isHead(child)),
        ],
    };
};

/**
 * A paragraph whose mark is hidden, joined to the next, after what is between them: the two paragraphs' text on its lines,
 * in the first one's formatting but for its space after, which is the next one's, with the next one's mark
 * (`word-breaks-and-tabs.docx` HM1a to HM1f). The next one's number, when they are in a list, is counted (HM4).
 */
const joinedToNext = (first: XmlObject, between: readonly unknown[], next: XmlObject, styles: TextStyles): XmlObject => {
    const isHead = (child: unknown): boolean => isObject(child) && (nameOf(child) === "_attr" || nameOf(child) === "w:pPr");
    const own = paragraphPropertiesOf(first);
    const nextProperties = paragraphPropertiesOf(next);
    const { "w:after": after } = attributesOf(find(nextProperties, "w:spacing"));
    const spacing = {
        ...Object.fromEntries(Object.entries(attributesOf(find(own, "w:spacing"))).filter(([key]) => key !== "w:after")),
        ...(after === undefined ? {} : { "w:after": after }),
    };
    const mark = nextProperties.filter((child) => nameOf(child) === "w:rPr");
    const properties = [
        ...own.filter((child) => nameOf(child) !== "w:spacing" && nameOf(child) !== "w:rPr"),
        ...(Object.keys(spacing).length === 0 ? [] : [{ "w:spacing": { _attr: spacing } }]),
        ...mark,
    ];
    const content = contentOf(first);
    return {
        "w:p": [
            ...content.filter((child) => isObject(child) && nameOf(child) === "_attr"),
            { "w:pPr": properties },
            ...content.filter((child) => !isHead(child)),
            ...between,
            ...contentOf(next).filter((child) => !isHead(child)),
            ...(isNumbered(next, styles) ? [{ [COUNTED]: {} }] : []),
        ],
    };
};

// What in a paragraph is read where it is: fields, which are counted in order, and note references, which are numbered
const READ_IN_PLACE = new Set(["w:fldChar", "w:fldSimple", "w:footnoteReference", "w:endnoteReference"]);

/** Whether a paragraph has anything read where it is, its fields, note references, or number in a list */
const readInPlace = (paragraph: XmlObject, styles: TextStyles): boolean =>
    elementsIn(contentOf(paragraph), (name) => READ_IN_PLACE.has(name)).length > 0 || isNumbered(paragraph, styles);

/** Whether a paragraph is one with nothing shown and its mark hidden, which is left out */
const isLeftOut = (paragraph: XmlObject): boolean => contentOf(paragraph).some((child) => isObject(child) && LEFT_OUT in child);

/** The part of a document paragraphs are in, by what Word does with a paragraph with nothing shown at its end */
type Part = "body" | "cell" | "other";

/**
 * How a paragraph whose mark is hidden is laid out, or why it can't be. Word joins it to the next: one whose text is
 * shown in the formatting of the first, but for the next one's space after, where the two differ only in their alignment,
 * left indent and space before and after (`word-watertight-text.docx` TX11a, `word-breaks-and-tabs.docx` HM1a to HM1f).
 * One with nothing shown takes no room, whatever its formatting, and the paragraph after it keeps its own (HM3,
 * `word-seq.docx` Q8, `word-hidden-paragraphs.docx` HP1): before a paragraph, in a list too, where it takes a number (HP5),
 * before a table and at the end of the document (HP2a, HP8). It is read where it is, for its fields and number, and then
 * left out. One with no paragraph after it, before a table or at the end of a table cell, stays as it is (HM2a, HM2b), and
 * at the end of a cell so does one with nothing shown, which takes a line there (HP2b, HP2c). Where the paragraphs differ
 * otherwise, such as in their style or line spacing (HM1g to HM1i), which Word lays out line by line, and what Word does
 * with a hidden mark at the edge of a content control, with a hidden section break, with one of a paragraph showing
 * nothing at the end of a header, footer or note, before one showing nothing whose fields, note references or number
 * would be read out of order, and between paragraphs of text in a table whose columns it sizes to their text, isn't
 * followed yet.
 */
const hiddenMarkJoin = (
    paragraph: XmlObject,
    next: XmlObject | undefined,
    {
        styles,
        nested,
        sized,
        part,
    }: { readonly styles: TextStyles; readonly nested: boolean; readonly sized: boolean; readonly part: Part },
): { readonly reason: string } | { readonly joins: true } | { readonly leftOut: true } | undefined => {
    const nextName = next === undefined ? undefined : nameOf(next);
    const shown = showsSomething(contentOf(paragraph), paragraphRunOf(paragraph, styles), styles);
    if (sectionPropertiesOf(paragraph) !== undefined) {
        return { reason: "a hidden section break" };
    }
    if (nextName === "w:sdt" || nextName === "w:customXml" || (next === undefined && nested)) {
        return { reason: "a hidden paragraph mark at the edge of a content control" };
    }
    if (next === undefined || nextName === "w:sectPr") {
        return shown || part === "cell"
            ? undefined
            : part === "body"
              ? { leftOut: true }
              : { reason: "a paragraph with nothing shown and its mark hidden at the end of a header, footer or note" };
    }
    if (nextName !== "w:p") {
        return shown
            ? undefined
            : nextName === "w:tbl"
              ? { leftOut: true }
              : { reason: "a paragraph with nothing shown and its mark hidden before something that isn't a paragraph or table" };
    }
    // Its hidden text takes no room in a table whose columns Word sizes to their text, as in its lines (HP2d)
    if (!shown) {
        return { leftOut: true };
    }
    if (sized && hasRunContent(paragraph) && hasRunContent(next)) {
        return { reason: "a hidden paragraph mark between paragraphs of text in a table whose columns Word sizes to their text" };
    }
    if (isLeftOut(next)) {
        return { reason: "a hidden paragraph mark before a paragraph with nothing shown and its mark hidden" };
    }
    return paragraphFormatOf(paragraph, styles) === paragraphFormatOf(next, styles)
        ? { joins: true }
        : { reason: "a hidden paragraph mark between paragraphs formatted differently but for their alignment, left indent and space" };
};

/**
 * Joins each paragraph whose mark is deleted in a tracked change to the paragraph after it, as Word lays it out: the next
 * paragraph, with the deleted one's text at its start, all in the next one's formatting, style and list
 * (`word-watertight-markup.docx` MK3, `word-tracked-changes.docx` MK7, MK9). A paragraph whose mark is hidden is joined to
 * the next too, or else is left as it is or stops the layout (see {@link hiddenMarkJoin}). A section break deleted so
 * leaves its section to the next (MK8c). A paragraph with no paragraph after it, before a table or at the end of a table
 * cell or of the document, stays as it is (MK8a, MK8b, MK8d). What Word does with a paragraph mark moved elsewhere, a deleted mark at the
 * edge of a content control, a deleted section break before a table or between sections that start, number their pages or
 * have headers and footers differently, and a deleted mark between paragraphs of text in a table whose columns it sizes,
 * by the paragraphs either as they are written or as they are laid out, hasn't been seen, so the layout stops there.
 *
 * @param styles - The document's styles, which may hide a paragraph's mark
 * @param options - Whether the elements are in a content control or custom XML (`nested`), whether they are in a cell of
 * a table whose columns Word sizes to their text, or widens for long words (`sized`), and the part they are in
 */
const joinRemovedMarks = (
    elements: readonly unknown[],
    styles: TextStyles,
    { nested, sized, part }: { readonly nested: boolean; readonly sized: boolean; readonly part: Part },
): readonly XmlObject[] => {
    // The elements after the one being read, as they are joined, from the last: the next is at the end
    // eslint-disable-next-line functional/prefer-readonly-type
    const after: XmlObject[] = [];
    for (const element of [...elements.filter(isObject)].reverse()) {
        const name = nameOf(element);
        const mark = name === "w:p" ? removedMarkOf(element) : undefined;
        // A paragraph joined to the next goes on past those left out after it, as they show nothing, and their bookmarks go
        // into it. Those whose fields, note references or number would be read out of order stay, for it to stop at
        if (
            name === "w:p" &&
            (mark !== undefined ||
                (isMarkHidden(element, styles) && showsSomething(contentOf(element), paragraphRunOf(element, styles), styles)))
        ) {
            let last = after.findLastIndex((other) => BLOCK_ELEMENTS.has(nameOf(other)));
            while (last >= 0 && isLeftOut(after[last]) && !readInPlace(after[last], styles)) {
                const bookmarks = elementsIn(contentOf(after[last]), (inner) => inner === "w:bookmarkStart");
                // eslint-disable-next-line functional/immutable-data
                after.splice(last, 1, ...[...bookmarks].reverse());
                last = after.findLastIndex((other) => BLOCK_ELEMENTS.has(nameOf(other)));
            }
        }
        // The next block, past the marks between them, such as bookmarks' starts
        const at = after.findLastIndex((other) => BLOCK_ELEMENTS.has(nameOf(other)));
        const next = after[at] as XmlObject | undefined;
        const nextName = next === undefined ? undefined : nameOf(next);
        const hidden =
            mark === undefined && name === "w:p" && isMarkHidden(element, styles)
                ? hiddenMarkJoin(element, next, { styles, nested, sized, part })
                : undefined;
        const unjoined = hidden !== undefined && "reason" in hidden ? hidden.reason : undefined;
        const joins = (mark !== undefined || (hidden !== undefined && "joins" in hidden)) && nextName === "w:p";
        const section = mark === undefined ? undefined : sectionPropertiesOf(element);
        const reason =
            mark === undefined
                ? unjoined
                : mark === "w:moveFrom"
                  ? "a paragraph mark moved in a tracked change"
                  : nextName === "w:sdt" || nextName === "w:customXml" || (next === undefined && nested)
                    ? "a deleted paragraph mark at the edge of a content control"
                    : joins && isLeftOut(next!)
                      ? "a deleted paragraph mark before a paragraph with nothing shown and its mark hidden"
                      : section !== undefined && !joins
                        ? "a deleted section break with no paragraph after it"
                        : section !== undefined && startOf(section) !== startOf(nextSectionIn([...after].reverse()))
                          ? "a deleted section break between sections that start, number their pages or have headers and footers differently"
                          : joins && sized && hasRunContent(element) && hasRunContent(next)
                            ? "a deleted paragraph mark between paragraphs of text in a table whose columns Word sizes to their text"
                            : undefined;
        if (reason !== undefined) {
            // eslint-disable-next-line functional/immutable-data
            after.push(stopIn(element, reason));
        } else if (hidden !== undefined && "leftOut" in hidden) {
            // eslint-disable-next-line functional/immutable-data
            after.push({ "w:p": [...contentOf(element), { [LEFT_OUT]: {} }] });
        } else if (joins) {
            // eslint-disable-next-line functional/immutable-data
            const [, ...between] = after.splice(at);
            // eslint-disable-next-line functional/immutable-data
            const inOrder = between.reverse();
            // eslint-disable-next-line functional/immutable-data
            after.push(
                hidden !== undefined && "joins" in hidden
                    ? joinedToNext(element, inOrder, next!, styles)
                    : joinedParagraph(element, inOrder, next!),
            );
        } else if (name === "w:customXml") {
            // eslint-disable-next-line functional/immutable-data
            after.push({ [name]: joinRemovedMarks(contentOf(element), styles, { nested: true, sized, part }) });
        } else if (name === "w:sdt" && !isBound(element)) {
            const content = contentOf(element).map((child) =>
                isObject(child) && "w:sdtContent" in child
                    ? { "w:sdtContent": joinRemovedMarks(contentOf(child), styles, { nested: true, sized, part }) }
                    : child,
            );
            // eslint-disable-next-line functional/immutable-data
            after.push({ [name]: content });
        } else {
            // eslint-disable-next-line functional/immutable-data
            after.push(element);
        }
    }
    // eslint-disable-next-line functional/immutable-data
    return after.reverse();
};

/**
 * Reads the paragraphs and tables in a part of a document, such as a table cell or a header, and in the content controls
 * and custom XML in it. A bookmark between them starts with the next.
 */
const readBlocks = (elements: readonly unknown[], reader: Reader, tableFormats?: TableFormats): readonly Block[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const blocks: Block[] = [];
    let bookmarks: readonly string[] = [];
    // The paragraphs left out since the last block, which take no room
    let hidden: readonly ParagraphBlock[] = [];
    // Only a table's cells are read in their table's formatting
    const part = tableFormats === undefined ? "other" : "cell";
    for (const element of unwrap(
        joinRemovedMarks(elements, reader.styles, { nested: false, sized: reader.inSizedTable === true, part }),
        reader.guess,
    )) {
        const block = readBlock(element, reader, tableFormats);
        if (block === undefined) {
            bookmarks = [...bookmarks, ...bookmarksIn([element])];
        } else if (block.type === "paragraph" && block.hidden) {
            bookmarks = [...bookmarks, ...markersIn([block])];
            if (hidden.length === 0 && blocks.length > 0) {
                // eslint-disable-next-line functional/immutable-data
                blocks[blocks.length - 1] = beforeHidden(blocks[blocks.length - 1], block);
            }
            hidden = [...hidden, block];
        } else {
            const shown = afterHidden(block, hidden, blocks[blocks.length - 1]);
            const marked = startingWith(shown, bookmarks);
            // eslint-disable-next-line functional/immutable-data
            blocks.push(marked ?? shown);
            bookmarks = marked ? [] : bookmarks;
            hidden = [];
        }
    }
    return withCellEdges(blocks, reader);
};

/**
 * How the text goes round a text frame (`w:wrap`), as Word lays it out: beside it on both sides, with no wrapping given,
 * and around it, tightly, through it and automatically alike (`word-frames.docx` FM1, FM6), or above and below it only,
 * when it isn't beside it, or not at all, when it has none, as the frame is in front of the text (FM6b, FM6c)
 */
const FRAME_WRAPS: Readonly<Record<string, FloatingDrawing["wrap"] | "none">> = {
    around: "square",
    tight: "square",
    through: "square",
    auto: "square",
    notBeside: "topAndBottom",
    none: "none",
};

/**
 * A text frame as a drawing that text flows around, placed and sized by its properties and its paragraphs, nothing when
 * it is in front of the text, or why it can't be laid out: one with borders, which take room beside it in a way not yet
 * followed (FM13)
 */
const frameDrawing = (frame: FrameProperties, blocks: readonly ParagraphBlock[]): FloatingDrawing | undefined | string => {
    const wrap = FRAME_WRAPS[frame.wrap ?? "around"];
    if (wrap === undefined) {
        return "a text frame that text flows around in a way not yet followed";
    }
    if (blocks.some(({ borders }) => borders !== undefined)) {
        return "a text frame with borders";
    }
    if (wrap === "none") {
        return undefined;
    }
    const { width = 0, height, heightRule, horizontal, vertical, across, down } = frame;
    return {
        wrap,
        side: "bothSides",
        width,
        height,
        effects: { top: 0, bottom: 0, left: 0, right: 0 },
        distances: { top: down, bottom: down, left: across, right: across },
        horizontal,
        vertical,
        // How Word lays out a frame that overlaps another drawing hasn't been seen, so it stops there as at a drawing that
        // may not overlap
        mayOverlap: false,
        frame: { blocks, heightRule, fitsWidth: frame.width === undefined },
    };
};

/**
 * Takes the paragraphs in text frames out of the body's text, and anchors each frame in the paragraph after it, as a
 * drawing that text flows around, at its start. Frames elsewhere stop the layout as they are read. The paragraphs of a frame are those next to each other with the same frame. The
 * bookmarks and fields in a frame are where its anchor is, as the frame is on its page. A frame with no paragraph after it
 * in its section, such as one before a table, isn't followed yet, so the layout stops there.
 */
const anchorFrames = <Entry extends { readonly block: Block; readonly section: number }>(
    entries: readonly Entry[],
    withBlock: (entry: Entry, block: Block) => Entry,
): readonly Entry[] => {
    const isFramed = (block: Block): block is ParagraphBlock & { readonly frame: FrameProperties } =>
        block.type === "paragraph" && block.frame !== undefined && block.unsupported === undefined;
    // eslint-disable-next-line functional/prefer-readonly-type
    const anchored: Entry[] = [];
    let framed: readonly Entry[] = [];
    for (const entry of entries) {
        const { block } = entry;
        if (isFramed(block)) {
            framed = [...framed, entry];
            continue;
        }
        if (framed.length === 0) {
            // eslint-disable-next-line functional/immutable-data
            anchored.push(entry);
            continue;
        }
        if (block.type !== "paragraph" || block.sectionBreak || entry.section !== framed[0].section) {
            // Its paragraphs stay in the text, the first stopping the layout, or, guessing, laid out where they are
            // eslint-disable-next-line functional/immutable-data
            anchored.push(...unanchored(framed, withBlock), entry);
            framed = [];
            continue;
        }
        const paragraphs = framed.map((one) => one.block as ParagraphBlock & { readonly frame: FrameProperties });
        // The frames, each of the paragraphs next to each other with the same frame
        const frames = paragraphs.reduce<readonly (readonly ParagraphBlock[])[]>(
            (all, paragraph, index) =>
                index > 0 && paragraphs[index - 1].frame.key === paragraph.frame.key
                    ? [...all.slice(0, -1), [...all[all.length - 1], paragraph]]
                    : [...all, [paragraph]],
            [],
        );
        const drawings = frames.map((blocks) => frameDrawing(blocks[0].frame!, blocks));
        const unsupported = drawings.find((drawing): drawing is string => typeof drawing === "string");
        const markers = markersIn(paragraphs).map((name) => ({ type: "marker" as const, name }));
        // Those that can't be laid out stop the layout at the paragraph, or, guessing, are left out of it
        const laidOut = drawings.flatMap((drawing) =>
            drawing === undefined || typeof drawing === "string" ? [] : [{ type: "drawing" as const, drawing }],
        );
        // eslint-disable-next-line functional/immutable-data
        anchored.push(
            withBlock(entry, {
                ...block,
                items: [...markers, ...laidOut, ...block.items],
                ...(unsupported !== undefined && block.unsupported === undefined ? { unsupported } : {}),
            }),
        );
        framed = [];
    }
    // eslint-disable-next-line functional/immutable-data
    anchored.push(...unanchored(framed, withBlock));
    return anchored;
};

/**
 * The paragraphs of text frames with no paragraph after them in their section to be anchored in, as they are in the text,
 * the first stopping the layout, which Word lays out in a way not yet followed
 */
const unanchored = <Entry extends { readonly block: Block }>(
    framed: readonly Entry[],
    withBlock: (entry: Entry, block: Block) => Entry,
): readonly Entry[] =>
    framed.map((entry, index) =>
        index === 0 ? withBlock(entry, { ...entry.block, unsupported: "a text frame with no paragraph after it in its section" }) : entry,
    );

const START_TYPES = new Set<Section["start"]>(["nextPage", "continuous", "evenPage", "oddPage", "nextColumn"]);

/**
 * A block before a paragraph left out, which takes no room. Whether Word keeps a paragraph kept with the next (`keepNext`)
 * with the paragraph after the one left out hasn't been seen, so the layout stops there.
 */
const beforeHidden = (block: Block, hidden: ParagraphBlock): Block =>
    block.type === "paragraph"
        ? {
              ...block,
              hiddenAfter: hidden,
              ...(block.format.keepNext && block.unsupported === undefined
                  ? { unsupported: "a paragraph kept with the next before a hidden paragraph" }
                  : {}),
          }
        : block;

/**
 * A block after paragraphs left out, which take no room, and the block before them. Whether Word puts two paragraphs with
 * the same borders in one box around hidden ones without them hasn't been seen, so the layout stops there.
 */
const afterHidden = (block: Block, hidden: readonly ParagraphBlock[], before: Block | undefined): Block => {
    if (hidden.length === 0 || block.type !== "paragraph") {
        return block;
    }
    const box = block.borders?.box;
    const split =
        box !== undefined &&
        before?.type === "paragraph" &&
        before.borders?.box === box &&
        hidden.some(({ borders }) => borders?.box !== box);
    return {
        ...block,
        hiddenBefore: hidden[hidden.length - 1],
        ...(split && block.unsupported === undefined ? { unsupported: "a box of borders around a hidden paragraph without them" } : {}),
    };
};

// What is next to a paragraph at a table cell's edge in the document's order, when that isn't known
const UNKNOWN_NEXT = Symbol("unknown");
// Nothing next to it, at the start of the document, a header or a note
const NOTHING_NEXT = Symbol("nothing");
type NextToCell = { readonly style?: string } | typeof UNKNOWN_NEXT | typeof NOTHING_NEXT;

/** What is next to the first or last block of some blocks: a paragraph of its style, or what isn't known, for a table */
const endOf = (blocks: readonly Block[], end: "first" | "last"): NextToCell => {
    const block = end === "first" ? blocks[0] : blocks[blocks.length - 1];
    return block?.type === "paragraph" ? { style: block.style } : UNKNOWN_NEXT;
};

const CONTEXTUAL_EDGE = "contextual spacing at the edge of a table cell beside another cell or row, or a table's paragraphs";

/**
 * A stack of blocks with the space Word leaves out at the edges of its tables' cells for contextual spacing. Word compares
 * a paragraph at a cell's edge with the paragraph next to it in the document's order: the first cell's first paragraph
 * with the paragraph before the table, and each row's last paragraph with the end of the row, which is a paragraph in the
 * default paragraph style. So Normal paragraphs with contextual spacing in a cell between Normal paragraphs have neither
 * the first's space before nor the last's space after, and in a style of their own keep both; between paragraphs of
 * another style, the first keeps its space before, and the last still leaves out its space after
 * (`word-stops-text.docx` PB6a to PB6e, `word-compat-settings.docx` CP11). The other edges haven't been seen: the tops of
 * cells after the first, the bottoms of cells before the last of a row, and the paragraphs around a table, whose space
 * Word would leave out if it compared them in the document's order too. The layout stops where it would, and guessing,
 * leaves it out in a cell, and keeps it beside a table
 */
const withCellEdges = (stack: readonly Block[], reader: Reader): readonly Block[] =>
    stack.map((block, index) => {
        if (block.type !== "table") {
            return block;
        }
        const before = stack[index - 1];
        const after = stack[index + 1];
        const rowEnd = { style: reader.styles.defaultParagraphStyle };
        let unseen = false;
        /** Whether a paragraph's space on one side is left out, next to what is there, and whether that was seen */
        const leavesOut = (paragraph: Block | undefined, side: "before" | "after", next: NextToCell, seen: boolean): boolean => {
            if (paragraph?.type !== "paragraph" || paragraph.format.contextualSpacing !== true || next === NOTHING_NEXT) {
                return false;
            }
            const { spaceBefore = 0, spaceAfter = 0, autoSpaceBefore, autoSpaceAfter } = paragraph.format;
            const space = side === "before" ? spaceBefore > 0 || autoSpaceBefore === true : spaceAfter > 0 || autoSpaceAfter === true;
            const same = next !== UNKNOWN_NEXT && next.style === paragraph.style;
            unseen ||= space && !seen && (same || next === UNKNOWN_NEXT);
            return space && same;
        };
        // Above the first cell, the paragraph before the table, or, after another table, the end of its last row. Nothing
        // is above one at the start of the document, a header or a note, but what is above one at the start of a cell isn't
        // known, nor which of the paragraphs left out before it, which take no room, Word compares it with
        const above: NextToCell =
            before === undefined
                ? reader.inCell
                    ? UNKNOWN_NEXT
                    : NOTHING_NEXT
                : before.type === "table"
                  ? rowEnd
                  : before.hiddenAfter === undefined
                    ? { style: before.style }
                    : UNKNOWN_NEXT;
        const rows = block.rows.map((row, rowIndex) => ({
            ...row,
            cells: row.cells.map((cell, cellIndex) => {
                const first = rowIndex === 0 && cellIndex === 0;
                const end = cellIndex === row.cells.length - 1;
                const nextAbove = cellIndex > 0 ? endOf(row.cells[cellIndex - 1].blocks, "last") : first ? above : rowEnd;
                const nextBelow = end ? rowEnd : endOf(row.cells[cellIndex + 1].blocks, "first");
                const leftOut = {
                    before: leavesOut(cell.blocks[0], "before", nextAbove, first && above !== UNKNOWN_NEXT && before?.type !== "table"),
                    after: leavesOut(cell.blocks[cell.blocks.length - 1], "after", nextBelow, end),
                };
                if (!leftOut.before && !leftOut.after) {
                    return cell;
                }
                const last = cell.blocks.length - 1;
                const blocks = cell.blocks.map((one, at) => {
                    const own = {
                        ...(at === 0 && leftOut.before ? { before: true } : {}),
                        ...(at === last && leftOut.after ? { after: true } : {}),
                    };
                    return one.type === "paragraph" && Object.keys(own).length > 0 ? { ...one, leftOut: own } : one;
                });
                return { ...cell, blocks };
            }),
        }));
        // The paragraphs around the table, which Word may compare with its first paragraph and the end of its last row
        leavesOut(before, "after", endOf(block.rows[0]?.cells[0]?.blocks ?? [], "first"), false);
        leavesOut(after, "before", rowEnd, false);
        const unsupported = block.unsupported ?? (unseen ? CONTEXTUAL_EDGE : undefined);
        return { ...block, rows, ...withoutUndefined({ unsupported }) };
    });

/** The headers or footers a section refers to, by the pages they are on */
const readReferences = (
    properties: readonly XmlObject[],
    name: "w:headerReference" | "w:footerReference",
    readPart: (id: string) => readonly Block[] | undefined,
): HeadersOrFooters =>
    Object.fromEntries(
        properties
            .filter((child) => name in child)
            .map((child) => {
                const attributes = attributesOf(child[name]);
                return [String(attributes["w:type"] ?? "default"), readPart(String(attributes["r:id"]))] as const;
            })
            .filter(([type, blocks]) => blocks !== undefined && ["default", "first", "even"].includes(type)),
    );

// The space between columns when a section doesn't give it: half an inch
const DEFAULT_COLUMN_SPACE = 36;

/**
 * The width of each of a section's columns (`w:cols`), from the width of its page's text: columns of the same width with
 * the same space between them, unless the section gives each column's width.
 */
const readColumns = (element: unknown, width: number): readonly number[] => {
    const attributes = attributesOf(element);
    const given = childrenOf(element).filter((child) => "w:col" in child);
    if (isOff(attributes["w:equalWidth"]) && given.length > 0) {
        return given.map((column) => twips(attributesOf(column["w:col"])["w:w"]) ?? 0);
    }
    const count = Math.max(1, numberOf(attributes["w:num"]) ?? 1);
    const space = twips(attributes["w:space"]) ?? DEFAULT_COLUMN_SPACE;
    return Array.from({ length: count }, () => (width - space * (count - 1)) / count);
};

/** The document's settings that change where its pages' text is: the gutter at the top, and margins mirrored */
type PageSettings = { readonly gutterAtTop: boolean; readonly mirrorMargins: boolean };

// `w:charSpace` is in 4096ths of a point
const CHARACTER_SPACE_UNITS = 4096;

/** How wide a section's pages are, and their margins and gutter across them, in points */
const pageAcross = (
    properties: readonly XmlObject[],
): { readonly pageWidth: number; readonly left: number; readonly right: number; readonly gutter: number } => {
    const margins = attributesOf(find(properties, "w:pgMar"));
    return {
        pageWidth: twips(attributesOf(find(properties, "w:pgSz"))["w:w"]) ?? DEFAULT_SECTION.pageWidth,
        left: twips(margins["w:left"] ?? margins["w:start"]) ?? DEFAULT_SECTION.marginLeft,
        right: twips(margins["w:right"] ?? margins["w:end"]) ?? DEFAULT_SECTION.marginRight,
        gutter: twips(margins["w:gutter"]) ?? DEFAULT_SECTION.gutter,
    };
};

/** How wide a section's text is: its page's, less its margins and a gutter beside it */
const textWidthOf = (properties: readonly XmlObject[], gutterAtTop: boolean): number => {
    const { pageWidth, left, right, gutter } = pageAcross(properties);
    return pageWidth - left - right - (gutterAtTop ? 0 : gutter);
};

/**
 * Reads a section's document grid (`w:docGrid`), or why it isn't followed yet. A grid of lines (`lines`) puts the lines
 * of its paragraphs on lines of its pitch (`w:linePitch`), whatever its `w:charSpace`, and one without a pitch does nothing
 * (scripts/layout-probes/word-grid.ts G13, word-grid3.ts H1). A grid of lines and characters (`linesAndChars`) adds
 * `w:charSpace` after each character too, and one that snaps to characters (`snapToChars`) puts them in cells: as many
 * as fit across a column at the size of the Normal style's text and `w:charSpace` more, spread evenly across it. On 9026
 * twips at 10.5 points and a point more, 39 cells of 231.44 twips, at 12 points (the Normal style's, over the document's
 * default of 10.5) 37 of 243.95, and in columns of 4153 at 10.5, 19 of 218.58 (CC1, CD1, `word-grid2.docx` E1, H7b). The
 * document's grid of no type (`default`) is no grid, whatever its pitch.
 */
const readGrid = (element: unknown, normalSize: number, { gutterAtTop }: PageSettings): TextGrid | string | undefined => {
    const properties = childrenOf(element);
    const attributes = attributesOf(find(properties, "w:docGrid"));
    const type = attributes["w:type"];
    if (type !== "lines" && type !== "linesAndChars" && type !== "snapToChars") {
        return undefined;
    }
    const pitch = twips(attributes["w:linePitch"]);
    const linePitch = pitch !== undefined && pitch > 0 ? pitch : undefined;
    if (type === "lines") {
        return linePitch === undefined ? undefined : { linePitch };
    }
    if (linePitch === undefined) {
        return "a document grid of characters without the pitch of its lines";
    }
    const space = (numberOf(attributes["w:charSpace"]) ?? 0) / CHARACTER_SPACE_UNITS;
    if (type === "linesAndChars") {
        return { linePitch, ...(space === 0 ? {} : { characterSpace: space }) };
    }
    const columns = readColumns(find(properties, "w:cols"), textWidthOf(properties, gutterAtTop));
    if (columns.some((width) => width !== columns[0])) {
        return "a document grid that snaps to characters in columns of different widths";
    }
    const cells = normalSize + space > 0 ? Math.floor(columns[0] / (normalSize + space)) : 0;
    return cells < 1 ? "a document grid of characters with no room for one" : { linePitch, characterPitch: columns[0] / cells };
};

/**
 * Reads a section's properties (`w:sectPr`): its pages, how it starts, and its headers and footers. A section that
 * doesn't give a header or footer for a kind of page has the one of the section before. Its gutter is beside the text,
 * or above it when the document puts it at the top, which takes the room from the page's height, as Word does
 * (`word-watertight-settings.docx` ST3).
 */
const readSection = (
    element: unknown,
    readPart: (id: string) => readonly Block[] | undefined,
    previous: Section | undefined,
    { gutterAtTop, mirrorMargins }: PageSettings,
    grid: TextGrid | string | undefined,
): Section => {
    const properties = childrenOf(element);
    const size = attributesOf(find(properties, "w:pgSz"));
    const margins = attributesOf(find(properties, "w:pgMar"));
    const numbering = attributesOf(find(properties, "w:pgNumType"));
    const start = valueOf(properties, "w:type");
    const format = stringOf(numbering["w:fmt"]) ?? "decimal";
    const firstNumber = numberOf(numbering["w:start"]);
    const chapterLevel = numberOf(numbering["w:chapStyle"]);
    const { pageWidth, left: marginLeft, right: marginRight, gutter } = pageAcross(properties);
    const marginTop = twips(margins["w:top"]) ?? DEFAULT_SECTION.marginTop;
    const columns = readColumns(find(properties, "w:cols"), textWidthOf(properties, gutterAtTop));
    // Where Word puts a gutter at the top with mirrored margins, which put it on the inside of each page, or below a
    // negative top margin, which the header doesn't push the text below, isn't known
    const direction = valueOf(properties, "w:textDirection");
    const down = downOf(properties);
    const sectionStart = start !== undefined && START_TYPES.has(start as Section["start"]) ? (start as Section["start"]) : "nextPage";
    const marginBottom = twips(margins["w:bottom"]) ?? DEFAULT_SECTION.marginBottom;
    const unsupported =
        typeof grid === "string"
            ? grid
            : formatPageNumber(1, format) === undefined
              ? "page numbers in a format not yet written"
              : direction !== undefined && !HORIZONTAL_PAGES.has(direction) && down === undefined
                ? "text in a direction not yet followed"
                : down !== undefined && (gutter !== 0 || mirrorMargins || columns.length > 1 || Math.min(marginTop, marginBottom) < 0)
                  ? "text that runs down the page with a gutter, mirrored margins, columns or a negative margin"
                  : previous?.textRunsDown !== undefined && (sectionStart === "continuous" || sectionStart === "nextColumn")
                    ? "a continuous section break after text that runs down the page"
                    : // A grid that snaps to characters measures its cells across the page, where these lines run down it, in a
                      // way Word's PDFs haven't shown
                      down !== undefined && typeof grid === "object" && grid.characterPitch !== undefined
                      ? "a document grid that snaps to characters on text that runs down the page"
                      : find(properties, "w15:footnoteColumns") !== undefined
                        ? "footnotes in columns of their own"
                        : gutterAtTop && gutter !== 0 && (mirrorMargins || marginTop < 0)
                          ? "a gutter at the top with mirrored margins or a negative top margin"
                          : unknownLengthIn(element);
    const headers = readReferences(properties, "w:headerReference", readPart);
    const footers = readReferences(properties, "w:footerReference", readPart);
    const section: Section = {
        pageWidth,
        pageHeight: twips(size["w:h"]) ?? DEFAULT_SECTION.pageHeight,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        header: twips(margins["w:header"]) ?? DEFAULT_SECTION.header,
        footer: twips(margins["w:footer"]) ?? DEFAULT_SECTION.footer,
        gutter: gutterAtTop ? 0 : gutter,
        topGutter: gutterAtTop ? gutter : 0,
        // Text that runs down the page starts a new page after text across one, as a continuous section too
        // (scripts/layout-probes/word-vertical.ts V13)
        start: down !== undefined && sectionStart === "continuous" ? "nextPage" : sectionStart,
        titlePage: onOff(properties, "w:titlePg") === true,
        columns,
        numberFormat: format,
        ...(chapterLevel === undefined || chapterLevel < 1 || chapterLevel > 9
            ? {}
            : { chapters: { level: chapterLevel, separator: CHAPTER_SEPARATORS[String(numbering["w:chapSep"])] ?? "-" } }),
        ...(firstNumber === undefined ? {} : { firstNumber }),
        headers: { ...previous?.headers, ...headers },
        footers: { ...previous?.footers, ...footers },
        ...(unsupported ? { unsupported } : {}),
    };
    return down === undefined ? section : turned(section, down);
};

/**
 * A section whose text runs down the page, with its page turned on its side, so that its lines run along it: from its top
 * margin to its bottom one, as long as the page's text is tall, and across it from the right margin, or the left, each as
 * far from the one before as it is tall, as Word lays them out (scripts/layout-probes/word-vertical.ts V1, V2, V6, V7).
 * Its header and footer stay across the top and bottom of the page, and a header doesn't push its lines down (VH1)
 */
const turned = (section: Section, textRunsDown: "fromRight" | "fromLeft"): Section => ({
    ...section,
    pageWidth: section.pageHeight,
    pageHeight: section.pageWidth,
    marginLeft: section.marginTop,
    marginRight: section.marginBottom,
    marginTop: textRunsDown === "fromLeft" ? section.marginLeft : section.marginRight,
    marginBottom: textRunsDown === "fromLeft" ? section.marginRight : section.marginLeft,
    columns: [section.pageHeight - section.marginTop - section.marginBottom],
    textRunsDown,
});

// How a list's number lines up at the start of its paragraph's first line (`w:lvlJc`), when not to the left, which is
// how Word lines it up when the level doesn't say. Word's own lists are aligned to the left, the centre or the right, as
// docx writes them, and transitional documents may write the start and end of the line for left and right. The schema's
// other values are a paragraph's alignments, which a number on its own doesn't have, and Word lines it up to the left
// with them, as with none
const NUMBER_ALIGNMENTS: Readonly<Record<string, NumberingLevel["alignment"]>> = {
    left: undefined,
    start: undefined,
    both: undefined,
    distribute: undefined,
    numTab: undefined,
    lowKashida: undefined,
    mediumKashida: undefined,
    highKashida: undefined,
    thaiDistribute: undefined,
    center: "center",
    right: "right",
    end: "right",
};

/**
 * Reads a level of a list (`w:lvl`), in a definition or in a list's override of it. It says why Word's way with it isn't
 * followed, when it isn't: a number aligned in a way the schema doesn't have, bullets that are pictures
 * (`w:lvlPicBulletId`), and numbers laid out as Word 6 laid them out (`w:legacy`).
 */
const readLevel = (element: unknown, styles: TextStyles): { readonly index: number; readonly level: NumberingLevel } => {
    const children = childrenOf(element);
    const jc = valueOf(children, "w:lvlJc") ?? "left";
    const restart = numberOf(attributesOf(find(children, "w:lvlRestart"))["w:val"]);
    const unsupported = !(jc in NUMBER_ALIGNMENTS)
        ? "a list number aligned in a way not yet followed"
        : find(children, "w:lvlPicBulletId") !== undefined
          ? "a list whose bullets are pictures"
          : isOn(attributesOf(find(children, "w:legacy"))["w:legacy"])
            ? "a list numbered as Word 6 numbered lists"
            : undefined;
    return {
        index: numberOf(attributesOf(element)["w:ilvl"]) ?? 0,
        level: {
            ...withoutUndefined({ style: valueOf(children, "w:pStyle") }),
            format: valueOf(children, "w:numFmt") ?? "decimal",
            text: stringOf(attributesOf(find(children, "w:lvlText"))["w:val"]) ?? "",
            suffix: valueOf(children, "w:suff") ?? "tab",
            // A level that doesn't give its first number starts at 0
            start: numberOf(attributesOf(find(children, "w:start"))["w:val"]) ?? 0,
            ...withoutUndefined({
                alignment: NUMBER_ALIGNMENTS[jc],
                restart,
                legal: onOff(children, "w:isLgl") === true ? true : undefined,
                unsupported,
            }),
            paragraph: readParagraphFormat(find(children, "w:pPr")),
            run: readRunFormat(find(children, "w:rPr"), styles.themeFonts),
        },
    };
};

/** Levels by their indexes, from levels read in any order */
const byIndex = (levels: readonly { readonly index: number; readonly level: NumberingLevel }[]): readonly NumberingLevel[] =>
    levels.reduce<readonly NumberingLevel[]>((all, { index, level }) => {
        const copy = [...all];
        // eslint-disable-next-line functional/immutable-data
        copy[index] = level;
        return copy;
    }, []);

/**
 * Reads each list in the document's numbering (`w:numbering`), by the ids its paragraphs refer to it by: its number,
 * and any other name it has, such as the placeholder docx writes before it is given one. A list (`w:num`) is made from a
 * definition (`w:abstractNum`), and may give its own first number for a level (`w:startOverride`), or a level of its own
 * in place of the definition's (`w:lvl`), in an override (`w:lvlOverride`).
 */
const readNumbering = (
    xml: XmlObject | undefined,
    styles: TextStyles,
    otherIds: ReadonlyMap<string, string>,
): { readonly lists: ReadonlyMap<string, NumberingList>; readonly unsupported?: string } => {
    const root = childrenOf(xml?.["w:numbering"]);
    const read = new Map(
        root
            .filter((child) => "w:abstractNum" in child)
            .map((child) => {
                const children = childrenOf(child["w:abstractNum"]);
                const levels = byIndex(children.filter((level) => "w:lvl" in level).map((level) => readLevel(level["w:lvl"], styles)));
                const link = valueOf(children, "w:numStyleLink");
                return [String(attributesOf(child["w:abstractNum"])["w:abstractNumId"]), { levels, link }] as const;
            }),
    );
    /** A list (`w:num`) by its number */
    const listElement = (id: string | undefined): readonly XmlObject[] | undefined => {
        const element = root.find((child) => "w:num" in child && String(attributesOf(child["w:num"])["w:numId"]) === id);
        return element && childrenOf(element["w:num"]);
    };
    const definitionIdOf = (list: readonly XmlObject[]): string => String(numberOf(attributesOf(find(list, "w:abstractNumId"))["w:val"]));
    /**
     * Each definition by its id, with the id it numbers by. One that takes its levels from a list style (`w:numStyleLink`)
     * has none of its own: they are those of the definition the style's list is made from, which lists made from either
     * count together, as the standard has it. It says why where that isn't found, or where the style's list
     * gives levels of its own, which may be the style's too
     */
    const definitions = new Map<string, { readonly id: string; readonly levels: readonly NumberingLevel[]; readonly unsupported?: string }>(
        [...read].map(([id, { levels, link }]) => {
            if (link === undefined) {
                return [id, { id, levels }] as const;
            }
            const style = styles.styles.get(link);
            const list = style?.type === "numbering" ? listElement(style.numbering?.id) : undefined;
            const linked = list && read.get(definitionIdOf(list));
            const unsupported =
                linked === undefined || linked.link !== undefined
                    ? "a list defined by a list style that isn't found"
                    : list!.some((child) => "w:lvlOverride" in child)
                      ? "a list defined by a list style whose own list gives levels of its own"
                      : undefined;
            return [
                id,
                unsupported === undefined ? { id: definitionIdOf(list!), levels: linked!.levels } : { id, levels, unsupported },
            ] as const;
        }),
    );
    // Each list refers to one of the definitions
    const lists = new Map(
        root
            .filter((child) => "w:num" in child)
            .flatMap((child) => {
                const children = childrenOf(child["w:num"]);
                const found = definitions.get(definitionIdOf(children));
                if (!found) {
                    return [];
                }
                const definition = found.id;
                // An override names its level, which the schema requires, so one that doesn't overrides nothing
                const overrides = children.flatMap((override) => {
                    const index = numberOf(attributesOf(override["w:lvlOverride"])["w:ilvl"]);
                    return "w:lvlOverride" in override && index !== undefined
                        ? [{ index, children: childrenOf(override["w:lvlOverride"]) }]
                        : [];
                });
                const own = overrides.flatMap(({ index, children: given }) => {
                    const level = find(given, "w:lvl");
                    return level === undefined ? [] : [{ ...readLevel(level, styles), index }];
                });
                const levels = byIndex([...found.levels.map((level, index) => ({ index, level })), ...own]);
                // A level it gives starts at its own first number too, as Word starts it, unless the list gives another:
                // in roman numerals from 3, between paragraphs of a list in decimal, III and IV, then 5
                // (scripts/layout-probes/word-lists.ts LO7). An override that gives neither starts nothing again (LO9)
                const starts = new Map(
                    overrides.flatMap(({ index, children: given }) => {
                        const level = childrenOf(find(given, "w:lvl"));
                        const start =
                            numberOf(attributesOf(find(given, "w:startOverride"))["w:val"]) ??
                            numberOf(attributesOf(find(level, "w:start"))["w:val"]);
                        return start === undefined ? [] : [[index, start] as const];
                    }),
                );
                const list: NumberingList = {
                    levels,
                    definition,
                    shared: found.levels,
                    starts,
                    ...withoutUndefined({ unsupported: found.unsupported }),
                };
                return [[String(attributesOf(child["w:num"])["w:numId"]), list] as const];
            }),
    );
    return {
        lists: new Map([
            ...lists,
            ...[...otherIds].flatMap(([other, id]) => {
                const list = lists.get(id);
                return list ? [[other, list] as const] : [];
            }),
        ]),
        ...withoutUndefined({ unsupported: unknownLengthIn(xml) }),
    };
};

// The compatibility mode of Word 2013 and later, which lay out pages as Word does today. A document in an older one, or
// without one, is laid out as that version of Word laid it out
const CURRENT_COMPATIBILITY_MODE = 15;

// The application Word's own compatibility settings (`w:compatSetting`) are for. Those for other applications are theirs
const WORD_SETTINGS = "http://schemas.microsoft.com/office/word";

// The compatibility settings of the schema (`w:compat`) that are followed: automatic spacing as HTML has it
const FOLLOWED_COMPATIBILITY = new Set(["w:doNotUseHTMLParagraphAutoSpacing"]);

// The schema's compatibility settings Word lays out lines with in compatibility mode 15 as it does without them, though
// they ask for an older Word's or another application's layout: Word laid out the same probes alike with each group of them
// on and without them (`word-compat-settings.docx` CP1 to CP19). Those of line heights moved at most the text inside a line
// of exact height, not the line (`-heights`, CP2, CP14, CP15), those of letters, spaces and justification left at most a
// justified line that ends with a line break not stretched, broken where it was (`-latin`, CP8b), and those of tabs, lists,
// indents and borders (`-paragraphs`), of tables (`-tables`), of columns and footnotes (`-columns`), and of printing,
// fields, shapes and text boxes (`-other`) changed nothing. Of the groups that changed lines, the top and foot of pages
// and East Asian text, each setting but `suppressTopSpacing` and `useFELayout` changed nothing on its own
// (`word-compat-settings2.docx` and one document for each setting, CP1 to CP20)
// cspell:ignore Punct conv Txbx
const COMPATIBILITY_LINES_ALIKE = new Set(
    [
        // -heights
        "noLeading",
        "noExtraLineSpacing",
        "truncateFontHeightsLikeWP6",
        "usePrinterMetrics",
        "subFontBySize",
        "adjustLineHeightInTable",
        "noSpaceRaiseLower",
        "spaceForUL",
        "ulTrailSpace",
        // -latin
        "spacingInWholePoints",
        "wpSpaceWidth",
        "mwSmallCaps",
        "useAnsiKerningPairs",
        "wrapTrailSpaces",
        "doNotExpandShiftReturn",
        "wpJustification",
        // -paragraphs
        "noTabHangInd",
        "forgetLastTabAlignment",
        "doNotUseIndentAsNumberingTabStop",
        "underlineTabInNumList",
        "useNormalStyleForList",
        "allowSpaceOfSameStyleInTable",
        "doNotSuppressIndentation",
        "doNotSuppressParagraphBorders",
        "swapBordersFacingPages",
        // -tables
        "useSingleBorderforContiguousCells",
        "alignTablesRowByRow",
        "layoutRawTableWidth",
        "layoutTableRowsApart",
        "useWord2002TableStyleRules",
        "growAutofit",
        "doNotAutofitConstrainedTables",
        "autofitToFirstFixedWidthCell",
        "doNotBreakConstrainedForcedTable",
        "doNotVertAlignCellWithSp",
        "doNotSnapToGridInCell",
        "doNotBreakWrappedTables",
        // -columns
        "noColumnBalance",
        "cachedColBalance",
        "footnoteLayoutLikeWW8",
        // -pages, each alone
        "suppressBottomSpacing",
        "suppressTopSpacingWP",
        "suppressSpacingAtTopOfPage",
        "suppressSpBfAfterPgBrk",
        "splitPgBreakAndParaMark",
        // -east-asian, each alone
        "balanceSingleByteDoubleByteWidth",
        "doNotLeaveBackslashAlone",
        "displayHangulFixedWidth",
        "autoSpaceLikeWord95",
        "lineWrapLikeWord6",
        "useWord97LineBreakRules",
        "applyBreakingRules",
        "doNotWrapTextWithPunct",
        "doNotUseEastAsianBreakRules",
        "useAltKinsokuLineBreakRules",
        // -other
        "printBodyTextBeforeHeader",
        "printColBlack",
        "showBreaksInFrames",
        "convMailMergeEsc",
        "shapeLayoutLikeWW8",
        "selectFldWithFirstOrLastChar",
        "doNotVertAlignInTxbx",
    ].map((name) => `w:${name}`),
);

// Word's own compatibility settings known to leave its lines in compatibility mode 15 as they are, on or off: those Word
// 16 writes in every document it makes, so in every template and document Word saved. Word laid out the same document
// alike with them all on and without them (`word-compat-on.docx` and `word-compat-off.docx`): a paragraph's size and
// alignment from its style over its table style's, as the standard has them, with
// `overrideTableStyleFontSizeAndJustification` or without it (CS1, and `word-watertight-settings.docx` ST2), a table
// style's parts in a header of several rows, which `differentiateMultirowTableHeaders` is about (CS2), kerning, ligatures
// and figures spaced proportionally, which `enableOpenTypeFeatures` turns on (CS3), and a line that ends at a hyphen at the
// foot of a page (CS4), which `useWord2013TrackBottomHyphenation` moves only when hyphenation made the hyphen, and the
// layout stops at any line Word may hyphenate. `doNotFlipMirrorIndents` swaps a mirrored paragraph's indents, which
// leaves its lines as long. Its other two, which are off unless they are given, Word laid out alike on and off
// (`word-compat-settings-other.docx`): `allowHyphenationAtTrackBottom` lets Word hyphenate the last line of a page,
// where the layout stops at a word Word may hyphenate all the same, and `allowTextAfterFloatingTableBreak` is about
// tables text flows around, which it stops at
const WORD_SETTINGS_LINES_ALIKE = new Set([
    "compatibilityMode",
    "overrideTableStyleFontSizeAndJustification",
    "enableOpenTypeFeatures",
    "doNotFlipMirrorIndents",
    "differentiateMultirowTableHeaders",
    "useWord2013TrackBottomHyphenation",
    "allowHyphenationAtTrackBottom",
    "allowTextAfterFloatingTableBreak",
]);

/**
 * The attributes of Word's own compatibility settings (`w:compatSetting`) among a document's: those for Word's application,
 * or for none, rather than another application's
 */
const wordSettingsOf = (compatibility: readonly XmlObject[]): readonly XmlObject[] =>
    compatibility
        .filter((child) => "w:compatSetting" in child)
        .map((child) => attributesOf(child["w:compatSetting"]))
        .filter(({ "w:uri": uri = WORD_SETTINGS }) => uri === WORD_SETTINGS);

/**
 * Whether a document's compatibility settings (`w:compat`) ask Word to lay it out in a way not yet followed: a setting of
 * the schema that is on, other than `w:doNotUseHTMLParagraphAutoSpacing`, which is followed, and those known to leave its
 * lines as they are, or one of Word's own (`w:compatSetting`) other than those known to leave its lines as they are, on
 * or off. Each changes how Word lays out lines, or may, in ways not yet followed.
 */
const asksForUnfollowedCompatibility = (compatibility: readonly XmlObject[]): boolean =>
    compatibility.some((child) => {
        const name = nameOf(child);
        return (
            name !== "w:compatSetting" &&
            !FOLLOWED_COMPATIBILITY.has(name) &&
            !COMPATIBILITY_LINES_ALIKE.has(name) &&
            onOff([child], name) === true
        );
    }) || wordSettingsOf(compatibility).some(({ "w:name": setting }) => !WORD_SETTINGS_LINES_ALIKE.has(String(setting)));

/**
 * The document's own lists of the characters that can't start a line (`w:noLineBreaksBefore`) and can't end one
 * (`w:noLineBreaksAfter`), which take the place of Word's for their language.
 */
const readKinsokuLists = (settings: readonly XmlObject[]): NonNullable<LineBreakRules["lists"]> =>
    settings.reduce<NonNullable<LineBreakRules["lists"]>>((lists, child) => {
        const name = nameOf(child);
        const attributes = attributesOf(child[name]);
        const language = kinsokuLanguageOf(stringOf(attributes["w:lang"]));
        if ((name !== "w:noLineBreaksBefore" && name !== "w:noLineBreaksAfter") || language === undefined) {
            return lists;
        }
        const list: KinsokuList = { [name === "w:noLineBreaksBefore" ? "noLineStart" : "noLineEnd"]: String(attributes["w:val"] ?? "") };
        return { ...lists, [language]: { ...lists[language], ...list } };
    }, {});

/**
 * How Word may hyphenate a run's words when the document hyphenates: not at all in text not checked for spelling or in no
 * language (`word-hyphenation.docx` HY7), by its English dictionary in English, or in no language given, which Word for
 * Mac hyphenates as English (HY1a to HY1c), and otherwise by a dictionary it hasn't been seen using.
 */
const hyphenationOf = ({ noProof, language }: RunFormat): { readonly hyphenation?: "none" | "unknown" } => {
    if (noProof === true || language?.toLowerCase() === "zxx") {
        return { hyphenation: "none" };
    }
    return language === undefined || /^en(-|$)/i.test(language) ? {} : { hyphenation: "unknown" };
};

/**
 * The settings of Word's automatic hyphenation: whether words in capitals are left whole (`w:doNotHyphenateCaps`). The
 * hyphenation zone (`w:hyphenationZone`) Word doesn't keep in compatibility mode 15 (`word-hyphenation-zone.docx`), and the
 * most lines in a row that end with a hyphen (`w:consecutiveHyphenLimit`) only leaves whole words Word could otherwise
 * hyphenate, which the layout stops at all the same (`word-hyphenation-limit.docx` HY9c). Lines broken at soft hyphens it
 * leaves as they are (`word-hyphenation-manual.docx` HY9a).
 */
const readHyphenation = (settings: readonly XmlObject[]): Hyphenation =>
    onOff(settings, "w:doNotHyphenateCaps") === true ? { capitalsWhole: true } : {};

/**
 * Why a document's equations can't be laid out as Word does for its maths settings (`m:mathPr`), when they say what isn't
 * followed: a maths font other than Cambria Math, whose widths aren't known, and margins or space around equations shown
 * on lines of their own, which haven't been seen. Word writes Cambria Math and margins of 0. Its other maths settings are
 * of what the layout stops at anyway, such as how an equation is broken or built up, or line an equation up on its line.
 */
const readMathsSettings = (settings: readonly XmlObject[]): string | undefined => {
    const maths = childrenOf(find(settings, "m:mathPr"));
    const valueIn = (name: string): string | undefined => stringOf(attributesOf(find(maths, name))["m:val"]);
    if ((valueIn("m:mathFont") ?? "Cambria Math") !== "Cambria Math") {
        return "an equation in a maths font other than Cambria Math";
    }
    return ["m:lMargin", "m:rMargin", "m:preSp", "m:postSp"].some((name) => (numberOf(valueIn(name)) ?? 0) !== 0)
        ? "an equation in a document whose maths settings give equations on lines of their own margins or space around them"
        : undefined;
};

/**
 * Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
 */
const readSettings = (
    xml: XmlObject | undefined,
): Pick<
    DocumentContent,
    "defaultTabStop" | "evenAndOddHeaders" | "addsParagraphSpacing" | "breakRules" | "hyphenation" | "unsupported"
> => {
    const settings = childrenOf(xml?.["w:settings"]);
    const compatibility = childrenOf(find(settings, "w:compat"));
    const lists = readKinsokuLists(settings);
    const spacingControl = valueOf(settings, "w:characterSpacingControl");
    // Word's own, as another application's may have the same name
    const mode = numberOf(wordSettingsOf(compatibility).find(({ "w:name": setting }) => setting === "compatibilityMode")?.["w:val"]);
    // Word's strict rules, and its compression of punctuation, aren't known yet. Pages printed folded as a booklet, or two
    // to a sheet, are half the paper, and Word updates a document's styles from its template when it opens it, with
    // `w:linkStyles`
    const unsupported =
        (
            [
                [onOff(settings, "w:strictFirstAndLastChars"), "the strict rules for the characters that can't start a line"],
                [spacingControl !== undefined && spacingControl !== "doNotCompress", "punctuation compressed"],
                [mode === undefined || mode < CURRENT_COMPATIBILITY_MODE, "a document in compatibility mode"],
                [asksForUnfollowedCompatibility(compatibility), "a compatibility setting not yet followed"],
                [onOff(settings, "w:bookFoldPrinting") || onOff(settings, "w:bookFoldRevPrinting"), "pages printed as a folded booklet"],
                [onOff(settings, "w:printTwoOnOne"), "two pages printed on each sheet"],
                [onOff(settings, "w:linkStyles"), "styles updated from the document's template when Word opens it"],
            ] as const
        ).find(([applies]) => applies === true)?.[1] ?? unknownLengthIn(settings);
    return {
        defaultTabStop: twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"]) ?? 36,
        evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
        addsParagraphSpacing: onOff(compatibility, "w:doNotUseHTMLParagraphAutoSpacing") === true,
        ...(Object.keys(lists).length > 0 ? { breakRules: { lists } } : {}),
        ...(onOff(settings, "w:autoHyphenation") === true ? { hyphenation: readHyphenation(settings) } : {}),
        ...(unsupported ? { unsupported } : {}),
    };
};

/**
 * The parts of a document other than its body that it is read with, as elements formatted as docx writes them: those of
 * a document being written, or those of a .docx (see `read-docx.ts`).
 */
export type DocumentParts = {
    /** Its defaults and styles, with the fonts of its theme */
    readonly styles: TextStyles;
    /** Its numbering (`w:numbering`), if it has any */
    readonly numbering?: XmlObject;
    /** Other ids its lists are referred to by, with the number of the list each is: the placeholders docx writes */
    readonly otherListIds?: ReadonlyMap<string, string>;
    /** Its settings (`w:settings`), if it has any */
    readonly settings?: XmlObject;
    /** The content of each header and footer, by the id of the relationship to it: its attributes, paragraphs and tables */
    readonly headersAndFooters: ReadonlyMap<string, readonly unknown[]>;
    /** Its footnotes (`w:footnotes`), if it has any */
    readonly footnotes?: XmlObject;
    /** Its endnotes (`w:endnotes`), if it has any */
    readonly endnotes?: XmlObject;
    /** The faces of the fonts it embeds */
    readonly fonts?: readonly FontFace[];
    /** The stores of data its content controls may be bound to: its custom XML and its properties */
    readonly dataStores?: DataStores;
};

/**
 * A font file a document embeds, with the name it gives the font, and which of its faces the file is.
 */
export type EmbeddedFont = {
    readonly name: string;
    readonly data: FontData;
    readonly bold: boolean;
    readonly italic: boolean;
};

/**
 * The faces of the fonts a document embeds, which Word draws text in those fonts in. Each is the face of the font the
 * document names, of the boldness and italics the document says it is (`w:embedRegular`, `w:embedBold` and the others),
 * whatever its file says. A file that isn't a font, is damaged, or is a collection of no fonts, is left out, so text in
 * its font is in a font the layout doesn't know, as it may not be in Word.
 */
export const facesOf = (fonts: readonly EmbeddedFont[]): readonly FontFace[] =>
    fonts.flatMap(({ name, data, bold, italic }) => {
        try {
            // The first face of a collection, which may have none
            const [face] = readFontFile(data);
            return face === undefined ? [] : [{ ...face, name, bold, italic }];
        } catch {
            return [];
        }
    });

/**
 * The parts of the document being written, formatted to be read.
 */
const partsOfFile = (context: IContext): DocumentParts => {
    const { file } = context;
    const styles = getTextStyles(context);
    // The lists that styles number their paragraphs in are added to the document as its styles are written, after its
    // body, so they are added now to be read
    for (const style of styles.styles.values()) {
        const placeholder = /^\{(.+)-(\d+)\}$/.exec(style.numbering?.id ?? "");
        if (placeholder) {
            file.Numbering.createConcreteNumberingInstance(placeholder[1], Number(placeholder[2]));
        }
    }
    // Formatting a part needs a context with the part in it
    const format = (wrapper: { readonly View: { readonly prepForXml: (context: IContext) => unknown } }): XmlObject =>
        wrapper.View.prepForXml({ ...context, viewWrapper: wrapper as unknown as IContext["viewWrapper"], stack: [] }) as XmlObject;
    return {
        styles,
        numbering: file.Numbering.prepForXml(READING_CONTEXT) as XmlObject,
        // docx writes a placeholder for each list in the paragraphs, before it is given its number
        otherListIds: new Map(
            file.Numbering.ConcreteNumbering.map((concrete) => [`{${concrete.reference}-${concrete.instance}}`, String(concrete.numId)]),
        ),
        settings: file.Settings.prepForXml(READING_CONTEXT) as XmlObject,
        // A header or footer is written with its attributes and its paragraphs and tables
        headersAndFooters: new Map(
            [...file.Headers, ...file.Footers].map(
                (wrapper) => [`rId${wrapper.View.ReferenceId}`, Object.values(format(wrapper))[0] as readonly unknown[]] as const,
            ),
        ),
        footnotes: format(file.FootNotes),
        endnotes: format(file.Endnotes),
        // docx embeds each font of its fonts option as the font's regular face
        fonts: facesOf(file.FontTable.options.map(({ name, data }) => ({ name, data, bold: false, italic: false }))),
    };
};

/**
 * How a document is read.
 */
export type ReadOptions = {
    /** Whether it is read to be laid out with a guess, past what can't be laid out as Word does (see the module's notes) */
    readonly guess?: boolean;
};

/**
 * Reads a document's body, as it is written, with its styles, lists, settings, headers and footers.
 *
 * @param body - The formatted body (`w:body`)
 * @param context - The context it was formatted in, with the document it is in
 */
export const readDocument = (body: IXmlableObject, context: IContext, options: ReadOptions = {}): DocumentContent =>
    readContent(body as XmlObject, partsOfFile(context), options);

/** How a document or a section numbers and places its footnotes or endnotes (`w:footnotePr`, `w:endnotePr`) */
type NoteProperties = { readonly format?: string; readonly start?: number; readonly restart?: string; readonly position?: string };

const readNoteProperties = (element: unknown): NoteProperties => {
    const children = childrenOf(element);
    return withoutUndefined({
        format: valueOf(children, "w:numFmt"),
        start: numberOf(attributesOf(find(children, "w:numStart"))["w:val"]),
        restart: valueOf(children, "w:numRestart"),
        position: valueOf(children, "w:pos"),
    });
};

// How Word numbers and places each kind of note where the document doesn't say: footnotes 1, 2, 3 at the bottom of the
// page, and endnotes i, ii, iii at the end of the document, each numbered on through it
const NOTE_DEFAULTS: Readonly<Record<NoteKind, Required<NoteProperties>>> = {
    footnote: { format: "decimal", start: 1, restart: "continuous", position: "pageBottom" },
    endnote: { format: "lowerRoman", start: 1, restart: "continuous", position: "docEnd" },
};

/** The section properties an element of the body ends a section with: the body's own, or a paragraph's */
const sectionPropertiesOf = (element: XmlObject): unknown => {
    const name = nameOf(element);
    if (name === "w:sectPr") {
        return element[name];
    }
    return name === "w:p" ? find(childrenOf(find(contentOf(element).filter(isObject), "w:pPr")), "w:sectPr") : undefined;
};

/**
 * Reads a document's body (`w:body`), with the other parts of the document.
 */
export const readContent = (writtenBody: XmlObject, writtenParts: DocumentParts, { guess = false }: ReadOptions = {}): DocumentContent => {
    // The content controls bound to custom XML whose text is already what Word fills them in with show what is written
    const stores = writtenParts.dataStores ?? new Map<string, XmlObject>();
    const body = withBoundTextWritten(writtenBody, stores);
    const parts: DocumentParts = {
        ...writtenParts,
        headersAndFooters: new Map([...writtenParts.headersAndFooters].map(([id, content]) => [id, withBoundTextWritten(content, stores)])),
        footnotes: withBoundTextWritten(writtenParts.footnotes, stores),
        endnotes: withBoundTextWritten(writtenParts.endnotes, stores),
    };
    const { styles } = parts;
    const { lists: numbering, unsupported: inNumbering } = readNumbering(parts.numbering, styles, parts.otherListIds ?? new Map());
    const listIds = parts.otherListIds ?? new Map<string, string>();
    // The markers at fields, numbered across the body and its notes
    const markers: FieldMarkers = { count: 0, relative: new Map() };
    const settings = childrenOf(parts.settings?.["w:settings"]);
    const decimalSymbol = valueOf(settings, "w:decimalSymbol");
    const maths = readMathsSettings(settings);
    const readerOf = (inHeader: boolean): Reader => ({
        styles,
        numbering,
        listIds,
        inHeader,
        markers,
        fields: [],
        counters: new Map(),
        ...(decimalSymbol === undefined ? {} : { decimalSymbol }),
        ...(maths === undefined ? {} : { maths }),
        ...(guess ? { guess } : {}),
    });
    const elements = unwrap(joinRemovedMarks(contentOf(body), styles, { nested: false, sized: false, part: "body" }), guess);

    // Each header and footer, the first time a section refers to it
    const headersAndFooters = new Map<string, readonly Block[] | undefined>();
    const readPart = (id: string): readonly Block[] | undefined => {
        if (!headersAndFooters.has(id)) {
            const content = parts.headersAndFooters.get(id);
            // eslint-disable-next-line functional/immutable-data
            headersAndFooters.set(id, content && readBlocks(content, readerOf(true)));
        }
        return headersAndFooters.get(id);
    };

    // The footnotes and endnotes, by their ids, and the separators above them
    const noteElements = (kind: NoteKind): ReadonlyMap<string, XmlObject> => {
        const xml = kind === "footnote" ? parts.footnotes : parts.endnotes;
        const notes = childrenOf(xml && Object.values(xml)[0]).filter((child) => `w:${kind}` in child);
        return new Map(
            notes.map((note) => {
                const attributes = attributesOf(note[`w:${kind}`]);
                const type = attributes["w:type"];
                return [String(type === "separator" || type === "continuationSeparator" ? type : attributes["w:id"]), note] as const;
            }),
        );
    };
    const notesByKind = { footnote: noteElements("footnote"), endnote: noteElements("endnote") };
    // The size of the Normal style's text, which a grid that snaps to characters measures its cells by
    const normalSize =
        fontOf(combine([styles.run, ...styleChain(styles, styles.defaultParagraphStyle, "paragraph").map(({ run }) => run)])).size ??
        DEFAULT_FONT_SIZE;
    const pageSettings: PageSettings = {
        gutterAtTop: onOff(settings, "w:gutterAtTop") === true,
        mirrorMargins: onOff(settings, "w:mirrorMargins") === true,
    };
    const grids = new Map<number, TextGrid | undefined>();
    const sameGrid = (one: TextGrid | undefined, other: TextGrid | undefined): boolean => JSON.stringify(one) === JSON.stringify(other);
    /** The document grid of a section, by its index, when it has one that is followed */
    const gridOf = (section: number): TextGrid | undefined => {
        if (!grids.has(section)) {
            const grid = readGrid(sectionElements[section], normalSize, pageSettings);
            // eslint-disable-next-line functional/immutable-data
            grids.set(section, typeof grid === "object" ? grid : undefined);
        }
        return grids.get(section);
    };
    const readNoteContent = (kind: NoteKind, id: string, label?: string): readonly Block[] => {
        const note = notesByKind[kind].get(id);
        // A note's lines are on the grid of the section of its reference, which is being read, but not its separators
        // (word-grid.ts G9, word-grid3.ts H2, H3)
        const grid = label === undefined ? undefined : gridOf(sections.length);
        const down = label !== undefined && downOf(childrenOf(sectionElements[sections.length])) !== undefined;
        const readerOfNote: Reader = {
            ...readerOf(false),
            inNote: true,
            ...(label === undefined ? {} : { noteNumber: label }),
            ...(grid === undefined ? {} : { grid }),
            ...(down ? { down } : {}),
        };
        const noteBlocks = note === undefined ? [] : readBlocks(contentOf(note), readerOfNote);
        return label === undefined || noteBlocks[noteBlocks.length - 1]?.type !== "table"
            ? noteBlocks
            : [...noteBlocks, paragraphAfterTable(kind, readerOfNote)];
    };
    /**
     * The empty paragraph Word adds after a table that ends a footnote or endnote, as a note ends with a paragraph: a line
     * below the table (`word-watertight-notes.docx` FN11, FN12, `word-watertight-stops.docx` SP3c). Those notes had the
     * same formatting in the Normal style and the footnote text style, so it is in Normal where they are formatted alike,
     * and where they aren't, which of them Word gives it isn't known
     */
    const paragraphAfterTable = (kind: NoteKind, readerOfNote: Reader): Block => {
        const [normal] = readBlocks([{ "w:p": [] }], readerOfNote) as readonly ParagraphBlock[];
        const textStyle = [...styles.styles].find(
            ([, { type, name }]) => type === "paragraph" && name?.toLowerCase() === `${kind} text`,
        )?.[0];
        const [inStyle] = readBlocks(
            [{ "w:p": [{ "w:pPr": [{ "w:pStyle": { _attr: { "w:val": textStyle } } }] }] }],
            readerOfNote,
        ) as readonly ParagraphBlock[];
        const alike = JSON.stringify([normal.format, normal.markFont]) === JSON.stringify([inStyle.format, inStyle.markFont]);
        return alike
            ? normal
            : {
                  ...normal,
                  unsupported: "a footnote or endnote that ends with a table, in a document whose Normal and note text styles differ",
              };
    };
    /**
     * A separator above the endnotes as Word lays it out: a line of its paragraph style's text, at single spacing and with
     * no space before or after, whatever its own formatting. Word left out the space before and after, the line spacing
     * and the size of the text of the separator and the continuation separator alike (`word-continued-endnotes.docx` CE3
     * to CE5, `word-watertight-endnotes2.docx` EN2, `word-watertight-sections.docx` SC4). Its bookmarks are kept. One with
     * text in it, or more than a paragraph, stops, as Word hasn't been seen laying one out, and so does one with something
     * in it that stops the layout anywhere, such as an equation
     */
    const readEndnoteSeparator = (type: "separator" | "continuationSeparator"): readonly Block[] => {
        const content = readNoteContent("endnote", type);
        const [first] = content;
        if (content.length === 0) {
            return [];
        }
        if (content.length > 1 || first.type !== "paragraph" || first.items.some((item) => item.type !== "marker")) {
            return [{ ...first, unsupported: "an endnote separator with text in it, or of more than a paragraph" }];
        }
        if (first.unsupported !== undefined) {
            return [first];
        }
        const { items, style } = first;
        const markFont = fontOf(combine([styles.run, ...styleChain(styles, style, "paragraph").map(({ run }) => run)]));
        return [{ type: "paragraph", items, format: {}, tabStops: [], markFont, ...withoutUndefined({ style }) }];
    };
    const footnotes = new Map<string, readonly Block[]>();
    const footnoteNumbers = new Map<string, string>();
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnotes: Block[] = [];
    // The section of each endnote's reference
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnoteSections: number[] = [];
    const endnoteNumbers = new Map<Block, string>();
    // Each section's properties, which come after its paragraphs, so its notes are numbered as it says as they are read
    const sectionElements = elements.flatMap((element) => {
        const properties = sectionPropertiesOf(element);
        return properties === undefined ? [] : [properties];
    });
    /** How a section numbers and places its notes of a kind: as it says, or the document does, or as Word does */
    const notePropertiesOf = (kind: NoteKind, section: number): Required<NoteProperties> => ({
        ...NOTE_DEFAULTS[kind],
        ...readNoteProperties(find(settings, `w:${kind}Pr`)),
        ...readNoteProperties(find(childrenOf(sectionElements[section]), `w:${kind}Pr`)),
    });
    const endnoteReferences = new Map<string, readonly Block[]>();
    // How many notes of each kind have been read, and the number and section of the last, as a section can number its
    // own afresh
    const noteCounts = { footnote: 0, endnote: 0 };
    const lastNotes = new Map<NoteKind, { readonly value: number; readonly section: number }>();
    let unwrittenNumber = false;
    // Footnotes are numbered 1, 2, 3 and endnotes i, ii, iii, as Word numbers them unless the document or the section
    // they are in says otherwise (`w:footnotePr`, `w:endnotePr`)
    // eslint-disable-next-line functional/prefer-readonly-type
    type LastNotes = Map<NoteKind, { readonly value: number; readonly section: number }>;
    /** Numbers the next note of a kind after the last, in the section being read, and gives its number as it is written */
    const numberNext = (kind: NoteKind, last: LastNotes): string | undefined => {
        const section = sections.length;
        const { format, start, restart } = notePropertiesOf(kind, section);
        const previous = last.get(kind);
        const value = previous === undefined || (restart === "eachSect" && previous.section !== section) ? start : previous.value + 1;
        // eslint-disable-next-line functional/immutable-data
        last.set(kind, { value, section });
        return formatNumber(value, format);
    };
    /** Numbers notes on from the last ones, without reading them or numbering them in `lastNotes` */
    const previewFrom = (last: LastNotes): NoteReader => {
        const next: LastNotes = new Map(last);
        return {
            read: (kind) => ({ label: numberNext(kind, next) ?? "" }),
            skip: (kind) => {
                numberNext(kind, next);
            },
            preview: () => previewFrom(next),
        };
    };
    const readNote = (kind: NoteKind, id: string): NoteReference => {
        // eslint-disable-next-line functional/immutable-data
        noteCounts[kind]++;
        const written = numberNext(kind, lastNotes);
        const label = written ?? "";
        unwrittenNumber ||= written === undefined;
        const content = readNoteContent(kind, id, label);
        // A name no bookmark can have, as bookmarks' names have no spaces
        const marker = `${kind} ${noteCounts[kind]}`;
        if (kind === "endnote") {
            // eslint-disable-next-line functional/immutable-data
            endnoteSections.push(sections.length);
            // eslint-disable-next-line functional/immutable-data
            endnotes.push(...content);
            for (const block of content) {
                // eslint-disable-next-line functional/immutable-data
                endnoteNumbers.set(block, label);
            }
            // eslint-disable-next-line functional/immutable-data
            endnoteReferences.set(marker, content);
            return { label, marker };
        }
        // eslint-disable-next-line functional/immutable-data
        footnotes.set(marker, content);
        // eslint-disable-next-line functional/immutable-data
        footnoteNumbers.set(marker, label);
        return { label, marker };
    };

    const noteReader: NoteReader = {
        read: readNote,
        // A note whose reference is deleted is numbered, though it isn't laid out (MK10e)
        skip: (kind) => {
            // eslint-disable-next-line functional/immutable-data
            noteCounts[kind]++;
            numberNext(kind, lastNotes);
        },
        preview: () => previewFrom(lastNotes),
    };
    const reader: Reader = { ...readerOf(false), notes: noteReader };
    // eslint-disable-next-line functional/prefer-readonly-type
    const sections: Section[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const blocks: { readonly block: Block; readonly section: number }[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    let bookmarks: string[] = [];
    // The paragraphs left out since the last block, which take no room
    let hidden: readonly ParagraphBlock[] = [];
    const addSection = (element: unknown): void => {
        sections.push(
            readSection(element, readPart, sections[sections.length - 1], pageSettings, readGrid(element, normalSize, pageSettings)),
        );
    };
    // The body is written with its section's properties at its end, if nothing else
    for (const element of elements) {
        const name = nameOf(element);
        if (name === "w:sectPr") {
            addSection(element[name]);
        } else if (name === "w:bookmarkStart") {
            // A bookmark between blocks starts with the next one
            const bookmark = bookmarkOf(element);
            bookmarks = bookmark === undefined ? bookmarks : [...bookmarks, bookmark];
        } else {
            const grid = gridOf(sections.length);
            const down = downOf(childrenOf(sectionElements[sections.length])) !== undefined;
            const block = readBlock(element, { ...reader, ...(grid === undefined ? {} : { grid }), ...(down ? { down } : {}) });
            const sectionProperties = sectionPropertiesOf(element);
            if (block?.type === "paragraph" && block.hidden) {
                bookmarks = [...bookmarks, ...markersIn([block])];
                const last = blocks[blocks.length - 1];
                if (hidden.length === 0 && last !== undefined) {
                    // eslint-disable-next-line functional/immutable-data
                    blocks[blocks.length - 1] = { ...last, block: beforeHidden(last.block, block) };
                }
                hidden = [...hidden, block];
            } else if (block !== undefined) {
                const shown = afterHidden(block, hidden, blocks[blocks.length - 1]?.block);
                const marked = startingWith(shown, bookmarks);
                hidden = [];
                const sectionBreak =
                    sectionProperties !== undefined && shown.type === "paragraph" && shown.items.length === 0 && bookmarks.length === 0;
                // eslint-disable-next-line functional/immutable-data
                blocks.push({ block: sectionBreak ? { ...shown, sectionBreak } : (marked ?? shown), section: sections.length });
                bookmarks = marked ? [] : bookmarks;
            }
            if (sectionProperties !== undefined) {
                addSection(sectionProperties);
            }
        }
    }
    // eslint-disable-next-line functional/immutable-data
    blocks.splice(0, blocks.length, ...anchorFrames(blocks, (entry, block) => ({ ...entry, block })));
    const edged = withCellEdges(
        blocks.map(({ block }) => block),
        reader,
    );
    // eslint-disable-next-line functional/immutable-data
    blocks.splice(0, blocks.length, ...blocks.map((entry, index) => ({ ...entry, block: edged[index] })));
    // The bookmarks of paragraphs left out at the end of the document, which take no room after its last line
    // (`word-hidden-paragraphs.docx` HP8), start where its text ends
    const final = blocks[blocks.length - 1];
    const ending = hidden.length > 0 && final !== undefined ? endingWith(final.block, bookmarks) : undefined;
    if (ending !== undefined) {
        // eslint-disable-next-line functional/immutable-data
        blocks[blocks.length - 1] = { ...final, block: ending };
    }
    if (sections.length === 0 || blocks.some(({ section }) => section >= sections.length)) {
        addSection(undefined);
    }

    /**
     * Why the notes of a kind can't be laid out yet, when Word numbers or places them in a way not yet followed: afresh on
     * each page, from a number of its own in a section after the first though they are numbered on through the document,
     * footnotes anywhere but at the bottom of the page, and endnotes at the end of each section
     */
    const notesUnsupported = (kind: NoteKind): string | undefined => {
        const all = sections.map((_, section) => notePropertiesOf(kind, section));
        return all.some(({ restart }) => restart === "eachPage")
            ? "notes numbered afresh on each page"
            : all.some(({ restart, start }) => restart !== "eachSect" && start !== all[0].start)
              ? "notes numbered on from a number of their own in a later section"
              : kind === "footnote" && all.some(({ position }) => position !== "pageBottom")
                ? "footnotes put elsewhere than at the bottom of the page"
                : kind === "endnote" && all.length > 1 && all.some(({ position }) => position !== "docEnd")
                  ? "endnotes at the end of each section"
                  : undefined;
    };

    const documentContent: DocumentContent = {
        blocks,
        sections,
        footnotes,
        footnoteSeparator: footnotes.size > 0 ? readNoteContent("footnote", "separator") : [],
        footnoteContinuationSeparator: footnotes.size > 0 ? readNoteContent("footnote", "continuationSeparator") : [],
        endnotes: endnotes.length > 0 ? [...readEndnoteSeparator("separator"), ...endnotes] : [],
        endnoteContinuationSeparator: endnotes.length > 0 ? readEndnoteSeparator("continuationSeparator") : [],
        footnoteNumbers,
        endnoteNumbers,
        relativeReferences: markers.relative,
        endnoteReferences,
        ...(parts.fonts !== undefined && parts.fonts.length > 0 ? { fonts: parts.fonts } : {}),
        ...readSettings(parts.settings),
    };
    // A length in the styles or lists stops the layout before anything, as any paragraph may be in them, and so do notes
    // numbered or placed in a way not yet followed, as any paragraph may refer to them
    return {
        ...documentContent,
        ...withoutUndefined({
            unsupported:
                documentContent.unsupported ??
                styles.unsupported ??
                inNumbering ??
                (footnotes.size > 0 ? notesUnsupported("footnote") : undefined) ??
                (endnotes.length > 0 ? notesUnsupported("endnote") : undefined) ??
                // Endnotes follow the last section's text, on its grid, and on the grid of another section in a way Word hasn't
                // shown
                ([...endnoteSections, sections.length - 1].some((section) => sections[section].textRunsDown !== undefined) &&
                endnotes.length > 0
                    ? "endnotes on text that runs down the page"
                    : undefined) ??
                (endnoteSections.some((section) => !sameGrid(gridOf(section), gridOf(sections.length - 1)))
                    ? "endnotes from a section on another document grid than the last"
                    : undefined) ??
                (unwrittenNumber ? "notes numbered in a format not yet written" : undefined),
        }),
    };
};
