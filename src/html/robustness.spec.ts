/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import { describe, expect, it, vi } from "vitest";

import { Document, Packer, Paragraph, PatchType, TextRun, patchDocument } from "docx";
import { formatted } from "tests/html";
import { textOf, unzip, zip } from "tests/zip";

import { htmlToContent, htmlToRuns } from "./html-to-content";
import type { HtmlWarning } from "./options";
import { DEEPEST_ELEMENT } from "./read-html";

/** Packs content into a document, and returns its parts' XML, which must be well formed */
const packed = async (children: ReturnType<typeof htmlToContent>): Promise<Readonly<Record<string, string>>> => {
    const files = unzip(await Packer.toBuffer(new Document({ sections: [{ children }] })));
    const parts = [...files.keys()]
        .filter((path) => path.endsWith(".xml") || path.endsWith(".rels"))
        .map((path) => [path, textOf(files, path)!] as const);
    for (const [path, part] of parts) {
        const parsed = new DOMParser().parseFromString(part, "application/xml");
        expect(parsed.getElementsByTagName("parsererror"), path).toHaveLength(0);
    }
    return Object.fromEntries(parts);
};

/** A random number generator with a seed, so a failing case can be run again */
const random = (seed: number): (() => number) => {
    let state = seed;
    return () => {
        // Mulberry32
        // eslint-disable-next-line no-bitwise
        state = (state + 0x6d2b79f5) | 0;
        // eslint-disable-next-line no-bitwise
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        // eslint-disable-next-line no-bitwise
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        // eslint-disable-next-line no-bitwise
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

const TAGS = [
    "p",
    "div",
    "span",
    "b",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "thead",
    "tbody",
    "h1",
    "h3",
    "br",
    "hr",
    "img",
    "blockquote",
    "pre",
    "code",
    "sup",
    "sub",
    "q",
    "font",
    "center",
    "dl",
    "dt",
    "dd",
    "math",
    "mi",
    "mfrac",
    "input",
    "select",
    "option",
    "figure",
    "figcaption",
    "caption",
    "col",
    "ins",
    "del",
    "mark",
    "small",
    "svg",
    "rect",
    "section",
    "ruby",
    "rt",
    "iframe",
    "label",
];
const ATTRIBUTES = [
    'style="color: red; font-size: 2em"',
    'style="margin: 0 auto; border: 1px solid"',
    'style="display: none"',
    'style="display: block"',
    'style="float: left; width: 50%"',
    'style="page-break-before: always"',
    'style="list-style-type: lower-roman"',
    'style="white-space: pre"',
    'style="background: var(--x, #eee); line-height: 150%"',
    'style="text-decoration: underline wavy"',
    'colspan="3"',
    'rowspan="0"',
    'rowspan="2"',
    'href="#a"',
    'href="https://example.com"',
    'href="javascript:x"',
    'id="a"',
    'start="5"',
    'value="3"',
    "reversed",
    'type="checkbox" checked',
    'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"',
    'src="missing.png"',
    'class="ql-indent-2"',
    'data-list="bullet"',
    'align="center"',
    'border="1"',
    'dir="rtl"',
    'lang="fr"',
    'width="100"',
];
const TEXTS = ["text", " ", "  spaced  ", "&nbsp;", "a\tb\nc", "&#1;", "<", "&amp;", "😀", "\u0000", "]]>", "x".repeat(50)];

/** Random HTML, of tags opened and closed, or not, with attributes and text */
const randomHtml = (next: () => number, length: number): string => {
    const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
    let html = "";
    for (let index = 0; index < length; index++) {
        const roll = next();
        if (roll < 0.35) {
            html += `<${pick(TAGS)}${next() < 0.5 ? ` ${pick(ATTRIBUTES)}` : ""}>`;
        } else if (roll < 0.6) {
            html += `</${pick(TAGS)}>`;
        } else {
            html += pick(TEXTS);
        }
    }
    return html;
};

describe("htmlToContent: robustness", () => {
    it("keeps the text of content in more elements in each other than it reads, with a warning, without running out of stack", () => {
        const depth = 5000;
        const html = `${"<div><span>".repeat(depth / 2)}deep${"</span></div>".repeat(depth / 2)}`;
        const onWarning = vi.fn<(warning: HtmlWarning) => void>();
        const content = htmlToContent(html, { onWarning });
        const warnings = onWarning.mock.calls.map(([warning]) => warning);
        expect(formatted(content)).toContain("deep");
        expect(warnings).toEqual([
            {
                code: "too-deep",
                message: `Content in more than ${DEEPEST_ELEMENT} elements in each other keeps its text, without its formatting`,
            },
        ]);
    }, 30_000);

    it("reads deeply nested tables and lists", async () => {
        const tables = `${"<table><tr><td>".repeat(30)}x${"</td></tr></table>".repeat(30)}`;
        const lists = `${"<ul><li>x".repeat(30)}${"</li></ul>".repeat(30)}`;
        const parts = await packed(htmlToContent(tables + lists));
        expect(parts["word/document.xml"].match(/<w:tbl>/g)).toHaveLength(30);
    });

    it("reads a long document in a few seconds", () => {
        const html = Array.from(
            { length: 5000 },
            (_, index) => `<p>Paragraph <b>${index}</b> with <a href="https://example.com/${index}">a link</a>.</p>`,
        ).join("");
        const start = Date.now();
        expect(htmlToContent(html)).toHaveLength(5000);
        expect(Date.now() - start).toBeLessThan(15_000);
    });

    it("reads a big table", async () => {
        const row = `<tr>${"<td>cell</td>".repeat(20)}</tr>`;
        const parts = await packed(htmlToContent(`<table>${row.repeat(200)}</table>`));
        expect(parts["word/document.xml"].match(/<w:tc>/g)).toHaveLength(4000);
    });

    it("reads HTML that isn't valid as a browser does", () => {
        expect(formatted(htmlToContent("<p>a<b>b<i>c</b>d</i>e"))).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new TextRun({ children: ["a"] }),
                        new TextRun({ bold: true, children: ["b"] }),
                        new TextRun({ bold: true, italics: true, children: ["c"] }),
                        new TextRun({ italics: true, children: ["d"] }),
                        new TextRun({ children: ["e"] }),
                    ],
                }),
            ]),
        );
        expect(formatted(htmlToContent("</p></div>a<li>b</ul>"))).toContain("a");
        expect(() => htmlToContent("<<<>>><!-- <p a='\"'>&&;&#xZZ;</ ></")).not.toThrow();
    });

    it("runs nothing, and downloads nothing, in hostile HTML", () => {
        const html =
            '<script>globalThis.ran = true</script><img src="x" onerror="globalThis.ran = true"><iframe src="https://example.com"></iframe><style>p { background: url(https://example.com/x.png) }</style><p onclick="globalThis.ran = true">a</p><a href="javascript:globalThis.ran = true">b</a>';
        htmlToContent(html);
        expect((globalThis as { readonly ran?: boolean }).ran).toBeUndefined();
    });

    it("writes the same content each time it reads the same HTML", () => {
        const html =
            "<h1>a</h1><ul><li>b<ol><li>c</li></ol></li></ul><table><tr><td rowspan='2'>d</td><td>e</td></tr><tr><td>f</td></tr></table>";
        expect(formatted(htmlToContent(html))).toBe(formatted(htmlToContent(html)));
    });

    it("writes a document that every part of is well formed, for random HTML", async () => {
        const next = random(2026);
        for (let index = 0; index < 150; index++) {
            const html = randomHtml(next, 60);
            const content = htmlToContent(html, { trackChanges: { author: "Fuzz", date: "2026-10-13T00:00:00Z" } });
            await expect(packed(content), html).resolves.toBeDefined();
            expect(() => htmlToRuns(html), html).not.toThrow();
        }
    }, 120_000);

    it("writes a document whose lists, links and images are in its numbering, relationships and media", async () => {
        const html =
            '<ol><li>a</li></ol><ul><li>b</li></ul><p><a href="https://example.com">link</a><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></p>';
        const parts = await packed(htmlToContent(html));
        expect(parts["word/numbering.xml"].match(/<w:abstractNum /g)).toHaveLength(3);
        expect(parts["word/_rels/document.xml.rels"]).toContain('Target="https://example.com" TargetMode="External"');
        expect(parts["word/_rels/document.xml.rels"]).toMatch(/Target="media\/[^"]+\.gif"/);
        const numIds = [...parts["word/document.xml"].matchAll(/<w:numId w:val="(\d+)"\/>/g)].map(([, id]) => id);
        expect(new Set(numIds).size).toBe(2);
    });

    it("writes content from HTML twice in one document, with lists of their own", async () => {
        const list = "<ol><li>a</li></ol>";
        const parts = await packed([...htmlToContent(list), ...htmlToContent(list)]);
        const numIds = [...parts["word/document.xml"].matchAll(/<w:numId w:val="(\d+)"\/>/g)].map(([, id]) => id);
        expect(new Set(numIds).size).toBe(2);
    });
});

describe("htmlToContent and htmlToRuns in patchDocument", () => {
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const template = (): Uint8Array =>
        zip({
            "[Content_Types].xml":
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
            "_rels/.rels":
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
            "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body><w:p><w:r><w:t>{{body}}</w:t></w:r></w:p><w:p><w:r><w:t>Total: {{total}}</w:t></w:r></w:p></w:body></w:document>`,
        });

    it("patches a template's paragraph with content, and another's text with runs, adding their lists and links", async () => {
        const output = await patchDocument({
            outputType: "nodebuffer",
            data: template(),
            patches: {
                body: {
                    type: PatchType.DOCUMENT,
                    children: [
                        ...htmlToContent('<h2>Notes</h2><ol><li>One</li><li>Two</li></ol><p><a href="https://example.com">More</a></p>'),
                    ],
                },
                total: { type: PatchType.PARAGRAPH, children: [...htmlToRuns("<b>£120</b>")] },
            },
        });
        const files = unzip(output);
        const document = textOf(files, "word/document.xml")!;
        const numbering = textOf(files, "word/numbering.xml")!;
        expect(document).toContain('<w:pStyle w:val="Heading2"/>');
        expect(document).toMatch(/<w:numId w:val="\d+"\/>.*One.*<w:numId w:val="\d+"\/>.*Two/);
        expect(document).toMatch(/Total: <\/w:t><\/w:r><w:r><w:rPr><w:b\/><w:bCs\/><\/w:rPr><w:t xml:space="preserve">£120/);
        expect(numbering).toContain('<w:numFmt w:val="decimal"/>');
        expect(textOf(files, "word/_rels/document.xml.rels")).toContain("https://example.com");
    });
});
