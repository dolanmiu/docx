/**
 * Citations and bibliographies for docx documents: the sources a document refers to, such as books, articles and
 * websites, citations of them in its text, such as "(Baker, 2010)", and a bibliography that lists them, in one of Word's
 * styles of citation, such as APA, MLA or Chicago, as Word's References > Citations & Bibliography writes them.
 *
 * Each citation and bibliography is written as Word writes it, so it looks the same in any app, and Word writes it again
 * when it updates the document's fields, or when its style is changed in References > Style.
 *
 * Citations and bibliographies come with the `docx` package, from `docx/bibliography`. Everything else, such as the
 * document and its paragraphs, comes from `docx`. The sources go in the document's `bibliography`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer, Paragraph, TextRun } from "docx";
 * import { Bibliography, Citation, CitationStyle, SourceType, createBibliography } from "docx/bibliography";
 *
 * const doc = new Document({
 *   bibliography: createBibliography({
 *     style: CitationStyle.APA,
 *     sources: [
 *       {
 *         tag: "Bak10",
 *         type: SourceType.BOOK,
 *         authors: [{ lastName: "Baker", firstName: "Anna" }],
 *         title: "The Art of Pizza",
 *         year: 2010,
 *         city: "Naples",
 *         publisher: "Oven Press",
 *       },
 *     ],
 *   }),
 *   sections: [
 *     {
 *       children: [
 *         new Paragraph({ children: [new TextRun("Pizza is older than it seems "), new Citation("Bak10")] }),
 *         new Bibliography({ title: "References" }),
 *       ],
 *     },
 *   ],
 * });
 *
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export { Bibliography, type BibliographyOptions } from "./bibliography";
export { Citation } from "./citation";
export { CitationStyle } from "./citation-style";
export { type DocumentBibliographyOptions, createBibliography } from "./create-bibliography";
export { type CitedSourceOptions } from "./format";
export { type Person, type Source, SourceType } from "./source";
