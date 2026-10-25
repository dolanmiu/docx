/**
 * Themes for docx documents: Word's themes, colors and fonts, as its Design tab offers them, and the theme of a Word
 * document or template, or of any other Office file, read to give a document `docx` writes.
 *
 * A document's theme gives it twelve colors, a font for headings and a font for body text. Styles, tables and text
 * that use them, such as `{ theme: "accent1" }` or `{ theme: "headings" }`, look as the theme has them.
 *
 * Themes come with the `docx` package, from `docx/theme`. Everything else, such as the document and its paragraphs,
 * comes from `docx`. A theme goes in the document's `theme`.
 *
 * @module
 *
 * @example
 * ```typescript
 * import * as fs from "fs";
 * import { Document, Packer } from "docx";
 * import { ColorSchemes, FontSchemes, Themes, readTheme } from "docx/theme";
 *
 * // Word's Facet theme
 * const facet = new Document({ theme: Themes.FACET, sections: [] });
 *
 * // Facet, with Word's Blue Green colors and Georgia, as Word's Design > Colors and Design > Fonts mix them
 * const mixed = new Document({
 *   theme: { ...Themes.FACET, colors: ColorSchemes.BLUE_GREEN, fonts: FontSchemes.GEORGIA },
 *   sections: [],
 * });
 *
 * // The theme of a Word template, which its styles use
 * const fromTemplate = new Document({ theme: readTheme(fs.readFileSync("template.dotx")), sections: [] });
 *
 * const buffer = await Packer.toBuffer(facet);
 * ```
 */
export { ColorSchemes } from "./color-schemes";
export { FontSchemes } from "./font-schemes";
export { readTheme } from "./read-theme";
export { Themes } from "./themes";
