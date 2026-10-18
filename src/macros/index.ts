/**
 * VBA macros for docx documents, written from their code. A document with macros is a macro-enabled document, which
 * Word opens from a .docm file.
 *
 * Macros come with the `docx` package, from `docx/macros`. Everything else, such as the document and its paragraphs,
 * comes from `docx`. The macros go in the document's `macros`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer, Paragraph } from "docx";
 * import { createMacros } from "docx/macros";
 *
 * const doc = new Document({
 *   macros: createMacros({
 *     modules: [{ name: "Greetings", code: 'Sub SayHello()\n    MsgBox "Hello"\nEnd Sub' }],
 *   }),
 *   sections: [{ children: [new Paragraph("Run SayHello from View > Macros")] }],
 * });
 *
 * const buffer = await Packer.toBuffer(doc); // Saved as a .docm
 * ```
 */
export { type MacroModule, type MacrosOptions, createMacros } from "./create-macros";
