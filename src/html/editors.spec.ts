// cspell:ignore EMEA apos שלום עולם
import { describe, expect, it, vi } from "vitest";

// docx's own entry is loaded before its parts that the helpers import, as its modules refer to each other
import "docx";
import { formatted, formattedWithNotes, written as writtenOf } from "tests/html";

import { htmlToContent } from "./html-to-content";
import type { HtmlWarning } from "./options";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import ckeditor5 from "../../demo/assets/html/ckeditor5.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import googleDocs from "../../demo/assets/html/google-docs.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import lexical from "../../demo/assets/html/lexical.html?raw";
// @ts-expect-error -- Vite reads the image as a data URL, which TypeScript has no type for
import logo from "../../demo/assets/html/logo.png?inline";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import markdown from "../../demo/assets/html/markdown.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import quill from "../../demo/assets/html/quill.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import tinymce from "../../demo/assets/html/tinymce.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import tiptap from "../../demo/assets/html/tiptap.html?raw";
// @ts-expect-error -- Vite reads the file as text, which TypeScript has no type for
import word from "../../demo/assets/html/word.html?raw";

// HTML in the shapes rich-text editors, Word, Google Docs and Markdown write, which the demos convert too
const FIXTURES = { ckeditor5, googleDocs, lexical, markdown, quill, tinymce, tiptap, word } as Readonly<Record<string, string>>;
const fixture = (name: string): string => FIXTURES[name];

// The entities XML's text has, which the outline reads
const ENTITIES: ReadonlyMap<string, string> = new Map([
    ["amp", "&"],
    ["gt", ">"],
    ["apos", "'"],
]);

// The number a footnote starts with
const NOTE_MARK = `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>`;

// How the outline shows what isn't text
const SYMBOLS: ReadonlyMap<string, string> = new Map([
    ["<w:br/>", "/"],
    ["<w:tab/>", "\t"],
    ["<m:oMath>", "[math]"],
    ["<wp:inline", "[image]"],
    ["<wp:anchor", "[floating image]"],
    ["<w:footnoteReference", "[footnote]"],
]);

/**
 * A fixture's content, a line for each paragraph and table, as Word shows it: each paragraph's style, its list and
 * level, its text, with what isn't text as a word in brackets, and the formatting it has.
 */
const outline = (name: string): { readonly lines: readonly string[]; readonly warnings: readonly HtmlWarning[] } => {
    const onWarning = vi.fn<(warning: HtmlWarning) => void>();
    // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
    const written = writtenOf(htmlToContent(fixture(name), { images: { "logo.png": logo as string }, onWarning }));
    const warnings = onWarning.mock.calls.map(([warning]) => warning);
    // The lists, in the order they start
    const lists = [...new Set([...written.matchAll(/<w:numId w:val="([^"]*)"\/>/g)].map(([, numId]) => numId))];
    const lines = [...written.matchAll(/<w:tbl>|<w:p>(.*?)<\/w:p>|<w:p\/>/g)].map(([match, paragraph = ""]) => {
        if (match === "<w:tbl>") {
            return "[table]";
        }
        const style = /<w:pStyle w:val="([^"]*)"/.exec(paragraph)?.[1];
        const numbering = /<w:ilvl w:val="(\d+)"\/><w:numId w:val="([^"]*)"/.exec(paragraph);
        const content = [
            ...paragraph.matchAll(
                /<w:t[^>]*>([^<]*)<\/w:t>|<w:br\/>|<w:tab\/>|<m:oMath>|<wp:inline|<wp:anchor|<w:footnoteReference|<w14:checkbox>.*?<w14:checked w14:val="(\d)"|w:pageBreakBefore/g,
            ),
        ]
            .map(([part, text, checked]) => {
                if (text !== undefined) {
                    // Each entity once, so &amp;gt; is &gt;
                    return text.replace(/&(amp|gt|apos);/g, (entity, entityName: string) => ENTITIES.get(entityName) ?? entity);
                }
                if (checked !== undefined) {
                    return checked === "1" ? "[x]" : "[ ]";
                }
                return SYMBOLS.get(part) ?? "[page] ";
            })
            .join("");
        const kind = numbering ? `list ${lists.indexOf(numbering[2])}.${numbering[1]}` : (style ?? "p");
        return `${kind}: ${content}`;
    });
    return { lines, warnings };
};

describe("htmlToContent: editors' HTML", () => {
    it("reads TinyMCE's", () => {
        const { lines, warnings } = outline("tinymce");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA. Returns were flat and costs rose fell.",
            "p: An indented paragraph, as TinyMCE indents them.",
            "p: Red text, highlighted text, large text and monospace text. H2O and E=mc2.",
            "list 0.0: First",
            "list 0.0: Second",
            "list 0.1: Nested",
            "list 0.0: Third",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
            "p: APAC",
            "p: 900",
            "p: [page] [image]",
            "p: ",
            "p: A quotation, which TinyMCE indents.",
            "p: const total = sales.reduce((sum, sale) => sum + sale, 0);/console.log(total);",
            "p: A justified paragraph with one and a half lines of spacing, as TinyMCE's line height menu writes it.",
        ]);
        expect(warnings).toEqual([]);
    });

    it("reads CKEditor 5's", () => {
        const { lines, warnings } = outline("ckeditor5");
        expect(lines).toEqual([
            "Heading2: Quarterly report",
            "p: Sales were up 12%, led by EMEA. Returns were flat and costs rose fell.",
            "p: Marked with the yellow marker, the green one, the red pen, big text, small text, red text and monospace text.",
            "list 0.0: One",
            "list 0.1: Nested",
            "list 0.0: Two",
            "list 1.0: Three",
            "list 1.0: Four",
            "list 2.0: [x] Done",
            "list 2.0: [ ] To do",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
            "p: Total: 2,100",
            "p: [floating image]",
            "p: Our logo",
            "p: Text beside the logo, which floats on the right, as CKEditor's side images do.",
            "p: A quotation.",
            "p: const total = sales.reduce((sum, sale) => sum + sale, 0);",
            "p: [page] Centred, on a new page",
            "p: [math]",
        ]);
        expect(warnings).toEqual([]);
    });

    it("reads Quill's", () => {
        const { lines, warnings } = outline("quill");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA. Returns were flat and costs rose fell.",
            "p: Centred and large",
            "p: Indented once",
            "p: Red and highlighted, serif and monospace.",
            "list 0.0: First",
            "list 0.1: Nested",
            "list 0.0: Second",
            "list 1.0: A bullet",
            "list 2.0: [x] Done",
            "list 2.0: [ ] To do",
            "p: A quotation.",
            "p: const total = sales.reduce((sum, sale) => sum + sale, 0);",
            "p: console.log(total);",
            "p: The formula [math] in a sentence.",
            "p: ",
            "p: שלום עולם",
        ]);
        expect(warnings).toEqual([]);
    });

    it("reads TipTap's", () => {
        const { lines, warnings } = outline("tiptap");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA. Returns were flat and costs rose fell.",
            "p: Centred",
            "p: Highlighted and purple, inline code, H2O and x2.",
            "list 0.0: One",
            "list 0.1: Nested",
            "list 0.0: Two",
            "list 1.0: Three",
            "list 1.0: Four",
            "list 2.0: [x] Done",
            "list 2.0: [ ] To do",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
            "p: A quotation.",
            "p: const total = sales.reduce((sum, sale) => sum + sale, 0);",
            "p: ",
            "p: The equation [math] in a sentence.",
            "p: [image]",
            "p: ",
        ]);
        expect(warnings).toEqual([]);
    });

    it("reads Lexical's, with its lists in lists and its checklists", () => {
        const { lines, warnings } = outline("lexical");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA.  Two spaces before this, which Lexical keeps.",
            "list 0.0: One",
            "list 0.1: Nested",
            "list 0.0: Two",
            "list 1.0: [x] Done",
            "list 1.0: [ ] To do",
            "p: A quotation.",
            "p: const total = 1;",
        ]);
        expect(warnings).toEqual([]);
    });

    it("reads what Google Docs puts on the clipboard", () => {
        const { lines, warnings } = outline("googleDocs");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA, as expected and highlighted.",
            "list 0.0: One",
            "list 0.1: Nested",
            "list 0.0: Two",
            "p: ",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
        ]);
        expect(warnings).toEqual([]);
    });

    it("writes Google Docs' line spacing of 1.15, its fonts, and no bold from its <b> around everything", () => {
        const written = formatted(htmlToContent(fixture("googleDocs")));
        expect(written).toContain('<w:spacing w:line="276" w:lineRule="auto"/>');
        expect(written).toContain('<w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/>');
        expect(written.match(/<w:b\/>/g)).toHaveLength(3);
    });

    it("reads what Word puts on the clipboard, with its lists and page break", () => {
        const { lines, warnings } = outline("word");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA. Returns were flat and costs rose fell.",
            "list 0.0: First",
            "list 0.1: Nested",
            "list 0.0: Second",
            "list 1.0: A bullet",
            "p: Highlighted and red.",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
            "p: [page] On a new page.",
        ]);
        expect(warnings).toEqual([]);
    });

    it("writes Word's heading and paragraph styles from its style sheet", () => {
        const written = formatted(htmlToContent(fixture("word")));
        expect(written).toMatch(/<w:pStyle w:val="Heading1"\/><w:spacing w:before="240" w:line="257" w:lineRule="auto"\/><\/w:pPr>/);
        expect(written).toContain(
            '<w:rFonts w:ascii="Calibri Light" w:cs="Calibri Light" w:eastAsia="Calibri Light" w:hAnsi="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="32"/>',
        );
    });

    it("reads what Markdown becomes, with its task lists, tables, code, KaTeX and footnotes", () => {
        const { lines, warnings } = outline("markdown");
        expect(lines).toEqual([
            "Heading1: Quarterly report",
            "p: Sales were up 12%, led by EMEA. See the details.[footnote]",
            "p: A quotation.",
            "list 0.0: [x] Done",
            "list 0.0: [ ] To do",
            "[table]",
            "p: Region",
            "p: Sales",
            "p: EMEA",
            "p: 1,200",
            "Heading2: Details",
            "p: const total = sales.reduce((sum, sale) => sum + sale, 0);",
            "p: Inline code, emphasis, deleted and an image: [image]",
            "p: KaTeX: [math]",
        ]);
        expect(warnings).toEqual([]);
        // eslint-disable-next-line @typescript-eslint/naming-convention -- an address, as the option is given
        expect(formattedWithNotes(htmlToContent(fixture("markdown"), { images: { "logo.png": logo as string } })).footnotes).toBe(
            `<w:footnote w:id="0"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr>${NOTE_MARK}` +
                `<w:r><w:t xml:space="preserve"> A footnote.</w:t></w:r></w:p></w:footnote>`,
        );
    });
});
