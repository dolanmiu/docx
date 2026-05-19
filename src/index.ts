/**
 * Main entry point for the docx library.
 *
 * This module provides a declarative API for creating .docx files that works
 * in both Node.js and browser environments. The library generates documents
 * compliant with the OOXML (Office Open XML) specification.
 *
 * The primary export is the `Document` class (internally named `File`), which
 * serves as the main entry point for creating Word documents.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Paragraph, TextRun, Packer } from "docx";
 *
 * // Create a document
 * const doc = new Document({
 *   sections: [{
 *     children: [
 *       new Paragraph({
 *         children: [
 *           new TextRun({ text: "Hello World", bold: true }),
 *         ],
 *       }),
 *     ],
 *   }],
 * });
 *
 * // Export to buffer
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */

// Internally, the wrapper is a 'File', but export to the end user as a 'Document'
// Use of 'File' also works
export { File as Document } from "./file";
export * from "./file";
export * from "./export";
export * from "./util";
export * from "./patcher";
