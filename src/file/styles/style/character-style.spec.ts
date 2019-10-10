import { expect } from "chai";

import { Formatter } from "export/formatter";
import { UnderlineType } from "file/paragraph/run/underline";
import { ShadingType } from "file/table";
import { EMPTY_OBJECT } from "file/xml-components";

import { CharacterStyle } from "./character-style";

describe("CharacterStyle", () => {
    describe("#constructor", () => {
        it("should set the style type to character and use the given style id", () => {
            const style = new CharacterStyle({ id: "myStyleId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                name: "Style Name",
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    { "w:name": { _attr: { "w:val": "Style Name" } } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add smallCaps", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    smallCaps: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:smallCaps": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add allCaps", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    allCaps: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:caps": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add strike", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    strike: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:strike": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add double strike", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    doubleStrike: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:dstrike": { _attr: { "w:val": true } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add sub script", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    subScript: true,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [
                            {
                                "w:vertAlign": {
                                    _attr: {
                                        "w:val": "subscript",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add font", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    font: "test font",
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [
                            {
                                "w:rFonts": {
                                    _attr: {
                                        "w:ascii": "test font",
                                        "w:cs": "test font",
                                        "w:eastAsia": "test font",
                                        "w:hAnsi": "test font",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                ],
            });
        });

        it("should add character spacing", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    characterSpacing: 100,
                },
            });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:spacing": { _attr: { "w:val": 100 } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
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
            const style = new CharacterStyle({ id: "myStyleId", basedOn: "otherId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    size: 24,
                },
            });
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
                                "w:val": 99,
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
                const style = new CharacterStyle({
                    id: "myStyleId",
                    run: {
                        underline: {},
                    },
                });
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
                                    "w:val": 99,
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
                const style = new CharacterStyle({
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
                        { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                        },
                        {
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": 99,
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
                const style = new CharacterStyle({
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
                        { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                        },
                        {
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    superScript: true,
                },
            });
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
                                "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    color: "123456",
                },
            });
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
                                "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    bold: true,
                },
            });
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
                                "w:val": 99,
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
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    italics: true,
                },
            });
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
                                "w:val": 99,
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
            const style = new CharacterStyle({ id: "myStyleId", link: "MyLink" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
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
            const style = new CharacterStyle({ id: "myStyleId", semiHidden: true });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    { "w:unhideWhenUsed": EMPTY_OBJECT },
                    { "w:semiHidden": EMPTY_OBJECT },
                ],
            });
        });

        it("#highlight", () => {
            const style = new CharacterStyle({
                id: "myStyleId",
                run: {
                    highlight: "005599",
                },
            });
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
                                "w:val": 99,
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
            const style = new CharacterStyle({
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
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    {
                        "w:rPr": [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                    },
                    {
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
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
