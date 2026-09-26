/**
 * Charts for docx documents: native Word charts, such as column, line and pie charts, drawn by the application from
 * their data, which is embedded as a workbook that Word's "Edit Data" opens.
 *
 * Charts come with the `docx` package, from `docx/charts`. Everything else, such as the document and its paragraphs,
 * comes from `docx`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer, Paragraph } from "docx";
 * import { ChartRun } from "docx/charts";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       children: [
 *         new Paragraph({
 *           children: [
 *             new ChartRun({
 *               type: "column",
 *               title: "Sales",
 *               categories: ["Jan", "Feb", "Mar"],
 *               series: [{ name: "2025", values: [10, 20, 30] }],
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
export * from "./chart-run";
