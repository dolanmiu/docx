/**
 * Embedded files for docx documents: a workbook, a document, a presentation or any other file, such as a sound, a video
 * or a PDF, embedded in the document as an OLE object, which opens from it, as Word's Insert > Object embeds a file.
 *
 * Embedded files come with the `docx` package, from `docx/embedded-files`. Everything else, such as the document and its
 * paragraphs, comes from `docx`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import * as fs from "fs";
 * import { Document, Packer, Paragraph } from "docx";
 * import { EmbeddedFileRun } from "docx/embedded-files";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       children: [
 *         new Paragraph({
 *           children: [
 *             new EmbeddedFileRun({
 *               fileName: "budget.xlsx",
 *               data: fs.readFileSync("./budget.xlsx"),
 *               preview: { type: "png", data: fs.readFileSync("./budget.png") },
 *               transformation: { width: 240, height: 120 },
 *             }),
 *           ],
 *         }),
 *       ],
 *     },
 *   ],
 * });
 *
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export * from "./embedded-file-run";
