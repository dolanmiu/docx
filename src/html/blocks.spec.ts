import { describe, expect, it } from "vitest";

import { AlignmentType, BorderStyle, ColumnBreak, ExternalHyperlink, LineRuleType, Paragraph, ShadingType, TextRun } from "docx";
import { formatted } from "tests/html";

import { htmlToContent } from "./html-to-content";
import type { HtmlOptions } from "./options";

const html = (source: string, options?: HtmlOptions): string => formatted(htmlToContent(source, options));
const paragraphs = (...children: readonly Paragraph[]): string => formatted(children);
const text = (value: string, options: Omit<ConstructorParameters<typeof TextRun>[0] & object, "children" | "text"> = {}): TextRun =>
    new TextRun({ ...options, children: [value] });
const paragraph = (
    value: string,
    options: Omit<ConstructorParameters<typeof Paragraph>[0] & object, "children" | "text"> = {},
): Paragraph => new Paragraph({ ...options, children: [text(value)] });

describe("htmlToContent: blocks", () => {
    describe("paragraphs and headings", () => {
        it("writes each <p> as a paragraph", () => {
            expect(html("<p>a</p><p>b</p>")).toBe(paragraphs(paragraph("a"), paragraph("b")));
        });

        it.each([1, 2, 3, 4, 5, 6])("writes <h%i> in the Heading %i style", (level) => {
            expect(html(`<h${level}>a</h${level}>`)).toBe(paragraphs(paragraph("a", { heading: `Heading${level}` as "Heading1" })));
        });

        it("writes an element with role heading and aria-level in its Heading style", () => {
            expect(html('<div role="heading" aria-level="3">a</div><div role="heading">b</div>')).toBe(
                paragraphs(paragraph("a", { heading: "Heading3" }), paragraph("b", { heading: "Heading2" })),
            );
        });

        it("doesn't write heading formatting into the paragraph after a heading", () => {
            expect(html("<h1>a</h1>b")).toBe(paragraphs(paragraph("a", { heading: "Heading1" }), paragraph("b")));
        });

        it("writes text next to blocks in an element as paragraphs of its own", () => {
            expect(html("<div>a<p>b</p>c</div>")).toBe(paragraphs(paragraph("a"), paragraph("b"), paragraph("c")));
        });

        it("writes text that isn't in an element as a paragraph", () => {
            expect(html("just text")).toBe(paragraphs(paragraph("just text")));
        });

        it("keeps an inline element's formatting for the blocks in it", () => {
            expect(html("<b>a<p>b</p>c</b>")).toBe(
                paragraphs(
                    new Paragraph({ children: [text("a", { bold: true })] }),
                    new Paragraph({ children: [text("b", { bold: true })] }),
                    new Paragraph({ children: [text("c", { bold: true })] }),
                ),
            );
        });

        it("keeps a link for the blocks in it", () => {
            expect(html('<a href="https://example.com"><p>a</p></a>')).toBe(
                paragraphs(
                    new Paragraph({
                        children: [new ExternalHyperlink({ link: "https://example.com", children: [text("a", { style: "Hyperlink" })] })],
                    }),
                ),
            );
        });

        it("writes an element whose CSS makes it a block as a block, and a block whose CSS makes it inline as inline", () => {
            expect(html('<div>a<span style="display: block">b</span><p style="display: inline">c</p>d</div>')).toBe(
                paragraphs(paragraph("a"), paragraph("b"), paragraph("cd")),
            );
        });

        it("writes flex and grid containers as blocks", () => {
            expect(html('<span style="display: flex">a</span><span style="display: grid">b</span>')).toBe(
                paragraphs(paragraph("a"), paragraph("b")),
            );
        });

        it("writes the content of an element with display: contents in the element it is in", () => {
            expect(html('<p>a<span style="display: contents; font-weight: bold">b</span></p>')).toBe(
                paragraphs(new Paragraph({ children: [text("a"), text("b", { bold: true })] })),
            );
        });

        it("writes nothing for an empty <div>, and nothing for HTML with no content", () => {
            expect(html("<div></div><div> </div>")).toBe("");
            expect(htmlToContent("")).toEqual([]);
            expect(htmlToContent("   \n ")).toEqual([]);
        });

        it("reads a whole document, as well as some of its body", () => {
            expect(html("<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'></head><body><p>a</p></body></html>")).toBe(
                paragraphs(new Paragraph({ children: [text("a", { language: { value: "en" } })] })),
            );
        });

        it("writes nothing for a body that is hidden", () => {
            expect(htmlToContent('<body style="display: none"><p>a</p></body>')).toEqual([]);
        });

        it("writes the body's CSS into its text", () => {
            expect(html('<body style="font-family: Arial; color: #333"><p>a</p></body>')).toBe(
                paragraphs(new Paragraph({ children: [text("a", { color: "333333", font: "Arial" })] })),
            );
        });

        it("writes <address> in italics, and <dt> and <dd> with <dd> indented", () => {
            expect(html("<address>a</address><dl><dt>b</dt><dd>c</dd></dl>")).toBe(
                paragraphs(
                    new Paragraph({ children: [text("a", { italics: true })] }),
                    paragraph("b"),
                    paragraph("c", { indent: { left: 720 } }),
                ),
            );
        });

        it("writes <details> with its <summary>, and <figure> with its <figcaption>", () => {
            expect(html("<details><summary>a</summary>b</details><figure>c<figcaption>d</figcaption></figure>")).toBe(
                paragraphs(paragraph("a"), paragraph("b"), paragraph("c"), paragraph("d")),
            );
        });

        it("writes a <select>'s selected option, or its first, and an input's value", () => {
            expect(
                html(
                    '<p><select><option>a</option><option selected>b</option></select> <select><optgroup><option>c</option></optgroup></select> <select></select><input value="d"> <input type="hidden" value="e"><input></p>',
                ),
            ).toBe(paragraphs(paragraph("b c d")));
        });
    });

    describe("paragraph formatting", () => {
        it.each([
            ["left", AlignmentType.LEFT],
            ["right", AlignmentType.RIGHT],
            ["center", AlignmentType.CENTER],
            ["justify", AlignmentType.JUSTIFIED],
            ["start", AlignmentType.START],
            ["end", AlignmentType.END],
            ["-webkit-center", AlignmentType.CENTER],
        ] as const)("writes text-align: %s", (align, alignment) => {
            expect(html(`<p style="text-align: ${align}">a</p>`)).toBe(paragraphs(paragraph("a", { alignment })));
        });

        it("writes the align attribute, and a parent's text-align, which paragraphs inherit", () => {
            expect(html('<p align="right">a</p><div style="text-align: center"><p>b</p></div>')).toBe(
                paragraphs(paragraph("a", { alignment: AlignmentType.RIGHT }), paragraph("b", { alignment: AlignmentType.CENTER })),
            );
        });

        it("writes margins and padding on the left and right as indents", () => {
            expect(html('<p style="margin-left: 1in; padding-left: 36pt; margin-right: 0.5in">a</p>')).toBe(
                paragraphs(paragraph("a", { indent: { left: 2160, right: 720 } })),
            );
        });

        it("adds the indents of the blocks a paragraph is in", () => {
            expect(html('<div style="margin-left: 1in"><blockquote><p>a</p></blockquote></div>')).toBe(
                paragraphs(paragraph("a", { indent: { left: 2160, right: 720 } })),
            );
        });

        it("indents TinyMCE's paragraphs, which it indents with padding-left", () => {
            expect(html('<p style="padding-left: 40px;">a</p>')).toBe(paragraphs(paragraph("a", { indent: { left: 600 } })));
        });

        it("writes text-indent as the first line's indent, and a negative one as a hanging indent", () => {
            expect(html('<p style="text-indent: 2em">a</p><p style="text-indent: -18pt; margin-left: 36pt">b</p>')).toBe(
                paragraphs(paragraph("a", { indent: { firstLine: 480 } }), paragraph("b", { indent: { left: 720, hanging: 360 } })),
            );
        });

        it("writes margins and padding above and below as space before and after", () => {
            expect(html('<p style="margin: 12pt 0 6pt">a</p><p style="padding-top: 10px">b</p>')).toBe(
                paragraphs(paragraph("a", { spacing: { before: 240, after: 120 } }), paragraph("b", { spacing: { before: 150 } })),
            );
        });

        it("leaves out negative space above and below", () => {
            expect(html('<p style="margin-top: -10px">a</p>')).toBe(paragraphs(paragraph("a")));
        });

        it("writes a block's margins above its first paragraph and below its last", () => {
            expect(html('<div style="margin: 20pt 0"><p>a</p><p>b</p></div>')).toBe(
                paragraphs(paragraph("a", { spacing: { before: 400 } }), paragraph("b", { spacing: { after: 400 } })),
            );
        });

        it("writes a multiple of line-height as Word's line spacing, of a browser's normal line height of 1.2", () => {
            expect(html('<p style="line-height: 1.5">a</p><p style="line-height: 1.38">b</p><p style="line-height: 1.2">c</p>')).toBe(
                paragraphs(
                    paragraph("a", { spacing: { line: 300, lineRule: LineRuleType.AUTO } }),
                    paragraph("b", { spacing: { line: 276, lineRule: LineRuleType.AUTO } }),
                    paragraph("c", { spacing: { line: 240, lineRule: LineRuleType.AUTO } }),
                ),
            );
        });

        it("writes a length of line-height as at least that line height", () => {
            expect(html('<p style="line-height: 24px">a</p><p style="line-height: normal">c</p>')).toBe(
                paragraphs(paragraph("a", { spacing: { line: 360, lineRule: LineRuleType.AT_LEAST } }), paragraph("c")),
            );
        });

        it("writes a percentage of line-height as Word's lines, as Word writes its line spacing in HTML", () => {
            expect(html('<p style="line-height: 107%">a</p><p style="line-height: 150%">b</p>')).toBe(
                paragraphs(
                    paragraph("a", { spacing: { line: 257, lineRule: LineRuleType.AUTO } }),
                    paragraph("b", { spacing: { line: 360, lineRule: LineRuleType.AUTO } }),
                ),
            );
        });

        it("writes a block's background as the shading of its paragraphs", () => {
            const shading = { type: ShadingType.CLEAR, fill: "EEEEEE", color: "auto" } as const;
            expect(html('<div style="background-color: #eee"><p>a</p><p>b</p></div>')).toBe(
                paragraphs(paragraph("a", { shading }), paragraph("b", { shading })),
            );
        });

        it("writes a block's borders on its paragraphs, which Word draws around them all, with its padding inside them", () => {
            const side = { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 6 };
            expect(html('<div style="border: 1px solid #ccc; padding: 6pt"><p>a</p><p>b</p></div>')).toBe(
                paragraphs(
                    paragraph("a", { border: { top: side, right: side, bottom: side, left: side } }),
                    paragraph("b", { border: { top: side, right: side, bottom: side, left: side } }),
                ),
            );
        });

        it("writes a blockquote's left border, as many editors' style sheets give it", () => {
            expect(
                html('<blockquote style="border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; margin-right: 0">a</blockquote>'),
            ).toBe(paragraphs(paragraph("a", { border: { left: { style: BorderStyle.SINGLE, size: 24, color: "DDDDDD", space: 12 } } })));
        });

        it.each([
            ["dotted", BorderStyle.DOTTED],
            ["dashed", BorderStyle.DASHED],
            ["double", BorderStyle.DOUBLE],
            ["groove", BorderStyle.THREE_D_ENGRAVE],
            ["ridge", BorderStyle.THREE_D_EMBOSS],
            ["inset", BorderStyle.INSET],
            ["outset", BorderStyle.OUTSET],
        ] as const)("writes a %s border", (css, style) => {
            expect(html(`<p style="border-bottom: 3pt ${css} blue">a</p>`)).toBe(
                paragraphs(paragraph("a", { border: { bottom: { style, size: 24, color: "0000FF", space: 0 } } })),
            );
        });

        it("writes border widths of thin, medium and thick, and leaves out borders of none and of no width", () => {
            expect(
                html('<p style="border-top: thin solid; border-bottom: thick solid red; border-left: none; border-right: 0 solid">a</p>'),
            ).toBe(
                paragraphs(
                    paragraph("a", {
                        border: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 0 },
                            bottom: { style: BorderStyle.SINGLE, size: 30, color: "FF0000", space: 0 },
                        },
                    }),
                ),
            );
        });

        it("writes a border in the text's colour when it has none", () => {
            expect(html('<p style="color: #00f; border-top: 1px solid">a</p>')).toBe(
                paragraphs(
                    new Paragraph({
                        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "0000FF", space: 0 } },
                        children: [text("a", { color: "0000FF" })],
                    }),
                ),
            );
        });

        it("writes a right-to-left block as a bidirectional paragraph", () => {
            expect(html('<p dir="RTL">a</p><div style="direction: rtl"><p>b</p></div>')).toBe(
                paragraphs(
                    new Paragraph({ bidirectional: true, children: [text("a", { rightToLeft: true })] }),
                    new Paragraph({ bidirectional: true, children: [text("b", { rightToLeft: true })] }),
                ),
            );
        });

        it("keeps a block's paragraphs together with break-inside: avoid, leaving its tables as they are", () => {
            expect(html('<div style="break-inside: avoid"><table><tr><td>a</td></tr></table><p>b</p></div>')).toMatch(
                /<\/w:tbl><w:p><w:pPr><w:keepLines\/><\/w:pPr><w:r><w:t xml:space="preserve">b<\/w:t>/,
            );
        });

        it("keeps a block's paragraphs together with break-inside: avoid", () => {
            expect(html('<div style="break-inside: avoid"><p>a</p><p>b</p></div><p style="page-break-inside: avoid">c</p>')).toBe(
                paragraphs(
                    paragraph("a", { keepLines: true, keepNext: true }),
                    paragraph("b", { keepLines: true }),
                    paragraph("c", { keepLines: true }),
                ),
            );
        });
    });

    describe("blockquotes and rules", () => {
        it("indents a blockquote on both sides, and one in another more", () => {
            expect(html("<blockquote>a<blockquote>b</blockquote></blockquote>")).toBe(
                paragraphs(paragraph("a", { indent: { left: 720, right: 720 } }), paragraph("b", { indent: { left: 1440, right: 1440 } })),
            );
        });

        it("writes <hr> as Word's line across the page", () => {
            expect(html("<p>a</p><hr><p>b</p>")).toBe(paragraphs(paragraph("a"), new Paragraph({ thematicBreak: true }), paragraph("b")));
        });

        it("writes an <hr> with a border, or a background, as a line of its colour and thickness", () => {
            expect(
                html('<hr style="border: 0; border-top: 2px solid #f00"><hr style="border: none; height: 3pt; background-color: #00f">'),
            ).toBe(
                paragraphs(
                    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "FF0000", space: 0 } } }),
                    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: "0000FF", space: 0 } } }),
                ),
            );
        });

        it("writes an <hr> with a background and no height a line of three-quarters of a point", () => {
            expect(html('<hr style="border: none; background: #0f0">')).toBe(
                paragraphs(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "00FF00", space: 0 } } })),
            );
        });
    });

    describe("page breaks", () => {
        it("puts a page break before a block with page-break-before or break-before", () => {
            expect(html('<p>a</p><p style="page-break-before: always">b</p><p style="break-before: page">c</p>')).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true }), paragraph("c", { pageBreakBefore: true })),
            );
        });

        it("puts a page break after a block with page-break-after in the paragraph after it", () => {
            expect(html('<p style="page-break-after: always">a</p><p>b</p>')).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })),
            );
        });

        it("leaves out a page break after the last block, which would start an empty page", () => {
            expect(html('<p>a</p><p style="page-break-after: always">b</p>')).toBe(paragraphs(paragraph("a"), paragraph("b")));
        });

        it("writes a break in a <div> in a <div>", () => {
            expect(html('<p>a</p><div><div><div style="page-break-before: always"><p>b</p></div></div></div>')).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })),
            );
        });

        it("writes TinyMCE's <!-- pagebreak --> as a page break", () => {
            expect(html("<p>a</p><!-- pagebreak --><p>b</p>")).toBe(paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })));
        });

        it("writes CKEditor's page break, which has nothing to show", () => {
            expect(
                html(
                    '<p>a</p><div class="page-break" style="page-break-after:always;"><span style="display:none;">&nbsp;</span></div><p>b</p>',
                ),
            ).toBe(paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })));
        });

        it("writes Word's page break, a <br> that breaks the page", () => {
            expect(html("<p>a</p><p><br clear=all style='page-break-before:always'></p><p>b</p>")).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })),
            );
        });

        it("writes one page break for breaks after a block and before the next", () => {
            expect(html('<p style="break-after: page">a</p><p style="break-before: page">b</p>')).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })),
            );
        });

        it("writes a column break at the start of the paragraph after it", () => {
            expect(html('<p style="break-after: column">a</p><p>b</p>')).toBe(
                paragraphs(paragraph("a"), new Paragraph({ children: [new ColumnBreak(), text("b")] })),
            );
        });

        it("writes a page break rather than a column break where both are", () => {
            expect(html('<p style="break-after: page">a</p><p style="break-before: column">b</p>')).toBe(
                paragraphs(paragraph("a"), paragraph("b", { pageBreakBefore: true })),
            );
        });

        it("leaves out break-before: avoid and auto", () => {
            expect(html('<p style="break-before: avoid">a</p><p style="break-after: auto">b</p>')).toBe(
                paragraphs(paragraph("a"), paragraph("b")),
            );
        });
    });

    describe("style sheets", () => {
        it("uses the HTML's <style> elements, in its head and its body", () => {
            expect(
                html(
                    "<html><head><style>p { color: red }</style></head><body><style>.b { font-weight: bold }</style><p class='b'>a</p></body></html>",
                ),
            ).toBe(paragraphs(new Paragraph({ children: [text("a", { bold: true, color: "FF0000" })] })));
        });

        it("uses the stylesheet option after the HTML's own", () => {
            expect(html("<style>p { color: red }</style><p>a</p>", { stylesheet: "p { color: blue }" })).toBe(
                paragraphs(new Paragraph({ children: [text("a", { color: "0000FF" })] })),
            );
        });

        it("gives the most specific selector's value, and the last of the most specific", () => {
            const css = "#x { color: #111 } p.a { color: #222 } .a { color: #333 } p { color: #444 } p { color: #555 }";
            expect(html(`<style>${css}</style><p id="x" class="a">a</p><p class="a">b</p><p>c</p>`)).toBe(
                paragraphs(
                    new Paragraph({ children: [text("a", { color: "111111" })] }),
                    new Paragraph({ children: [text("b", { color: "222222" })] }),
                    new Paragraph({ children: [text("c", { color: "555555" })] }),
                ),
            );
        });

        it("gives the style attribute's value over a style sheet's, and a style sheet's over a presentational attribute's", () => {
            expect(html('<style>p { text-align: left; color: red }</style><p align="right" style="color: blue">a</p>')).toBe(
                paragraphs(new Paragraph({ alignment: AlignmentType.LEFT, children: [text("a", { color: "0000FF" })] })),
            );
        });

        it("matches combinators and pseudo-classes", () => {
            const css =
                "div > p { color: red } p + p { font-weight: bold } li:first-child { font-style: italic } p:not(.x) span { color: green }";
            expect(html(`<style>${css}</style><div><p>a</p><p>b <span>c</span></p></div>`)).toBe(
                paragraphs(
                    new Paragraph({ children: [text("a", { color: "FF0000" })] }),
                    new Paragraph({ children: [text("b ", { bold: true, color: "FF0000" }), text("c", { bold: true, color: "008000" })] }),
                ),
            );
        });

        it("leaves out rules of selectors it can't match, and keeps those of other selectors of the rule", () => {
            expect(html("<style>p::before, p:hover, p:unknown(x), p, p > > a { color: red }</style><p>a</p>")).toBe(
                paragraphs(new Paragraph({ children: [text("a", { color: "FF0000" })] })),
            );
        });

        it("uses @media print and @media all, and @supports and @layer, but not @media screen", () => {
            const css =
                "@media screen { p { color: red } } @media print { p { font-weight: bold } } @media all { p { font-style: italic } } @supports (display: grid) { p { text-align: center } } @layer base { p { font-size: 10pt } } @media (max-width: 600px) { p { color: blue } }";
            expect(html(`<style>${css}</style><p>a</p>`)).toBe(
                paragraphs(
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [text("a", { bold: true, italics: true, size: 20 })] }),
                ),
            );
        });

        it("uses a <style> for print, and not one for the screen", () => {
            expect(html('<style media="screen">p { color: red }</style><style media="print">p { color: blue }</style><p>a</p>')).toBe(
                paragraphs(new Paragraph({ children: [text("a", { color: "0000FF" })] })),
            );
        });

        it("leaves out @import, @font-face and @page, and comments", () => {
            expect(
                html(
                    "<style>@import url(x.css); @font-face { font-family: X } /* p { color: red } */ @page { margin: 1in } p { color: green }</style><p>a</p>",
                ),
            ).toBe(paragraphs(new Paragraph({ children: [text("a", { color: "008000" })] })));
        });

        it("reads a style sheet in HTML comments, as old HTML wraps them", () => {
            expect(html("<style><!-- p { color: red } --></style><p>a</p>")).toBe(
                paragraphs(new Paragraph({ children: [text("a", { color: "FF0000" })] })),
            );
        });

        it("reads the style of Word's HTML: its classes, and its font shorthand", () => {
            const css =
                'p.MsoNormal { margin: 0in; font-size: 11.0pt; font-family: "Calibri", sans-serif; } span.Strong { font: italic bold 12pt/18pt Georgia, serif }';
            expect(html(`<style>${css}</style><p class=MsoNormal>a<span class=Strong>b</span><o:p></o:p></p>`)).toBe(
                paragraphs(
                    new Paragraph({
                        children: [
                            text("a", { size: 22, font: "Calibri" }),
                            text("b", { bold: true, italics: true, size: 24, font: "Georgia" }),
                        ],
                    }),
                ),
            );
        });
    });

    describe("the styleMap option", () => {
        it("gives paragraphs the Word style of their selector, rather than their heading's", () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
            expect(html('<p class="lead">a</p><h1>b</h1><p>c</p>', { styleMap: { "p.lead": "Lead", h1: "Title" } })).toBe(
                paragraphs(paragraph("a", { style: "Lead" }), paragraph("b", { style: "Title" }), paragraph("c")),
            );
        });

        it("gives inline elements the Word character style of their selector", () => {
            expect(
                html('<p>a <span class="kbd">b</span> <a href="https://example.com" class="x">c</a></p>', {
                    // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
                    styleMap: { ".kbd": "Keyboard", "a.x": "Link" },
                }),
            ).toBe(
                paragraphs(
                    new Paragraph({
                        children: [
                            text("a "),
                            text("b", { style: "Keyboard" }),
                            text(" "),
                            new ExternalHyperlink({ link: "https://example.com", children: [text("c", { style: "Link" })] }),
                        ],
                    }),
                ),
            );
        });

        it("gives the style of the most specific selector", () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- selectors and addresses, as the options are given
            expect(html('<p class="a" id="b">a</p>', { styleMap: { "#b": "Second", ".a": "First", p: "Third" } })).toBe(
                paragraphs(paragraph("a", { style: "Second" })),
            );
        });

        it("escapes quotes and backslashes in a style's id", () => {
            expect(html("<p>a</p>", { styleMap: { p: 'My "Style" \\ 2' } })).toBe(paragraphs(paragraph("a", { style: 'My "Style" \\ 2' })));
        });
    });

    describe("editors' classes", () => {
        it("writes Quill's alignment, sizes, fonts and indents", () => {
            expect(
                html(
                    '<p class="ql-align-center">a</p><p class="ql-align-right">b</p><p class="ql-align-justify ql-indent-2">c</p><p><span class="ql-size-large">d</span><span class="ql-font-serif">e</span><span class="ql-font-monospace">f</span><span class="ql-size-small">g</span><span class="ql-size-huge">h</span></p>',
                ),
            ).toBe(
                paragraphs(
                    paragraph("a", { alignment: AlignmentType.CENTER }),
                    paragraph("b", { alignment: AlignmentType.RIGHT }),
                    paragraph("c", { alignment: AlignmentType.JUSTIFIED, indent: { left: 1440 } }),
                    new Paragraph({
                        children: [
                            text("d", { size: 36 }),
                            text("e", { font: "Georgia" }),
                            text("f", { font: "Monaco" }),
                            text("g", { size: 18 }),
                            text("h", { size: 60 }),
                        ],
                    }),
                ),
            );
        });

        it("writes CKEditor 5's markers, pens and text sizes", () => {
            expect(
                html(
                    '<p><mark class="marker-yellow">a</mark><mark class="marker-green">b</mark><span class="pen-red">c</span><span class="text-big">d</span><span class="text-tiny">e</span></p>',
                ),
            ).toBe(
                paragraphs(
                    new Paragraph({
                        children: [
                            text("a", { shading: { type: ShadingType.CLEAR, fill: "FDFD77", color: "auto" } }),
                            text("b", { shading: { type: ShadingType.CLEAR, fill: "62F962", color: "auto" } }),
                            text("c", { color: "E71313" }),
                            text("d", { size: 34 }),
                            text("e", { size: 17 }),
                        ],
                    }),
                ),
            );
        });
    });
});
