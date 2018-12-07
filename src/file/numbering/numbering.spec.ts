import { expect } from "chai";

import { Formatter } from "export/formatter";

import { AbstractNumbering } from "./abstract-numbering";
import { LevelForOverride } from "./level";
import { Num } from "./num";
import { Numbering } from "./numbering";

describe("Numbering", () => {
    let numbering: Numbering;

    beforeEach(() => {
        numbering = new Numbering();
    });

    describe("#constructor", () => {
        it("creates a default numbering with one abstract and one concrete instance", () => {
            const tree = new Formatter().format(numbering);
            expect(Object.keys(tree)).to.deep.equal(["w:numbering"]);
            const abstractNums = tree["w:numbering"].filter((el) => el["w:abstractNum"]);
            expect(abstractNums).to.have.lengthOf(1);
            expect(abstractNums[0]["w:abstractNum"]).to.deep.include.members([
                { _attr: { "w:abstractNumId": 0, "w15:restartNumberingAfterBreak": 0 } },
                { "w:multiLevelType": [{ _attr: { "w:val": "hybridMultilevel" } }] },
            ]);

            abstractNums
                .filter((el) => el["w:lvl"])
                .forEach((el, ix) => {
                    expect(Object.keys(el)).to.have.lengthOf(1);
                    expect(Object.keys(el["w:lvl"]).sort()).to.deep.equal(["_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr"]);
                    expect(el["w:lvl"]).to.have.deep.members([
                        { _attr: { "w:ilvl": ix, "w15:tentative": 1 } },
                        { "w:start": [{ _attr: { "w:val": 1 } }] },
                        { "w:lvlJc": [{ _attr: { "w:val": "left" } }] },
                        { "w:numFmt": [{ _attr: { "w:val": "bullet" } }] },
                    ]);
                    // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                    // {"w:lvlText": [{"_attr": {"w:val": "•"}}]},
                    // {"w:rPr": [{"w:rFonts": [{"_attr": {"w:ascii": "Symbol", "w:cs": "Symbol", "w:eastAsia": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}]}]},
                    // {"w:pPr": [{"_attr": {}},
                    //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
                });
        });
    });

    describe("#createAbstractNumbering", () => {
        it("returns a new AbstractNumbering instance", () => {
            const a2 = numbering.createAbstractNumbering();
            expect(a2).to.be.instanceof(AbstractNumbering);
        });

        it("assigns a unique ID to each abstract numbering it creates", () => {
            const a2 = numbering.createAbstractNumbering();
            const a3 = numbering.createAbstractNumbering();
            expect(a2.id).not.to.equal(a3.id);
        });
    });

    describe("#createConcreteNumbering", () => {
        it("returns a new Num instance with its abstract ID set to the AbstractNumbering's ID", () => {
            const a2 = numbering.createAbstractNumbering();
            const n = numbering.createConcreteNumbering(a2);
            expect(n).to.be.instanceof(Num);
            const tree = new Formatter().format(numbering);
            const serializedN = tree["w:numbering"].find((obj) => obj["w:num"] && obj["w:num"][0]._attr["w:numId"] === n.id);
            expect(serializedN["w:num"][1]["w:abstractNumId"][0]._attr["w:val"]).to.equal(a2.id);
        });

        it("assigns a unique ID to each concrete numbering it creates", () => {
            const a2 = numbering.createAbstractNumbering();
            const n = numbering.createConcreteNumbering(a2);
            const n2 = numbering.createConcreteNumbering(a2);
            expect(n.id).not.to.equal(n2.id);
        });
    });
});

describe("AbstractNumbering", () => {
    it("stores its ID at its .id property", () => {
        const abstractNumbering = new AbstractNumbering(5);
        expect(abstractNumbering.id).to.equal(5);
    });

    describe("#createLevel", () => {
        it("creates a level with the given characteristics", () => {
            const abstractNumbering = new AbstractNumbering(1);
            const level = abstractNumbering.createLevel(3, "lowerLetter", "%1)", "end");
            const tree = new Formatter().format(level);
            expect(tree["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:lvl"]).to.include({ "w:start": [{ _attr: { "w:val": 1 } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlJc": [{ _attr: { "w:val": "end" } }] });
            expect(tree["w:lvl"]).to.include({ "w:numFmt": [{ _attr: { "w:val": "lowerLetter" } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlText": [{ _attr: { "w:val": "%1)" } }] });
        });

        it("uses 'start' as the default alignment", () => {
            const abstractNumbering = new AbstractNumbering(1);
            const level = abstractNumbering.createLevel(3, "lowerLetter", "%1)");
            const tree = new Formatter().format(level);
            expect(tree["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:lvl"]).to.include({ "w:start": [{ _attr: { "w:val": 1 } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlJc": [{ _attr: { "w:val": "start" } }] });
            expect(tree["w:lvl"]).to.include({ "w:numFmt": [{ _attr: { "w:val": "lowerLetter" } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlText": [{ _attr: { "w:val": "%1)" } }] });
        });

        describe("formatting methods: paragraph properties", () => {
            it("#indent", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerLetter", "%0.").indent({ left: 720 });
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:ind": [{ _attr: { "w:left": 720 } }] }],
                });
            });

            it("#spacing", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerLetter", "%0.").spacing({ before: 50, after: 150 });
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:spacing": [{ _attr: { "w:before": 50, "w:after": 150 } }] }],
                });
            });

            it("#center", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerLetter", "%0.").center();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": [{ _attr: { "w:val": "center" } }] }],
                });
            });

            it("#left", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.", "left").left();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": [{ _attr: { "w:val": "left" } }] }],
                });
            });

            it("#right", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").right();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": [{ _attr: { "w:val": "right" } }] }],
                });
            });

            it("#justified", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").justified();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:jc": [{ _attr: { "w:val": "both" } }] }],
                });
            });

            it("#thematicBreak", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").thematicBreak();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [
                        {
                            "w:pBdr": [
                                {
                                    "w:bottom": [
                                        {
                                            _attr: {
                                                "w:color": "auto",
                                                "w:space": "1",
                                                "w:val": "single",
                                                "w:sz": "6",
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
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").leftTabStop(1200);
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [
                        {
                            "w:tabs": [{ "w:tab": [{ _attr: { "w:val": "left", "w:pos": 1200 } }] }],
                        },
                    ],
                });
            });

            it("#maxRightTabStop", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").maxRightTabStop();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [
                        {
                            "w:tabs": [{ "w:tab": [{ _attr: { "w:val": "right", "w:pos": 9026 } }] }],
                        },
                    ],
                });
            });

            it("#keepLines", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").keepLines();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:keepLines": [] }],
                });
            });

            it("#keepNext", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").keepNext();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:pPr": [{ "w:keepNext": [] }],
                });
            });
        });

        describe("formatting methods: run properties", () => {
            it("#size", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").size(24);
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:sz": [{ _attr: { "w:val": 24 } }] }],
                });
            });

            it("#smallCaps", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").smallCaps();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:smallCaps": [{ _attr: { "w:val": true } }] }],
                });
            });

            it("#allCaps", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").allCaps();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:caps": [{ _attr: { "w:val": true } }] }],
                });
            });

            it("#strike", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").strike();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:strike": [{ _attr: { "w:val": true } }] }],
                });
            });

            it("#doubleStrike", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").doubleStrike();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:dstrike": [{ _attr: { "w:val": true } }] }],
                });
            });

            it("#subScript", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").subScript();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:vertAlign": [{ _attr: { "w:val": "subscript" } }] }],
                });
            });

            it("#superScript", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").superScript();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:vertAlign": [{ _attr: { "w:val": "superscript" } }] }],
                });
            });

            it("#font", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").font("Times");
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [
                        { "w:rFonts": [{ _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } }] },
                    ],
                });
            });

            it("#bold", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").bold();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:b": [{ _attr: { "w:val": true } }] }],
                });
            });

            it("#italics", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").italics();
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:i": [{ _attr: { "w:val": true } }] }],
                });
            });

            describe("#underline", () => {
                it("should set underline to 'single' if no arguments are given", () => {
                    const abstractNumbering = new AbstractNumbering(1);
                    const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").underline();
                    const tree = new Formatter().format(level);
                    expect(tree["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": [{ _attr: { "w:val": "single" } }] }],
                    });
                });

                it("should set the style if given", () => {
                    const abstractNumbering = new AbstractNumbering(1);
                    const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").underline("double");
                    const tree = new Formatter().format(level);
                    expect(tree["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": [{ _attr: { "w:val": "double" } }] }],
                    });
                });

                it("should set the style and color if given", () => {
                    const abstractNumbering = new AbstractNumbering(1);
                    const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").underline("double", "005599");
                    const tree = new Formatter().format(level);
                    expect(tree["w:lvl"]).to.include({
                        "w:rPr": [{ "w:u": [{ _attr: { "w:val": "double", "w:color": "005599" } }] }],
                    });
                });
            });

            it("#color", () => {
                const abstractNumbering = new AbstractNumbering(1);
                const level = abstractNumbering.createLevel(0, "lowerRoman", "%0.").color("123456");
                const tree = new Formatter().format(level);
                expect(tree["w:lvl"]).to.include({
                    "w:rPr": [{ "w:color": [{ _attr: { "w:val": "123456" } }] }],
                });
            });
        });
    });
});

describe("concrete numbering", () => {
    describe("#overrideLevel", () => {
        let numbering;
        let abstractNumbering;
        let concreteNumbering;
        beforeEach(() => {
            numbering = new Numbering();
            abstractNumbering = numbering.createAbstractNumbering();
            concreteNumbering = numbering.createConcreteNumbering(abstractNumbering);
        });

        it("sets a new override level for the given level number", () => {
            concreteNumbering.overrideLevel(3);
            const tree = new Formatter().format(concreteNumbering);
            expect(tree["w:num"]).to.include({
                "w:lvlOverride": [
                    {
                        _attr: {
                            "w:ilvl": 3,
                        },
                    },
                    {
                        "w:lvl": [
                            {
                                _attr: {
                                    "w:ilvl": 3,
                                    "w15:tentative": 1,
                                },
                            },
                            {
                                "w:pPr": [],
                            },
                            {
                                "w:rPr": [],
                            },
                        ],
                    },
                ],
            });
        });

        it("sets the startOverride element if start is given", () => {
            concreteNumbering.overrideLevel(1, 9);
            const tree = new Formatter().format(concreteNumbering);
            expect(tree["w:num"]).to.include({
                "w:lvlOverride": [
                    {
                        _attr: {
                            "w:ilvl": 1,
                        },
                    },
                    {
                        "w:startOverride": [
                            {
                                _attr: {
                                    "w:val": 9,
                                },
                            },
                        ],
                    },
                    {
                        "w:lvl": [
                            {
                                _attr: {
                                    "w:ilvl": 1,
                                    "w15:tentative": 1,
                                },
                            },
                            {
                                "w:pPr": [],
                            },
                            {
                                "w:rPr": [],
                            },
                        ],
                    },
                ],
            });
        });

        it("sets the lvl element if overrideLevel.Level is accessed", () => {
            const ol = concreteNumbering.overrideLevel(1);
            expect(ol.Level).to.be.instanceof(LevelForOverride);
            const tree = new Formatter().format(concreteNumbering);
            expect(tree["w:num"]).to.include({
                "w:lvlOverride": [
                    { _attr: { "w:ilvl": 1 } },
                    {
                        "w:lvl": [{ _attr: { "w15:tentative": 1, "w:ilvl": 1 } }, { "w:pPr": [] }, { "w:rPr": [] }],
                    },
                ],
            });
        });
    });
});
