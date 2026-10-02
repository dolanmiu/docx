import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IPropertiesOptions } from "@file/core-properties";
import { File } from "@file/file";
import { FootnoteReferenceRun } from "@file/footnotes";
import type { ICompatibilityOptions } from "@file/settings/compatibility";
import { HeightRule, Table, TableCell, TableRow, WidthType } from "@file/table";
import { DeletedTextRun } from "@file/track-revision";
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

/**
 * Reads a body of formatted elements, with the styles, lists and notes of a document with the options, and settings of
 * these elements, which docx doesn't write, in Word 2013's compatibility mode
 */
const readWithSettings = (
    elements: readonly unknown[],
    settings: readonly object[],
    options: Partial<IPropertiesOptions> = {},
): DocumentContent => {
    const file = new File({ sections: [], ...options });
    const compatibility = { "w:compat": [{ "w:compatSetting": { _attr: { "w:name": "compatibilityMode", "w:val": 15 } } }] };
    const withSettings = Object.create(file, {
        Settings: { value: { prepForXml: () => ({ "w:settings": [...settings, compatibility] }) } },
    }) as File;
    return readDocument({ "w:body": elements } as IXmlableObject, contextOf(withSettings));
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
                    r(
                        rPr({ "w:vanish": {} }),
                        t("hidden"),
                        { "w:tab": {} },
                        { "w:br": {} },
                        { "w:cr": {} },
                        { "w:noBreakHyphen": {} },
                        { "w:sym": { _attr: { "w:char": "F0A7" } } },
                    ),
                    r(rPr({ "w:caps": {} }), t("caps")),
                ),
            ]);
            expect(
                itemsOf(content).map((item) => (item.type === "break" ? item.kind : item.type === "text" ? item.text : item.type)),
            ).to.deep.equal(["a", "tab", "tab", "page", "column", "line", "line", "\u2011", "\uf0a7", "marker", "i", "CAPS"]);
            // An endnote's reference: the marker its bookmarks and fields are placed by, and its number, in its run's font,
            // numbered as Word numbers endnotes
            expect(itemsOf(content).slice(9, 11)).to.deep.equal([
                { type: "marker", name: "endnote 1" },
                { type: "text", text: "i", font: {} },
            ]);
        });

        it("should read superscript, raised text, emphasis marks and borders into the font text is laid out in", () => {
            const bdr = (style: string): object => ({ "w:bdr": { _attr: { "w:val": style, "w:sz": 4, "w:space": 4 } } });
            const content = readBody([
                p(
                    r(rPr(value("w:vertAlign", "superscript"), value("w:sz", 22)), t("2")),
                    r(rPr(value("w:position", 12), value("w:em", "underDot"), bdr("single")), t("up")),
                ),
            ]);
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "2", font: { size: 7, lineSize: 11 } },
                {
                    type: "text",
                    text: "up",
                    font: { raise: 6, emphasis: "below", border: { room: 4.5, key: '[["w:space","4"],["w:sz","4"],["w:val","single"]]' } },
                },
            ]);
            // A border on the paragraph's mark is in its font, and takes no room in its line (word-run-formatting.ts RF8d)
            expect(paragraphOf(readBody([p(pPr(rPr(bdr("single"))))])).markFont.border?.room).to.equal(4.5);
        });

        it("should stop at a run's formatting whose room Word hasn't shown, and at tabs and pictures in a box", () => {
            const bdr = (style: string): object => ({ "w:bdr": { _attr: { "w:val": style, "w:sz": 4, "w:space": 0 } } });
            const stopsAt = (...children: readonly unknown[]): string | undefined => paragraphOf(readBody([p(...children)])).unsupported;
            expect(stopsAt(r(rPr(bdr("thinThickMediumGap")), t("a")))).to.equal("a run border of a style, width or space not yet followed");
            expect(stopsAt(r(rPr(bdr("single")), { "w:tab": {} }))).to.equal("a tab in text with a border");
            expect(stopsAt(r(rPr(bdr("single")), t("a\tb")))).to.equal("a tab in text with a border");
            expect(stopsAt(r(rPr({ "w:vanish": {} }, bdr("single")), t("a\tb")))).to.equal(undefined);
            expect(stopsAt(r(rPr(bdr("single")), { "w:drawing": [{ "wp:inline": [] }] }))).to.equal("a picture in text with a border");
            expect(stopsAt(r(rPr(value("w:position", "-2.5pt")), t("a")))).to.equal("a lowered position of a fraction of its unit");
            // Hidden text takes no room, whatever its formatting
            expect(stopsAt(r(rPr({ "w:vanish": {} }, bdr("wave")), t("a")))).to.equal(undefined);
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

        it("should give the space in lines as 12 points a line, in place of the space in twips, as Word does (TX7d)", () => {
            const spacing = (attributes: Record<string, unknown>): ParagraphBlock =>
                paragraphOf(readBody([p(pPr({ "w:spacing": { _attr: attributes } }), r(t("a")))]));
            expect(spacing({ "w:beforeLines": 100, "w:afterLines": "50" }).format).to.deep.include({ spaceBefore: 12, spaceAfter: 6 });
            expect(spacing({ "w:before": 600, "w:beforeLines": 100, "w:after": 200, "w:afterLines": 0 }).format).to.deep.include({
                spaceBefore: 12,
                spaceAfter: 10,
            });
        });

        it("should make a character of an indent as wide as the first character is tall, or the mark for a left indent, as Word does (TX7, C1 to C16)", () => {
            /** A paragraph with an indent, a mark of a size, 11 points as its style's or another, and runs of text */
            const indented = (attributes: Record<string, unknown>, mark: number, ...runs: readonly object[]): ParagraphBlock =>
                paragraphOf(
                    readBody([p(pPr({ "w:ind": { _attr: attributes } }, ...(mark === 22 ? [] : [rPr(value("w:sz", mark))])), ...runs)], {
                        styles: { default: { document: { run: { size: 22 } } } },
                    }),
                );
            const sized = (size: number, text = "text"): object => r(rPr(value("w:sz", size)), t(text));
            const big = sized(40);
            // The first character's size, not the mark's or the rest of the text's (TX7a, TX7b, C5, C6, C12)
            expect(indented({ "w:firstLineChars": 200 }, 22, big, sized(22)).format).to.deep.include({ firstLineIndent: 40 });
            expect(indented({ "w:firstLineChars": 200 }, 40, sized(22), big).format).to.deep.include({ firstLineIndent: 22 });
            // An empty paragraph's characters are as tall as its mark
            expect(indented({ "w:firstLineChars": 200 }, 22).format).to.deep.include({ firstLineIndent: 22 });
            // A left indent in the mark's size, and a first line's from it, or from a left indent in twips (C1, C4, C8, C11)
            expect(indented({ "w:leftChars": 400, "w:firstLineChars": 200 }, 22, big).format).to.deep.include({
                indentLeft: 44,
                firstLineIndent: 40,
            });
            expect(indented({ "w:left": 720, "w:firstLineChars": 200 }, 22, big).format).to.deep.include({
                indentLeft: 36,
                firstLineIndent: 40,
            });
            // A hanging indent puts the first line at the left indent in characters, or 0, and the others that much further
            // in, whatever the left indent in twips and hanging indent in twips (TX7c, C3, C9, C11, C14)
            expect(indented({ "w:leftChars": 400, "w:hangingChars": 200 }, 22, big).format).to.deep.include({
                indentLeft: 84,
                firstLineIndent: -40,
            });
            expect(indented({ "w:left": 1440, "w:hangingChars": 200 }, 22, sized(22)).format).to.deep.include({
                indentLeft: 22,
                firstLineIndent: -22,
            });
            expect(
                indented({ "w:left": 720, "w:hanging": 360, "w:leftChars": 400, "w:hangingChars": 200 }, 22, sized(22)).format,
            ).to.deep.include({
                indentLeft: 66,
                firstLineIndent: -22,
            });
            // In place of those in twips, but for 0 (C2, C7, C10, C15)
            expect(indented({ "w:right": 720, "w:rightChars": 400 }, 22, sized(22)).format).to.deep.include({ indentRight: 44 });
            expect(indented({ "w:left": 720, "w:leftChars": 0 }, 22, big).format).to.deep.include({ indentLeft: 36 });
            expect(indented({ "w:firstLine": 720, "w:firstLineChars": 0 }, 22, big).format).to.deep.include({ firstLineIndent: 36 });
            expect(indented({ "w:startChars": 400 }, 22, big).format).to.deep.include({ indentLeft: 44 });
            // Where Word's sizes aren't known
            expect(indented({ "w:leftChars": 400 }, 22, big).unsupported).to.equal(undefined);
            expect(indented({ "w:leftChars": 400 }, 40, big).unsupported).to.equal(
                "an indent in characters left or right of a paragraph whose mark is another size than its style",
            );
            expect(indented({ "w:rightChars": 400 }, 22, big).unsupported).to.equal(
                "an indent in characters right of text of another size than its mark",
            );
            expect(indented({ "w:leftChars": 0, "w:hangingChars": 200 }, 22, sized(22)).format).to.deep.include({ indentLeft: 22 });
            expect(indented({ "w:leftChars": 0, "w:left": 720, "w:hangingChars": 200 }, 22, big).unsupported).to.equal(
                "an indent in characters hanging from a left indent in twips",
            );
            expect(indented({ "w:leftChars": 400, "w:firstLine": 360 }, 22, big).unsupported).to.equal(
                "an indent in characters left of a first line indent in twips",
            );
            // Page numbers are the paragraph's text too, and text without a size is Word's default 10 points
            const fields = [
                ...[field("begin"), instruction(" PAGEREF here "), field("separate"), r(t("9")), field("end")],
                ...[field("begin"), instruction(" NUMPAGES "), field("separate"), r(t("9")), field("end")],
            ];
            const plain = (...runs: readonly object[]): ParagraphBlock =>
                paragraphOf(readBody([p(pPr({ "w:ind": { _attr: { "w:firstLineChars": 200 } } }), ...runs)]));
            expect(plain(...fields, r(t("text"))).format).to.deep.include({ firstLineIndent: 20 });
            expect(plain().format).to.deep.include({ firstLineIndent: 20 });
        });

        it("should stop at an indent in characters in a list whose number is another size than its text", () => {
            const content = readWritten({
                numbering: {
                    config: [
                        {
                            reference: "list",
                            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", style: { run: { size: 40 } } }],
                        },
                    ],
                },
                sections: [
                    {
                        children: [
                            new Paragraph({
                                numbering: { reference: "list", level: 0 },
                                indent: { firstLineChars: 200 },
                                children: [new TextRun("a")],
                            }),
                            new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun("b")] }),
                        ],
                    },
                ],
            });
            expect(paragraphOf(content, 0).unsupported).to.equal(
                "an indent in characters in a list whose number is another size than its text",
            );
            expect(paragraphOf(content, 1).list).to.deep.include({ level: 0 });
            expect(paragraphOf(content, 1).list!.id).to.equal(paragraphOf(content, 0).list!.id);
            expect(paragraphOf(content, 1).unsupported).to.equal(undefined);
        });

        it("should read the room a paragraph's top, bottom and between borders take, and what paragraphs in one box share (TX5, B5, B6)", () => {
            const border = (style: string, size?: number, space = 1, more: Record<string, unknown> = {}): object => ({
                _attr: { "w:val": style, ...(size === undefined ? {} : { "w:sz": size }), "w:space": space, ...more },
            });
            const bordered = (...sides: readonly object[]): ParagraphBlock =>
                paragraphOf(readBody([p(pPr({ "w:pBdr": sides }), r(t("a")))]));
            const box = bordered(
                { "w:top": border("single", 6) },
                { "w:bottom": border("single", 24, 4) },
                { "w:between": border("single", 6) },
            );
            expect(box.borders).to.deep.include({ top: 1.75, bottom: 7, between: 1.75, betweenSpace: 1 });
            expect(box.unsupported).to.equal(undefined);
            // Borders at the sides take no room, but tell boxes apart, as indents do and between borders
            const withLeft = bordered(
                { "w:top": border("single", 6) },
                { "w:bottom": border("single", 24, 4) },
                { "w:between": border("single", 6) },
                { "w:left": border("single", 6) },
            );
            expect(withLeft.borders).to.deep.include({ top: 1.75, bottom: 7, between: 1.75 });
            expect(withLeft.borders!.box).to.not.equal(box.borders!.box);
            const indented = paragraphOf(
                readBody([
                    p(
                        pPr(
                            {
                                "w:pBdr": [
                                    { "w:top": border("single", 6) },
                                    { "w:bottom": border("single", 24, 4) },
                                    { "w:between": border("single", 6) },
                                ],
                            },
                            { "w:ind": { _attr: { "w:left": 720 } } },
                        ),
                        r(t("a")),
                    ),
                ]),
            );
            expect(indented.borders!.box).to.not.equal(box.borders!.box);
            const without = bordered({ "w:top": border("single", 6) }, { "w:bottom": border("single", 24, 4) });
            expect(without.borders!.box).to.not.equal(box.borders!.box);
            expect(without.borders!.outline).to.equal(box.borders!.outline);
            expect(bordered({ "w:left": border("single", 6) }, { "w:top": border("none", 6) }).borders).to.equal(undefined);
            expect(bordered({ "w:top": border("single", 6) }).borders).to.deep.include({
                top: 1.75,
                bottom: 0,
                between: 0,
                betweenSpace: 0,
            });
            // The room each style takes as Word draws it, in points, with no space (B6)
            const roomOf = (style: string, size: number, more: Record<string, unknown> = {}): number | undefined =>
                bordered({ "w:top": border(style, size, 0, more) }).borders?.top;
            expect(
                ["single", "thick", "dotted", "dashed", "dotDash", "dotDotDash", "dashSmallGap", "inset", "outset"].map((style) =>
                    roomOf(style, 6),
                ),
            ).to.deep.equal(Array.from({ length: 9 }, () => 0.75));
            expect([
                roomOf("double", 6),
                roomOf("triple", 18),
                roomOf("wave", 6),
                roomOf("dashDotStroked", 18),
                roomOf("doubleWave", 6),
            ]).to.deep.equal([2.25, 11.25, 3, 3, 5.25]);
            expect(
                ["thinThickSmallGap", "thickThinSmallGap", "threeDEmboss", "threeDEngrave", "thinThickThinSmallGap"].map((style) =>
                    roomOf(style, 18),
                ),
            ).to.deep.equal([3.75, 3.75, 3.75, 3.75, 5.25]);
            expect(roomOf("single", 6, { "w:shadow": "1" })).to.equal(1.5);
            // Those Word hasn't been seen to draw
            for (const side of [
                border("thinThickMediumGap", 6),
                border("double", 6, 1, { "w:shadow": "1" }),
                border("single", 6, 1, { "w:frame": "on" }),
                border("apples", 6),
            ]) {
                expect(bordered({ "w:bottom": side }).unsupported).to.equal("a paragraph border of a style not yet followed");
            }
            for (const side of [
                border("single"),
                border("single", 1),
                border("single", 97),
                border("single", 6, 32),
                border("thinThickSmallGap", 2),
                border("threeDEmboss", 19),
            ]) {
                expect(bordered({ "w:top": side }).unsupported).to.equal("a paragraph border of a width or space not yet followed");
            }
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

        it("should stop at text with a phonetic guide, a content part, text fitted to a width, two lines in one, text across in vertical text, a subdocument and a paragraph in an HTML division", () => {
            const unsupportedOf = (...children: readonly unknown[]): string | undefined =>
                paragraphOf(readBody([p(...children)])).unsupported;
            // Its text would be lost, as it is in the guide and its base
            const ruby = { "w:ruby": [{ "w:rubyPr": [] }, { "w:rt": [r(t("guide"))] }, { "w:rubyBase": [r(t("base"))] }] };
            expect(unsupportedOf(r(ruby))).to.equal("text with a phonetic guide");
            expect(unsupportedOf(r({ "w:contentPart": { _attr: { "r:id": "rId9" } } }))).to.equal("a content part, such as ink");
            expect(unsupportedOf(r(rPr({ "w:fitText": { _attr: { "w:val": 2000 } } }), t("fitted")))).to.equal("text fitted to a width");
            const layout = (attributes: object): object => r(rPr({ "w:eastAsianLayout": { _attr: attributes } }), t("ab"));
            expect(unsupportedOf(layout({ "w:combine": 1 }))).to.equal("two lines in one");
            expect(unsupportedOf(layout({ "w:vert": "true" }))).to.equal("text across in vertical text");
            // With neither on, the run is laid out as it is
            expect(unsupportedOf(layout({ "w:id": 1, "w:combine": "off" }))).to.equal(undefined);
            // A run with nothing in it but its formatting has nothing to lay out
            expect(unsupportedOf(r(rPr({ "w:fitText": { _attr: { "w:val": 2000 } } })))).to.equal(undefined);
            expect(unsupportedOf({ "w:subDoc": { _attr: { "r:id": "rId9" } } })).to.equal("a subdocument");
            expect(unsupportedOf(pPr(value("w:divId", 12)), r(t("web")))).to.equal("a paragraph in an HTML division");
        });

        it("should read how a paragraph's lines line up, from its style or its own, and stop where Word's squeezing of them isn't known", () => {
            const content = readWritten({
                styles: { paragraphStyles: [{ id: "Justified", name: "Justified", paragraph: { alignment: AlignmentType.JUSTIFIED } }] },
                sections: [
                    {
                        children: [
                            new Paragraph({ style: "Justified", children: [new TextRun("a")] }),
                            new Paragraph({ style: "Justified", alignment: AlignmentType.DISTRIBUTE, children: [new TextRun("b")] }),
                            new Paragraph({ alignment: AlignmentType.THAI_DISTRIBUTE, children: [new TextRun("Latin")] }),
                            new Paragraph({ alignment: AlignmentType.LOW_KASHIDA, children: [new TextRun("Latin")] }),
                            new Paragraph({ alignment: AlignmentType.MEDIUM_KASHIDA, children: [new TextRun("c")] }),
                            new Paragraph({ alignment: AlignmentType.HIGH_KASHIDA, children: [new TextRun("c")] }),
                            new Paragraph({ alignment: AlignmentType.THAI_DISTRIBUTE, children: [new TextRun("\u0e44\u0e17\u0e22")] }),
                            new Paragraph({ alignment: AlignmentType.LOW_KASHIDA, children: [new TextRun("\u0639\u0631\u0628\u064a")] }),
                        ],
                    },
                ],
            });
            expect(paragraphOf(content, 0).format.alignment).to.equal("justified");
            expect(paragraphOf(content, 1).format.alignment).to.equal("distributed");
            // Word breaks Latin text justified for Thai or with a low kashida as it breaks justified text
            for (const index of [0, 1, 2, 3]) {
                expect(paragraphOf(content, index).unsupported).to.equal(undefined);
            }
            expect(paragraphOf(content, 4).unsupported).to.equal("a paragraph justified for Arabic with a medium or high kashida");
            expect(paragraphOf(content, 5).unsupported).to.equal("a paragraph justified for Arabic with a medium or high kashida");
            expect(paragraphOf(content, 6).unsupported).to.equal("Thai or Arabic text justified for it");
            expect(paragraphOf(content, 7).unsupported).to.equal("Thai or Arabic text justified for it");
        });
    });

    describe("footnotes and endnotes", () => {
        it("should read the footnotes the body refers to, by the markers at their references, with the separator above them", () => {
            const content = readBody(
                [
                    p(r(t("a"), { "w:footnoteReference": { _attr: { "w:id": 1 } } })),
                    p(r(rPr(value("w:rStyle", "FootnoteReference")), { "w:footnoteReference": { _attr: { "w:id": 7 } } })),
                ],
                { footnotes: { 1: { children: [new Paragraph("Note")] } } },
            );
            // A reference is the marker its footnote is placed by, and the footnote's number, in its run's font
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "a", font: {} },
                { type: "marker", name: "footnote 1" },
                { type: "text", text: "1", font: {} },
            ]);
            // The footnote starts with its number, in docx's FootnoteReference style, in superscript: 6.5 points of 10, in a
            // line of 10
            expect((content.footnotes.get("footnote 1")![0] as ParagraphBlock).items).to.deep.equal([
                { type: "text", text: "1", font: { size: 6.5, lineSize: 10 } },
                { type: "text", text: "Note", font: {} },
            ]);
            // A reference to a footnote the document doesn't have is numbered, and has nothing to place
            expect(itemsOf(content, 1)).to.deep.include({ type: "text", text: "2", font: { size: 6.5, lineSize: 10 } });
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
            // Each reference is a marker, which the endnote's bookmarks and fields are placed by, and its number
            expect(
                itemsOf(content).map((item) => (item.type === "text" ? item.text : item.type === "marker" ? item.name : "")),
            ).to.deep.equal(["endnote 1", "i", "endnote 2", "ii"]);
            expect(
                content.endnotes.map((block) => (block as ParagraphBlock).items.map((item) => (item.type === "text" ? item.text : ""))),
            ).to.deep.equal([[], ["i", "First"], ["ii", "Second"]]);
            expect([...content.endnoteReferences.values()]).to.deep.equal([[content.endnotes[1]], [content.endnotes[2]]]);
            // The number of the endnote each block is in, but the separator's
            expect(content.endnotes.map((block) => content.endnoteNumbers.get(block))).to.deep.equal([undefined, "i", "ii"]);
            expect(content.footnotes.size).to.equal(0);
            expect(content.footnoteSeparator).to.deep.equal([]);
            expect(content.footnoteContinuationSeparator).to.deep.equal([]);
            // The continuation separator above them on the pages after the first, which isn't read without them
            expect(content.endnoteContinuationSeparator).to.have.length(1);
            expect(readBody([]).endnoteContinuationSeparator).to.deep.equal([]);
        });

        it("should read the endnotes' separators a line of their style's text, whatever their own formatting, as Word lays them out", () => {
            const sized = rPr({ "w:sz": { _attr: { "w:val": 40 } } });
            /** A document whose line refers to an endnote, with the separators given */
            const withSeparators = (separator: readonly object[], continuation: readonly object[]): DocumentContent =>
                readContent(
                    { "w:body": [p(r({ "w:endnoteReference": { _attr: { "w:id": 1 } } })), p()] },
                    {
                        styles: {
                            ...WORD_DEFAULT_STYLES,
                            styles: new Map([
                                ...WORD_DEFAULT_STYLES.styles,
                                ["Large", { type: "paragraph", run: { size: 20 }, paragraph: { spaceBefore: 30 } }],
                            ]),
                        },
                        headersAndFooters: new Map(),
                        endnotes: {
                            "w:endnotes": [
                                ...(separator.length > 0
                                    ? [{ "w:endnote": [{ _attr: { "w:type": "separator", "w:id": -1 } }, ...separator] }]
                                    : []),
                                { "w:endnote": [{ _attr: { "w:type": "continuationSeparator", "w:id": 0 } }, ...continuation] },
                                { "w:endnote": [{ _attr: { "w:id": 1 } }, p(r(t("One")))] },
                            ],
                        },
                    },
                );
            // 400 before and exactly 1100 tall, and double spaced, in 20 points, all left out, as Word left them out
            // (`word-continued-endnotes.docx` CE3 to CE5)
            const formatted = withSeparators(
                [
                    p(
                        pPr({ "w:spacing": { _attr: { "w:before": 400, "w:line": 1100, "w:lineRule": "exact" } } }, sized),
                        r(sized, { "w:separator": {} }),
                    ),
                ],
                [
                    p(
                        pPr({ "w:spacing": { _attr: { "w:line": 480, "w:lineRule": "auto" } } }, sized),
                        r(sized, { "w:continuationSeparator": {} }),
                    ),
                ],
            );
            const plain = {
                type: "paragraph",
                items: [],
                format: {},
                tabStops: [],
                markFont: paragraphOf(formatted, 1).markFont,
                style: "Normal",
            };
            expect(formatted.endnotes[0]).to.deep.equal(plain);
            expect(formatted.endnoteContinuationSeparator).to.deep.equal([plain]);
            // In a style of their own, its text, in a content control too
            const styled = withSeparators([p(pPr(value("w:pStyle", "Large")), r(sized, { "w:separator": {} }))], []);
            expect(styled.endnotes[0]).to.deep.include({ style: "Large", format: {}, markFont: { size: 20 } });
            const controlled = withSeparators([{ "w:sdt": [{ "w:sdtContent": [p(pPr(value("w:pStyle", "Large")))] }] }], []);
            expect(controlled.endnotes[0]).to.deep.include({ style: "Large", markFont: { size: 20 } });
            // Its bookmarks kept, to be placed where it is
            const bookmarked = withSeparators(
                [p({ "w:bookmarkStart": { _attr: { "w:id": 1, "w:name": "above" } } }, r({ "w:separator": {} }))],
                [],
            );
            expect((bookmarked.endnotes[0] as ParagraphBlock).items).to.deep.equal([{ type: "marker", name: "above" }]);
            // One with an equation in it stops as an equation anywhere does
            expect(withSeparators([p({ "m:oMath": [] })], []).endnotes[0].unsupported).to.equal("an equation");
            // One with text in it, more than a paragraph or a table hasn't been seen
            const unknown = "an endnote separator with text in it, or of more than a paragraph";
            expect(withSeparators([p(r(t("Endnotes")))], []).endnotes[0].unsupported).to.equal(unknown);
            expect(withSeparators([p(), p()], []).endnotes[0].unsupported).to.equal(unknown);
            expect(withSeparators([{ "w:tbl": [{ "w:tr": [{ "w:tc": [p()] }] }] }], []).endnotes[0].unsupported).to.equal(unknown);
            // None, when the endnotes have none, or it is empty
            expect(styled.endnoteContinuationSeparator).to.deep.equal([]);
            expect(withSeparators([], []).endnotes).to.have.length(1);
        });
    });

    describe("numbering footnotes and endnotes", () => {
        const reference = (kind: string, id: number, attributes: object = {}): object =>
            r({ [`w:${kind}Reference`]: { _attr: { "w:id": id, ...attributes } } });
        const properties = (kind: string, ...children: readonly object[]): object => ({ [`w:${kind}Pr`]: children });
        const NOTES = {
            footnotes: { 1: { children: [new Paragraph("One")] }, 2: { children: [new Paragraph("Two")] } },
            endnotes: { 1: { children: [new Paragraph("One")] }, 2: { children: [new Paragraph("Two")] } },
        };
        /** Two sections, each referring to a footnote and an endnote, with the notes' properties of each and the document's */
        const twoSections = (
            first: readonly object[],
            second: readonly object[],
            settings: readonly object[] = [],
            attributes: object = {},
        ): DocumentContent =>
            readWithSettings(
                [
                    p(reference("footnote", 1, attributes), reference("endnote", 1)),
                    p(pPr({ "w:sectPr": first })),
                    p(reference("footnote", 2), reference("endnote", 2)),
                    { "w:sectPr": second },
                ],
                settings,
                NOTES,
            );
        const numbersOf = (content: DocumentContent): readonly (readonly string[])[] => [
            [...content.footnoteNumbers.values()],
            [...new Set(content.endnotes.flatMap((block) => content.endnoteNumbers.get(block) ?? []))],
        ];

        it("should number footnotes and endnotes in the format and from the number the document gives, as Word does", () => {
            const content = twoSections(
                [],
                [],
                [
                    properties("footnote", value("w:numFmt", "lowerLetter"), value("w:numStart", 3)),
                    properties("endnote", value("w:numFmt", "decimal")),
                ],
            );
            expect(numbersOf(content)).to.deep.equal([
                ["c", "d"],
                ["1", "2"],
            ]);
            expect(content.unsupported).to.equal(undefined);
        });

        it("should number each section's notes in its own format, afresh in each section when it says so, as Word does", () => {
            const content = twoSections(
                [properties("footnote", value("w:numFmt", "upperRoman"), value("w:numRestart", "eachSect"))],
                [
                    properties("footnote", value("w:numRestart", "eachSect"), value("w:numStart", 5)),
                    properties("endnote", value("w:numFmt", "chicago")),
                ],
            );
            // The endnotes number on through the document, in the format of the section each is in
            expect(numbersOf(content)).to.deep.equal([
                ["I", "5"],
                ["i", "\u2020"],
            ]);
            expect(content.unsupported).to.equal(undefined);
        });

        it("should number a note in a table cell with deleted text as it is numbered where it is, to size the columns by", () => {
            // A cell with deleted text is read again as Word sizes the table's columns by it, which numbers its footnote as
            // the cell does, in a format not yet written too
            const cell = {
                "w:tc": [
                    { "w:tcPr": [{ "w:tcW": { _attr: { "w:w": 2000 } } }] },
                    p(r(t("a")), { "w:del": [r({ "w:delText": ["b"] })] }, reference("footnote", 1)),
                ],
            };
            const table = {
                "w:tbl": [{ "w:tblPr": [] }, { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] }, { "w:tr": [cell] }],
            };
            const content = readWithSettings([table], [properties("footnote", value("w:numFmt", "bogus"))], NOTES);
            const sized = (content.blocks[0].block as TableBlock).rows[0].cells[0];
            expect((sized.sizing![0] as ParagraphBlock).items.map((item) => (item.type === "text" ? item.text : item.type))).to.deep.equal([
                "a",
                "b",
                "",
            ]);
            expect(content.unsupported).to.equal("notes numbered in a format not yet written");
        });

        it("should stop at notes numbered or placed in a way not yet followed", () => {
            const reasonOf = (...args: Parameters<typeof twoSections>): string | undefined => twoSections(...args).unsupported;
            expect(reasonOf([], [], [properties("endnote", value("w:numRestart", "eachPage"))])).to.equal(
                "notes numbered afresh on each page",
            );
            // A number of its own in a later section, where they are numbered on through the document
            expect(reasonOf([], [properties("footnote", value("w:numStart", 4))])).to.equal(
                "notes numbered on from a number of their own in a later section",
            );
            expect(reasonOf([], [], [properties("footnote", value("w:pos", "beneathText"))])).to.equal(
                "footnotes put elsewhere than at the bottom of the page",
            );
            expect(reasonOf([], [properties("endnote", value("w:pos", "sectEnd"))])).to.equal("endnotes at the end of each section");
            expect(reasonOf([], [], [properties("endnote", value("w:numFmt", "bogus"))])).to.equal(
                "notes numbered in a format not yet written",
            );
            // At the end of the only section is at the end of the document
            const oneSection = readWithSettings(
                [p(reference("endnote", 1)), { "w:sectPr": [properties("endnote", value("w:pos", "sectEnd"))] }],
                [],
                NOTES,
            );
            expect(oneSection.unsupported).to.equal(undefined);
            // Only notes the document has stop it
            expect(readWithSettings([p(t("a"))], [properties("footnote", value("w:numRestart", "eachPage"))], NOTES).unsupported).to.equal(
                undefined,
            );
            // A mark of its own in place of a note's number stops at its paragraph
            const marked = twoSections([], [], [], { "w:customMarkFollows": 1 });
            expect(marked.unsupported).to.equal(undefined);
            expect(paragraphOf(marked).unsupported).to.equal("a footnote or endnote with a mark of its own");
        });
    });

    describe("drawings", () => {
        const drawing = (child: object): object => r({ "w:drawing": [child] });

        it("should read a picture in the line as a box, with its effects, the space around it, and its run's font", () => {
            const inline = {
                "wp:inline": [
                    { _attr: { distT: 12700, distB: 12700, distL: 0, distR: 25400 } },
                    { "wp:extent": { _attr: { cx: 127000, cy: 254000 } } },
                    { "wp:effectExtent": { _attr: { l: 12700, t: 0, r: 12700, b: 0 } } },
                ],
            };
            expect(itemsOf(readBody([p(drawing(inline))]))).to.deep.equal([{ type: "box", width: 14, height: 22, font: {} }]);
            expect(itemsOf(readBody([p(drawing({ "wp:inline": [{ "wp:extent": { _attr: { cx: 127000 } } }] }))]))).to.deep.equal([
                { type: "box", width: 10, height: 0, font: {} },
            ]);
            // The font of its run, whose line Word makes the picture's at least as tall as
            const sized = r(rPr(value("w:sz", 30)), { "w:drawing": [inline] });
            expect(itemsOf(readBody([p(sized)]))).to.deep.equal([{ type: "box", width: 14, height: 22, font: { size: 15 } }]);
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
            expect(itemsOf(readBody([p(r(alternate))]))).to.deep.equal([{ type: "box", width: 1, height: 1, font: {} }]);
            expect(itemsOf(readBody([p(r({ "mc:AlternateContent": [{ "mc:Fallback": [] }] }))]))).to.deep.equal([]);
        });
    });

    describe("fields", () => {
        it("should read the results of fields, not their instructions", () => {
            const content = readBody([
                p(field("begin"), instruction("AUTHOR"), field("separate"), r(t("Ann")), field("end"), r(t(" after"))),
            ]);
            expect(textOf(content)).to.equal("Ann after");
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

        it("should read page references with \\p and in formats of their own, and stop at those whose text in Word isn't known", () => {
            const reference = (text: string): object => p(field("begin"), instruction(text), field("separate"), r(t("?")), field("end"));
            const content = readBody([
                reference("PAGEREF a \\p \\h"),
                reference("PAGEREF a \\* roman"),
                reference('PAGEREF "a" \\* MERGEFORMAT \\*Arabic \\* Upper'),
                reference("PAGEREF"),
                reference('PAGEREF a \\# "#,##0" \\* Lower'),
                reference("PAGEREF a \\p \\* Arabic"),
                reference("PAGEREF b \\p \\* FirstCap \\*"),
                // Word's text for these isn't known
                reference("PAGEREF a \\* CardText"),
                reference("PAGEREF a \\* roman \\* Ordinal"),
                reference('PAGEREF a \\# "x0"'),
                reference("PAGEREF a \\# 0 \\#0"),
                reference('PAGEREF a \\* roman \\# "00"'),
                reference("PAGEREF a \\* Caps"),
                reference("PAGEREF a \\* Upper \\* Lower"),
                reference("PAGEREF a \\p \\* CardText"),
            ]);
            // Where its bookmark is from it, from the page of the marker at it, and the order of the markers
            expect(itemsOf(content, 0)).to.deep.equal([
                { type: "marker", name: "field 1" },
                { type: "pageReference", bookmark: "a", font: {}, relative: "field 1" },
            ]);
            expect(itemsOf(content, 1)).to.deep.equal([
                { type: "pageReference", bookmark: "a", font: {}, format: { numberFormat: "roman" } },
            ]);
            expect(itemsOf(content, 2)).to.deep.equal([
                { type: "pageReference", bookmark: "a", font: {}, format: { numberFormat: "Arabic", capitals: "upper" } },
            ]);
            // A page reference without a bookmark is read as it is written
            expect(textOf(content, 3)).to.equal("?");
            expect(itemsOf(content, 4)).to.deep.equal([
                { type: "pageReference", bookmark: "a", font: {}, format: { picture: "#,##0", capitals: "lower" } },
            ]);
            // With a number format, one with \p writes the bookmark's page's number (word-page-fields.docx PF3c)
            expect(itemsOf(content, 5)).to.deep.equal([
                { type: "pageReference", bookmark: "a", font: {}, format: { numberFormat: "Arabic" } },
            ]);
            expect(itemsOf(content, 6)).to.deep.equal([
                { type: "marker", name: "field 3" },
                { type: "pageReference", bookmark: "b", font: {}, relative: "field 3", format: { capitals: "firstcap" } },
            ]);
            expect([7, 8, 9, 10, 11, 12, 13, 14].map((index) => paragraphOf(content, index).unsupported)).to.deep.equal([
                "a number in a field format not yet written",
                "a number in a field format not yet written",
                "a number written with a picture not yet written",
                "a number written with a picture not yet written",
                "a number in a field format not yet written",
                "a number in a field format not yet written",
                "a number in a field format not yet written",
                "a number in a field format not yet written",
            ]);
            // Each page reference with \p is counted, by its bookmark, whatever it writes
            expect(Object.fromEntries(content.relativeReferences)).to.deep.equal({ a: ["field 1", "field 2", "field 4"], b: ["field 3"] });
        });

        it("should read the results of NUMPAGES and SECTIONPAGES fields as the numbers of pages they show", () => {
            const content = readBody([
                p(field("begin"), instruction("NUMPAGES \\* MERGEFORMAT"), field("separate"), r(t("9")), field("end")),
                p({ "w:fldSimple": [{ _attr: { "w:instr": "SECTIONPAGES" } }, r(t("3"))] }),
                p(field("begin"), instruction("NUMPAGES \\* roman \\p"), field("separate"), r(t("ix")), field("end")),
                p(field("begin"), instruction("SECTIONPAGES \\* Hex"), field("separate"), r(t("3")), field("end")),
            ]);
            expect(itemsOf(content, 0)).to.deep.equal([{ type: "pageCount", scope: "document", font: {} }]);
            expect(itemsOf(content, 1)).to.deep.equal([{ type: "pageCount", scope: "section", font: {} }]);
            expect(itemsOf(content, 2)).to.deep.equal([
                { type: "pageCount", scope: "document", font: {}, format: { numberFormat: "roman" } },
            ]);
            expect(paragraphOf(content, 3).unsupported).to.equal("a number in a field format not yet written");
        });

        it("should read PAGE and SECTION fields and page number blocks in the body as the numbers of the page and section they are on", () => {
            const content = readBody(
                [
                    p(field("begin"), instruction("PAGE"), field("separate"), field("end")),
                    p({ "w:fldSimple": [{ _attr: { "w:instr": 'PAGE \\# "00"' } }, r(t("?"))] }),
                    p(r({ "w:pgNum": {} })),
                    p(field("begin"), instruction("SECTION \\* ALPHABETIC"), field("separate"), r(t("?")), field("end")),
                    p(field("begin"), instruction("PAGE \\* OrdText"), field("separate"), r(t("?")), field("end")),
                    // In hidden text, the field shows nothing
                    p(
                        field("begin"),
                        instruction("PAGE"),
                        r(rPr({ "w:vanish": {} }), { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } }),
                        field("end"),
                    ),
                    p(r(rPr({ "w:vanish": {} }), { "w:pgNum": {} })),
                    p(pPr(value("w:pStyle", "Hidden")), { "w:fldSimple": [{ _attr: { "w:instr": "SECTION" } }] }),
                ],
                { styles: { paragraphStyles: [{ id: "Hidden", name: "Hidden", run: { vanish: true } }] } },
            );
            expect(itemsOf(content, 0)).to.deep.equal([
                { type: "marker", name: "field 1" },
                { type: "pageNumber", field: "field 1", font: {} },
            ]);
            expect(itemsOf(content, 1)).to.deep.equal([
                { type: "marker", name: "field 2" },
                { type: "pageNumber", field: "field 2", font: {}, format: { picture: "00" } },
            ]);
            expect(itemsOf(content, 2)).to.deep.equal([
                { type: "marker", name: "field 3" },
                { type: "pageNumber", field: "field 3", font: {} },
            ]);
            // In the body, a section's number is that of the section it is in
            expect(itemsOf(content, 3)).to.deep.equal([{ type: "sectionNumber", font: {}, format: { numberFormat: "ALPHABETIC" } }]);
            expect(paragraphOf(content, 4).unsupported).to.equal("a number in a field format not yet written");
            expect([5, 6, 7].map((index) => itemsOf(content, index))).to.deep.equal([[], [], []]);
        });

        it("should stop at a date or time in the body, which Word writes when it opens the document, and read one in a header as it is written", () => {
            const date = (text: string): object =>
                p(field("begin"), instruction(text), field("separate"), r(t("1 January 2000")), field("end"));
            const content = readBody([
                date('DATE \\@ "d MMMM yyyy"'),
                p({ "w:fldSimple": [{ _attr: { "w:instr": "TIME" } }, r(t("12:00"))] }),
                p(r({ "w:dayLong": {} }, { "w:monthLong": {} }, { "w:yearLong": {} })),
                p(r({ "w:dayShort": {} }, { "w:monthShort": {} }, { "w:yearShort": {} })),
                // A field in another's instruction isn't shown, nor is a date in it
                p(
                    field("begin"),
                    instruction("IF "),
                    field("begin"),
                    instruction("DATE"),
                    field("separate"),
                    field("end"),
                    field("separate"),
                    r(t("shown")),
                    field("end"),
                ),
            ]);
            expect([0, 1, 2, 3].map((index) => paragraphOf(content, index).unsupported)).to.deep.equal(
                Array.from({ length: 4 }, () => "a date or time, which Word writes when it opens the document"),
            );
            expect(textOf(content, 4)).to.equal("shown");
            const [header] = Object.values(
                readContent(
                    { "w:body": [{ "w:sectPr": [{ "w:headerReference": { _attr: { "r:id": "rId1" } } }] }] },
                    {
                        styles: WORD_DEFAULT_STYLES,
                        headersAndFooters: new Map([["rId1", [date("DATE"), p(r(t("on "), { "w:dayLong": {} }))]]]),
                    },
                ).sections[0].headers,
            );
            expect(header.map((block) => textOf({ ...content, blocks: [{ block, section: 0 }] }))).to.deep.equal(["1 January 2000", "on "]);
        });

        it("should read a date, or a field in a format not yet written, in hidden text as nothing, as hidden text takes no room", () => {
            const hidden = rPr({ "w:vanish": {} });
            const content = readBody(
                [
                    p(
                        field("begin"),
                        instruction("DATE"),
                        r(hidden, { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } }),
                        field("end"),
                    ),
                    p(
                        field("begin"),
                        instruction("PAGE \\* CardText"),
                        r(hidden, { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } }),
                        field("end"),
                    ),
                    p(r(hidden, { "w:dayLong": {} })),
                    // Its mark shown, as a hidden one would join it to the paragraph after it
                    p(pPr(value("w:pStyle", "Hidden"), rPr(value("w:vanish", "false"))), {
                        "w:fldSimple": [{ _attr: { "w:instr": "TIME" } }],
                    }),
                ],
                { styles: { paragraphStyles: [{ id: "Hidden", name: "Hidden", run: { vanish: true } }] } },
            );
            expect([0, 1, 2, 3].map((index) => paragraphOf(content, index))).to.satisfy((paragraphs: readonly ParagraphBlock[]) =>
                paragraphs.every(({ items, unsupported }) => items.length === 0 && unsupported === undefined),
            );
        });

        it("should read PAGE, SECTION and page references with \\p in headers as they are written, and those in notes where their references are", () => {
            const fieldOf = (text: string): object =>
                p(field("begin"), instruction(text), field("separate"), r(t("written")), field("end"));
            const fields = [fieldOf("PAGE"), fieldOf("SECTION \\* roman"), fieldOf("PAGEREF a \\p"), p(r({ "w:pgNum": {} }))];
            const content = readContent(
                {
                    "w:body": [
                        p(r({ "w:footnoteReference": { _attr: { "w:id": 1 } } })),
                        { "w:sectPr": [{ "w:headerReference": { _attr: { "r:id": "rId1" } } }] },
                    ],
                },
                {
                    styles: WORD_DEFAULT_STYLES,
                    headersAndFooters: new Map([["rId1", fields]]),
                    footnotes: { "w:footnotes": [{ "w:footnote": [{ _attr: { "w:id": 1 } }, ...fields] }] },
                },
            );
            const header = content.sections[0].headers.default!;
            expect(header.map((block) => textOf({ ...content, blocks: [{ block, section: 0 }] }))).to.deep.equal([
                "written",
                "written",
                "written",
                "",
            ]);
            // In a footnote, the page and section are its reference's, which the markers at them are placed with. Where a
            // bookmark is from a page reference with \p in one is written by Word, but not yet by docx
            const note = content.footnotes.get("footnote 1")!;
            expect(note.map((block) => (block as ParagraphBlock).items.filter((item) => item.type !== "text"))).to.deep.equal([
                [
                    { type: "marker", name: "field 1" },
                    { type: "pageNumber", field: "field 1", font: {} },
                ],
                [
                    { type: "marker", name: "field 2" },
                    { type: "sectionNumber", field: "field 2", font: {}, format: { numberFormat: "roman" } },
                ],
                [],
                [
                    { type: "marker", name: "field 3" },
                    { type: "pageNumber", field: "field 3", font: {} },
                ],
            ]);
            expect(note[2].unsupported).to.equal("a page reference that says where its bookmark is, in a footnote or endnote");
            expect(content.relativeReferences.size).to.equal(0);
        });

        it("should ignore field characters and instructions outside a field", () => {
            const content = readBody([p(field("separate"), instruction("PAGEREF a"), r(t("text")), field("end"))]);
            expect(textOf(content)).to.equal("text");
        });

        it("should read a simple field that is a page reference as the page of its bookmark, and others as their result", () => {
            const content = readBody([
                p({ "w:fldSimple": [{ _attr: { "w:instr": "PAGEREF target" } }, r(t("9"))] }),
                p({ "w:fldSimple": [{ _attr: { "w:instr": "AUTHOR" } }, r(t("Ann"))] }),
            ]);
            expect(itemsOf(content, 0)).to.deep.equal([{ type: "pageReference", bookmark: "target", font: {} }]);
            expect(textOf(content, 1)).to.equal("Ann");
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
                        // A level without a format is in decimal
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
            expect(itemsOf(content, 1)[0]).to.deep.equal({ type: "text", text: "1.a", font: { bold: true, listNumber: "number" } });
            // Word draws the space after a number in Arial (word-lists.docx LJ4), and a tab or space takes no room in its line
            expect(itemsOf(content, 1)[1]).to.deep.equal({
                type: "text",
                text: " ",
                font: { bold: true, font: "Arial", listNumber: "separator" },
            });
            expect(itemsOf(content, 0)[1]).to.deep.equal({ type: "tab", font: { listNumber: "separator" } });
        });

        it("should write nothing for a level without text or suffix, and stop at a format it doesn't write, or a level that doesn't exist", () => {
            const content = readWritten({ numbering, sections: [{ children: [item(2, "none"), item(3, "counted"), item(4, "missing")] }] });
            expect(textOf(content, 0)).to.equal("none");
            expect(paragraphOf(content, 0).unsupported).to.equal(undefined);
            // Word's Thai counting isn't known, so Word's number isn't, where docx/layout wrote "1"
            expect(paragraphOf(content, 1).unsupported).to.equal("a list number in a format not yet written");
            expect(paragraphOf(content, 2).unsupported).to.equal("a list number of a level its list doesn't have");
            expect(textOf(content, 2)).to.equal("1.missing");
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

    describe("lists in Word's numbering", () => {
        const abstractNum = (id: number, ...children: readonly unknown[]): object => ({
            "w:abstractNum": [{ _attr: { "w:abstractNumId": id } }, ...children],
        });
        const lvl = (index: number, ...children: readonly unknown[]): object => ({
            "w:lvl": [{ _attr: { "w:ilvl": index } }, ...children],
        });
        const num = (id: number, definition: number, ...overrides: readonly unknown[]): object => ({
            "w:num": [{ _attr: { "w:numId": id } }, value("w:abstractNumId", definition), ...overrides],
        });
        const lvlOverride = (index: number, ...children: readonly unknown[]): object => ({
            "w:lvlOverride": [{ _attr: { "w:ilvl": index } }, ...children],
        });
        /** A decimal level, "%1." at level 0 and "%1.%2." at level 1, with more of its properties */
        const decimal = (index: number, ...children: readonly unknown[]): object =>
            lvl(
                index,
                value("w:start", 1),
                value("w:numFmt", "decimal"),
                value("w:lvlText", Array.from({ length: index + 1 }, (_, at) => `%${at + 1}.`).join("")),
                ...children,
            );
        const listItem = (id: number, level: number, text: string): object =>
            p(pPr({ "w:numPr": [value("w:ilvl", level), value("w:numId", id)] }), r(t(text)));
        /** Reads a body with the lists in the numbering */
        const readLists = (numbering: readonly object[], body: readonly object[]): DocumentContent =>
            readContent(
                { "w:body": body },
                { styles: WORD_DEFAULT_STYLES, headersAndFooters: new Map(), numbering: { "w:numbering": numbering } },
            );
        const numbersOf = (content: DocumentContent): readonly string[] =>
            content.blocks.map(({ block }) => {
                const [first] = (block as ParagraphBlock).items;
                return first.type === "text" ? first.text : "";
            });

        it("should note how a number is aligned at the start of its line, as Word lines it up (word-watertight-text.docx TX21)", () => {
            const aligned = (jc?: string): ParagraphBlock =>
                paragraphOf(
                    readLists(
                        [abstractNum(0, decimal(0, ...(jc === undefined ? [] : [value("w:lvlJc", jc)]))), num(1, 0)],
                        [listItem(1, 0, "item")],
                    ),
                );
            expect(aligned("right").numberAlignment).to.equal("right");
            expect(aligned("end").numberAlignment).to.equal("right");
            expect(aligned("center").numberAlignment).to.equal("center");
            for (const jc of [undefined, "left", "start"]) {
                expect(aligned(jc).numberAlignment).to.equal(undefined);
                expect(aligned(jc).unsupported).to.equal(undefined);
            }
            expect(aligned("both").unsupported).to.equal("a list number aligned in a way not yet followed");
            // A level with no number has nothing to align
            const empty = readLists(
                [abstractNum(0, lvl(0, value("w:numFmt", "bullet"), value("w:lvlText", ""), value("w:lvlJc", "right"))), num(1, 0)],
                [listItem(1, 0, "item")],
            );
            expect(paragraphOf(empty).numberAlignment).to.equal(undefined);
        });

        it("should stop at bullets that are pictures, numbers laid out as Word 6 laid them out, and lists defined by list styles", () => {
            const stopsAt = (...children: readonly unknown[]): string | undefined =>
                paragraphOf(readLists([abstractNum(0, ...children), num(1, 0)], [listItem(1, 0, "item")])).unsupported;
            expect(stopsAt(decimal(0, value("w:lvlPicBulletId", 0)))).to.equal("a list whose bullets are pictures");
            expect(stopsAt(decimal(0, { "w:legacy": { _attr: { "w:legacy": 1, "w:legacySpace": 0, "w:legacyIndent": 360 } } }))).to.equal(
                "a list numbered as Word 6 numbered lists",
            );
            expect(stopsAt(decimal(0, { "w:legacy": { _attr: { "w:legacy": 0 } } }))).to.equal(undefined);
            expect(stopsAt(value("w:numStyleLink", "OutlineList"))).to.equal("a list defined by a list style");
        });

        it("should start a level again after the level it gives, or never, as the schema has it (w:lvlRestart)", () => {
            const content = readLists(
                [abstractNum(0, decimal(0), decimal(1, value("w:lvlRestart", 0)), decimal(2, value("w:lvlRestart", 1))), num(1, 0)],
                [0, 1, 1, 2, 0, 1, 2, 1, 2].map((level, index) => listItem(1, level, `item ${index}`)),
            );
            // Level 1 never starts again, and level 2 starts again after level 0 but not level 1
            expect(numbersOf(content)).to.deep.equal(["1.", "1.1.", "1.2.", "1.2.1.", "2.", "2.3.", "2.3.1.", "2.4.", "2.4.2."]);
        });

        it("should start a level again after any level above it when it gives itself or a level below it", () => {
            const content = readLists(
                [abstractNum(0, decimal(0), decimal(1, value("w:lvlRestart", 2)), decimal(2, value("w:lvlRestart", 5))), num(1, 0)],
                [0, 1, 2, 1, 2, 0, 1].map((level, index) => listItem(1, level, `item ${index}`)),
            );
            expect(numbersOf(content)).to.deep.equal(["1.", "1.1.", "1.1.1.", "1.2.", "1.2.1.", "2.", "2.1."]);
        });

        it("should write every level's number in decimal in a legal level's text (w:isLgl)", () => {
            const content = readLists(
                [
                    abstractNum(
                        0,
                        lvl(0, value("w:start", 1), value("w:numFmt", "upperRoman"), value("w:lvlText", "%1.")),
                        lvl(1, value("w:start", 1), value("w:numFmt", "lowerLetter"), { "w:isLgl": {} }, value("w:lvlText", "%1.%2")),
                    ),
                    num(1, 0),
                ],
                [listItem(1, 0, "one"), listItem(1, 1, "a"), listItem(1, 1, "b")],
            );
            expect(numbersOf(content)).to.deep.equal(["I.", "1.1", "1.2"]);
        });

        it("should count lists made from one definition on from one another, as Word counts them (word-lists.docx LO1, LO8, LO9)", () => {
            const content = readLists(
                [abstractNum(0, decimal(0)), abstractNum(1, decimal(0)), num(1, 0), num(2, 0), num(3, 1), num(4, 0, lvlOverride(0))],
                [
                    [1, "a"],
                    [1, "b"],
                    [2, "c"],
                    [2, "d"],
                    [3, "other"],
                    [1, "e"],
                    [4, "f"],
                ].map(([id, text]) => listItem(id as number, 0, text as string)),
            );
            // The list of the other definition counts on its own, and an override that gives nothing starts nothing again
            expect(numbersOf(content)).to.deep.equal(["1.", "2.", "3.", "4.", "1.", "5.", "6."]);
        });

        it("should start a level at a list's own first number at its first paragraph of the level, once (LO2 to LO6)", () => {
            const content = readLists(
                [
                    abstractNum(0, decimal(0), decimal(1)),
                    num(1, 0),
                    num(2, 0, lvlOverride(0, value("w:startOverride", 1))),
                    num(3, 0, lvlOverride(1, value("w:startOverride", 4))),
                    num(4, 0, lvlOverride(0, value("w:startOverride", 7)), { "w:lvlOverride": [value("w:startOverride", 9)] }),
                ],
                (
                    [
                        [1, 0],
                        [1, 0],
                        [2, 1],
                        [2, 0],
                        [2, 0],
                        [1, 0],
                        [2, 0],
                        [3, 1],
                        [3, 1],
                        [1, 1],
                        [4, 0],
                        [4, 0],
                    ] as const
                ).map(([id, level], index) => listItem(id, level, `item ${index}`)),
            );
            expect(numbersOf(content)).to.deep.equal([
                "1.",
                "2.",
                // List 2's first paragraph is at level 1, so its level 0 starts again only at its first paragraph of level 0
                "2.1.",
                "1.",
                "2.",
                "3.",
                "4.",
                // List 3 starts level 1 at 4, and list 1 goes on from it
                "4.4.",
                "4.5.",
                "4.6.",
                "7.",
                "8.",
            ]);
        });

        it("should start a list again with a level it gives, at the level's own first number, and go on in the other lists' formats (LO7)", () => {
            const content = readLists(
                [
                    abstractNum(0, decimal(0)),
                    num(1, 0),
                    num(2, 0, lvlOverride(0, lvl(0, value("w:start", 3), value("w:numFmt", "upperRoman"), value("w:lvlText", "%1)")))),
                ],
                [listItem(1, 0, "a"), listItem(1, 0, "b"), listItem(2, 0, "c"), listItem(2, 0, "d"), listItem(1, 0, "e")],
            );
            expect(numbersOf(content)).to.deep.equal(["1.", "2.", "III)", "IV)", "5."]);
        });

        it("should show a level not counted yet at its first number, and stop where its list starts it at another (LR4)", () => {
            const content = readLists(
                [
                    abstractNum(0, lvl(0, value("w:start", 3), value("w:numFmt", "decimal"), value("w:lvlText", "%1.")), decimal(1)),
                    num(1, 0),
                    num(2, 0, lvlOverride(0, value("w:startOverride", 3))),
                    num(3, 0, lvlOverride(0, value("w:startOverride", 5))),
                ],
                [listItem(1, 1, "a"), listItem(2, 1, "b"), listItem(3, 1, "c")],
            );
            expect(numbersOf(content)).to.deep.equal(["3.1.", "3.2.", "3.3."]);
            expect(content.blocks.map(({ block }) => (block as ParagraphBlock).unsupported)).to.deep.equal([
                undefined,
                undefined,
                "a list number of a level not counted yet, which its list starts at a number of its own",
            ]);
        });

        it("should write a number in its paragraph mark's formatting, but for what its level gives it (LF1 to LF6)", () => {
            const content = readLists(
                [abstractNum(0, decimal(0)), abstractNum(1, decimal(0, rPr(value("w:sz", 16)))), num(1, 0), num(2, 1)],
                [
                    p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 1)] }, rPr(value("w:sz", 40))), r(t("mark 20"))),
                    p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 1)] }), r(rPr({ "w:b": {} }), t("text bold"))),
                    p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 2)] }, rPr(value("w:sz", 40))), r(t("level 8"))),
                ],
            );
            const fontOfNumber = (index: number): object => (itemsOf(content, index)[0] as { readonly font: object }).font;
            expect(fontOfNumber(0)).to.deep.include({ size: 20, listNumber: "number" });
            expect(fontOfNumber(1)).to.not.have.property("bold");
            expect(fontOfNumber(2)).to.deep.include({ size: 8 });
        });

        it("should stop at a centred number followed by a space, and at a number with a border, emphasis marks, or raised", () => {
            const stopsAt = (level: object, mark: readonly object[] = []): string | undefined =>
                paragraphOf(
                    readLists(
                        [abstractNum(0, level), num(1, 0)],
                        [p(pPr({ "w:numPr": [value("w:ilvl", 0), value("w:numId", 1)] }, rPr(...mark)), r(t("item")))],
                    ),
                ).unsupported;
            expect(stopsAt(decimal(0, value("w:suff", "space"), value("w:lvlJc", "center")))).to.equal(
                "a centred list number followed by a space",
            );
            expect(stopsAt(decimal(0, value("w:suff", "space"), value("w:lvlJc", "right")))).to.equal(undefined);
            const numberStop = "a list number with a border or emphasis marks, or raised or lowered";
            expect(stopsAt(decimal(0), [{ "w:bdr": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0 } } }])).to.equal(numberStop);
            expect(stopsAt(decimal(0), [value("w:em", "dot")])).to.equal(numberStop);
            expect(stopsAt(decimal(0), [value("w:position", 6)])).to.equal(numberStop);
        });

        it("should number a list with the levels it gives in place of its definition's", () => {
            const content = readLists(
                [
                    abstractNum(0, decimal(0)),
                    num(1, 0, lvlOverride(0, lvl(0, value("w:start", 3), value("w:numFmt", "upperRoman"), value("w:lvlText", "%1)")))),
                ],
                [listItem(1, 0, "one"), listItem(1, 0, "two")],
            );
            expect(numbersOf(content)).to.deep.equal(["III)", "IV)"]);
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

        it("should even out the rows of a table that give a column different widths, as Word does", () => {
            const tableOf = (
                properties: readonly object[],
                ...rows: readonly (readonly (readonly [number | undefined, number?])[])[]
            ): TableBlock =>
                readBody([
                    {
                        "w:tbl": [
                            { "w:tblPr": properties },
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
                ]).blocks[0].block as TableBlock;
            const unsupported = "a table whose rows give a column different widths";
            const ownWidth = { "w:tblW": { _attr: { "w:w": 4000, "w:type": "dxa" } } };
            const fixed = { "w:tblLayout": { _attr: { "w:type": "fixed" } } };
            // The first column 1000 twips wide in one row, and 3000 in the next. Word makes it as wide as the widest, then
            // fits the columns to the table's width, laid out fixed or not, or to the room without one (word-watertight-stops.docx
            // SP14, word-table-widths.docx TW1 to TW6)
            const uneven: readonly (readonly (readonly [number | undefined, number?])[])[] = [
                [[1000], [2000]],
                [[3000], [2000]],
            ];
            expect(tableOf([ownWidth], ...uneven).widen).to.deep.equal({ width: 200, uneven: true });
            expect(tableOf([ownWidth], ...uneven).unsupported).to.equal(undefined);
            expect(tableOf([ownWidth, fixed], ...uneven).widen).to.deep.equal({ width: 200, uneven: true, fixed: true });
            expect(tableOf([], ...uneven).widen).to.deep.equal({ uneven: true });
            expect(tableOf([fixed], ...uneven).widen).to.deep.equal({ uneven: true, fixed: true });
            // A cell of a table laid out fixed without a width of its own has the grid's
            expect(tableOf([ownWidth, fixed], [[1000], [2000]], [[3000], [undefined]]).widen).to.deep.equal({
                width: 200,
                uneven: true,
                fixed: true,
            });
            // A table laid out fixed is fitted to its own width in twips when its rows aren't as wide (TW8, TW10), and kept
            // when they are
            expect(tableOf([ownWidth, fixed], [[1000], [2000]]).widen).to.deep.equal({ width: 200, fixed: true });
            expect(tableOf([ownWidth, fixed], [[1000], [3000]]).widen).to.equal(undefined);
            expect(tableOf([fixed], [[1000], [2000]]).widen).to.equal(undefined);
            // With a share of the width, or space between its cells, how isn't known
            expect(tableOf([{ "w:tblW": { _attr: { "w:w": 5000, "w:type": "pct" } } }], ...uneven).unsupported).to.equal(unsupported);
            expect(tableOf([ownWidth, { "w:tblCellSpacing": { _attr: { "w:w": 20, "w:type": "dxa" } } }], ...uneven).unsupported).to.equal(
                unsupported,
            );
            // Nor with a row that starts past the first column
            const skipping = readBody([
                {
                    "w:tbl": [
                        { "w:tblPr": [ownWidth] },
                        { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 1000 } } }, { "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                        {
                            "w:tr": [
                                cell([{ "w:tcW": { _attr: { "w:w": 1000 } } }], p()),
                                cell([{ "w:tcW": { _attr: { "w:w": 2000 } } }], p()),
                            ],
                        },
                        { "w:tr": [{ "w:trPr": [value("w:gridBefore", 1)] }, cell([{ "w:tcW": { _attr: { "w:w": 3000 } } }], p())] },
                    ],
                },
            ]).blocks[0].block as TableBlock;
            expect(skipping.unsupported).to.equal(unsupported);
            // A cell over both columns as wide as the two, and widths a twip apart from rounding, agree
            const even = tableOf([], [[1000], [2000]], [[3000, 2]], [[1001], [2000]]);
            expect(even.unsupported).to.equal(undefined);
            expect(even.widen).to.deep.equal({});
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
            expect(tableOf([], { "w:w": 3000 }, { "w:w": 2500, "w:type": "pct" }).widen).to.deep.equal({});
            expect(tableOf(tableWidth({ "w:w": 9000, "w:type": "dxa" }), { "w:w": 3000 }).widen).to.deep.equal({ width: 450 });
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
            // A table whose cells all have widths has its columns widened for long words as it is laid out, merged across
            // them or not
            const width = { "w:tcW": { _attr: { "w:w": 3000 } } };
            expect(tableOf([], [cell([width, value("w:gridSpan", 2)], p(r(t("a"))))]).widen).to.deep.equal({});
            expect(tableOf([], [cell([width], p(r(t("a")))), cell([width], p(r(t("b"))))]).widen).to.deep.equal({});
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
            // An equation outside a paragraph too
            const outside = readBody([{ "w:tbl": [{ "w:tr": [{ "w:tc": [{ "m:oMath": [] }] }] }] }]);
            expect((outside.blocks[0].block as TableBlock).unsupported).to.equal("an equation");
        });

        it("should stop at a table that text flows around, a row in an HTML division, and cells merged the old way, whose text doesn't wrap or that fit their text to them", () => {
            const unsupportedOf = (
                table: readonly unknown[],
                row: readonly unknown[],
                ...cells: readonly (readonly unknown[])[]
            ): unknown =>
                (
                    readBody([
                        {
                            "w:tbl": [
                                { "w:tblPr": table },
                                { "w:tr": [{ "w:trPr": row }, ...cells.map((properties) => cell(properties, p()))] },
                            ],
                        },
                    ]).blocks[0].block as TableBlock
                ).unsupported;
            expect(unsupportedOf([], [], [])).to.equal(undefined);
            // Word puts the text after a floating table beside it (word-watertight-tables.docx TB11)
            expect(unsupportedOf([{ "w:tblpPr": { _attr: { "w:tblpY": 0, "w:vertAnchor": "text" } } }], [], [])).to.equal(
                "a table that text flows around",
            );
            expect(unsupportedOf([], [value("w:divId", 3)], [])).to.equal("a table row in an HTML division");
            expect(unsupportedOf([], [], [value("w:hMerge", "restart")])).to.equal(
                "cells merged across columns as old versions of Word wrote them",
            );
            expect(unsupportedOf([], [], [{ "w:noWrap": {} }])).to.equal("a table cell whose text doesn't wrap");
            expect(unsupportedOf([], [], [value("w:noWrap", "false")])).to.equal(undefined);
            expect(unsupportedOf([], [], [{ "w:tcFitText": {} }])).to.equal("text fitted to its table cell");
            // The first of them in the row
            expect(unsupportedOf([], [], [], [{ "w:tcFitText": {} }], [{ "w:noWrap": {} }])).to.equal("text fitted to its table cell");
        });

        describe("formatting", () => {
            const border = (side: string, size: number, style = "single"): object => ({
                [`w:${side}`]: { _attr: { "w:val": style, "w:sz": size } },
            });
            const styles = (...definitions: readonly string[]): Partial<IPropertiesOptions> => ({
                externalStyles: `<w:styles xmlns:w="main">${definitions.join("")}</w:styles>`,
            });
            const tableStyle = (id: string, content: string): string =>
                `<w:style w:type="table" w:styleId="${id}"><w:name w:val="${id}"/>${content}</w:style>`;
            /** A table of one-cell rows, each of a paragraph of its number */
            const tableOf = (
                properties: readonly unknown[],
                rows: readonly (readonly unknown[])[],
                options: Partial<IPropertiesOptions> = {},
            ): TableBlock =>
                readBody(
                    [
                        {
                            "w:tbl": [
                                { "w:tblPr": properties },
                                { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                                ...rows.map((cellProperties, index) => ({ "w:tr": [cell(cellProperties, p(r(t(`row ${index + 1}`))))] })),
                            ],
                        },
                    ],
                    options,
                ).blocks[0].block as TableBlock;
            const bordersOf = ({ rows }: TableBlock): readonly (readonly [number, number])[] =>
                rows.map(({ borderTop, borderBottom }) => [borderTop, borderBottom]);

            it("should take a table's borders from its style, side by side, and from itself over them, as Word does", () => {
                // word-watertight-tables.docx TB2a: borders only the style has make the rows as tall as the table's own do
                const bordered = tableStyle(
                    "Bordered",
                    `<w:tblPr><w:tblBorders><w:top w:val="single" w:sz="24"/><w:bottom w:val="single" w:sz="24"/><w:insideH w:val="single" w:sz="24"/></w:tblBorders></w:tblPr>`,
                );
                const fromStyle = tableOf([value("w:tblStyle", "Bordered")], [[], [], []], styles(bordered));
                expect(bordersOf(fromStyle)).to.deep.equal([
                    [3, 0],
                    [3, 0],
                    [3, 3],
                ]);
                // TB2b: the table's own, here over the style's
                const own = tableOf(
                    [value("w:tblStyle", "Bordered"), { "w:tblBorders": [border("insideH", 8), border("bottom", 0, "nil")] }],
                    [[], []],
                    styles(bordered),
                );
                expect(bordersOf(own)).to.deep.equal([
                    [3, 0],
                    [1, 0],
                ]);
            });

            it("should count a border between two rows once, the wider of the cells' borders there, each its own or the table's", () => {
                // word-watertight-tables.docx TB3: cells' 3-point top and bottom borders make each row 3 points taller
                const cells = [border("top", 24), border("bottom", 24)];
                expect(bordersOf(tableOf([], [[{ "w:tcBorders": cells }], [{ "w:tcBorders": cells }]]))).to.deep.equal([
                    [3, 0],
                    [3, 3],
                ]);
                // The wider of two cells' own (word-table-formats.docx BC2)
                const table = { "w:tblBorders": [border("top", 24), border("insideH", 24), border("bottom", 24)] };
                const mixed = tableOf([table], [[{ "w:tcBorders": [border("bottom", 8)] }], [{ "w:tcBorders": [border("top", 16)] }], []]);
                expect(bordersOf(mixed)).to.deep.equal([
                    [3, 0],
                    [2, 0],
                    [3, 3],
                ]);
                // A cell's narrower border, nil or none beside the table's border on the cell above (BC3 to BC5)
                for (const top of [border("top", 4), border("top", 8, "nil"), border("top", 8, "none")]) {
                    expect(bordersOf(tableOf([table], [[], [{ "w:tcBorders": [top] }]]))).to.deep.equal([
                        [3, 0],
                        [3, 3],
                    ]);
                }
                // A border's space adds to the room it takes (word-table-formats.docx BS31)
                const spaced = { "w:tblBorders": [{ "w:top": { _attr: { "w:val": "single", "w:sz": 12, "w:space": 10 } } }] };
                expect(bordersOf(tableOf([spaced], [[]]))).to.deep.equal([[11.5, 0]]);
            });

            it("should keep a cell's text its margin, or half the border beside it when that is more, from its edges", () => {
                // word-table-formats.docx BC7 to BC9: 6-point borders left and right of a cell beside text
                const sides = { "w:tcBorders": [border("left", 48), border("right", 48)] };
                const margins = (left: number): object => ({
                    "w:tcMar": [{ "w:left": { _attr: { "w:w": left } } }, { "w:right": { _attr: { "w:w": left } } }],
                });
                const [narrow] = tableOf([], [[sides, margins(0)]]).rows[0].cells;
                expect([narrow.marginLeft, narrow.marginRight, narrow.width]).to.deep.equal([3, 3, 94]);
                const [wide] = tableOf([], [[sides, margins(108)]]).rows[0].cells;
                expect([wide.marginLeft, wide.marginRight, Math.round(wide.width * 10) / 10]).to.deep.equal([5.4, 5.4, 89.2]);
            });

            it("should stop at borders whose room Word's PDFs haven't shown, and at two cells' borders of different styles that meet", () => {
                expect(tableOf([{ "w:tblBorders": [border("insideH", 8, "wave")] }], [[], []]).unsupported).to.equal(
                    "a table border in a style not yet followed",
                );
                const sides = tableOf([{ "w:tblBorders": [border("left", 8, "wave"), border("right", 8, "wave")] }], [[]]);
                expect([sides.unsupported, sides.borderLeft, sides.borderRight]).to.deep.equal([
                    "a table border in a style not yet followed",
                    0,
                    0,
                ]);
                const meeting = tableOf(
                    [],
                    [[{ "w:tcBorders": [border("bottom", 8, "dotted")] }], [{ "w:tcBorders": [border("top", 8)] }]],
                );
                expect(meeting.unsupported).to.equal("table cell borders of different styles that meet");
            });

            it("should put space between cells around each cell, and inside the table's edges, as Word does", () => {
                // word-watertight-tables.docx TB4: 100 twips between cells put 200 between each row's text and the next's, and
                // between the table's edges and its first and last rows' text, and make the text of the first and last cell of
                // a row 300 twips narrower, and of the others 200, as margins do
                const spacing = { "w:tblCellSpacing": { _attr: { "w:w": 100, "w:type": "dxa" } } };
                const spaced = readBody([
                    {
                        "w:tbl": [
                            { "w:tblPr": [spacing, { "w:tblBorders": [border("top", 0, "nil")] }] },
                            { "w:tblGrid": [2000, 2000, 2000].map((width) => ({ "w:gridCol": { _attr: { "w:w": width } } })) },
                            ...[0, 1].map(() => ({ "w:tr": [cell([], p()), cell([], p()), cell([], p())] })),
                        ],
                    },
                ]).blocks[0].block as TableBlock;
                expect(bordersOf(spaced)).to.deep.equal([
                    [10, 5],
                    [5, 10],
                ]);
                expect(spaced.cellSpacing).to.equal(5);
                // docx's Normal Table gives cells 5.4 points on the left and right
                const tenths = (length: number): number => Math.round(length * 10) / 10;
                expect(
                    spaced.rows[0].cells.map(({ width, marginLeft, marginRight }) => [width, marginLeft, marginRight].map(tenths)),
                ).to.deep.equal([
                    [100 - 10.8 - 15, 15.4, 10.4],
                    [100 - 10.8 - 10, 10.4, 10.4],
                    [100 - 10.8 - 15, 10.4, 15.4],
                ]);
                // A table whose cells have widths keeps its width, its own or its cells', laid out fixed or not, and its columns
                // are narrowed for the space (word-table-formats2.docx CS9, CS10, CS14)
                const given = readBody([
                    {
                        "w:tbl": [
                            { "w:tblPr": [spacing, { "w:tblLayout": { _attr: { "w:type": "fixed" } } }] },
                            {
                                "w:tr": [
                                    cell([{ "w:tcW": { _attr: { "w:w": 2000, "w:type": "dxa" } } }], p()),
                                    cell([{ "w:tcW": { _attr: { "w:w": 4000 } } }], p()),
                                ],
                            },
                        ],
                    },
                ]).blocks[0].block as TableBlock;
                expect(given.widen).to.deep.equal({ width: 300 });
                // Each cell as wide as it is with its room for the space: the space on each side, and inside the table's edges
                expect(given.rows[0].cells.map(({ ownWidth }) => ownWidth)).to.deep.equal([115, 215]);
            });

            it("should stop at space between cells that Word's PDFs haven't shown: a share, a row's own, beside borders left or right", () => {
                const spacing = (attributes: object): object => ({ "w:tblCellSpacing": { _attr: attributes } });
                const unsupportedOf = (properties: readonly unknown[], row: readonly unknown[] = [], width = 2000): string | undefined =>
                    (
                        readBody([
                            {
                                "w:tbl": [
                                    { "w:tblPr": properties },
                                    { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                                    { "w:tr": [{ "w:trPr": row }, cell([{ "w:tcW": { _attr: { "w:w": width, "w:type": "dxa" } } }], p())] },
                                ],
                            },
                        ]).blocks[0].block as TableBlock
                    ).unsupported;
                expect(unsupportedOf([spacing({ "w:w": 100, "w:type": "nil" })])).to.equal(undefined);
                expect(unsupportedOf([spacing({ "w:w": 100, "w:type": "pct" })])).to.equal(
                    "space between table cells as a share of the table's width",
                );
                expect(unsupportedOf([], [spacing({ "w:w": 100 })])).to.equal("a table row with space between its cells of its own");
                // word-table-formats2.docx CS11
                expect(unsupportedOf([spacing({ "w:w": 100 }), { "w:tblBorders": [border("left", 4)] }])).to.equal(
                    "space between table cells beside borders left or right of them",
                );
                // Borders above and below, and a table sized to its text, are followed (CS1 to CS3, CS5, CS6)
                expect(unsupportedOf([spacing({ "w:w": 100 }), { "w:tblBorders": [border("top", 4), border("insideH", 4)] }])).to.equal(
                    undefined,
                );
                expect(unsupportedOf([spacing({ "w:w": 100 })], [], 0)).to.equal(undefined);
            });

            it("should read text that runs up or down a cell, and a cell whose mark takes no room", () => {
                const { rows, unsupported } = tableOf(
                    [],
                    [
                        [value("w:textDirection", "btLr"), { "w:hideMark": {} }],
                        [value("w:textDirection", "lrTb"), value("w:hideMark", "false")],
                        [value("w:textDirection", "tbRl")],
                    ],
                );
                expect(rows.map(({ cells }) => [cells[0].vertical, cells[0].hideMark])).to.deep.equal([
                    [true, true],
                    [undefined, undefined],
                    [true, undefined],
                ]);
                // A row of only text running up or down is as tall as a line of its mark (word-table-formats.docx VT1)
                expect(unsupported).to.equal(undefined);
                // East Asian characters upright, or on their side
                expect(tableOf([], [[value("w:textDirection", "tbRlV")]]).unsupported).to.equal(
                    "text in a table cell in a direction not yet followed",
                );
                // Marks of different sizes, a picture or a table in it
                const marks = readBody([
                    {
                        "w:tbl": [
                            { "w:tr": [cell([value("w:textDirection", "btLr")], p(r(t("a"))), p(pPr(rPr(value("w:sz", 40))), r(t("b"))))] },
                        ],
                    },
                ]).blocks[0].block as TableBlock;
                expect(marks.unsupported).to.equal(
                    "text running up or down a table cell with marks of different sizes, a picture or a table",
                );
                const nested = readBody([{ "w:tbl": [{ "w:tr": [cell([value("w:textDirection", "btLr")], { "w:tbl": [] }, p())] }] }])
                    .blocks[0].block as TableBlock;
                expect(nested.unsupported).to.equal(
                    "text running up or down a table cell with marks of different sizes, a picture or a table",
                );
            });

            it("should read a table's indent from its style or itself, and stop at one that is a share of the width", () => {
                const indented = tableStyle("Indented", `<w:tblPr><w:tblInd w:w="2000" w:type="dxa"/></w:tblPr>`);
                expect(tableOf([value("w:tblStyle", "Indented")], [[]], styles(indented)).indent).to.equal(100);
                expect(tableOf([{ "w:tblInd": { _attr: { "w:w": -500, "w:type": "dxa" } } }], [[]]).indent).to.equal(-25);
                expect(tableOf([{ "w:tblInd": { _attr: { "w:w": 500, "w:type": "nil" } } }], [[]]).indent).to.equal(undefined);
                expect(tableOf([{ "w:tblInd": { _attr: { "w:w": 500, "w:type": "pct" } } }], [[]]).unsupported).to.equal(
                    "a table indented by a share of the width",
                );
            });

            it("should apply a table style's first row's formatting to it where the table turns it on, as Word does", () => {
                // word-watertight-stops.docx SP19: a table style's 16-point first row, where Normal has no size of its own
                const firstRow = tableStyle(
                    "FirstRow",
                    `<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:tblStylePr>`,
                );
                const look = (on: boolean): object => ({
                    "w:tblLook": { _attr: { "w:firstRow": on ? 1 : 0, "w:noHBand": 1, "w:noVBand": 1 } },
                });
                const fontsOf = (table: TableBlock): readonly unknown[] =>
                    table.rows.map(({ cells }) => ((cells[0].blocks[0] as ParagraphBlock).items[0] as { readonly font: unknown }).font);
                expect(fontsOf(tableOf([value("w:tblStyle", "FirstRow"), look(true)], [[], []], styles(firstRow)))).to.deep.equal([
                    { size: 16, bold: true },
                    {},
                ]);
                // SP19b: off
                expect(fontsOf(tableOf([value("w:tblStyle", "FirstRow"), look(false)], [[], []], styles(firstRow)))).to.deep.equal([
                    {},
                    {},
                ]);
                // Word's default as w:val, as Word 2007 writes it: the first row and column, and bands of rows
                const old = { "w:tblLook": { _attr: { "w:val": "04A0" } } };
                expect(fontsOf(tableOf([value("w:tblStyle", "FirstRow"), old], [[], []], styles(firstRow)))).to.deep.equal([
                    { size: 16, bold: true },
                    {},
                ]);
            });

            it("should apply the parts of a table style for some cells as Word does, with the borders and margins they give", () => {
                // word-table-formats.docx CF1 to CF9, word-table-formats2.docx CF10 to CF14
                const parts = tableStyle(
                    "Parts",
                    `<w:tblStylePr w:type="wholeTable"><w:rPr><w:sz w:val="20"/></w:rPr></w:tblStylePr><w:tblStylePr w:type="lastRow"><w:rPr><w:sz w:val="32"/></w:rPr><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="24"/></w:tcBorders><w:tcMar><w:top w:w="200" w:type="dxa"/></w:tcMar></w:tcPr></w:tblStylePr><w:tblStylePr w:type="band1Horz"><w:tcPr><w:shd w:val="clear" w:fill="EEEEEE"/></w:tcPr></w:tblStylePr>`,
                );
                const sizesOf = (table: TableBlock): readonly unknown[] =>
                    table.rows.map(
                        ({ cells }) =>
                            ((cells[0].blocks[0] as ParagraphBlock).items[0] as { readonly font: { readonly size?: number } }).font.size,
                    );
                const all = { "w:tblLook": { _attr: { "w:firstRow": 1, "w:lastRow": 1, "w:noHBand": 0, "w:noVBand": 1 } } };
                const laidOut = tableOf(
                    [value("w:tblStyle", "Parts"), all],
                    [[], [], [{ "w:tcMar": [{ "w:top": { _attr: { "w:w": 100 } } }] }]],
                    styles(parts),
                );
                // Word doesn't apply wholeTable, and a cell's own margins are over a part's
                expect(sizesOf(laidOut)).to.deep.equal([undefined, undefined, 16]);
                expect(laidOut.rows.map(({ borderTop }) => borderTop)).to.deep.equal([0, 0, 3]);
                expect(laidOut.rows[2].cells[0].marginTop).to.equal(5);
                expect(laidOut.unsupported).to.equal(undefined);
                // A table that doesn't say turns on its first row and column and its bands of rows, as Word's default does
                expect(sizesOf(tableOf([value("w:tblStyle", "Parts")], [[], [], []], styles(parts)))).to.deep.equal([
                    undefined,
                    undefined,
                    undefined,
                ]);
            });

            it("should stop at the parts of a table style for some cells that give properties of the table, its rows or cells not followed", () => {
                const unsupportedOf = (properties: string): string | undefined =>
                    tableOf(
                        [value("w:tblStyle", "Parts"), { "w:tblLook": { _attr: { "w:firstRow": 1 } } }],
                        [[], []],
                        styles(tableStyle("Parts", `<w:tblStylePr w:type="firstRow">${properties}</w:tblStylePr>`)),
                    ).unsupported;
                expect(unsupportedOf(`<w:trPr><w:cantSplit/></w:trPr>`)).to.equal("a table style's formatting for some of its cells");
                expect(unsupportedOf(`<w:tcPr><w:textDirection w:val="btLr"/></w:tcPr>`)).to.equal(
                    "a table style's formatting for some of its cells",
                );
                expect(unsupportedOf(`<w:tcPr><w:vAlign w:val="center"/></w:tcPr>`)).to.equal(undefined);
            });

            it("should stop at a row with table properties of its own, and a table style with formatting of its rows or cells", () => {
                const exceptions = readBody([
                    {
                        "w:tbl": [
                            { "w:tr": [{ "w:tblPrEx": [{ "w:tblBorders": [border("top", 8)] }] }, cell([], p())] },
                            { "w:tr": [{ "w:tblPrEx": [{ "w:shd": {} }] }, cell([], p())] },
                        ],
                    },
                ]).blocks[0].block as TableBlock;
                expect(exceptions.unsupported).to.equal("a table row with table properties of its own");
                const shaded = tableStyle(
                    "Shaded",
                    `<w:trPr><w:jc w:val="center"/></w:trPr><w:tcPr><w:shd w:val="clear" w:fill="EEEEEE"/></w:tcPr>`,
                );
                expect(tableOf([value("w:tblStyle", "Shaded")], [[]], styles(shaded)).unsupported).to.equal(undefined);
                const kept = tableStyle("Kept", `<w:trPr><w:cantSplit/></w:trPr>`);
                expect(tableOf([value("w:tblStyle", "Kept")], [[]], styles(kept)).unsupported).to.equal(
                    "a table style with formatting of its rows or cells",
                );
            });
        });

        const bookmark = (name: string): object => ({ "w:bookmarkStart": { _attr: { "w:name": name, "w:id": 1 } } });
        /** The names of the bookmarks at the start of each block of each cell of a table, or "table" for a table */
        const markersIn = (table: TableBlock): readonly (readonly (readonly unknown[])[])[] =>
            table.rows.map(({ cells }) =>
                cells.map(({ blocks }) =>
                    blocks.map((block) =>
                        block.type === "table" ? "table" : block.items.flatMap((item) => (item.type === "marker" ? [item.name] : [])),
                    ),
                ),
            );

        it("should start a bookmark before a row in the row's first cell, and one before a cell in the cell, and leave out those after the last", () => {
            const content = readBody([
                {
                    "w:tbl": [
                        { "w:tblPr": [] },
                        bookmark("first"),
                        { "w:tr": [cell([], p(r(t("a1")))), bookmark("second"), cell([], p(r(t("a2"))))] },
                        { "w:customXml": [bookmark("row")] },
                        {
                            "w:tr": [
                                { "w:trPr": [] },
                                bookmark("cell"),
                                cell(
                                    [],
                                    bookmark("text"),
                                    // A table without rows has no text to start them, so they start with the paragraph after
                                    { "w:tbl": [] },
                                    p(r(t("b1"))),
                                    bookmark("between"),
                                    p(r(t("b2"))),
                                    bookmark("cellEnd"),
                                ),
                                bookmark("rowEnd"),
                            ],
                        },
                        bookmark("tableEnd"),
                    ],
                },
            ]);
            expect(markersIn(content.blocks[0].block as TableBlock)).to.deep.equal([
                [[["first"]], [["second"]]],
                [["table", ["row", "cell", "text"], ["between"]]],
            ]);
        });

        it("should start a bookmark before a row or cell with no text in the next cell with any, and one before a table in its first cell with any", () => {
            // A cell of only a table without rows has no text, and nor does one with nothing in it
            const empty = { "w:tc": [{ "w:tbl": [] }] };
            const rows = readBody([
                {
                    "w:tbl": [
                        bookmark("row"),
                        { "w:tr": [empty, cell([], p(r(t("a2"))))] },
                        { "w:tr": [cell([], p(r(t("b1")))), bookmark("cell"), { "w:tc": [] }] },
                        { "w:tr": [cell([], p(r(t("c1"))))] },
                    ],
                },
            ]);
            expect(markersIn(rows.blocks[0].block as TableBlock)).to.deep.equal([[["table"], [["row"]]], [[[]], []], [[["cell"]]]]);
            const table = readBody([
                bookmark("table"),
                { "w:tbl": [{ "w:tr": [empty] }, { "w:tr": [empty, { "w:tc": [{ "w:tbl": [] }, p(r(t("text")))] }] }] },
                p(r(t("after"))),
            ]);
            expect(markersIn(table.blocks[0].block as TableBlock)).to.deep.equal([[["table"]], [["table"], ["table", ["table"]]]]);
            expect(itemsOf(table, 1)).to.have.length(1);
        });
    });

    describe("the body", () => {
        it("should stop at an equation outside a paragraph, and at a content control bound to custom XML, which Word fills in from it, wherever it is", () => {
            const bound = (...content: readonly unknown[]): object => ({
                "w:sdt": [
                    { "w:sdtPr": [{ "w:dataBinding": { _attr: { "w:xpath": "/properties/title", "w:storeItemID": "{1}" } } }] },
                    { "w:sdtContent": content },
                ],
            });
            const unsupportedOf = (element: unknown): string | undefined => readBody([element]).blocks[0].block.unsupported;
            expect(unsupportedOf({ "m:oMathPara": [] })).to.equal("an equation");
            expect(unsupportedOf(bound(p(r(t("Title")))))).to.equal("a content control filled from custom XML");
            expect(unsupportedOf(p(bound(r(t("Title")))))).to.equal("a content control filled from custom XML");
            const cell = { "w:tc": [p()] };
            expect(unsupportedOf({ "w:tbl": [{ "w:tr": [{ "w:tc": [bound(p())] }] }] })).to.equal(
                "a content control filled from custom XML",
            );
            expect(unsupportedOf({ "w:tbl": [bound({ "w:tr": [cell] })] })).to.equal("a content control filled from custom XML");
            expect(unsupportedOf({ "w:tbl": [{ "w:tr": [cell, bound(cell)] }] })).to.equal("a content control filled from custom XML");
            expect(unsupportedOf({ "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": [p(r(t("Title")))] }] })).to.equal(undefined);
        });

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

        it("should start a bookmark between blocks with the next: a paragraph, or the first cell of a table, where its text starts", () => {
            const content = readBody([
                { "w:bookmarkStart": { _attr: { "w:name": "table", "w:id": 1 } } },
                { "w:tbl": [{ "w:tr": [{ "w:tc": [{ "w:tbl": [{ "w:tr": [{ "w:tc": [p(r(t("in")))] }] }] }, p()] }] }] },
                // A table without rows has no text to start a bookmark, so it starts with the paragraph after
                { "w:bookmarkStart": { _attr: { "w:name": "paragraph", "w:id": 2 } } },
                { "w:tbl": [] },
                { "w:bookmarkStart": { _attr: { "w:id": 3 } } },
                p(r(t("a"))),
            ]);
            const table = content.blocks[0].block as TableBlock;
            const inner = table.rows[0].cells[0].blocks[0] as TableBlock;
            expect((inner.rows[0].cells[0].blocks[0] as ParagraphBlock).items[0]).to.deep.equal({ type: "marker", name: "table" });
            expect(itemsOf(content, 2)[0]).to.deep.equal({ type: "marker", name: "paragraph" });
            expect(itemsOf(content, 2)).to.have.length(2);
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
                topGutter: 0,
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

        it("should take a gutter at the top from the page's height rather than the width of its text, when the document puts it there", () => {
            const gutter = (top: number, ...settings: readonly object[]): DocumentContent =>
                readWithSettings([{ "w:sectPr": [{ "w:pgMar": { _attr: { "w:top": top, "w:gutter": 400 } } }] }], settings);
            // Letter's 612 less the margins of 72 (`word-watertight-settings.docx` ST3)
            expect(gutter(1440, { "w:gutterAtTop": {} }).sections[0]).to.deep.include({ gutter: 0, topGutter: 20, columns: [468] });
            // And less the gutter too where it is beside the text
            expect(gutter(1440).sections[0]).to.deep.include({ gutter: 20, topGutter: 0, columns: [448] });
            // Where Word puts it with mirrored margins, or below a negative top margin, isn't known
            const reason = "a gutter at the top with mirrored margins or a negative top margin";
            expect(gutter(1440, { "w:gutterAtTop": {} }, { "w:mirrorMargins": {} }).sections[0].unsupported).to.equal(reason);
            expect(gutter(-1440, { "w:gutterAtTop": {} }).sections[0].unsupported).to.equal(reason);
            expect(gutter(1440, { "w:mirrorMargins": {} }).sections[0].unsupported).to.equal(undefined);
            expect(
                readWithSettings(
                    [{ "w:sectPr": [{ "w:pgMar": { _attr: { "w:top": -1440 } } }] }],
                    [{ "w:gutterAtTop": {} }, { "w:mirrorMargins": {} }],
                ).sections[0].unsupported,
            ).to.equal(undefined);
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
            expect(section({ "w15:footnoteColumns": { _attr: { "w:val": 2 } } }).sections[0].unsupported).to.equal(
                "footnotes in columns of their own",
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
        const readSettings = (...settings: readonly object[]): DocumentContent => readWithSettings([], settings);

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

        it("should mark a document printed as a folded booklet or two pages to a sheet, or whose styles Word updates from its template, as unsupported", () => {
            expect(readSettings({ "w:bookFoldPrinting": {} }).unsupported).to.equal("pages printed as a folded booklet");
            expect(readSettings({ "w:bookFoldRevPrinting": {} }).unsupported).to.equal("pages printed as a folded booklet");
            expect(readSettings({ "w:printTwoOnOne": {} }).unsupported).to.equal("two pages printed on each sheet");
            expect(readSettings({ "w:linkStyles": {} }).unsupported).to.equal(
                "styles updated from the document's template when Word opens it",
            );
            expect(readSettings(value("w:bookFoldPrinting", "false"), value("w:linkStyles", 0)).unsupported).to.equal(undefined);
        });

        it("should mark a document in the compatibility mode of a version of Word before 2013 as unsupported", () => {
            expect(readBody([], { compatibility: { version: 14 } }).unsupported).to.equal("a document in compatibility mode");
            expect(readBody([], { compatibility: { version: 15 } }).unsupported).to.equal(undefined);
        });

        const UNFOLLOWED_COMPATIBILITY = "a compatibility setting not yet followed";

        /** Reads a document in Word 2013's compatibility mode whose compatibility settings (`w:compat`) are these too */
        const readCompatibility = (...settings: readonly object[]): DocumentContent =>
            readSettings({ "w:compat": [{ "w:compatSetting": { _attr: { "w:name": "compatibilityMode", "w:val": 15 } } }, ...settings] });

        it("should mark a document with any of docx's compatibility settings on as unsupported, but the one followed", () => {
            const settings: readonly (keyof ICompatibilityOptions)[] = [
                "useSingleBorderforContiguousCells",
                "wordPerfectJustification",
                "noTabStopForHangingIndent",
                "noLeading",
                "spaceForUnderline",
                "noColumnBalance",
                "balanceSingleByteDoubleByteWidth",
                "noExtraLineSpacing",
                "doNotLeaveBackslashAlone",
                "underlineTrailingSpaces",
                "doNotExpandShiftReturn",
                "spacingInWholePoints",
                "lineWrapLikeWord6",
                "printBodyTextBeforeHeader",
                "printColorsBlack",
                "spaceWidth",
                "showBreaksInFrames",
                "subFontBySize",
                "suppressBottomSpacing",
                "suppressTopSpacing",
                "suppressSpacingAtTopOfPage",
                "suppressTopSpacingWP",
                "suppressSpBfAfterPgBrk",
                "swapBordersFacingPages",
                "convertMailMergeEsc",
                "truncateFontHeightsLikeWP6",
                "macWordSmallCaps",
                "usePrinterMetrics",
                "doNotSuppressParagraphBorders",
                "wrapTrailSpaces",
                "footnoteLayoutLikeWW8",
                "shapeLayoutLikeWW8",
                "alignTablesRowByRow",
                "forgetLastTabAlignment",
                "adjustLineHeightInTable",
                "autoSpaceLikeWord95",
                "noSpaceRaiseLower",
                "layoutRawTableWidth",
                "layoutTableRowsApart",
                "useWord97LineBreakRules",
                "doNotBreakWrappedTables",
                "doNotSnapToGridInCell",
                "selectFieldWithFirstOrLastCharacter",
                "applyBreakingRules",
                "doNotWrapTextWithPunctuation",
                "doNotUseEastAsianBreakRules",
                "useWord2002TableStyleRules",
                "growAutofit",
                "useFELayout",
                "useNormalStyleForList",
                "doNotUseIndentAsNumberingTabStop",
                "useAlternateEastAsianLineBreakRules",
                "allowSpaceOfSameStyleInTable",
                "doNotSuppressIndentation",
                "doNotAutofitConstrainedTables",
                "autofitToFirstFixedWidthCell",
                "underlineTabInNumberingList",
                "displayHangulFixedWidth",
                "splitPgBreakAndParaMark",
                "doNotVerticallyAlignCellWithSp",
                "doNotBreakConstrainedForcedTable",
                "ignoreVerticalAlignmentInTextboxes",
                "useAnsiKerningPairs",
                "cachedColumnBalance",
            ];
            for (const setting of settings) {
                expect(readBody([], { compatibility: { [setting]: true } }).unsupported, setting).to.equal(UNFOLLOWED_COMPATIBILITY);
                // Off, as docx writes false, Word lays it out as without it
                expect(readBody([], { compatibility: { [setting]: false } }).unsupported, setting).to.equal(undefined);
            }
            // Automatic spacing as HTML has it is followed (see "automatic spacing")
            expect(readBody([], { compatibility: { doNotUseHTMLParagraphAutoSpacing: true } }).unsupported).to.equal(undefined);
            // Written as Word writes it, with no value, too
            expect(readCompatibility({ "w:noLeading": {} }).unsupported).to.equal(UNFOLLOWED_COMPATIBILITY);
        });

        /** A compatibility setting of Word's own, as Word writes it, or without its application when `uri` is null */
        const wordSetting = (name: string, val: string, uri: string | null = "http://schemas.microsoft.com/office/word"): object => ({
            "w:compatSetting": { _attr: { "w:name": name, ...(uri === null ? {} : { "w:uri": uri }), "w:val": val } },
        });

        it("should lay out a document with the compatibility settings Word writes in the documents it makes, on or off", () => {
            const written = (val: string): readonly object[] =>
                [
                    "overrideTableStyleFontSizeAndJustification",
                    "enableOpenTypeFeatures",
                    "doNotFlipMirrorIndents",
                    "differentiateMultirowTableHeaders",
                    "useWord2013TrackBottomHyphenation",
                ].map((name) => wordSetting(name, val));
            expect(readCompatibility(...written("1")).unsupported).to.equal(undefined);
            expect(readCompatibility(...written("0")).unsupported).to.equal(undefined);
        });

        it("should mark a document with Word's other compatibility settings on, or settings Word may have that aren't known, as unsupported", () => {
            for (const name of ["allowHyphenationAtTrackBottom", "allowTextAfterFloatingTableBreak"]) {
                expect(readCompatibility(wordSetting(name, "1")).unsupported, name).to.equal(UNFOLLOWED_COMPATIBILITY);
                expect(readCompatibility(wordSetting(name, "true", null)).unsupported, name).to.equal(UNFOLLOWED_COMPATIBILITY);
                // Off, as Word has them unless they are given
                expect(readCompatibility(wordSetting(name, "0")).unsupported, name).to.equal(undefined);
            }
            // One whose default isn't known, even off
            expect(readCompatibility(wordSetting("someLaterSetting", "0")).unsupported).to.equal(UNFOLLOWED_COMPATIBILITY);
        });

        it("should lay out a document with compatibility settings for other applications, as Word leaves them to them", () => {
            expect(readCompatibility(wordSetting("noLeading", "1", "http://example.com/other")).unsupported).to.equal(undefined);
        });

        it("should read the compatibility mode of Word's own setting, not another application's of the same name", () => {
            const modes = (...settings: readonly object[]): DocumentContent => readSettings({ "w:compat": settings });
            const other = wordSetting("compatibilityMode", "15", "http://example.com/other");
            expect(modes(other, wordSetting("compatibilityMode", "14")).unsupported).to.equal("a document in compatibility mode");
            expect(modes(other).unsupported).to.equal("a document in compatibility mode");
            expect(modes(other, wordSetting("compatibilityMode", "15", null)).unsupported).to.equal(undefined);
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

    describe("tracked changes", () => {
        const REVISION = { id: 1, author: "Reviewer", date: "2026-10-02T09:00:00Z" };
        const deletedMark = rPr({ "w:del": { _attr: { "w:id": 1 } } });
        const bookmark = (name: string): object => ({ "w:bookmarkStart": { _attr: { "w:name": name, "w:id": 9 } } });
        const sectPr = (...children: readonly object[]): object => ({ "w:sectPr": children });
        const pageSize = (width: number, height: number): object => ({ "w:pgSz": { _attr: { "w:w": width, "w:h": height } } });
        const cell = (...paragraphs: readonly object[]): object => ({
            "w:tc": [{ "w:tcPr": [{ "w:tcW": { _attr: { "w:w": 2000 } } }] }, ...paragraphs],
        });
        const fixed = { "w:tblLayout": { _attr: { "w:type": "fixed" } } };
        const row = (properties: readonly object[], ...cells: readonly object[]): object => ({
            "w:tr": [{ "w:trPr": properties }, ...cells],
        });
        const deletedRow = { "w:del": { _attr: { "w:id": 2 } } };
        const tableOf = (properties: readonly object[], ...rows: readonly object[]): object => ({
            "w:tbl": [{ "w:tblPr": properties }, { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] }, ...rows],
        });
        const texts = (blocks: readonly unknown[]): readonly string[] =>
            (blocks as readonly ParagraphBlock[]).map((block) =>
                block.items.map((item) => (item.type === "text" ? item.text : "")).join(""),
            );

        it("should join a paragraph whose mark is deleted to the next, in the next one's formatting, as Word lays it out", () => {
            // word-watertight-markup.docx MK3, word-tracked-changes.docx MK7a and MK7c: the next paragraph's alignment and
            // spacing, the bookmarks between them in their place, and a run of deleted marks joined to the first that isn't
            const content = readBody([
                p(pPr(value("w:jc", "right"), { "w:spacing": { _attr: { "w:after": 600 } } }, deletedMark), r(t("first"))),
                bookmark("between"),
                p(pPr(value("w:jc", "center"), deletedMark), r(t("second"))),
                p(r(t("third"))),
                p(r(t("after"))),
            ]);
            expect(content.blocks).to.have.length(2);
            expect(itemsOf(content).map((item) => (item.type === "text" ? item.text : item.type))).to.deep.equal([
                "first",
                "marker",
                "second",
                "third",
            ]);
            expect(paragraphOf(content).format).to.deep.equal({});
            expect(paragraphOf(content).unsupported).to.equal(undefined);
            expect(textOf(content, 1)).to.equal("after");
        });

        it("should lay out the text of a paragraph whose mark is deleted in the next one's style and list, as Word does", () => {
            // word-tracked-changes.docx MK7e, MK7f and MK9: the first paragraph's text in the next one's style, and one number
            // for the paragraphs joined, which the list counts once
            const content = readWritten({
                styles: { paragraphStyles: [{ id: "Big", name: "Big", run: { size: 32 } }] },
                numbering: {
                    config: [
                        {
                            reference: "list",
                            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START }],
                        },
                    ],
                },
                sections: [
                    {
                        children: [
                            new Paragraph({ style: "Big", run: { deletion: REVISION }, children: [new TextRun("first")] }),
                            new Paragraph({ children: [new TextRun("second")] }),
                            new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun("one")] }),
                            new Paragraph({
                                numbering: { reference: "list", level: 0 },
                                run: { deletion: REVISION },
                                children: [new TextRun("two")],
                            }),
                            new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun("three")] }),
                            new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun("four")] }),
                        ],
                    },
                ],
            });
            const [first, second] = itemsOf(content);
            expect(first).to.deep.include({ type: "text", text: "first" });
            expect((first as { readonly font: object }).font).to.deep.equal((second as { readonly font: object }).font);
            expect(paragraphOf(content).style).to.not.equal("Big");
            expect([1, 2, 3].map((index) => textOf(content, index))).to.deep.equal(["1.one", "2.twothree", "3.four"]);
        });

        it("should keep a paragraph whose mark is deleted as it is when no paragraph follows it, as Word does", () => {
            // word-tracked-changes.docx MK8a, MK8b and MK8d: before a table, at the end of a cell, and at the end of the document
            const content = readBody([
                p(pPr(deletedMark), r(t("before"))),
                tableOf([fixed], row([], cell(p(pPr(deletedMark), r(t("one"))), p(pPr(deletedMark), r(t("two")))))),
                p(pPr(deletedMark), r(t("last"))),
            ]);
            expect(content.blocks.map(({ block }) => block.unsupported)).to.deep.equal([undefined, undefined, undefined]);
            expect(textOf(content)).to.equal("before");
            expect(texts((content.blocks[1].block as TableBlock).rows[0].cells[0].blocks)).to.deep.equal(["onetwo"]);
            expect(textOf(content, 2)).to.equal("last");
        });

        it("should leave a section whose break is deleted to the next section, laid out on its pages, as Word does", () => {
            // word-tracked-changes.docx MK8c: a section on A4 whose break is deleted, before one on landscape pages
            const content = readBody([
                p(r(t("first"))),
                p(pPr(deletedMark, sectPr(pageSize(11906, 16838)))),
                p(r(t("second"))),
                sectPr(pageSize(16838, 11906)),
            ]);
            expect(content.sections).to.have.length(1);
            expect(content.sections[0]).to.deep.include({ pageWidth: 841.9, pageHeight: 595.3 });
            expect(content.blocks.map(({ block, section }) => [texts([block])[0], section])).to.deep.equal([
                ["first", 0],
                ["second", 0],
            ]);
        });

        it("should mark a deleted section break as unsupported where Word's layout of it hasn't been seen", () => {
            // Between sections that start differently, and with no paragraph after it
            expect(
                readBody([p(pPr(deletedMark, sectPr(value("w:type", "continuous")))), p(r(t("next"))), sectPr()]).blocks[0].block
                    .unsupported,
            ).to.equal("a deleted section break between sections that start, number their pages or have headers and footers differently");
            expect(readBody([p(pPr(deletedMark, sectPr())), tableOf([fixed], row([], cell(p())))]).blocks[0].block.unsupported).to.equal(
                "a deleted section break with no paragraph after it",
            );
            // The next section's properties are found past paragraphs that don't end one, as the body's own
            expect(readBody([p(pPr(deletedMark, sectPr())), p(r(t("a"))), p(r(t("b")))]).blocks[0].block.unsupported).to.equal(undefined);
        });

        it("should mark a paragraph mark moved, and a deleted mark at the edge of a content control, as unsupported", () => {
            expect(
                readBody([p(pPr(rPr({ "w:moveFrom": { _attr: { "w:id": 3 } } })), r(t("moved"))), p(r(t("next")))]).blocks[0].block
                    .unsupported,
            ).to.equal("a paragraph mark moved in a tracked change");
            const control = (...content: readonly object[]): object => ({ "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": content }] });
            const edge = "a deleted paragraph mark at the edge of a content control";
            // Before a content control, and at the end of one
            expect(readBody([p(pPr(deletedMark), r(t("a"))), control(p(r(t("b"))))]).blocks[0].block.unsupported).to.equal(edge);
            expect(readBody([control(p(pPr(deletedMark), r(t("a")))), p(r(t("b")))]).blocks[0].block.unsupported).to.equal(edge);
            // In custom XML, and in a content control, paragraphs are joined as anywhere else
            const nested = readBody([
                { "w:customXml": [p(pPr(deletedMark), r(t("a"))), p(r(t("b")))] },
                control(p(pPr(deletedMark), r(t("c"))), p(r(t("d")))),
            ]);
            expect(nested.blocks.map(({ block }) => texts([block])[0])).to.deep.equal(["ab", "cd"]);
        });

        it("should leave out deleted pictures, tabs, breaks and text moved elsewhere, but keep their bookmarks, as Word does", () => {
            // word-tracked-changes.docx MK10a to MK10d and MK10f
            const content = readBody([
                p(
                    r(t("a")),
                    {
                        "w:del": [
                            r({ "w:tab": {} }, { "w:br": { _attr: { "w:type": "page" } } }, { "w:delText": ["text"] }),
                            bookmark("deleted"),
                            { "w:hyperlink": [r({ "w:delText": ["link"] })] },
                            { "w:sdt": [{ "w:sdtPr": [] }, { "w:sdtContent": [r({ "w:delText": ["control"] })] }] },
                            { "w:proofErr": {} },
                        ],
                    },
                    { "w:moveFrom": [r(t("moved"))] },
                    { "w:moveTo": [r(t("b"))] },
                ),
            ]);
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "a", font: {} },
                { type: "marker", name: "deleted" },
                { type: "text", text: "b", font: {} },
            ]);
        });

        it("should number a footnote whose reference is deleted without laying it out, as Word does", () => {
            // word-tracked-changes.docx MK10e: the footnote after it is numbered 2
            const content = readBody(
                [
                    p(
                        r(t("a")),
                        { "w:del": [r({ "w:footnoteReference": { _attr: { "w:id": 1 } } })] },
                        r({ "w:footnoteReference": { _attr: { "w:id": 2 } } }),
                    ),
                ],
                { footnotes: { 1: { children: [new Paragraph("Deleted")] }, 2: { children: [new Paragraph("Kept")] } } },
            );
            expect(itemsOf(content)).to.deep.equal([
                { type: "text", text: "a", font: {} },
                { type: "marker", name: "footnote 2" },
                { type: "text", text: "2", font: {} },
            ]);
            expect([...content.footnotes.keys()]).to.deep.equal(["footnote 2"]);
            // A deleted reference in a header, which has no notes, is nothing
            const header = readWritten({
                footnotes: { 1: { children: [new Paragraph("Note")] } },
                sections: [
                    {
                        headers: {
                            default: new Header({
                                children: [
                                    new Paragraph({
                                        children: [new DeletedTextRun({ ...REVISION, children: [new FootnoteReferenceRun(1)] })],
                                    }),
                                ],
                            }),
                        },
                        children: [new Paragraph("Body")],
                    },
                ],
            });
            expect(header.sections[0].headers.default![0].unsupported).to.equal(undefined);
            expect((header.sections[0].headers.default![0] as ParagraphBlock).items).to.deep.equal([]);
        });

        it("should leave out a field deleted whole, as Word does, and mark one only partly deleted as unsupported", () => {
            const del = (...runs: readonly object[]): object => ({ "w:del": runs });
            const deletedInstruction = (text: string): object => r({ "w:delInstrText": [text] });
            // Deleted whole, its runs each in a deletion of its own, as Word writes them, then a field after it, which
            // is read as before
            const whole = readBody([
                p(
                    r(t("a")),
                    del(field("begin")),
                    del(deletedInstruction("PAGEREF here")),
                    del(field("separate")),
                    del(r({ "w:delText": ["3"] })),
                    del(field("end")),
                    r(t("b")),
                ),
                p(field("begin"), instruction("PAGEREF there"), field("separate"), r(t("9")), field("end")),
            ]);
            expect(textOf(whole)).to.equal("ab");
            expect(textOf(whole, 1)).to.equal("[there]");
            expect(whole.blocks.map(({ block }) => block.unsupported)).to.deep.equal([undefined, undefined]);
            const partly = (...content: readonly object[]): string | undefined => readBody([p(...content)]).blocks[0].block.unsupported;
            const reason = "a field partly deleted in a tracked change";
            // Its end deleted, or its separator, and not its start; its start deleted and not its separator or end; and
            // its result not deleted, where its start is
            expect(
                partly(field("begin"), instruction("PAGEREF here"), field("separate"), r(t("3")), del(field("end")), r(t("after"))),
            ).to.equal(reason);
            expect(partly(field("begin"), instruction("PAGE"), del(field("separate")), r(t("3")), field("end"))).to.equal(reason);
            expect(partly(del(field("begin")), instruction("PAGE"), field("separate"), r(t("3")), field("end"))).to.equal(reason);
            expect(
                partly(del(field("begin")), del(deletedInstruction("PAGE")), del(field("separate")), r(t("3")), del(field("end"))),
            ).to.equal(reason);
        });

        it("should mark a deleted endnote reference, and a note reference moved, as unsupported", () => {
            const note = (name: string): object => r({ [name]: { _attr: { "w:id": 1 } } });
            expect(readBody([p({ "w:del": [note("w:endnoteReference")] })]).blocks[0].block.unsupported).to.equal(
                "a deleted endnote reference",
            );
            expect(readBody([p({ "w:moveFrom": [note("w:footnoteReference")] })]).blocks[0].block.unsupported).to.equal(
                "a note reference moved in a tracked change",
            );
            // A deleted footnote reference with a mark of its own, which Word may not count, as one that isn't deleted
            const ownMark = r({ "w:footnoteReference": { _attr: { "w:id": 1, "w:customMarkFollows": 1 } } });
            expect(readBody([p({ "w:del": [ownMark] })]).blocks[0].block.unsupported).to.equal(
                "a footnote or endnote with a mark of its own",
            );
        });

        it("should leave out a deleted row, and a table all of whose rows are deleted, with their bookmarks after them, as Word does", () => {
            // word-watertight-markup.docx MK6, word-tracked-changes.docx MK11a and MK11g: tables without borders
            const content = readBody([
                {
                    "w:tbl": [
                        { "w:tblPr": [fixed] },
                        { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                        bookmark("row"),
                        row([deletedRow, { "w:tblHeader": {} }], bookmark("cell"), cell(p(bookmark("inside"), r(t("deleted"))))),
                        row([], cell(p(r(t("kept"))))),
                        row([deletedRow], cell(p(r(t("deleted too"))))),
                    ],
                },
                tableOf([fixed], row([deletedRow], cell(p(r(t("gone")))))),
                p(r(t("after"))),
            ]);
            expect(content.blocks).to.have.length(2);
            const table = content.blocks[0].block as TableBlock;
            expect(table.rows).to.have.length(1);
            expect(table.rows[0]).to.deep.include({ header: false, borderTop: 0, borderBottom: 0 });
            expect(table.rows[0].cells[0].blocks[0]).to.deep.include({
                items: [
                    { type: "marker", name: "row" },
                    { type: "marker", name: "cell" },
                    { type: "marker", name: "inside" },
                    { type: "text", text: "kept", font: {} },
                ],
            });
            // A table laid out fixed isn't sized by its deleted rows
            expect(table.deletedRows).to.equal(undefined);
            expect(table.unsupported).to.equal(undefined);
            expect(textOf(content, 1)).to.equal("after");
        });

        it("should start the bookmarks in a deleted row of a table laid out fixed in the next row, with its deleted tabs and breaks", () => {
            // Nothing sizes the columns of a table laid out fixed by its deleted row, so its deleted runs are read as the
            // layout reads them: nothing, but for their bookmarks
            const content = readBody([
                tableOf(
                    [fixed],
                    row([deletedRow], cell(p(bookmark("deleted"), { "w:del": [r({ "w:tab": {} }, { "w:br": {} })] }))),
                    row([], cell(p(r(t("kept"))))),
                ),
            ]);
            const table = content.blocks[0].block as TableBlock;
            expect(table.unsupported).to.equal(undefined);
            expect((table.rows[0].cells[0].blocks[0] as ParagraphBlock).items[0]).to.deep.equal({ type: "marker", name: "deleted" });
        });

        describe("borders around a deleted row", () => {
            const border = (name: string, eighths = 24, style = "single"): object => ({
                [name]: { _attr: { "w:val": style, "w:sz": eighths } },
            });
            const allOf = (top: number, insideH: number, bottom: number): object => ({
                "w:tblBorders": [border("w:top", top), border("w:insideH", insideH), border("w:bottom", bottom)],
            });
            /** A table of five rows, those of `deleted` (from 1) deleted, with borders of their own when given */
            const tableWith = (
                properties: readonly object[],
                deleted: readonly number[],
                deletedCell: readonly object[] = [],
            ): TableBlock =>
                readBody([
                    tableOf(
                        [fixed, ...properties],
                        ...[1, 2, 3, 4, 5].map((at) =>
                            deleted.includes(at)
                                ? row([deletedRow], { "w:tc": [{ "w:tcPr": deletedCell }, p(r(t(`row ${at}`)))] })
                                : row([], cell(p(r(t(`row ${at}`))))),
                        ),
                    ),
                ]).blocks[0].block as TableBlock;
            const roomsOf = (table: TableBlock): readonly (readonly number[])[] =>
                table.rows.map(({ borderTop, borderBottom }) => [borderTop, borderBottom]);
            const ownBorders = (...borders: readonly object[]): readonly object[] => [{ "w:tcBorders": borders }];

            it("should lay out a table whose borders are all alike as though its deleted rows weren't there, as Word does", () => {
                // word-tracked-tables.docx MK14a to MK14f: borders of 3 points, the third row deleted, the first, the
                // last, and the second and third
                const without = [
                    [3, 0],
                    [3, 0],
                    [3, 0],
                    [3, 3],
                ];
                for (const deleted of [[3], [1], [5]]) {
                    const table = tableWith([allOf(24, 24, 24)], deleted);
                    expect(table.unsupported).to.equal(undefined);
                    expect(roomsOf(table)).to.deep.equal(without);
                }
                expect(roomsOf(tableWith([allOf(24, 24, 24)], [2, 3]))).to.deep.equal([
                    [3, 0],
                    [3, 0],
                    [3, 3],
                ]);
                // Borders left and right of the cells, which a deleted row leaves as they are
                const sides = tableWith([{ "w:tblBorders": [border("w:left"), border("w:insideV")] }], [3]);
                expect(sides.unsupported).to.equal(undefined);
                expect(roomsOf(sides)).to.deep.equal([
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ]);
            });

            it("should keep a deleted row's own borders as one border between the rows around it, as Word does", () => {
                // word-tracked-tables.docx MK14g: no borders but the deleted third row's, 3 points above and below it,
                // which leave one border of 3 points between the second and fourth
                const table = tableWith([], [3], ownBorders(border("w:top"), border("w:bottom")));
                expect(table.unsupported).to.equal(undefined);
                expect(roomsOf(table)).to.deep.equal([
                    [0, 0],
                    [0, 0],
                    [3, 0],
                    [0, 0],
                ]);
            });

            it("should mark a deleted row whose borders take other room than those around it as unsupported, as Word's room isn't known", () => {
                const reason = "a deleted table row with borders other than those around it";
                // Its own border above it and none below it
                expect(tableWith([], [3], ownBorders(border("w:top"))).unsupported).to.equal(reason);
                // At the top and bottom, the table's top or bottom border wider than its borders between rows
                expect(tableWith([allOf(24, 8, 8)], [1]).unsupported).to.equal(reason);
                expect(tableWith([allOf(8, 8, 24)], [5]).unsupported).to.equal(reason);
                // At the top, its own borders, which aren't the table's top border, none
                expect(tableWith([], [1], ownBorders(border("w:top"), border("w:bottom"))).unsupported).to.equal(reason);
                // Its own border in a style not yet followed
                expect(tableWith([], [3], ownBorders(border("w:top", 8, "apples"))).unsupported).to.equal(
                    "a table border in a style not yet followed",
                );
            });

            it("should leave out the space between cells around a deleted row, as Word does, but for a table with borders", () => {
                // word-tracked-tables.docx MK14h and MK14i: 100 twips between cells, and no borders
                const spacing = { "w:tblCellSpacing": { _attr: { "w:w": 100, "w:type": "dxa" } } };
                const table = tableWith([spacing], [3]);
                expect(table.unsupported).to.equal(undefined);
                expect(roomsOf(table)).to.deep.equal([
                    [10, 5],
                    [5, 5],
                    [5, 5],
                    [5, 10],
                ]);
                // Whether Word keeps the deleted row's borders, or which of the table's the rows around it take, hasn't
                // been seen
                const bordered = "a deleted row in a table with borders and space between its cells";
                expect(tableWith([spacing, allOf(8, 8, 8)], [3]).unsupported).to.equal(bordered);
                expect(tableWith([spacing], [3], ownBorders(border("w:bottom"))).unsupported).to.equal(bordered);
            });
        });

        describe("a table style around a deleted row", () => {
            // A table style whose parts are each of a size of their own: its first row 16 points, its last 14, and its
            // bands of one row 12 and 10
            const part = (type: string, halfPoints: number): string =>
                `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${halfPoints}"/></w:rPr></w:tblStylePr>`;
            const options = {
                externalStyles: `<w:styles xmlns:w="main"><w:style w:type="table" w:styleId="Parts"><w:name w:val="Parts"/><w:tblPr><w:tblStyleRowBandSize w:val="1"/></w:tblPr>${part("firstRow", 32)}${part("lastRow", 28)}${part("band1Horz", 24)}${part("band2Horz", 20)}</w:style></w:styles>`,
            };
            const look = (firstRow: number, lastRow: number, noHBand: number): object => ({
                "w:tblLook": { _attr: { "w:firstRow": firstRow, "w:lastRow": lastRow, "w:noHBand": noHBand, "w:noVBand": 1 } },
            });
            const tableWith = (tableLook: object, ...rows: readonly object[]): TableBlock =>
                readBody([tableOf([fixed, value("w:tblStyle", "Parts"), tableLook], ...rows)], options).blocks[0].block as TableBlock;
            /** The size of the text of each row laid out */
            const sizesOf = (table: TableBlock): readonly (number | undefined)[] =>
                table.rows.map(({ cells }) => {
                    const [item] = (cells[0].blocks[0] as ParagraphBlock).items;
                    return item.type === "text" ? item.font.size : undefined;
                });
            const kept = (text: string, ...properties: readonly object[]): object => row(properties, cell(p(r(t(text)))));
            const deleted = (text: string, ...properties: readonly object[]): object =>
                row([deletedRow, ...properties], cell(p(r(t(text)))));

            it("should format each row by its place among all the rows, the deleted ones too, as Word does", () => {
                // word-tracked-tables.docx MK14j: the first row deleted, so the second isn't the first
                const first = tableWith(look(1, 0, 1), deleted("1"), kept("2"), kept("3"));
                expect(first.unsupported).to.equal(undefined);
                expect(sizesOf(first)).to.deep.equal([undefined, undefined]);
                // MK14k: the last row deleted, so the one before isn't the last
                const last = tableWith(look(0, 1, 1), kept("1"), kept("2"), deleted("3"));
                expect(last.unsupported).to.equal(undefined);
                expect(sizesOf(last)).to.deep.equal([undefined, undefined]);
                // MK14l: bands of one row, which count the deleted second row
                const bands = tableWith(look(0, 0, 0), kept("1"), deleted("2"), kept("3"), kept("4"), kept("5"));
                expect(bands.unsupported).to.equal(undefined);
                expect(sizesOf(bands)).to.deep.equal([12, 12, 10, 12]);
            });

            it("should mark a deleted row in a header of several rows as unsupported where it isn't known which parts of the style apply", () => {
                const header = { "w:tblHeader": {} };
                // The first of two header rows deleted, with the first row turned off: the second is in the band before
                // the first with the deleted row counted, and in the first without it
                expect(tableWith(look(0, 0, 0), deleted("1", header), kept("2", header), kept("3"), kept("4")).unsupported).to.equal(
                    "a deleted row in a table's header of several rows, whose style formats some of its rows",
                );
                // With the first row turned on, the rows are formatted alike either way: the header row left is the first row,
                // and the bands start below it
                const alike = tableWith(look(1, 0, 0), deleted("1", header), kept("2", header), kept("3"), kept("4"));
                expect(alike.unsupported).to.equal(undefined);
                expect(sizesOf(alike)).to.deep.equal([16, 12, 10]);
            });
        });

        it("should start a merge in a cell merged down from a deleted row, as Word lays it out when it is empty", () => {
            // word-tracked-changes.docx MK11b and MK11c
            const merged = (merge: string, ...paragraphs: readonly object[]): object => ({
                "w:tc": [{ "w:tcPr": [{ "w:tcW": { _attr: { "w:w": 2000 } } }, value("w:vMerge", merge)] }, ...paragraphs],
            });
            const mergesOf = (...rows: readonly object[]): readonly (string | undefined)[] => {
                const table = readBody([tableOf([fixed], ...rows)]).blocks[0].block as TableBlock;
                return [...table.rows.map(({ cells }) => cells[0].verticalMerge), table.unsupported];
            };
            // The row a merge starts in deleted: the next starts it
            expect(
                mergesOf(
                    row([deletedRow], merged("restart", p(r(t("a"))))),
                    row([], merged("continue", p())),
                    row([], merged("continue", p())),
                ),
            ).to.deep.equal(["restart", "continue", undefined]);
            // A row it goes on through deleted: it goes on
            expect(
                mergesOf(
                    row([], merged("restart", p(r(t("a"))))),
                    row([deletedRow], merged("continue", p())),
                    row([], merged("continue", p())),
                ),
            ).to.deep.equal(["restart", "continue", undefined]);
            // A cell that would start it with text in it, which Word hasn't been seen laying out
            expect(mergesOf(row([deletedRow], merged("restart", p(r(t("a"))))), row([], merged("continue", p(r(t("b"))))))).to.deep.equal([
                "restart",
                "a cell merged down from a deleted table row",
            ]);
        });

        it("should mark a deleted row with a list or a note in it as unsupported, as Word may count them", () => {
            const noted = readBody([
                tableOf([fixed], row([deletedRow], cell(p(r({ "w:footnoteReference": { _attr: { "w:id": 1 } } })))), row([], cell(p()))),
            ]);
            expect(noted.blocks[0].block.unsupported).to.equal("a list or a note in a deleted table row");
            // A deleted reference in it too, which is numbered on from the notes before it, and not counted
            const deletedNote = readBody([
                tableOf(
                    [fixed],
                    row([deletedRow], cell(p({ "w:del": [r({ "w:footnoteReference": { _attr: { "w:id": 1 } } })] }))),
                    row([], cell(p())),
                ),
            ]);
            expect(deletedNote.blocks[0].block.unsupported).to.equal("a list or a note in a deleted table row");
            // Every row deleted, so the table is only why it stops
            const listed = readWritten({
                numbering: { config: [{ reference: "list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] }] },
                sections: [
                    {
                        children: [
                            new Paragraph({ numbering: { reference: "list", level: 0 }, text: "before" }),
                            new Table({
                                layout: "fixed",
                                rows: [
                                    new TableRow({
                                        deletion: REVISION,
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ numbering: { reference: "list", level: 0 }, text: "item" })],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });
            expect(textOf(listed)).to.equal("1.before");
            expect(listed.blocks[1].block).to.deep.equal({
                type: "table",
                rows: [],
                unsupported: "a list or a note in a deleted table row",
            });
        });

        it("should keep deleted rows and deleted text to size the columns of a table by, as Word sizes them", () => {
            // word-tracked-changes.docx MK11h to MK11j: a table whose cells have widths, which Word widens for long words
            const content = readBody(
                [
                    tableOf(
                        [],
                        row(
                            [],
                            cell(
                                p(
                                    r(t("a")),
                                    { "w:del": [r({ "w:delText": [" deleted"] }), r({ "w:delInstrText": ["PAGE"] })] },
                                    r({ "w:footnoteReference": { _attr: { "w:id": 1 } } }),
                                ),
                            ),
                        ),
                        row([], cell(p(r(t("plain"))))),
                        row([deletedRow], cell(p(r(t("deleted row"))))),
                    ),
                    p(r({ "w:footnoteReference": { _attr: { "w:id": 2 } } })),
                ],
                { footnotes: { 1: { children: [new Paragraph("One")] }, 2: { children: [new Paragraph("Two")] } } },
            );
            const table = content.blocks[0].block as TableBlock;
            expect(table.widen).to.deep.equal({});
            const [first, second] = table.rows.map(({ cells }) => cells[0]);
            expect(texts(first.blocks)).to.deep.equal(["a1"]);
            // The footnote is numbered as it is where it is laid out, and counted once
            expect(texts(first.sizing!)).to.deep.equal(["a deleted1"]);
            expect(second.sizing).to.equal(undefined);
            expect(table.deletedRows!.map(({ cells }) => texts(cells[0].blocks))).to.deep.equal([["deleted row"]]);
            expect(table.unsupported).to.equal(undefined);
            expect(textOf(content, 1)).to.equal("2");
        });

        it("should count each page reference with \\p once, as docx counts them: not again in a cell read to size its table, nor in deleted text, but in a deleted row", () => {
            const relative = (fieldOf: (type: string) => object, instructionOf: object): readonly object[] => [
                fieldOf("begin"),
                instructionOf,
                fieldOf("separate"),
                fieldOf("end"),
            ];
            const deletedField = (type: string): object => r({ "w:fldChar": { _attr: { "w:fldCharType": type } } });
            const content = readBody([
                tableOf(
                    [],
                    row(
                        [],
                        cell(
                            p(
                                ...relative(field, instruction("PAGEREF a \\p")),
                                { "w:del": relative(deletedField, r({ "w:delInstrText": ["PAGEREF a \\p"] })) },
                                { "w:del": [{ "w:fldSimple": [{ _attr: { "w:instr": "PAGEREF a \\p" } }] }] },
                            ),
                        ),
                    ),
                    row([], cell(p(r(t("plain"))))),
                    row([deletedRow], cell(p(...relative(field, instruction("PAGEREF a \\p"))))),
                ),
                p(...relative(field, instruction("PAGEREF a \\p"))),
            ]);
            // The cell is read to size the columns with its deleted text, and again to be laid out, with the same markers
            expect((content.blocks[0].block as TableBlock).rows[0].cells[0].sizing).not.to.equal(undefined);
            expect(Object.fromEntries(content.relativeReferences)).to.deep.equal({ a: ["field 1", "field 2", "field 3"] });
        });

        it("should mark what isn't known of how Word sizes a table's columns by tracked changes as unsupported", () => {
            const sized = (...paragraphs: readonly object[]): string | undefined =>
                readBody([tableOf([], row([], cell(...paragraphs)))]).blocks[0].block.unsupported;
            // A deleted picture, tab, break or note reference, whose room Word may count
            expect(sized(p(r(t("a")), { "w:del": [r({ "w:tab": {} })] }))).to.equal(
                "a deleted picture, tab, break or note reference in a table whose columns Word sizes to their text",
            );
            expect(sized(p({ "w:del": [r({ "mc:AlternateContent": [{ "mc:Choice": [{ "w:t": ["x"] }] }] })] }))).to.equal(
                "a deleted picture, tab, break or note reference in a table whose columns Word sizes to their text",
            );
            // Paragraphs of text joined by a deleted mark, which Word may size the columns by as they are written
            expect(sized(p(pPr(deletedMark), r(t("one"))), p(r(t("two"))))).to.equal(
                "a deleted paragraph mark between paragraphs of text in a table whose columns Word sizes to their text",
            );
            // An empty paragraph joined to the next is the next, either way
            expect(sized(p(pPr(deletedMark), r(rPr())), p(r(t("two"))))).to.equal(undefined);
        });

        it("should read the deleted rows of tables in tables, and of tables in headers, to size their columns by", () => {
            // A table in a deleted row, whose cell has deleted text: read as Word sizes the columns by it, twice over
            const inner = tableOf([], row([], cell(p(bookmark("nested"), r(t("a")), { "w:del": [r({ "w:delText": ["b"] })] }))));
            const content = readBody([tableOf([], row([deletedRow], cell(inner, p())), row([], cell(p(r(t("c"))))))]);
            const outer = content.blocks[0].block as TableBlock;
            const nested = outer.deletedRows![0].cells[0].blocks[0] as TableBlock;
            expect(texts(nested.rows[0].cells[0].blocks)).to.deep.equal(["ab"]);
            // The bookmark in the deleted row's table starts in the next row laid out
            expect((outer.rows[0].cells[0].blocks[0] as ParagraphBlock).items[0]).to.deep.equal({ type: "marker", name: "nested" });
            // A header has no notes to number
            const header = readWritten({
                sections: [
                    {
                        headers: {
                            default: new Header({
                                children: [
                                    new Table({
                                        rows: [
                                            new TableRow({
                                                deletion: REVISION,
                                                children: [new TableCell({ children: [new Paragraph("deleted")] })],
                                            }),
                                            new TableRow({ children: [new TableCell({ children: [new Paragraph("kept")] })] }),
                                        ],
                                    }),
                                ],
                            }),
                        },
                        children: [new Paragraph("Body")],
                    },
                ],
            });
            const headerTable = header.sections[0].headers.default![0] as TableBlock;
            expect(headerTable.rows).to.have.length(1);
            expect(headerTable.deletedRows).to.have.length(1);
        });

        it("should lay out a document that asks for a view of tracked changes as Word for Mac opened it, in its own view", () => {
            // word-tracked-changes.docx MK12 and MK13: with insertions and deletions, or markup, turned off, Word for Mac
            // opened the document in its own view, with deleted text in balloons and its lines without it
            const file = new File({ sections: [] });
            const settings = Object.create(file, {
                Settings: {
                    value: {
                        prepForXml: () => ({
                            "w:settings": [
                                { "w:revisionView": { _attr: { "w:insDel": "0", "w:markup": "0" } } },
                                { "w:compat": [{ "w:compatSetting": { _attr: { "w:name": "compatibilityMode", "w:val": 15 } } }] },
                            ],
                        }),
                    },
                },
            }) as File;
            const content = readDocument(
                { "w:body": [p(r(t("a")), { "w:del": [r({ "w:delText": ["b"] })] })] } as IXmlableObject,
                contextOf(settings),
            );
            expect(content.unsupported).to.equal(undefined);
            expect(textOf(content)).to.equal("a");
        });
    });

    describe("soft hyphens, hidden paragraph marks and decimal tab stops", () => {
        const bookmark = (name: string): object => ({ "w:bookmarkStart": { _attr: { "w:name": name, "w:id": 9 } } });
        const hiddenMark = rPr({ "w:vanish": {} });
        const cellOf = (...paragraphs: readonly object[]): object => ({
            "w:tc": [{ "w:tcPr": [{ "w:tcW": { _attr: { "w:w": 2000 } } }] }, ...paragraphs],
        });
        /** A table of these cells in a row, whose columns are fixed, so Word doesn't size them to their text */
        const fixedTableOf = (...cells: readonly object[]): object => ({
            "w:tbl": [
                { "w:tblPr": [{ "w:tblLayout": { _attr: { "w:type": "fixed" } } }] },
                { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] },
                { "w:tr": cells },
            ],
        });
        const tableOf = (...cells: readonly object[]): object => ({
            "w:tbl": [{ "w:tblPr": [] }, { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 2000 } } }] }, { "w:tr": cells }],
        });
        const texts = (content: DocumentContent): readonly string[] =>
            content.blocks.map(({ block }) =>
                block.type === "paragraph" ? block.items.map((item) => (item.type === "text" ? item.text : "")).join("") : "table",
            );

        it("should read a soft hyphen as where a word may break, in its run's font, and nothing in hidden text", () => {
            const content = readBody([
                p(
                    r(rPr(value("w:sz", 30)), t("Donau"), { "w:softHyphen": {} }, t("dampf")),
                    r(rPr({ "w:vanish": {} }), { "w:softHyphen": {} }),
                ),
            ]);
            expect(itemsOf(content).map((item) => (item.type === "text" ? item.text : item))).to.deep.equal([
                "Donau",
                { type: "softHyphen", font: { size: 15 } },
                "dampf",
            ]);
        });

        it("should mark a soft hyphen whose breaking Word hasn't been seen with as unsupported", () => {
            const bordered = rPr({ "w:bdr": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 4 } } });
            expect(paragraphOf(readBody([p(r(bordered, t("a"), { "w:softHyphen": {} }, t("b")))])).unsupported).to.equal(
                "a soft hyphen in text with a border",
            );
            // In a table whose columns Word sizes to their text, whose narrowest may be a word's widest part
            expect(readBody([tableOf(cellOf(p(r(t("a"), { "w:softHyphen": {} }, t("b")))))]).blocks[0].block.unsupported).to.equal(
                "a soft hyphen in a table whose columns Word sizes to their text",
            );
        });

        it("should join a paragraph whose mark is hidden to the next, as Word lays it out, where they are formatted the same", () => {
            // word-watertight-text.docx TX11a: the two paragraphs on one line. Its hidden text takes no room
            const content = readBody([
                p(pPr(value("w:jc", "center"), hiddenMark), r(t("first"))),
                p(pPr(value("w:jc", "center"), hiddenMark), r(rPr({ "w:vanish": {} }), t("hidden"))),
                p(pPr(value("w:jc", "center")), r(t("second"))),
                p(r(t("after"))),
            ]);
            expect(texts(content)).to.deep.equal(["firstsecond", "after"]);
            expect(paragraphOf(content).format.alignment).to.equal("center");
            // A mark hidden by its style, the same as the next's, and a mark that is shown though its style is hidden
            const styles = { paragraphStyles: [{ id: "Hidden", name: "Hidden", run: { vanish: true } }] };
            const byStyle = readBody(
                [
                    p(pPr(value("w:pStyle", "Hidden")), r(rPr(value("w:vanish", "false")), t("one"))),
                    p(pPr(value("w:pStyle", "Hidden"), rPr(value("w:vanish", "false"))), r(rPr(value("w:vanish", "false")), t("two"))),
                    p(r(t("three"))),
                ],
                { styles },
            );
            expect(texts(byStyle)).to.deep.equal(["onetwo", "three"]);
            // With specVanish too, as Word's style separator writes it
            const separator = readBody([p(pPr(rPr({ "w:vanish": {} }, { "w:specVanish": {} })), r(t("one"))), p(r(t("two")))]);
            expect(texts(separator)).to.deep.equal(["onetwo"]);
            // One naming the default style, and one naming none, are formatted the same
            const named = readBody([p(pPr(value("w:pStyle", "Normal"), hiddenMark), r(t("one"))), p(r(t("two")))]);
            expect([named.blocks[0].block.unsupported, ...texts(named)]).to.deep.equal([undefined, "onetwo"]);
        });

        it("should leave a paragraph whose mark is hidden as it is, with no paragraph after it to join, as Word lays it out", () => {
            // word-breaks-and-tabs.docx HM2a, HM2b: before a table, at the end of a table cell, alone or after another
            // paragraph, each on its own line. The end of the document is the end of a part too
            const content = readBody([
                p(pPr(hiddenMark), r(t("before"))),
                tableOf(cellOf(p(pPr(hiddenMark), r(t("alone")))), cellOf(p(r(t("first"))), p(pPr(hiddenMark), r(t("last"))))),
                p(pPr(hiddenMark), r(t("end"))),
            ]);
            expect(texts(content)).to.deep.equal(["before", "table", "end"]);
            const cells = (content.blocks[1].block as TableBlock).rows[0].cells.map(({ blocks }) => blocks.length);
            expect([content.unsupported, ...content.blocks.map(({ block }) => block.unsupported), cells]).to.deep.equal([
                undefined,
                undefined,
                undefined,
                undefined,
                [1, 2],
            ]);
        });

        it("should join paragraphs that differ in their alignment, left indent and space in the first one's formatting but for the next one's space after, as Word does", () => {
            // word-breaks-and-tabs.docx HM1a to HM1f: the first one's indent, alignment and space before, and the next one's
            // space after
            const spacing = (before: number, after: number): object => ({
                "w:spacing": { _attr: { "w:before": before, "w:after": after } },
            });
            const content = readBody([
                p(pPr(value("w:jc", "center"), spacing(480, 480), { "w:ind": { _attr: { "w:left": 1440 } } }, hiddenMark), r(t("first"))),
                p(pPr(value("w:jc", "right"), spacing(100, 200), rPr(value("w:sz", 40))), r(t("second"))),
            ]);
            expect(texts(content)).to.deep.equal(["firstsecond"]);
            expect(paragraphOf(content).format).to.deep.include({ alignment: "center", indentLeft: 72, spaceBefore: 24, spaceAfter: 10 });
            // with the next one's mark
            expect(paragraphOf(content).markFont).to.deep.include({ size: 20 });
            // and the first one's space after left out where the next has none of its own
            const noneAfter = readBody([p(pPr(spacing(480, 480), hiddenMark), r(t("first"))), p(r(t("second")))]);
            expect(paragraphOf(noneAfter).format).to.deep.include({ spaceBefore: 24 });
            expect(paragraphOf(noneAfter).format.spaceAfter ?? 0).to.equal(0);
        });

        it("should count the number of a paragraph of a list joined to the one before by its hidden mark, as Word does", () => {
            // word-breaks-and-tabs.docx HM4: three numbered paragraphs, the first's mark hidden, numbered 1 and 3
            const numbering = { config: [{ reference: "list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] }] };
            const item = (text: string, run = {}): Paragraph =>
                new Paragraph({ numbering: { reference: "list", level: 0 }, run, children: [new TextRun(text)] });
            const content = readWritten({
                numbering,
                sections: [{ children: [item("one", { vanish: true }), item("two"), item("three")] }],
            });
            expect(
                [0, 1].map((index) => itemsOf(content, index).map((part) => (part.type === "text" ? part.text : part.type))),
            ).to.deep.equal([
                ["1.", "tab", "one", "two"],
                ["3.", "tab", "three"],
            ]);
        });

        it("should lay out a paragraph with nothing shown and its mark hidden as nothing, in the next one's formatting, as Word does", () => {
            // word-breaks-and-tabs.docx HM3a, HM3b, HM3c, HM3e: its text, its mark and its space take no room. Its bookmarks
            // start with the next one
            const styles = {
                paragraphStyles: [{ id: "Hidden", name: "Hidden", run: { vanish: true } }],
                characterStyles: [{ id: "Secret", name: "Secret", run: { vanish: true } }],
            };
            const content = readBody(
                [
                    p(pPr(value("w:pStyle", "Hidden"), { "w:spacing": { _attr: { "w:before": 480 } } }), bookmark("a"), r(t("hidden")), {
                        "w:hyperlink": [r(rPr(value("w:rStyle", "Secret")), t("secret"))],
                    }),
                    p(pPr(value("w:jc", "center")), r(t("shown"))),
                    p(pPr(hiddenMark, value("w:jc", "right"))),
                    p(r(t("after"))),
                ],
                { styles },
            );
            expect(texts(content)).to.deep.equal(["shown", "after"]);
            expect(itemsOf(content)[0]).to.deep.equal({ type: "marker", name: "a" });
            expect(paragraphOf(content).format).to.deep.include({ alignment: "center" });
            expect(paragraphOf(content).format.spaceBefore ?? 0).to.equal(0);
            expect(paragraphOf(content, 1).format.alignment ?? "left").to.equal("left");
        });

        it("should leave a paragraph whose mark has specVanish but isn't hidden as it is, as Word does", () => {
            // word-breaks-and-tabs.docx HM5a
            const content = readBody([p(pPr(rPr({ "w:specVanish": {} })), r(t("one"))), p(r(t("two")))]);
            expect(texts(content)).to.deep.equal(["one", "two"]);
        });

        it("should mark a hidden paragraph mark Word hasn't been seen with as unsupported", () => {
            const unsupportedOf = (...elements: readonly object[]): string | undefined => {
                const content = readBody(elements, {
                    numbering: {
                        config: [{ reference: "list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] }],
                    },
                    styles: { paragraphStyles: [{ id: "Big", name: "Big", run: { size: 32 } }] },
                });
                return content.unsupported ?? content.blocks.find(({ block }) => block.unsupported)?.block.unsupported;
            };
            // Paragraphs of different styles, line spacing or right indents, which Word lays out line by line, or hasn't shown
            const different =
                "a hidden paragraph mark between paragraphs formatted differently but for their alignment, left indent and space";
            for (const properties of [
                [value("w:pStyle", "Big")],
                [{ "w:spacing": { _attr: { "w:line": 480 } } }],
                [{ "w:ind": { _attr: { "w:right": 1440 } } }],
            ]) {
                expect(unsupportedOf(p(pPr(...properties, hiddenMark), r(t("a"))), p(r(t("b"))))).to.equal(different);
            }
            expect(unsupportedOf(p(pPr(hiddenMark), r(t("a"))), { "w:sdt": [{ "w:sdtContent": [p(r(t("b")))] }] })).to.equal(
                "a hidden paragraph mark at the edge of a content control",
            );
            expect(unsupportedOf({ "w:sdt": [{ "w:sdtContent": [p(pPr(hiddenMark), r(t("a")))] }] }, p(r(t("b"))))).to.equal(
                "a hidden paragraph mark at the edge of a content control",
            );
            expect(unsupportedOf(p(pPr({ "w:sectPr": [] }, hiddenMark), r(t("a"))), p(r(t("b"))))).to.equal("a hidden section break");
            // Joined past a paragraph with nothing shown that is in a list, or has a field in it, which would be read out of
            // order, by a hidden or deleted mark
            const numbered = pPr(hiddenMark, { "w:numPr": [value("w:ilvl", 0), value("w:numId", 1)] });
            expect(unsupportedOf(p(pPr(hiddenMark), r(t("a"))), p(numbered), p(r(t("b"))))).to.equal(
                "a hidden paragraph mark before a paragraph with nothing shown and its mark hidden",
            );
            const hiddenRun = (child: object): object => r(rPr({ "w:vanish": {} }), child);
            const pageField = [
                hiddenRun({ "w:fldChar": { _attr: { "w:fldCharType": "begin" } } }),
                hiddenRun({ "w:instrText": ["PAGE"] }),
                hiddenRun({ "w:fldChar": { _attr: { "w:fldCharType": "end" } } }),
            ];
            const deletedMark = pPr(rPr({ "w:del": { _attr: { "w:id": 1, "w:author": "a", "w:date": "2026-01-01T00:00:00Z" } } }));
            expect(unsupportedOf(p(deletedMark, r(t("a"))), p(pPr(hiddenMark), ...pageField), p(r(t("b"))))).to.equal(
                "a deleted paragraph mark before a paragraph with nothing shown and its mark hidden",
            );
            // In a table whose columns Word sizes to their text, between paragraphs of text
            expect(unsupportedOf(tableOf(cellOf(p(pPr(hiddenMark), r(t("a"))), p(r(t("b"))))))).to.equal(
                "a hidden paragraph mark between paragraphs of text in a table whose columns Word sizes to their text",
            );
            expect(unsupportedOf(tableOf(cellOf(p(pPr(hiddenMark)), p(r(t("b"))))))).to.equal(undefined);
        });

        it("should give a paragraph whose text and mark are all hidden no room, whatever its formatting, as Word lays it out", () => {
            // word-breaks-and-tabs.docx HM3: text and mark hidden (HM3a), an empty paragraph whose mark is hidden (HM3b), a
            // paragraph of a hidden style (HM3c, word-seq.docx Q8), and an empty one with space before and after (HM3e)
            // take no room, but one whose text is hidden and mark isn't takes a line (HM3d)
            const hiddenText = rPr({ "w:vanish": {} });
            const content = readBody(
                [
                    p(r(t("above"))),
                    p(pPr(hiddenMark), r(hiddenText, t("text and mark"))),
                    // word-seq.docx Q8: with a SEQ field in it, which is counted where it is
                    p(
                        pPr(value("w:pStyle", "Hidden")),
                        r(t("hidden style ")),
                        field("begin"),
                        instruction("SEQ Figure"),
                        field("separate"),
                        field("end"),
                    ),
                    p(pPr({ "w:spacing": { _attr: { "w:before": 480, "w:after": 480 } } }, hiddenMark)),
                    p(pPr(hiddenMark), r(rPr(value("w:rStyle", "HiddenRun")), t("hidden character style"))),
                    p(pPr(hiddenMark)),
                    p(r(hiddenText, t("text only"))),
                    p(pPr(value("w:jc", "center")), r(t("below"))),
                ],
                {
                    styles: {
                        // Hidden by the style the paragraph's is based on
                        paragraphStyles: [
                            { id: "HiddenBase", name: "Hidden Base", run: { vanish: true } },
                            { id: "Hidden", name: "Hidden", basedOn: "HiddenBase", paragraph: { indent: { left: 720 } } },
                        ],
                        characterStyles: [{ id: "HiddenRun", name: "Hidden Run", run: { vanish: true } }],
                    },
                },
            );
            expect(texts(content)).to.deep.equal(["above", "", "below"]);
            expect([content.unsupported, ...content.blocks.map(({ block }) => block.unsupported)]).to.deep.equal([
                undefined,
                undefined,
                undefined,
                undefined,
            ]);
            // The paragraph after it in its own formatting
            expect(paragraphOf(content, 2).format.alignment).to.equal("center");
        });

        it("should start the bookmarks in a paragraph whose text and mark are all hidden with the block after it", () => {
            const hiddenParagraph = (name: string): object =>
                p(pPr(hiddenMark, value("w:jc", "right")), bookmark(name), r(hiddenMark, t("x")));
            const content = readBody([
                p(r(t("above"))),
                hiddenParagraph("body"),
                p(r(t("next"))),
                // In a table cell
                fixedTableOf(cellOf(p(r(t("a"))), hiddenParagraph("cell"), p(r(t("b"))))),
            ]);
            expect(texts(content)).to.deep.equal(["above", "next", "table"]);
            expect(itemsOf(content, 1)[0]).to.deep.equal({ type: "marker", name: "body" });
            const [cell] = (content.blocks[2].block as TableBlock).rows[0].cells;
            expect(cell.blocks.map((block) => (block.type === "paragraph" ? block.items[0] : undefined))).to.deep.equal([
                { type: "text", text: "a", font: {} },
                { type: "marker", name: "cell" },
            ]);
            // The paragraphs next to it know it is there, for their contextual spacing
            const [first, second] = cell.blocks as readonly ParagraphBlock[];
            expect([first.hiddenAfter?.style, second.hiddenBefore?.style]).to.deep.equal(["Normal", "Normal"]);
            expect(content.blocks.map(({ block }) => block.unsupported)).to.deep.equal([undefined, undefined, undefined]);
        });

        it("should give a paragraph whose text and mark are all hidden no room before a table and at the end of the document, and a line at the end of a table cell", () => {
            const hiddenParagraph = (...children: readonly object[]): object => p(pPr(hiddenMark), r(hiddenMark, ...children));
            const content = readBody([
                // word-hidden-paragraphs.docx HP2a: before a table
                hiddenParagraph(t("before")),
                // First in a cell, one after the other (HP2d)
                fixedTableOf(cellOf(hiddenParagraph(t("one")), hiddenParagraph(t("two")), p(r(t("first"))), hiddenParagraph(t("last")))),
                // HP4a, HP4b, HP4c: a page break and a picture in hidden text take no room
                // Formatted otherwise than the next, so it isn't joined to it, after a table
                p(
                    pPr(value("w:jc", "center"), hiddenMark),
                    r(hiddenMark, { "w:br": { _attr: { "w:type": "page" } } }, { "w:drawing": [] }),
                ),
                p(r(t("a")), r(hiddenMark, { "w:br": { _attr: { "w:type": "column" } } }), r(t("b"))),
                {
                    "w:p": [pPr(hiddenMark), r(hiddenMark, { "mc:AlternateContent": [{ "mc:Choice": [{ "w:drawing": [] }] }] })],
                },
                // HP8: at the end of the document
                p(pPr(hiddenMark)),
            ]);
            expect(texts(content)).to.deep.equal(["table", "ab"]);
            // HP2b, HP2c: at the end of a table cell, it is a line of its own
            const [cell] = (content.blocks[0].block as TableBlock).rows[0].cells;
            expect(cell.blocks.map((block) => block.type === "paragraph" && block.hidden === true)).to.deep.equal([false, false]);
            expect([content.unsupported, ...content.blocks.map(({ block }) => block.unsupported)]).to.deep.equal([
                undefined,
                undefined,
                undefined,
            ]);
        });

        it("should give a paragraph whose text and mark are all hidden in a list no room, but a number", () => {
            // word-hidden-paragraphs.docx HP5: 1. and 3.
            const item = (text: string, vanish = false): Paragraph =>
                new Paragraph({ numbering: { reference: "list", level: 0 }, run: { vanish }, children: [new TextRun({ text, vanish })] });
            const content = readWritten({
                numbering: { config: [{ reference: "list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] }] },
                sections: [{ children: [item("one"), item("two", true), item("three")] }],
            });
            expect(texts(content)).to.deep.equal(["1.one", "3.three"]);
        });

        it("should mark a paragraph whose text and mark are all hidden as unsupported where Word hasn't been seen with it", () => {
            const unsupportedOf = (...elements: readonly object[]): string | undefined => {
                const content = readBody(elements);
                return content.unsupported ?? content.blocks.find(({ block }) => block.unsupported)?.block.unsupported;
            };
            const hiddenParagraph = (...children: readonly object[]): object => p(pPr(hiddenMark), r(hiddenMark, ...children));
            // Holding a note reference, whose note Word doesn't lay out (HP4d, HP4e), and the notes after it may not be
            // numbered as Word numbers them
            expect(unsupportedOf(hiddenParagraph({ "w:footnoteReference": { _attr: { "w:id": 1 } } }), p(r(t("b"))))).to.equal(
                "a footnote or endnote reference in hidden text",
            );
            // After a paragraph kept with the next
            const centred = p(pPr(value("w:jc", "center"), hiddenMark), r(hiddenMark, t("b")));
            expect(unsupportedOf(p(pPr({ "w:keepNext": {} }), r(t("a"))), centred, p(r(t("c"))))).to.equal(
                "a paragraph kept with the next before a hidden paragraph",
            );
            expect(unsupportedOf(p(pPr({ "w:keepNext": {} }, { "w:framePr": {} }), r(t("a"))), centred, p(r(t("c"))))).to.equal(
                "a text frame",
            );
            // Between paragraphs of the same borders, without them
            const bordered = { "w:pBdr": [{ "w:top": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 1 } } }] };
            expect(unsupportedOf(p(pPr(bordered), r(t("a"))), hiddenParagraph(t("b")), p(pPr(bordered), r(t("c"))))).to.equal(
                "a box of borders around a hidden paragraph without them",
            );
            expect(
                unsupportedOf(
                    p(pPr(bordered), r(t("a"))),
                    p(pPr(bordered, hiddenMark), r(hiddenMark, t("b"))),
                    p(pPr(bordered), r(t("c"))),
                ),
            ).to.equal(undefined);
            expect(unsupportedOf(p(r(t("a"))), hiddenParagraph(t("b")), p(pPr(bordered), r(t("c"))))).to.equal(undefined);
            // Before something that isn't a paragraph or table
            expect(unsupportedOf(hiddenParagraph(t("a")), { "w:altChunk": {} })).to.equal(
                "a paragraph with nothing shown and its mark hidden before something that isn't a paragraph or table",
            );
        });

        it("should mark a paragraph whose text and mark are all hidden at the end of a header as unsupported", () => {
            const hidden = new Paragraph({ run: { vanish: true }, children: [new TextRun({ text: "b", vanish: true })] });
            const content = readWritten({
                sections: [{ headers: { default: new Header({ children: [new Paragraph("a"), hidden] }) }, children: [] }],
            });
            expect(content.sections[0].headers.default?.map(({ unsupported }) => unsupported)).to.deep.equal([
                undefined,
                "a paragraph with nothing shown and its mark hidden at the end of a header, footer or note",
            ]);
        });

        it("should mark a decimal tab stop in a document whose decimal symbol isn't a full stop as unsupported", () => {
            const decimal = p(pPr({ "w:tabs": [{ "w:tab": { _attr: { "w:val": "decimal", "w:pos": 4000 } } }] }), r(t("a")));
            const plain = p(r(t("a")));
            const comma = value("w:decimalSymbol", ",");
            expect(paragraphOf(readWithSettings([decimal], [comma])).unsupported).to.equal(
                "a decimal tab stop in a document whose decimal symbol isn't a full stop",
            );
            expect(paragraphOf(readWithSettings([plain], [comma])).unsupported).to.equal(undefined);
            expect(paragraphOf(readWithSettings([decimal], [value("w:decimalSymbol", ".")])).unsupported).to.equal(undefined);
        });
    });
});
