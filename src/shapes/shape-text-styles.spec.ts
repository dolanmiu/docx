import { describe, expect, it } from "vitest";

import { File } from "@file/file";
import {
    ExternalHyperlink,
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

import { WORD_DEFAULT_STYLES, getTextStyles, hasDefaultParagraphSpacing, readTextParagraphs } from "./shape-text-styles";

const contextOf = (file: File): IContext => ({ file, stack: [] }) as unknown as IContext;

const stylesOf = (styles: IStylesOptions & { readonly default?: object }): ReturnType<typeof getTextStyles> =>
    getTextStyles(contextOf(new File({ styles, sections: [] })));

const readOne = (paragraph: Paragraph, styles = WORD_DEFAULT_STYLES): ReturnType<typeof readTextParagraphs>[number] =>
    readTextParagraphs([paragraph], styles)[0];

describe("getTextStyles", () => {
    it("should use Word's defaults when the context has no document", () => {
        expect(getTextStyles({ stack: [] } as unknown as IContext)).to.equal(WORD_DEFAULT_STYLES);
    });

    it("should read the document's default run and paragraph formatting", () => {
        const styles = stylesOf({
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 160, line: 259 } } } },
        });
        expect(styles.run).to.deep.equal({ font: "Calibri", size: 11 });
        expect(styles.paragraph).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 259 / 240 } });
    });

    it("should read the styles of a document once", () => {
        const context = contextOf(new File({ sections: [] }));
        expect(getTextStyles(context)).to.equal(getTextStyles(context));
    });

    it("should use the style marked as the default, or Normal", () => {
        expect(stylesOf({}).defaultParagraphStyle).to.equal(undefined);
        expect(stylesOf({ paragraphStyles: [{ id: "Normal", name: "Normal" }] }).defaultParagraphStyle).to.equal("Normal");
        // A character style called Normal isn't the default for paragraphs
        expect(stylesOf({ characterStyles: [{ id: "Normal", name: "Normal" }] }).defaultParagraphStyle).to.equal(undefined);

        const imported = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:default="1" w:styleId="Body"><w:name w:val="Body"/></w:style>
    <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
    <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/></w:style>
    <w:style w:type="character" w:default="0" w:styleId="Other"><w:name w:val="Other"/></w:style>
    <w:style w:type="table"><w:name w:val="No id"/></w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        expect(imported.defaultParagraphStyle).to.equal("Body");
        expect(imported.defaultCharacterStyle).to.equal("DefaultParagraphFont");
    });

    it("should read styles imported from another document, whose values are text", () => {
        const styles = getTextStyles(
            contextOf(
                new File({
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsi="Aptos"/><w:sz w:val="24"/><w:b w:val="0"/></w:rPr></w:rPrDefault>
        <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="278" w:lineRule="auto"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:styleId="Quote">
        <w:name w:val="Quote"/>
        <w:pPr><w:spacing w:before="120" w:line="300" w:lineRule="exact"/><w:ind w:start="720" w:end="360" w:hanging="360"/><w:contextualSpacing/></w:pPr>
        <w:rPr><w:caps w:val="off"/><w:spacing w:val="10"/><w:w w:val="90"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Tall">
        <w:name w:val="Tall"/>
        <w:pPr><w:spacing w:line="480" w:lineRule="atLeast"/><w:ind w:left="100" w:right="200" w:firstLine="300"/></w:pPr>
        <w:rPr><w:rFonts w:ascii="Arial"/><w:vanish/><w:smallCaps w:val="true"/></w:rPr>
    </w:style>
</w:styles>`,
                    sections: [],
                }),
            ),
        );
        // The theme font isn't known, so the font comes from the other attributes
        expect(styles.run).to.deep.equal({ font: "Aptos", size: 12, bold: false });
        expect(styles.paragraph).to.deep.equal({ spaceAfter: 8, lineSpacing: { rule: "multiple", multiple: 278 / 240 } });
        expect(styles.styles.get("Quote")).to.deep.equal({
            type: "paragraph",
            basedOn: undefined,
            run: { allCaps: false, characterSpacing: 0.5, scale: 90 },
            paragraph: {
                spaceBefore: 6,
                lineSpacing: { rule: "exact", height: 15 },
                indentLeft: 36,
                indentRight: 18,
                firstLineIndent: -18,
                contextualSpacing: true,
            },
        });
        expect(styles.styles.get("Tall")).to.deep.equal({
            type: "paragraph",
            basedOn: undefined,
            run: { font: "Arial", hidden: true, smallCaps: true },
            paragraph: { lineSpacing: { rule: "atLeast", height: 24 }, indentLeft: 5, indentRight: 10, firstLineIndent: 15 },
        });
    });
});

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
        expect(spans).to.deep.equal([
            { text: "CAPS" },
            { text: "S", size: 10 },
            { text: "MALL", size: 8 },
            { text: " ", size: 10 },
            { text: "CAPS", size: 8 },
            // Without a size, small capitals are 80% of 10pt
            { text: "X", size: 8 },
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

describe("hasDefaultParagraphSpacing", () => {
    it("should be whether a paragraph without formatting has space before or after it", () => {
        expect(hasDefaultParagraphSpacing(WORD_DEFAULT_STYLES)).to.equal(false);
        expect(hasDefaultParagraphSpacing(stylesOf({ default: { document: { paragraph: { spacing: { after: 160 } } } } }))).to.equal(true);
        expect(
            hasDefaultParagraphSpacing(
                stylesOf({ paragraphStyles: [{ id: "Normal", name: "Normal", paragraph: { spacing: { before: 60 } } }] }),
            ),
        ).to.equal(true);
        expect(hasDefaultParagraphSpacing(stylesOf({ default: { document: { paragraph: { spacing: { line: 276 } } } } }))).to.equal(false);
    });
});
