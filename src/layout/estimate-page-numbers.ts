/**
 * Estimates the page numbers of a document's bookmarks when it is written, or of a template's once `patchDocument` has
 * patched it, by laying out its pages as Word does.
 *
 * @module
 */
// cspell:ignore Aptos Carlito
import type {
    EstimatedPageNumbers,
    IContext,
    IXmlableObject,
    PageNumberEstimator,
    PatchedTemplate,
    TemplatePageNumberEstimator,
} from "docx";

import { DEFAULT_MEASURER, type FontData, type TextMeasurer, createFontFileMeasurer, readFontFile } from "../text-layout";
import { knownPageCount, layOutPasses } from "./layout-passes";
import { type MeasureWidth, measurerOf } from "./measure-width";
import { type DocumentContent, readDocument } from "./read-document";
import { readDocx } from "./read-docx";

/** What a document is read into: a template patchDocument patched, or the body of a document being written */
const contentOf = (document: IXmlableObject | PatchedTemplate, context?: IContext): DocumentContent | undefined =>
    "parts" in document ? readDocx(document.parts, document.binaryParts) : context?.file && readDocument(document, context);

/** Lays out the pages until their page numbers stop changing, with a measurer. Gives none when they don't */
const estimateWith = (content: DocumentContent | undefined, measurer: TextMeasurer): EstimatedPageNumbers => {
    const pagination = content && layOutPasses(content, measurer);
    if (!pagination?.settled) {
        return { bookmarks: new Map() };
    }
    const pageCount = knownPageCount(pagination);
    return {
        bookmarks: pagination.bookmarks,
        sectionPageCounts: pagination.sectionPageCounts,
        bookmarkPageNumbers: pagination.bookmarkNumbers,
        relativePositions: pagination.relativePositions,
        ...(pageCount === undefined ? {} : { pageCount }),
    };
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
 * measured from their files. To measure text in other fonts, such as Aptos, from their files, use
 * {@link estimatePageNumbersWith}. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
 * and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
 * column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing or table that text flows around, a text box or frame, an
 * equation, a footnote that continues on the next page, columns evened out before a continuous section break, a line in
 * a table cell that is taller than a page, text in a font that isn't in the width tables and isn't embedded, such as
 * Aptos, a character whose width in its font isn't known, such as a mathematical symbol in Calibri, which Word draws in
 * Cambria Math, or a date in the text, which Word writes when it opens the document. The page references to bookmarks
 * after it are left blank, for Word to fill in when it updates the fields. A document in compatibility mode, which Word
 * lays out as an older version of Word did, isn't laid out at all. When laying the pages out again with the page numbers
 * it worked out still changes them after three passes, as when a table of contents wraps one way with a number and the
 * other way without it, all of them are left blank.
 *
 * Page references are written as Word writes them, with `\p` ("above", "below" or "on page 4") and in formats of their
 * own, such as `\* roman`, and so are numbers of pages. Page references, tables of contents and SEQ fields (caption
 * numbers, which are counted without laying out the pages) are written clean, so Word shows the numbers as they are
 * written, and the numbers left blank stay blank, without asking to update the fields, unless the document has
 * `updateFields` on.
 *
 * @publicApi
 */
export const estimatePageNumbers: PageNumberEstimator & TemplatePageNumberEstimator = (
    document: IXmlableObject | PatchedTemplate,
    context?: IContext,
): EstimatedPageNumbers => estimateWith(contentOf(document, context), DEFAULT_MEASURER);

/**
 * A font file to measure text in.
 *
 * @publicApi
 */
export type FontFile = {
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
 * How {@link estimatePageNumbersWith} lays out the pages.
 *
 * @publicApi
 */
export type EstimatePageNumbersOptions = {
    /**
     * Font files to measure text in, with their own widths, kerning and line heights, as Word measures it. Give a file
     * for each of a font's faces the document uses, such as Aptos, Aptos Bold and Aptos Italic: text in fonts without
     * files is measured as it is without them, and so is bold text, or text that isn't bold, in a font without a file for
     * it, which stops the layout when the font isn't in the width tables. Italic text in a font without an italic file is
     * measured with the upright one. The layout stops at a character a font's file has no glyph for, as Word draws it in
     * another font. A font the document embeds is measured from the document's own file
     */
    readonly fonts?: readonly FontFile[];
    /**
     * Measures how wide text is, such as {@link measureWithPretext}, which measures it with the fonts a browser has.
     * Default is the widths of the fonts Word documents use most, which {@link estimatePageNumbers} uses. Lines still
     * break, and tabs move to their stops, as Word lays them out, and lines are as tall as Word makes them, from the
     * width tables, so the layout stops at text in a font that isn't in them and isn't given as a file or embedded.
     */
    readonly measureWidth?: MeasureWidth;
};

/**
 * Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
 * options say. Give what it returns to a document as its `pageNumbers`, or to `patchDocument` as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * const fonts = [{ data: await readFile("Aptos.ttf") }, { data: await readFile("Aptos-Bold.ttf") }];
 * new Document({ pageNumbers: estimatePageNumbersWith({ fonts }), sections: [...] });
 * ```
 *
 * It throws when a font file isn't a TrueType or OpenType font.
 *
 * @publicApi
 */
export const estimatePageNumbersWith = ({
    measureWidth,
    fonts = [],
}: EstimatePageNumbersOptions): PageNumberEstimator & TemplatePageNumberEstimator => {
    // Text in the fonts given as files is measured from them, and the rest as measureWidth, or the width tables, measure it
    const faces = fonts.flatMap(({ data, name }) => readFontFile(data).map((face) => (name === undefined ? face : { ...face, name })));
    const others = measureWidth ? measurerOf(measureWidth) : DEFAULT_MEASURER;
    // One measurer for every document, so the lines laid out for one are kept for the passes after
    const measurer = faces.length === 0 ? others : createFontFileMeasurer(faces, others);
    return (document: IXmlableObject | PatchedTemplate, context?: IContext) => estimateWith(contentOf(document, context), measurer);
};
