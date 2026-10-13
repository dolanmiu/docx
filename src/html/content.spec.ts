import { describe, expect, it, vi } from "vitest";

import { Bookmark, CheckBox, ExternalHyperlink, InternalHyperlink, Paragraph, TextRun, UnderlineType } from "docx";
import { formatted } from "tests/html";

import { htmlToContent, htmlToRuns } from "./html-to-content";
import type { HtmlOptions, HtmlWarning } from "./options";

const html = (source: string, options?: HtmlOptions): string => formatted(htmlToContent(source, options));
const text = (value: string, options: Omit<ConstructorParameters<typeof TextRun>[0] & object, "children" | "text"> = {}): TextRun =>
    new TextRun({ ...options, children: [value] });
const link = (value: string, options: Omit<ConstructorParameters<typeof TextRun>[0] & object, "children" | "text"> = {}): TextRun =>
    text(value, { style: "Hyperlink", ...options });
const runs = (source: string, options?: HtmlOptions): string => formatted([new Paragraph({ children: htmlToRuns(source, options) })]);

const warningsOf = (source: string, convert: typeof htmlToContent | typeof htmlToRuns = htmlToContent): readonly HtmlWarning[] => {
    const onWarning = vi.fn<(warning: HtmlWarning) => void>();
    convert(source, { onWarning });
    return onWarning.mock.calls.map(([warning]) => warning);
};

describe("htmlToContent: links", () => {
    it("writes a link to a web address as a hyperlink in Word's Hyperlink style", () => {
        expect(html('<p>See <a href="https://example.com/a?b=1&amp;c=2">this</a>.</p>')).toBe(
            formatted([
                new Paragraph({
                    children: [
                        text("See "),
                        new ExternalHyperlink({ link: "https://example.com/a?b=1&c=2", children: [link("this")] }),
                        text("."),
                    ],
                }),
            ]),
        );
    });

    it("keeps the formatting of the text in a link, and of the link", () => {
        expect(html('<p><a href="https://example.com" style="color: red"><b>a</b>b</a></p>')).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new ExternalHyperlink({
                            link: "https://example.com",
                            children: [link("a", { bold: true, color: "FF0000" }), link("b", { color: "FF0000" })],
                        }),
                    ],
                }),
            ]),
        );
    });

    it("writes a link in formatting, and formatting in a link, as links", () => {
        expect(
            html(
                '<p><strong><a href="https://a.com">a</a></strong> <a href="https://b.com"><strong>b</strong></a> <span><b><a href="https://c.com">c</a></b></span></p>',
            ),
        ).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new ExternalHyperlink({ link: "https://a.com", children: [link("a", { bold: true })] }),
                        text(" "),
                        new ExternalHyperlink({ link: "https://b.com", children: [link("b", { bold: true })] }),
                        text(" "),
                        new ExternalHyperlink({ link: "https://c.com", children: [link("c", { bold: true })] }),
                    ],
                }),
            ]),
        );
    });

    it("writes links next to each other as hyperlinks of their own", () => {
        expect(html('<p><a href="https://a.com">a</a><a href="https://a.com">b</a></p>')).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new ExternalHyperlink({ link: "https://a.com", children: [link("a")] }),
                        new ExternalHyperlink({ link: "https://a.com", children: [link("b")] }),
                    ],
                }),
            ]),
        );
    });

    it("keeps mailto: and tel: links, and resolves relative links against baseUrl", () => {
        expect(
            html('<p><a href="mailto:a@b.com">m</a><a href="tel:+441234">t</a><a href="../x">r</a></p>', {
                baseUrl: "https://example.com/a/b/",
            }),
        ).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new ExternalHyperlink({ link: "mailto:a@b.com", children: [link("m")] }),
                        new ExternalHyperlink({ link: "tel:+441234", children: [link("t")] }),
                        new ExternalHyperlink({ link: "https://example.com/a/x", children: [link("r")] }),
                    ],
                }),
            ]),
        );
    });

    it("keeps a relative link as it is without baseUrl", () => {
        expect(html('<p><a href="docs/a.html">a</a></p>')).toBe(
            formatted([new Paragraph({ children: [new ExternalHyperlink({ link: "docs/a.html", children: [link("a")] })] })]),
        );
    });

    it("leaves out links that could run code, keeping their text, with a warning", () => {
        expect(
            html(
                '<p><a href="javascript:alert(1)">a</a><a href=" JavaScript:x">b</a><a href="data:text/html,x">c</a><a href="vbscript:x">d</a></p>',
            ),
        ).toBe(formatted([new Paragraph({ children: [text("abcd")] })]));
        expect(warningsOf('<a href="javascript:alert(1)">a</a>')).toEqual([
            { code: "unsafe-link", message: 'The link to "javascript:alert(1)" could run code, so its text is kept without it' },
        ]);
    });

    it("writes an <a> with no href, or an empty one, as its text", () => {
        expect(html('<p><a>a</a><a href="">b</a><a href="  ">c</a></p>')).toBe(formatted([new Paragraph({ children: [text("abc")] })]));
    });

    it("takes the Hyperlink style's underline off a link that CSS takes it off", () => {
        expect(html('<p><a href="https://a.com" style="text-decoration: none">a</a></p>')).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new ExternalHyperlink({
                            link: "https://a.com",
                            children: [link("a", { underline: { type: UnderlineType.NONE } })],
                        }),
                    ],
                }),
            ]),
        );
    });

    describe("in the document", () => {
        it("writes a link to an element's id as a link to a bookmark at the element", () => {
            expect(html('<p><a href="#intro">Go</a></p><h2 id="intro">Intro</h2>')).toBe(
                formatted([
                    new Paragraph({ children: [new InternalHyperlink({ anchor: "intro", children: [link("Go")] })] }),
                    new Paragraph({ heading: "Heading2", children: [new Bookmark({ id: "intro", children: [] }), text("Intro")] }),
                ]),
            );
        });

        it("writes a bookmark at an <a name>", () => {
            expect(html('<p><a name="here"></a>Here</p><p><a href="#here">back</a></p>')).toBe(
                formatted([
                    new Paragraph({ children: [new Bookmark({ id: "here", children: [] }), text("Here")] }),
                    new Paragraph({ children: [new InternalHyperlink({ anchor: "here", children: [link("back")] })] }),
                ]),
            );
        });

        it("only writes bookmarks at ids that links go to", () => {
            expect(html('<p id="unused">a</p>')).toBe(formatted([new Paragraph({ children: [text("a")] })]));
        });

        it("gives bookmarks names Word allows: letters, digits and underscores, starting with a letter, of at most 40", () => {
            const id = `1 two-three.${"x".repeat(50)}`;
            const written = html(
                `<p><a href="#${encodeURIComponent(id)}">a</a><a href="#déjà vu">b</a></p><p id="${id}">c</p><p id="déjà vu">d</p>`,
            );
            expect(written).toContain(`w:anchor="_1_two_three_${"x".repeat(27)}"`);
            expect(written).toContain(`w:name="_1_two_three_${"x".repeat(27)}"`);
            expect(written).toContain('w:anchor="déjà_vu"');
            expect(written).toContain('w:name="déjà_vu"');
        });

        it("gives ids that are the same in Word's names names of their own", () => {
            const written = html(
                '<p><a href="#a-b">1</a><a href="#a_b">2</a><a href="#A_B">3</a></p><p id="a-b">x</p><p id="a_b">y</p><p id="A_B">z</p>',
            );
            expect([...written.matchAll(/w:anchor="([^"]*)"/g)].map(([, name]) => name)).toEqual(["a_b", "a_b_2", "A_B_3"]);
            expect([...written.matchAll(/w:name="([^"]*)"/g)].map(([, name]) => name)).toEqual(["a_b", "a_b_2", "A_B_3"]);
        });

        it("writes a link to #top as one to an element whose id is top, when there is one", () => {
            expect(html('<p id="top">a</p><p><a href="#top">b</a></p><p id="">c</p>')).toContain('<w:bookmarkStart w:name="top"');
            expect(html('<p id="">a</p><p><a href="#">b</a></p>')).not.toContain("bookmarkStart");
        });

        it("writes a link to # or #top as one to the top of the document, as Word's _top bookmark is", () => {
            expect(html('<p><a href="#">a</a><a href="#top">b</a></p>')).toBe(
                formatted([
                    new Paragraph({
                        children: [
                            new InternalHyperlink({ anchor: "_top", children: [link("a")] }),
                            new InternalHyperlink({ anchor: "_top", children: [link("b")] }),
                        ],
                    }),
                ]),
            );
        });

        it("writes a link to an id that isn't in the HTML to a bookmark of that name, which the document may have", () => {
            expect(html('<p><a href="#other">a</a></p>')).toContain('w:anchor="other"');
        });

        it("reads a link's id that isn't encoded well as it is written", () => {
            expect(html('<p><a href="#a%zz">a</a></p><p id="a%zz">b</p>')).toContain('w:anchor="a_zz"');
        });

        it("writes a bookmark at an element with nothing in it before the next paragraph, or after the last", () => {
            expect(html('<p><a href="#x">a</a><a href="#y">b</a></p><span id="x"></span><p>c</p><span id="y"></span>')).toBe(
                formatted([
                    new Paragraph({
                        children: [
                            new InternalHyperlink({ anchor: "x", children: [link("a")] }),
                            new InternalHyperlink({ anchor: "y", children: [link("b")] }),
                        ],
                    }),
                    new Paragraph({
                        children: [new Bookmark({ id: "x", children: [] }), text("c"), new Bookmark({ id: "y", children: [] })],
                    }),
                ]),
            );
        });

        it("writes a bookmark at a block that starts with a table at the start of the paragraph after it", () => {
            expect(html('<p><a href="#t">a</a></p><div id="t"><table><tr><td>x</td></tr></table></div><p>b</p>')).toMatch(
                /<\/w:tbl><w:p><w:bookmarkStart w:name="t" w:id="0"\/><w:bookmarkEnd w:id="0"\/><w:r><w:t xml:space="preserve">b<\/w:t>/,
            );
        });

        it("leaves out a bookmark with no paragraph to go in", () => {
            expect(html('<a href="#x"></a><span id="x"></span>')).toBe("");
        });
    });
});

describe("htmlToContent: checkboxes and inputs", () => {
    it("writes checkboxes, checked or not", () => {
        expect(html('<p><input type="checkbox" checked> a <input type="CHECKBOX"> b</p>')).toBe(
            formatted([
                new Paragraph({ children: [new CheckBox({ checked: true }), text(" a "), new CheckBox({ checked: false }), text(" b")] }),
            ]),
        );
    });

    it("writes radio buttons as checkboxes with circles", () => {
        expect(html('<p><input type="radio" checked><input type="radio"></p>')).toBe(
            formatted([
                new Paragraph({
                    children: [
                        new CheckBox({
                            checked: true,
                            checkedState: { value: "25C9", font: "Segoe UI Symbol" },
                            uncheckedState: { value: "25CB", font: "Segoe UI Symbol" },
                        }),
                        text(" "),
                        new CheckBox({
                            checked: false,
                            checkedState: { value: "25C9", font: "Segoe UI Symbol" },
                            uncheckedState: { value: "25CB", font: "Segoe UI Symbol" },
                        }),
                    ],
                }),
            ]),
        );
    });
});

describe("htmlToContent: tracked changes", () => {
    it("underlines <ins> and strikes <del> through without trackChanges, as a browser shows them", () => {
        expect(html("<p><ins>a</ins><del>b</del></p>")).toBe(
            formatted([
                new Paragraph({ children: [text("a", { underline: { type: UnderlineType.SINGLE } }), text("b", { strike: true })] }),
            ]),
        );
    });

    it("writes <ins> and <del> as Word's tracked changes with trackChanges, at their datetime", () => {
        const written = html('<p>a<ins datetime="2026-01-02T03:04:05Z">b</ins><del>c</del></p>', {
            trackChanges: { author: "Ada", date: "2026-10-13T09:00:00Z" },
        });
        expect(written).toBe(
            '<w:p><w:r><w:t xml:space="preserve">a</w:t></w:r>' +
                '<w:ins w:id="0" w:author="Ada" w:date="2026-01-02T03:04:05Z"><w:r><w:t xml:space="preserve">b</w:t></w:r></w:ins>' +
                '<w:del w:id="0" w:author="Ada" w:date="2026-10-13T09:00:00Z"><w:r><w:delText xml:space="preserve">c</w:delText></w:r></w:del></w:p>',
        );
    });

    it("writes the time of a tracked change as now when neither its datetime nor trackChanges gives one", () => {
        const written = html("<p><ins>a</ins></p>", { trackChanges: { author: "Ada" } });
        expect(written).toMatch(/<w:ins w:id="0" w:author="Ada" w:date="\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ">/);
    });

    it("keeps the formatting of the text in a tracked change, and tracks the blocks in it", () => {
        const written = html("<ins><p><b>a</b></p></ins>", { trackChanges: { author: "Ada", date: "2026-10-13T09:00:00Z" } });
        expect(written).toBe(
            '<w:p><w:ins w:id="0" w:author="Ada" w:date="2026-10-13T09:00:00Z"><w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">a</w:t></w:r></w:ins></w:p>',
        );
    });

    it("gives each tracked change an id no other has", () => {
        const written = formatted(
            htmlToContent("<p><ins>a</ins><ins>b</ins></p>", { trackChanges: { author: "Ada", date: "2026-10-13T09:00:00Z" } }),
        );
        expect(written.match(/<w:ins /g)).toHaveLength(2);
        const raw = htmlToContent("<p><ins>a</ins><ins>b</ins></p>", { trackChanges: { author: "Ada", date: "2026-10-13T09:00:00Z" } });
        expect(raw).toHaveLength(1);
    });
});

describe("htmlToContent: math", () => {
    it("writes KaTeX's math from its LaTeX, leaving out its HTML", () => {
        const katex =
            '<p>Euler: <span class="katex"><span class="katex-mathml"><math><semantics><mrow><msup><mi>e</mi><mrow><mi>i</mi><mi>π</mi></mrow></msup></mrow><annotation encoding="application/x-tex">e^{i\\pi}</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base">e iπ</span></span></span></p>';
        const written = html(katex);
        expect(written).toContain("<m:oMath><m:sSup>");
        expect(written).not.toContain("e iπ");
    });

    it("writes the LaTeX of Quill's formulas, TipTap's math and CKEditor's", () => {
        for (const source of [
            '<p><span class="ql-formula" data-value="x^2"></span></p>',
            '<p><span data-type="inline-math" data-latex="x^2"></span></p>',
            '<p><span class="math-tex">\\(x^2\\)</span></p>',
            '<p><script type="math/tex">x^2</script></p>',
        ]) {
            expect(html(source), source).toContain(
                "<m:oMath><m:sSup><m:sSupPr/><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>",
            );
        }
    });

    it("keeps the text of LaTeX it can't read, with a warning", () => {
        expect(html('<p><span data-latex="\\nonsense{x}"></span></p>')).toBe(
            formatted([new Paragraph({ children: [text("\\nonsense{x}")] })]),
        );
        expect(warningsOf('<span data-latex="\\nonsense{x}"></span>').map(({ code }) => code)).toEqual(["invalid-math"]);
    });

    it("writes MathML without LaTeX element by element", () => {
        const written = html("<p><math><mfrac><mn>1</mn><mi>x</mi></mfrac></math></p>");
        expect(written).toContain("<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>x</m:t></m:r></m:den></m:f>");
    });

    it("reads MathML from its LaTeX annotation's when it can't read the LaTeX", () => {
        const written = html('<p><math><semantics><mi>y</mi><annotation encoding="TeX">\\nonsense</annotation></semantics></math></p>');
        expect(written).toContain("<m:t>y</m:t>");
    });

    it("writes display math in a paragraph of its own", () => {
        expect(html('<p>a<math display="block"><mi>x</mi></math>b</p>').match(/<w:p>/g)).toHaveLength(3);
    });
});

describe("htmlToContent: unsupported content", () => {
    it.each(["iframe", "video", "audio", "canvas", "object", "embed"])("leaves out <%s> with a warning", (name) => {
        expect(html(`<p>a<${name}>${name === "embed" ? "" : "fallback"}</${name}>b</p>`)).toBe(
            formatted([new Paragraph({ children: [text("ab")] })]),
        );
        expect(warningsOf(`<${name}></${name}>`)).toEqual([
            { code: "unsupported-element", message: `A document can't have an <${name}>, so it is left out` },
        ]);
    });

    it("doesn't throw for HTML without onWarning", () => {
        expect(() => htmlToContent('<video></video><img src="x"><a href="javascript:x">a</a>')).not.toThrow();
    });
});

describe("htmlToRuns", () => {
    it("writes inline HTML as the content of a paragraph", () => {
        expect(runs("Total: <b>£120</b>")).toBe(formatted([new Paragraph({ children: [text("Total: "), text("£120", { bold: true })] })]));
    });

    it("writes the HTML's paragraphs as lines of the paragraph", () => {
        expect(runs("<p>a</p><p><i>b</i></p><p>c</p>")).toBe(
            formatted([
                new Paragraph({
                    children: [
                        text("a"),
                        new TextRun({ break: 1, italics: true, children: ["b"] }),
                        new TextRun({ break: 1, children: ["c"] }),
                    ],
                }),
            ]),
        );
    });

    it("keeps the content of tables and lists, without them, with a warning", () => {
        expect(runs("<ul><li>a</li></ul><table><tr><td>b</td><td>c</td></tr></table>")).toBe(
            formatted([
                new Paragraph({
                    children: [text("a"), new TextRun({ break: 1, children: ["b"] }), new TextRun({ break: 1, children: ["c"] })],
                }),
            ]),
        );
        expect(warningsOf("<ul><li>a</li></ul>", htmlToRuns)).toEqual([
            {
                code: "block-in-paragraph",
                message: "A paragraph can't have the HTML's tables and lists, so their content is kept without them",
            },
        ]);
        expect(() => htmlToRuns("<table><tr><td>a</td></tr></table>")).not.toThrow();
    });

    it("writes a link and an image", () => {
        expect(runs('<a href="https://a.com">a</a>')).toBe(
            formatted([new Paragraph({ children: [new ExternalHyperlink({ link: "https://a.com", children: [link("a")] })] })]),
        );
    });

    it("writes nothing for empty HTML", () => {
        expect(htmlToRuns("")).toEqual([]);
    });

    it("writes a break after a paragraph with no text in the paragraph's formatting", () => {
        expect(runs('<p><input type="checkbox"></p><p>a</p>')).toBe(
            formatted([new Paragraph({ children: [new CheckBox({ checked: false }), new TextRun({ break: 1, children: ["a"] })] })]),
        );
    });
});
