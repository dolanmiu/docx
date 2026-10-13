/**
 * The options of `htmlToContent` and `htmlToRuns`.
 *
 * @module
 */

/** An image's data: its bytes, as a Uint8Array (such as a Node.js Buffer) or an ArrayBuffer, or base64, or a data URL */
export type HtmlImageData = Uint8Array | ArrayBuffer | string;

/**
 * An image's data, or an object with it and, for an SVG, a PNG of it, which Word shows where it can't show SVGs. An
 * SVG given without one is shown as nothing there.
 */
export type HtmlImage = HtmlImageData | { readonly data: HtmlImageData; readonly fallback?: HtmlImageData };

/** What kind of thing a warning is about */
export type HtmlWarningCode =
    /** An element the document can't have, such as `<video>` or `<iframe>`, which is left out */
    | "unsupported-element"
    /** An image whose data isn't in the HTML or the `images` option, which is left out */
    | "missing-image"
    /** An image in a format Word can't show, such as WebP, or data that isn't an image, which is left out */
    | "unsupported-image"
    /** A link to a `javascript:` address, or another that could run code, whose text is kept without the link */
    | "unsafe-link"
    /** Math that can't be read, whose text is kept */
    | "invalid-math"
    /** Content in more than a thousand elements in each other, whose text is kept without its formatting */
    | "too-deep"
    /** A table, list or other block in HTML given to `htmlToRuns`, whose content is kept in the paragraph */
    | "block-in-paragraph"
    /** A table in a note, whose cells' paragraphs are kept in the footnote or endnote without it */
    | "table-in-note";

/** Something in the HTML that the document leaves out or has differently */
export type HtmlWarning = {
    readonly code: HtmlWarningCode;
    /** What it is, in English, such as `The image "photo.webp" is WebP, which Word can't show, so it is left out` */
    readonly message: string;
};

/**
 * Options for turning HTML into a document's content.
 */
// eslint-disable-next-line functional/no-mixed-types
export type HtmlOptions = {
    /**
     * CSS for the HTML, as if it were in a `<style>` element after the HTML's own, such as the style sheet of the
     * editor it comes from. Rules in `@media print` blocks are used, and those in other `@media` blocks aren't.
     */
    readonly stylesheet?: string;
    /**
     * The Word styles to give the elements that CSS selectors match, by the styles' ids, such as
     * `{ "p.lead": "Lead", "blockquote": "Quote", "code": "InlineCode", "table": "GridTable4" }`. A block is given a
     * paragraph style, an inline element a character style, and a table a table style. When selectors that match an
     * element give it different styles, the most specific selector's is used, as in CSS. The styles must be in the
     * document, such as in its `styles` option or the template it patches.
     */
    readonly styleMap?: Readonly<Record<string, string>>;
    /**
     * The images that `<img src>` refers to by addresses other than data URLs, as docx/html doesn't download anything:
     * an object of each address and its image, or a function that gives the image for an address, or undefined when it
     * has none. An address is looked for as it is written, and then resolved against `baseUrl`.
     */
    readonly images?: Readonly<Record<string, HtmlImage>> | ((source: string) => HtmlImage | undefined);
    /**
     * The widest an image can be, in pixels, so it fits on the page: 601 by default, the width of the text on the page
     * of a document with docx's default page size and margins. Wider images are scaled down.
     */
    readonly maxImageWidth?: number;
    /** The address that relative links and image addresses are relative to, such as `https://example.com/blog/` */
    readonly baseUrl?: string;
    /**
     * Turns `<ins>` and `<del>`, such as an HTML diff's, into Word's tracked changes, by this author, and at the time
     * of their `datetime` attribute, or this time, or now: an ISO 8601 date and time such as
     * `2026-10-13T09:30:00Z`. Without it, they are underlined and struck through, as a browser shows them.
     */
    readonly trackChanges?: { readonly author: string; readonly date?: string };
    /**
     * What the HTML's notes are in Word, such as the footnotes of Markdown, Pandoc and Google Docs: `"footnotes"`, at
     * the foot of the page each is referred to on, by default, or `"endnotes"`, at the end of the document, as a web
     * page has them. Word's own HTML says which of its notes are footnotes and which are endnotes, which they stay.
     */
    readonly notes?: "footnotes" | "endnotes";
    /** Called with each thing in the HTML that the document leaves out or has differently */
    readonly onWarning?: (warning: HtmlWarning) => void;
};
