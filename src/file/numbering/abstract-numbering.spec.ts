import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { AlignmentType, EmphasisMarkType, TabStopPosition } from "../paragraph";
import { UnderlineType } from "../paragraph/run/underline";
import { ShadingType } from "../shading";
import { AbstractNumbering } from "./abstract-numbering";
import { LevelFormat, LevelSuffix } from "./level";

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
                    format: LevelFormat.LOWER_LETTER,
                    text: "%1)",
                    alignment: AlignmentType.END,
                },
            ]);
            const tree = new Formatter().format(abstractNumbering);
            expect(tree).to.deep.equal({
                "w:abstractNum": [
                    {
                        _attr: {
                            "w15:restartNumberingAfterBreak": 0,
                            "w:abstractNumId": 1,
                        },
                    },
                    {
                        "w:multiLevelType": {
                            _attr: {
                                "w:val": "hybridMultilevel",
                            },
                        },
                    },
                    {
                        "w:lvl": [
                            {
                                "w:start": {
                                    _attr: {
                                        "w:val": 1,
                                    },
                                },
                            },
                            {
                                "w:numFmt": {
                                    _attr: {
                                        "w:val": LevelFormat.LOWER_LETTER,
                                    },
                                },
                            },
                            {
                                "w:lvlText": {
                                    _attr: {
                                        "w:val": "%1)",
                                    },
                                },
                            },
                            {
                                "w:lvlJc": {
                                    _attr: {
                                        "w:val": "end",
                                    },
                                },
                            },
                            {
                                _attr: {
                                    "w15:tentative": 1,
                                    "w:ilvl": 3,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("uses 'start' as the default alignment", () => {
            const abstractNumbering = new AbstractNumbering(1, [
                {
                    level: 3,
                    format: LevelFormat.LOWER_LETTER,
                    text: "%1)",
                },
            ]);
            const tree = new Formatter().format(abstractNumbering);
            expect(tree).to.deep.equal({
                "w:abstractNum": [
                    {
                        _attr: {
                            "w15:restartNumberingAfterBreak": 0,
                            "w:abstractNumId": 1,
                        },
                    },
                    {
                        "w:multiLevelType": {
                            _attr: {
                                "w:val": "hybridMultilevel",
                            },
                        },
                    },
                    {
                        "w:lvl": [
                            {
                                "w:start": {
                                    _attr: {
                                        "w:val": 1,
                                    },
                                },
                            },
                            {
                                "w:numFmt": {
                                    _attr: {
                                        "w:val": LevelFormat.LOWER_LETTER,
                                    },
                                },
                            },
                            {
                                "w:lvlText": {
                                    _attr: {
                                        "w:val": "%1)",
                                    },
                                },
                            },
                            {
                                "w:lvlJc": {
                                    _attr: {
                                        "w:val": "start",
                                    },
                                },
                            },
                            {
                                _attr: {
                                    "w15:tentative": 1,
                                    "w:ilvl": 3,
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("has suffix", () => {
            const abstractNumbering = new AbstractNumbering(1, [
                {
                    level: 3,
                    format: LevelFormat.LOWER_LETTER,
                    text: "%1)",
                    alignment: AlignmentType.END,
                    suffix: LevelSuffix.SPACE,
                },
            ]);
            const tree = new Formatter().format(abstractNumbering);
            expect(tree).to.deep.equal({
                "w:abstractNum": [
                    {
                        _attr: {
                            "w15:restartNumberingAfterBreak": 0,
                            "w:abstractNumId": 1,
                        },
                    },
                    {
                        "w:multiLevelType": {
                            _attr: {
                                "w:val": "hybridMultilevel",
                            },
                        },
                    },
                    {
                        "w:lvl": [
                            {
                                "w:start": {
                                    _attr: {
                                        "w:val": 1,
                                    },
                                },
                            },
                            {
                                "w:numFmt": {
                                    _attr: {
                                        "w:val": "lowerLetter",
                                    },
                                },
                            },
                            {
                                "w:suff": {
                                    _attr: {
                                        "w:val": "space",
                                    },
                                },
                            },
                            {
                                "w:lvlText": {
                                    _attr: {
                                        "w:val": "%1)",
                                    },
                                },
                            },
                            {
                                "w:lvlJc": {
                                    _attr: {
                                        "w:val": "end",
                                    },
                                },
                            },
                            {
                                _attr: {
                                    "w15:tentative": 1,
                                    "w:ilvl": 3,
                                },
                            },
                        ],
                    },
                ],
            });
            // expect(tree["w:abstractNum"][2]["w:lvl"]).to.include({ "w:suff": { _attr: { "w:val": "space" } } });
        });

        describe("formatting methods: paragraph properties", () => {
            it("#indent", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                indent: { left: 720 },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:ind": {
                                                _attr: {
                                                    "w:left": 720,
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#spacing", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                spacing: { before: 50, after: 150 },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:spacing": {
                                                _attr: {
                                                    "w:after": 150,
                                                    "w:before": 50,
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#center", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.CENTER,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:jc": {
                                                _attr: {
                                                    "w:val": "center",
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#left", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.LEFT,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:jc": {
                                                _attr: {
                                                    "w:val": "left",
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#right", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.RIGHT,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:jc": {
                                                _attr: {
                                                    "w:val": "right",
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#justified", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                alignment: AlignmentType.JUSTIFIED,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:jc": {
                                                _attr: {
                                                    "w:val": "both",
                                                },
                                            },
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#thematicBreak", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                thematicBreak: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:pBdr": [
                                                {
                                                    "w:bottom": {
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
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
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
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                leftTabStop: 1200,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:tabs": [
                                                {
                                                    "w:tab": {
                                                        _attr: {
                                                            "w:pos": 1200,
                                                            "w:val": "left",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#maxRightTabStop", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                rightTabStop: TabStopPosition.MAX,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:tabs": [
                                                {
                                                    "w:tab": {
                                                        _attr: {
                                                            "w:pos": 9026,
                                                            "w:val": "right",
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#keepLines", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                keepLines: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:keepLines": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#keepNext", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            paragraph: {
                                keepNext: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:pPr": [
                                        {
                                            "w:keepNext": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
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
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: { size, sizeComplexScript },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": expected,
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });
            });

            it("#smallCaps", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                smallCaps: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [
                                        {
                                            "w:smallCaps": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#allCaps", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                allCaps: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [
                                        {
                                            "w:caps": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#strike", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                strike: true,
                            },
                        },
                    },
                ]);

                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [
                                        {
                                            "w:strike": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#doubleStrike", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                doubleStrike: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [
                                        {
                                            "w:dstrike": {},
                                        },
                                    ],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#subScript", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                subScript: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "subscript" } } }],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#superScript", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                superScript: true,
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [{ "w:vertAlign": { _attr: { "w:val": "superscript" } } }],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#font by name", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                font: "Times",
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
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
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });

            it("#font for ascii and eastAsia", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                font: {
                                    ascii: "Times",
                                    eastAsia: "KaiTi",
                                },
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
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
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
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
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: { bold, boldComplexScript },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": expected,
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
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
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: { italics, italicsComplexScript },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": expected,
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
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
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: { highlight, highlightComplexScript },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": expected,
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });
            });

            const shadingTests = [
                {
                    shading: {
                        type: ShadingType.DIAGONAL_STRIPE,
                        fill: "006622",
                        color: "0000FF",
                    },
                    expected: [{ "w:shd": { _attr: { "w:val": "diagStripe", "w:fill": "006622", "w:color": "0000FF" } } }],
                },
                {
                    shading: {
                        type: ShadingType.PERCENT_10,
                        fill: "00FFFF",
                        color: "FF0000",
                    },
                    expected: [{ "w:shd": { _attr: { "w:val": "pct10", "w:fill": "00FFFF", "w:color": "FF0000" } } }],
                },
            ];
            shadingTests.forEach(({ shading, expected }) => {
                it("#shade correctly", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: { shading },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": expected,
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });
            });

            describe("#underline", () => {
                it("should set underline to 'single' if no arguments are given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: {
                                    underline: {},
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": [{ "w:u": { _attr: { "w:val": "single" } } }],
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });

                it("should set the style if given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
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
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": [{ "w:u": { _attr: { "w:val": "double" } } }],
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });

                it("should set the style and color if given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
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
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": [{ "w:u": { _attr: { "w:val": "double", "w:color": "005599" } } }],
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });
            });

            describe("#emphasisMark", () => {
                it("should set emphasisMark to 'dot' if no arguments are given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: {
                                    emphasisMark: {},
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }],
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });

                it("should set the style if given", () => {
                    const abstractNumbering = new AbstractNumbering(1, [
                        {
                            level: 0,
                            format: LevelFormat.LOWER_ROMAN,
                            text: "%0.",
                            style: {
                                run: {
                                    emphasisMark: {
                                        type: EmphasisMarkType.DOT,
                                    },
                                },
                            },
                        },
                    ]);
                    const tree = new Formatter().format(abstractNumbering);
                    expect(tree).to.deep.equal({
                        "w:abstractNum": [
                            {
                                _attr: {
                                    "w15:restartNumberingAfterBreak": 0,
                                    "w:abstractNumId": 1,
                                },
                            },
                            {
                                "w:multiLevelType": {
                                    _attr: {
                                        "w:val": "hybridMultilevel",
                                    },
                                },
                            },
                            {
                                "w:lvl": [
                                    {
                                        "w:start": {
                                            _attr: {
                                                "w:val": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:numFmt": {
                                            _attr: {
                                                "w:val": "lowerRoman",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlText": {
                                            _attr: {
                                                "w:val": "%0.",
                                            },
                                        },
                                    },
                                    {
                                        "w:lvlJc": {
                                            _attr: {
                                                "w:val": "start",
                                            },
                                        },
                                    },
                                    {
                                        "w:rPr": [{ "w:em": { _attr: { "w:val": "dot" } } }],
                                    },
                                    {
                                        _attr: {
                                            "w15:tentative": 1,
                                            "w:ilvl": 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                });
            });

            it("#color", () => {
                const abstractNumbering = new AbstractNumbering(1, [
                    {
                        level: 0,
                        format: LevelFormat.LOWER_ROMAN,
                        text: "%0.",
                        style: {
                            run: {
                                color: "123456",
                            },
                        },
                    },
                ]);
                const tree = new Formatter().format(abstractNumbering);
                expect(tree).to.deep.equal({
                    "w:abstractNum": [
                        {
                            _attr: {
                                "w15:restartNumberingAfterBreak": 0,
                                "w:abstractNumId": 1,
                            },
                        },
                        {
                            "w:multiLevelType": {
                                _attr: {
                                    "w:val": "hybridMultilevel",
                                },
                            },
                        },
                        {
                            "w:lvl": [
                                {
                                    "w:start": {
                                        _attr: {
                                            "w:val": 1,
                                        },
                                    },
                                },
                                {
                                    "w:numFmt": {
                                        _attr: {
                                            "w:val": "lowerRoman",
                                        },
                                    },
                                },
                                {
                                    "w:lvlText": {
                                        _attr: {
                                            "w:val": "%0.",
                                        },
                                    },
                                },
                                {
                                    "w:lvlJc": {
                                        _attr: {
                                            "w:val": "start",
                                        },
                                    },
                                },
                                {
                                    "w:rPr": [{ "w:color": { _attr: { "w:val": "123456" } } }],
                                },
                                {
                                    _attr: {
                                        "w15:tentative": 1,
                                        "w:ilvl": 0,
                                    },
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });
});
