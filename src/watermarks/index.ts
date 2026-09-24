/**
 * Watermarks for docx documents: faint text, such as "DRAFT", or a picture behind the content of every page.
 *
 * Watermarks come with the `docx` package, from `docx/watermarks`. Everything else, such as the document, its headers
 * and their paragraphs, comes from `docx`. A watermark goes in a paragraph of a header, as Word puts it there.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Header, Paragraph } from "docx";
 * import { TextWatermark } from "docx/watermarks";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       headers: { default: new Header({ children: [new Paragraph({ children: [new TextWatermark({ text: "DRAFT" })] })] }) },
 *       children: [new Paragraph("Hello")],
 *     },
 *   ],
 * });
 * ```
 */
export * from "./text-watermark";
export * from "./image-watermark";
