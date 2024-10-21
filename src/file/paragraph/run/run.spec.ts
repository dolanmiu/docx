import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";
import { ShadingType } from "@file/shading";

import { EmphasisMarkType } from "./emphasis-mark";
import { HighlightColor, TextEffect } from "./properties";
import { PageNumber, Run } from "./run";
import { UnderlineType } from "./underline";

describe("Run", () => {
    describe("#noProof()", () => {
        it("turns off spelling and grammar checkers for a run", () => {
            const run = new Run({
                noProof: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [{ "w:noProof": {} }],
                    },
                ],
            });
        });
    });

    describe("#bold()", () => {
        it("it should add bold to the properties", () => {
            const run = new Run({
                bold: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:b": {} },
                            {
                                "w:bCs": {},
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#italics()", () => {
        it("it should add italics to the properties", () => {
            const run = new Run({
                italics: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:i": {} },
                            {
                                "w:iCs": {},
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#underline()", () => {
        it("should default to 'single' and no color", () => {
            const run = new Run({
                underline: {},
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }] }],
            });
        });

        it("should set the style type and color if given", () => {
            const run = new Run({
                underline: {
                    type: UnderlineType.DOUBLE,
                    color: "990011",
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "990011" } } }] }],
            });
        });
    });

    describe("#emphasisMark()", () => {
        it("should default to 'dot'", () => {
            const run = new Run({
                emphasisMark: {},
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }] }],
            });
        });

        it("should set the style type if given", () => {
            const run = new Run({
                emphasisMark: {
                    type: EmphasisMarkType.DOT,
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }] }],
            });
        });
    });

    describe("#smallCaps()", () => {
        it("it should add smallCaps to the properties", () => {
            const run = new Run({
                smallCaps: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:smallCaps": {} }] }],
            });
        });
    });

    describe("#caps()", () => {
        it("it should add caps to the properties", () => {
            const run = new Run({
                allCaps: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:caps": {} }] }],
            });
        });
    });

    describe("#strike()", () => {
        it("it should add strike to the properties", () => {
            const run = new Run({
                strike: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:strike": {} }] }],
            });
        });
    });

    describe("#doubleStrike()", () => {
        it("it should add double strike to the properties", () => {
            const run = new Run({
                doubleStrike: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:dstrike": {} }] }],
            });
        });
    });

    describe("#emboss()", () => {
        it("it should add emboss to the properties", () => {
            const run = new Run({
                emboss: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:emboss": {} }] }],
            });
        });
    });

    describe("#imprint()", () => {
        it("it should add imprint to the properties", () => {
            const run = new Run({
                imprint: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:imprint": {} }] }],
            });
        });
    });

    describe("#subScript()", () => {
        it("it should add subScript to the properties", () => {
            const run = new Run({
                subScript: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "subscript" } } }] }],
            });
        });
    });

    describe("#superScript()", () => {
        it("it should add superScript to the properties", () => {
            const run = new Run({
                superScript: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "superscript" } } }] }],
            });
        });
    });

    describe("#highlight()", () => {
        it("it should add highlight to the properties", () => {
            const run = new Run({
                highlight: HighlightColor.YELLOW,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:highlight": { _attr: { "w:val": "yellow" } } },
                            {
                                "w:highlightCs": {
                                    _attr: {
                                        "w:val": "yellow",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#shadow()", () => {
        it("it should add shadow to the properties", () => {
            const run = new Run({
                shading: {
                    type: ShadingType.PERCENT_10,
                    fill: "00FFFF",
                    color: "FF0000",
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                    },
                ],
            });
        });
    });

    describe("#break()", () => {
        it("it should add break to the run", () => {
            const run = new Run({
                break: 1,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:br": {} }],
            });
        });

        it("it should add two breaks to the run", () => {
            const run = new Run({
                break: 2,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:br": {} },
                    {
                        "w:br": {},
                    },
                ],
            });
        });
    });

    describe("#font()", () => {
        it("should set the font as named", () => {
            const run = new Run({
                font: {
                    name: "Times",
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            {
                                "w:rFonts": {
                                    _attr: {
                                        "w:ascii": "Times",
                                        "w:cs": "Times",
                                        "w:eastAsia": "Times",
                                        "w:hAnsi": "Times",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should set the font for ascii and eastAsia", () => {
            const run = new Run({
                font: {
                    ascii: "Times",
                    eastAsia: "KaiTi",
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            {
                                "w:rFonts": {
                                    _attr: {
                                        "w:ascii": "Times",
                                        "w:eastAsia": "KaiTi",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#color", () => {
        it("should set the run to the color given", () => {
            const run = new Run({
                color: "001122",
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:color": { _attr: { "w:val": "001122" } } }] }],
            });
        });
    });

    describe("#size", () => {
        it("should set the run to the given size", () => {
            const run = new Run({
                size: 24,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [{ "w:sz": { _attr: { "w:val": 24 } } }, { "w:szCs": { _attr: { "w:val": 24 } } }],
                    },
                ],
            });
        });
    });

    describe("#rtl", () => {
        it("should set the run to the RTL mode", () => {
            const run = new Run({
                rightToLeft: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:rtl": {} }] }],
            });
        });
    });

    describe("#numberOfTotalPages", () => {
        it("should set the run to the RTL mode", () => {
            const run = new Run({
                children: [PageNumber.TOTAL_PAGES],
            });

            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "NUMPAGES"] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });
    });

    describe("#numberOfTotalPagesSection", () => {
        it("should set the run to the RTL mode", () => {
            const run = new Run({
                children: [PageNumber.TOTAL_PAGES_IN_SECTION],
            });

            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "SECTIONPAGES"] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });
    });

    describe("#pageNumber", () => {
        it("should set the run to the RTL mode", () => {
            const run = new Run({
                children: [PageNumber.CURRENT],
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "PAGE"] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });
    });

    describe("#section", () => {
        it("should set the run to the RTL mode", () => {
            const run = new Run({
                children: [PageNumber.CURRENT_SECTION],
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, "SECTION"] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "separate" } } },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });
    });

    describe("#style", () => {
        it("should set the style to the given styleId", () => {
            const run = new Run({
                style: "myRunStyle",
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [{ "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "myRunStyle" } } }] }],
            });
        });
    });

    describe("#revisions", () => {
        it("should add style revisions", () => {
            const run = new Run({
                bold: true,
                italics: true,
                revision: {
                    id: 0,
                    author: "Firstname Lastname",
                    date: "123",
                    bold: false,
                    italics: true,
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:b": {} },
                            {
                                "w:bCs": {},
                            },
                            { "w:i": {} },
                            {
                                "w:iCs": {},
                            },
                            {
                                "w:rPrChange": [
                                    {
                                        _attr: {
                                            "w:author": "Firstname Lastname",
                                            "w:date": "123",
                                            "w:id": 0,
                                        },
                                    },
                                    {
                                        "w:rPr": [
                                            { "w:b": { _attr: { "w:val": false } } },
                                            {
                                                "w:bCs": {
                                                    _attr: {
                                                        "w:val": false,
                                                    },
                                                },
                                            },
                                            { "w:i": {} },
                                            {
                                                "w:iCs": {},
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#border", () => {
        it("should correctly set the border", () => {
            const run = new Run({
                border: {
                    color: "auto",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            {
                                "w:bdr": {
                                    _attr: {
                                        "w:color": "auto",
                                        "w:space": 1,
                                        "w:sz": 6,
                                        "w:val": "single",
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#vanish and #specVanish", () => {
        it("should correctly set vanish", () => {
            const run = new Run({
                vanish: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            {
                                "w:vanish": {},
                            },
                        ],
                    },
                ],
            });
        });

        it("should correctly set specVanish", () => {
            const run = new Run({
                specVanish: true,
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            {
                                "w:specVanish": {},
                            },
                        ],
                    },
                ],
            });
        });

        describe("#scale", () => {
            it("should correctly set the border", () => {
                const run = new Run({
                    scale: 200,
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:w": {
                                        _attr: {
                                            "w:val": 200,
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#language", () => {
            it("should correctly set the language", () => {
                const run = new Run({
                    language: {
                        value: "en-US",
                        eastAsia: "zh-CN",
                        bidirectional: "ar-SA",
                    },
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:lang": {
                                        _attr: {
                                            "w:val": "en-US",
                                            "w:eastAsia": "zh-CN",
                                            "w:bidi": "ar-SA",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#position", () => {
            it("should correctly set the position", () => {
                const run = new Run({
                    position: "2mm",
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:position": {
                                        _attr: {
                                            "w:val": "2mm",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#effect", () => {
            it("should correctly set the effect", () => {
                const run = new Run({
                    effect: TextEffect.ANTS_BLACK,
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:effect": {
                                        _attr: {
                                            "w:val": "antsBlack",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#math", () => {
            it("should correctly set the math", () => {
                const run = new Run({
                    math: true,
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:oMath": {},
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#kern", () => {
            it("should correctly set the kern", () => {
                const run = new Run({
                    kern: "2mm",
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:kern": {
                                        _attr: {
                                            "w:val": "2mm",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });

        describe("#snapToGrid", () => {
            it("should correctly set the snapToGrid", () => {
                const run = new Run({
                    snapToGrid: true,
                });
                const tree = new Formatter().format(run);
                expect(tree).to.deep.equal({
                    "w:r": [
                        {
                            "w:rPr": [
                                {
                                    "w:snapToGrid": {},
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });
});
