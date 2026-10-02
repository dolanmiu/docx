import { describe, expect, it } from "vitest";

import { File } from "@file/file";
import {
    ExternalHyperlink,
    FootnoteReferenceRun,
    HeadingLevel,
    type IContext,
    type IStylesOptions,
    ImageRun,
    InternalHyperlink,
    LineRuleType,
    Paragraph,
    Tab,
    TextRun,
} from "docx";

import { WORD_DEFAULT_STYLES, getTextStyles } from "../text-layout";
import { readTextParagraphs } from "./shape-text-styles";

const contextOf = (file: File): IContext => ({ file, stack: [] }) as unknown as IContext;

const stylesOf = (styles: IStylesOptions & { readonly default?: object }): ReturnType<typeof getTextStyles> =>
    getTextStyles(contextOf(new File({ styles, sections: [] })));

const readOne = (paragraph: Paragraph, styles = WORD_DEFAULT_STYLES): ReturnType<typeof readTextParagraphs>[number] =>
    readTextParagraphs([paragraph], styles)[0];

describe("readTextParagraphs", () => {
    it("should read the text and font of each run", () => {
        const { spans } = readOne(
            new Paragraph({
                children: [
                    new TextRun("Plain"),
                    new TextRun({ text: "Big", font: "Arial", size: 24, bold: true }),
                    new TextRun({ text: "Not bold", font: { ascii: "Calibri" }, bold: false }),
                    new TextRun({ text: "Spaced", characterSpacing: 40, scale: 150 }),
                ],
            }),
        );
        expect(spans).to.deep.equal([
            { text: "Plain" },
            { text: "Big", font: "Arial", size: 12, bold: true },
            { text: "Not bold", font: "Calibri", bold: false },
            { text: "Spaced", characterSpacing: 2, scale: 150 },
        ]);
    });

    it("should read tabs and line breaks", () => {
        const { spans } = readOne(
            new Paragraph({ children: [new TextRun({ text: "a", break: 1 }), new TextRun({ children: [new Tab(), "b"] })] }),
        );
        expect(spans.map(({ text }) => text)).to.deep.equal(["\na", "\tb"]);
    });

    it("should read the text on both sides of a run in a run's children, in the outer run's formatting", () => {
        const { spans } = readOne(
            new Paragraph({
                children: [
                    new TextRun({ bold: true, children: ["Note", new FootnoteReferenceRun(1), " after"] }),
                    new TextRun({ size: 24, children: ["a", new TextRun({ text: "b", font: "Arial" }), "c"] }),
                ],
            }),
        );
        // The footnote reference has no text, so it is left out as it is on its own
        expect(spans).to.deep.equal([
            { text: "Note", bold: true },
            { text: " after", bold: true },
            { text: "a", size: 12 },
            { text: "b", font: "Arial" },
            { text: "c", size: 12 },
        ]);
    });

    it("should read the text of hyperlinks, and leave out runs without text", () => {
        const image = new ImageRun({ type: "png", data: Buffer.from(""), transformation: { width: 10, height: 10 } });
        const { spans } = readOne(
            new Paragraph({
                children: [
                    new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("web")] }),
                    new InternalHyperlink({ anchor: "top", children: [new TextRun("inside")] }),
                    image,
                ],
            }),
        );
        expect(spans.map(({ text }) => text)).to.deep.equal(["web", "inside"]);
    });

    it("should write capitals for all caps, smaller capitals for small caps, and leave out hidden text", () => {
        const { spans } = readOne(
            new Paragraph({
                children: [
                    new TextRun({ text: "caps", allCaps: true }),
                    new TextRun({ text: "Small caps", smallCaps: true, size: 20 }),
                    new TextRun({ text: "hidden", vanish: true }),
                    new TextRun({ text: "x", smallCaps: true }),
                ],
            }),
        );
        // The small letters are capitals in the line of the run's size
        expect(spans).to.deep.equal([
            { text: "CAPS" },
            { text: "S", size: 10 },
            { text: "MALL", size: 8, lineSize: 10 },
            { text: " ", size: 10 },
            { text: "CAPS", size: 8, lineSize: 10 },
            // Without a size, small capitals are 80% of 10pt
            { text: "X", size: 8, lineSize: 10 },
        ]);
    });

    it("should combine the document's defaults, the paragraph's styles, the run's styles and the run's own formatting", () => {
        const styles = stylesOf({
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 160 } } } },
            paragraphStyles: [
                { id: "Normal", name: "Normal", run: { size: 24 }, paragraph: { spacing: { line: 360 } } },
                { id: "Note", name: "Note", basedOn: "Normal", run: { bold: true }, paragraph: { indent: { left: 400 } } },
            ],
            characterStyles: [
                { id: "Code", name: "Code", run: { font: "Courier New" } },
                { id: "BigCode", name: "Big code", basedOn: "Code", run: { size: 32 } },
            ],
        });

        const normal = readOne(new Paragraph({ children: [new TextRun("Normal")] }), styles);
        expect(normal.style).to.equal("Normal");
        expect(normal.spans).to.deep.equal([{ text: "Normal", font: "Calibri", size: 12 }]);
        expect(normal.format).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 1.5 } });

        const note = readOne(
            new Paragraph({
                style: "Note",
                spacing: { after: 0 },
                children: [new TextRun("Note"), new TextRun({ text: "code", style: "BigCode", bold: false })],
            }),
            styles,
        );
        expect(note.style).to.equal("Note");
        expect(note.spans).to.deep.equal([
            { text: "Note", font: "Calibri", size: 12, bold: true },
            { text: "code", font: "Courier New", size: 16, bold: false },
        ]);
        expect(note.format).to.deep.equal({ spaceAfter: 0, lineSpacing: { rule: "multiple", multiple: 1.5 }, indentLeft: 20 });
        // The paragraph's mark has the paragraph's font
        expect(note.font).to.deep.equal({ font: "Calibri", size: 12, bold: true });
    });

    it("should read text in the fonts of the document's theme", () => {
        const styles = stylesOf({
            default: { document: { run: { font: { theme: "body" } } }, heading1: { run: { font: { theme: "headings" } } } },
        });
        const themed = getTextStyles(
            contextOf(
                new File({
                    theme: { fonts: { headings: "Arial", body: { latin: "Georgia", eastAsia: "Yu Mincho" } } },
                    styles: { default: { heading1: { run: { font: { theme: "headings" } } } } },
                    sections: [],
                }),
            ),
        );
        const { spans } = readOne(
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun("Heading"), new TextRun({ text: "Body", font: { theme: "body" } })],
            }),
            themed,
        );
        expect(spans).to.deep.equal([
            { text: "Heading", font: "Arial" },
            { text: "Body", font: "Georgia" },
        ]);
        expect(readOne(new Paragraph({ children: [new TextRun("Office")] }), styles).spans).to.deep.equal([
            { text: "Office", font: "Calibri" },
        ]);
    });

    it("should read a style without a type as a paragraph style", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:default="1" w:styleId="Body"><w:name w:val="Body"/><w:rPr><w:sz w:val="28"/></w:rPr></w:style>
    <w:style w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Body"/><w:rPr><w:b/></w:rPr></w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        expect(readOne(new Paragraph({ children: [new TextRun("Body")] }), styles).spans).to.deep.equal([{ text: "Body", size: 14 }]);
        expect(readOne(new Paragraph({ style: "Quote", children: [new TextRun("Quote")] }), styles).spans).to.deep.equal([
            { text: "Quote", size: 14, bold: true },
        ]);
    });

    it("should use headings' styles", () => {
        const styles = stylesOf({ default: { heading1: { run: { size: 36 } } } });
        const { spans } = readOne(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Title")] }), styles);
        expect(spans).to.deep.equal([{ text: "Title", size: 18 }]);
    });

    it("should stop at a style based on itself, and leave out styles of the wrong type or that don't exist", () => {
        const styles = stylesOf({
            paragraphStyles: [{ id: "Normal", name: "Normal", basedOn: "Normal", run: { font: "MS Gothic" } }],
            characterStyles: [{ id: "Strong", name: "Strong", run: { bold: true } }],
        });
        expect(readOne(new Paragraph({ children: [new TextRun("a")] }), styles).spans).to.deep.equal([{ text: "a", font: "MS Gothic" }]);
        // A character style used as a paragraph style, and a missing character style, change nothing
        expect(
            readOne(new Paragraph({ style: "Strong", children: [new TextRun({ text: "a", style: "Missing" })] }), styles).spans,
        ).to.deep.equal([{ text: "a" }]);
    });

    it("should read the paragraph mark's own font, and a paragraph's line spacing and indents", () => {
        const paragraph = readOne(
            new Paragraph({
                run: { size: 40 },
                spacing: { before: 100, line: 300, lineRule: LineRuleType.EXACT },
                indent: { left: 200, right: 100, hanging: 50 },
                contextualSpacing: true,
            }),
        );
        expect(paragraph.spans).to.deep.equal([]);
        expect(paragraph.font).to.deep.equal({ size: 20 });
        expect(paragraph.format).to.deep.equal({
            spaceBefore: 5,
            lineSpacing: { rule: "exact", height: 15 },
            indentLeft: 10,
            indentRight: 5,
            firstLineIndent: -2.5,
            contextualSpacing: true,
        });
    });

    it("should read a numbered paragraph without adding its numbering to a document", () => {
        const file = new File({
            numbering: { config: [{ reference: "list", levels: [{ level: 0, text: "%1." }] }] },
            sections: [],
        });
        const numberings = file.Numbering.ConcreteNumbering.length;
        const paragraph = new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun("One")] });
        expect(readTextParagraphs([paragraph], getTextStyles(contextOf(file)))[0].spans).to.deep.equal([{ text: "One" }]);
        expect(file.Numbering.ConcreteNumbering).to.have.length(numberings);
    });
});
