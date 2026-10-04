/**
 * Lays out a document's pages as Word does, and gives what is on each: the lines of its paragraphs, with their text and
 * where they are, the rows of its tables, its footnotes and endnotes, and which header and footer it shows.
 *
 * @module
 */
import type { Document, IContext, IXmlableObject } from "docx";

import { layOutPasses } from "./layout-passes";
import { readDocument } from "./read-document";

/**
 * A line of a paragraph on a page. Lengths are in pixels, 96 to the inch, from the top left corner of the page.
 *
 * @publicApi
 */
export type LineLayout = {
    /**
     * The text on the line, with the spaces where it wraps and a tab as `\t`. A picture or a break adds nothing to it,
     * so the texts of a paragraph's lines, one after the other, are its text
     */
    readonly text: string;
    /** Where the room for the line starts across the page: beside a drawing that text flows around, where that room starts */
    readonly x: number;
    /** Where the top of the line is down the page */
    readonly y: number;
    /**
     * How wide the room for the line is: its column, or the page's text, less the paragraph's indents, or the room beside a
     * drawing that text flows around. Its text is lined up in it as the paragraph's alignment says, but for an equation alone
     * in its paragraph, which Word lines up as the equation's own justification says (`m:jc`, or the document's
     * `m:defJc`), centred unless that says otherwise. A line with text on both sides of a drawing is two lines with the same
     * `y`, the left first
     */
    readonly width: number;
    /** How tall the line is, with the paragraph's line spacing */
    readonly height: number;
    /** How far its text goes from where the line starts, without the spaces at its end */
    readonly textWidth: number;
};

/**
 * A paragraph, or the part of one, on a page.
 *
 * @publicApi
 */
export type ParagraphLayout = {
    readonly type: "paragraph";
    /**
     * Where the paragraph is among the paragraphs and tables of the body, or of its footnote or endnote, counted from 0.
     * A paragraph on more than one page has the same index on each
     */
    readonly index: number;
    /** Its lines on the page, in order */
    readonly lines: readonly LineLayout[];
};

/**
 * A row of a table, or the part of one, on a page. Lengths are in pixels, from the top of the page.
 *
 * @publicApi
 */
export type RowLayout = {
    /** Which of the table's rows it is, counted from 0 */
    readonly index: number;
    /** Where the top of the row is, above its top border */
    readonly y: number;
    /** How tall the row is, or its part on the page, with its borders */
    readonly height: number;
};

/**
 * A table, or the part of one, on a page.
 *
 * @publicApi
 */
export type TableLayout = {
    readonly type: "table";
    /** Where the table is among the paragraphs and tables of the body, or of its note, counted from 0 */
    readonly index: number;
    /** Its rows on the page, or the parts of them on it, in order, with its header rows repeated at the top of each page */
    readonly rows: readonly RowLayout[];
};

/**
 * A paragraph or table on a page.
 *
 * @publicApi
 */
export type BlockLayout = ParagraphLayout | TableLayout;

/**
 * A footnote or endnote, or the part of one, on a page.
 *
 * @publicApi
 */
export type NoteLayout = {
    /** The note's number, as its reference shows it, such as `"1"` or `"iv"` */
    readonly noteNumber: string;
    /** Its paragraphs and tables on the page */
    readonly content: readonly BlockLayout[];
};

/**
 * A page of a document, and what is on it. Lengths are in pixels.
 *
 * @publicApi
 */
export type PageLayout = {
    /**
     * The page's number, as the page shows it, such as `"3"` or `"iv"`. None when Word's isn't known: when its section's
     * page numbers start with a chapter number, or are in a format the layout doesn't write
     */
    readonly pageNumber?: string;
    /** The section the page starts in, counted from 0 */
    readonly section: number;
    /** The size of the page */
    readonly width: number;
    readonly height: number;
    /**
     * When its text runs down the page, as in Chinese and Japanese, whether its lines go across it from the right or from
     * the left. Each line is then a line down the page: its `x` and `y` are the top left of its room, its `width` how far
     * across the page the line is, and its `height` how far down it the room is, its text going `textWidth` down from its
     * top
     */
    readonly textRunsDown?: "fromRight" | "fromLeft";
    /**
     * Which of its section's headers the page shows, as a section's `headers` names them: the first page's, the even
     * pages', or the default. A section that gives none of a kind shows the one of the section before. None when the
     * page has no header
     */
    readonly header?: "default" | "first" | "even";
    /** Which of its section's footers the page shows, in the same way */
    readonly footer?: "default" | "first" | "even";
    /** The paragraphs and tables of the body on the page, or the parts of them on it, in order */
    readonly body: readonly BlockLayout[];
    /** The footnotes at the bottom of the page, in order: the rest of one that goes on from the page before comes first */
    readonly footnotes: readonly NoteLayout[];
    /** The endnotes on the page, which follow the body */
    readonly endnotes: readonly NoteLayout[];
    /**
     * What the layout guessed at on the page, when it was asked to guess: why it would have stopped there, such as
     * `"a font not in the width tables"`, once each. From there on, the lines may not be where Word puts them
     */
    readonly guesses?: readonly string[];
};

/**
 * A document's pages, as {@link layoutDocument} lays them out.
 *
 * @publicApi
 */
export type DocumentLayout = {
    /**
     * Its pages, in order. When the layout stopped, those up to where it stopped, the last of them with what was laid out
     * on it
     */
    readonly pages: readonly PageLayout[];
    /**
     * What the layout stopped at, when it couldn't lay out all of the document, such as `"a text box"`. What comes after
     * it isn't laid out
     */
    readonly stoppedAt?: string;
};

// Lengths are laid out in points, and given in pixels, 96 to the inch
const PIXELS_PER_POINT = 96 / 72;

const pixels = (points: number): number => points * PIXELS_PER_POINT;

const inPixels = (block: BlockLayout): BlockLayout =>
    block.type === "paragraph"
        ? {
              ...block,
              lines: block.lines.map((line) => ({
                  ...line,
                  x: pixels(line.x),
                  y: pixels(line.y),
                  width: pixels(line.width),
                  height: pixels(line.height),
                  textWidth: pixels(line.textWidth),
              })),
          }
        : { ...block, rows: block.rows.map((row) => ({ ...row, y: pixels(row.y), height: pixels(row.height) })) };

/**
 * A paragraph of a page of text that runs down it, with its lines where they are on the page, from where they were laid
 * out along the page turned on its side: down the page from its top margin, across it from the right, or the left
 */
const upright =
    ({ textRunsDown, width }: PageLayout): ((block: BlockLayout) => BlockLayout) =>
    (block: BlockLayout): BlockLayout =>
        textRunsDown === undefined || block.type !== "paragraph"
            ? block
            : {
                  ...block,
                  lines: block.lines.map((line) => ({
                      ...line,
                      x: textRunsDown === "fromLeft" ? line.y : width - line.y - line.height,
                      y: line.x,
                      width: line.height,
                      height: line.width,
                  })),
              };

const notesInPixels = (notes: readonly NoteLayout[], page: PageLayout): readonly NoteLayout[] =>
    notes.map((note) => ({ ...note, content: note.content.map(upright(page)).map(inPixels) }));

/**
 * How {@link layoutDocument} lays out the pages.
 *
 * @publicApi
 */
export type LayoutDocumentOptions = {
    /**
     * Whether to lay out past what the layout can't lay out as Word does yet with the best guess it has, as
     * `estimatePageNumbersWith({ guess: true })` does, rather than stop there. Each page says what was guessed at on it,
     * in `guesses`, and `stoppedAt` says where it stopped all the same, where it has no guess. Default is off
     */
    readonly guess?: boolean;
};

/**
 * Lays out a document's pages as Word does, and gives what is on each page: the lines of its paragraphs, with their text
 * and where they are, the rows of its tables, its footnotes and endnotes, and which of its section's headers and footers
 * it shows.
 *
 * ```ts
 * const { pages } = layoutDocument(new Document({ sections: [...] }));
 * ```
 *
 * The pages are laid out as `estimatePageNumbers` lays them out, with the same fonts and rules, and the page numbers of
 * tables of contents and page references are laid out as it writes them. Where it can't lay out something yet, such as a
 * text box, it stops, and gives the pages up to there, with why in `stoppedAt`, unless it is asked to guess.
 *
 * @param document - The document to lay out. It is laid out as it would be written
 * @param options - Whether to guess past what it can't lay out as Word does yet
 *
 * @publicApi
 */
export const layoutDocument = (document: Document, { guess = false }: LayoutDocumentOptions = {}): DocumentLayout => {
    const context: IContext = { file: document, viewWrapper: document.Document, stack: [] };
    const body = document.Document.View.Body.prepForXml(context) as IXmlableObject;
    const { pages, stoppedAt } = layOutPasses(readDocument(body, context, { guess }), undefined, guess);
    return {
        pages: pages.map((page) => ({
            ...page,
            width: pixels(page.width),
            height: pixels(page.height),
            body: page.body.map(upright(page)).map(inPixels),
            footnotes: notesInPixels(page.footnotes, page),
            endnotes: notesInPixels(page.endnotes, page),
        })),
        ...(stoppedAt === undefined ? {} : { stoppedAt }),
    };
};
