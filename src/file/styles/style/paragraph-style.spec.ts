import { expect } from "chai";

import { Formatter } from "export/formatter";

import { ParagraphStyle } from "./paragraph-style";

import { EMPTY_OBJECT } from "file/xml-components";

describe("ParagraphStyle", () => {
    describe("#constructor", () => {
        it("should set the style type to paragraph and use the given style id", () => {
            const style = new ParagraphStyle("myStyleId");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
            });
        });

        it("should set the name of the style, if given", () => {
            const style = new ParagraphStyle("myStyleId", "Style Name");
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
            const style = new ParagraphStyle("myStyleId").basedOn("otherId");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:basedOn": { _attr: { "w:val": "otherId" } } },
                ],
            });
        });

        it("#quickFormat", () => {
            const style = new ParagraphStyle("myStyleId").quickFormat();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:qFormat": EMPTY_OBJECT }],
            });
        });

        it("#next", () => {
            const style = new ParagraphStyle("myStyleId").next("otherId");
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
            const style = new ParagraphStyle("myStyleId").indent({ left: 720 });
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
            const style = new ParagraphStyle("myStyleId").spacing({ before: 50, after: 150 });
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
            const style = new ParagraphStyle("myStyleId").center();
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
            const style = new ParagraphStyle("myStyleId").characterSpacing(24);
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
            const style = new ParagraphStyle("myStyleId").left();
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
            const style = new ParagraphStyle("myStyleId").right();
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
            const style = new ParagraphStyle("myStyleId").justified();
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
            const style = new ParagraphStyle("myStyleId").thematicBreak();
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
                                                "w:space": "1",
                                                "w:val": "single",
                                                "w:sz": "6",
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

        it("#leftTabStop", () => {
            const style = new ParagraphStyle("myStyleId").leftTabStop(1200);
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
            const style = new ParagraphStyle("myStyleId").maxRightTabStop();
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
            const style = new ParagraphStyle("myStyleId").keepLines();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:pPr": [{ "w:keepLines": EMPTY_OBJECT }] }],
            });
        });

        it("#keepNext", () => {
            const style = new ParagraphStyle("myStyleId").keepNext();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }],
            });
        });

        it("#outlineLevel", () => {
            const style = new ParagraphStyle("myStyleId").outlineLevel("1");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    { "w:pPr": [{ "w:outlineLvl": { _attr: { "w:val": "1" } } }] },
                ],
            });
        });
    });

    describe("formatting methods: run properties", () => {
        it("#size", () => {
            const style = new ParagraphStyle("myStyleId").size(24);
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
            const style = new ParagraphStyle("myStyleId").smallCaps();
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
            const style = new ParagraphStyle("myStyleId").allCaps();
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
            const style = new ParagraphStyle("myStyleId").strike();
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
            const style = new ParagraphStyle("myStyleId").doubleStrike();
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
            const style = new ParagraphStyle("myStyleId").subScript();
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
            const style = new ParagraphStyle("myStyleId").superScript();
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
            const style = new ParagraphStyle("myStyleId").font("Times");
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
            const style = new ParagraphStyle("myStyleId").bold();
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
            const style = new ParagraphStyle("myStyleId").italics();
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

        describe("#underline", () => {
            it("should set underline to 'single' if no arguments are given", () => {
                const style = new ParagraphStyle("myStyleId").underline();
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
                const style = new ParagraphStyle("myStyleId").underline("double");
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
                const style = new ParagraphStyle("myStyleId").underline("double", "005599");
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
            const style = new ParagraphStyle("myStyleId").color("123456");
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
            const style = new ParagraphStyle("myStyleId").link("MyLink");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:link": { _attr: { "w:val": "MyLink" } } }],
            });
        });

        it("#semiHidden", () => {
            const style = new ParagraphStyle("myStyleId").semiHidden();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:semiHidden": EMPTY_OBJECT }],
            });
        });

        it("#uiPriority", () => {
            const style = new ParagraphStyle("myStyleId").uiPriority("99");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                ],
            });
        });

        it("#unhideWhenUsed", () => {
            const style = new ParagraphStyle("myStyleId").unhideWhenUsed();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [{ _attr: { "w:type": "paragraph", "w:styleId": "myStyleId" } }, { "w:unhideWhenUsed": EMPTY_OBJECT }],
            });
        });
    });
});
