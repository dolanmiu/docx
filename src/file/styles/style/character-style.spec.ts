import { expect } from "chai";

import { Formatter } from "export/formatter";

import { CharacterStyle } from "./character-style";

import { EMPTY_OBJECT } from "file/xml-components";

describe("CharacterStyle", () => {
    describe("#constructor", () => {
        it("should set the style type to character and use the given style id", () => {
            const style = new CharacterStyle("myStyleId");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should set the name of the style, if given", () => {
            const style = new CharacterStyle("myStyleId", "Style Name");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    { "w:name": { _attr: { "w:val": "Style Name" } } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });
    });

    describe("formatting methods: style attributes", () => {
        it("#basedOn", () => {
            const style = new CharacterStyle("myStyleId").basedOn("otherId");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    { "w:basedOn": { _attr: { "w:val": "otherId" } } },
                ],
            });
        });
    });

    describe("formatting methods: run properties", () => {
        it("#size", () => {
            const style = new CharacterStyle("myStyleId").size(24);
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 24 } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        describe("#underline", () => {
            it("should set underline to 'single' if no arguments are given", () => {
                const style = new CharacterStyle("myStyleId").underline();
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }],
                        },
                        {
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": "99",
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                    ],
                });
            });

            it("should set the style if given", () => {
                const style = new CharacterStyle("myStyleId").underline("double");
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                        },
                        {
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": "99",
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                    ],
                });
            });

            it("should set the style and color if given", () => {
                const style = new CharacterStyle("myStyleId").underline("double", "005599");
                const tree = new Formatter().format(style);
                expect(tree).to.deep.equal({
                    "w:style": [
                        { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                        },
                        {
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": "99",
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                    ],
                });
            });
        });

        it("#superScript", () => {
            const style = new CharacterStyle("myStyleId").superScript();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [
                            {
                                "w:vertAlign": {
                                    _attr: {
                                        "w:val": "superscript",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("#color", () => {
            const style = new CharacterStyle("myStyleId").color("123456");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:color": { _attr: { "w:val": "123456" } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("#bold", () => {
            const style = new CharacterStyle("myStyleId").bold();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:b": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("#italics", () => {
            const style = new CharacterStyle("myStyleId").italics();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:i": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("#link", () => {
            const style = new CharacterStyle("myStyleId").link("MyLink");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    { "w:link": { _attr: { "w:val": "MyLink" } } },
                ],
            });
        });

        it("#semiHidden", () => {
            const style = new CharacterStyle("myStyleId").semiHidden();
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    { "w:unhideWhenUsed": EMPTY_OBJECT },
                    { "w:semiHidden": EMPTY_OBJECT },
                ],
            });
        });

        it("#highlight", () => {
            const style = new CharacterStyle("myStyleId").highlight("005599");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:highlight": { _attr: { "w:val": "005599" } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("#shadow", () => {
            const style = new CharacterStyle("myStyleId").shadow("pct10", "00FFFF", "FF0000");
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": "99",
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });
    });
});
