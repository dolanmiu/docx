/**
 * Shapes for docx documents: the preset shapes, such as rectangles, arrows and flowchart symbols, groups of shapes, and
 * drawing canvases whose connectors stay attached to the shapes they join.
 *
 * Shapes come with the `docx` package, from `docx/shapes`. Everything else, such as the document and its paragraphs,
 * comes from `docx`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer, Paragraph } from "docx";
 * import { ShapeRun } from "docx/shapes";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       children: [
 *         new Paragraph({
 *           children: [new ShapeRun({ type: "ellipse", transformation: { width: 120, height: 60 }, fill: "4472C4" })],
 *         }),
 *       ],
 *     },
 *   ],
 * });
 *
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export * from "./shape-run";
export * from "./shape-group-run";
export * from "./shape-canvas-run";
export * from "./shape-connector";
