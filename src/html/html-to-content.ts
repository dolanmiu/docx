/**
 * HTML as docx's content: `htmlToContent` and `htmlToRuns`.
 *
 * @module
 */
import type { Paragraph, ParagraphChild, Table } from "docx";

import type { Block, Inline } from "./content";
import type { HtmlOptions } from "./options";
import { readHtml } from "./read-html";
import { withNotes, writeBlocks } from "./write-blocks";
import { writeInline } from "./write-inline";

// Tracked changes need ids no others in the document have. They are counted from a million, past the ids written by hand
let revisions = 1_000_000;
const nextRevisionId = (): number => ++revisions;

/**
 * Turns HTML into paragraphs and tables, to go in a document's sections, headers, footers, table cells and anywhere
 * else they go, among others, or to patch a template with.
 *
 * It reads what rich-text editors write, such as TinyMCE, CKEditor, Quill, TipTap and Lexical, and what Word and
 * Google Docs put on the clipboard, as a browser reads it: its `<style>` elements and `style` attributes, the styles
 * of the classes those editors write, and HTML's own meanings, such as `<b>`'s bold. Paragraphs, headings, lists and
 * links are in the Word document's own styles, such as Heading 1 and Hyperlink, with only what the HTML says, such as
 * a colour or a font size, written as direct formatting.
 *
 * It has headings, paragraphs and line breaks; bold, italic, underlined, struck through, superscript and subscript
 * text, its colours, backgrounds, fonts, sizes and spacing; alignment, indents, line spacing, borders and shading of
 * paragraphs; lists, numbered or not, in each other, with their numbers' styles and starts; tables, with merged cells,
 * header rows, widths, borders, backgrounds and alignment; images, with their sizes and alt text, floating or not;
 * links, within the document too; checkboxes; math, as Word's equations; page breaks; and tracked changes.
 *
 * Nothing is downloaded: images that aren't data URLs are given with the `images` option. HTML that isn't valid is
 * read as a browser reads it, and what the document can't have, such as a video, is left out, with a warning to
 * `onWarning`. It never throws for the HTML it is given.
 *
 * @param html - The HTML: some of a document's body, such as an editor's content, or a whole document
 * @param options - Options, such as the images and CSS of the HTML
 * @returns The paragraphs and tables
 *
 * @example
 * ```typescript
 * import { Document, Packer } from "docx";
 * import { htmlToContent } from "docx/html";
 *
 * const doc = new Document({
 *     sections: [{ children: htmlToContent("<h1>Report</h1><p>The <b>results</b> are in.</p>") }],
 * });
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export const htmlToContent = (html: string, options: HtmlOptions = {}): readonly (Paragraph | Table)[] =>
    writeBlocks(readHtml(html, options), nextRevisionId);

/** The content of blocks, with a line break between each block's and the next's, and tables' cells' in order */
const flatten = (blocks: readonly Block[]): readonly (readonly Inline[])[] =>
    blocks.flatMap((block) => {
        if (block.type === "paragraph") {
            return [block.content];
        }
        return block.type === "table" ? block.rows.flatMap((row) => row.cells.flatMap((cell) => flatten(cell.content))) : [];
    });

/**
 * Turns HTML into the content of a paragraph: runs of text, hyperlinks, images and the rest, such as for a paragraph
 * of a document's own, or to patch a paragraph of a template with.
 *
 * It reads HTML as `htmlToContent` does. Paragraphs in the HTML are lines of the paragraph, and the content of tables
 * and lists is kept, without the tables and lists, with a warning, as a paragraph can't have them.
 *
 * @param html - The HTML, such as `"<b>Due</b> on <i>Friday</i>"`
 * @param options - Options, such as the images and CSS of the HTML
 * @returns The paragraph's content
 *
 * @example
 * ```typescript
 * new Paragraph({ children: htmlToRuns("Total: <b>£120</b>") });
 * ```
 */
export const htmlToRuns = (html: string, options: HtmlOptions = {}): readonly ParagraphChild[] => {
    const blocks = readHtml(html, options);
    if (blocks.some((block) => block.type === "table" || (block.type === "paragraph" && block.item))) {
        options.onWarning?.({
            code: "block-in-paragraph",
            message: "A paragraph can't have the HTML's tables and lists, so their content is kept without them",
        });
    }
    const lines = flatten(blocks);
    const breakAfter = (line: readonly Inline[]): Inline => {
        const last = [...line].reverse().find((item): item is Extract<Inline, { readonly type: "text" }> => item.type === "text");
        return { type: "break", format: last?.format ?? {} };
    };
    return writeInline(
        withNotes(
            lines.flatMap((line, index) => (index === lines.length - 1 ? line : [...line, breakAfter(line)])),
            nextRevisionId,
        ),
        nextRevisionId,
    );
};
