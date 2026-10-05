import type { Document as Document_2 } from 'docx';
import type { PageNumberEstimator } from 'docx';
import type { TemplatePageNumberEstimator } from 'docx';

/**
 * A paragraph or table on a page.
 *
 * @publicApi
 */
export declare type BlockLayout = ParagraphLayout | TableLayout;

/**
 * A document's pages, as {@link layoutDocument} lays them out.
 *
 * @publicApi
 */
export declare type DocumentLayout = {
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

/**
 * Works out the page each bookmark of a document starts on, and how many pages the document and each of its sections
 * have, by laying out its pages as Word does, so the page numbers of its tables of contents and page references, and its
 * numbers of pages, are written with it. Give it to a document as its `pageNumbers`, or to `patchDocument` as its
 * `pageNumbers` to write a template's once it is patched:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
 * await patchDocument({ outputType: "nodebuffer", data, patches, pageNumbers: estimatePageNumbers });
 * ```
 *
 * The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
 * Arial and Times New Roman, and of those made as wide, such as Carlito, and text in the fonts the document embeds is
 * measured from their files, but for fonts Office also offers. To measure text in other fonts, such as Aptos, from their files, use
 * {@link estimatePageNumbersWith}. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
 * and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
 * column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing or table that text flows around, a text box or frame, an
 * equation, a footnote that continues on the next page, columns evened out before a continuous section break, a line in
 * a table cell that is taller than a page, text in a font that isn't in the width tables and isn't embedded, such as
 * Garamond, text in a font the document embeds that Office also offers, such as Pacifico, which Word for Mac draws in
 * Office's own copy of it, a character whose width in its font isn't known, such as a mathematical symbol in Calibri, which Word draws in
 * Cambria Math, a word Word may hyphenate, in a document that hyphenates its words, as which parts Word breaks it into
 * is in its own dictionaries, or a date in the text, which Word writes when it opens the document. The page references
 * to bookmarks after it are left blank, for Word to fill in when it updates the fields. A document in compatibility
 * mode, which Word lays out as an older version of Word did, isn't laid out at all, nor is one with a compatibility
 * setting that changes Word's lines in a way not yet followed: `suppressTopSpacing` or `useFELayout` turned on, or one
 * of Word's own the layout doesn't know, on or off. The schema's other settings, which ask for an older Word's or
 * another application's layout, Word lays out lines with as without them, and settings for other applications are left
 * to them. When laying the pages out again with the page numbers it worked out still changes them after three passes,
 * as when a table of contents wraps one way with a number and the other way without it, all of them are left blank. To
 * lay out past what it stops at with the best guess it has instead, give the document
 * `estimatePageNumbersWith({ guess: true })`.
 *
 * Page references are written as Word writes them, with `\p` ("above", "below" or "on page 4") and in formats of their
 * own, such as `\* roman`, and so are numbers of pages. Page references, tables of contents and SEQ fields (caption
 * numbers, which are counted without laying out the pages) are written clean, so Word shows the numbers as they are
 * written, and the numbers left blank stay blank, without asking to update the fields, unless the document has
 * `updateFields` on.
 *
 * @publicApi
 */
export declare const estimatePageNumbers: PageNumberEstimator & TemplatePageNumberEstimator;

/**
 * How {@link estimatePageNumbersWith} lays out the pages.
 *
 * @publicApi
 */
export declare type EstimatePageNumbersOptions = {
    /**
     * Font files to measure text in, with their own widths, kerning, ligatures and line heights, as Word measures it. Give
     * a file for each of a font's faces the document uses, such as Aptos, Aptos Bold and Aptos Italic: text in fonts
     * without files is measured as it is without them, and so is bold text, or text that isn't bold, in a font without a
     * file for it, which stops the layout when the font isn't in the width tables. Italic text in a font without an italic
     * file is measured with the upright one. The layout stops at a character a font's file has no glyph for, as Word draws
     * it in another font. A font the document embeds is measured from the document's own file. Text in a font Office also
     * offers, such as Pacifico, stops the layout, as Word for Mac draws it in Office's own copy of the font, but for
     * Office's fonts of the width tables, such as Aptos
     */
    readonly fonts?: readonly FontFile[];
    /**
     * Measures how wide text is, such as {@link measureWithPretext}, which measures it with the fonts a browser has.
     * Default is the widths of the fonts Word documents use most, which {@link estimatePageNumbers} uses. Lines still
     * break, and tabs move to their stops, as Word lays them out, and lines are as tall as Word makes them, from the
     * width tables, so the layout stops at text in a font that isn't in them and isn't given as a file or embedded.
     */
    readonly measureWidth?: MeasureWidth;
    /**
     * Whether to lay out past what the layout can't lay out as Word does yet with the best guess it has, rather than
     * leave the page numbers after it blank. Text in a font that isn't in the width tables, and isn't given as a file or
     * embedded, is measured as the most similar font that is, such as Roboto as Arial, text in a font given as a file or
     * embedded that Office also offers is measured from the file, and a character whose width isn't
     * known as an average letter of its font. A date is measured as it is written, and a setting or formatting the layout
     * doesn't follow, such as hyphenation or a compatibility setting, is left as if it weren't there. What it can't read,
     * such as a drawing that text flows around or an equation, is left out, and a page laid out as the rule it follows
     * nearest to Word's lays it out. It still stops where it has no guess, such as at an imported document.
     *
     * The page numbers may then not be Word's, so `guesses`, in what the estimator gives, says where it guessed. Default
     * is off, so the numbers written are Word's, as near as the layout knows, or blank.
     */
    readonly guess?: boolean;
};

/**
 * Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
 * options say. Give what it returns to a document as its `pageNumbers`, or to `patchDocument` as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * const fonts = [{ data: await readFile("Aptos.ttf") }, { data: await readFile("Aptos-Bold.ttf") }];
 * new Document({ pageNumbers: estimatePageNumbersWith({ fonts }), sections: [...] });
 * new Document({ pageNumbers: estimatePageNumbersWith({ guess: true }), sections: [...] });
 * ```
 *
 * It throws when a font file isn't a TrueType or OpenType font.
 *
 * @publicApi
 */
export declare const estimatePageNumbersWith: ({ measureWidth, fonts, guess, }: EstimatePageNumbersOptions) => PageNumberEstimator & TemplatePageNumberEstimator;

/**
 * A font file's bytes: a TrueType or OpenType font (`.ttf` or `.otf`), or a collection of them (`.ttc`).
 */
declare type FontData = Uint8Array | ArrayBuffer;

/**
 * A font file to measure text in.
 *
 * @publicApi
 */
export declare type FontFile = {
    /**
     * The file's bytes: a TrueType or OpenType font (`.ttf` or `.otf`), or a collection of them (`.ttc`). Web fonts
     * (`.woff` and `.woff2`) are compressed, and can't be read
     */
    readonly data: FontData;
    /**
     * The name documents give the font, when it isn't the name in the file, such as `"Calibri"` for a file of Carlito,
     * which is as wide. Each font in the file has the name it gives itself by default, such as `"Aptos"`
     */
    readonly name?: string;
};

/**
 * The font to measure text in.
 *
 * @publicApi
 */
export declare type FontToMeasure = {
    /** The font's name, as the document gives it, such as `"Calibri"` */
    readonly name: string;
    /** Size in points */
    readonly size: number;
    readonly bold: boolean;
    readonly italic: boolean;
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
export declare const layoutDocument: (document: Document_2, { guess }?: LayoutDocumentOptions) => DocumentLayout;

/**
 * How {@link layoutDocument} lays out the pages.
 *
 * @publicApi
 */
export declare type LayoutDocumentOptions = {
    /**
     * Whether to lay out past what the layout can't lay out as Word does yet with the best guess it has, as
     * `estimatePageNumbersWith({ guess: true })` does, rather than stop there. Each page says what was guessed at on it,
     * in `guesses`, and `stoppedAt` says where it stopped all the same, where it has no guess. Default is off
     */
    readonly guess?: boolean;
};

/**
 * A line of a paragraph on a page. Lengths are in pixels, 96 to the inch, from the top left corner of the page.
 *
 * @publicApi
 */
export declare type LineLayout = {
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
 * Measures how wide text is in a font, in points. The text is a word, part of one, or the spaces between words, with no
 * tabs or line breaks: the layout places those itself, at the paragraph's tab stops, as Word does. It adds the space
 * between characters and the width of scaled text, which the document's formatting gives, to what this measures.
 *
 * @publicApi
 */
export declare type MeasureWidth = (text: string, font: FontToMeasure) => number;

/**
 * Measures text with Pretext, in the fonts the page has, for laying out a document's pages in a browser. Pretext needs
 * a canvas to measure with, an `OffscreenCanvas` or a page's, so it doesn't work in Node.
 *
 * Load the fonts first, such as with `document.fonts.load("11pt Calibri")`: until a font has loaded, the browser
 * measures text in another, and Pretext keeps the widths it measured.
 *
 * ```ts
 * import * as pretext from "@chenglou/pretext";
 * import { estimatePageNumbersWith, measureWithPretext } from "docx/layout";
 *
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * ```
 *
 * @param pretext - Pretext's module, or the two functions of it that are used
 * @publicApi
 */
export declare const measureWithPretext: <Prepared>({ prepareWithSegments, measureNaturalWidth }: Pretext<Prepared>, { fontFamilies }?: PretextOptions) => MeasureWidth;

/**
 * A footnote or endnote, or the part of one, on a page.
 *
 * @publicApi
 */
export declare type NoteLayout = {
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
export declare type PageLayout = {
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
 * A paragraph, or the part of one, on a page.
 *
 * @publicApi
 */
export declare type ParagraphLayout = {
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
 * The functions of Pretext (`@chenglou/pretext`) that {@link measureWithPretext} uses. The module itself is one:
 * `import * as pretext from "@chenglou/pretext"`.
 *
 * @publicApi
 */
export declare type Pretext<Prepared> = {
    readonly prepareWithSegments: (text: string, font: string, options: {
        readonly whiteSpace: "pre-wrap";
    }) => Prepared;
    readonly measureNaturalWidth: (prepared: Prepared) => number;
};

/**
 * @publicApi
 */
export declare type PretextOptions = {
    /**
     * The CSS font families to measure each of the document's fonts with, by the name the document gives the font, such
     * as `{ Calibri: "Carlito, sans-serif" }` for a page that has Carlito, which is as wide as Calibri, but not Calibri.
     * A font not in it is measured with the font of its own name, or the browser's default font if the page doesn't
     * have it.
     */
    readonly fontFamilies?: Readonly<Record<string, string>>;
};

/**
 * A row of a table, or the part of one, on a page. Lengths are in pixels, from the top of the page.
 *
 * @publicApi
 */
export declare type RowLayout = {
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
export declare type TableLayout = {
    readonly type: "table";
    /** Where the table is among the paragraphs and tables of the body, or of its note, counted from 0 */
    readonly index: number;
    /** Its rows on the page, or the parts of them on it, in order, with its header rows repeated at the top of each page */
    readonly rows: readonly RowLayout[];
};

export { }
