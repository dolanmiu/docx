import { expect } from "chai";

import { Formatter } from "export/formatter";
import { AlignmentType, TabStopPosition } from "file/paragraph";
import { UnderlineType } from "file/paragraph/run/underline";
import { ShadingType } from "file/table";
import { EMPTY_OBJECT } from "file/xml-components";

import { ParagraphStyle } from "./paragraph-style";

describe("ParagraphStyle", () => {
    describe("#constructor", () => {
        it("should set the style type to paragraph and use the given style id", () => {
            const style = new ParagraphStyle({ id: "myStyleId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
            });
        });

        it("should set the name of the style, if given", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                name: "Style Name",
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:name": { _attr: { "w:val": "Style Name" } } },
                ],
            });
        });
    });

    describe("formatting methods: style attributes", () => {
        it("#basedOn", () => {
            const style = new ParagraphStyle({ id: "myStyleId", basedOn: "otherId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:basedOn": { _attr: { "w:val": "otherId" } } },
                ],
            });
        });

        it("#quickFormat", () => {
            const style = new ParagraphStyle({ id: "myStyleId", quickFormat: true });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:qFormat": EMPTY_OBJECT }],
            });
        });

        it("#next", () => {
            const style = new ParagraphStyle({ id: "myStyleId", next: "otherId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:next": { _attr: { "w:val": "otherId" } } },
                ],
            });
        });
    });

    describe("formatting methods: paragraph properties", () => {
        it("#indent", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    indent: { left: 720 },
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:ind": { _attr: { "w:left": 720 } } }],
                    },
                ],
            });
        });

        it("#spacing", () => {
            const style = new ParagraphStyle({ id: "myStyleId", paragraph: { spacing: { before: 50, after: 150 } } });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:spacing": { _attr: { "w:before": 50, "w:after": 150 } } }],
                    },
                ],
            });
        });

        it("#center", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    alignment: AlignmentType.CENTER,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }],
                    },
                ],
            });
        });

        it("#character spacing", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    characterSpacing: 24,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:spacing": { _attr: { "w:val": 24 } } }],
                    },
                ],
            });
        });

        it("#left", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    alignment: AlignmentType.LEFT,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "left" } } }],
                    },
                ],
            });
        });

        it("#right", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    alignment: AlignmentType.RIGHT,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "right" } } }],
                    },
                ],
            });
        });

        it("#justified", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    alignment: AlignmentType.JUSTIFIED,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [{ "w:jc": { _attr: { "w:val": "both" } } }],
                    },
                ],
            });
        });

        it("#thematicBreak", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    thematicBreak: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [
                            {
                                "w:pBdr": [
                                    {
                                        "w:bottom": {
                                            _attr: {
                                                "w:color": "auto",
                                                "w:space": 1,
                                                "w:val": "single",
                                                "w:sz": 6,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("#contextualSpacing", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    contextualSpacing: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [
                            {
                                "w:contextualSpacing": {
                                    _attr: {
                                        "w:val": 1,
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("#leftTabStop", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    leftTabStop: 1200,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [{ "w:tab": { _attr: { "w:val": "left", "w:pos": 1200 } } }],
                            },
                        ],
                    },
                ],
            });
        });

        it("#maxRightTabStop", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    rightTabStop: TabStopPosition.MAX,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:pPr": [
                            {
                                "w:tabs": [{ "w:tab": { _attr: { "w:val": "right", "w:pos": 9026 } } }],
                            },
                        ],
                    },
                ],
            });
        });

        it("#keepLines", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    keepLines: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:pPr": [{ "w:keepLines": EMPTY_OBJECT }] }],
            });
        });

        it("#keepNext", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    keepNext: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }],
            });
        });

        it("#outlineLevel", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                paragraph: {
                    outlineLevel: 1,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:pPr": [{ "w:outlineLvl": { _attr: { "w:val": 1 } } }] },
                ],
            });
        });
    });

    describe("formatting methods: run properties", () => {
        it("#size", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    size: 24,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 24 } } }],
                    },
                ],
            });
        });

        it("#smallCaps", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    smallCaps: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:smallCaps": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#allCaps", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    allCaps: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:caps": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#strike", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    strike: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:strike": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#doubleStrike", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    doubleStrike: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:dstrike": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#subScript", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    subScript: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "subscript" } } }],
                    },
                ],
            });
        });

        it("#superScript", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    superScript: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "superscript" } } }],
                    },
                ],
            });
        });

        it("#font", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    font: "Times",
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [
                            { "w:rFonts": { _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } } },
                        ],
                    },
                ],
            });
        });

        it("#bold", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    bold: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:b": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#italics", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    italics: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:i": { _attr: { "w:val": true } } }],
                    },
                ],
            });
        });

        it("#highlight", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    highlight: "005599",
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:highlight": { _attr: { "w:val": "005599" } } }],
                    },
                ],
            });
        });

        it("#shadow", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    shadow: {
                        type: ShadingType.PERCENT_10,
                        fill: "00FFFF",
                        color: "FF0000",
                    },
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                    },
                ],
            });
        });

        describe("#underline", () => {
            it("should set underline to 'single' if no arguments are given", () => {
                const style = new ParagraphStyle({
                    id: "myStyleId",
                    run: {
                        underline: {},
                    },
                });
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }],
                        },
                    ],
                });
            });

            it("should set the style if given", () => {
                const style = new ParagraphStyle({
                    id: "myStyleId",
                    run: {
                        underline: {
                            type: UnderlineType.DOUBLE,
                        },
                    },
                });
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                        },
                    ],
                });
            });

            it("should set the style and color if given", () => {
                const style = new ParagraphStyle({
                    id: "myStyleId",
                    run: {
                        underline: {
                            type: UnderlineType.DOUBLE,
                            color: "005599",
                        },
                    },
                });
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                        },
                    ],
                });
            });
        });

        it("#color", () => {
            const style = new ParagraphStyle({
                id: "myStyleId",
                run: {
                    color: "123456",
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:color": { _attr: { "w:val": "123456" } } }],
                    },
                ],
            });
        });

        it("#link", () => {
            const style = new ParagraphStyle({ id: "myStyleId", link: "MyLink" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:link": { _attr: { "w:val": "MyLink" } } }],
            });
        });

        it("#semiHidden", () => {
            const style = new ParagraphStyle({ id: "myStyleId", semiHidden: true });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:semiHidden": EMPTY_OBJECT }],
            });
        });

        it("#uiPriority", () => {
            const style = new ParagraphStyle({ id: "myStyleId", uiPriority: 99 });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                ],
            });
        });

        it("#unhideWhenUsed", () => {
            const style = new ParagraphStyle({ id: "myStyleId", unhideWhenUsed: true });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:unhideWhenUsed": EMPTY_OBJECT }],
            });
        });
    });
});
