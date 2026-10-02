import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IPropertiesOptions } from "@file/core-properties";
import { File } from "@file/file";
import { HeightRule, Table, TableCell, TableRow, WidthType } from "@file/table";
import {
    AlignmentType,
    Footer,
    Header,
    HeadingLevel,
    type IContext,
    type IXmlableObject,
    LevelFormat,
    LevelSuffix,
    Paragraph,
    TextRun,
} from "docx";

import { WORD_DEFAULT_STYLES } from "../text-layout";
import { type DocumentContent, type LayoutItem, type ParagraphBlock, type TableBlock, readContent, readDocument } from "./read-document";

const contextOf = (file: File): IContext => ({ file, viewWrapper: file.Document, stack: [] }) as unknown as IContext;

/** Reads a body of formatted elements, with the styles, lists and settings of a document with the options */
const readBody = (elements: readonly unknown[], options: Partial<IPropertiesOptions> = {}): DocumentContent => {
    const file = new File({ sections: [], ...options });
    return readDocument({ "w:body": elements } as IXmlableObject, contextOf(file));
};

/** Reads a document as it is written */
const readWritten = (options: IPropertiesOptions): DocumentContent => {
    let content: DocumentContent | undefined;
    const file = new File({
        ...options,
        pageNumbers: (body, context) => {
            content = readDocument(body, context);
            return { bookmarks: new Map() };
        },
    });
    new Formatter().format(file.Document.View, contextOf(file));
    return content!;
};

const p = (...children: readonly unknown[]): object => ({ "w:p": children });
const r = (...children: readonly unknown[]): object => ({ "w:r": children });
const t = (text: string): object => ({ "w:t": [{ _attr: { "xml:space": "preserve" } }, text] });
const pPr = (...children: readonly unknown[]): object => ({ "w:pPr": children });
const rPr = (...children: readonly unknown[]): object => ({ "w:rPr": children });
const value = (name: string, val: unknown): object => ({ [name]: { _attr: { "w:val": val } } });
const field = (type: string): object => r({ "w:fldChar": { _attr: { "w:fldCharType": type } } });
const instruction = (text: string): object => r({ "w:instrText": [{ _attr: { "xml:space": "preserve" } }, text] });

const paragraphOf = (content: DocumentContent, index = 0): ParagraphBlock => content.blocks[index].block as ParagraphBlock;
const itemsOf = (content: DocumentContent, index = 0): readonly LayoutItem[] => paragraphOf(content, index).items;
const textOf = (content: DocumentContent, index = 0): string =>
    itemsOf(content, index)
        .map((item) => (item.type === "text" ? item.text : item.type === "pageReference" ? `[${item.bookmark}]` : ""))
        .join("");

describe("readDocument", () => {
    describe("paragraphs", () => {
        it("should read the text of runs in their formatting: the document's defaults, the styles, and their own", () => {
            const content = readBody(
                [p(pPr(value("w:pStyle", "Heading1")), r(t("Plain")), r(rPr(value("w:sz", 30), { "w:b": {} }), t("Big")))],
                {
                    styles: { default: { document: { run: { font: "Arial", size: 20 } }, heading1: { run: { size: 28 } } } },
                },
            );
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "Plain", font: { font: "Arial", size: 14 } },
                { type: "text", text: "Big", font: { font: "Arial", size: 15, bold: true } },
            ]);
            expect(paragraphOf(content).markFont).to.deep.equal({ font: "Arial", size: 14 });
            expect(paragraphOf(content).style).to.equal("Heading1");
        });

        it("should read East Asian text in its run's East Asian font, with its language, and right-to-left runs in the font of complex scripts", () => {
            const fonts = { "w:rFonts": { _attr: { "w:ascii": "Arial", "w:eastAsia": "SimSun", "w:cs": "Times New Roman" } } };
            const content = readBody([
                p(
                    r(rPr(fonts, { "w:lang": { _attr: { "w:eastAsia": "zh-CN" } } }), t("a永")),
                    r(rPr(fonts, { "w:rtl": {} }, value("w:szCs", 28)), t("b")),
                ),
            ]);
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "a", font: { font: "Arial" }, language: "zh-CN", eastAsian: true },
                { type: "text", text: "永", font: { font: "SimSun" }, language: "zh-CN", eastAsian: true },
                { type: "text", text: "b", font: { font: "Times New Roman", size: 14 }, eastAsian: true },
            ]);
        });

        it("should read an empty paragraph", () => {
            expect(paragraphOf(readBody([{ "w:p": {} }]))).to.deep.include({ items: [], style: "Normal" });
        });

        it("should read runs in their character style, and the paragraph mark's own formatting", () => {
            const content = readBody([p(pPr(rPr(value("w:sz", 40))), r(rPr(value("w:rStyle", "Strong")), t("Strong")))], {
                styles: { characterStyles: [{ id: "Strong", name: "Strong", run: { bold: true } }] },
            });
            expect(itemsOf(content)).to.deep.equal([{ type: "text", text: "Strong", font: { bold: true } }]);
            expect(paragraphOf(content).markFont).to.deep.equal({ size: 20 });
        });

        it("should read tabs, breaks and the characters Word writes as elements, and leave out hidden text", () => {
            const content = readBody([
                p(
                    r(
                        t("a"),
                        { "w:tab": {} },
                        { "w:ptab": { _attr: {} } },
                        { "w:br": { _attr: { "w:type": "page" } } },
                        { "w:br": { _attr: { "w:type": "column" } } },
                        { "w:br": {} },
                        { "w:cr": {} },
                        { "w:noBreakHyphen": {} },
                        { "w:sym": { _attr: { "w:char": "F0A7" } } },
                        { "w:endnoteReference": { _attr: { "w:id": 1 } } },
                        { "w:lastRenderedPageBreak": {} },
                    ),
                    r(rPr({ "w:vanish": {} }), t("hidden"), { "w:tab": {} }, { "w:br": {} }, { "w:cr": {} }),
                    r(rPr({ "w:caps": {} }), t("caps")),
                ),
            ]);
            expect(
                itemsOf(content).map((item) => (item.type === "break" ? item.kind : item.type === "text" ? item.text : item.type)),
            ).to.deep.equal(["a", "tab", "tab", "page", "column", "line", "line", "\u2011", "\uf0a7", "i", "CAPS"]);
            // An endnote's number, in superscript, and numbered as Word numbers endnotes
            expect(itemsOf(content)[9]).to.deep.equal({ type: "text", text: "i", font: { scale: 65 } });
        });

        it("should read a symbol as its character in its own font, which the width tables don't have when it's a symbol font's", () => {
            const content = readBody([
                p(
                    r(
                        { "w:sym": { _attr: { "w:font": "Wingdings", "w:char": "F0FC" } } },
                        { "w:sym": { _attr: { "w:font": "Calibri", "w:char": "2022" } } },
                    ),
                ),
            ]);
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "\uf0fc", font: { font: "Wingdings" } },
                { type: "text", text: "\u2022", font: { font: "Calibri" } },
            ]);
        });

        it("should stop at a symbol whose character isn't four hexadecimal digits, as the schema has it, rather than read part of it", () => {
            // "110000" is past the last code point, and "F0FCzz" and "41" aren't four digits
            for (const character of ["110000", "F0FCzz", "41", undefined]) {
                const attributes = character === undefined ? { "w:font": "Wingdings" } : { "w:font": "Wingdings", "w:char": character };
                expect(paragraphOf(readBody([p(r({ "w:sym": { _attr: attributes } }))])).unsupported).to.equal(
                    "a symbol whose character isn't four hexadecimal digits",
                );
            }
        });

        it("should read a tab in the text as a tab, as Word lays it out and docx writes those of a TextRun's text", () => {
            const content = readBody([p(r(t("a\tb\t")), r(rPr({ "w:vanish": {} }), t("hidden\t")))]);
            expect(itemsOf(content).map((item) => (item.type === "text" ? item.text : item.type))).to.deep.equal(["a", "tab", "b", "tab"]);
        });

        it("should read the text in hyperlinks, insertions, content controls and other elements that hold runs, but not deletions", () => {
            const content = readBody([
                p(
                    { "w:hyperlink": [{ _attr: { "w:anchor": "a" } }, r(t("link "))] },
                    { "w:ins": [r(t("inserted "))] },
                    { "w:del": [r({ "w:delText": ["deleted"] })] },
                    { "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": [r(t("control "))] }] },
                    { "w:smartTag": [r(t("tag"))] },
                    { "w:proofErr": { _attr: {} } },
                ),
            ]);
            expect(textOf(content)).to.equal("link inserted control tag");
        });

        it("should read where bookmarks start", () => {
            const content = readBody([
                p({ "w:bookmarkStart": { _attr: { "w:name": "here", "w:id": 1 } } }, r(t("a")), {
                    "w:bookmarkStart": { _attr: { "w:id": 2 } },
                }),
            ]);
            expect(itemsOf(content)).to.deep.equal([
                { type: "marker", name: "here" },
                { type: "text", text: "a", font: {} },
            ]);
        });

        it("should read the paragraph's formatting from its styles and its own, and add up their tab stops", () => {
            const content = readBody(
                [
                    p(
                        pPr(
                            value("w:pStyle", "Tabbed"),
                            {
                                "w:tabs": [
                                    { "w:tab": { _attr: { "w:val": "clear", "w:pos": 720 } } },
                                    { "w:tab": { _attr: { "w:val": "right", "w:pos": 9000 } } },
                                ],
                            },
                            { "w:spacing": { _attr: { "w:after": 200 } } },
                        ),
                    ),
                ],
                {
                    externalStyles: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:styleId="Tabbed">
        <w:name w:val="Tabbed"/>
        <w:pPr>
            <w:keepNext/>
            <w:spacing w:before="100"/>
            <w:tabs><w:tab w:val="left" w:pos="720"/><w:tab w:val="center" w:pos="1440"/><w:tab w:val="bar" w:pos="2880"/></w:tabs>
        </w:pPr>
    </w:style>
</w:styles>`,
                },
            );
            expect(paragraphOf(content).format).to.deep.include({ spaceBefore: 5, spaceAfter: 10, keepNext: true });
            expect(paragraphOf(content).tabStops).to.deep.equal([
                { position: 72, alignment: "center" },
                { position: 450, alignment: "right" },
            ]);
        });

        it("should mark a paragraph in a text frame, or with an equation, as unsupported", () => {
            expect(paragraphOf(readBody([p(pPr({ "w:framePr": { _attr: { "w:w": 2000 } } }), r(t("a")))])).unsupported).to.equal(
                "a text frame",
            );
            const equation = paragraphOf(readBody([p(r(t("a")), { "m:oMath": [] })]));
            expect(equation.unsupported).to.equal("an equation");
            expect(equation.items).to.deep.equal([]);
            expect(paragraphOf(readBody([p({ "m:oMathPara": [] })])).unsupported).to.equal("an equation");
        });
    });

    describe("footnotes and endnotes", () => {
        it("should read the footnotes the body refers to, by the markers at their references, with the separator above them", () => {
            const content = readBody(
                [
                    p(r(t("a"), { "w:footnoteReference": { _attr: { "w:id": 1 } } })),
                    p(r({ "w:footnoteReference": { _attr: { "w:id": 7 } } })),
                ],
                { footnotes: { 1: { children: [new Paragraph("Note")] } } },
            );
            // A reference is the marker its footnote is placed by, and the footnote's number, in superscript
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "a", font: {} },
                { type: "marker", name: "footnote 1" },
                { type: "text", text: "1", font: { scale: 65 } },
            ]);
            // The footnote starts with its number
            expect((content.footnotes.get("footnote 1")![0] as ParagraphBlock).items).to.deep.equal([
                { type: "text", text: "1", font: { scale: 65 } },
                { type: "text", text: "Note", font: {} },
            ]);
            // A reference to a footnote the document doesn't have is numbered, and has nothing to place
            expect(itemsOf(content, 1)).to.deep.include({ type: "text", text: "2", font: { scale: 65 } });
            expect(content.footnotes.get("footnote 2")).to.deep.equal([]);
            // The separators' paragraphs, whose lines are as tall as their marks
            expect(content.footnoteSeparator).to.have.length(1);
            expect((content.footnoteSeparator[0] as ParagraphBlock).items).to.deep.equal([]);
            expect(content.footnoteContinuationSeparator).to.have.length(1);
            expect((content.footnoteContinuationSeparator[0] as ParagraphBlock).items).to.deep.equal([]);
            expect(content.endnotes).to.deep.equal([]);
            // Each footnote's number, by its marker
            expect(Object.fromEntries(content.footnoteNumbers)).to.deep.equal({ "footnote 1": "1", "footnote 2": "2" });
        });

        it("should read the endnotes the body refers to, after their separator, numbered as Word numbers them", () => {
            const content = readBody(
                [p(r({ "w:endnoteReference": { _attr: { "w:id": 1 } } }), r({ "w:endnoteReference": { _attr: { "w:id": 2 } } }))],
                { endnotes: { 1: { children: [new Paragraph("First")] }, 2: { children: [new Paragraph("Second")] } } },
            );
            expect(itemsOf(content).map((item) => (item.type === "text" ? item.text : item.type))).to.deep.equal(["i", "ii"]);
            expect(
                content.endnotes.map((block) => (block as ParagraphBlock).items.map((item) => (item.type === "text" ? item.text : ""))),
            ).to.deep.equal([[], ["i", "First"], ["ii", "Second"]]);
            // The number of the endnote each block is in, but the separator's
            expect(content.endnotes.map((block) => content.endnoteNumbers.get(block))).to.deep.equal([undefined, "i", "ii"]);
            expect(content.footnotes.size).to.equal(0);
            expect(content.footnoteSeparator).to.deep.equal([]);
            expect(content.footnoteContinuationSeparator).to.deep.equal([]);
        });
    });

    describe("drawings", () => {
        const drawing = (child: object): object => r({ "w:drawing": [child] });

        it("should read a picture in the line as a box, with its effects and the space around it", () => {
            const inline = {
                "wp:inline": [
                    { _attr: { distT: 12700, distB: 12700, distL: 0, distR: 25400 } },
                    { "wp:extent": { _attr: { cx: 127000, cy: 254000 } } },
                    { "wp:effectExtent": { _attr: { l: 12700, t: 0, r: 12700, b: 0 } } },
                ],
            };
            expect(itemsOf(readBody([p(drawing(inline))]))).to.deep.equal([{ type: "box", width: 14, height: 22 }]);
            expect(itemsOf(readBody([p(drawing({ "wp:inline": [{ "wp:extent": { _attr: { cx: 127000 } } }] }))]))).to.deep.equal([
                { type: "box", width: 10, height: 0 },
            ]);
        });

        it("should leave out drawings text doesn't flow around, and stop at those it does", () => {
            expect(itemsOf(readBody([p(drawing({ "wp:anchor": [{ "wp:wrapNone": {} }] }))]))).to.deep.equal([]);
            expect(paragraphOf(readBody([p(drawing({ "wp:anchor": [{ "wp:wrapSquare": {} }] }))])).unsupported).to.equal(
                "a drawing that text flows around",
            );
            expect(paragraphOf(readBody([p(r({ "w:pict": [] }))])).unsupported).to.equal("a VML drawing");
            expect(paragraphOf(readBody([p(r({ "w:object": [] }))])).unsupported).to.equal("a VML drawing");
        });

        it("should read the drawing Word reads of those with a fallback for older versions", () => {
            const alternate = {
                "mc:AlternateContent": [
                    {
                        "mc:Choice": [
                            { _attr: { Requires: "wps" } },
                            { "w:drawing": [{ "wp:inline": [{ "wp:extent": { _attr: { cx: 12700, cy: 12700 } } }] }] },
                        ],
                    },
                    { "mc:Fallback": [{ "w:pict": [] }] },
                ],
            };
            expect(itemsOf(readBody([p(r(alternate))]))).to.deep.equal([{ type: "box", width: 1, height: 1 }]);
            expect(itemsOf(readBody([p(r({ "mc:AlternateContent": [{ "mc:Fallback": [] }] }))]))).to.deep.equal([]);
        });
    });

    describe("fields", () => {
        it("should read the results of fields, not their instructions", () => {
            const content = readBody([
                p(field("begin"), instruction("DATE"), field("separate"), r(t("today")), field("end"), r(t(" after"))),
            ]);
            expect(textOf(content)).to.equal("today after");
        });

        it("should read a page reference's result as the page of its bookmark, across paragraphs and inside other fields", () => {
            const content = readBody([
                p(
                    field("begin"),
                    instruction("TOC \\o"),
                    field("separate"),
                    r(t("Entry")),
                    field("begin"),
                    instruction("PAGEREF _Toc1 \\h"),
                ),
                p(field("separate"), r(t("99")), field("end"), field("end")),
            ]);
            expect(textOf(content, 0)).to.equal("Entry");
            expect(itemsOf(content, 1)).to.deep.equal([{ type: "pageReference", bookmark: "_Toc1", font: {} }]);
        });

        it("should read the results of page references that show something other than the page's number", () => {
            const content = readBody([
                p(field("begin"), instruction("PAGEREF a \\p"), field("separate"), r(t("above")), field("end")),
                p(field("begin"), instruction("PAGEREF a \\* roman"), field("separate"), r(t("iv")), field("end")),
                p(field("begin"), instruction('PAGEREF "a" \\* MERGEFORMAT'), field("separate"), r(t("4")), field("end")),
                p(field("begin"), instruction("PAGEREF"), field("separate"), r(t("?")), field("end")),
                p(field("begin"), instruction('PAGEREF a \\# "00"'), field("separate"), r(t("04")), field("end")),
            ]);
            expect([0, 1, 2, 3, 4].map((index) => textOf(content, index))).to.deep.equal(["above", "iv", "[a]", "?", "04"]);
        });

        it("should read the results of NUMPAGES and SECTIONPAGES fields as the numbers of pages they show", () => {
            const content = readBody([
                p(field("begin"), instruction("NUMPAGES \\* MERGEFORMAT"), field("separate"), r(t("9")), field("end")),
                p({ "w:fldSimple": [{ _attr: { "w:instr": "SECTIONPAGES" } }, r(t("3"))] }),
                p(field("begin"), instruction("NUMPAGES \\* roman"), field("separate"), r(t("ix")), field("end")),
            ]);
            expect(itemsOf(content, 0)).to.deep.equal([{ type: "pageCount", scope: "document", font: {} }]);
            expect(itemsOf(content, 1)).to.deep.equal([{ type: "pageCount", scope: "section", font: {} }]);
            // In a format of its own, its result is read as it is
            expect(textOf(content, 2)).to.equal("ix");
        });

        it("should ignore field characters and instructions outside a field", () => {
            const content = readBody([p(field("separate"), instruction("PAGEREF a"), r(t("text")), field("end"))]);
            expect(textOf(content)).to.equal("text");
        });

        it("should read a simple field that is a page reference as the page of its bookmark, and others as their result", () => {
            const content = readBody([
                p({ "w:fldSimple": [{ _attr: { "w:instr": "PAGEREF target" } }, r(t("9"))] }),
                p({ "w:fldSimple": [{ _attr: { "w:instr": "DATE" } }, r(t("today"))] }),
            ]);
            expect(itemsOf(content, 0)).to.deep.equal([{ type: "pageReference", bookmark: "target", font: {} }]);
            expect(textOf(content, 1)).to.equal("today");
        });
    });

    describe("lists", () => {
        const numbering = {
            config: [
                {
                    reference: "list",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: "%1.",
                            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                        },
                        {
                            level: 1,
                            format: LevelFormat.LOWER_LETTER,
                            text: "%1.%2",
                            suffix: LevelSuffix.SPACE,
                            style: { run: { bold: true } },
                        },
                        { level: 2, format: LevelFormat.UPPER_ROMAN, text: "", suffix: LevelSuffix.NOTHING },
                        { level: 3, format: LevelFormat.THAI_COUNTING, text: "%4", alignment: AlignmentType.START },
                        // A level without a format is in decimal, and one it refers to that doesn't exist is at 1
                        { level: 4, text: "%5.%7" },
                    ],
                },
            ],
        };
        const item = (level: number, text: string): Paragraph =>
            new Paragraph({ numbering: { reference: "list", level }, children: [new TextRun(text)] });

        it("should write each paragraph's number, and indent it as its level says", () => {
            const content = readWritten({
                numbering,
                sections: [{ children: [item(0, "one"), item(1, "a"), item(1, "b"), item(0, "two"), item(1, "a again")] }],
            });
            expect(
                [0, 1, 2, 3, 4].map((index) => itemsOf(content, index).map((part) => (part.type === "text" ? part.text : part.type))),
            ).to.deep.equal([
                ["1.", "tab", "one"],
                ["1.a", " ", "a"],
                ["1.b", " ", "b"],
                ["2.", "tab", "two"],
                ["2.a", " ", "a again"],
            ]);
            expect(paragraphOf(content).format).to.deep.include({ indentLeft: 36, firstLineIndent: -18 });
            expect(itemsOf(content, 1)[0]).to.deep.equal({ type: "text", text: "1.a", font: { bold: true } });
        });

        it("should write nothing for a level without text or suffix, and a number for a format it doesn't write", () => {
            const content = readWritten({ numbering, sections: [{ children: [item(2, "none"), item(3, "circled"), item(4, "missing")] }] });
            expect(textOf(content, 0)).to.equal("none");
            expect(itemsOf(content, 1).map((part) => (part.type === "text" ? part.text : part.type))).to.deep.equal([
                "1",
                "tab",
                "circled",
            ]);
            expect(textOf(content, 2)).to.equal("1.1missing");
        });

        it("should write no number for a list or level that doesn't exist", () => {
            const content = readBody([
                p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 99)] }), r(t("a"))),
                p(pPr({ "w:numPr": [value("w:ilvl", 7), value("w:numId", "{list-0}")] }), r(t("b"))),
            ]);
            expect(textOf(content, 0)).to.equal("a");
            expect(textOf(content, 1)).to.equal("b");
        });

        it("should find a list by its number, as well as by the placeholder docx writes", () => {
            // Every document has docx's bulleted list, number 1
            const content = readBody([p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 1)] }), r(t("a")))]);
            expect(itemsOf(content).map((part) => part.type)).to.deep.equal(["text", "tab", "text"]);
            expect(textOf(content).endsWith("a")).to.equal(true);
        });

        it("should write no number for a placeholder of a list that doesn't exist", () => {
            const content = readContent(
                { "w:body": [p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", "{list-0}")] }), r(t("Item")))] },
                { styles: WORD_DEFAULT_STYLES, otherListIds: new Map([["{list-0}", "1"]]), headersAndFooters: new Map() },
            );
            expect(textOf(content)).to.equal("Item");
        });
    });

    describe("lists given by styles", () => {
        const numbering = {
            config: [
                {
                    reference: "chapters",
                    levels: [
                        { level: 0, format: LevelFormat.DECIMAL, text: "Chapter %1" },
                        { level: 1, format: LevelFormat.UPPER_LETTER, text: "%1.%2", style: { style: "Linked" } },
                    ],
                },
            ],
        };

        it("should number a paragraph in its style's list, at the level the style gives, and note the number of a heading", () => {
            const content = readWritten({
                numbering,
                styles: {
                    paragraphStyles: [
                        { id: "Heading1", name: "Heading 1", paragraph: { numbering: { reference: "chapters", level: 0 } } },
                        { id: "Heading2", name: "heading 2", paragraph: { numbering: { reference: "chapters", level: 1 } } },
                        { id: "Based", name: "Based", basedOn: "Heading2" },
                    ],
                },
                sections: [
                    {
                        children: [
                            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Start")] }),
                            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Part")] }),
                            new Paragraph({ style: "Based", children: [new TextRun("Based")] }),
                            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Unnumbered")] }),
                        ],
                    },
                ],
            });
            expect([0, 1, 2, 3].map((index) => textOf(content, index))).to.deep.equal([
                "Chapter 1Start",
                "1.APart",
                "1.BBased",
                "Unnumbered",
            ]);
            // A heading is one of Word's by its style's name, in any case. As a chapter number, its number is its level's text
            // from the first number to the last
            expect([0, 1, 2, 3].map((index) => paragraphOf(content, index).heading)).to.deep.equal([
                { level: 1, chapter: "1" },
                { level: 2, chapter: "1.A" },
                undefined,
                { level: 3 },
            ]);
        });

        it("should number a paragraph of a style that gives no level at the level that is for the style, or the first", () => {
            const style = (id: string, numPr: string): string =>
                `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:pPr><w:numPr>${numPr}</w:numPr></w:pPr></w:style>`;
            const content = readWritten({
                numbering,
                externalStyles: `<w:styles xmlns:w="main">${style("Linked", '<w:numId w:val="{chapters-0}"/>')}${style(
                    "Unlinked",
                    '<w:numId w:val="{chapters-0}"/>',
                )}</w:styles>`,
                sections: [
                    {
                        children: [
                            new Paragraph({ style: "Unlinked", children: [new TextRun("first")] }),
                            new Paragraph({ style: "Linked", children: [new TextRun("linked")] }),
                        ],
                    },
                ],
            });
            expect([0, 1].map((index) => textOf(content, index))).to.deep.equal(["Chapter 1first", "1.Alinked"]);
        });

        it("should take a style's list and level each from the nearest style that gives it", () => {
            const style = (id: string, basedOn: string, numPr: string): string =>
                `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/>${basedOn ? `<w:basedOn w:val="${basedOn}"/>` : ""}<w:pPr><w:numPr>${numPr}</w:numPr></w:pPr></w:style>`;
            const content = readWritten({
                numbering,
                externalStyles: `<w:styles xmlns:w="main">${style("Base", "", '<w:ilvl w:val="0"/><w:numId w:val="{chapters-0}"/>')}${style(
                    "Derived",
                    "Base",
                    '<w:ilvl w:val="1"/>',
                )}</w:styles>`,
                sections: [
                    {
                        children: [
                            new Paragraph({ style: "Base", children: [new TextRun("base")] }),
                            new Paragraph({ style: "Derived", children: [new TextRun("derived")] }),
                        ],
                    },
                ],
            });
            // The derived style's level, in the list of the style it is based on
            expect([0, 1].map((index) => textOf(content, index))).to.deep.equal(["Chapter 1base", "1.Aderived"]);
        });

        it("should number a paragraph that gives its own level in its style's list, and in its own list when it gives one", () => {
            const content = readBody(
                [
                    p(pPr(value("w:pStyle", "Heading1"), { "w:numPr": [value("w:ilvl", 1)] }), r(t("own level"))),
                    p(pPr(value("w:pStyle", "Heading1"), { "w:numPr": [value("w:numId", 0)] }), r(t("no list"))),
                ],
                {
                    numbering,
                    styles: {
                        paragraphStyles: [
                            { id: "Heading1", name: "heading 1", paragraph: { numbering: { reference: "chapters", level: 0 } } },
                        ],
                    },
                },
            );
            expect([0, 1].map((index) => textOf(content, index))).to.deep.equal(["1.Aown level", "no list"]);
            // Word passes over a heading numbered by itself, or taken out of its style's list, as a chapter heading
            expect([0, 1].map((index) => paragraphOf(content, index).heading)).to.deep.equal([{ level: 1, chapter: "1.A" }, { level: 1 }]);
        });
    });

    describe("tables", () => {
        const cell = (properties: readonly unknown[], ...paragraphs: readonly object[]): object => ({
            "w:tc": [{ "w:tcPr": properties }, ...paragraphs],
        });

        it("should read each cell's width from the grid of a table laid out fixed, less its margins, and its rows' heights and borders", () => {
            const content = readBody([
                {
                    "w:tbl": [
                        {
                            "w:tblPr": [
                                { "w:tblLayout": { _attr: { "w:type": "fixed" } } },
                                { "w:tblCellMar": [{ "w:top": { _attr: { "w:w": 20 } } }, { "w:left": { _attr: { "w:w": 100 } } }] },
                                {
                                    "w:tblBorders": [
                                        { "w:top": { _attr: { "w:val": "single", "w:sz": 8 } } },
                                        { "w:insideH": { _attr: { "w:val": "nil", "w:sz": 8 } } },
                                        { "w:bottom": { _attr: { "w:val": "double" } } },
                                    ],
                                },
                            ],
                        },
                        {
                            "w:tblGrid": [
                                { "w:gridCol": { _attr: { "w:w": 2000 } } },
                                { "w:gridCol": { _attr: { "w:w": 4000 } } },
                                { "w:gridCol": {} },
                            ],
                        },
                        {
                            "w:tr": [
                                { "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 400, "w:hRule": "exact" } } }, { "w:tblHeader": {} }] },
                                cell(
                                    [
                                        value("w:gridSpan", 2),
                                        { "w:tcMar": [{ "w:bottom": { _attr: { "w:w": 40 } } }, { "w:end": { _attr: { "w:w": 60 } } }] },
                                    ],
                                    p(r(t("wide"))),
                                ),
                            ],
                        },
                        {
                            "w:sdt": [
                                {
                                    "w:sdtContent": [
                                        { "w:tr": [{ "w:trPr": [value("w:gridBefore", 1)] }, cell([{ "w:vMerge": {} }], p())] },
                                    ],
                                },
                            ],
                        },
                        {
                            "w:customXml": [
                                {
                                    "w:tr": [
                                        cell([{ "w:vMerge": { _attr: { "w:val": "restart" } } }], p()),
                                        { "w:sdt": [{ "w:sdtContent": [cell([], p())] }] },
                                        { "w:customXml": [cell([], p())] },
                                    ],
                                },
                            ],
                        },
                        { "w:tr": [{ "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 300 } } }] }, cell([])] },
                        { "w:tr": [{ "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 300, "w:hRule": "auto" } } }] }] },
                    ],
                },
            ]);
            const { rows } = content.blocks[0].block as TableBlock;
            expect(
                rows.map(({ cells, height, header, borderTop, borderBottom }) => ({
                    cells: cells.length,
                    height,
                    header,
                    borderTop,
                    borderBottom,
                })),
            ).to.deep.equal([
                { cells: 1, height: { value: 20, rule: "exact" }, header: true, borderTop: 1, borderBottom: 0 },
                { cells: 1, height: undefined, header: false, borderTop: 0, borderBottom: 0 },
                { cells: 3, height: undefined, header: false, borderTop: 0, borderBottom: 0 },
                // A height without a rule is the least the row can be, as Word writes it
                { cells: 1, height: { value: 15, rule: "atLeast" }, header: false, borderTop: 0, borderBottom: 0 },
                // A border without a width is none
                { cells: 0, height: undefined, header: false, borderTop: 0, borderBottom: 0 },
            ]);
            expect(rows[0].cells[0]).to.deep.include({ width: 300 - 5 - 3, marginTop: 1, marginBottom: 2 });
            // After the column it skips, the cell is in the second column
            expect(rows[1].cells[0]).to.deep.include({ column: 1, width: 200 - 5 - 5.4, verticalMerge: "continue" });
            expect(rows[2].cells.map(({ column, width, verticalMerge }) => ({ column, width, verticalMerge }))).to.deep.equal([
                { column: 0, width: 100 - 5 - 5.4, verticalMerge: "restart" },
                { column: 1, width: 200 - 5 - 5.4, verticalMerge: undefined },
                // The third column has no width
                { column: 2, width: -10.4, verticalMerge: undefined },
            ]);
        });

        it("should read a cell's width from its own properties without a grid, and the paragraphs in it in the table's style", () => {
            const content = readBody(
                [
                    {
                        "w:tbl": [
                            { "w:tblPr": [value("w:tblStyle", "Boxed")] },
                            { "w:tr": [cell([{ "w:tcW": { _attr: { "w:w": 3000, "w:type": "dxa" } } }], p(r(t("in a table"))))] },
                        ],
                    },
                ],
                { styles: { paragraphStyles: [{ id: "Boxed", name: "Boxed", run: { size: 16 } }] } },
            );
            const [first] = (content.blocks[0].block as TableBlock).rows[0].cells;
            expect(first.width).to.equal(150 - 10.8);
            // Boxed is a paragraph style, not a table style, so it doesn't format the text
            expect((first.blocks[0] as ParagraphBlock).items).to.deep.equal([{ type: "text", text: "in a table", font: {} }]);
        });

        it("should give cells the margins of the table's style, or the default table style, or none as Word does", () => {
            const marginsOf = (options: Partial<IPropertiesOptions>, style?: string): readonly number[] => {
                const [first] = (
                    readBody(
                        [
                            {
                                "w:tbl": [
                                    { "w:tblPr": style ? [value("w:tblStyle", style)] : [] },
                                    { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                                    { "w:tr": [cell([], p(r(t("a"))))] },
                                ],
                            },
                        ],
                        options,
                    ).blocks[0].block as TableBlock
                ).rows[0].cells;
                return [Math.round((100 - first.width) * 10) / 10, first.marginTop];
            };
            const padded = `<w:style w:type="table" w:styleId="Padded"><w:basedOn w:val="TableNormal"/><w:tblPr><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="200" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>`;
            // docx's Normal Table: 5.4 points on the left and right
            expect(marginsOf({})).to.deep.equal([10.8, 0]);
            // A table style's margins, over those of the style it is based on
            expect(marginsOf({ externalStyles: `<w:styles xmlns:w="main">${padded}</w:styles>` }, "Padded")).to.deep.equal([15.4, 2.5]);
            // A table style that doesn't give margins, or no default table style: none
            const bare = `<w:styles xmlns:w="main"><w:style w:type="table" w:styleId="TableNormal"><w:name w:val="Normal Table"/></w:style></w:styles>`;
            expect(marginsOf({ externalStyles: bare }, "TableNormal")).to.deep.equal([0, 0]);
            expect(marginsOf({ externalStyles: bare })).to.deep.equal([0, 0]);
        });

        it("should stop at a table whose rows give a column different widths, which Word settles in a way not yet followed", () => {
            const unsupportedOf = (...rows: readonly (readonly (readonly [number | undefined, number?])[])[]): string | undefined =>
                (
                    readBody([
                        {
                            "w:tbl": [
                                { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 1000 } } }, { "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                                ...rows.map((cells) => ({
                                    "w:tr": cells.map(([width, span]) =>
                                        cell(
                                            [
                                                ...(width === undefined ? [] : [{ "w:tcW": { _attr: { "w:w": width, "w:type": "dxa" } } }]),
                                                ...(span === undefined ? [] : [value("w:gridSpan", span)]),
                                            ],
                                            p(r(t("a"))),
                                        ),
                                    ),
                                })),
                            ],
                        },
                    ]).blocks[0].block as TableBlock
                ).unsupported;
            // The first column 1000 twips wide in one row, and 3000 in the next
            expect(unsupportedOf([[1000], [2000]], [[3000], [2000]])).to.equal("a table whose rows give a column different widths");
            // A cell over both columns as wide as the two, and widths a twip apart from rounding
            expect(unsupportedOf([[1000], [2000]], [[3000, 2]], [[1001], [2000]])).to.equal(undefined);
        });

        it("should lay a cell out at its own width in twips rather than the grid's, as Word does", () => {
            const widths = (width: object): readonly number[] =>
                (
                    readBody([
                        {
                            "w:tbl": [
                                { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 1000 } } }, { "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                                { "w:tr": [cell([{ "w:tcW": { _attr: width } }], p(r(t("a")))), cell([], p(r(t("b"))))] },
                            ],
                        },
                    ]).blocks[0].block as TableBlock
                ).rows[0].cells.map((tableCell) => Math.round(tableCell.width + 10.8));
            expect(widths({ "w:w": 3000, "w:type": "dxa" })).to.deep.equal([150, 100]);
            // Without a type, a width is in twips
            expect(widths({ "w:w": 3000 })).to.deep.equal([150, 100]);
            // A percentage is of the table's width, which the grid already has
            expect(widths({ "w:w": 2500, "w:type": "pct" })).to.deep.equal([50, 100]);
        });

        it("should size the columns of a table whose cells don't all have widths to their text, within its own width", () => {
            const tableOf = (tableProperties: readonly object[], ...widths: readonly (object | undefined)[]): TableBlock =>
                readBody([
                    {
                        "w:tbl": [
                            { "w:tblPr": tableProperties },
                            { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 1000 } } }, { "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                            { "w:tr": widths.map((width) => cell(width ? [{ "w:tcW": { _attr: width } }] : [], p(r(t("a"))))) },
                        ],
                    },
                ]).blocks[0].block as TableBlock;
            const tableWidth = (attributes: object): readonly object[] => [{ "w:tblW": { _attr: attributes } }];
            // A cell with no width, or a width of nothing
            expect(tableOf([], { "w:w": 3000 }, undefined).fit).to.deep.equal({});
            expect(tableOf([], { "w:w": 3000 }, { "w:w": 0, "w:type": "auto" }).fit).to.deep.equal({});
            // With the table's width in twips, or as a share of the width it is in
            expect(tableOf(tableWidth({ "w:w": 9000, "w:type": "dxa" })).fit).to.equal(undefined);
            expect(tableOf(tableWidth({ "w:w": 9000, "w:type": "dxa" }), undefined).fit).to.deep.equal({ width: 450 });
            expect(tableOf(tableWidth({ "w:w": 2500, "w:type": "pct" }), undefined).fit).to.deep.equal({ share: 0.5 });
            expect(tableOf(tableWidth({ "w:w": "50%", "w:type": "pct" }), undefined).fit).to.deep.equal({ share: 0.5 });
            expect(tableOf(tableWidth({ "w:w": 0, "w:type": "auto" }), undefined).fit).to.deep.equal({});
            expect(tableOf(tableWidth({ "w:type": "pct" }), undefined).fit).to.deep.equal({});
            // Every cell with a width, or a table laid out fixed, which Word lays out at the grid's widths
            expect(tableOf([], { "w:w": 3000 }, { "w:w": 2500, "w:type": "pct" }).fit).to.equal(undefined);
            expect(tableOf([], { "w:w": 3000 }, { "w:type": "pct" }).fit).to.deep.equal({});
            expect(tableOf([{ "w:tblLayout": { _attr: { "w:type": "fixed" } } }], undefined).fit).to.equal(undefined);
            // Every cell with a width, which Word widens a column of for a word longer than its cells give it, unless the
            // table is laid out fixed
            expect(tableOf([], { "w:w": 3000 }, { "w:w": 2500, "w:type": "pct" }).widen).to.deep.equal({ acrossColumns: false });
            expect(tableOf(tableWidth({ "w:w": 9000, "w:type": "dxa" }), { "w:w": 3000 }).widen).to.deep.equal({
                width: 450,
                acrossColumns: false,
            });
            expect(tableOf([], { "w:w": 3000 }, undefined).widen).to.equal(undefined);
            expect(tableOf([{ "w:tblLayout": { _attr: { "w:type": "fixed" } } }], { "w:w": 3000 }).widen).to.equal(undefined);
            // The cells keep the widths they give themselves, and their margins either side, to be sized by
            expect(
                tableOf([], { "w:w": 3000 }, undefined).rows[0].cells.map(({ ownWidth, marginLeft, marginRight }) => ({
                    ownWidth,
                    marginLeft,
                    marginRight,
                })),
            ).to.deep.equal([
                { ownWidth: 150, marginLeft: 5.4, marginRight: 5.4 },
                { ownWidth: undefined, marginLeft: 5.4, marginRight: 5.4 },
            ]);
        });

        it("should read the columns a cell is across and the table's side borders, to size a table given no widths by", () => {
            const tableOf = (properties: readonly object[], ...rows: readonly (readonly object[])[]): TableBlock =>
                readBody([
                    {
                        "w:tbl": [
                            { "w:tblPr": properties },
                            { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 1000 } } }, { "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                            ...rows.map((cells) => ({ "w:tr": cells })),
                        ],
                    },
                ]).blocks[0].block as TableBlock;
            const inner = { "w:tbl": [{ "w:tr": [cell([], p(r(t("inner"))))] }] };
            const borders = {
                "w:tblBorders": [
                    { "w:left": { _attr: { "w:val": "single", "w:sz": 4 } } },
                    { "w:right": { _attr: { "w:val": "single", "w:sz": 12 } } },
                ],
            };
            const sized = tableOf([borders], [cell([value("w:gridSpan", 2)], p(r(t("a"))))], [cell([], inner, p()), cell([], p())]);
            // Neither a cell across columns nor a table in a cell stops the layout. The cell keeps the columns it is across,
            // and those of one column have none written
            expect(sized).to.deep.include({ fit: {}, borderLeft: 0.5, borderRight: 1.5 });
            expect(sized.unsupported).to.equal(undefined);
            expect(sized.rows.map(({ cells }) => cells.map(({ column, span }) => ({ column, span })))).to.deep.equal([
                [{ column: 0, span: 2 }],
                [
                    { column: 0, span: undefined },
                    { column: 1, span: undefined },
                ],
            ]);
            expect(tableOf([]).borderLeft).to.equal(0);
            // A table whose cells all have widths has its columns widened for long words as it is laid out, unless they are
            // merged across them
            const width = { "w:tcW": { _attr: { "w:w": 3000 } } };
            expect(tableOf([], [cell([width, value("w:gridSpan", 2)], p(r(t("a"))))]).widen).to.deep.equal({ acrossColumns: true });
            expect(tableOf([], [cell([width], p(r(t("a")))), cell([width], p(r(t("b"))))]).widen).to.deep.equal({ acrossColumns: false });
        });

        it("should stop at a table given no widths of more columns than Word's 63, rather than count each of them", () => {
            const across = (span: number): TableBlock =>
                readBody([{ "w:tbl": [{ "w:tr": [cell([value("w:gridSpan", span)], p(r(t("a"))))] }] }]).blocks[0].block as TableBlock;
            expect(across(63).unsupported).to.equal(undefined);
            expect(across(2 ** 32).unsupported).to.equal("a table given no widths of more than 63 columns");
            // Counted row by row, so a table of more rows than a function takes arguments is read
            const tall = readBody([{ "w:tbl": Array.from({ length: 40000 }, () => ({ "w:tr": [cell([]), cell([]), cell([])] })) }]);
            expect((tall.blocks[0].block as TableBlock).rows).to.have.length(40000);
        });

        it("should read the paragraphs in content controls and custom XML in a cell", () => {
            const content = readBody([
                {
                    "w:tbl": [
                        {
                            "w:tr": [
                                {
                                    "w:tc": [
                                        { "w:sdt": [{ "w:sdtContent": [p(r(t("controlled")))] }] },
                                        { "w:customXml": [p(r(t("custom")))] },
                                        { "w:bookmarkEnd": {} },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ]);
            const [first] = (content.blocks[0].block as TableBlock).rows[0].cells;
            expect(
                first.blocks.map((block) =>
                    (block as ParagraphBlock).items.map((item) => (item.type === "text" ? item.text : "")).join(""),
                ),
            ).to.deep.equal(["controlled", "custom"]);
        });

        it("should mark a table with something unsupported in a cell as unsupported", () => {
            const content = readBody([{ "w:tbl": [{ "w:tr": [{ "w:tc": [p({ "m:oMath": [] })] }] }] }]);
            expect((content.blocks[0].block as TableBlock).unsupported).to.equal("an equation");
        });
    });

    describe("the body", () => {
        it("should read the blocks in content controls and custom XML, and mark imported documents as unsupported", () => {
            const content = readBody([
                { "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": [p(r(t("controlled")))] }] },
                { "w:customXml": [p(r(t("custom")))] },
                { "w:altChunk": { _attr: { "r:id": "rId9" } } },
                { "w:unknown": [] },
            ]);
            expect(
                content.blocks.map(({ block }) =>
                    block.type === "paragraph" ? (block.unsupported ?? textOf({ ...content, blocks: [{ block, section: 0 }] })) : "table",
                ),
            ).to.deep.equal(["controlled", "custom", "an imported document"]);
        });

        it("should start a bookmark between blocks with the next paragraph", () => {
            const content = readBody([
                { "w:bookmarkStart": { _attr: { "w:name": "before", "w:id": 1 } } },
                { "w:tbl": [{ "w:tr": [{ "w:tc": [p()] }] }] },
                p(r(t("a"))),
            ]);
            expect(itemsOf(content, 1)[0]).to.deep.equal({ type: "marker", name: "before" });
        });

        it("should mark an empty paragraph that holds its section's properties as a section break", () => {
            const content = readBody([
                p(pPr({ "w:sectPr": [] })),
                p(pPr({ "w:sectPr": [] }), r(t("text"))),
                { "w:bookmarkStart": { _attr: { "w:name": "before", "w:id": 1 } } },
                p(pPr({ "w:sectPr": [] })),
                p(),
            ]);
            expect(content.blocks.map(({ block }) => (block as ParagraphBlock).sectionBreak)).to.deep.equal([
                true,
                undefined,
                undefined,
                undefined,
            ]);
        });

        it("should put each block in the section it ends with, and give a body without sections one of Word's defaults", () => {
            const content = readBody([p(pPr({ "w:sectPr": [] })), p(r(t("last")))]);
            expect(content.blocks.map(({ section }) => section)).to.deep.equal([0, 1]);
            expect(content.sections).to.have.length(2);
            expect(content.sections[1]).to.deep.include({
                pageWidth: 612,
                pageHeight: 792,
                marginTop: 72,
                start: "nextPage",
                numberFormat: "decimal",
            });
        });
    });

    describe("sections", () => {
        const section = (...children: readonly unknown[]): DocumentContent => readBody([{ "w:sectPr": children }]);

        it("should read the page's size and margins, how the section starts, and its page numbering", () => {
            const [read] = section(
                { "w:pgSz": { _attr: { "w:w": 12240, "w:h": 15840 } } },
                {
                    "w:pgMar": {
                        _attr: {
                            "w:top": -1440,
                            "w:bottom": 720,
                            "w:start": 1800,
                            "w:end": 1080,
                            "w:header": 360,
                            "w:footer": 540,
                            "w:gutter": 200,
                        },
                    },
                },
                value("w:type", "oddPage"),
                { "w:titlePg": {} },
                { "w:pgNumType": { _attr: { "w:fmt": "upperRoman", "w:start": 3 } } },
            ).sections;
            expect(read).to.deep.equal({
                pageWidth: 612,
                pageHeight: 792,
                marginTop: -72,
                marginBottom: 36,
                marginLeft: 90,
                marginRight: 54,
                header: 18,
                footer: 27,
                gutter: 10,
                start: "oddPage",
                titlePage: true,
                // The width of the page's text: 612 less the margins and the gutter
                columns: [458],
                numberFormat: "upperRoman",
                firstNumber: 3,
                headers: {},
                footers: {},
            });
            expect(section(value("w:type", "sideways")).sections[0].start).to.equal("nextPage");
        });

        it("should read the level of the headings that number chapters, and what goes between their numbers and the page's", () => {
            const chaptersOf = (attributes: object): object | undefined =>
                section({ "w:pgNumType": { _attr: attributes } }).sections[0].chapters;
            // Word puts a hyphen when the section doesn't say
            expect(chaptersOf({ "w:chapStyle": 1 })).to.deep.equal({ level: 1, separator: "-" });
            expect(
                ["hyphen", "period", "colon", "emDash", "enDash"].map((separator) =>
                    chaptersOf({ "w:chapStyle": 9, "w:chapSep": separator }),
                ),
            ).to.deep.equal(["-", ".", ":", "\u2014", "\u2013"].map((separator) => ({ level: 9, separator })));
            // There are only 9 levels of headings
            expect(chaptersOf({ "w:chapStyle": 0 })).to.equal(undefined);
            expect(chaptersOf({ "w:chapStyle": 10 })).to.equal(undefined);
            expect(chaptersOf({ "w:chapSep": "colon" })).to.equal(undefined);
        });

        it("should read the width of each column: the same, with the space between them, or each its own", () => {
            const columnsOf = (columns: object): readonly number[] => section({ "w:cols": columns }).sections[0].columns;
            // The page's text is 468 points wide, with half an inch between columns unless the section says otherwise
            expect(columnsOf({ _attr: { "w:num": 2 } })).to.deep.equal([216, 216]);
            expect(columnsOf({ _attr: { "w:num": 3, "w:space": 360 } })).to.deep.equal([144, 144, 144]);
            expect(columnsOf({ _attr: { "w:space": 720 } })).to.deep.equal([468]);
            expect(
                columnsOf([
                    { _attr: { "w:equalWidth": 0 } },
                    { "w:col": { _attr: { "w:w": 4000, "w:space": 720 } } },
                    { "w:col": { _attr: {} } },
                ]),
            ).to.deep.equal([200, 0]);
            // Columns of their own widths are only read when the section says their widths aren't the same
            expect(columnsOf([{ _attr: { "w:num": 2 } }, { "w:col": { _attr: { "w:w": 4000 } } }])).to.deep.equal([216, 216]);
            expect(section().sections[0].columns).to.deep.equal([468]);
        });

        it("should mark sections with a line grid, page numbers in a format not yet written or text down the page as unsupported, but not columns of different widths", () => {
            const given = (...widths: readonly number[]): object => ({
                "w:cols": [{ _attr: { "w:equalWidth": 0 } }, ...widths.map((width) => ({ "w:col": { _attr: { "w:w": width } } }))],
            });
            expect(section(given(4000, 3000)).sections[0].unsupported).to.equal(undefined);
            expect(section({ "w:docGrid": { _attr: { "w:type": "lines" } } }).sections[0].unsupported).to.equal("a document grid");
            expect(section({ "w:pgNumType": { _attr: { "w:fmt": "none" } } }).sections[0].unsupported).to.equal(
                "page numbers in a format not yet written",
            );
            expect(section({ "w:textDirection": { _attr: { "w:val": "tbRl" } } }).sections[0].unsupported).to.equal(
                "text that runs down the page",
            );
        });

        it("should read the headers and footers a section refers to, and those of the section before it doesn't give", () => {
            const header = (text: string): Header => new Header({ children: [new Paragraph(text)] });
            const content = readWritten({
                sections: [
                    {
                        headers: { default: header("one"), first: header("first") },
                        footers: { even: new Footer({ children: [new Paragraph("even")] }) },
                        children: [new Paragraph("a")],
                    },
                    { headers: { default: header("two") }, children: [new Paragraph("b")] },
                ],
            });
            const texts = (blocks?: readonly unknown[]): string | undefined =>
                blocks && textOf({ ...content, blocks: [{ block: blocks[0] as ParagraphBlock, section: 0 }] });
            const [first, second] = content.sections;
            expect([texts(first.headers.default), texts(first.headers.first), texts(first.footers.even)]).to.deep.equal([
                "one",
                "first",
                "even",
            ]);
            expect([texts(second.headers.default), texts(second.headers.first), texts(second.footers.even)]).to.deep.equal([
                "two",
                "first",
                "even",
            ]);
        });

        it("should leave out headers it can't find, and references to kinds of pages that don't exist", () => {
            const [read] = section(
                { "w:headerReference": { _attr: { "w:type": "default", "r:id": "rId99" } } },
                { "w:footerReference": { _attr: { "w:type": "sideways", "r:id": "rId98" } } },
            ).sections;
            expect(read.headers).to.deep.equal({});
            expect(read.footers).to.deep.equal({});
        });

        it("should leave out drawings, VML and footnote references in headers, which don't take room in them, and read a header once", () => {
            const file = new File({ sections: [{ headers: { default: new Header({ children: [] }) }, children: [] }] });
            const [wrapper] = file.Headers;
            // A watermark, a picture text would flow around in the body, and a footnote reference, which has no note there
            // eslint-disable-next-line functional/immutable-data
            wrapper.View.prepForXml = (): IXmlableObject => ({
                "w:hdr": [
                    p(
                        r({ "w:pict": [] }),
                        r({ "w:drawing": [{ "wp:anchor": [{ "wp:wrapSquare": {} }] }] }),
                        r({ "w:footnoteReference": { _attr: { "w:id": 1 } } }),
                        r(t("text")),
                    ),
                ],
            });
            const id = `rId${wrapper.View.ReferenceId}`;
            const content = readDocument(
                {
                    "w:body": [
                        {
                            "w:sectPr": [
                                { "w:headerReference": { _attr: { "r:id": id } } },
                                { "w:headerReference": { _attr: { "w:type": "even", "r:id": id } } },
                            ],
                        },
                    ],
                } as IXmlableObject,
                contextOf(file),
            );
            const { headers } = content.sections[0];
            expect(headers.default).to.equal(headers.even);
            expect(headers.default).to.deep.equal([
                {
                    type: "paragraph",
                    items: [{ type: "text", text: "text", font: {} }],
                    format: {},
                    tabStops: [],
                    markFont: {},
                    style: "Normal",
                },
            ]);
        });
    });

    describe("settings", () => {
        it("should read the default tab stop, whether even pages have their own headers, and how paragraphs are spaced", () => {
            const content = readBody([], {
                defaultTabStop: 360,
                evenAndOddHeaderAndFooters: true,
                compatibility: { doNotUseHTMLParagraphAutoSpacing: true },
            });
            expect(content).to.deep.include({ defaultTabStop: 18, evenAndOddHeaders: true, addsParagraphSpacing: true });
            expect(content.unsupported).to.equal(undefined);
            expect(readBody([])).to.deep.include({ defaultTabStop: 36, evenAndOddHeaders: false, addsParagraphSpacing: false });
        });

        it("should mark a document that hyphenates its words as unsupported", () => {
            expect(readBody([], { hyphenation: { autoHyphenation: true } }).unsupported).to.equal("hyphenation");
        });

        /** Reads a document whose settings are these elements, which docx doesn't write, in Word 2013's compatibility mode */
        const readSettings = (...settings: readonly object[]): DocumentContent => {
            const file = new File({ sections: [] });
            const compatibility = { "w:compat": [{ "w:compatSetting": { _attr: { "w:name": "compatibilityMode", "w:val": 15 } } }] };
            const withSettings = Object.create(file, {
                Settings: { value: { prepForXml: () => ({ "w:settings": [...settings, compatibility] }) } },
            }) as File;
            return readDocument({ "w:body": [] } as IXmlableObject, contextOf(withSettings));
        };

        it("should read the document's own lists of the characters that can't start or end a line, for their languages", () => {
            const kinsoku = (name: string, lang: string, val?: string): object => ({
                [name]: { _attr: { "w:lang": lang, ...(val === undefined ? {} : { "w:val": val }) } },
            });
            // cspell:disable
            const content = readSettings(
                kinsoku("w:noLineBreaksBefore", "ja-JP", "、。"),
                kinsoku("w:noLineBreaksAfter", "ja-JP", "「"),
                kinsoku("w:noLineBreaksAfter", "zh-TW"),
                kinsoku("w:noLineBreaksBefore", "en-US", "!"),
            );
            expect(content.breakRules).to.deep.equal({
                lists: { japanese: { noLineStart: "、。", noLineEnd: "「" }, traditionalChinese: { noLineEnd: "" } },
            });
            // cspell:enable
            expect(content.unsupported).to.equal(undefined);
            expect(readBody([]).breakRules).to.equal(undefined);
        });

        it("should mark a document with Word's strict rules for the first and last characters of lines, or that compresses punctuation, as unsupported", () => {
            expect(readSettings({ "w:strictFirstAndLastChars": {} }).unsupported).to.equal(
                "the strict rules for the characters that can't start a line",
            );
            expect(readSettings(value("w:characterSpacingControl", "compressPunctuation")).unsupported).to.equal("punctuation compressed");
            expect(readSettings(value("w:characterSpacingControl", "doNotCompress")).unsupported).to.equal(undefined);
        });

        it("should mark a document in the compatibility mode of a version of Word before 2013 as unsupported", () => {
            expect(readBody([], { compatibility: { version: 14 } }).unsupported).to.equal("a document in compatibility mode");
            expect(readBody([], { compatibility: { version: 15 } }).unsupported).to.equal(undefined);
        });
    });

    describe("lengths", () => {
        type Length = number | `${number}${"in" | "pt" | "pc" | "pi"}`;

        /** A document of every length docx takes a string for that the layout reads, each given by `length` */
        const writtenWith = (length: (twips: number, measure: `${number}${"in" | "pt" | "pc" | "pi"}`) => Length): DocumentContent =>
            readWritten({
                sections: [
                    {
                        properties: {
                            page: {
                                size: { width: length(12240, "8.5in"), height: length(15840, "11in") },
                                margin: {
                                    top: length(1440, "1in"),
                                    bottom: length(1440, "72pt"),
                                    left: length(2160, "9pc"),
                                    right: length(1440, "6pi"),
                                    header: length(720, "0.5in"),
                                    footer: length(720, "36pt"),
                                    gutter: length(360, "0.25in"),
                                },
                            },
                            column: { count: 2, space: length(720, "0.5in") },
                        },
                        children: [
                            new Paragraph({
                                indent: { left: length(720, "0.5in"), right: length(360, "18pt"), hanging: length(360, "0.25in") },
                                children: [new TextRun({ text: "Indented", size: length(24, "12pt"), characterSpacing: 20 })],
                            }),
                            new Paragraph({ indent: { firstLine: length(360, "18pt") }, children: [new TextRun("First line")] }),
                            new Table({
                                width: { size: length(4320, "3in"), type: WidthType.DXA },
                                // docx's columnWidths takes only numbers
                                columnWidths: [1440, 2880],
                                rows: [
                                    new TableRow({
                                        height: { value: length(720, "0.5in"), rule: HeightRule.ATLEAST },
                                        children: [
                                            new TableCell({
                                                width: { size: length(1440, "1in"), type: WidthType.DXA },
                                                children: [new Paragraph("A")],
                                            }),
                                            new TableCell({
                                                width: { size: length(2880, "2in"), type: WidthType.DXA },
                                                children: [new Paragraph("B")],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });

        it('should read lengths docx writes with units, such as "1in" or "12pt", as the same lengths given in numbers', () => {
            const inNumbers = writtenWith((twips) => twips);
            const withUnits = writtenWith((_, measure) => measure);
            expect(withUnits.sections).to.deep.equal(inNumbers.sections);
            expect(withUnits.blocks).to.deep.equal(inNumbers.blocks);
            expect(withUnits.sections[0]).to.deep.include({ pageWidth: 612, marginLeft: 108, gutter: 18, columns: [189, 189] });
            expect(itemsOf(withUnits)).to.deep.equal([{ type: "text", text: "Indented", font: { size: 12, characterSpacing: 1 } }]);
            expect(paragraphOf(withUnits).format).to.deep.include({ indentLeft: 36, indentRight: 18, firstLineIndent: -18 });
        });

        it("should stop at a size in a unit other than points, and a negative fraction of a centimeter or millimeter, wherever it is", () => {
            const SIZE = "a size given in a unit other than points";
            const NEGATIVE = "a negative length of a fraction of a centimeter or millimeter";
            const ind = (left: string): object => pPr({ "w:ind": { _attr: { "w:left": left } } });
            // Word ignores a size in centimeters where no style gives one, so it may take another style's
            expect(paragraphOf(readBody([p(r(rPr(value("w:sz", "1cm")), t("Text")))])).unsupported).to.equal(SIZE);
            expect(paragraphOf(readBody([p(ind("-1.5cm"), r(t("Text")))])).unsupported).to.equal(NEGATIVE);
            expect(paragraphOf(readBody([p(ind("-1cm"), r(rPr(value("w:sz", "11.5pt")), t("Text")))])).unsupported).to.equal(undefined);
            const table = (properties: object): DocumentContent =>
                readBody([{ "w:tbl": [{ "w:tblPr": [properties] }, { "w:tr": [{ "w:tc": [p(r(t("Cell")))] }] }] }]);
            expect(table({ "w:tblInd": { _attr: { "w:w": "-0.5mm", "w:type": "dxa" } } }).blocks[0].block.unsupported).to.equal(NEGATIVE);
            expect(table({ "w:tblInd": { _attr: { "w:w": "-1mm", "w:type": "dxa" } } }).blocks[0].block.unsupported).to.equal(undefined);
            const section = readBody([{ "w:sectPr": [{ "w:pgMar": { _attr: { "w:top": "-2.5cm" } } }] }]).sections[0];
            expect(section.unsupported).to.equal(NEGATIVE);
            // In the styles, lists and settings, it stops the document
            expect(readBody([], { styles: { default: { document: { run: { size: "0.2in" } } } } }).unsupported).to.equal(SIZE);
            expect(
                readBody([], {
                    numbering: { config: [{ reference: "list", levels: [{ level: 0, text: "%1.", style: { run: { size: "1pc" } } }] }] },
                }).unsupported,
            ).to.equal(SIZE);
            expect(readBody([], { defaultTabStop: "-1.5cm" as unknown as number }).unsupported).to.equal(NEGATIVE);
            expect(readBody([]).unsupported).to.equal(undefined);
        });
    });

    it("should read headings as they are written, with their bookmarks from the table of contents", () => {
        const content = readWritten({
            sections: [{ children: [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Title")] })] }],
        });
        expect(textOf(content)).to.equal("Title");
    });

    it("should read docx's Heading 4 in italics, and a right-to-left run in the italics of complex scripts", () => {
        const content = readWritten({
            sections: [
                {
                    children: [
                        new Paragraph({ heading: HeadingLevel.HEADING_4, children: [new TextRun("Heading")] }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "a", italics: true, rightToLeft: true }),
                                new TextRun({ text: "b", italics: true, italicsComplexScript: false, rightToLeft: true }),
                            ],
                        }),
                    ],
                },
            ],
        });
        expect(itemsOf(content)).to.deep.equal([{ type: "text", text: "Heading", font: { italic: true } }]);
        expect(itemsOf(content, 1)).to.deep.equal([
            { type: "text", text: "a", font: { italic: true } },
            { type: "text", text: "b", font: {} },
        ]);
    });
});
