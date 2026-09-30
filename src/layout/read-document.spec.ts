import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IPropertiesOptions } from "@file/core-properties";
import { File } from "@file/file";
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

import { type DocumentContent, type LayoutItem, type ParagraphBlock, type TableBlock, readDocument } from "./read-document";

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
            ).to.deep.equal(["a", "tab", "tab", "page", "column", "line", "line", "‑", "■", "1", "CAPS"]);
            expect(itemsOf(content)[9]).to.deep.equal({ type: "text", text: "1", font: { size: 6.5 } });
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
            expect(paragraphOf(readBody([p(r({ "w:footnoteReference": { _attr: { "w:id": 1 } } }))])).unsupported).to.equal("a footnote");
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
            ]);
            expect([0, 1, 2, 3].map((index) => textOf(content, index))).to.deep.equal(["above", "iv", "[a]", "?"]);
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
                        { level: 3, format: LevelFormat.DECIMAL_ENCLOSED_CIRCLE, text: "%4", alignment: AlignmentType.START },
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
    });

    describe("tables", () => {
        const cell = (properties: readonly unknown[], ...paragraphs: readonly object[]): object => ({
            "w:tc": [{ "w:tcPr": properties }, ...paragraphs],
        });

        it("should read each cell's width from the grid, less its margins, and its rows' heights and borders", () => {
            const content = readBody([
                {
                    "w:tbl": [
                        {
                            "w:tblPr": [
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
            expect(rows[1].cells[0]).to.deep.include({ width: 200 - 5 - 5.4, verticalMerge: "continue" });
            expect(rows[2].cells.map(({ width, verticalMerge }) => ({ width, verticalMerge }))).to.deep.equal([
                { width: 100 - 5 - 5.4, verticalMerge: "restart" },
                { width: 200 - 5 - 5.4, verticalMerge: undefined },
                // The third column has no width
                { width: -10.4, verticalMerge: undefined },
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
            const content = readBody([{ "w:tbl": [{ "w:tr": [{ "w:tc": [p(r({ "w:footnoteReference": {} }))] }] }] }]);
            expect((content.blocks[0].block as TableBlock).unsupported).to.equal("a footnote");
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
                numberFormat: "upperRoman",
                firstNumber: 3,
                headers: {},
                footers: {},
            });
            expect(section(value("w:type", "sideways")).sections[0].start).to.equal("nextPage");
        });

        it("should mark sections with columns, a line grid, chapter numbers or text down the page as unsupported", () => {
            expect(section({ "w:cols": { _attr: { "w:num": 2 } } }).sections[0].unsupported).to.equal("columns");
            expect(section({ "w:cols": [{ "w:col": {} }, { "w:col": {} }] }).sections[0].unsupported).to.equal("columns");
            expect(section({ "w:cols": { _attr: { "w:space": 720 } } }).sections[0].unsupported).to.equal(undefined);
            expect(section({ "w:docGrid": { _attr: { "w:type": "lines" } } }).sections[0].unsupported).to.equal("a document grid");
            expect(section({ "w:pgNumType": { _attr: { "w:chapStyle": 1 } } }).sections[0].unsupported).to.equal(
                "page numbers in a format not yet written",
            );
            expect(section({ "w:pgNumType": { _attr: { "w:fmt": "hebrew1" } } }).sections[0].unsupported).to.equal(
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

        it("should leave out drawings and VML in headers, which don't take room in them, and read a header once", () => {
            const file = new File({ sections: [{ headers: { default: new Header({ children: [] }) }, children: [] }] });
            const [wrapper] = file.Headers;
            // A watermark, and a picture text would flow around in the body
            // eslint-disable-next-line functional/immutable-data
            wrapper.View.prepForXml = (): IXmlableObject => ({
                "w:hdr": [p(r({ "w:pict": [] }), r({ "w:drawing": [{ "wp:anchor": [{ "wp:wrapSquare": {} }] }] }), r(t("text")))],
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
    });

    it("should read headings as they are written, with their bookmarks from the table of contents", () => {
        const content = readWritten({
            sections: [{ children: [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Title")] })] }],
        });
        expect(textOf(content)).to.equal("Title");
    });
});
