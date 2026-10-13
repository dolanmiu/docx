import { describe, expect, it } from "vitest";

import { HighlightColor, Paragraph, ShadingType, Tab, TextRun, UnderlineType } from "docx";
import { formatted } from "tests/html";

import { htmlToContent } from "./html-to-content";
import type { HtmlOptions } from "./options";

const html = (source: string, options?: HtmlOptions): string => formatted(htmlToContent(source, options));
const paragraphs = (...children: readonly Paragraph[]): string => formatted(children);
const text = (value: string, options: Omit<ConstructorParameters<typeof TextRun>[0] & object, "children" | "text"> = {}): TextRun =>
    new TextRun({ ...options, children: [value] });
const paragraph = (...children: readonly TextRun[]): Paragraph => new Paragraph({ children });

describe("htmlToContent: text", () => {
    describe("whitespace", () => {
        it("collapses runs of spaces, tabs and new lines into one space", () => {
            expect(html("<p>one   two\t\tthree\n\nfour</p>")).toBe(paragraphs(paragraph(text("one two three four"))));
        });

        it("leaves out spaces at the start and end of a paragraph", () => {
            expect(html("<p>  \n hello \n </p>")).toBe(paragraphs(paragraph(text("hello"))));
        });

        it("keeps the space between elements, as in <strong>Bosch</strong> <em>arrived</em>", () => {
            expect(html("<p><strong>Bosch</strong> <em>arrived</em></p>")).toBe(
                paragraphs(paragraph(text("Bosch", { bold: true }), text(" "), text("arrived", { italics: true }))),
            );
        });

        it("keeps one space where it is on both sides of an element's edge, in the run before it", () => {
            expect(html("<p>hello <b> world</b></p>")).toBe(paragraphs(paragraph(text("hello "), text("world", { bold: true }))));
        });

        it("keeps a space at the start of a span after a bold word", () => {
            expect(html("<p><strong>hello</strong><span> world</span></p>")).toBe(
                paragraphs(paragraph(text("hello", { bold: true }), text(" world"))),
            );
        });

        it("turns a new line between words in the source into a space", () => {
            expect(html("<p>one\ntwo</p>")).toBe(paragraphs(paragraph(text("one two"))));
        });

        it("keeps non-breaking spaces, which don't collapse", () => {
            expect(html("<p>&nbsp;&nbsp;indented&nbsp; </p>")).toBe(paragraphs(paragraph(text("  indented "))));
        });

        it("keeps a paragraph of only a non-breaking space, which editors write for an empty line", () => {
            expect(html("<p>&nbsp;</p>")).toBe(paragraphs(paragraph(text(" "))));
        });

        it("leaves out the spaces between blocks", () => {
            expect(html("<p>a</p>\n   \n<p>b</p>")).toBe(paragraphs(paragraph(text("a")), paragraph(text("b"))));
        });

        it("keeps spaces, tabs and new lines in <pre>", () => {
            expect(html("<pre>  a\tb\n  c</pre>")).toBe(
                paragraphs(
                    new Paragraph({
                        children: [
                            new TextRun({ font: "Courier New", children: ["  a", new Tab(), "b"] }),
                            new TextRun({ font: "Courier New", break: 1, children: ["  c"] }),
                        ],
                    }),
                ),
            );
        });

        it("leaves out the new line after <pre>'s start tag, as HTML does, and its last one", () => {
            expect(html("<pre>\ncode\n</pre>")).toBe(paragraphs(paragraph(text("code", { font: "Courier New" }))));
        });

        it("keeps spaces with white-space: pre-wrap, as Lexical and Google Docs write them", () => {
            expect(html('<p><span style="white-space: pre-wrap">a   b</span></p>')).toBe(paragraphs(paragraph(text("a   b"))));
        });

        it("keeps new lines but collapses spaces with white-space: pre-line", () => {
            expect(html('<p style="white-space: pre-line">a   b\n  c</p>')).toBe(
                paragraphs(new Paragraph({ children: [text("a b"), new TextRun({ break: 1, children: ["c"] })] })),
            );
        });

        it("collapses spaces with white-space: nowrap", () => {
            expect(html('<p style="white-space: nowrap">a   b</p>')).toBe(paragraphs(paragraph(text("a b"))));
        });

        it("doesn't collapse a space before preserved text", () => {
            expect(html('<p>a <span style="white-space: pre">  b</span></p>')).toBe(paragraphs(paragraph(text("a   b"))));
        });

        it("keeps a space before an image and after it", () => {
            const written = html('<p>a <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"> b</p>');
            expect(written).toMatch(/<w:t xml:space="preserve">a <\/w:t>.*<w:drawing>.*<w:t xml:space="preserve"> b<\/w:t>/);
        });

        it("leaves out the characters XML doesn't allow, which Word says make a document unreadable", () => {
            expect(html("<p>a&#1;b&#x1B;c\u0008d￾e&#xFFFF;f</p>")).toBe(paragraphs(paragraph(text("abcdef"))));
        });

        it("keeps characters outside the Basic Multilingual Plane, and leaves out halves of them on their own", () => {
            expect(html("<p>😀 \uD83D x \uDE00y</p>")).toBe(paragraphs(paragraph(text("😀 x y"))));
        });

        it("writes a NUL character as the replacement character, as HTML parses it", () => {
            expect(html("<p>a&#0;b</p>")).toBe(paragraphs(paragraph(text("a�b"))));
        });

        it("escapes <, & and ]]> in text", () => {
            expect(html("<p>a &lt; b &amp; c ]]&gt;</p>")).toContain('<w:t xml:space="preserve">a &lt; b &amp; c ]]&gt;</w:t>');
        });

        it("writes a soft hyphen and a zero-width space as they are, and <wbr> as a zero-width space", () => {
            expect(html("<p>a&shy;b&#8203;c<wbr>d</p>")).toBe(paragraphs(paragraph(text("a­b​c​d"))));
        });
    });

    describe("line breaks", () => {
        it("writes <br> as a line break in the paragraph", () => {
            expect(html("<p>a<br>b</p>")).toBe(
                paragraphs(new Paragraph({ children: [text("a"), new TextRun({ break: 1, children: ["b"] })] })),
            );
        });

        it("leaves out a <br> that ends a paragraph, which starts a line with nothing on it", () => {
            expect(html("<p>a<br></p>")).toBe(paragraphs(paragraph(text("a"))));
        });

        it("keeps one empty line for two <br>s at the end of a paragraph", () => {
            expect(html("<p>a<br><br></p>")).toBe(paragraphs(new Paragraph({ children: [text("a"), new TextRun({ break: 1 })] })));
        });

        it("writes an editor's empty line, <p><br></p>, as an empty paragraph", () => {
            expect(html("<p>a</p><p><br></p><p>b</p>")).toBe(paragraphs(paragraph(text("a")), new Paragraph({}), paragraph(text("b"))));
        });

        it("writes an empty <p></p>, as TipTap writes an empty line, as an empty paragraph", () => {
            expect(html("<p></p>")).toBe(paragraphs(new Paragraph({})));
        });

        it("leaves out spaces either side of a line break", () => {
            expect(html("<p>a <br> b</p>")).toBe(
                paragraphs(new Paragraph({ children: [text("a"), new TextRun({ break: 1, children: ["b"] })] })),
            );
        });

        it("writes a line break between two <h1>s with a <br> between them as one empty paragraph, not two", () => {
            expect(html("<h1>a</h1><br><h1>b</h1>")).toBe(
                paragraphs(
                    new Paragraph({ heading: "Heading1", children: [text("a")] }),
                    new Paragraph({}),
                    new Paragraph({ heading: "Heading1", children: [text("b")] }),
                ),
            );
        });

        it("keeps line breaks in a link in the link", () => {
            expect(html('<p><a href="https://example.com">a<br>b</a></p>')).toMatch(
                /<w:hyperlink[^>]*>.*<w:t xml:space="preserve">a<\/w:t>.*<w:br\/>.*<w:t xml:space="preserve">b<\/w:t>.*<\/w:hyperlink>/,
            );
        });

        it("keeps line breaks before an image, in a run of their own", () => {
            const written = html('<p>a<br><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></p>');
            expect(written).toMatch(/<w:t xml:space="preserve">a<\/w:t><\/w:r><w:r><w:br\/><\/w:r><w:r><w:drawing>/);
        });
    });

    describe("formatting tags", () => {
        it.each([
            ["b", { bold: true }],
            ["strong", { bold: true }],
            ["i", { italics: true }],
            ["em", { italics: true }],
            ["cite", { italics: true }],
            ["dfn", { italics: true }],
            ["var", { italics: true }],
            ["u", { underline: { type: UnderlineType.SINGLE } }],
            ["ins", { underline: { type: UnderlineType.SINGLE } }],
            ["s", { strike: true }],
            ["strike", { strike: true }],
            ["del", { strike: true }],
            ["sup", { superScript: true }],
            ["sub", { subScript: true }],
            ["code", { font: "Courier New" }],
            ["kbd", { font: "Courier New" }],
            ["samp", { font: "Courier New" }],
            ["tt", { font: "Courier New" }],
            ["mark", { highlight: HighlightColor.YELLOW }],
            ["small", { size: 20 }],
            ["big", { size: 29 }],
        ] as const)("writes <%s> as its formatting", (tag, format) => {
            expect(html(`<p><${tag}>x</${tag}></p>`)).toBe(paragraphs(paragraph(text("x", format))));
        });

        it("combines nested tags' formatting, as <strong><u>", () => {
            expect(html("<p><strong><u>x</u></strong></p>")).toBe(
                paragraphs(paragraph(text("x", { bold: true, underline: { type: UnderlineType.SINGLE } }))),
            );
        });

        it("doesn't let a formatting tag's formatting leak into what comes after it", () => {
            expect(html("<p><b>a</b>b<i>c</i>d</p>")).toBe(
                paragraphs(paragraph(text("a", { bold: true }), text("b"), text("c", { italics: true }), text("d"))),
            );
        });

        it("underlines and strikes through text at once", () => {
            expect(html("<p><u><s>x</s></u></p>")).toBe(
                paragraphs(paragraph(text("x", { underline: { type: UnderlineType.SINGLE }, strike: true }))),
            );
        });

        it("keeps a parent's underline under a span that says text-decoration: none, as CSS can't take it off", () => {
            expect(html('<p><u>a<span style="text-decoration: none">b</span></u></p>')).toBe(
                paragraphs(paragraph(text("ab", { underline: { type: UnderlineType.SINGLE } }))),
            );
        });

        it("writes <q> with quotation marks, and single ones in another", () => {
            expect(html("<p><q>a <q>b</q> c</q></p>")).toBe(paragraphs(paragraph(text("“a ‘b’ c”"))));
        });

        it("writes <ruby> with its text in brackets", () => {
            expect(html("<p><ruby>漢<rt>kan</rt></ruby> and <ruby>字<rp>(</rp><rt>ji</rt><rp>)</rp></ruby></p>")).toBe(
                paragraphs(paragraph(text("漢(kan) and 字(ji)"))),
            );
        });

        it("writes the text of <abbr>, <bdi>, <span> and other inline elements as it is", () => {
            expect(html("<p><abbr title='HyperText'>HTML</abbr> <bdi>x</bdi> <span>y</span> <data value='1'>z</data></p>")).toBe(
                paragraphs(paragraph(text("HTML x y z"))),
            );
        });

        it("leaves out <script>, <style>, <template> and <noscript>, and comments", () => {
            expect(html("<p>a<script>alert(1)</script><style>p{}</style><template>t</template><noscript>n</noscript><!-- c -->b</p>")).toBe(
                paragraphs(paragraph(text("ab"))),
            );
        });

        it("leaves out the content of <head>, such as its <title>", () => {
            expect(html("<html><head><title>Title</title></head><body><p>a</p></body></html>")).toBe(paragraphs(paragraph(text("a"))));
        });

        it("leaves out elements with the hidden attribute, and those that CSS hides", () => {
            expect(html('<p>a<span hidden>b</span><span style="display:none">c</span><span style="visibility: hidden">d</span>e</p>')).toBe(
                paragraphs(paragraph(text("ae"))),
            );
        });

        it("shows what is in a hidden element that makes itself visible again", () => {
            expect(html('<p><span style="visibility: hidden">a<span style="visibility: visible">b</span></span></p>')).toBe(
                paragraphs(paragraph(text("b"))),
            );
        });
    });

    describe("CSS of text", () => {
        it("writes color in any of CSS's forms", () => {
            for (const color of ["#c00", "#cc0000", "rgb(204, 0, 0)", "rgb(204 0 0)", "rgba(204,0,0,1)", "hsl(0, 100%, 40%)"]) {
                expect(html(`<p><span style="color: ${color}">x</span></p>`)).toBe(paragraphs(paragraph(text("x", { color: "CC0000" }))));
            }
        });

        it("blends a partly transparent colour over white, as Word's text has no transparency", () => {
            expect(html('<p><span style="color: rgba(0, 0, 0, 0.5)">x</span></p>')).toBe(
                paragraphs(paragraph(text("x", { color: "808080" }))),
            );
        });

        it("writes a named colour", () => {
            expect(html('<p><span style="color: rebeccapurple">x</span></p>')).toBe(paragraphs(paragraph(text("x", { color: "663399" }))));
        });

        it("passes over a value it can't read for the next one, as a browser does", () => {
            expect(html('<p><span style="color: red; color: nonsense">x</span></p>')).toBe(
                paragraphs(paragraph(text("x", { color: "FF0000" }))),
            );
        });

        it("writes font-size in points, pixels, ems, rems, percentages and keywords", () => {
            const sizes: readonly (readonly [string, number])[] = [
                ["12pt", 24],
                ["16px", 24],
                ["10.5pt", 21],
                ["2em", 48],
                ["1.5rem", 36],
                ["150%", 36],
                ["x-large", 36],
                ["xx-small", 14],
                ["larger", 29],
                ["smaller", 20],
                ["calc(10pt + 2pt)", 24],
            ];
            for (const [size, halfPoints] of sizes) {
                expect(html(`<p><span style="font-size: ${size}">x</span></p>`), size).toBe(
                    paragraphs(paragraph(text("x", { size: halfPoints }))),
                );
            }
        });

        it("works out ems from the font size of the element they are in", () => {
            expect(html('<div style="font-size: 20pt"><p><span style="font-size: 0.5em">x</span>y</p></div>')).toBe(
                paragraphs(paragraph(text("x", { size: 20 }), text("y", { size: 40 }))),
            );
        });

        it("works out rems from the root's font size", () => {
            expect(html('<html style="font-size: 10pt"><body><p><span style="font-size: 2rem">x</span></p></body></html>')).toBe(
                paragraphs(paragraph(text("x", { size: 40 }))),
            );
        });

        it("writes the font size an inner element gives rather than an outer one's", () => {
            expect(html('<div style="font-size: 20px"><span style="font-size: 10px">x</span></div>')).toBe(
                paragraphs(paragraph(text("x", { size: 15 }))),
            );
        });

        it.each([
            ["bold", true],
            ["700", true],
            ["600", true],
            ["bolder", true],
            ["900", true],
            ["500", undefined],
            ["normal", undefined],
            ["lighter", undefined],
        ] as const)("makes text bold or not with font-weight: %s", (weight, bold) => {
            expect(html(`<p><span style="font-weight: ${weight}">x</span></p>`)).toBe(
                paragraphs(paragraph(text("x", bold ? { bold } : {}))),
            );
        });

        it("takes bold off text in a bold element with font-weight: normal, as Google Docs writes around everything", () => {
            expect(html('<p><b>a<span style="font-weight: normal">b</span></b></p>')).toBe(
                paragraphs(paragraph(text("a", { bold: true }), text("b", { bold: false }))),
            );
        });

        it("doesn't make Google Docs' <b style=\"font-weight:normal\"> bold", () => {
            expect(html('<b style="font-weight:normal;" id="docs-internal-guid-1"><p><span>x</span></p></b>')).toBe(
                paragraphs(paragraph(text("x"))),
            );
        });

        it("writes font-style, and takes italics off with font-style: normal", () => {
            expect(
                html(
                    '<p><span style="font-style: italic">a</span><em style="font-style: normal">b</em><i>c<span style="font-style:oblique">d</span></i></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { italics: true }), text("b"), text("cd", { italics: true }))));
        });

        it("writes the first font of font-family, without its quotes", () => {
            expect(
                html(
                    `<p><span style="font-family: 'Times New Roman', serif">a</span><span style='font-family: "Segoe UI", Arial'>b</span></p>`,
                ),
            ).toBe(paragraphs(paragraph(text("a", { font: "Times New Roman" }), text("b", { font: "Segoe UI" }))));
        });

        it("writes a font for a generic family, and passes over a system's own family", () => {
            expect(
                html(
                    '<p><span style="font-family: system-ui, -apple-system, sans-serif">a</span><span style="font-family: monospace">b</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { font: "Arial" }), text("b", { font: "Courier New" }))));
        });

        it("reads &quot; in a style attribute's font-family", () => {
            expect(html('<p><span style="font-family:&quot;Calibri&quot;,sans-serif">a</span></p>')).toBe(
                paragraphs(paragraph(text("a", { font: "Calibri" }))),
            );
        });

        it("writes text-decoration's line, style and colour", () => {
            expect(
                html(
                    '<p><span style="text-decoration: underline wavy red">a</span><span style="text-decoration: underline double">b</span></p>',
                ),
            ).toBe(
                paragraphs(
                    paragraph(
                        text("a", { underline: { type: UnderlineType.WAVE, color: "FF0000" } }),
                        text("b", { underline: { type: UnderlineType.DOUBLE } }),
                    ),
                ),
            );
        });

        it("writes the longhands of text-decoration, and a double line through as a double strike", () => {
            expect(
                html(
                    '<p><span style="text-decoration-line: underline; text-decoration-style: dotted">a</span><span style="text-decoration: line-through double">b</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { underline: { type: UnderlineType.DOTTED } }), text("b", { doubleStrike: true }))));
        });

        it("writes text-transform: uppercase as Word's all caps, and lowercase and capitalize as the text", () => {
            expect(
                html(
                    '<p><span style="text-transform: uppercase">up</span> <span style="text-transform: lowercase">DOWN</span> <span style="text-transform: capitalize">each word-here</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("up", { allCaps: true }), text(" down Each Word-Here"))));
        });

        it("doesn't capitalize the rest of a word that continues from the element before", () => {
            expect(html('<p>ab<span style="text-transform: capitalize">cd ef</span></p>')).toBe(paragraphs(paragraph(text("abcd Ef"))));
        });

        it("writes small caps from font-variant", () => {
            expect(
                html('<p><span style="font-variant: small-caps">a</span><span style="font-variant-caps: all-small-caps">b</span></p>'),
            ).toBe(paragraphs(paragraph(text("ab", { smallCaps: true }))));
        });

        it("writes letter-spacing in twips", () => {
            expect(html('<p><span style="letter-spacing: 2pt">a</span><span style="letter-spacing: -1px">b</span></p>')).toBe(
                paragraphs(paragraph(text("a", { characterSpacing: 40 }), text("b", { characterSpacing: -15 }))),
            );
        });

        it("writes vertical-align: super and sub as superscript and subscript, and a length as a raise", () => {
            expect(
                html(
                    '<p><span style="vertical-align: super">a</span><span style="vertical-align: sub">b</span><span style="vertical-align: 3pt">c</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { superScript: true }), text("b", { subScript: true }), text("c", { position: "3pt" }))));
        });

        it("keeps superscript for the text of elements in a superscript", () => {
            expect(html("<p><sup><b>a</b></sup></p>")).toBe(paragraphs(paragraph(text("a", { bold: true, superScript: true }))));
        });

        it("writes a span's background as shading, and one of Word's highlighter colours as a highlight", () => {
            expect(
                html(
                    '<p><span style="background-color: #fdfd77">a</span><span style="background: yellow">b</span><span style="background: url(x.png) #00ff00">c</span></p>',
                ),
            ).toBe(
                paragraphs(
                    paragraph(
                        text("a", { shading: { type: ShadingType.CLEAR, fill: "FDFD77", color: "auto" } }),
                        text("b", { highlight: HighlightColor.YELLOW }),
                        text("c", { highlight: HighlightColor.GREEN }),
                    ),
                ),
            );
        });

        it("keeps a span's background behind the text of the elements in it", () => {
            expect(html('<p><span style="background-color: #eeeeee">a<b>b</b></span></p>')).toBe(
                paragraphs(
                    paragraph(
                        text("a", { shading: { type: ShadingType.CLEAR, fill: "EEEEEE", color: "auto" } }),
                        text("b", { bold: true, shading: { type: ShadingType.CLEAR, fill: "EEEEEE", color: "auto" } }),
                    ),
                ),
            );
        });

        it("leaves out a transparent background", () => {
            expect(html('<p><span style="background-color: transparent">a</span></p>')).toBe(paragraphs(paragraph(text("a"))));
        });

        it("writes the language of lang", () => {
            expect(html('<p lang="fr">bonjour <span lang="de-DE">hallo</span></p>')).toBe(
                paragraphs(paragraph(text("bonjour ", { language: { value: "fr" } }), text("hallo", { language: { value: "de-DE" } }))),
            );
        });

        it("writes custom properties' values with var(), and their fallbacks", () => {
            expect(
                html(
                    '<div style="--accent: #0000ff"><p><span style="color: var(--accent)">a</span><span style="color: var(--missing, #00ff00)">b</span></p></div>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { color: "0000FF" }), text("b", { color: "00FF00" }))));
        });

        it("leaves out a var() of a property that isn't there and has no fallback", () => {
            expect(html('<p><span style="color: red; font-size: var(--size)">a</span></p>')).toBe(
                paragraphs(paragraph(text("a", { color: "FF0000" }))),
            );
        });

        it("leaves out custom properties that refer to each other, and keeps the rest", () => {
            expect(
                html(
                    '<p style="--a: var(--b); --b: var(--a); --c: blue"><span style="color: var(--a, red)">a</span><span style="color: var(--c)">b</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { color: "FF0000" }), text("b", { color: "0000FF" }))));
        });

        it("gives a shorthand's CSS-wide keyword to each property it sets, as a reset style sheet's font: inherit", () => {
            expect(html('<style>b { font: inherit }</style><p style="font-size: 12px"><b style="background: inherit">a</b></p>')).toBe(
                paragraphs(paragraph(text("a", { size: 18 }))),
            );
        });

        it("writes !important's value over a later one", () => {
            expect(html('<style>span { color: blue !important }</style><p><span style="color: red">a</span></p>')).toBe(
                paragraphs(paragraph(text("a", { color: "0000FF" }))),
            );
        });

        it("writes inherit, initial and unset as CSS does", () => {
            expect(
                html(
                    '<p style="color: red"><span style="color: blue"><span style="color: inherit">a</span></span><span style="color: initial">b</span><span style="color: unset">c</span></p>',
                ),
            ).toBe(paragraphs(paragraph(text("a", { color: "0000FF" }), text("b"), text("c", { color: "FF0000" }))));
        });

        it("writes currentColor as the text's colour", () => {
            expect(html('<p style="color: #123456"><span style="text-decoration: underline currentcolor">a</span></p>')).toBe(
                paragraphs(paragraph(text("a", { color: "123456", underline: { type: UnderlineType.SINGLE, color: "123456" } }))),
            );
        });

        it("writes the text of a run in a right-to-left element as right to left", () => {
            expect(html('<p dir="rtl">שלום</p>')).toBe(
                paragraphs(new Paragraph({ bidirectional: true, children: [text("שלום", { rightToLeft: true })] })),
            );
        });
    });

    describe("legacy HTML", () => {
        it("writes <font color size face>", () => {
            expect(
                html('<p><font color="#ff0000" size="5" face="Georgia">a</font><font size="+1">b</font><font size="-5">c</font></p>'),
            ).toBe(
                paragraphs(
                    paragraph(text("a", { color: "FF0000", size: 36, font: "Georgia" }), text("b", { size: 27 }), text("c", { size: 15 })),
                ),
            );
        });

        it("writes <center> centred", () => {
            expect(html("<center>a</center>")).toBe(paragraphs(new Paragraph({ alignment: "center", children: [text("a")] })));
        });
    });
});
