import type { EstimatedPageNumbers } from 'docx';
import type { IContext } from 'docx';
import type { IXmlableObject } from 'docx';
import type { PageNumberEstimator } from 'docx';

/**
 * Works out the page each bookmark of a document starts on, and how many pages the document and each of its sections
 * have, by laying out its pages as Word does, so the page numbers of its tables of contents and page references, and its
 * numbers of pages, are written with it. Give it to a document as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbers, sections: [...] });
 * ```
 *
 * The pages are laid out with the widths and heights of the fonts Word documents use most, such as Calibri, Cambria,
 * Arial and Times New Roman. It follows paragraphs' spacing, indents, line spacing, tab stops and keep settings, widow
 * and orphan control, lists, pictures in the line, tables, whose rows break across pages, footnotes and endnotes, page,
 * column and section breaks, and each section's page size, margins, columns, headers, footers and page numbering.
 *
 * It stops at the first thing it can't lay out yet: a drawing that text flows around, a text box or frame, an equation,
 * a footnote that continues on the next page, columns evened out before a continuous section break, or a table row kept
 * whole that is taller than a page. The page references to bookmarks after it are left blank, for
 * Word to fill in when it updates the fields.
 *
 * Page references and tables of contents are written clean, so Word shows the numbers as they are written, and the
 * page numbers it left blank stay blank, without asking to update the fields, unless the document has `updateFields`
 * on.
 *
 * @publicApi
 */
export declare const estimatePageNumbers: (body: IXmlableObject, context: IContext) => EstimatedPageNumbers;

/**
 * How {@link estimatePageNumbersWith} lays out the pages.
 *
 * @publicApi
 */
export declare type EstimatePageNumbersOptions = {
    /**
     * Measures how wide text is, such as {@link measureWithPretext}, which measures it with the fonts a browser has.
     * Default is the widths of the fonts Word documents use most, which {@link estimatePageNumbers} uses. Lines still
     * break, and tabs move to their stops, as Word lays them out, and lines are as tall as Word makes them.
     */
    readonly measureWidth?: MeasureWidth;
};

/**
 * Works out the page each bookmark of a document starts on, as {@link estimatePageNumbers} does, measuring text as the
 * options say. Give what it returns to a document as its `pageNumbers`:
 *
 * ```ts
 * new Document({ pageNumbers: estimatePageNumbersWith({ measureWidth: measureWithPretext(pretext) }), sections: [...] });
 * ```
 *
 * @publicApi
 */
export declare const estimatePageNumbersWith: ({ measureWidth }: EstimatePageNumbersOptions) => PageNumberEstimator;

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

export { }
