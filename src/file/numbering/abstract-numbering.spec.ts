import { expect } from "chai";

import { Formatter } from "export/formatter";
import { EMPTY_OBJECT } from "file/xml-components";

import { AlignmentType, TabStopPosition } from "../paragraph";
import { UnderlineType } from "../paragraph/run/underline";
import { ShadingType } from "../table";
import { AbstractNumbering } from "./abstract-numbering";

describe("AbstractNumbering", () => {
    it("stores its ID at its .id property", () => {
        const abstractNumbering = new AbstractNumbering(5, []);
        expect(abstractNumbering.id).to.equal(5);
    });

    describe("#createLevel", () => {
        it("creates a level with the given characteristics", () => {
            const abstractNumbering = new AbstractNumbering(1, [
                {
                    level: 3,
                    format: "lowerLetter",
                    text: "%1)",
                    alignment: AlignmentType.END,
                },
            ]);
            const tree = new Formatter().format(abstractNumbering);
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:start": { _attr: { "w:val": 1 } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:lvlJc": { _attr: { "w:val": "end" } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:numFmt": { _attr: { "w:val": "lowerLetter" } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:lvlText": { _attr: { "w:val": "%1)" } } });
        });

        it("uses 'start' as the default alignment", () => {
            const abstractNumbering = new AbstractNumbering(1, [
                {
                    level: 3,
                    format: "lowerLetter",
                    text: "%1)",
                },
            ]);
            const tree = new Formatter().format(abstractNumbering);
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:start": { _attr: { "w:val": 1 } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:lvlJc": { _attr: { "w:val": "start" } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:numFmt": { _attr: { "w:val": "lowerLetter" } } });
            expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:lvlText": { _attr: { "w:val": "%1)" } } });
        });

        describe("formatting methods: paragraph properties", () => {
            it("#indent", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                indent: { left: 720 },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:ind": { _attr: { "w:left": 720 } } }],
                });
            });

            it("#spacing", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                spacing: { before: 50, after: 150 },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:spacing": { _attr: { "w:before": 50, "w:after": 150 } } }],
                });
            });

            it("#center", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.CENTER,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": { _attr: { "w:val": "center" } } }],
                });
            });

            it("#left", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.LEFT,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": { _attr: { "w:val": "left" } } }],
                });
            });

            it("#right", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.RIGHT,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": { _attr: { "w:val": "right" } } }],
                });
            });

            it("#justified", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.JUSTIFIED,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": { _attr: { "w:val": "both" } } }],
                });
            });

            it("#thematicBreak", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                thematicBreak: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
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
                });
            });

            it("#leftTabStop", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                leftTabStop: 1200,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [
                        {
                            "w:tabs": [{ "w:tab": { _attr: { "w:val": "left", "w:pos": 1200 } } }],
                        },
                    ],
                });
            });

            it("#maxRightTabStop", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                rightTabStop: TabStopPosition.MAX,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [
                        {
                            "w:tabs": [{ "w:tab": { _attr: { "w:val": "right", "w:pos": 9026 } } }],
                        },
                    ],
                });
            });

            it("#keepLines", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                keepLines: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:keepLines": EMPTY_OBJECT }],
                });
            });

            it("#keepNext", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            paragraph: {
                                keepNext: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }],
                });
            });
        });

        describe("formatting methods: run properties", () => {
            it("#size", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                size: 24,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:sz": { _attr: { "w:val": 24 } } }],
                });
            });

            it("#smallCaps", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                smallCaps: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:smallCaps": { _attr: { "w:val": true } } }],
                });
            });

            it("#allCaps", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                allCaps: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:caps": { _attr: { "w:val": true } } }],
                });
            });

            it("#strike", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                strike: true,
                            },
                        },
                    },
                ]);

                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:strike": { _attr: { "w:val": true } } }],
                });
            });

            it("#doubleStrike", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                doubleStrike: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:dstrike": { _attr: { "w:val": true } } }],
                });
            });

            it("#subScript", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                subScript: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "subscript" } } }],
                });
            });

            it("#superScript", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                superScript: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "superscript" } } }],
                });
            });

            it("#font", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                font: "Times",
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [
                        { "w:rFonts": { _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } } },
                    ],
                });
            });

            it("#bold", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                bold: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:b": { _attr: { "w:val": true } } }],
                });
            });

            it("#italics", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                italics: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:i": { _attr: { "w:val": true } } }],
                });
            });

            it("#highlight", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                highlight: "005599",
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:highlight": { _attr: { "w:val": "005599" } } }],
                });
            });

            it("#shadow", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                shadow: {
                                    type: ShadingType.PERCENT_10,
                                    fill: "00FFFF",
                                    color: "FF0000",
                                },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                });
            });

            describe("#underline", () => {
                it("should set underline to 'single' if no arguments are given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: "lowerRoman",
                            text: "%0.",
                            style: {
                                run: {
                                    underline: {},
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }],
                    });
                });

                it("should set the style if given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: "lowerRoman",
                            text: "%0.",
                            style: {
                                run: {
                                    underline: {
                                        type: UnderlineType.DOUBLE,
                                    },
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                    });
                });

                it("should set the style and color if given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: "lowerRoman",
                            text: "%0.",
                            style: {
                                run: {
                                    underline: {
                                        type: UnderlineType.DOUBLE,
                                        color: "005599",
                                    },
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                    });
                });
            });

            it("#color", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: "lowerRoman",
                        text: "%0.",
                        style: {
                            run: {
                                color: "123456",
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({
                    "w:rPr": [{ "w:color": { _attr: { "w:val": "123456" } } }],
                });
            });
        });
    });
});
