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
    WIDEST_ART_BORDER,
    WIDEST_BORDER,
    type XmlObject,
    attributesOf,
    childrenOf,
    combine,
    find,
    fontOf,
    getTextStyles,
    isArtBorder,
    isEastAsian,
    isEastAsianRun,
    isGridCharacter,
    isMonospacedEastAsianFont,
    isObject,
    isOff,
    joinsAcross,
    kinsokuLanguageOf,
    numberOf,
    onOff,
    pointsOf,
    readCellMargins,
    readFontFile,
    readParagraphFormat,
    readRunFormat,
    singleFontOf,
    spansOf,
    stringOf,
    styleChain,
    unknownRunFont,
    unknownRunFormatting,
    valueOf,
    withoutUndefined,
} from "../text-layout";
import { type DataStores, withBoundTextWritten } from "./bound-controls";
import { isVerticalWidthKnown, verticalLineOf } from "./column-widths";
import { type EquationBox, type LimitPlaces, layOutEquations } from "./equations";
import {
    type FieldCapitals,
    type FieldFormat,
    formatListNumber,
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
import { DEFAULT_OUTLINE, type VmlShape, groupOutlined, readVmlFloating, vmlLength, vmlOutline, vmlShapeOf } from "./vml-drawings";

/**
 * A paragraph's content: text, tabs, breaks, pictures and bookmarks, and the results of fields that depend on the pages
 * being worked out: the page of a bookmark a page reference refers to, the number of pages of the document or of the
 * section it is in, and the number of the page or section it is on, each in its field's own format, if it has one. A page
 * reference with `\p` writes where its bookmark is from it (`relative`, the name of the marker at the field). A page
 * number's field is at a marker (`field`), as is a section number's in a footnote or endnote, as its page and section are
 * where the marker is placed. So is the number of a footnote numbered afresh on each page, at its reference and its mark
 * (`noteNumber`), which is that of the marker at its reference (`note`) among the page's footnotes.
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
    | { readonly type: "noteNumber"; readonly note: string; readonly font: TextFont }
    /** A drawing that text flows around, anchored where it is in the paragraph */
    | { readonly type: "drawing"; readonly drawing: FloatingDrawing }
    /**
     * A text box in the line (a VML shape with `v:textbox`), with its run's font: as wide in the line as it is with its
     * outline, and as tall as its paragraphs, broken into lines in the room for its text (`textWidth`), and the room it
     * takes above and below them (`room`): its insets, its outline inside the box and outside it, and what Word adds to its
     * line. One Word doesn't size to its text is as tall as its own height, with its outline and that (`fixed`), with the
     * room its text has in it (`inner`), which the text must fit in
     */
    | {
          readonly type: "textBox";
          readonly width: number;
          readonly textWidth: number;
          readonly room: number;
          readonly blocks: readonly Block[];
          readonly font: TextFont;
          readonly fixed?: { readonly height: number; readonly inner: number };
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
    /**
     * Why it can't be placed in a section of more than one column, when it can't: one that doesn't say what it is placed
     * against across the page, which Word places against the margins or the column, the same in one column
     */
    readonly inColumns?: string;
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
     * The paragraphs of a text frame (`w:framePr`), or of a VML text box that text flows around, when it is one, which
     * are laid out in its box, and size it: its width, when it is as wide as its text, and its height, as its height rule
     * says
     */
    readonly frame?: TextFrame;
    /**
     * Whether Word moves it back onto the page when it would go past the page's right edge, as it does a VML drawing
     * (`word-stops-vml-shapes.docx` VM28a, VM28b)
     */
    readonly keptOnPage?: true;
};

/**
 * A text frame's paragraphs, and how they size it: its height is theirs, at least its own, or its own exactly, and its
 * width is its own, or theirs (`fitsWidth`). Its text is laid out within its insets (`inset`), which it is wider and
 * taller by: a VML text box's insets and its outline
 */
export type TextFrame = {
    readonly blocks: readonly ParagraphBlock[];
    readonly heightRule: "auto" | "atLeast" | "exact";
    readonly fitsWidth: boolean;
    readonly inset?: Sides;
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
     * Its space before or after when Word leaves it out for contextual spacing at a table cell's edge, with the paragraph
     * next to it in the document's order, outside the cell, or before a paragraph after a table (see `withCellEdges`)
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
    /**
     * The division of a web page it is in (`w:divId`), with its margins above the division's first paragraph and below its
     * last, in points
     */
    readonly division?: { readonly id: string; readonly above: number; readonly below: number };
    /** Why its lines can't be laid out at the top of a page or column as Word lays them out there, when they can't */
    readonly unknownAtTop?: string;
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
     * Whether its text is fitted to it (`w:tcFitText`), each paragraph on one line, as Word squeezes or spreads its text
     * to fit (`word-stops-tables.docx` TS8)
     */
    readonly fitText?: boolean;
    /**
     * Whether it says its text doesn't wrap (`w:noWrap`), which Word sizes a table sized to its text by, though it wraps
     * the text all the same (`word-stops-tables.docx` TS7b, `word-stops-tables2.docx` TS12b)
     */
    readonly noWrap?: boolean;
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
     * The width before it, in points, when it starts past the table's first column (`w:gridBefore`) and says how wide in
     * twips (`w:wBefore`), which Word sizes the columns by as a cell's
     */
    readonly before?: number;
    /**
     * The room above the row's cells, in points: the border between it and the row above, or the table's top border, and
     * the space between cells. For the last row, the same below it
     */
    readonly borderTop: number;
    readonly borderBottom: number;
    /** The room of the border below the row where the table breaks across pages after it, in points */
    readonly breakBorder?: number;
    /**
     * The room of the border above the row, more than `borderTop`, where the table breaks across pages before it, in
     * points: the table's top border, in a table with space between its cells
     */
    readonly breakTop?: number;
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
    /**
     * Whether the room its columns are sized in has its first cell's left margin and its last cell's right margin beside
     * it, as Word 2010 and before line a table's text up with the margins, rather than its borders: a table sized to its
     * text is as wide as the page's text and those margins (`word-stops-compat-14.docx` CM4). Given for a table with no
     * width of its own in a document in compatibility mode
     */
    readonly marginsBeside?: boolean;
    /**
     * The text frames right before it, with no paragraph between, as drawings anchored at its top, where Word places them,
     * with their bookmarks and notes' references (`word-stops-floats.docx` FR1a, FR1d)
     */
    readonly anchored?: readonly LayoutItem[];
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
    /** Whether its footnotes go just below the text of their page, rather than at its bottom (`w:pos` beneathText) */
    readonly footnotesBeneathText?: boolean;
    /**
     * The width of each of the columns its footnotes are laid out in, when they are in columns of their own
     * (`w15:footnoteColumns`), from the first
     */
    readonly noteColumns?: readonly number[];
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
    /**
     * The endnotes the body refers to, in order, after their separator: they follow the body, as Word lays them out, or
     * where the settings put them at the end of each section, each section's after the section, after a separator of its own
     */
    readonly endnotes: readonly Block[];
    /**
     * The section at whose end each of the endnotes' blocks goes, by its index, where the settings put them at the end of
     * each section. Without it, all are at the end of the document
     */
    readonly endnotesAfter?: readonly number[];
    /** What is above the endnotes on each page after the first they are on: the paragraph of a longer line */
    readonly endnoteContinuationSeparator: readonly Block[];
    /** Where its lines break: the characters that can't start or end a line, where it gives its own */
    readonly breakRules?: LineBreakRules;
    /** Word's automatic hyphenation of its words, with its settings, when it has it on */
    readonly hyphenation?: Hyphenation;
    /**
     * The version of Word whose layout the document asks for, when it is in compatibility mode: Word 2010 (14), 2007 (12)
     * or 2003 (11). Word laid out the same pages in each as in Word 2013's mode (15), but that it didn't squeeze the spaces
     * of justified lines (`word-stops-compat-14.docx` CM1), gave a table sized to its text its cells' margins beside the
     * room (CM4), and moved text beside a frame or after a tab past the margin, and, in 12 and 11, East Asian text and the
     * line of a VML text box, otherwise (CM12, CM14, CM18). None in Word 2013's mode
     */
    readonly compatibilityMode?: number;
    /** Whether the space above the text of the first line of a page or column is left out (`suppressTopSpacing`) */
    readonly suppressesTopSpacing?: boolean;
    /** The number each footnote shows, by the name of its marker: empty for those numbered on each page, or with a mark of their own */
    readonly footnoteNumbers: ReadonlyMap<string, string>;
    /**
     * The footnotes numbered afresh on each page (`w:numRestart` eachPage), by the names of their markers, with the number
     * the first on a page has and the format of their numbers
     */
    readonly footnotesOnEachPage?: ReadonlyMap<string, NumberedOnPage>;
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
    /** Whether its number is aligned both (`w:lvlJc`), which Word leaves the level out for */
    readonly alignedBoth?: boolean;
    readonly paragraph: ParagraphFormat;
    readonly run: RunFormat;
    /** Why its number isn't written or placed as Word does, when it isn't */
    readonly unsupported?: string;
};

/**
 * Where the lists made from one definition are in their counting, which they share: the number each level is at, and
 * which of their own first numbers they have started levels at, as each list's id and the level
 */
type ListCount = {
    readonly numbers: readonly (number | undefined)[];
    readonly started: readonly string[];
    /**
     * The levels a paragraph at a level Word leaves out above them may have started again, which have numbers from before
     * it and haven't been counted since, when there are any
     */
    readonly uncertain?: readonly number[];
};

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

/** How the footnotes of a section numbered afresh on each page are numbered: from a number, in a format */
export type NumberedOnPage = { readonly start: number; readonly format: string };

/**
 * What a reference to a footnote or endnote shows: its number, and the marker its note's bookmarks and fields are placed
 * by, unless it is only numbered to size a table's columns. A footnote numbered afresh on each page has the name of the
 * marker at its reference (`onPage`), whose page numbers it, in place of its number
 */
type NoteReference = { readonly label: string; readonly marker?: string; readonly onPage?: string };

/** Reads the footnotes and endnotes references in the body refer to, and numbers them */
type NoteReader = {
    /** Reads the note a reference refers to, and numbers it */
    readonly read: (kind: NoteKind, id: string) => NoteReference;
    /** Reads a note whose reference has a mark of its own in place of its number, which isn't counted in the numbers */
    readonly readOwn: (kind: NoteKind, id: string) => NoteReference;
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
    /**
     * The number of the footnote or endnote being read, which the mark at its start shows, or the name of the marker at the
     * reference of a footnote numbered afresh on each page, whose page numbers it, or `null` for a footnote whose reference
     * has a mark of its own in place of its number
     */
    readonly noteNumber?: string | { readonly onPage: string } | null;
    readonly styles: TextStyles;
    /** Each list, by the id its paragraphs refer to it by */
    readonly numbering: ReadonlyMap<string, NumberingList>;
    /** The number of each list a paragraph may refer to by another id, such as the placeholder docx writes */
    readonly listIds: ReadonlyMap<string, string>;
    /** Whether it is a header or footer, where drawings that text doesn't flow around don't matter */
    readonly inHeader: boolean;
    /** Whether it is a footnote or endnote, whose fields are where its reference is */
    readonly inNote?: boolean;
    /** Whether it is an endnote */
    readonly inEndnote?: boolean;
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
    /**
     * The ids of the footnotes whose references are in text boxes, which Word leaves out, reference and note
     * (`word-stops-vml-note.docx` VM26a)
     */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly notesInTextBoxes: Set<string>;
    /** Why its equations can't be laid out as Word does for the document's maths settings, when they can't */
    readonly maths?: string;
    /** Why its displayed equations can't be laid out as Word does for the document's maths settings, when they can't */
    readonly displayedMaths?: string;
    /** Where the document's maths settings put the limits of sums and integrals that don't say where theirs go */
    readonly limits?: LimitPlaces;
    /** The document's compatibility mode, when it is one of Word 2010's, 2007's or 2003's (see `DocumentContent`) */
    readonly compatibilityMode?: number;
    /** Whether the document lays out East Asian text as Word 2003 did (`useFELayout`) */
    readonly feLayout?: boolean;
    /** Whether the document turns on OpenType features, such as ligatures, in compatibility mode (`enableOpenTypeFeatures`) */
    readonly openTypeFeatures?: boolean;
    /** The document's settings for text in an East Asian language that Word lays out only in some of it (see `EastAsianRules`) */
    readonly eastAsianRules?: EastAsianRules;
    /**
     * The divisions of a web page in the document's web settings (`w:divs`), by their ids: the properties of each and of
     * those it is in, the outermost first
     */
    readonly divisions?: ReadonlyMap<string, readonly (readonly XmlObject[])[]>;
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
const REMOVED_NOTES = new Set(["w:footnoteReference", "w:endnoteReference"]);
const PARTLY_DELETED_FIELD = "a field partly deleted in a tracked change";

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

/** Whether an element of a name is among some elements, or in one of them */
const hasElement = (elements: readonly unknown[], name: string): boolean =>
    elements.some((element) => isObject(element) && (nameOf(element) === name || hasElement(childrenOf(element[nameOf(element)]), name)));

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
 * where its style has it, as docx's FootnoteReference and EndnoteReference do. One numbered afresh on each page is worked
 * out from the page the marker at its reference is on.
 */
const noteNumber = (shown: string | { readonly onPage: string }, font: TextFont): LayoutItem =>
    typeof shown === "string" ? { type: "text", text: shown, font } : { type: "noteNumber", note: shown.onPage, font };

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
const numberSwitchesOf = (switches: string, decimalSymbol = "."): NumberSwitches => {
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
            // Word wrote a decimal point of a picture as a full stop (NF3a). Whether it reads one where the document's
            // settings give another decimal symbol, or the computer has another, hasn't been seen
            const known = isFieldPicture(value) && (decimalSymbol === "." || !value.replace(/'[^']*'/g, "").includes("."));
            unsupported ??= picture === undefined && known ? undefined : "a number written with a picture not yet written";
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
 * The marker where the text of a paragraph joined to the one before it by its hidden mark starts, from whose line its
 * line spacing is the joined one's (see `lineSpacingFrom`), which marks no place
 */
export const JOINED_SPACING_MARKER = "joined spacing";

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
        const switched = numberSwitchesOf(switches, reader.decimalSymbol);
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
    const { format, unsupported } = numberSwitchesOf(field[2], reader.decimalSymbol);
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
 * `word-stops-drawings.docx` DH1a to DH1d, `word-vml.docx` VM13), placed against its paragraph or line too (see
 * `headerDrawings` in `paginate.ts`). Or why it can't be laid out: one placed across the page against where it is
 * anchored along its line in a header or footer, whose place hasn't been seen, and a text box placed against its
 * paragraph or line there, which Word has been seen with only as a picture (`word-stops-edges.docx` DH2a, DH2b)
 */
const floatingItem = (floating: FloatingDrawing, reader: Reader): readonly LayoutItem[] | string =>
    !reader.inHeader
        ? [{ type: "drawing", drawing: floating }]
        : floating.horizontal.from === "character"
          ? "a drawing that text flows around in a header or footer, placed against where it is anchored along its line"
          : floating.frame !== undefined && (floating.vertical.from === "paragraph" || floating.vertical.from === "line")
            ? "a text box that text flows around in a header or footer, placed against its paragraph or line"
            : [{ type: "drawing", drawing: floating }];

/**
 * Reads a drawing in a run (`w:drawing`): a picture in the line is a box, with its run's font, and one that text doesn't
 * flow around, such as one behind the text, takes up no room. A picture in the line in a border of its run has its border's
 * room around it, beside it and above and below it: one of 20 points with a border of 1.5 points 2 points away takes 400
 * and 70 twips each side across the line, 470 above the baseline and 70 below it (scripts/layout-probes/stops2/word-stops-text2.ts
 * RF32b).
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
        const room = font.border?.room ?? 0;
        return [
            {
                type: "box",
                width: emus(extent.cx, effect.l, effect.r, around.distL, around.distR) / EMUS_PER_POINT + 2 * room,
                height: emus(extent.cy, effect.t, effect.b, around.distT, around.distB) / EMUS_PER_POINT + room,
                font,
                ...(room > 0 ? { below: room } : {}),
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

// Word 2007 and 2003 put the line of docx's text box (VML) 14 twips higher than Word 2010 and 2013 do
// (`word-stops-compat-12.docx` CM14): they give its outline no room of its own beside the box, across or down, though
// they draw the box as large, and in the same place (`word-stops-compat2-12.docx` CN11a, CN11b). The layout stops at
// other VML drawings that take room in a document in their compatibility modes, which haven't been seen there
const OLDER_VML = "a VML drawing other than a text box in the line, in a document in compatibility mode 12 or 11";
// A VML shape with neither a width nor a height is 50 points square (`word-stops-vml-shapes.docx` VM29d)
const DEFAULT_VML_SIZE = 50;
// Word draws a VML picture at a size other than its own: one of 72 by 36 points, 36 by 72 or 100 by 100 as 33 points
// square, and one of 20 by 20 at 20 (`word-vml.docx` VM8, `word-stops-vml-pictures.docx` VM20a to VM20d, VM20f), by no
// rule found. A picture that is an object's (`o:ole`), and an embedded object (`w:object`), it draws at the size given
// (`word-stops-vml-objects.docx` VM20e, VM21a, VM21b)
const VML_PICTURE = "a VML picture";

/** Whether the document is in Word 2007's or 2003's compatibility mode, where Word lays out VML drawings otherwise */
const olderVml = ({ compatibilityMode }: Reader): boolean => compatibilityMode !== undefined && compatibilityMode < WORD_2010_MODE;

/**
 * Reads a VML drawing (`w:pict`), as Word lays it out (scripts/layout-probes/word-vml.ts and
 * scripts/layout-probes/stops2/word-stops-vml.ts). A shape in the line is a box of its size, with its run's font, standing
 * on the baseline, as a picture is (VM7), and its outline takes its weight more across and down (VM23a, VM23b); a group of
 * shapes is a box of its size (VM29f). A text box in it is a box sized to its text (VM1 to VM5, VM25a to VM25e). One placed
 * on the page (`position:absolute`) that text flows around (`w10:wrap`) is a drawing that text flows around, as a
 * DrawingML one is (VM9 to VM11, VM15, VM24a to VM24c), and one with no wrapping is in front of the text or behind it, and
 * takes no room (VM6), in a header or footer too, as docx's watermarks are. One in a header or footer that text flows
 * around is one the body's text goes round (VM13), as a DrawingML one is, and one in the line of a header or footer takes
 * the room it takes in the body (VM22a to VM22c). It says why where Word's way with it isn't known: a picture, which Word
 * drew at a size other than its own (VM8, VM20), one in the line of a text box, which Word wouldn't open, and a group with a
 * shape with an outline, or that text flows around
 */
const readVml = (pict: unknown, font: TextFont, reader: Reader): readonly LayoutItem[] | string => {
    const shape = vmlShapeOf(pict);
    if (shape === undefined || typeof shape === "string") {
        return shape ?? [];
    }
    const { style, element } = shape;
    const name = nameOf(element);
    const children = childrenOf(element[name]);
    const attributes = attributesOf(element[name]);
    const given = { width: vmlLength(style.get("width")), height: vmlLength(style.get("height")) };
    const { width, height } =
        given.width === undefined && given.height === undefined ? { width: DEFAULT_VML_SIZE, height: DEFAULT_VML_SIZE } : given;
    const unsized = (): string =>
        typeof width === "string"
            ? width
            : typeof height === "string"
              ? height
              : "a VML drawing with a width but no height, or a height but no width";
    const group = name === "v:group";
    if (group && groupOutlined(element)) {
        // Whether the outlines of its shapes take room beyond it hasn't been seen
        return "a VML group of shapes with an outline";
    }
    const outline = group ? { weight: 0, drawn: false } : vmlOutline(attributes, style);
    if (typeof outline === "string") {
        return outline;
    }
    const picture = find(children, "v:imagedata") !== undefined && attributes["o:ole"] === undefined;
    if (style.get("position") === "absolute") {
        const wrap = find(children, "w10:wrap");
        if (wrap === undefined || attributesOf(wrap).type === "none") {
            return [];
        }
        const reason = olderVml(reader)
            ? OLDER_VML
            : reader.inCell || reader.inNote || reader.inTextBox
              ? IN_CELL_OR_NOTE
              : group
                ? "a VML group of shapes that text flows around"
                : picture
                  ? VML_PICTURE
                  : typeof width !== "number" || typeof height !== "number"
                    ? unsized()
                    : undefined;
        if (reason !== undefined) {
            return reason;
        }
        if (shape.text !== undefined) {
            return readFloatingTextBox(shape, wrap as XmlObject, width as number, height as number, outline, reader);
        }
        const floating = readVmlFloating(shape, wrap as XmlObject, width as number, height as number, outline.drawn ? outline.weight : 0);
        return typeof floating === "string" ? floating : floatingItem(floating, reader);
    }
    // Guessing, a shape in the line of a size Word's way with isn't known takes that size
    const sized = (reason: string): readonly LayoutItem[] | string =>
        typeof width === "number" && typeof height === "number"
            ? guessedOr(reader, reason, () => [{ type: "box", width, height, font }])
            : reason;
    if (olderVml(reader) && (shape.text === undefined || reader.inHeader || reader.inTextBox)) {
        return OLDER_VML;
    }
    if (reader.inTextBox) {
        return sized("a VML drawing in the line of a text box");
    }
    if (shape.text !== undefined) {
        return readTextBox(shape, width, height, outline, font, reader);
    }
    if (picture) {
        return sized(VML_PICTURE);
    }
    if (typeof width !== "number" || typeof height !== "number") {
        return unsized();
    }
    const room = outline.drawn ? outline.weight : 0;
    return [{ type: "box", width: width + room, height: height + room, font }];
};

// The room between a text box's edges and its text when it doesn't say (`v:textbox`'s inset): 0.1 inch left and right,
// and 0.05 inch above and below
const TEXT_BOX_INSETS: Sides = { left: 7.2, top: 3.6, right: 7.2, bottom: 3.6 };
// What Word adds to the line of a text box beyond its box and its outline, in points: half a point, but for one sized to
// its text with Word's own outline, whose line is its box and its outline, to within half a point (`word-vml.docx` VM1 to
// VM5, `word-stops-vml-header.docx` VM22a, VM22b, `word-stops-vml-text-boxes.docx` VM25a to VM25e,
// `word-stops-vml-note.docx` VM26a)
const TEXT_BOX_EXTRA = 0.5;

/**
 * The room between a text box's edges and its text (`v:textbox`'s inset, "left,top,right,bottom", each as Word has it when
 * it isn't given: `word-stops-vml-text-boxes.docx` VM25b, VM25c), or why it isn't known
 */
const textBoxInsets = (textbox: unknown): Sides | string => {
    const given = String(attributesOf(textbox).inset ?? "")
        .split(",")
        .map((value) => value.trim());
    const [left, top, right, bottom] = (["left", "top", "right", "bottom"] as const).map((side, index) =>
        given[index] ? vmlLength(given[index]) : TEXT_BOX_INSETS[side],
    );
    const unknown = [left, top, right, bottom].find((value): value is string => typeof value === "string");
    return unknown ?? { left: left as number, top: top as number, right: right as number, bottom: bottom as number };
};

/**
 * The paragraphs of a text box, read with the lists in them counted apart from the text's, as Word numbers them: a list
 * in a text box starts at 1, and the text's paragraphs of the same list after it don't count the box's
 * (`word-stops-vml-text-boxes.docx` VM26b). Or why they can't be laid out: a paragraph that can't be, or a list with
 * paragraphs before the box, in the text or in another box, which Word may number on from or not
 */
const textBoxBlocks = (shape: VmlShape, reader: Reader): readonly Block[] | string => {
    const counters = new Map<string, ListCount>();
    const blocks = readBlocks(shape.text!, { ...reader, inTextBox: true, counters });
    const unsupported = blocks.map(({ unsupported: why }) => why).find((why) => why !== undefined);
    if (unsupported !== undefined) {
        return unsupported;
    }
    for (const definition of counters.keys()) {
        if (reader.counters.has(definition)) {
            return "a list in a text box with paragraphs of its list before it";
        }
        // Known to the text as counted, with its count as it was, so that a later box's paragraphs of the list stop
        // eslint-disable-next-line functional/immutable-data
        reader.counters.set(definition, { numbers: [], started: [] });
    }
    return blocks;
};

/**
 * Reads a text box in the line (docx's `Textbox`): its paragraphs, and the box they are in, which Word sizes to them, as
 * docx writes it to be (`mso-fit-shape-to-text`), whatever height it gives (`word-vml.docx` VM3), or which is as tall as
 * it says otherwise, its text at its top (`word-stops-vml-text-boxes.docx` VM25a). Its text is laid out in its width less
 * its insets and its outline (`word-stops-floats2.docx` TX1a to TX1k), and the box is as tall as its lines, its insets and
 * its outline, which takes its weight more in the line, or none when it is hidden (VM25b to VM25e). The bookmarks and
 * fields in it are where it is, in the paragraph it is in, and a footnote referred to in it is left out, reference and
 * note, as Word leaves it (`word-stops-vml-note.docx` VM26a). Or why it can't be laid out
 */
const readTextBox = (
    shape: VmlShape,
    width: number | string | undefined,
    height: number | string | undefined,
    outline: { readonly weight: number; readonly drawn: boolean },
    font: TextFont,
    reader: Reader,
): readonly LayoutItem[] | string => {
    const textbox = find(childrenOf(shape.element[nameOf(shape.element)]), "v:textbox");
    const insets = textBoxInsets(textbox);
    const fits = shape.textStyle?.get("mso-fit-shape-to-text") === "t";
    if (typeof width !== "number") {
        return width ?? "a VML drawing with no size";
    }
    if (typeof insets === "string") {
        return insets;
    }
    if (!fits && typeof height !== "number") {
        return height ?? "a VML drawing with no size";
    }
    const blocks = textBoxBlocks(shape, reader);
    if (typeof blocks === "string") {
        return blocks;
    }
    const { weight, drawn } = outline;
    const { left, right, top, bottom } = insets;
    // Word 2007 and 2003 give its outline no room outside the box in the line (see `OLDER_VML`)
    const outside = drawn && !olderVml(reader) ? weight : 0;
    const extra = fits && weight === DEFAULT_OUTLINE ? 0 : TEXT_BOX_EXTRA;
    const markers = markersIn(blocks).map((name) => ({ type: "marker" as const, name }));
    return [
        ...markers,
        {
            type: "textBox",
            width: width + outside,
            textWidth: width - left - right - weight,
            room: top + bottom + weight + outside + extra,
            blocks,
            font,
            ...(fits ? {} : { fixed: { height: (height as number) + outside + extra, inner: (height as number) - top - bottom - weight } }),
        },
    ];
};

/**
 * Reads a text box placed on the page that text flows around (`position:absolute` with `w10:wrap`), as Word lays it out:
 * a drawing that text flows around, sized to its text as a text box in the line is, with its outline's room beside it
 * (`word-stops-vml-text-boxes.docx` VM24c). The bookmarks and fields in it are on its anchor's page. One Word doesn't size
 * to its text, and one with a table in it, haven't been seen
 */
const readFloatingTextBox = (
    shape: VmlShape,
    wrap: XmlObject,
    width: number,
    height: number,
    outline: { readonly weight: number; readonly drawn: boolean },
    reader: Reader,
): readonly LayoutItem[] | string => {
    const textbox = find(childrenOf(shape.element[nameOf(shape.element)]), "v:textbox");
    const insets = textBoxInsets(textbox);
    if (typeof insets === "string") {
        return insets;
    }
    if (shape.textStyle?.get("mso-fit-shape-to-text") !== "t") {
        return "a text box that text flows around not sized to its text";
    }
    const blocks = textBoxBlocks(shape, reader);
    if (typeof blocks === "string") {
        return blocks;
    }
    const paragraphs = blocks.filter((block): block is ParagraphBlock => block.type === "paragraph");
    if (paragraphs.length !== blocks.length) {
        return "a table in a text box that text flows around";
    }
    const floating = readVmlFloating(shape, wrap, width, height, outline.drawn ? outline.weight : 0);
    if (typeof floating === "string") {
        return floating;
    }
    const half = outline.weight / 2;
    const inset = { left: insets.left + half, right: insets.right + half, top: insets.top + half, bottom: insets.bottom + half };
    const items = floatingItem({ ...floating, frame: { blocks: paragraphs, heightRule: "auto", fitsWidth: false, inset } }, reader);
    return typeof items === "string" ? items : [...markersIn(blocks).map((name) => ({ type: "marker" as const, name })), ...items];
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
    const wrapName = Object.keys(WRAPS).find((name) => find(children, name) !== undefined);
    if (wrapName === undefined) {
        return "a drawing that text flows around in a way not yet followed";
    }
    const wrapElement = find(children, wrapName);
    const wrapAttributes = attributesOf(wrapElement);
    const side = String(wrapAttributes.wrapText ?? "bothSides");
    const extent = attributesOf(find(children, "wp:extent"));
    const effect = attributesOf(find(children, "wp:effectExtent"));
    const points = (value: unknown): number => (numberOf(value) ?? 0) / EMUS_PER_POINT;
    // Placed by its simple position, Word places it from the page's top left corner by that, rather than by its positions
    // (`word-stops-drawings.docx` DR15)
    const simple = isOn(attributes.simplePos) ? attributesOf(find(children, "wp:simplePos")) : undefined;
    const horizontal =
        simple === undefined
            ? readPosition(find(children, "wp:positionH"), "wp14:pctPosHOffset")
            : { from: "page", offset: points(simple.x) };
    const vertical =
        simple === undefined
            ? readPosition(find(children, "wp:positionV"), "wp14:pctPosVOffset")
            : { from: "page", offset: points(simple.y) };
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

/** Whether a run's text is drawn as two lines in one (`w:combine`), which Word draws at half its size */
const isTwoInOne = (properties: readonly XmlObject[]): boolean => isOn(attributesOf(find(properties, "w:eastAsianLayout"))["w:combine"]);

/**
 * Why a run's own formatting changes the room its text takes in a way not yet followed, when it does: text across in
 * vertical text (`w:eastAsianLayout`), but for text set across in text that runs
 * down the page, as Word sets it there (see {@link acrossOf}), unless it is compressed to fit its line (`w:vertCompress`),
 * and two lines in one of other than text without Chinese, Japanese or Korean characters, without brackets and at a size
 * that halves to whole half-points, across the page. Word drew "twolines" in two lines in one in a line of Calibri 11 at
 * 5.5 points, on one row, its width the text's at that size, in a line no taller (scripts/layout-probes/stops2/word-stops-text.ts
 * RF30). In text that runs down the page, raised text and small capitals, which Word's PDF showed taking other room than
 * across it, aren't followed either (stops2/word-stops-east-asian.ts VD3c, VD3e: a line 14 twips wider with text raised 6
 * points, and small capitals of 10.5 points drawn at 8.4).
 */
const unsupportedFormatOf = (
    properties: readonly XmlObject[],
    children: readonly XmlObject[],
    size: number,
    format: RunFormat,
    down: boolean,
): string | undefined => {
    const {
        "w:combineBrackets": brackets,
        "w:vert": across,
        "w:vertCompress": compressed,
    } = attributesOf(find(properties, "w:eastAsianLayout"));
    if (isTwoInOne(properties)) {
        const text = children
            .filter((child) => nameOf(child) === "w:t")
            .flatMap((child) => contentOf(child).filter((part) => typeof part === "string"));
        const shown = children.filter((child) => nameOf(child) !== "w:rPr" && nameOf(child) !== "_attr");
        return down ||
            (brackets !== undefined && brackets !== "none") ||
            shown.some((child) => nameOf(child) !== "w:t") ||
            [...text.join("")].some(isEastAsian) ||
            !Number.isInteger(size)
            ? "two lines in one"
            : undefined;
    }
    if (isOn(across) && (!down || isOn(compressed))) {
        return "text across in vertical text";
    }
    return down && (format.smallCaps === true || (format.position ?? 0) !== 0)
        ? "raised text or small capitals in text that runs down the page"
        : undefined;
};

// The most characters of text across in text that runs down the page Word has been seen setting
const MOST_ACROSS = 2;

/**
 * Whether a run's text is set across in text that runs down the page (`w:eastAsianLayout w:vert`), or why it can't be laid
 * out as Word sets it, when it can't. Word sets two digits of Calibri 10.5 across a line of MS Mincho 10.5, in as much room
 * along it as a line of them is tall, 257 twips, and the line no wider (stops2/word-stops-east-asian.ts VD13). More of them,
 * and Chinese, Japanese or Korean characters, haven't been seen.
 */
const acrossOf = (properties: readonly XmlObject[], text: string, down: boolean): boolean | string => {
    if (!down || !isOn(attributesOf(find(properties, "w:eastAsianLayout"))["w:vert"])) {
        return false;
    }
    const characters = [...text];
    return characters.length > MOST_ACROSS || characters.some(isGridCharacter)
        ? "text across in vertical text of more than two characters, or Chinese, Japanese or Korean ones"
        : true;
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
    const formatted = combine([
        paragraphRun,
        ...styleChain(styles, characterStyle, "character").map(({ run }) => run),
        readRunFormat(properties, styles.themeFonts),
    ]);
    const size = formatted.size ?? DEFAULT_FONT_SIZE;
    // Two lines in one are drawn at half the size (RF30)
    const format = withFeaturesOf(isTwoInOne(childrenOf(properties)) ? { ...formatted, size: size / 2 } : formatted, reader);
    const font = fontOf(format);
    const down = reader.down === true;
    const unsupportedFormat =
        unsupportedFormatOf(childrenOf(properties), children, size, format, down) ??
        (format.hidden ? undefined : unknownRunFormatting(format));
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
                const across = acrossOf(childrenOf(properties), content, down);
                // Which of the run's fonts Word draws each character in is known but for a few (see `unknownRunFont`)
                const unknownFont = typeof across === "string" ? across : format.hidden ? undefined : unknownRunFont(content, format);
                // A box of borders goes on round a tab in it (scripts/layout-probes/stops2/word-stops-tabs.ts TA7a)
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
                            ...(across === true ? { across } : {}),
                        })),
                    ]);
                return unknownFont === undefined ? read() : guessedOr(reader, unknownFont, read);
            }
            case "w:tab":
            case "w:ptab":
                return format.hidden ? [] : [{ type: "tab", font }];
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
                // Where a word may break, with a hyphen drawn there (`word-watertight-text.docx` TX10a), in text with a border
                // too (scripts/layout-probes/stops2/word-stops-tabs.ts SH11). Whether Word sizes a table's columns by the parts
                // of a word between them hasn't been seen
                return format.hidden
                    ? []
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
                const id = String(attributesOf(child[name])["w:id"]);
                if (reader.inTextBox) {
                    // Word leaves a footnote referred to in a text box out, reference and note (`word-stops-vml-note.docx`
                    // VM26a). Whether it does an endnote hasn't been seen
                    if (name === "w:endnoteReference") {
                        return "an endnote in a text box";
                    }
                    // eslint-disable-next-line functional/immutable-data
                    reader.notesInTextBoxes.add(id);
                    return [];
                }
                if (name === "w:footnoteReference" && reader.notesInTextBoxes.size > 0) {
                    // Whether Word counts a footnote left out of a text box in the numbers of those after it hasn't been seen
                    return "a footnote after one in a text box";
                }
                /** The marker at the reference, and its note's number, unless a mark of its own follows it in its place */
                const reference = (note: NoteReference | undefined, numbered: boolean): readonly LayoutItem[] =>
                    note === undefined
                        ? []
                        : [
                              ...(note.marker ? [{ type: "marker" as const, name: note.marker }] : []),
                              ...(numbered ? [noteNumber(note.onPage === undefined ? note.label : { onPage: note.onPage }, font)] : []),
                          ];
                if (hasOwnMark(child)) {
                    // Word lays out a footnote or endnote whose reference has a mark of its own, and doesn't count it in the
                    // numbers of the others: between footnotes 38 and 39, it numbered none 39 (`word-stops-notes.docx` NT15),
                    // and between endnotes i and ii, none ii (stops2/word-stops-notes2.ts NE5). One in hidden text hasn't been seen
                    const own = (): readonly LayoutItem[] =>
                        reference(reader.notes?.readOwn(name === "w:footnoteReference" ? "footnote" : "endnote", id), false);
                    return format.hidden
                        ? guessedOr(reader, "a footnote or endnote reference with a mark of its own in hidden text", own)
                        : own();
                }
                // A reference in hidden text takes no room, but Word numbers its note, and lays it out, at the foot of the page
                // or at the end: the footnotes around one are 2 and 4, with its note between theirs, and an endnote after one
                // is ii (`stops2/word-stops-hidden-edges.docx` HD9a, HD9b), in a hidden paragraph too (`word-hidden-paragraphs.docx`
                // HP4d, HP4e)
                return reference(reader.notes?.read(name === "w:footnoteReference" ? "footnote" : "endnote", id), !format.hidden);
            }
            case "w:footnoteRef":
            case "w:endnoteRef":
                // What a footnote or endnote with a mark of its own shows at a mark for its number hasn't been seen: Word
                // writes the mark itself there
                return reader.noteNumber === null
                    ? "a note's number in a footnote or endnote with a mark of its own"
                    : reader.noteNumber === undefined
                      ? []
                      : [noteNumber(reader.noteNumber, font)];
            case "w:drawing":
                // A picture in hidden text takes no room (`word-hidden-paragraphs.docx` HP4c). One placed on the page in text
                // with a border, which Word may give a box of its own in the line, hasn't been seen
                return format.hidden
                    ? []
                    : font.border && !("wp:inline" in childrenOf(child["w:drawing"])[0])
                      ? guessedOr(reader, "a drawing placed on the page in text with a border", () => readDrawing(child, font, reader))
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
                      ? guessedOr(reader, "a VML drawing in text with a border", () => readVml(child["w:pict"], font, reader))
                      : readVml(child["w:pict"], font, reader);
            case "w:object": {
                // An object embedded in the document, such as a spreadsheet or an old equation, whose picture Word draws at the
                // size its shape gives, standing on the baseline, as it does a VML picture that is an object's
                // (`word-stops-vml-objects.docx` VM20e, VM21a, VM21b), where it drew other VML pictures at other sizes (VM8). One
                // in hidden text takes no room
                if (format.hidden) {
                    return [];
                }
                if (olderVml(reader)) {
                    return OLDER_VML;
                }
                const object = vmlShapeOf(child["w:object"]);
                if (object === undefined || typeof object === "string") {
                    return "an embedded object without a shape of its own";
                }
                const width = vmlLength(object.style.get("width"));
                const height = vmlLength(object.style.get("height"));
                return typeof width === "number" && typeof height === "number"
                    ? [{ type: "box", width, height, font }]
                    : "an embedded object with no size";
            }
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
                // Its text is in its base and in the guide above it, which makes the line taller. Word made it as wide as the
                // wider of the two, with the narrower spread across it or centred on it as its alignment says: kana of 5.5
                // points 990 twips wide over two ideographs of 11, spread with half a share of the room at each end, and over
                // two of 20 points, 800 wide (scripts/layout-probes/stops2/word-stops-text2.ts RF31b to RF31d). How tall it
                // makes its line doesn't follow from its raise and sizes yet: 20 twips above the guide's top over Calibri 11,
                // 17 at the top of a page, and 20 above Calibri 20's own line, which the guide is below. Guessing, its base alone
                return guessedOr(reader, "text with a phonetic guide", () =>
                    readInline(childrenOf(find(childrenOf(child["w:ruby"]), "w:rubyBase")), paragraphRun, reader, removed),
                );
            case "w:contentPart":
                return "a content part, such as ink";
            default:
                return [];
        }
    });
    const runItems = itemsOf(formatGuessed ? [[guessMarker(unsupportedFormat!)], ...items] : items, reader);
    const fitText = find(childrenOf(properties), "w:fitText");
    return typeof runItems === "string" || format.hidden || fitText === undefined
        ? runItems
        : fittedOf(runItems, attributesOf(fitText), reader);
};

/** The id of the region of text fitted to a width that each box of it is in, when it has one */
const FITTED = new WeakMap<LayoutItem, { readonly id?: string }>();

/**
 * A run's text fitted to a width (`w:fitText`), as a box of that width as tall as its text, which a line doesn't break:
 * Word drew "fitted text" fitted to 500 twips 500 wide, and fitted to 3000 at the end of a line it didn't fit in, whole on
 * the next (scripts/layout-probes/stops2/word-stops-text2.ts RF29b, RF29d). Or why it can't be laid out: fitted text with
 * other than text in it, or to no width, which haven't been seen. Guessing, it is read as if it weren't fitted
 */
const fittedOf = (
    items: readonly LayoutItem[],
    { "w:val": width, "w:id": id }: XmlObject,
    reader: Reader,
): readonly LayoutItem[] | string => {
    const texts = items.filter((item): item is Extract<LayoutItem, { readonly type: "text" }> => item.type === "text");
    const points = twips(width) ?? 0;
    if (items.some((item) => item.type !== "text" && item.type !== "marker") || points <= 0) {
        return guessedOr(reader, "text fitted to a width with other than text in it, or to none", () => items);
    }
    if (texts.length === 0) {
        return items;
    }
    const box: LayoutItem = { type: "box", width: points, height: 0, font: texts[0].font, text: texts.map(({ text }) => text).join("") };
    FITTED.set(box, id === undefined ? {} : { id: String(id) });
    return [...items.filter((item) => item.type === "marker"), box];
};

/**
 * A paragraph's items with the text of runs fitted to a width with the same id (`w:id`), one after the other, in one box,
 * as Word fits them to their width together: "fitted " and a bold "text", fitted to 2000 twips, are 2000 wide
 * (scripts/layout-probes/stops2/word-stops-text2.ts RF29c). Or why they can't be laid out: ones of other sizes or fonts,
 * whose line Word hasn't been seen to size. Guessing, those are fitted apart
 */
const withFitted = (read: readonly LayoutItem[] | string, reader: Reader): readonly LayoutItem[] | string => {
    if (typeof read === "string") {
        return read;
    }
    // eslint-disable-next-line functional/prefer-readonly-type
    const all: LayoutItem[] = [];
    for (const item of read) {
        const id = FITTED.get(item)?.id;
        const at = all.findLastIndex((other) => other.type !== "marker");
        if (id === undefined || at === -1 || FITTED.get(all[at])?.id !== id) {
            // eslint-disable-next-line functional/immutable-data
            all.push(item);
            continue;
        }
        const [before, after] = [all[at], item] as readonly Extract<LayoutItem, { readonly type: "box" }>[];
        if (before.font!.font !== after.font!.font || before.font!.size !== after.font!.size) {
            const reason = "text fitted to a width in runs of other sizes or fonts";
            if (!reader.guess) {
                return reason;
            }
            // eslint-disable-next-line functional/immutable-data
            all.push(guessMarker(reason), item);
            continue;
        }
        const joined: LayoutItem = { ...before, text: `${before.text}${after.text}` };
        FITTED.set(joined, { id });
        // eslint-disable-next-line functional/immutable-data
        all[at] = joined;
    }
    return all;
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
// An element no document has, which stands in a paragraph joined to the next by its hidden mark, where the next one's text
// starts, with the next one's line spacing, where it differs (see {@link joinedToNext})
const JOINED_SPACING = "docx-layout:joined-spacing";
// An element no document has, which stands in the document's last paragraph when its mark, which ends a section, is
// deleted: Word keeps the mark, and the paragraph takes a line, as an empty one does, rather than none, as one that only
// ends a section does (stops2/word-stops-tracked-edges.docx TR10a)
const KEPT_MARK = "docx-layout:kept-mark";

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
 * MK1, `word-tracked-changes.docx` MK10), but for its bookmarks. Word numbers a note whose reference is deleted, though it
 * doesn't show it or lay the note out: a footnote (MK10e), and an endnote, the kept one after it ii
 * (`stops2/word-stops-tracked-edges.docx` TR3b). It numbers a note whose reference is moved elsewhere the same way, at the
 * reference's old place, and lays out the note of its new place: 1 there, and 2 at the new (`word-stops-moves.docx` TR3a).
 * A footnote or endnote reference with a mark of its own isn't counted, as where it isn't deleted.
 */
const readRemoved = (elements: readonly unknown[], reader: Reader): readonly LayoutItem[] | string =>
    itemsOf(
        elements.filter(isObject).map((element): readonly LayoutItem[] | string => {
            const name = nameOf(element);
            if (name === "w:r") {
                const children = contentOf(element).filter(isObject);
                // One with a mark of its own isn't counted, as Word counts no footnote or endnote with one
                // (`word-stops-notes.docx` NT15, stops2/word-stops-notes2.ts NE5)
                children
                    .filter((child) => REMOVED_NOTES.has(nameOf(child)))
                    .filter((reference) => !hasOwnMark(reference))
                    .forEach((reference) => reader.notes?.skip("w:endnoteReference" in reference ? "endnote" : "footnote"));
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
                return readRemoved(childrenOf(find(childrenOf(element[name]), "w:sdtContent")), reader);
            }
            return RUN_CONTAINERS.has(name) || REMOVALS.has(name) || name === "w:fldSimple" ? readRemoved(contentOf(element), reader) : [];
        }),
        reader,
    );

// Why the layout stops at an equation that doesn't fit in the room left on its line, which Word breaks after an
// operator (`word-equations.docx` EQ5, `word-stops-equations.docx` EQ26), in a way not yet followed
const EQUATION_BROKEN = "an equation that doesn't fit on its line";

/** An equation read: how Word lays it out in a line of text and displayed, on a line of its own, or why it can't be laid out so */
type EquationRead = { readonly inline: EquationBox | string; readonly displayed: EquationBox | string };

/** The equations read, by the item that stands for each in its paragraph's items, which its paragraph lays out one way */
const EQUATIONS = new WeakMap<LayoutItem, EquationRead>();

/** The item for an equation laid out one way, or why it can't be laid out so */
const equationItem = (box: EquationBox | string): LayoutItem | string =>
    typeof box === "string" ? box : { type: "box", width: box.width, height: box.ascent, descent: box.descent, unbroken: EQUATION_BROKEN };

/**
 * Reads an equation (`m:oMath`), or a paragraph of them (`m:oMathPara`), in a row, as Word lays them out (see
 * {@link layOutEquations}), in the size of its paragraph's text, with its bookmarks before it: an item its paragraph lays
 * out in its line of text, or displayed (see {@link withEquations}). Or why it can't be laid out: one in a document whose
 * maths settings aren't followed (see {@link readMathsSettings})
 */
const readEquation = (element: XmlObject, paragraphRun: RunFormat, reader: Reader): readonly LayoutItem[] | string => {
    if (reader.maths !== undefined) {
        return reader.maths;
    }
    const name = nameOf(element);
    const equations = name === "m:oMath" ? [element] : childrenOf(element[name]).filter((child) => "m:oMath" in child);
    if (equations.length === 0) {
        return [];
    }
    const size = fontOf(paragraphRun).size ?? DEFAULT_FONT_SIZE;
    const contents = equations.map((equation) => equation["m:oMath"]);
    const read: EquationRead = {
        inline: layOutEquations(contents, size, false, reader.limits),
        displayed: layOutEquations(contents, size, true, reader.limits),
    };
    // It stands in its paragraph's items as one of its layouts, which its paragraph puts in its place
    const shown = [read.inline, read.displayed].find((box): box is EquationBox => typeof box !== "string");
    const item: LayoutItem = { type: "box", width: shown?.width ?? 0, height: shown?.ascent ?? 0, descent: shown?.descent ?? 0 };
    EQUATIONS.set(item, read);
    const bookmarks = equations.flatMap((equation) =>
        elementsIn(contentOf(equation), (inner) => inner === "w:bookmarkStart").flatMap((bookmark) => markerOf(bookmark)),
    );
    return [...bookmarks, item];
};

/**
 * A paragraph's content, as read, with each equation in it laid out as Word lays it out there, or why it can't be laid out
 * for the equations in it. Word shows an equation in a line of text in the line, and one alone in its paragraph displayed,
 * on a line of its own (`word-equations.docx` EQ2, EQ4), and one displayed (`m:oMathPara`) beside text in its paragraph,
 * and one alone after its list's number, in the line, at the start of its text, built up as in a line of text
 * (`word-stops-equations.docx` EQ25, `word-stops-equations2.docx` EQ38). More than one equation alone in a paragraph
 * hasn't been seen.
 */
const withEquations = (read: readonly LayoutItem[] | string, numbered: boolean, reader: Reader): readonly LayoutItem[] | string => {
    if (typeof read === "string") {
        return read;
    }
    const shown = read.filter((item) => item.type !== "marker");
    const equations = shown.filter((item) => EQUATIONS.has(item));
    if (equations.length === 0) {
        return read;
    }
    const alone = shown.length === equations.length;
    /** The item of an equation laid out as Word lays it out where it is in its paragraph, or why it can't be */
    const placed = (item: LayoutItem): LayoutItem | string => {
        const equation = EQUATIONS.get(item)!;
        if (alone && equations.length > 1) {
            return "equations alone in their paragraph beside each other";
        }
        return alone && !numbered ? (reader.displayedMaths ?? equationItem(equation.displayed)) : equationItem(equation.inline);
    };
    const items = read.map((item) => (EQUATIONS.has(item) ? placed(item) : item));
    const reason = items.find((item): item is string => typeof item === "string");
    // Guessing, an equation is laid out as it can be: as Word puts it, displayed when it is alone in its paragraph and in a
    // line of text otherwise, or else the other way, and one that can't be either way is left out
    const display = alone && !numbered && equations.length === 1;
    const laidOut = (): readonly LayoutItem[] =>
        read.flatMap((item, index) => {
            const found = items[index];
            const { inline, displayed } = EQUATIONS.get(item) ?? { inline: "", displayed: "" };
            const ways = display ? [displayed, inline] : [inline, displayed];
            const either = ways.map((box) => equationItem(box)).find((one): one is LayoutItem => typeof one !== "string");
            return typeof found !== "string" ? [found] : either === undefined ? [] : [either];
        });
    return reason === undefined ? (items as readonly LayoutItem[]) : guessedOr(reader, reason, laidOut);
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
                    : readRemoved(contentOf(element), reader);
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
            if (name === JOINED_SPACING) {
                return [{ type: "marker", name: JOINED_SPACING_MARKER }];
            }
            return name === "m:oMath" || name === "m:oMathPara" ? readEquation(element, paragraphRun, reader) : [];
        }),
        reader,
    );

/** The levels a level's text writes the numbers of (`%1` to `%9`), counted from 0 */
const referredLevelsOf = (level: NumberingLevel): readonly number[] =>
    [...level.text.matchAll(/%([1-9])/g)].map(([, digit]) => Number(digit) - 1);

/**
 * Whether Word leaves a level of a list out, as though it weren't there: one whose number is aligned both
 * (`stops2/word-stops-list-definitions.docx` LI11), or whose text writes the number of a level its list doesn't have.
 * "%1.%3." in a list of 2 levels was nothing, its paragraphs with neither a number nor the level's indent
 * (`word-stops-lists.docx` LI1)
 */
const isLevelLeftOut = (level: NumberingLevel, levels: readonly NumberingLevel[]): boolean =>
    level.alignedBoth === true || referredLevelsOf(level).some((at) => levels[at] === undefined);

/**
 * Where the lists made from a definition are in their counting after a paragraph at a level Word leaves out: as they
 * were, as it isn't counted, but for the levels below it that have numbers, which it may start again
 */
const leftOutIn = (count: ListCount | undefined, index: number): ListCount => {
    const numbers = count?.numbers ?? [];
    const below = numbers.flatMap((counted, at) => (at > index && counted !== undefined ? [at] : []));
    const uncertain = [...new Set([...(count?.uncertain ?? []), ...below])];
    return { numbers, started: count?.started ?? [], ...(uncertain.length > 0 ? { uncertain } : {}) };
};

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
    if (isLevelLeftOut(level, levels)) {
        // eslint-disable-next-line functional/immutable-data
        reader.counters.set(list.definition, leftOutIn(reader.counters.get(list.definition), index));
        return { items: [] };
    }
    const before = reader.counters.get(list.definition);
    // Whether a level left out above it may have started it again, which Word hasn't shown
    const restartedByLeftOut = before?.uncertain?.includes(index) === true;
    const current = countIn(reader.counters, id, list, index);
    const { started } = reader.counters.get(list.definition)!;
    // A level not counted yet shows its first number: 1.1 and 3.1 for a list's first paragraph at level 1, whose level 0
    // starts at 1 and 3 (scripts/layout-probes/word-lists.ts LR4). A legal level writes every level's number in decimal
    // (LR3). A level Word leaves out writes nothing: ".1." for "%1.%2." under one (stops2/word-stops-lists.docx LI1)
    const numberAt = (at: number): string | undefined => {
        const other = levels[at];
        return (
            other &&
            (isLevelLeftOut(other, levels) ? "" : formatListNumber(current[at] ?? other.start, level.legal ? "decimal" : other.format))
        );
    };
    const referred = referredLevelsOf(level);
    // Whether a level not counted yet would show its first number or the list's own for it isn't known
    const ownStart = (at: number): boolean =>
        current[at] === undefined && !started.includes(`${id} ${at}`) && (list.starts.get(at) ?? levels[at]!.start) !== levels[at]!.start;
    // The number is in the formatting of its paragraph's mark, but for what its level gives it: in the mark's 20 points
    // or Courier New, or bold, beside text that isn't, and not bold beside bold text, and in its level's 8 points beside a
    // mark of 20 (LF1 to LF6)
    const numberRun = withFeaturesOf(combine([markRun, level.run]), reader);
    const text = level.text.replace(/%([1-9])/g, (_, digit: string) => numberAt(Number(digit) - 1) ?? "");
    // A number of the characters of the run's high ANSI font, such as a bullet, is in that font, where the run has one
    // other than its font for ASCII, as Word draws them (see `spansOf`). One of characters of both hasn't been seen
    const numberFont = singleFontOf(text, numberRun);
    const font = numberFont ?? fontOf(numberRun);
    const unsupported =
        level.unsupported ??
        unknownRunFont(text, numberRun) ??
        (numberFont === undefined
            ? "a list number of characters of both the font for ASCII and the high ANSI font of its run"
            : undefined) ??
        (levels.some((other) => other?.alignedBoth === true)
            ? "a list number at another level of a list with a level aligned both"
            : restartedByLeftOut
              ? "a list number after a paragraph at a level Word leaves out above it"
              : referred.some((at) => numberAt(at) === undefined)
                ? "a list number in a format not yet written"
                : referred.some(ownStart)
                  ? "a list number of a level not counted yet, which its list starts at a number of its own"
                  : font.border !== undefined
                    ? "a list number with a border"
                    : undefined);
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
    const { numbers, started, uncertain = [] } = counters.get(definition) ?? { numbers: [], started: [] };
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
    const stillUncertain = uncertain.filter((at) => at !== index && current[at] !== undefined);
    // eslint-disable-next-line functional/immutable-data
    counters.set(definition, {
        numbers: current,
        started: starting ? [...started, `${id} ${index}`] : started,
        // A level that may have been started again is known once it is counted, or started again by a level above it
        ...(stillUncertain.length > 0 ? { uncertain: stillUncertain } : {}),
    });
    return current;
};

// Letters of Arabic, which justification with a kashida is for
const ARABIC = /\p{Script=Arabic}/u;

/**
 * A run's formatting as Word draws it in the document's compatibility mode: Word 2007 and 2003 had no OpenType features,
 * which Word 2010's mode has on only with `enableOpenTypeFeatures`, as Word 2010 writes it, and without it Word draws no
 * ligatures in modes 14 and 12, whatever a run asks for (`word-stops-compat2-14.docx`, `-12` CN2b)
 */
const withFeaturesOf = (format: RunFormat, { compatibilityMode, openTypeFeatures }: Reader): RunFormat =>
    compatibilityMode !== undefined && openTypeFeatures !== true && format.ligatures !== undefined
        ? { ...format, ligatures: undefined }
        : format;

/**
 * Why a paragraph can't be laid out as Word lays it out in the document's compatibility mode, or with Word 2003's layout
 * of East Asian text (`useFELayout`), when it can't. Word 2010 and before don't squeeze the spaces of a justified line,
 * nor of a distributed one, or one justified for Thai or with a low kashida (`word-stops-compat-14.docx` CM1,
 * `word-stops-compat2-14.docx` CN4a to CN4c), which the lines are broken for (see `line-breaking.ts`). Word 2007 and 2003
 * break East Asian text otherwise than Word 2010 and 2013 (CM18, CN10a to CN10c), and Word 2003's East Asian layout
 * spaces it apart from the text beside it (`word-stops-fe-layout.docx` FE1a, FE1b): see below. Paragraphs without East
 * Asian text it lays out as they are without it (FE1c to FE1f).
 */
const unknownInOlderLayout = (items: readonly LayoutItem[], reader: Reader, autoSpaced: boolean): string | undefined => {
    const { compatibilityMode } = reader;
    // Its East Asian text is looked for only where it is laid out otherwise, as the text of every paragraph is long. Word 2007
    // and 2003 break that of no East Asian language only at its spaces (see `ideographs` in `LineBreakRules`), beside
    // characters past ASCII that aren't East Asian too, such as curly quotes, in the run's font for them (`w:hAnsi`;
    // `word-stops-compat2-12.docx` CN10c). That of an East Asian language, whose characters that can't start or end a line
    // Word knows, hasn't been seen
    const older = compatibilityMode !== undefined && compatibilityMode < WORD_2010_MODE;
    const texts = items.filter((item) => item.type === "text");
    const eastAsian = texts.some((item) => [...item.text].some(isEastAsian));
    if (!eastAsian || (!older && reader.feLayout !== true)) {
        return undefined;
    }
    // Word 2003's layout of East Asian text puts a quarter of an em between East Asian text and Latin letters and digits
    // beside it, with the paragraph's automatic spacing of them on (`w:autoSpaceDE`, `w:autoSpaceDN`), as it is unless the
    // paragraph turns it off: 52.5 twips at 10.5 points (`word-stops-fe-layout2.docx` FE2b, `word-stops-fe-layout.docx` FE1a,
    // FE1b), which isn't followed yet. Otherwise it lays out its lines as without it: Japanese and Chinese after a space,
    // and Japanese with Latin words with both turned off (FE2a, FE2c, FE2d)
    if (!older) {
        const characters = [...texts.map(({ text }) => text).join("")];
        const beside = characters.some(
            (character, at) =>
                at > 0 && isEastAsian(character) !== isEastAsian(characters[at - 1]) && !/\s/u.test(character + characters[at - 1]),
        );
        return autoSpaced && beside
            ? "East Asian text beside other text, which Word spaces apart, in a document that lays it out as Word 2003 did (useFELayout)"
            : undefined;
    }
    return texts.some((item) => kinsokuLanguageOf(item.language) !== undefined)
        ? "East Asian text in an East Asian language, in a document in compatibility mode 12 or 11"
        : undefined;
};

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
 * 20, whatever the size of its mark or its other text (`word-watertight-text.docx` TX7a, TX7b, C5, C6, C12), a left
 * indent's as its paragraph's style, 4 of them 880 beside 20-point text (C11) and beside a 16-point mark
 * (scripts/layout-probes/stops2/word-stops-text.ts PB5b), and a right indent's as its mark (PB5c). A hanging indent in characters puts the first line at
 * the left indent and the other lines that much further in, and the left indent is in characters then, 0 when it isn't
 * given: 2 characters hanging put the first line at 0 and the others at 440, with a left indent of 1440 twips or none
 * (TX7c, C3, C9), as a hanging indent in twips from a left indent in characters does (word-stops-text2.ts PB5f). It says why
 * when Word's way with them isn't known.
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
    // The first character's size, which first line and hanging indents are in, the paragraph style's, which a left indent
    // is in, 4 characters of 11 points beside a mark of 16 (scripts/layout-probes/stops2/word-stops-text.ts PB5b), and the
    // mark's, which a right indent is in, 4 characters of 11 points beside text of 16 (PB5c). Which of the mark's and its
    // style's a right indent is in where they differ, and which the first character is of a list's number and its text,
    // isn't known
    const first = sizeOf(textOf(items)[0] ?? markFont);
    const mark = sizeOf(markFont);
    const style = sizeOf(styleFont);
    if (firstLineChars !== 0 && textOf(listNumber).some((font) => sizeOf(font) !== first)) {
        return "an indent in characters in a list whose number is another size than its text";
    }
    if (indentRightChars !== 0 && mark !== style) {
        return "an indent in characters right of a paragraph whose mark is another size than its style";
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
            indentLeft: characters(leftChars, style) - characters(firstLineChars, first),
            firstLineIndent: characters(firstLineChars, first),
        };
    }
    // A first line indent in twips starts the first line that much further in from a left indent in characters, 720 twips
    // from 4 characters of 11 points (PB5e), and a hanging indent in twips leaves the first line at it and puts the other
    // lines that much further in, as one in characters does: 4 characters of 11 points and 360 twips hanging put the first
    // line at 880 and the others at 1240, in a list too, whose number is at 880 whatever its size (word-stops-text.ts PB5a,
    // word-stops-text2.ts PB5f, PB5g)
    const hanging = leftChars !== 0 && firstLineChars === 0 ? Math.max(0, -(format.firstLineIndent ?? 0)) : 0;
    return {
        ...spaced,
        ...right,
        ...(leftChars === 0 ? {} : { indentLeft: characters(leftChars, style) + hanging }),
        ...(firstLineChars === 0 ? {} : { firstLineIndent: characters(firstLineChars, first) }),
    };
};

// The styles of a border that draw none
const NO_BORDER = new Set(["none", "nil"]);

/**
 * The room a border of a paragraph takes, in points: its width and the space between it and the text, or why it isn't
 * known. A shadow doubles a single line (B6). An art border, of pictures, is as wide as its size in points
 * (`word-stops-text.docx` PB4a, `word-stops-table-borders2.docx` BT2f and BT2g: apples of 6, 12 and 20 points), and a
 * border of a line of no width, whose width is a multiple of its size, takes only its space (PB4d, BT3a to BT3c: single
 * and double lines). Word keeps the space in five bits, so one of 32 points is none, as a run's is (BT3d to BT3f: 32, 50
 * and 63 points took 0, 18 and 31). A line of a width of an eighth of a point hasn't been seen.
 */
const borderRoom = (border: ParagraphBorder | undefined): number | string => {
    if (border === undefined || NO_BORDER.has(border.style)) {
        return 0;
    }
    const style = BORDER_WIDTHS[border.style];
    const art = isArtBorder(border.style);
    if ((style === undefined && !art) || border.frame || (border.shadow && border.style !== "single")) {
        return "a paragraph border of a style not yet followed";
    }
    const { size } = border;
    const width =
        size === undefined
            ? undefined
            : style === undefined
              ? size >= 1 && size <= WIDEST_ART_BORDER
                  ? size * EIGHTHS_PER_POINT
                  : undefined
              : (size >= NARROWEST_BORDER && size <= WIDEST_BORDER) || (size === 0 && style(0) === 0)
                ? style(size)
                : undefined;
    return width === undefined
        ? "a paragraph border of a width not yet followed"
        : ((border.shadow ? 2 : 1) * width) / EIGHTHS_PER_POINT + (border.space % (FURTHEST_BORDER + 1));
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
        betweenSpace: between > 0 ? borderBetween!.space % (FURTHEST_BORDER + 1) : 0,
        box: JSON.stringify([...outline, keyOf(borderBetween), ...indents]),
        outline: JSON.stringify([...outline, ...indents]),
    };
};

/**
 * The paragraph and run formatting a table's style gives the paragraphs of one of its cells: its own and its base styles',
 * then those of the parts of it for the cell, such as its first row's, each over those before.
 */
type TableFormats = readonly { readonly run: RunFormat; readonly paragraph: ParagraphFormat }[];

/**
 * Why a paragraph of text that runs down the page can't be laid out yet, when it can't. Word's PDFs showed lines of
 * ideographs, kana and punctuation in fonts whose characters are all an em, each an em down the line, and Latin text on
 * its side, as wide as it is across a page (scripts/layout-probes/word-vertical.ts V1, V4), and half-width katakana on
 * their side too, half an em each; a left tab stop, borders round text and round the paragraph, emphasis marks, text in
 * superscript and a justified line with spaces, each taking the room it takes across the page; and a footnote below the
 * text, at the left of the page (stops2/word-stops-east-asian.ts VD1a, VD2b, VD3a, VD3b, VD3d, VD4, VD5, VD6a). Text in a
 * font whose characters aren't all an em, which Word draws in room of their own down the line (VD2a: MS PMincho's kana
 * 139 to 210 twips at 10.5 points), a picture in the line, which Word puts in the middle of the line (VD1c), a drawing
 * that text wraps around, which Word places against the page as it is, not turned (VD1d), and a soft hyphen at the end of
 * a line, aren't followed yet.
 */
const unknownDownOf = (items: readonly LayoutItem[], tabStops: readonly TabStop[]): string | undefined => {
    if (items.some((item) => item.type === "box" || item.type === "softHyphen" || item.type === "drawing")) {
        return "a soft hyphen, picture or drawing in text that runs down the page";
    }
    if (items.some((item) => item.type === "tab") && tabStops.some(({ alignment }) => alignment !== "left")) {
        return "a tab to a stop other than a left one in text that runs down the page";
    }
    return items.some(
        (item) =>
            item.type === "text" &&
            /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(item.text) &&
            !isMonospacedEastAsianFont(item.font.font),
    )
        ? "East Asian text down the page in a font whose characters aren't all an em"
        : undefined;
};

/**
 * The text frame a paragraph is in (`w:framePr`), its own or its style's, or why it can't be laid out: one in a table
 * cell, a footnote, an endnote, a header or a footer, and one given by both the paragraph and its style differently,
 * which aren't followed yet. Undefined when it isn't in one.
 */
const readFrameOf = (
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
    if (reader.inNote && !reader.inCell && !reader.inTextBox) {
        // In a footnote's or endnote's text, Word lays its paragraph out there, as one not in a frame
        // (`word-stops-floats.docx` FR3b, `word-stops-floats2.docx` EN1b)
        return undefined;
    }
    if (reader.inCell || reader.inHeader || reader.inTextBox) {
        return "a text frame in a table cell, header, footer or text box";
    }
    const frame = readFrameProperties(element);
    if (typeof frame === "string") {
        return frame;
    }
    if (own !== undefined && fromStyle !== undefined) {
        // The paragraph's own, when it says all its style's does, is the frame, as Word lays it out (`word-stops-floats.docx`
        // FR4). Whether Word takes the rest from the style's, when it doesn't, isn't known
        const said = new Set(Object.keys(attributesOf(own)));
        if (Object.keys(attributesOf(fromStyle)).some((name) => !said.has(name))) {
            return "a text frame given by both a paragraph and its style";
        }
    }
    return frame;
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
    const read = withEquations(withFitted(readInline(children, paragraphRun, reader), reader), list.items.length > 0, reader);
    // Read to be laid out with a guess, the first thing the reader guessed at in the paragraph's content is why it can't be
    // laid out as Word does, and the markers of what it guessed at are left out of its items
    const guessed = typeof read === "string" ? undefined : read.map(guessOf).find((reason) => reason !== undefined);
    const items = typeof read === "string" ? read : read.filter((item) => guessOf(item) === undefined);
    // A division of a web page (`w:divId`) has margins and borders of its own, in the document's web settings
    const ownFormat = combine(formats);
    const division = readDivision(properties, ownFormat, reader);
    const combined = division === undefined ? ownFormat : combine([ownFormat, division.format]);
    const own = typeof items === "string" ? [] : items;
    const content = typeof items === "string" ? [] : [...list.items, ...items];
    const markFont = fontOf(markRun);
    // A paragraph's lines are on its section's grid unless it turns that off (`w:snapToGrid`), or is in a table cell, and
    // its characters on a grid of characters either way (scripts/layout-probes/word-grid.ts G7, G8, CA11, CC11,
    // word-grid3.ts H6). A footnote's are on a grid that snaps to characters as the body's are, and text spaced out by
    // its run takes as many cells as it needs spaced out (stops2/word-stops-east-asian.ts GR1, GR2)
    const { grid, cellGrid } = reader;
    const sectionGrid = grid ?? cellGrid;
    const paragraphGrid =
        sectionGrid &&
        withoutUndefined({
            linePitch: grid !== undefined && combined.snapToGrid !== false ? grid.linePitch : undefined,
            characterSpace: sectionGrid.characterSpace,
            characterPitch: sectionGrid.characterPitch,
            characterRoom: sectionGrid.characterRoom,
        });
    // Which cells a table's paragraphs, or a footnote's, are on in columns of different widths, and how wide a character of
    // an indent is there, haven't been seen
    const ownCells =
        sectionGrid?.characterRoom !== undefined &&
        (grid === undefined ||
            reader.inNote === true ||
            [combined.indentLeftChars, combined.indentRightChars, combined.firstLineChars].some((count) => (count ?? 0) !== 0))
            ? "a table, note or indent in characters on a grid that snaps to characters in columns of different widths"
            : undefined;
    const format = inPoints(combined, { listNumber: list.items, items: own }, markFont, fontOf(paragraphRun), unitsOf(sectionGrid));
    // The line spacing of a paragraph joined to this one by its hidden mark, in this one's style, with its own, where they
    // differ. Word's probes had multiple spacing, and one paragraph joined to another: exact and at least spacing, and
    // more of them, haven't been seen
    const joined = children.filter((child): child is XmlObject => isObject(child) && JOINED_SPACING in child);
    const joinedSpacing =
        joined.length === 0
            ? undefined
            : combine([...formats.slice(0, -1), readParagraphFormat(childrenOf(joined[0][JOINED_SPACING]))]).lineSpacing;
    const unjoinedSpacing =
        joined.length > 1 ||
        (joined.length > 0 && [combined.lineSpacing, joinedSpacing].some((spacing) => spacing !== undefined && spacing.rule !== "multiple"))
            ? "a hidden paragraph mark between paragraphs of exact or at least line spacing, or more than two of other line spacing"
            : undefined;
    const borders = readBorders(typeof format === "string" ? combined : format);
    // Word breaks the lines of Latin text justified for Thai or with a low kashida as justified ones, and those with a
    // medium or high kashida otherwise (`word-justify.docx` J14, `word-justify2.docx` K08, K09), and of Thai text justified
    // for it too (stops2/word-stops-thai.ts TH1d, TH1e). Arabic text in them hasn't been seen
    const forThaiOrArabic = combined.alignment === "thaiDistributed" || combined.alignment === "lowKashida";
    const tabStops = tabStopsOf(formats);
    // Word lined up the full stop of numbers at decimal stops (`word-watertight-text.docx` TX12a). Whether it lines up the
    // decimal symbol a document's settings give instead, or the computer's, hasn't been seen
    const otherDecimalSymbol =
        reader.decimalSymbol !== undefined && reader.decimalSymbol !== "." && tabStops.some(({ alignment }) => alignment === "decimal");
    const frame = readFrameOf(properties, styleChain(styles, style, "paragraph"), reader);
    const unsupported =
        list.unsupported ??
        ownCells ??
        unknownEastAsianRules(reader.eastAsianRules, own, combined.alignment) ??
        (joinedAcrossRuns(own) ? "Arabic letters joined across runs" : undefined) ??
        (reader.down === true ? unknownDownOf(own, tabStops) : undefined) ??
        (typeof frame === "string"
            ? frame
            : otherDecimalSymbol
              ? "a decimal tab stop in a document whose decimal symbol isn't a full stop"
              : division?.unsupported !== undefined
                ? division.unsupported
                : combined.alignment === "mediumKashida" || combined.alignment === "highKashida"
                  ? "a paragraph justified for Arabic with a medium or high kashida"
                  : forThaiOrArabic && typeof items !== "string" && items.some((item) => item.type === "text" && ARABIC.test(item.text))
                    ? "Arabic text justified for Thai or with a kashida"
                    : (unknownInOlderLayout(
                          content,
                          reader,
                          onOff(properties, "w:autoSpaceDE") !== false || onOff(properties, "w:autoSpaceDN") !== false,
                      ) ??
                      unjoinedSpacing ??
                      (typeof format === "string" ? format : undefined) ??
                      (typeof borders === "string" ? borders : undefined)));
    return {
        type: "paragraph",
        items: content,
        format: {
            ...(typeof format === "string" ? combined : format),
            ...(joined.length === 0
                ? {}
                : { lineSpacingFrom: { marker: JOINED_SPACING_MARKER, ...withoutUndefined({ lineSpacing: joinedSpacing }) } }),
        },
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
        ...(division?.division === undefined
            ? {}
            : { division: division.division, unknownAtTop: "a paragraph in an HTML division at the top of a page or column" }),
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
 * The divisions of a web page in a document's web settings (`w:divs`), by their ids, each with the properties of those it
 * is in, the outermost first
 */
const divisionsIn = (
    divisions: readonly XmlObject[],
    outer: readonly (readonly XmlObject[])[] = [],
): readonly (readonly [string, readonly (readonly XmlObject[])[]])[] =>
    divisions
        .filter((child) => "w:div" in child)
        .flatMap((division) => {
            const chain = [...outer, childrenOf(division["w:div"])];
            return [
                [String(attributesOf(division["w:div"])["w:id"]), chain] as const,
                ...divisionsIn(childrenOf(find(chain[chain.length - 1], "w:divsChild")), chain),
            ];
        });

/**
 * The division of a web page a paragraph is in (`w:divId`), as Word lays it out, or why it can't be laid out. Word lays out
 * a paragraph in a division indented by the margins left and right of the division and of the divisions it is in, added
 * up, with the division's borders as the paragraph's own, outside its indents, and a division's paragraphs together in
 * one box, with its margin above the box and below it as the space before its first paragraph and after its last: 720
 * twips in on each side, and 230 above and below three paragraphs, a margin of 120, a border of 30 and its space of 80
 * (`word-stops-divisions.docx` DV2a, DV2b, `word-stops-pages.docx` DV1a). A division in another with the same margins
 * above and below has them once (DV2d). With the paragraph's own space before or after it, the division's borders and
 * margins above and below aren't laid out that way (DV2c), and its own indents or borders, a division in another with
 * borders or other margins, a quotation or a page's body, and a division in a table cell, a note, a header, a footer or a
 * text box, haven't been seen.
 */
const readDivision = (
    properties: readonly XmlObject[],
    own: ParagraphFormat,
    reader: Reader,
):
    | {
          readonly format: ParagraphFormat;
          readonly division?: NonNullable<ParagraphBlock["division"]>;
          readonly unsupported?: string;
      }
    | undefined => {
    const element = find(properties, "w:divId");
    if (element === undefined) {
        return undefined;
    }
    const id = String(attributesOf(element)["w:val"]);
    const chain = reader.divisions?.get(id);
    if (chain === undefined) {
        return { format: {}, unsupported: "a paragraph in an HTML division the document's web settings don't have" };
    }
    const margin = (name: string): readonly number[] => chain.map((division) => numberOf(valueOf(division, name)) ?? 0);
    const [above, below] = ["w:marTop", "w:marBottom"].map((name) => new Set(margin(name)));
    const borders = chain.flatMap((division) => {
        const border = find(division, "w:divBdr");
        return border === undefined ? [] : [border];
    });
    const spaced = [own.spaceBefore, own.spaceAfter, own.spaceBeforeLines, own.spaceAfterLines].some((space) => (space ?? 0) !== 0);
    const indented = [own.indentLeft, own.indentRight, own.firstLineIndent, own.indentLeftChars, own.indentRightChars, own.firstLineChars];
    const bordered = [own.borderTop, own.borderBottom, own.borderLeft, own.borderRight, own.borderBetween, own.borderBar];
    const unsupported =
        reader.inCell || reader.inNote || reader.inHeader || reader.inTextBox
            ? "a paragraph in an HTML division in a table cell, note, header, footer or text box"
            : chain.some((division) => onOff(division, "w:blockQuote") === true || onOff(division, "w:bodyDiv") === true)
              ? "an HTML division that is a quotation or a page's body"
              : above.size > 1 || below.size > 1 || (chain.length > 1 && borders.length > 0)
                ? "an HTML division in another, with borders, or other margins above or below"
                : spaced || own.autoSpaceBefore === true || own.autoSpaceAfter === true
                  ? "a paragraph in an HTML division with space before or after it"
                  : indented.some((indent) => (indent ?? 0) !== 0) || bordered.some((border) => border !== undefined)
                    ? "a paragraph in an HTML division with indents or borders of its own"
                    : undefined;
    const sum = (name: string): number => margin(name).reduce((total, length) => total + length, 0);
    return {
        format: readParagraphFormat([
            { "w:ind": { _attr: { "w:left": sum("w:marLeft"), "w:right": sum("w:marRight") } } },
            ...borders.map((border) => ({ "w:pBdr": border })),
        ]),
        division: { id, above: Math.max(...above) / TWIPS_PER_POINT, below: Math.max(...below) / TWIPS_PER_POINT },
        ...(unsupported === undefined ? {} : { unsupported }),
    };
};

/**
 * The body's blocks with the margins of the divisions of a web page their paragraphs are in as space before the first
 * paragraph of each division and after its last (see `readDivision`). Space after the paragraph before a division, or
 * before the one after it, or a division next to another, haven't been seen
 */
const withDivisions = (
    blocks: readonly { readonly block: Block; readonly section: number }[],
): readonly { readonly block: Block; readonly section: number }[] => {
    const divisionOf = (at: number): ParagraphBlock["division"] => {
        const block = blocks[at]?.block;
        return block?.type === "paragraph" ? block.division : undefined;
    };
    return blocks.map((placed, at) => {
        const { block } = placed;
        if (block.type !== "paragraph" || block.division === undefined) {
            return placed;
        }
        const { id, above, below } = block.division;
        const [before, after] = [at - 1, at + 1].map(divisionOf);
        const [previous, next] = [blocks[at - 1]?.block, blocks[at + 1]?.block];
        const first = before?.id !== id;
        const last = after?.id !== id;
        const spacedBefore =
            previous?.type === "paragraph" && ((previous.format.spaceAfter ?? 0) > 0 || previous.format.autoSpaceAfter === true);
        const spacedAfter = next?.type === "paragraph" && ((next.format.spaceBefore ?? 0) > 0 || next.format.autoSpaceBefore === true);
        const unsupported =
            (first && before !== undefined) || (last && after !== undefined)
                ? "an HTML division next to another"
                : (first && spacedBefore) || (last && spacedAfter)
                  ? "an HTML division next to a paragraph with space before or after it"
                  : undefined;
        return {
            ...placed,
            block: {
                ...block,
                format: { ...block.format, spaceBefore: first ? above : 0, spaceAfter: last ? below : 0 },
                ...(block.unsupported === undefined && unsupported !== undefined ? { unsupported } : {}),
            },
        };
    });
};

/** Why a cell's text direction (`w:textDirection`) isn't followed, when it is one the schema doesn't have */
const unsupportedCellOf = (properties: readonly XmlObject[]): string | undefined => {
    const direction = valueOf(properties, "w:textDirection");
    return direction === undefined || HORIZONTAL.has(direction) || VERTICAL.has(direction)
        ? undefined
        : "text in a table cell in a direction not yet followed";
};

/**
 * Why text that runs up or down a cell makes its row taller in a way not yet followed, when it does. Word makes a row of
 * only such cells as tall as a line of the last paragraph's mark, whatever the text's size and the space around its
 * paragraphs, and with a picture in it (`word-table-formats.docx` VT1, VT2, `word-table-formats2.docx` VT5 to VT7,
 * `word-stops-vertical-cells.docx` TV5c, `word-stops-vertical-cells2.docx` VC5a to VC5h), and a row with other cells no
 * taller (TV5b, VC1g, VC1h). What a table in it does, which Word lays across the cell (TV5d), and a text box in it, aren't
 * known.
 */
const unsupportedVerticalOf = (blocks: readonly Block[]): string | undefined => {
    const paragraphs = blocks.filter((block): block is ParagraphBlock => block.type === "paragraph");
    if (paragraphs.length < blocks.length) {
        return "text running up or down a table cell with a table in it";
    }
    return paragraphs.some(({ items }) => items.some((item) => item.type === "textBox"))
        ? "text running up or down a table cell with a text box in it"
        : undefined;
};

/**
 * Why a row of only cells of text that runs up or down can't be laid out, when it can't: Word makes it as tall as a line of
 * each cell's last paragraph's mark, as far apart as it lays out lines of text that runs up or down in its font
 * (`verticalLineOf`), which Word's PDFs haven't shown of every font
 */
const unsupportedVerticalRowOf = (
    cells: readonly { readonly vertical?: boolean; readonly blocks: readonly Block[] }[],
): string | undefined =>
    cells.length > 0 &&
    cells.every(({ vertical }) => vertical) &&
    cells.some(({ blocks }) => {
        const last = blocks.findLast((block): block is ParagraphBlock => block.type === "paragraph");
        return last !== undefined && verticalLineOf(last.markFont, () => 0) === undefined;
    })
        ? "a table row of only text running up or down, whose mark is in a font whose lines Word's PDFs haven't shown"
        : undefined;

// The directions of a section's or a cell's text (`w:textDirection`) that run across it, as transitional and strict
// documents write them, as text does without one: from the left, and from the left with East Asian characters on their
// side, which Word lays out as text from the left, on a page (scripts/layout-probes/word-vertical.ts V9, V12) and in a
// cell (`word-stops-vertical-cells.docx` TV6b)
const HORIZONTAL = new Set(["lrTb", "tb", "lrTbV", "tbV"]);
// Those that run down it, with its lines across it from the right, as Word lays out `tbRl` and `btLr`, and from the left,
// as it lays out `tbRlV` and `tbLrV` (V1, V8, V10, V11), as transitional and strict documents write them
const DOWN_FROM_RIGHT = new Set(["tbRl", "btLr", "rl", "lr"]);
const DOWN_FROM_LEFT = new Set(["tbRlV", "tbLrV", "rlV", "lrV"]);

/** Whether a section's text runs down the page (`w:textDirection`), from the right or the left. Undefined across it */
const downOf = (properties: readonly XmlObject[]): "fromRight" | "fromLeft" | undefined => {
    const direction = valueOf(properties, "w:textDirection") ?? "";
    return DOWN_FROM_RIGHT.has(direction) ? "fromRight" : DOWN_FROM_LEFT.has(direction) ? "fromLeft" : undefined;
};
// The directions of text in a cell that run up or down it, which takes no room in its row: up, down, and down with East
// Asian characters upright (TV6a, TV6c)
const VERTICAL = new Set([...DOWN_FROM_RIGHT, ...DOWN_FROM_LEFT]);

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
// The parts of a table style for some of its rows, whose height Word gives the row (`word-stops-tables.docx` TS1a)
const ROW_PARTS = new Set(["firstRow", "lastRow", "band1Horz", "band2Horz"]);
// And whether it is kept whole (`word-stops-tables2.docx` TS10b)
const FOLLOWED_PART_ROW_PROPERTIES = new Set(["w:trHeight", "w:cantSplit"]);
// The table properties of a part of a table style that Word ignores: its space between cells (TS1c)
const IGNORED_PART_TABLE_PROPERTIES = new Set(["w:tblCellSpacing"]);
// A table style's own row properties that are read: its height, which Word ignores (TS5a), and whether its rows are kept
// whole, which it follows (`word-stops-tables2.docx` TS10a); and its own cell properties it follows, its margins, as a
// part's (TS5b)
const READ_STYLE_ROW_PROPERTIES = new Set(["w:trHeight", "w:cantSplit"]);
const FOLLOWED_STYLE_CELL_PROPERTIES = new Set(["w:tcMar"]);
// A row's table properties of its own (`w:tblPrEx`) that are followed: its borders and cell margins, which Word gives its
// cells as the table's (TS4)
const FOLLOWED_ROW_TABLE_PROPERTIES = new Set(["w:tblBorders", "w:tblCellMar"]);

/** The last of a property given among properties, each over those before: those of a table's styles, then its own */
const lastOf = (properties: readonly (readonly XmlObject[])[], name: string): unknown =>
    properties.reduce<unknown>((found, given) => find(given, name) ?? found, undefined);

// Which parts of its style Word turns on for a table that doesn't say: its first row and column and its bands of rows, as
// it turns on in the tables it makes (word-table-formats.docx CF2, word-table-formats2.docx CF14)
const UNSAID_LOOK: TableLook = { firstRow: true, lastRow: false, firstColumn: true, lastColumn: false, rowBands: true, columnBands: false };

/** A cell as it is read, before the room around its text, from its borders and the space between cells, is worked out */
type ReadCell = TableCell & {
    readonly borders: BorderSet;
    readonly margins: Margins;
    readonly gridWidth: number;
};

// What in a cell merged across columns as old versions of Word wrote them, after the first, Word hasn't been seen to lay out,
// with text that isn't empty
const MERGED_CONTENT = new Set(["w:tab", "w:br", "w:sym", "w:drawing", "w:pict", "w:object", "w:tbl", "m:oMath"]);

/** Whether an element has anything in it Word lays out: text that isn't empty, or what `MERGED_CONTENT` names */
const hasMergedContent = (element: unknown): boolean =>
    Array.isArray(element)
        ? element.some(hasMergedContent)
        : isObject(element) &&
          Object.entries(element).some(([name, value]) =>
              name === "w:t" ? textIn(value) !== "" : MERGED_CONTENT.has(name) || (name !== "_attr" && hasMergedContent(value)),
          );

/**
 * A row's cells, with those merged across columns as old versions of Word wrote them (`w:hMerge`) together: each cell that
 * goes on from the one before it is in its group, which Word lays out as one cell across their columns
 * (`word-stops-tables.docx` TS6)
 */
const mergedAcross = <Cell extends { readonly element: XmlObject }>(cells: readonly Cell[]): readonly (readonly Cell[])[] =>
    cells.reduce<readonly (readonly Cell[])[]>((groups, cell) => {
        const merge = find(childrenOf(find(contentOf(cell.element).filter(isObject), "w:tcPr")), "w:hMerge");
        const goesOn = merge !== undefined && attributesOf(merge)["w:val"] !== "restart";
        return goesOn && groups.length > 0 ? [...groups.slice(0, -1), [...groups[groups.length - 1], cell]] : [...groups, [cell]];
    }, []);

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
    // The margins a table's style gives its cells as theirs (`w:tcPr`), over the table's, as Word gives them (TS5b)
    const styleCellMargins: Partial<Margins> = Object.assign(
        {},
        ...tableStyles.map(({ cellProperties = [] }) => readCellMargins(find(cellProperties, "w:tcMar"))),
    );
    // Each of the table's borders from the last that gives it: its styles', then its own (word-table-formats.docx BC6)
    const tableBorders: BorderSet = Object.assign({}, ...allProperties.map((given) => readBorderSet(find(given, "w:tblBorders"))));
    const givenSpacing = readCellSpacing(lastOf(allProperties, "w:tblCellSpacing"));
    // Word lays out a table whose space between cells is a share of its width without any (word-stops-table-borders.docx
    // TB6a, TB6b)
    const tableSpacing = givenSpacing === "share" ? 0 : givenSpacing;
    const { "w:w": indentValue, "w:type": indentType = "dxa" } = attributesOf(lastOf(allProperties, "w:tblInd"));
    // Word lays out a table indented by a share of the width as though it weren't indented (word-stops-tables2.docx TS11a,
    // TS11b: 10% and -5%)
    const indent = indentType === "nil" || indentType === "pct" ? 0 : indentType === "dxa" ? (twips(indentValue) ?? 0) : undefined;
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
        /** The height of the parts for the cell's row (`w:trHeight`), as written */
        readonly height?: Record<string, unknown>;
        /** Whether the parts for the cell's row keep it whole (`w:cantSplit`), when they say */
        readonly cantSplit?: boolean;
        readonly unsupported?: string;
    } => {
        if (conditional.length === 0) {
            return UNFORMATTED;
        }
        const applying = conditionalTypesOf(position, look, bands).flatMap((type) => conditional.filter(([given]) => given === type));
        // A height of a part for rows is followed, and space between cells of a part ignored, as Word does
        const unfollowed = applying.some(
            ([type, format]) =>
                changesLines(format.tableProperties, IGNORED_PART_TABLE_PROPERTIES) ||
                changesLines(format.rowProperties, ROW_PARTS.has(type) ? FOLLOWED_PART_ROW_PROPERTIES : undefined) ||
                changesLines(format.cellProperties, FOLLOWED_CELL_PROPERTIES),
        );
        const heights = applying.flatMap(([, { rowProperties }]) => {
            const height = find(rowProperties, "w:trHeight");
            return height === undefined ? [] : [attributesOf(height)];
        });
        const keptWhole = applying.flatMap(([, { rowProperties }]) => {
            const whole = onOff(rowProperties, "w:cantSplit");
            return whole === undefined ? [] : [whole];
        });
        return {
            formats: [...ownStyles, ...applying.map(([, format]) => format)],
            borders: Object.assign({}, ...applying.map(([, { cellProperties }]) => readBorderSet(find(cellProperties, "w:tcBorders")))),
            margins: Object.assign({}, ...applying.map(([, { cellProperties }]) => readCellMargins(find(cellProperties, "w:tcMar")))),
            ...withoutUndefined({
                height: heights[heights.length - 1],
                cantSplit: keptWhole[keptWhole.length - 1],
                unsupported: unfollowed ? "a table style's formatting for some of its cells" : undefined,
            }),
        };
    };

    // What a style without parts for some cells gives each cell
    const UNFORMATTED = { formats: ownStyles, borders: {}, margins: {} };

    // Whether the table's style keeps its rows whole (`word-stops-tables2.docx` TS10a), the last of its styles that says
    const styleKept = tableStyles.reduce<boolean | undefined>(
        (whole, { rowProperties = [] }) => onOff(rowProperties, "w:cantSplit") ?? whole,
        undefined,
    );

    const gridWidth = (from: number, to: number): number => grid.slice(from, to).reduce((total, value) => total + value, 0);

    const read = rows.map(
        (
            { element: row, bookmarks: rowBookmarks },
            rowIndex,
        ): {
            readonly cells: readonly ReadCell[];
            readonly deleted: boolean;
            readonly row: Omit<TableRow, "cells" | "borderTop" | "borderBottom">;
            readonly spacing: number | "share" | undefined;
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
            const rowCells = mergedAcross(withBookmarks(rowParts, "w:tc"));
            // The row's table properties of its own (`w:tblPrEx`): its borders and cell margins, which its cells have as the
            // table's (TS4). Most rows have none, so nothing is read for them
            const exceptions = childrenOf(find(rowChildren, "w:tblPrEx"));
            const rowBorderSet = exceptions.length > 0 ? readBorderSet(find(exceptions, "w:tblBorders")) : {};
            const rowMargins = exceptions.length > 0 ? readCellMargins(find(exceptions, "w:tblCellMar")) : {};
            // A row is as tall as the parts of its table's style for it say, when it doesn't say itself (TS1a)
            const ownHeight = find(rowProperties, "w:trHeight");
            const heightAttributes =
                ownHeight === undefined
                    ? (formatsOf({ row: rowIndex, rows: rows.length, cell: 0, cells: rowCells.length, headerRows }).height ?? {})
                    : attributesOf(ownHeight);
            const height = twips(heightAttributes["w:val"]);
            const { "w:hRule": rule } = heightAttributes;
            const skipped = numberOf(attributesOf(find(rowProperties, "w:gridBefore"))["w:val"]) ?? 0;
            // The width before a row that starts past the first column (`w:wBefore`), which Word sizes the columns by as a
            // cell's (word-stops-long-words2.docx LW7a, LW7b), when it is in twips
            const { "w:w": beforeValue, "w:type": beforeType = "dxa" } = attributesOf(find(rowProperties, "w:wBefore"));
            const widthBefore = skipped > 0 && beforeType === "dxa" ? twips(beforeValue) : undefined;
            const ownSpacing = find(rowProperties, "w:tblCellSpacing");
            const spacing = ownSpacing === undefined ? tableSpacing : readCellSpacing(ownSpacing);
            // A deleted row is read only as Word sizes the columns by it, with its notes and lists left uncounted, or, where
            // nothing sizes them, for its bookmarks, with its deleted runs read as nothing
            const deleted = deletedFlags[rowIndex];
            // A deleted row's page references with \p are counted, as docx counts them, but for those in its deleted text
            const rowReader = deleted ? sizingReaderOf(cellReader, sized, true) : cellReader;
            const counts = deleted ? JSON.stringify([...rowReader.counters]) : "";
            // Word numbers the notes a deleted row refers to, though it doesn't lay them out, as those of deleted text: one
            // after a deleted footnote reference 1 is 2 (stops2/word-stops-tracked.docx TR4b). A footnote or endnote
            // reference with a mark of its own isn't counted, as where it isn't deleted
            (deleted ? elementsIn(rowChildren, (inner) => REMOVED_NOTES.has(inner)) : [])
                .filter((reference) => !hasOwnMark(reference))
                .forEach((reference) => cellReader.notes?.skip("w:endnoteReference" in reference ? "endnote" : "footnote"));
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
                ({ column, cells: done, edges: before, unsupported: unsupportedBefore }, [{ element: cell }, ...across], cellIndex) => {
                    const cellChildren = contentOf(cell).filter(isObject);
                    const cellProperties = childrenOf(find(cellChildren, "w:tcPr"));
                    const spanOf = (given: readonly XmlObject[]): number => numberOf(attributesOf(find(given, "w:gridSpan"))["w:val"]) ?? 1;
                    // The cells merged with it across columns as old versions of Word wrote them, which add their columns,
                    // and their widths, to its own (TS6)
                    const acrossProperties = across.map((merged) => childrenOf(find(contentOf(merged.element).filter(isObject), "w:tcPr")));
                    const span = [cellProperties, ...acrossProperties].reduce((total, given) => total + spanOf(given), 0);
                    const mergeElement = find(cellProperties, "w:vMerge");
                    const merge =
                        mergeElement === undefined ? undefined : attributesOf(mergeElement)["w:val"] === "restart" ? "restart" : "continue";
                    const formatted = formatsOf({ row: rowIndex, rows: rows.length, cell: cellIndex, cells: rowCells.length, headerRows });
                    const margins = {
                        ...tableMargins,
                        ...rowMargins,
                        ...styleCellMargins,
                        ...formatted.margins,
                        ...readCellMargins(find(cellProperties, "w:tcMar")),
                    };
                    // The row's own table borders, where the cell is: its left and right at the row's ends, its inside ones
                    // between its cells, its top and bottom on the table's first and last rows, and its inside ones between
                    const last = cellIndex === rowCells.length - 1;
                    const rowSides =
                        exceptions.length > 0
                            ? withoutUndefined({
                                  left: cellIndex === 0 ? rowBorderSet.left : rowBorderSet.insideV,
                                  right: last ? rowBorderSet.right : rowBorderSet.insideV,
                                  top: rowIndex === 0 ? rowBorderSet.top : rowBorderSet.insideH,
                                  bottom: rowIndex === rows.length - 1 ? rowBorderSet.bottom : rowBorderSet.insideH,
                              })
                            : {};
                    // Word lays a cell out at its own width in twips, when it has one, rather than the grid's. A share of the
                    // table's width is the grid's
                    const widthOf = (given: readonly XmlObject[]): { readonly twips: number; readonly given: boolean } => {
                        const { "w:w": ownWidth, "w:type": widthType = "dxa" } = attributesOf(find(given, "w:tcW"));
                        const inTwips = widthType === "dxa" ? (twips(ownWidth) ?? 0) : 0;
                        return { twips: inTwips, given: inTwips > 0 || (widthType === "pct" && (shareOf(ownWidth) ?? 0) > 0) };
                    };
                    const widths = [cellProperties, ...acrossProperties].map(widthOf);
                    const hasWidth = widths.some(({ given }) => given);
                    const width = widths.every(({ twips: inTwips }) => inTwips > 0)
                        ? widths.reduce((total, { twips: inTwips }) => total + inTwips, 0)
                        : gridWidth(column, column + span);
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
                                (across.some((merged) => hasMergedContent(merged.element))
                                    ? "cells merged across columns as old versions of Word wrote them, with text after the first"
                                    : undefined) ??
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
                                ...(onOff(cellProperties, "w:tcFitText") === true ? { fitText: true } : {}),
                                ...(onOff(cellProperties, "w:noWrap") === true ? { noWrap: true } : {}),
                                ...(sizing ? { sizing } : {}),
                                borders: { ...rowSides, ...formatted.borders, ...readBorderSet(find(cellProperties, "w:tcBorders")) },
                                margins,
                                gridWidth: width,
                            },
                        ],
                    };
                },
                { column: skipped, cells: [], edges: new Map([[skipped, widthBefore ?? gridWidth(0, skipped)]]) },
            );
            // A row of a division of a web page (`w:divId`) Word moves across by the division's left margin, as wide and
            // as tall as it is without, with the division's borders beside it but not above or below
            // (`word-stops-pages.docx` DV1b), so its lines are as they are. One with table properties of its own
            // (`w:tblPrEx`) other than borders and cell margins, such as a width, isn't followed. Its own borders are its
            // cells', with space between them too (word-stops-table-borders2.docx BT6a to BT6c)
            const rowUnsupported = rowParts.some((part) => "w:sdt" in part)
                ? BOUND_CONTROL
                : changesLines(exceptions, FOLLOWED_ROW_TABLE_PROPERTIES)
                  ? "a table row with table properties of its own"
                  : deleted && JSON.stringify([...rowReader.counters]) !== counts
                    ? "a list in a deleted table row"
                    : unseenHeaderCount
                      ? "a deleted row in a table's header of several rows, whose style formats some of its rows"
                      : (cellsUnsupported ?? unsupportedVerticalRowOf(cells.filter(({ verticalMerge }) => verticalMerge === undefined)));
            return {
                cells,
                deleted,
                edges,
                end,
                spacing,
                ...withoutUndefined({ unsupported: rowUnsupported }),
                bookmarks: rowBookmarks,
                cellBookmarks: rowCells.map((group) => group.flatMap(({ bookmarks }) => bookmarks)),
                row: {
                    // A height without a rule is the least the row can be, as Word writes it
                    ...(height !== undefined && rule !== "auto"
                        ? { height: { value: height, rule: rule === "exact" ? "exact" : "atLeast" } }
                        : {}),
                    header: onOff(rowProperties, "w:tblHeader") === true,
                    // Kept whole as the row says, or else the parts of its table's style for it, or else the style
                    cantSplit:
                        (onOff(rowProperties, "w:cantSplit") ??
                            formatsOf({ row: rowIndex, rows: rows.length, cell: 0, cells: rowCells.length, headerRows }).cantSplit ??
                            styleKept) === true,
                    ...(widthBefore === undefined ? {} : { before: widthBefore }),
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
    const givenWidth = readTableWidth(properties);
    // Rows with space between their cells of their own have it in place of the table's, at the table's edges too, as a
    // table with that space has it (word-stops-table-borders.docx TB6c, TB6d), and rows of different space each their own,
    // the table's columns as wide as they would be without (word-stops-table-borders2.docx BT5a, BT5b: rows of 2, 5 and 2
    // points in a table of 2 and of none, of columns given widths, in a table of a width of its own). How wide Word makes
    // the columns of a table sized to its text, or with no width of its own, of rows of different space, hasn't been seen,
    // nor a row of none among rows with some, which Word lays out with its borders where neither has them (BT5c). Space of
    // the type `auto` is none (BT5d, BT5e). A row's space as a share of the table's width hasn't been followed (BT5c), and
    // a deleted row's doesn't count, as it takes no room, nor does the space around it (word-tracked-tables.docx MK14h)
    const rowSpacings = new Set(kept.map(({ spacing }) => spacing));
    const spacingUnsupported =
        tableSpacing === undefined || rowSpacings.has(undefined)
            ? "space between table cells of a width that isn't in twips"
            : rowSpacings.has("share")
              ? "space between a table row's cells as a share of the table's width"
              : rowSpacings.size > 1 && rowSpacings.has(0)
                ? "table rows with space between their cells beside rows without"
                : rowSpacings.size > 1 && (fits || givenWidth.width === undefined)
                  ? "table rows with different space between their cells, in a table sized to its text or with no width of its own"
                  : undefined;
    // The space between each row's cells, when it is followed, and the space the table's columns are sized by: its first
    // row's
    const spacingOfRow = (spacing: number | "share" | undefined): number =>
        spacingUnsupported === undefined && typeof spacing === "number" ? spacing : 0;
    const followedSpacing = spacingOfRow(kept[0]?.spacing ?? tableSpacing);
    // The room around each row's and cell's text, from the borders and the space between its cells
    const geometryOf = (laidOut: typeof read, spacing?: number): TableGeometry | string =>
        tableGeometry(
            laidOut.map(({ cells, spacing: own }) => ({ cells, spacing: spacing ?? spacingOfRow(own) })),
            tableBorders,
        );
    const spaced = followedSpacing > 0;
    const keptGeometry = geometryOf(kept);
    // With space between cells, a deleted row takes no room, nor does the space around it (word-tracked-tables.docx
    // MK14h), and with borders, the rows around it are as they would be without it, each cell's borders and the space
    // between them as between two rows (stops2/word-stops-tracked.docx TR4c). Which borders Word gives the rows around a
    // deleted one with borders of its own, or a deleted row at the table's top or bottom, hasn't been seen
    const bordersOf = (index: number): string => JSON.stringify(read[index]?.cells.map(({ borders }) => borders));
    const bordered = (): boolean =>
        ([tableBorders.top, tableBorders.bottom, tableBorders.insideH].some(isDrawn) ||
            read.some(({ cells }) => cells.some(({ borders }) => isDrawn(borders.top) || isDrawn(borders.bottom)))) &&
        read.some(({ deleted }, index) => {
            const above = read.findLastIndex((row, at) => at < index && !row.deleted);
            const below = read.findIndex((row, at) => at > index && !row.deleted);
            return deleted && (above < 0 || below < 0 || bordersOf(above) !== bordersOf(index) || bordersOf(below) !== bordersOf(index));
        });
    const geometry =
        kept.length === read.length || typeof keptGeometry === "string"
            ? keptGeometry
            : !spaced
              ? withDeletedBorders(keptGeometry, geometryOf(read), deletedFlags)
              : bordered()
                ? "a deleted row in a table with borders and space between its cells, at its top or bottom or with borders of its own"
                : keptGeometry;
    // The room around each cell as the table's columns are sized by it: with its first row's space between cells in each row
    const sizingGeometry = rowSpacings.size > 1 && typeof geometry !== "string" ? geometryOf(kept, followedSpacing) : geometry;
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
        const sizing = typeof sizingGeometry === "string" ? undefined : sizingGeometry[tableRows.length];
        const above = tableRows[tableRows.length - 1];
        // eslint-disable-next-line functional/immutable-data
        tableRows.push({
            ...row,
            borderTop: placed?.borderTop ?? 0,
            borderBottom: placed?.borderBottom ?? 0,
            ...withoutUndefined({ breakBorder: placed?.breakBorder, breakTop: placed?.breakTop }),
            cells: cells.map(({ borders: _, margins, gridWidth: __, ...cell }, cellIndex) => {
                const pending = [...carried, ...cellBookmarks[cellIndex]];
                const marked = pending.length === 0 ? undefined : startingAtFirst(cell.blocks, pending);
                carried = marked === undefined ? pending : [];
                const around = placed?.cells[cellIndex];
                // A cell's width with the space between cells is as wide as Word sizes its column from, as the table's columns
                // are narrowed to keep its width (word-table-formats2.docx CS9)
                const sizingCell = sizing?.cells[cellIndex];
                const spacingRoom = sizingCell === undefined ? 0 : sizingCell.left - margins.left + sizingCell.right - margins.right;
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
    // A table style's own row and cell properties apply to every row and cell, in a way not yet followed but for those Word
    // ignores and its cells' margins (TS5a, TS5b)
    const styleUnsupported = tableStyles.some(
        ({ rowProperties = [], cellProperties = [] }) =>
            changesLines(rowProperties, READ_STYLE_ROW_PROPERTIES) || changesLines(cellProperties, FOLLOWED_STYLE_CELL_PROPERTIES),
    )
        ? "a table style with formatting of its rows or cells"
        : undefined;
    // Word evens out the rows of a table whose cells all have widths, or of one laid out fixed, that give a column different
    // widths, with a width of its own in twips, a share of the width, or none (`word-watertight-stops.docx` SP14,
    // `word-table-widths.docx` TW1 to TW6, `word-stops-long-words2.docx` LW6d to LW6f), with space between its cells, not
    // laid out fixed (`word-stops-long-words.docx` LW5c), and with a row that starts past the first column, the width before
    // it as a cell's (`w:gridBefore`, `w:wBefore`: LW7a, LW7b). Space between the cells of one laid out fixed, and a row
    // that starts past the first column with no width in twips before it, aren't known
    const evenable = !(spaced && fixed) && read.every(({ edges, row }) => edges.has(0) || row.before !== undefined);
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
    // beside a drawing with square wrapping (`word-floats2.docx` G24 to G29). In a footnote's text, Word lays it out there,
    // as a table that doesn't float (`word-stops-floats.docx` FT6c). One in a table cell, a header or footer, or an
    // endnote, which Word lays out otherwise (FT6a, FT6b) or hasn't been seen, isn't followed yet
    // In a footnote's or an endnote's text, Word lays a table that text flows around out as one it doesn't flow around
    // (`word-stops-floats.docx` FT6c, `word-stops-floats2.docx` EN1a)
    const inNoteText = reader.inNote === true && !reader.inCell && reader.inTextBox !== true;
    const floatElement = inNoteText ? undefined : find(properties, "w:tblpPr");
    const float = floatElement === undefined ? undefined : readTableFloat(floatElement, find(properties, "w:tblOverlap"));
    // In compatibility mode, Word 2010 and before put a table's text, rather than its borders, at its indent, and give one
    // sized to its text its cells' margins beside the room for it, the page's text or what its indent leaves of it
    // (`word-stops-compat-14.docx` CM4, CM5, CM11, CM16, `word-stops-compat2-14.docx`, `-12` CN8a). One in a table cell
    // they size as Word 2013 does, its borders at the cell's text (CN8d). How they size one as a share of the width hasn't
    // been seen: wider than the share, by its first cell's margin, at least (CN8b), nor one indented or as a share of the
    // width in a table cell. One that text flows around they place with its text where Word 2013 puts its border, its
    // first cell's margin and half its left border to the left (CM10, CN9), the text beside it half a point from it with
    // no distance given, as in Word 2013's mode (CN9; see `readTableFloat`). One lined up across the page, or sized to its
    // text, which haven't been seen, stop the layout
    const older = reader.compatibilityMode !== undefined;
    const marginsBeside = older && sized && givenWidth.width === undefined && reader.inCell !== true;
    // How wide Word makes a column of text that runs up or down isn't known in every font, so how wide a table sized to its
    // text with one is isn't known there, where the text beside it, or the columns of a table sized to its text it is in,
    // depend on it
    const verticalUnsupported =
        fits &&
        (float !== undefined || reader.inSizedTable === true) &&
        tableCells.some((cell) => cell.vertical && !isVerticalWidthKnown(cell))
            ? "text that runs up or down a cell of a table sized to its text, in a table cell or that text flows around"
            : undefined;
    const unsupported =
        withoutGuess?.unsupported ??
        (reader.down === true ? "a table on text that runs down the page" : undefined) ??
        (float !== undefined && (reader.inCell || reader.inHeader)
            ? "a table that text flows around in a table cell, header or footer"
            : undefined) ??
        (typeof float === "object" && older && (marginsBeside || float.horizontal.align !== undefined)
            ? "a table that text flows around, sized to its text or lined up across the page, in a document in compatibility mode"
            : undefined) ??
        (marginsBeside && fits && givenWidth.share !== undefined
            ? "a table sized to its text as a share of the width, in a document in compatibility mode"
            : undefined) ??
        (older &&
        sized &&
        fits &&
        givenWidth.width === undefined &&
        reader.inCell === true &&
        (indent !== 0 || givenWidth.share !== undefined)
            ? "a table sized to its text in a table cell, indented or as a share of the width, in a document in compatibility mode"
            : undefined) ??
        (typeof float === "string" ? float : undefined) ??
        (parts.some((part) => "w:sdt" in part) ? BOUND_CONTROL : undefined) ??
        read.find((row) => row.unsupported !== undefined)?.unsupported ??
        unmerged ??
        (fits ? unfitted : unequal && !evened ? "a table whose rows give a column different widths" : undefined) ??
        verticalUnsupported ??
        spacingUnsupported ??
        (typeof geometry === "string" ? geometry : undefined) ??
        (indent === undefined ? "a table indent of a type not yet followed" : undefined) ??
        // Word laid out tables of 25 to 50 times the width they are in as wide as it, and one of 40 times narrower, but one of
        // 45 times past the page (`word-stops-long-words.docx` LW1h, LW1i, LW5a, LW5b, LW5f)
        ((givenWidth.share ?? 0) > 1 ? "a table whose width is a share of more than the width it is in" : undefined) ??
        styleUnsupported ??
        blocks.find((block) => block.unsupported !== undefined)?.unsupported;
    // With space between cells, Word keeps a table's width, its own or its first row's cells', laid out fixed or not, and
    // narrows its columns for the space (word-table-formats2.docx CS9, CS10, CS14)
    const rowWidth = (read[0]?.cells ?? []).reduce((total, cell) => total + (cell.ownWidth ?? 0), 0);
    const borderLeft = roomOf(tableBorders.left) ?? 0;
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
        borderLeft,
        borderRight: roomOf(tableBorders.right) ?? 0,
        ...(indent ? { indent } : {}),
        ...(spaced ? { cellSpacing: followedSpacing } : {}),
        ...(deletedRows.length > 0 ? { deletedRows } : {}),
        ...(typeof float === "object" ? { float: older ? textAtPosition(float, tableRows, borderLeft) : float } : {}),
        ...(marginsBeside ? { marginsBeside } : {}),
        ...(unsupported ? { unsupported } : {}),
        ...(withoutGuess ? { noGuess: true } : {}),
    };
};

/**
 * A table that text flows around placed as Word 2010 and before place it: with its first cell's text, rather than its left
 * border, where it is placed across the page, its first cell's margin and half its left border to the left of where Word
 * 2013 places it (`word-stops-compat-14.docx` CM10, `word-stops-compat2-14.docx` CN9: 113 twips, for a margin of 108 and a
 * border of half a point)
 */
const textAtPosition = (float: TableFloat, rows: readonly TableRow[], borderLeft: number): TableFloat => {
    const { horizontal } = float;
    const shift = (rows[0]?.cells[0]?.marginLeft ?? 0) + borderLeft / 2;
    return horizontal.offset === undefined ? float : { ...float, horizontal: { ...horizontal, offset: horizontal.offset - shift } };
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

/**
 * Where a table that text flows around is (`w:tblpPr`), or why it can't be followed. One that doesn't say what it is
 * placed against is placed against the column across the page and the margins down it, as Word places it
 * (`word-stops-floats.docx` FT7a, FT7b, `word-stops-floats2.docx` CO1a). Lined up inline against the text, it is at the
 * top of the paragraph after it (FT7c)
 */
const readTableFloat = (element: unknown, overlap: unknown): TableFloat | string => {
    const attributes = attributesOf(element);
    const position = (anchor: keyof typeof TABLE_AXES, spec: string, at: string): DrawingPosition | string => {
        const { from: anchors, alignments } = TABLE_AXES[anchor];
        const given = attributes[`w:${anchor}`];
        // Without what it is placed against, Word places it against the column across the page (`word-stops-floats.docx`
        // FT7a, `word-stops-floats2.docx` CO1a) and the margins down it (FT7b)
        const from = given === undefined ? (anchor === "horzAnchor" ? "column" : "margin") : anchors.get(String(given));
        const align = attributes[`w:${spec}`];
        if (from === undefined) {
            return "a table that text flows around placed against what isn't followed yet";
        }
        if (align === "inline" && from === "paragraph") {
            return { from, align: "top" };
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
    // Word keeps the text beside a table half a point from it with no distance from the text given, where a distance of
    // 180 or 200 twips is as given: the text right of a table 3000 twips wide placed 2000 from the margin, with borders of
    // half a point, from 5019 twips with none (`word-stops-compat2-15.docx` CN9, `word-stops-compat-15.docx` CM10, whose
    // justified lines left of it end at 1990), from 5189 with 180 (`word-stops-floats.docx` FT1b), and 3210 from the
    // margin's left with 200 beside one at the left of the margins (`word-floats3.docx` H2). Text beside a picture or a
    // frame with no distance is at its edge (`word-stops-compat2-15.docx` CN6a to CN6d, CN7a, CN7b). Whether a distance
    // under half a point is kept at half a point hasn't been seen
    const beside = (name: string): number | string => {
        const given = distance(name);
        return given === 0
            ? HALF_POINT
            : given < HALF_POINT
              ? "a table that text flows around less than half a point from the text beside it"
              : given;
    };
    const [left, right] = [beside("left"), beside("right")];
    if (typeof left === "string" || typeof right === "string") {
        return typeof left === "string" ? left : (right as string);
    }
    return {
        horizontal,
        vertical,
        distances: { top: distance("top"), bottom: distance("bottom"), left, right },
        mayOverlap: attributesOf(overlap)["w:val"] !== "never",
    };
};

// How far Word keeps the text beside a table that text flows around from it with no distance given, in points
const HALF_POINT = 0.5;

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
// HM1f), its right and first line indents, its tab stops and its borders, as none drawn where only the second had them
// (stops2/word-stops-hidden.docx HD1c, HD1d, HD1g, HD1h), and the line spacing of each, line by line (see
// {@link joinedToNext}), by the attributes of the elements they are in, or all of them
const JOINED_FORMATTING: Readonly<Record<string, readonly string[] | "all" | undefined>> = {
    "w:jc": ["w:val"],
    "w:ind": ["w:left", "w:start", "w:right", "w:end", "w:firstLine", "w:hanging"],
    "w:spacing": ["w:before", "w:after", "w:line", "w:lineRule"],
    "w:tabs": "all",
    "w:pBdr": "all",
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
            if (joined === "all") {
                return [];
            }
            if (joined === undefined) {
                return [child];
            }
            const kept = Object.entries(attributesOf(child[name])).filter(([key]) => !joined.includes(key));
            return kept.length === 0 ? [] : [{ [name]: Object.fromEntries(kept) }];
        }),
    );

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
 * (`word-breaks-and-tabs.docx` HM1a to HM1f). Where their line spacing differs, each line is spaced as the paragraph its
 * text ends in, from the line the next one's text starts on: with the first single and the next one double, or the other
 * way round, or at 1.5 lines, the line that ends the first one's text and starts the next one's, and those after it, are
 * the next one's (HM1h, HM1i, `stops2/word-stops-hidden.docx` HD1f). The next one's number, when they are in a list, is
 * counted (HM4).
 */
const joinedToNext = (first: XmlObject, between: readonly unknown[], next: XmlObject, styles: TextStyles): XmlObject => {
    const isHead = (child: unknown): boolean => isObject(child) && (nameOf(child) === "_attr" || nameOf(child) === "w:pPr");
    const own = paragraphPropertiesOf(first);
    const nextProperties = paragraphPropertiesOf(next);
    const lineOf = (given: readonly XmlObject[]): Record<string, unknown> =>
        Object.fromEntries(
            Object.entries(attributesOf(find(given, "w:spacing"))).filter(([key]) => key === "w:line" || key === "w:lineRule"),
        );
    const nextLine = lineOf(nextProperties);
    const spacedApart = JSON.stringify(lineOf(own)) !== JSON.stringify(nextLine);
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
            ...(spacedApart ? [{ [JOINED_SPACING]: [{ "w:spacing": { _attr: nextLine } }] }] : []),
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
 * shown in the formatting of the first, but for the next one's space after, where the two differ only in their
 * alignment, left indent and space before and after (`word-watertight-text.docx` TX11a, `word-breaks-and-tabs.docx`
 * HM1a to HM1f). One with nothing shown takes no room, whatever its formatting, and the paragraph after it keeps its
 * own (HM3, `word-seq.docx` Q8, `word-hidden-paragraphs.docx` HP1): before a paragraph, in a list too, where it takes a
 * number (HP5), before a table and at the end of the document (HP2a, HP8). It is read where it is, for its fields and
 * number, and then left out. One with no paragraph after it, before a table or at the end of a table cell, stays as it
 * is (HM2a, HM2b), and at the end of a cell so does one with nothing shown, which takes a line there (HP2b, HP2c). One
 * whose section ends with it, with nothing shown, before a section that starts on its page and is otherwise alike, in
 * one column, takes no room either (`stops2/word-stops-hidden-edges.docx` HD10). Joined in a table whose columns Word
 * sizes to their text, the two are sized as one, as they are laid out: a column as wide as their text on one line
 * (`word-stops-hidden.docx` HD2, and `word-breaks-and-tabs.docx` HM7, narrowed beside a long cell). Where the
 * paragraphs differ in their right and first line indents, tab stops and borders, they are in the first one's (HD1c,
 * HD1d, HD1g, HD1h), and in their line spacing, line by line (see {@link joinedToNext}). Where they differ otherwise,
 * such as in their style (HM1g), and what Word does with a hidden mark at the start of a content control (see
 * {@link openedAtEnds}), with another hidden section break, with one of a paragraph showing nothing at the end of a header or
 * footer, which a header too short to push the body down didn't show (HD4a), or of a note, where Word joins it to the
 * next note's first paragraph (HD4b), and before one showing nothing whose fields, note references or number would be
 * read out of order, isn't followed yet.
 */
const hiddenMarkJoin = (
    paragraph: XmlObject,
    next: XmlObject | undefined,
    {
        styles,
        edge,
        part,
        nextSection,
    }: { readonly styles: TextStyles; readonly edge: boolean; readonly part: Part; readonly nextSection: () => unknown },
): { readonly reason: string } | { readonly joins: true } | { readonly leftOut: true } | undefined => {
    const nextName = next === undefined ? undefined : nameOf(next);
    const shown = showsSomething(contentOf(paragraph), paragraphRunOf(paragraph, styles), styles);
    const section = sectionPropertiesOf(paragraph);
    if (section !== undefined) {
        return !shown && startsOnItsPage(section, nextSection()) ? { leftOut: true } : { reason: "a hidden section break" };
    }
    if (edge) {
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
    if (isLeftOut(next)) {
        return { reason: "a hidden paragraph mark before a paragraph with nothing shown and its mark hidden" };
    }
    return paragraphFormatOf(paragraph, styles) === paragraphFormatOf(next, styles)
        ? { joins: true }
        : { reason: "a hidden paragraph mark between paragraphs of other styles, or formatted differently otherwise" };
};

/** How a section starts (`w:type`): on a new page, unless it says otherwise */
const sectionTypeOf = (section: unknown): string => valueOf(childrenOf(section), "w:type") ?? "nextPage";

/**
 * Whether the section after a section break starts on the page the break is on, and is otherwise as the section before
 * it is, in one column: with a break or without, its text is laid out the same
 */
const startsOnItsPage = (section: unknown, next: unknown): boolean => {
    const rest = (properties: unknown): string => JSON.stringify(childrenOf(properties).filter((child) => nameOf(child) !== "w:type"));
    return (
        sectionTypeOf(next) === "continuous" &&
        rest(section) === rest(next) &&
        (numberOf(attributesOf(find(childrenOf(section), "w:cols"))["w:num"]) ?? 1) <= 1
    );
};

// An element no document has, which stands where a content control or custom XML started whose content is read in its
// place, as Word joins its last paragraph to the paragraph after it (see {@link openedAtEnds})
const CONTROL_START = "docx-layout:control-start";

/** The content of a content control or custom XML, unless it is bound to custom XML, which is laid out as it is */
const openableContentOf = (element: XmlObject): readonly XmlObject[] | undefined => {
    const name = nameOf(element);
    const content =
        name === "w:customXml"
            ? contentOf(element)
            : name === "w:sdt" && !isBound(element)
              ? childrenOf(find(childrenOf(element[name]), "w:sdtContent"))
              : undefined;
    return content?.filter(isObject);
};

/** Whether a paragraph is joined to the paragraph after it: one whose mark is deleted, or hidden with text shown */
const joinsNext = (paragraph: XmlObject, styles: TextStyles, showDeleted: boolean): boolean =>
    (!showDeleted && removedMarkOf(paragraph) !== undefined) ||
    (isMarkHidden(paragraph, styles) && showsSomething(contentOf(paragraph), paragraphRunOf(paragraph, styles), styles));

/**
 * Elements, with the content of each content control and custom XML whose last paragraph is joined to the paragraph
 * after it in its place, after a marker of where it started. Word joins it as though the control weren't there, with its
 * mark hidden or deleted (`stops2/word-stops-hidden-edges.docx` HD3, `word-stops-tracked-edges.docx` TR8). What it does
 * with a paragraph joined to a control's first one hasn't been seen
 */
const openedAtEnds = (elements: readonly XmlObject[], styles: TextStyles, showDeleted: boolean): readonly XmlObject[] =>
    elements.flatMap((element, index) => {
        const content = openableContentOf(element);
        const last = content?.findLast((child) => BLOCK_ELEMENTS.has(nameOf(child)));
        const following = elements.slice(index + 1).find((other) => BLOCK_ELEMENTS.has(nameOf(other)));
        return last !== undefined && following !== undefined && "w:p" in last && "w:p" in following && joinsNext(last, styles, showDeleted)
            ? [{ [CONTROL_START]: {} }, ...openedAtEnds(content!, styles, showDeleted)]
            : [element];
    });

/**
 * Joins each paragraph whose mark is deleted in a tracked change, or moved elsewhere, to the paragraph after it, as Word
 * lays it out: the next paragraph, with the deleted one's text at its start, all in the next one's formatting, style and
 * list (`word-watertight-markup.docx` MK3, `word-tracked-changes.docx` MK7, MK9, `stops2/word-stops-moves.docx` TR7). A
 * paragraph whose mark is hidden is joined to the next too, or else is left as it is or stops the layout (see
 * {@link hiddenMarkJoin}). A section break deleted so leaves its section to the next, whose properties are then all of
 * theirs: the first section's pages numbered from 7, as the second's, with its header (MK8c, `word-stops-tracked-edges.docx`
 * TR10b). A paragraph with no paragraph after it, before a table or at the end of a table cell or of the document, stays
 * as it is, with its section break at the end of the document (MK8a, MK8b, MK8d, TR10a). Read as Word sizes a table's
 * columns (`showDeleted`), a paragraph with a deleted mark stays as it is written: a column as wide as the longer of the two
 * paragraphs, which are laid out joined on two lines (`word-stops-tracked.docx` TR11). What Word does with a deleted mark
 * at the start of a content control, a deleted section break before a table, or between sections that start differently,
 * other than the document's first, hasn't been seen, so the layout stops there.
 *
 * @param styles - The document's styles, which may hide a paragraph's mark
 * @param options - Whether the elements are in a content control or custom XML (`nested`), whether deleted marks are read
 * as Word sizes a table's columns, as they are written (`showDeleted`), and the part they are in
 */
const joinRemovedMarks = (
    elements: readonly unknown[],
    styles: TextStyles,
    { nested, showDeleted, part }: { readonly nested: boolean; readonly showDeleted: boolean; readonly part: Part },
): readonly XmlObject[] => {
    const opened = openedAtEnds(elements.filter(isObject), styles, showDeleted);
    // The elements after the one being read, as they are joined, from the last: the next is at the end
    // eslint-disable-next-line functional/prefer-readonly-type
    const after: XmlObject[] = [];
    for (const [index, element] of [...opened.entries()].reverse()) {
        const name = nameOf(element);
        const mark = name === "w:p" && !showDeleted ? removedMarkOf(element) : undefined;
        // A paragraph joined to the next goes on past those left out after it, as they show nothing, and their bookmarks go
        // into it. Those whose fields, note references or number would be read out of order stay, for it to stop at
        if (name === "w:p" && joinsNext(element, styles, showDeleted)) {
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
        // Whether the next block is at the start of a content control or custom XML, or there is none in one
        const edge =
            nextName === "w:sdt" ||
            nextName === "w:customXml" ||
            (next === undefined && nested) ||
            after.slice(at + 1).some((other) => CONTROL_START in other);
        const nextSection = (): unknown => nextSectionIn([...after].reverse());
        const hidden =
            mark === undefined && name === "w:p" && isMarkHidden(element, styles)
                ? hiddenMarkJoin(element, next, { styles, edge, part, nextSection })
                : undefined;
        const unjoined = hidden !== undefined && "reason" in hidden ? hidden.reason : undefined;
        const joins = (mark !== undefined || (hidden !== undefined && "joins" in hidden)) && nextName === "w:p";
        const section = mark === undefined ? undefined : sectionPropertiesOf(element);
        const reason =
            mark === undefined
                ? unjoined
                : edge
                  ? "a deleted paragraph mark at the edge of a content control"
                  : joins && isLeftOut(next!)
                    ? "a deleted paragraph mark before a paragraph with nothing shown and its mark hidden"
                    : section !== undefined && !joins && next !== undefined && nextName !== "w:sectPr"
                      ? "a deleted section break before something that isn't a paragraph"
                      : section !== undefined &&
                          joins &&
                          sectionTypeOf(section) !== sectionTypeOf(nextSection()) &&
                          elementsIn(opened.slice(0, index), (inner) => inner === "w:sectPr").length > 0
                        ? "a deleted section break between sections that start differently, after the first"
                        : undefined;
        if (reason !== undefined) {
            // eslint-disable-next-line functional/immutable-data
            after.push(stopIn(element, reason));
        } else if (section !== undefined && !joins) {
            // eslint-disable-next-line functional/immutable-data
            after.push({ "w:p": [...contentOf(element), { [KEPT_MARK]: {} }] });
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
            after.push({ [name]: joinRemovedMarks(contentOf(element), styles, { nested: true, showDeleted, part }) });
        } else if (name === "w:sdt" && !isBound(element)) {
            const content = contentOf(element).map((child) =>
                isObject(child) && "w:sdtContent" in child
                    ? { "w:sdtContent": joinRemovedMarks(contentOf(child), styles, { nested: true, showDeleted, part }) }
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
        joinRemovedMarks(elements, reader.styles, { nested: false, showDeleted: reader.showDeleted === true, part }),
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
            const shown = afterHidden(block, hidden);
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

// How much further Word keeps the text from a frame's border beside it than the border's width and space, in points
const FRAME_BORDER_ROOM = 1.5;

/**
 * The room a text frame's border at its side takes beside it, in points, or why it isn't known: its width, without the
 * shadow that doubles a paragraph's, its space from the text, and 1.5 points more, as Word keeps the text from it: 65
 * twips for a border of 15 twips 20 from the text (`word-frames.docx` FM13), and 40 to 660 twips for those of
 * `word-stops-floats.docx` FR2a to FR2j. The frame's text isn't moved, as its border is drawn outside it
 */
const frameBorderRoom = (border: ParagraphBorder | undefined): number | string => {
    const room = borderRoom(border === undefined ? undefined : { ...border, shadow: false });
    return typeof room === "string" || room === 0 ? room : room + FRAME_BORDER_ROOM;
};

/**
 * A text frame as a drawing that text flows around, placed and sized by its properties and its paragraphs, nothing when
 * it is in front of the text, or why it can't be laid out. Its borders at its sides keep the text further from it, and
 * those above and below are in it, above and below its text, as a paragraph's are (FR2a to FR2j), and its distance from
 * the text keeps it further again (`word-stops-floats2.docx` FB1a). Where its paragraphs have other borders at their
 * sides, Word's way isn't known
 */
const frameDrawing = (frame: FrameProperties, blocks: readonly ParagraphBlock[]): FloatingDrawing | undefined | string => {
    const wrap = FRAME_WRAPS[frame.wrap ?? "around"];
    if (wrap === undefined) {
        return "a text frame that text flows around in a way not yet followed";
    }
    const sideKey = (border: ParagraphBorder | undefined): string =>
        border === undefined || NO_BORDER.has(border.style) ? "" : border.key;
    if (new Set(blocks.map(({ format }) => `${sideKey(format.borderLeft)} ${sideKey(format.borderRight)}`)).size > 1) {
        return "a text frame of paragraphs with other borders at their sides";
    }
    const [left, right] = [blocks[0].format.borderLeft, blocks[0].format.borderRight].map(frameBorderRoom);
    if (typeof left === "string" || typeof right === "string") {
        return typeof left === "string" ? left : (right as string);
    }
    const { width = 0, height, heightRule, horizontal, vertical, across, down } = frame;
    if (wrap === "none") {
        return undefined;
    }
    return {
        wrap,
        side: "bothSides",
        width,
        height,
        effects: { top: 0, bottom: 0, left: 0, right: 0 },
        distances: { top: down, bottom: down, left: across + left, right: across + right },
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
 * drawing that text flows around, at its start. Frames elsewhere stop the layout as they are read. The paragraphs of a
 * frame are those next to each other with the same frame. The bookmarks, fields and notes' references in a frame are
 * where its anchor is, as the frame is on its page (`word-stops-floats.docx` FR5a). The paragraph after a frame can be the
 * empty one that ends its section, which takes a line then, and which the next section's text on the page goes round
 * too, and with a table after it, the frame is anchored at the table's top, as Word places it (FR1a to FR1d). One placed
 * against the paragraph after it before a table, and one with nothing after it in its section, at the end of the
 * document or as its own paragraph ends the section, aren't followed yet, so the layout stops there.
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
        if (entry.section !== framed[0].section || (block.type === "table" && block.float !== undefined)) {
            // Its paragraphs stay in the text, the first stopping the layout, or, guessing, laid out where they are. Before a
            // table that text flows around, which is anchored in the paragraph after it, where Word puts it isn't known
            const unknown = entry.section === framed[0].section ? "a text frame before a table that text flows around" : undefined;
            // eslint-disable-next-line functional/immutable-data
            anchored.push(...unanchored(framed, withBlock, unknown), entry);
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
        // Placed against the paragraph after it, before a table, it is placed against the table's top (`word-stops-floats2.docx`
        // FB1b), as one placed against the margins is (FR1a)
        const why = block.unsupported ?? unsupported;
        // eslint-disable-next-line functional/immutable-data
        anchored.push(
            withBlock(entry, {
                ...(block.type === "table"
                    ? { ...block, anchored: [...markers, ...laidOut] }
                    : { ...block, items: [...markers, ...laidOut, ...block.items] }),
                ...(why === undefined ? {} : { unsupported: why }),
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
    unsupported = "a text frame with no paragraph after it in its section",
): readonly Entry[] => framed.map((entry, index) => (index === 0 ? withBlock(entry, { ...entry.block, unsupported }) : entry));

const START_TYPES = new Set<Section["start"]>(["nextPage", "continuous", "evenPage", "oddPage", "nextColumn"]);

/**
 * A block before a paragraph left out, which takes no room. One kept with the next (`keepNext`) is kept with the paragraph
 * after the one left out: at the foot of a page, both go on to the next (`stops2/word-stops-hidden.docx` HD7).
 */
const beforeHidden = (block: Block, hidden: ParagraphBlock): Block =>
    block.type === "paragraph" ? { ...block, hiddenAfter: hidden } : block;

/**
 * A block after paragraphs left out, which take no room. With the same borders as the block before them, the two are in
 * one box, whatever the borders of those left out (`stops2/word-stops-hidden.docx` HD8).
 */
const afterHidden = (block: Block, hidden: readonly ParagraphBlock[]): Block =>
    hidden.length === 0 || block.type !== "paragraph" ? block : { ...block, hiddenBefore: hidden[hidden.length - 1] };

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

const CONTEXTUAL_EDGE =
    "contextual spacing at the edge of a table cell beside another cell or row, not all in the default paragraph style, or before a table";

/**
 * A stack of blocks with the space Word leaves out at the edges of its tables' cells for contextual spacing. Word compares
 * a paragraph at a cell's edge with the paragraph next to it in the document's order: the first cell's first paragraph
 * with the paragraph before the table, and each row's last paragraph with the end of the row, which is a paragraph in the
 * default paragraph style. So Normal paragraphs with contextual spacing in a cell between Normal paragraphs have neither
 * the first's space before nor the last's space after, and in a style of their own keep both; between paragraphs of
 * another style, the first keeps its space before, and the last still leaves out its space after
 * (`word-stops-text.docx` PB6a to PB6e, `word-compat-settings.docx` CP11). Word left out the space of Normal paragraphs
 * at the other edges of cells, next to Normal paragraphs or rows' ends: the top of a cell beside the one before, and of a
 * row's after the first, the bottom of a cell before the row's last, and the top of a table first in a cell
 * (`word-stops-edges.docx` PB9a, PB9b, PB9e). It left out the space before a Normal paragraph after a table whose last
 * row's paragraph is in a style of its own, so it compares that one with the end of the row (PB9d). Where Word would
 * leave out the space of a paragraph of another style at those edges, if it compared them in the document's order too,
 * and before a table, the layout stops. Guessing, it leaves it out in a cell, and keeps it before a table
 */
const withCellEdges = (stack: readonly Block[], reader: Reader): readonly Block[] =>
    stack.map((block, index) => {
        const before = stack[index - 1];
        const rowEnd = { style: reader.styles.defaultParagraphStyle };
        if (block.type !== "table") {
            // After a table, a paragraph is compared with the end of its last row (PB9d)
            return before?.type === "table" && block.type === "paragraph" && leavesOutAt(block, "before", rowEnd)
                ? { ...block, leftOut: { ...block.leftOut, before: true } }
                : block;
        }
        let unseen = false;
        /** Whether a paragraph's space on one side is left out, next to what is there, and whether that was seen */
        const leavesOut = (paragraph: Block | undefined, side: "before" | "after", next: NextToCell, seen: boolean): boolean => {
            if (paragraph?.type !== "paragraph") {
                return false;
            }
            const out = leavesOutAt(paragraph, side, next);
            unseen ||= hasContextualSpace(paragraph, side) && !seen && (out || next === UNKNOWN_NEXT);
            return out;
        };
        /** Whether what is next to a cell's edge is in the default paragraph style, as the end of a row is */
        const isDefault = (next: NextToCell): boolean => next !== UNKNOWN_NEXT && next !== NOTHING_NEXT && next.style === rowEnd.style;
        /** Whether a block is a paragraph in the default paragraph style */
        const isDefaultParagraph = (one: Block | undefined): boolean => one?.type === "paragraph" && one.style === rowEnd.style;
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
        // Word left out the space at the other edges of cells where they, and the paragraph before the table, were all in
        // the default paragraph style
        const aboveDefault = above === NOTHING_NEXT || (isDefault(above) && before?.type !== "table");
        /** Whether Word was seen leaving out the space of a paragraph at an edge of a cell beside another, or a row's end */
        const seenBeside = (paragraph: Block | undefined, next: NextToCell): boolean =>
            aboveDefault && isDefaultParagraph(paragraph) && isDefault(next);
        const rows = block.rows.map((row, rowIndex) => ({
            ...row,
            cells: row.cells.map((cell, cellIndex) => {
                const end = cellIndex === row.cells.length - 1;
                const [top, bottom] = [cell.blocks[0], cell.blocks[cell.blocks.length - 1]];
                const nextBelow = end ? rowEnd : endOf(row.cells[cellIndex + 1].blocks, "first");
                const first = rowIndex === 0 && cellIndex === 0;
                // A Normal paragraph at the top of a table at the start of a cell is next to something Normal (PB9e)
                const atCellStart = first && before === undefined && reader.inCell && isDefaultParagraph(top);
                const nextAbove = cellIndex > 0 ? endOf(row.cells[cellIndex - 1].blocks, "last") : first && !atCellStart ? above : rowEnd;
                const seenAbove = atCellStart || (first ? above !== UNKNOWN_NEXT && before?.type !== "table" : seenBeside(top, nextAbove));
                const leftOut = {
                    before: leavesOut(top, "before", nextAbove, seenAbove),
                    after: leavesOut(bottom, "after", nextBelow, end || seenBeside(bottom, nextBelow)),
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
                    // With what the cell's own blocks left out, such as the space before a paragraph after a table in it
                    return one.type === "paragraph" && Object.keys(own).length > 0 ? { ...one, leftOut: { ...one.leftOut, ...own } } : one;
                });
                return { ...cell, blocks };
            }),
        }));
        // The paragraph before the table, which Word may compare with its first paragraph
        leavesOut(before, "after", endOf(block.rows[0]?.cells[0]?.blocks ?? [], "first"), false);
        const unsupported = block.unsupported ?? (unseen ? CONTEXTUAL_EDGE : undefined);
        return { ...block, rows, ...withoutUndefined({ unsupported }) };
    });

/** Whether a paragraph with contextual spacing has space on one side, its own or Word's automatic space */
const hasContextualSpace = ({ format }: ParagraphBlock, side: "before" | "after"): boolean => {
    const { contextualSpacing, spaceBefore = 0, spaceAfter = 0, autoSpaceBefore, autoSpaceAfter } = format;
    return (
        contextualSpacing === true &&
        (side === "before" ? spaceBefore > 0 || autoSpaceBefore === true : spaceAfter > 0 || autoSpaceAfter === true)
    );
};

/** Whether contextual spacing leaves out a paragraph's space on one side, next to a paragraph of its style there */
const leavesOutAt = (paragraph: ParagraphBlock, side: "before" | "after", next: NextToCell): boolean =>
    hasContextualSpace(paragraph, side) && next !== UNKNOWN_NEXT && next !== NOTHING_NEXT && next.style === paragraph.style;

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
    // Down the page, along the lines, which go from the top margin to the bottom one: 63 cells of 221.56 twips on lines of
    // 13958, at 11 points and 1 twip more (stops2/word-stops-east-asian.ts VD10)
    const margins = attributesOf(find(properties, "w:pgMar"));
    const columns =
        downOf(properties) === undefined
            ? readColumns(find(properties, "w:cols"), textWidthOf(properties, gutterAtTop))
            : [
                  (twips(attributesOf(find(properties, "w:pgSz"))["w:h"]) ?? DEFAULT_SECTION.pageHeight) -
                      Math.abs(twips(margins["w:top"]) ?? DEFAULT_SECTION.marginTop) -
                      Math.abs(twips(margins["w:bottom"]) ?? DEFAULT_SECTION.marginBottom),
              ];
    const room = normalSize + space;
    if (room <= 0 || columns.some((width) => width / room < 1)) {
        return "a document grid of characters with no room for one";
    }
    // In columns of different widths, each has cells of its own (stops2/word-stops-east-asian.ts GR12)
    return columns.some((width) => width !== columns[0])
        ? { linePitch, characterRoom: room }
        : { linePitch, characterPitch: columns[0] / Math.floor(columns[0] / room) };
};

// Word's Footnote and Endnote dialog offers up to 4 columns of footnotes
const MOST_NOTE_COLUMNS = 4;

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
    const direction = valueOf(properties, "w:textDirection");
    const down = downOf(properties);
    const sectionStart = start !== undefined && START_TYPES.has(start as Section["start"]) ? (start as Section["start"]) : "nextPage";
    // Word lays a section's footnotes out in columns of their own, of the same width, half an inch apart, and evens them
    // out, as a page's footnotes in the section's own columns (stops2/word-stops-notes2.ts NT16b to NT16e)
    const noteColumnCount = numberOf(attributesOf(find(properties, "w15:footnoteColumns"))["w:val"]) ?? 0;
    const inNoteColumns = noteColumnCount > 1 && noteColumnCount <= MOST_NOTE_COLUMNS;
    const marginBottom = twips(margins["w:bottom"]) ?? DEFAULT_SECTION.marginBottom;
    const unsupported =
        typeof grid === "string"
            ? grid
            : formatPageNumber(1, format) === undefined
              ? "page numbers in a format not yet written"
              : direction !== undefined && !HORIZONTAL.has(direction) && down === undefined
                ? "text in a direction not yet followed"
                : // Whether Word fills columns across the page before the next, where they split the lines' length, and where it
                  // puts a gutter at the top, with mirrored margins or beside lines from the left, hasn't been seen
                  down !== undefined && (mirrorMargins || columns.length > 1 || (gutter !== 0 && (gutterAtTop || down === "fromLeft")))
                  ? "text that runs down the page with columns, mirrored margins, or a gutter at the top or beside lines from the left"
                  : previous?.textRunsDown !== undefined &&
                      (sectionStart === "nextColumn" || (sectionStart === "continuous" && down !== previous.textRunsDown))
                    ? "a continuous section break after text that runs down the page, into text that doesn't"
                    : noteColumnCount > 1 &&
                        (!inNoteColumns ||
                            columns.length > 1 ||
                            down !== undefined ||
                            (twips(attributesOf(find(properties, "w:cols"))["w:space"]) ?? DEFAULT_COLUMN_SPACE) !== DEFAULT_COLUMN_SPACE)
                      ? "footnotes in more than 4 columns of their own, or in columns of their own in a section of several columns, of text that runs down the page, or whose columns are spaced otherwise than half an inch apart"
                      : undefined;
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
        // (scripts/layout-probes/word-vertical.ts V13), and goes on on the page after text that runs down it the same way
        // (stops2/word-stops-east-asian.ts VD9)
        start: down !== undefined && sectionStart === "continuous" && previous?.textRunsDown !== down ? "nextPage" : sectionStart,
        titlePage: onOff(properties, "w:titlePg") === true,
        columns,
        ...(inNoteColumns
            ? {
                  noteColumns: Array.from(
                      { length: noteColumnCount },
                      () => (columns[0] - DEFAULT_COLUMN_SPACE * (noteColumnCount - 1)) / noteColumnCount,
                  ),
              }
            : {}),
        numberFormat: format,
        ...(chapterLevel === undefined || chapterLevel < 1 || chapterLevel > 9
            ? {}
            : { chapters: { level: chapterLevel, separator: CHAPTER_SEPARATORS[String(numbering["w:chapSep"])] ?? "-" } }),
        ...(firstNumber === undefined ? {} : { firstNumber }),
        headers: { ...previous?.headers, ...headers },
        footers: { ...previous?.footers, ...footers },
        ...(unsupported ? { unsupported } : {}),
    };
    return down === undefined ? section : turned(section, down, gutter);
};

/**
 * A section whose text runs down the page, with its page turned on its side, so that its lines run along it: from its top
 * margin to its bottom one, as long as the page's text is tall, and across it from the right margin, or the left, each as
 * far from the one before as it is tall, as Word lays them out (scripts/layout-probes/word-vertical.ts V1, V2, V6, V7).
 * Its header and footer stay across the top and bottom of the page, and a header doesn't push its lines down (VH1). Its
 * gutter is beside its right margin, where its first line starts, and a negative top or bottom margin is as far from the
 * edge as it would be positive, as the header and footer don't push the lines anyway: a gutter of 720 twips puts the
 * first line 720 further from the right edge, and lines with a top margin of -1440 are as long as with 1440
 * (stops2/word-stops-east-asian.ts VD8a, VD8c)
 */
const turned = (section: Section, textRunsDown: "fromRight" | "fromLeft", gutter: number): Section => {
    const marginTop = Math.abs(section.marginTop);
    const marginBottom = Math.abs(section.marginBottom);
    return {
        ...section,
        pageWidth: section.pageHeight,
        pageHeight: section.pageWidth,
        marginLeft: marginTop,
        marginRight: marginBottom,
        marginTop: textRunsDown === "fromLeft" ? section.marginLeft : section.marginRight + gutter,
        marginBottom: textRunsDown === "fromLeft" ? section.marginRight : section.marginLeft,
        gutter: 0,
        topGutter: 0,
        columns: [section.pageHeight - marginTop - marginBottom],
        textRunsDown,
    };
};

// How a list's number lines up at the start of its paragraph's first line (`w:lvlJc`), when not to the left, which is
// how Word lines it up when the level doesn't say. Word's own lists are aligned to the left, the centre or the right, as
// docx writes them, and transitional documents may write the start and end of the line for left and right. The schema's
// other values are a paragraph's alignments, which a number on its own doesn't have: Word leaves out a level aligned
// both, as though it weren't there (see {@link readLevel}), and what it does with the rest hasn't been seen
const NUMBER_ALIGNMENTS: Readonly<Record<string, NumberingLevel["alignment"]>> = {
    left: undefined,
    start: undefined,
    center: "center",
    right: "right",
    end: "right",
};

/**
 * Reads a level of a list (`w:lvl`), in a definition or in a list's override of it. Word leaves out a level whose number
 * is aligned both, as a paragraph's text can be: its paragraphs have no number, nor the level's indents
 * (`stops2/word-stops-list-definitions.docx` LI11). It says why Word's way with it isn't followed, when it isn't: a number
 * aligned in a way the schema has for paragraphs other than both, bullets that are pictures (`w:lvlPicBulletId`), which
 * Word didn't draw (`word-stops-picture-bullets.docx` LI8), and numbers laid out as Word 6 laid them out (`w:legacy`),
 * which Word put where it puts others where the number and its space fit in the indent (LI9), so the two weren't told
 * apart.
 */
const readLevel = (element: unknown, styles: TextStyles): { readonly index: number; readonly level: NumberingLevel } => {
    const children = childrenOf(element);
    const jc = valueOf(children, "w:lvlJc") ?? "left";
    const restart = numberOf(attributesOf(find(children, "w:lvlRestart"))["w:val"]);
    const unsupported =
        !(jc in NUMBER_ALIGNMENTS) && jc !== "both"
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
                alignedBoth: jc === "both" ? true : undefined,
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
): { readonly lists: ReadonlyMap<string, NumberingList> } => {
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
    };
};

// The compatibility mode of Word 2013 and later, which lay out pages as Word does today. A document in an older one, or
// without one, is laid out as that version of Word laid it out
const CURRENT_COMPATIBILITY_MODE = 15;

// The compatibility modes of Word 2010 (14), 2007 (12) and 2003 (11). Word laid out the same pages alike in each and in
// mode 15 but for what `compatibilityMode` in `DocumentContent` says (`word-stops-compat-15.docx`, `-14`, `-12`, `-11`
// CM1 to CM22)
const OLDER_COMPATIBILITY_MODES = new Set([11, 12, 14]);

// The mode of a document that gives none, as Word 2007 wrote them: Word lays it out as Word 2007 did
const WORD_2007_MODE = 12;
// Word 2010's mode, below which Word lays out East Asian text and VML drawings otherwise
const WORD_2010_MODE = 14;
// The last character of ASCII, which Word draws in a run's font for it (`w:ascii`)

// The application Word's own compatibility settings (`w:compatSetting`) are for. Those for other applications are theirs
const WORD_SETTINGS = "http://schemas.microsoft.com/office/word";

// The compatibility settings of the schema (`w:compat`) that are followed in Word 2013's mode: automatic spacing as HTML
// has it, the space above the first line of a page or column left out (`suppressTopSpacing`, see `paginate.ts`), and
// Word 2003's layout of East Asian text (`useFELayout`) without the other settings of East Asian text, which left the
// lines of paragraphs without East Asian text as they are (`word-stops-fe-layout.docx` FE1c to FE1f), and stops at those
// with it, whose lines it breaks in ways not yet followed (FE1a, FE1b)
const FOLLOWED_COMPATIBILITY = new Set(["w:doNotUseHTMLParagraphAutoSpacing", "w:suppressTopSpacing", "w:useFELayout"]);

// The schema's compatibility settings Word lays out lines with in compatibility mode 15 as it does without them, though
// they ask for an older Word's or another application's layout: Word laid out the same probes alike with each group of them
// on and without them (`word-compat-settings.docx` CP1 to CP19). Those of line heights moved at most the text inside a line
// of exact height, not the line (`-heights`, CP2, CP14, CP15), those of letters, spaces and justification left at most a
// justified line that ends with a line break not stretched, broken where it was (`-latin`, CP8b), and those of tabs, lists,
// indents and borders (`-paragraphs`), of tables (`-tables`), of columns and footnotes (`-columns`), and of printing,
// fields, shapes and text boxes (`-other`) changed nothing. Of the groups that changed lines, the top and foot of pages
// and East Asian text, each setting but `suppressTopSpacing` and `useFELayout`, which are followed, changed nothing on its
// own (`word-compat-settings2.docx` and one document for each setting, CP1 to CP20)
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

// The schema's settings of East Asian text, which leave lines as they are each alone and all together, but with Word
// 2003's layout of East Asian text (`useFELayout`) widened the spaces of Latin text (`word-compat-settings-east-asian.docx`
// CP9), which `useFELayout` alone leaves as they are (`word-compat-settings2-useFELayout.docx`)
const EAST_ASIAN_COMPATIBILITY = [
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
].map((name) => `w:${name}`);

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
 * The compatibility mode of a document's settings (`compatibilityMode`): the version of Word whose layout it asks for,
 * 15 for Word 2013 and later. Word's own setting, as another application's may have the same name
 */
const compatibilityModeOf = (settings: readonly XmlObject[]): number =>
    numberOf(
        wordSettingsOf(childrenOf(find(settings, "w:compat"))).find(({ "w:name": setting }) => setting === "compatibilityMode")?.["w:val"],
    ) ?? WORD_2007_MODE;

/** The compatibility mode a document is laid out in, when it is one of Word 2010's, 2007's or 2003's */
const olderModeOf = (settings: readonly XmlObject[]): number | undefined => {
    const mode = compatibilityModeOf(settings);
    return OLDER_COMPATIBILITY_MODES.has(mode) ? mode : undefined;
};

/**
 * Whether a document's compatibility settings (`w:compat`) ask Word to lay it out in a way not yet followed: a setting of
 * the schema that is on, other than those that are followed and those known to leave its lines as they are, or one of
 * Word's own (`w:compatSetting`) other than those known to leave its lines as they are, on or off. Each changes how Word
 * lays out lines, or may, in ways not yet followed. Those of the schema were seen leaving lines alone, or followed, only
 * in Word 2013's mode, where Word leaves most of them out, so in an older one each that is on but automatic spacing as
 * HTML has it (`older`) is one not yet followed.
 */
const asksForUnfollowedCompatibility = (compatibility: readonly XmlObject[], older: boolean): boolean =>
    (onOff(compatibility, "w:useFELayout") === true && EAST_ASIAN_COMPATIBILITY.some((name) => onOff(compatibility, name) === true)) ||
    compatibility.some((child) => {
        const name = nameOf(child);
        return (
            name !== "w:compatSetting" &&
            (older
                ? name !== "w:doNotUseHTMLParagraphAutoSpacing"
                : !FOLLOWED_COMPATIBILITY.has(name) && !COMPATIBILITY_LINES_ALIKE.has(name)) &&
            onOff([child], name) === true
        );
    }) ||
    wordSettingsOf(compatibility).some(({ "w:name": setting }) => !WORD_SETTINGS_LINES_ALIKE.has(String(setting)));

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
 * followed, and where they put the limits of sums and integrals. Word draws equations in a maths font other than Cambria
 * Math when the computer has it, and in Cambria Math when it doesn't (`word-stops-equation-font.docx` EQS2), so how wide
 * they are depends on the computer. It puts the limits of a displayed sum or integral that doesn't say where its own go
 * where the settings say (`m:naryLim`, `m:intLim`), and leaves those in a line of text beside it
 * (`word-stops-equation-limits.docx` EQ42). It lays equations out alike with displayed equations' own defaults off
 * (`m:dispDef`), and with small fractions on (`m:smallFrac`) too (`word-stops-equation-small.docx` EQ43), but small
 * fractions with those defaults on haven't been seen. Margins of displayed equations (`m:lMargin`, `m:rMargin`) Word
 * centres an equation that fits as without, but breaks one within (`word-stops-equation-settings.docx` EQS1), so one that
 * fits the line but not the room between them would be laid out on one line where Word breaks it. Space around displayed
 * equations, and between equations (`m:interSp`), Word leaves out, even between equations side by side in one paragraph of
 * them (EQS1, `word-stops-equation-spacing.docx` EQ44). The other settings are of how an equation is broken, or lined up
 * on its line.
 */
const readMathsSettings = (settings: readonly XmlObject[]): Pick<Reader, "maths" | "displayedMaths" | "limits"> => {
    const maths = childrenOf(find(settings, "m:mathPr"));
    const valueIn = (name: string): string | undefined => stringOf(attributesOf(find(maths, name))["m:val"]);
    if ((valueIn("m:mathFont") ?? "Cambria Math") !== "Cambria Math") {
        return { maths: "an equation in a maths font other than Cambria Math" };
    }
    const off = (name: string): boolean => find(maths, name) !== undefined && isOff(valueIn(name));
    const on = (name: string): boolean => find(maths, name) !== undefined && !isOff(valueIn(name));
    if (on("m:smallFrac") && !off("m:dispDef")) {
        return { maths: "an equation in a document whose maths settings make fractions small" };
    }
    const given = (name: string): boolean => (numberOf(valueIn(name)) ?? 0) !== 0;
    return {
        ...(given("m:lMargin") || given("m:rMargin")
            ? { displayedMaths: "an equation displayed in a document whose maths settings give displayed equations margins" }
            : {}),
        limits: {
            sums: valueIn("m:naryLim") === "subSup" ? "subSup" : "undOvr",
            integrals: valueIn("m:intLim") === "undOvr" ? "undOvr" : "subSup",
        },
    };
};

/**
 * Whether a paragraph's runs end and start with Arabic letters Word joins across them, which are measured a run at a time,
 * so not in the forms Word joins them in. Bookmarks and the like between them leave them joined
 */
const joinedAcrossRuns = (items: readonly LayoutItem[]): boolean => {
    const texts = items.filter((item) => item.type !== "marker");
    return texts.some((item, index) => {
        const next = texts[index + 1];
        return item.type === "text" && next?.type === "text" && joinsAcross(item.text, next.text);
    });
};

/**
 * The document's settings for text in Japanese, Chinese or Korean that Word has been seen laying out only in some of it:
 * Word's strict rules for the characters that can't start a line (`w:strictFirstAndLastChars`), and its punctuation, or
 * its punctuation and kana, compressed (`w:characterSpacingControl`).
 */
type EastAsianRules = {
    readonly strict: boolean;
    readonly compressed: boolean;
    /** Whether the document has its own list of the characters that can't start or end a line of Japanese */
    readonly ownJapaneseList: boolean;
};

/** The document's settings for text in an East Asian language that Word lays out only in some of it, when it has any */
const readEastAsianRules = (settings: readonly XmlObject[]): EastAsianRules | undefined => {
    const spacingControl = valueOf(settings, "w:characterSpacingControl");
    const rules = {
        strict: onOff(settings, "w:strictFirstAndLastChars") === true,
        compressed: spacingControl !== undefined && spacingControl !== "doNotCompress",
        ownJapaneseList: readKinsokuLists(settings).japanese !== undefined,
    };
    return rules.strict || rules.compressed ? rules : undefined;
};

// Half-width small katakana and the half-width prolonged sound mark, which the specification's strict list keeps from the
// start of a line of Japanese, but Word's normal list doesn't (see `line-break-rules.ts`)
// cspell:disable-next-line
const HALF_WIDTH_SMALL_KANA = /[ｧ-ｯｰ]/u;

/**
 * Why a paragraph's text in Japanese, Chinese or Korean can't be laid out as Word does for the document's settings, when it
 * can't. Word left the lines of Japanese text in no language as they are with them, as it leaves out its rules for the
 * characters that can't start or end a line there (scripts/layout-probes/stops2/word-stops-east-asian.ts EA1 to EA3:
 * small kana, iteration marks and closing brackets started lines, and opening brackets ended them, at 42 ideographs a
 * line). In text in Japanese, its strict rules kept small kana from starting a line: lines of 37 ideographs and kana where
 * 42 fit, ended before the ideograph before them (`word-stops-east-asian2.ts` EA4a). Punctuation compressed, or punctuation
 * and kana, Word left as it is in Japanese text aligned left: lines of 41 ideographs, kana and brackets, as many as without
 * (EA4b, EA4c). Those rules in Chinese and Korean text haven't been seen, nor the strict ones with the document's own list
 * for Japanese, or before the half-width small katakana they may keep from the start of a line, nor compressed punctuation
 * in a justified or distributed line, which may squeeze it to fit more.
 */
const unknownEastAsianRules = (
    rules: EastAsianRules | undefined,
    items: readonly LayoutItem[],
    alignment: ParagraphFormat["alignment"],
): string | undefined => {
    const texts = items.filter((item) => item.type === "text");
    const languages = new Set(texts.map((item) => kinsokuLanguageOf(item.language)).filter((language) => language !== undefined));
    if (rules === undefined || languages.size === 0) {
        return undefined;
    }
    const japanese = texts.filter((item) => kinsokuLanguageOf(item.language) === "japanese");
    const otherLanguage = [...languages].some((language) => language !== "japanese");
    if (rules.strict && (otherLanguage || rules.ownJapaneseList || japanese.some((item) => HALF_WIDTH_SMALL_KANA.test(item.text)))) {
        return otherLanguage
            ? "the strict rules for the characters that can't start a line, in text in Chinese or Korean"
            : "the strict rules for the characters that can't start a line of Japanese, with the document's own list of them or before half-width small katakana";
    }
    const stretched = alignment !== undefined && alignment !== "left" && alignment !== "center" && alignment !== "right";
    if (rules.compressed && (otherLanguage || stretched)) {
        return otherLanguage
            ? "punctuation compressed in text in Chinese or Korean"
            : "punctuation compressed in a justified or distributed paragraph of text in Japanese";
    }
    return undefined;
};

/**
 * Reads the parts of the document's settings (`w:settings`) that change how it is laid out.
 */
const readSettings = (
    xml: XmlObject | undefined,
): Pick<
    DocumentContent,
    | "defaultTabStop"
    | "evenAndOddHeaders"
    | "addsParagraphSpacing"
    | "breakRules"
    | "hyphenation"
    | "compatibilityMode"
    | "suppressesTopSpacing"
    | "unsupported"
> => {
    const settings = childrenOf(xml?.["w:settings"]);
    const compatibility = childrenOf(find(settings, "w:compat"));
    const lists = readKinsokuLists(settings);
    // With Word's strict rules for the characters that can't start a line of Japanese (see `unknownEastAsianRules`)
    const breakRules: LineBreakRules = {
        ...(Object.keys(lists).length > 0 ? { lists } : {}),
        ...(onOff(settings, "w:strictFirstAndLastChars") === true ? { strict: true } : {}),
    };
    const mode = compatibilityModeOf(settings);
    const olderMode = olderModeOf(settings);
    // Word 2007 and 2003 break Chinese and Japanese text only at its spaces (`word-stops-compat2-12.docx` CN10a to CN10c)
    const ideographsUnbroken = olderMode !== undefined && olderMode < WORD_2010_MODE;
    const rules: LineBreakRules = ideographsUnbroken ? { ...breakRules, ideographs: false } : breakRules;
    // Pages printed folded as a booklet Word lays out as the section's pages, as it does without, and prints two to a sheet
    // in the booklet's order: 50 lines of A4 to the first, as wide as without (`word-stops-booklet2.docx` BK2). Those
    // folded the other way round (`w:bookFoldRevPrinting`), for text that runs right to left, haven't been seen, and Word
    // updates a document's styles from its template when it opens it, with `w:linkStyles`. Pages printed two to a sheet
    // (`w:printTwoOnOne`) Word lays out as the section's pages too: 51 lines on the first of 62
    // (`word-stops-two-on-one.docx` TO1)
    const unsupported = (
        [
            [
                mode < CURRENT_COMPATIBILITY_MODE && olderMode === undefined,
                "a document in a compatibility mode Word hasn't been seen laying out",
            ],
            [asksForUnfollowedCompatibility(compatibility, olderMode !== undefined), "a compatibility setting not yet followed"],
            [
                onOff(settings, "w:bookFoldRevPrinting"),
                "pages printed as a booklet folded the other way round, for text that runs right to left",
            ],
            [onOff(settings, "w:linkStyles"), "styles updated from the document's template when Word opens it"],
        ] as const
    ).find(([applies]) => applies === true)?.[1];
    return {
        defaultTabStop: twips(attributesOf(find(settings, "w:defaultTabStop"))["w:val"]) ?? 36,
        evenAndOddHeaders: onOff(settings, "w:evenAndOddHeaders") === true,
        addsParagraphSpacing: onOff(compatibility, "w:doNotUseHTMLParagraphAutoSpacing") === true,
        ...(Object.keys(rules).length > 0 ? { breakRules: rules } : {}),
        ...(onOff(settings, "w:autoHyphenation") === true ? { hyphenation: readHyphenation(settings) } : {}),
        ...(olderMode === undefined ? {} : { compatibilityMode: olderMode }),
        ...(onOff(compatibility, "w:suppressTopSpacing") === true ? { suppressesTopSpacing: true } : {}),
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
    /** Its web settings (`w:webSettings`), with the divisions of a web page its paragraphs may be in, if it has any */
    readonly webSettings?: XmlObject;
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
    const { lists: numbering } = readNumbering(parts.numbering, styles, parts.otherListIds ?? new Map());
    const listIds = parts.otherListIds ?? new Map<string, string>();
    // The markers at fields, numbered across the body and its notes
    const markers: FieldMarkers = { count: 0, relative: new Map() };
    const settings = childrenOf(parts.settings?.["w:settings"]);
    const decimalSymbol = valueOf(settings, "w:decimalSymbol");
    const mathsSettings = readMathsSettings(settings);
    const compatibilityMode = olderModeOf(settings);
    const feLayout = onOff(childrenOf(find(settings, "w:compat")), "w:useFELayout") === true;
    const openTypeFeatures = wordSettingsOf(childrenOf(find(settings, "w:compat"))).some(
        ({ "w:name": name, "w:val": value }) => name === "enableOpenTypeFeatures" && isOn(value),
    );
    const eastAsianRules = readEastAsianRules(settings);
    const divisions = new Map(divisionsIn(childrenOf(find(childrenOf(parts.webSettings?.["w:webSettings"]), "w:divs"))));
    const readerOf = (inHeader: boolean): Reader => ({
        styles,
        numbering,
        listIds,
        inHeader,
        markers,
        fields: [],
        counters: new Map(),
        notesInTextBoxes: new Set(),
        ...(decimalSymbol === undefined ? {} : { decimalSymbol }),
        ...mathsSettings,
        ...(eastAsianRules === undefined ? {} : { eastAsianRules }),
        ...(guess ? { guess } : {}),
        ...(compatibilityMode === undefined ? {} : { compatibilityMode }),
        ...(feLayout ? { feLayout } : {}),
        ...(openTypeFeatures ? { openTypeFeatures } : {}),
        ...(divisions.size > 0 ? { divisions } : {}),
    });
    const elements = unwrap(joinRemovedMarks(contentOf(body), styles, { nested: false, showDeleted: false, part: "body" }), guess);

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
    /** The document grid of a section, by its index, when it has one that is followed */
    const gridOf = (section: number): TextGrid | undefined => {
        if (!grids.has(section)) {
            const grid = readGrid(sectionElements[section], normalSize, pageSettings);
            // eslint-disable-next-line functional/immutable-data
            grids.set(section, typeof grid === "object" ? grid : undefined);
        }
        return grids.get(section);
    };
    /**
     * The blocks of a note, with the number its mark shows (`shows`, see {@link Reader}), or of a separator, which has
     * none, read from the content of the note given, or its own
     */
    const readNoteContent = (
        kind: NoteKind,
        id: string,
        shows?: Reader["noteNumber"],
        content = contentOf(notesByKind[kind].get(id) ?? { [`w:${kind}`]: [] }),
    ): readonly Block[] => {
        // A footnote's lines are on the grid of the section of its reference, which is being read, and an endnote's on the
        // last section's, which they follow, but not their separators (word-grid.ts G9, word-grid3.ts H2, H3): an endnote's
        // lines of MS Mincho 10.5 are 268 twips apart after a last section on no grid, from a section on a grid of lines of
        // 360, and before one, from a section on none (stops2/word-stops-east-asian2.ts GR15a, GR15c)
        const separator = shows === undefined;
        const section = kind === "endnote" ? lastSection : sections.length;
        const grid = separator ? undefined : gridOf(section);
        const down = !separator && downOf(childrenOf(sectionElements[section])) !== undefined;
        const readerOfNote: Reader = {
            ...readerOf(false),
            inNote: true,
            ...(kind === "endnote" ? { inEndnote: true } : {}),
            ...(separator ? {} : { noteNumber: shows }),
            ...(grid === undefined ? {} : { grid }),
            ...(down ? { down } : {}),
        };
        const noteBlocks = readBlocks(content, readerOfNote);
        return separator || noteBlocks[noteBlocks.length - 1]?.type !== "table"
            ? noteBlocks
            : [...noteBlocks, paragraphAfterTable(kind, readerOfNote, noteBlocks)];
    };
    /**
     * The empty paragraph Word adds after a table that ends a footnote or endnote, as a note ends with a paragraph: a line
     * below the table (`word-watertight-notes.docx` FN11, FN12, `word-watertight-stops.docx` SP3c). Those notes had the
     * same formatting in the Normal style and the footnote text style, so it is in Normal where they are formatted alike.
     * Where they aren't, Word gave it Normal in notes whose paragraphs were all in Normal, a line of Calibri 11 where the
     * note text styles were 8 points with 24 after (`word-notes-final-table.docx` NF1, NF2), and which it gives it in a
     * note with paragraphs of another style, such as the note text style itself, isn't known
     */
    const paragraphAfterTable = (kind: NoteKind, readerOfNote: Reader, noteBlocks: readonly Block[]): Block => {
        const [normal] = readBlocks([{ "w:p": [] }], readerOfNote) as readonly ParagraphBlock[];
        const textStyle = [...styles.styles].find(
            ([, { type, name }]) => type === "paragraph" && name?.toLowerCase() === `${kind} text`,
        )?.[0];
        const [inStyle] = readBlocks(
            [{ "w:p": [{ "w:pPr": [{ "w:pStyle": { _attr: { "w:val": textStyle } } }] }] }],
            readerOfNote,
        ) as readonly ParagraphBlock[];
        const alike = JSON.stringify([normal.format, normal.markFont]) === JSON.stringify([inStyle.format, inStyle.markFont]);
        /** The styles of the paragraphs of some blocks, and of their tables' cells */
        const stylesIn = (stack: readonly Block[]): readonly (string | undefined)[] =>
            stack.flatMap((block) =>
                block.type === "paragraph"
                    ? [block.style]
                    : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => stylesIn(cell.blocks))),
            );
        return alike || stylesIn(noteBlocks).every((style) => style === normal.style)
            ? normal
            : {
                  ...normal,
                  unsupported:
                      "a footnote or endnote that ends with a table, with paragraphs of another style than Normal, in a document whose Normal and note text styles differ",
              };
    };
    /**
     * A separator above the endnotes as Word lays it out: a line of its paragraph style's text, at single spacing and with
     * no space before or after, whatever its own formatting. Word left out the space before and after, the line spacing
     * and the size of the text of the separator and the continuation separator alike (`word-continued-endnotes.docx` CE3
     * to CE5, `word-watertight-endnotes2.docx` EN2, `word-watertight-sections.docx` SC4), and their text, after the
     * separator (`word-stops-endnotes.docx` NE3), before it, and in a paragraph after its own (stops2/word-stops-notes2.ts
     * NE7): it drew the separator a line tall and nothing else. Their bookmarks are kept. One with text and no separator,
     * or with a table in it, stops, as Word hasn't been seen laying one out, and so does one with something in it that
     * stops the layout anywhere, such as an equation
     */
    const readEndnoteSeparator = (type: "separator" | "continuationSeparator"): readonly Block[] => {
        const noteContent = contentOf(notesByKind.endnote.get(type) ?? { "w:endnote": [] });
        const content = readNoteContent("endnote", type, undefined, noteContent);
        const [first] = content;
        if (content.length === 0) {
            return [];
        }
        // Text with no separator, which Word may draw as text, and a table, haven't been seen
        const unseen =
            content.some((block) => block.type === "table") ||
            (!hasElement(noteContent, `w:${type}`) &&
                content.some((block) => block.type === "paragraph" && block.items.some((item) => item.type !== "marker")));
        const unsupported =
            content.find((block) => block.unsupported !== undefined)?.unsupported ??
            (unseen ? "an endnote separator with a table in it, or text and no separator" : undefined);
        if (unsupported !== undefined) {
            return [{ ...first, unsupported }];
        }
        const { style } = first as ParagraphBlock;
        const items = content.flatMap((block) => (block as ParagraphBlock).items.filter((item) => item.type === "marker"));
        const markFont = fontOf(combine([styles.run, ...styleChain(styles, style, "paragraph").map(({ run }) => run)]));
        return [{ type: "paragraph", items, format: {}, tabStops: [], markFont, ...withoutUndefined({ style }) }];
    };
    const footnotes = new Map<string, readonly Block[]>();
    const footnoteNumbers = new Map<string, string>();
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnotes: Block[] = [];
    // The section of each of the endnotes' blocks' references
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnoteBlockSections: number[] = [];
    // The section of each endnote's reference
    // eslint-disable-next-line functional/prefer-readonly-type
    const endnoteSections: number[] = [];
    const endnoteNumbers = new Map<Block, string>();
    // Each section's properties, which come after its paragraphs, so its notes are numbered as it says as they are read
    const sectionElements = elements.flatMap((element) => {
        const properties = sectionPropertiesOf(element);
        return properties === undefined ? [] : [properties];
    });
    // The last section, whose properties end the body, or one of Word's after the last that does when they don't
    const lastSection = elements.some((element) => nameOf(element) === "w:sectPr") ? sectionElements.length - 1 : sectionElements.length;
    /** How a section numbers and places its notes of a kind: as it says, or the document does, or as Word does */
    const notePropertiesOf = (kind: NoteKind, section: number): Required<NoteProperties> => ({
        ...NOTE_DEFAULTS[kind],
        ...readNoteProperties(find(settings, `w:${kind}Pr`)),
        ...readNoteProperties(find(childrenOf(sectionElements[section]), `w:${kind}Pr`)),
    });
    const endnoteReferences = new Map<string, readonly Block[]>();
    const footnotesOnEachPage = new Map<string, NumberedOnPage>();
    // The sections of the footnotes numbered afresh on each page
    const sectionsNumberingOnPages = new Set<number>();
    /**
     * How many notes of a kind have been read, which name their markers, and counted in their numbers, and how many of
     * those were in the section of the last
     */
    type NoteCount = {
        readonly read: number;
        readonly counted: number;
        readonly section: number;
        readonly inSection: number;
    };
    // eslint-disable-next-line functional/prefer-readonly-type
    type NoteCounts = Map<NoteKind, NoteCount>;
    const countOf = (counts: NoteCounts, kind: NoteKind): NoteCount =>
        counts.get(kind) ?? { read: 0, counted: 0, section: sections.length, inSection: 0 };
    const noteCounts: NoteCounts = new Map();
    let unwrittenNumber = false;
    // Why the notes can't be numbered as Word numbers them, when they can't
    let unseenNumbering: string | undefined;
    /** Counts a note of a kind read, without counting it in the numbers, and gives the name of the marker at its reference */
    const markerNext = (kind: NoteKind, counts: NoteCounts): string => {
        const count = countOf(counts, kind);
        // eslint-disable-next-line functional/immutable-data
        counts.set(kind, { ...count, read: count.read + 1 });
        // A name no bookmark can have, as bookmarks' names have no spaces
        return `${kind} ${count.read + 1}`;
    };
    /**
     * Numbers the next note of a kind, in the section being read, and gives its number as it is written, or as its page
     * numbers it, from the name of the marker at its reference (`marker`). Footnotes are numbered 1, 2, 3 and endnotes i,
     * ii, iii, as Word numbers them unless the document or the section they are in says otherwise (`w:footnotePr`,
     * `w:endnotePr`). Word numbers a section's notes on from all those counted before them in the document, from its own
     * start number: after 27 footnotes, the first of a section that starts them from 5 is 32, and the first of the section
     * after it, from 1, is 31 after 30 (`word-stops-notes.docx` NT14b, NT14c), which counts those of a section numbered
     * afresh on each page (NT14a), and in each section: after 9 footnotes, 2 of them numbered 1 and 2 afresh in their
     * section, the next section's are 10 and 11 (stops2/word-stops-notes2.ts NT18). A section numbered afresh in each
     * section starts from its number, and one numbered on each page, on each page (NT14a)
     */
    const numberNext = (kind: NoteKind, counts: NoteCounts, marker: string): NoteReference => {
        const section = sections.length;
        const { format, start, restart } = notePropertiesOf(kind, section);
        const count = countOf(counts, kind);
        const inSection = count.section === section ? count.inSection : 0;
        // eslint-disable-next-line functional/immutable-data
        counts.set(kind, { ...count, counted: count.counted + 1, section, inSection: inSection + 1 });
        if (restart === "eachPage" && kind === "footnote") {
            unwrittenNumber ||= formatNumber(start, format) === undefined;
            return { label: "", onPage: marker };
        }
        const written = formatNumber(start + (restart === "eachSect" ? inSection : count.counted), format);
        unwrittenNumber ||= written === undefined;
        return { label: written ?? "" };
    };
    /** Numbers notes on from the last ones, without reading them or counting them in `noteCounts` */
    const previewFrom = (counts: NoteCounts): NoteReader => {
        const next: NoteCounts = new Map(counts);
        return {
            read: (kind) => numberNext(kind, next, markerNext(kind, next)),
            readOwn: (kind) => {
                markerNext(kind, next);
                return { label: "" };
            },
            skip: (kind) => {
                numberNext(kind, next, markerNext(kind, next));
            },
            preview: () => previewFrom(next),
        };
    };
    /** Keeps a note's blocks, by the marker at its reference, with the number it shows there */
    const keepNote = (kind: NoteKind, marker: string, content: readonly Block[], label: string): void => {
        if (kind === "endnote") {
            // eslint-disable-next-line functional/immutable-data
            endnoteSections.push(sections.length);
            // eslint-disable-next-line functional/immutable-data
            endnotes.push(...content);
            // eslint-disable-next-line functional/immutable-data
            endnoteBlockSections.push(...content.map(() => sections.length));
            for (const block of content) {
                // eslint-disable-next-line functional/immutable-data
                endnoteNumbers.set(block, label);
            }
            // eslint-disable-next-line functional/immutable-data
            endnoteReferences.set(marker, content);
            return;
        }
        // eslint-disable-next-line functional/immutable-data
        footnotes.set(marker, content);
        // eslint-disable-next-line functional/immutable-data
        footnoteNumbers.set(marker, label);
    };
    const readNote = (kind: NoteKind, id: string): NoteReference => {
        const marker = markerNext(kind, noteCounts);
        const numbered = numberNext(kind, noteCounts, marker);
        const { label, onPage } = numbered;
        const content = readNoteContent(kind, id, onPage === undefined ? label : { onPage });
        if (onPage !== undefined) {
            const { start, format } = notePropertiesOf(kind, sections.length);
            // eslint-disable-next-line functional/immutable-data
            footnotesOnEachPage.set(marker, { start, format });
            sectionsNumberingOnPages.add(sections.length);
        }
        keepNote(kind, marker, content, label);
        return kind === "endnote" ? { label, marker } : { ...numbered, marker };
    };

    const noteReader: NoteReader = {
        read: readNote,
        readOwn: (kind, id) => {
            const marker = markerNext(kind, noteCounts);
            keepNote(kind, marker, readNoteContent(kind, id, null), "");
            return { label: "", marker };
        },
        // A note whose reference is deleted is numbered, though it isn't laid out (MK10e). Where the page it would be on
        // numbers it hasn't been seen
        skip: (kind) => {
            const { onPage } = numberNext(kind, noteCounts, markerNext(kind, noteCounts));
            if (onPage !== undefined) {
                unseenNumbering ??= "a deleted footnote reference in a section that numbers its footnotes afresh on each page";
            }
        },
        preview: () => previewFrom(noteCounts),
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
    /** The reader of a section's blocks, on its grid and with its text running down the page when it does */
    const sectionReader = (section: number): Reader => {
        const grid = gridOf(section);
        const down = downOf(childrenOf(sectionElements[section])) !== undefined;
        return { ...reader, ...(grid === undefined ? {} : { grid }), ...(down ? { down } : {}) };
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
            const block = readBlock(element, sectionReader(sections.length));
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
                const shown = afterHidden(block, hidden);
                const marked = startingWith(shown, bookmarks);
                hidden = [];
                const sectionBreak =
                    sectionProperties !== undefined &&
                    shown.type === "paragraph" &&
                    shown.items.length === 0 &&
                    bookmarks.length === 0 &&
                    !contentOf(element).some((child) => isObject(child) && KEPT_MARK in child);
                // eslint-disable-next-line functional/immutable-data
                blocks.push({ block: sectionBreak ? { ...shown, sectionBreak } : (marked ?? shown), section: sections.length });
                bookmarks = marked ? [] : bookmarks;
            }
            if (sectionProperties !== undefined) {
                addSection(sectionProperties);
            }
        }
    }
    // Word ends a body that ends with a table that text flows around with an empty paragraph of its own, which takes a line
    // of its section, and in which the table is anchored (`word-stops-floats.docx` FT1e)
    const lastBlock = blocks[blocks.length - 1];
    const closing =
        lastBlock?.block.type === "table" && lastBlock.block.float !== undefined
            ? readBlock({ "w:p": [] }, sectionReader(lastBlock.section))
            : undefined;
    if (closing !== undefined) {
        // eslint-disable-next-line functional/immutable-data
        blocks.push({ block: closing, section: lastBlock!.section });
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

    /** Whether a section starts on the page of the one before it, in its column or the next */
    const onPageBefore = (section: number): boolean =>
        section > 0 && section < sections.length && (sections[section].start === "continuous" || sections[section].start === "nextColumn");
    /**
     * Whether a section of footnotes numbered afresh on each page may share a page with one numbered otherwise after one
     * numbered afresh on each page. Word numbers the footnotes of a section numbered afresh on each page on from those of
     * the page in sections numbered so too, from the page's first: 3 and 4 after 1 and 2 of the section before, and 1 and
     * 2 after 12 and 13 of a section numbered on through the document (stops2/word-stops-notes2.ts NT19a, NT19b). Whether
     * it numbers them on from those before such a section on the page hasn't been seen
     */
    const afterOtherNumbering = (section: number): boolean => {
        const onEachPage = (one: number): boolean => notePropertiesOf("footnote", one).restart === "eachPage";
        let other = false;
        for (let before = section; onPageBefore(before); before--) {
            other ||= !onEachPage(before - 1);
            if (other && onEachPage(before - 1)) {
                return true;
            }
        }
        return false;
    };

    // Where the endnotes go: at the end of the document, as Word puts them where the settings don't put them at the end of
    // each section, though its sections do (`word-stops-endnotes.docx` NE2), or, where the settings do, at the end of each
    // section, but those of a section that suppresses its own (`w:noEndnote`), which go at the end of the next that
    // doesn't, or of the document (stops2/word-stops-notes2.ts NE6)
    const endnotesAtSectionEnds =
        (readNoteProperties(find(settings, "w:endnotePr")).position ?? NOTE_DEFAULTS.endnote.position) === "sectEnd";
    /**
     * The section at whose end each endnote's block goes, where the settings put them at the end of each section: its own,
     * or the next that doesn't suppress its own, found once for each section from the last back, however many in a row do
     */
    const endnoteEnds = (): readonly number[] => {
        const ends = sections.map((_, section) => section);
        for (let section = sections.length - 2; section >= 0; section--) {
            if (onOff(childrenOf(sectionElements[section]), "w:noEndnote") === true) {
                // eslint-disable-next-line functional/immutable-data
                ends[section] = ends[section + 1];
            }
        }
        return endnoteBlockSections.map((section) => ends[section]);
    };
    const endnotesAfter = endnotesAtSectionEnds ? endnoteEnds() : [];

    /**
     * Why the notes of a kind can't be laid out yet, when Word numbers or places them in a way not yet followed: endnotes
     * afresh on each page, footnotes afresh on each page after a section on the page numbered otherwise, footnotes anywhere
     * but at the bottom of the page or below the text, below the text of columns, and endnotes at the end of a section
     * before one that starts on its page, in its column or the next, which Word hasn't been seen with
     */
    const notesUnsupported = (kind: NoteKind): string | undefined => {
        const all = sections.map((_, section) => notePropertiesOf(kind, section));
        return kind === "endnote" && all.some(({ restart }) => restart === "eachPage")
            ? "endnotes numbered afresh on each page"
            : kind === "footnote" && [...sectionsNumberingOnPages].some(afterOtherNumbering)
              ? "footnotes numbered afresh on each page after a section on the page numbered otherwise"
              : kind === "footnote" && all.some(({ position }) => position !== "pageBottom" && position !== "beneathText")
                ? "footnotes put elsewhere than at the bottom of the page or below the text"
                : kind === "footnote" &&
                    all.some(({ position }, section) => position === "beneathText" && sections[section].columns.length > 1)
                  ? "footnotes below the text of columns"
                  : kind === "endnote" && endnotesAtSectionEnds && endnotesAfter.some((section) => onPageBefore(section + 1))
                    ? "endnotes at the end of a section before one that starts on its page"
                    : undefined;
    };
    if (footnotes.size > 0) {
        // Word puts the footnotes of a section that says so just below the text of their page (`word-stops-notes.docx` NT14c)
        sections.forEach((section, index) => {
            if (notePropertiesOf("footnote", index).position === "beneathText") {
                sections[index] = { ...section, footnotesBeneathText: true };
            }
        });
    }

    /**
     * The endnotes after their separator, or, where the settings put them at the end of each section, each section's after a
     * separator of its own, with the section each block goes at the end of
     */
    const endnotesWithSeparators = (): Pick<DocumentContent, "endnotes" | "endnotesAfter"> => {
        if (endnotes.length === 0) {
            return { endnotes: [] };
        }
        if (!endnotesAtSectionEnds) {
            return { endnotes: [...readEndnoteSeparator("separator"), ...endnotes] };
        }
        const ends = [...new Set(endnotesAfter)];
        const groups = ends.map((end) => ({
            end,
            separator: readEndnoteSeparator("separator"),
            notes: endnotes.filter((_, index) => endnotesAfter[index] === end),
        }));
        return {
            endnotes: groups.flatMap(({ separator, notes }) => [...separator, ...notes]),
            endnotesAfter: groups.flatMap(({ end, separator, notes }) => [...separator, ...notes].map(() => end)),
        };
    };

    const documentContent: DocumentContent = {
        blocks: withDivisions(blocks),
        sections,
        footnotes,
        footnoteSeparator: footnotes.size > 0 ? readNoteContent("footnote", "separator") : [],
        footnoteContinuationSeparator: footnotes.size > 0 ? readNoteContent("footnote", "continuationSeparator") : [],
        ...endnotesWithSeparators(),
        endnoteContinuationSeparator: endnotes.length > 0 ? readEndnoteSeparator("continuationSeparator") : [],
        footnoteNumbers,
        ...(footnotesOnEachPage.size > 0 ? { footnotesOnEachPage } : {}),
        endnoteNumbers,
        relativeReferences: markers.relative,
        endnoteReferences,
        ...(parts.fonts !== undefined && parts.fonts.length > 0 ? { fonts: parts.fonts } : {}),
        ...readSettings(parts.settings),
    };
    // Notes numbered or placed in a way not yet followed stop the layout before anything, as any paragraph may refer to
    // them
    return {
        ...documentContent,
        ...withoutUndefined({
            unsupported:
                documentContent.unsupported ??
                (footnotes.size > 0 ? notesUnsupported("footnote") : undefined) ??
                (endnotes.length > 0 ? notesUnsupported("endnote") : undefined) ??
                // Endnotes follow the last section's text, on its grid, after sections on other grids too
                // (stops2/word-stops-east-asian2.ts GR15a, GR15c). Word ends those of a section followed by one whose text runs
                // another way, down the page or across it, with their own section, rather than at the end of the document
                // (word-stops-east-asian.ts GR13, word-stops-east-asian2.ts GR15b), which isn't followed. Where they go
                // after text that runs down the page hasn't been seen without that
                (endnoteSections.some((section) =>
                    sections.slice(section + 1).some(({ textRunsDown }) => textRunsDown !== sections[section].textRunsDown),
                )
                    ? "endnotes from a section followed by one whose text runs another way"
                    : endnoteSections.length > 0 && sections[sections.length - 1].textRunsDown !== undefined
                      ? "endnotes after text that runs down the page"
                      : undefined) ??
                (unwrittenNumber ? "notes numbered in a format not yet written" : undefined) ??
                unseenNumbering,
        }),
    };
};
