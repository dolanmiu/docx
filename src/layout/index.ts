/**
 * docx/layout: lays out a document's pages as Word does, to write the page numbers of its tables of contents and page
 * references with it, or to give what is on each page.
 *
 * @module
 */
export * from "./estimate-page-numbers";
export * from "./layout-document";
export { type FontToMeasure, type MeasureWidth, type Pretext, type PretextOptions, measureWithPretext } from "./measure-width";
