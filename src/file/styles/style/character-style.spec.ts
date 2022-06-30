import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { EmphasisMarkType } from "@file/paragraph/run/emphasis-mark";
import { UnderlineType } from "@file/paragraph/run/underline";
import { ShadingType } from "@file/shading";
import { EMPTY_OBJECT } from "@file/xml-components";

import { StyleForCharacter } from "./character-style";

describe("CharacterStyle", () => {
    describe("#constructor", () => {
        it("should set the style type to character and use the given style id", () => {
            const style = new StyleForCharacter({ id: "myStyleId" });
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
            const style = new StyleForCharacter({
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
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:smallCaps": {} }],
                    },
                ],
            });
        });

        it("should add allCaps", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:caps": {} }],
                    },
                ],
            });
        });

        it("should add strike", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:strike": {} }],
                    },
                ],
            });
        });

        it("should add double strike", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:dstrike": {} }],
                    },
                ],
            });
        });

        it("should add sub script", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
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
                ],
            });
        });

        it("should add font by name", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
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
                ],
            });
        });

        it("should add font for ascii and eastAsia", () => {
            const style = new StyleForCharacter({
                id: "myStyleId",
                run: {
                    font: {
                        ascii: "test font ascii",
                        eastAsia: "test font eastAsia",
                    },
                },
            });
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
                    {
                        "w:rPr": [
                            {
                                "w:rFonts": {
                                    _attr: {
                                        "w:ascii": "test font ascii",
                                        "w:eastAsia": "test font eastAsia",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add character spacing", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:spacing": { _attr: { "w:val": 100 } } }],
                    },
                ],
            });
        });
    });

    describe("formatting methods: style attributes", () => {
        it("#basedOn", () => {
            const style = new StyleForCharacter({ id: "myStyleId", basedOn: "otherId" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    { "w:basedOn": { _attr: { "w:val": "otherId" } } },
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

    describe("formatting methods: run properties", () => {
        const sizeTests = [
            {
                size: 24,
                expected: [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 24 } } }],
            },
            {
                size: 24,
                sizeComplexScript: true,
                expected: [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 24 } } }],
            },
            {
                size: 24,
                sizeComplexScript: false,
                expected: [{ "w:sz": { _attr: { "w:val": 24 } } }],
            },
            {
                size: 24,
                sizeComplexScript: 26,
                expected: [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 26 } } }],
            },
        ];
        sizeTests.forEach(({ size, sizeComplexScript, expected }) => {
            it(`#size ${size} cs ${sizeComplexScript}`, () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: { size, sizeComplexScript },
                });
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
                        {
                            "w:rPr": expected,
                        },
                    ],
                });
            });
        });

        describe("#underline", () => {
            it("should set underline to 'single' if no arguments are given", () => {
                const style = new StyleForCharacter({
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
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": 99,
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }],
                        },
                    ],
                });
            });

            it("should set the style if given", () => {
                const style = new StyleForCharacter({
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
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": 99,
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                        },
                    ],
                });
            });

            it("should set the style and color if given", () => {
                const style = new StyleForCharacter({
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
                            "w:uiPriority": {
                                _attr: {
                                    "w:val": 99,
                                },
                            },
                        },
                        {
                            "w:unhideWhenUsed": EMPTY_OBJECT,
                        },
                        {
                            "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                        },
                    ],
                });
            });
        });

        describe("#emphasisMark", () => {
            it("should set emphasisMark to 'dot' if no arguments are given", () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: {
                        emphasisMark: {},
                    },
                });
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
                        {
                            "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }],
                        },
                    ],
                });
            });

            it("should set the style if given", () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: {
                        emphasisMark: {
                            type: EmphasisMarkType.DOT,
                        },
                    },
                });
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
                        {
                            "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }],
                        },
                    ],
                });
            });
        });

        it("#superScript", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
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
                ],
            });
        });

        it("#color", () => {
            const style = new StyleForCharacter({
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
                        "w:uiPriority": {
                            _attr: {
                                "w:val": 99,
                            },
                        },
                    },
                    {
                        "w:unhideWhenUsed": EMPTY_OBJECT,
                    },
                    {
                        "w:rPr": [{ "w:color": { _attr: { "w:val": "123456" } } }],
                    },
                ],
            });
        });

        const boldTests = [
            {
                bold: true,
                expected: [{ "w:b": {} }, { "w:bCs": {} }],
            },
            {
                bold: true,
                boldComplexScript: true,
                expected: [{ "w:b": {} }, { "w:bCs": {} }],
            },
            {
                bold: true,
                boldComplexScript: false,
                expected: [{ "w:b": {} }],
            },
        ];
        boldTests.forEach(({ bold, boldComplexScript, expected }) => {
            it(`#bold ${bold} cs ${boldComplexScript}`, () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: { bold, boldComplexScript },
                });
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
                        {
                            "w:rPr": expected,
                        },
                    ],
                });
            });
        });

        const italicsTests = [
            {
                italics: true,
                expected: [{ "w:i": {} }, { "w:iCs": {} }],
            },
            {
                italics: true,
                italicsComplexScript: true,
                expected: [{ "w:i": {} }, { "w:iCs": {} }],
            },
            {
                italics: true,
                italicsComplexScript: false,
                expected: [{ "w:i": {} }],
            },
        ];
        italicsTests.forEach(({ italics, italicsComplexScript, expected }) => {
            it(`#italics ${italics} cs ${italicsComplexScript}`, () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: { italics, italicsComplexScript },
                });
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
                        {
                            "w:rPr": expected,
                        },
                    ],
                });
            });
        });

        it("#link", () => {
            const style = new StyleForCharacter({ id: "myStyleId", link: "MyLink" });
            const tree = new Formatter().format(style);
            expect(tree).to.deep.equal({
                "w:style": [
                    { _attr: { "w:type": "character", "w:styleId": "myStyleId" } },
                    { "w:link": { _attr: { "w:val": "MyLink" } } },
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

        it("#semiHidden", () => {
            const style = new StyleForCharacter({ id: "myStyleId", semiHidden: true });
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
                    { "w:semiHidden": EMPTY_OBJECT },
                    { "w:unhideWhenUsed": EMPTY_OBJECT },
                ],
            });
        });

        const highlightTests = [
            {
                highlight: "005599",
                expected: [{ "w:highlight": { _attr: { "w:val": "005599" } } }, { "w:highlightCs": { _attr: { "w:val": "005599" } } }],
            },
            {
                highlight: "005599",
                highlightComplexScript: true,
                expected: [{ "w:highlight": { _attr: { "w:val": "005599" } } }, { "w:highlightCs": { _attr: { "w:val": "005599" } } }],
            },
            {
                highlight: "005599",
                highlightComplexScript: false,
                expected: [{ "w:highlight": { _attr: { "w:val": "005599" } } }],
            },
            {
                highlight: "005599",
                highlightComplexScript: "550099",
                expected: [{ "w:highlight": { _attr: { "w:val": "005599" } } }, { "w:highlightCs": { _attr: { "w:val": "550099" } } }],
            },
        ];
        highlightTests.forEach(({ highlight, highlightComplexScript, expected }) => {
            it(`#highlight ${highlight} cs ${highlightComplexScript}`, () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: { highlight, highlightComplexScript },
                });
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
                        {
                            "w:rPr": expected,
                        },
                    ],
                });
            });
        });

        const shadingTests = [
            {
                shading: {
                    type: ShadingType.PERCENT_10,
                    fill: "00FFFF",
                    color: "FF0000",
                },
                expected: [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
            },
            {
                shading: {
                    type: ShadingType.SOLID,
                    fill: "AA0000",
                    color: "DD0000",
                },
                expected: [{ "w:shd": { _attr: { "w:val": "solid", "w:fill": "AA0000", "w:color": "DD0000" } } }],
            },
        ];
        shadingTests.forEach(({ shading, expected }) => {
            it("#shadow correctly", () => {
                const style = new StyleForCharacter({
                    id: "myStyleId",
                    run: { shading },
                });
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
                        {
                            "w:rPr": expected,
                        },
                    ],
                });
            });
        });
    });
});
