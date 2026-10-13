/**
 * HTML for docx documents: `htmlToContent` turns HTML, such as a rich-text editor's, into paragraphs and tables, and
 * `htmlToRuns` into the content of a paragraph, which go in a document as any others do.
 *
 * HTML comes with the `docx` package, from `docx/html`. Everything else, such as the document and its paragraphs,
 * comes from `docx`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer } from "docx";
 * import { htmlToContent } from "docx/html";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       children: htmlToContent(`
 *         <h1>Quarterly report</h1>
 *         <p>Sales were <b>up 12%</b>, led by <a href="https://example.com/emea">EMEA</a>.</p>
 *         <ul><li>New customers: 48</li><li>Renewals: 97%</li></ul>
 *       `),
 *     },
 *   ],
 * });
 *
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export { htmlToContent, htmlToRuns } from "./html-to-content";
export type { HtmlImage, HtmlImageData, HtmlOptions, HtmlWarning, HtmlWarningCode } from "./options";
