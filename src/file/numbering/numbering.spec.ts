import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import { Paragraph } from "@file/paragraph";
import { Table, TableCell, TableRow } from "@file/table";

import { LevelFormat } from "./level";
import { Numbering } from "./numbering";

describe("Numbering", () => {
    describe("#constructor", () => {
        it("creates a default numbering with one abstract and one concrete instance", () => {
            const numbering = new Numbering({
                config: [],
            });

            const tree = new Formatter().format(numbering);
            expect(Object.keys(tree)).to.deep.equal(["w:numbering"]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const abstractNums: readonly any[] = tree["w:numbering"].filter((el: any) => el["w:abstractNum"]);
            expect(abstractNums).to.have.lengthOf(1);
            expect(abstractNums[0]["w:abstractNum"]).to.deep.include.members([
                { _attr: { "w:abstractNumId": 1, "w15:restartNumberingAfterBreak": 0 } },
                { "w:multiLevelType": { _attr: { "w:val": "hybridMultilevel" } } },
            ]);

            abstractNums
                .filter((el) => el["w:lvl"])
                .forEach((el, ix) => {
                    expect(Object.keys(el)).to.have.lengthOf(1);
                    expect(Object.keys(el["w:lvl"])).to.deep.equal(["_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr"]);
                    expect(el["w:lvl"]).to.have.deep.members([
                        { _attr: { "w:ilvl": ix, "w:tentative": 1 } },
                        { "w:start": [{ _attr: { "w:val": 1 } }] },
                        { "w:lvlJc": [{ _attr: { "w:val": "left" } }] },
                        { "w:numFmt": [{ _attr: { "w:val": "bullet" } }] },
                    ]);
                    // TODO
                    // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                    // {"w:lvlText": {"_attr": {"w:val": "•"}}},
                    // {"w:rPr": [{"w:rFonts": {"_attr": {"w:ascii": "Symbol", "w:cs": "Symbol", "w:eastAsia": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}}]},
                    // {"w:pPr": [
                    //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
                });
        });

        describe("#createConcreteNumberingInstance", () => {
            it("should create a concrete numbering instance", () => {
                const numbering = new Numbering({
                    config: [
                        {
                            reference: "test-reference",
                            levels: [
                                {
                                    level: 0,
                                },
                            ],
                        },
                    ],
                });
                expect(numbering.ConcreteNumbering).to.have.length(1);

                numbering.createConcreteNumberingInstance("test-reference", 0);

                expect(numbering.ConcreteNumbering).to.have.length(2);
            });

            it("should not create a concrete numbering instance if reference is invalid", () => {
                const numbering = new Numbering({
                    config: [
                        {
                            reference: "test-reference",
                            levels: [
                                {
                                    level: 0,
                                },
                            ],
                        },
                    ],
                });
                expect(numbering.ConcreteNumbering).to.have.length(1);

                numbering.createConcreteNumberingInstance("invalid-reference", 0);

                expect(numbering.ConcreteNumbering).to.have.length(1);
            });

            it("should not create a concrete numbering instance if one already exists", () => {
                const numbering = new Numbering({
                    config: [
                        {
                            reference: "test-reference",
                            levels: [
                                {
                                    level: 0,
                                },
                            ],
                        },
                    ],
                });

                expect(numbering.ConcreteNumbering).to.have.length(1);

                numbering.createConcreteNumberingInstance("test-reference", 0);
                numbering.createConcreteNumberingInstance("test-reference", 0);

                expect(numbering.ConcreteNumbering).to.have.length(2);
            });

            it("should add a list's own definition, and number the list from its first level's start", () => {
                const numbering = new Numbering({ config: [] });

                numbering.createConcreteNumberingInstance("own-list", 0, {
                    reference: "own-list",
                    levels: [{ level: 0, format: LevelFormat.UPPER_ROMAN, text: "%1)", start: 4 }],
                });

                expect(numbering.ConcreteNumbering.map(({ reference }) => reference)).to.deep.equal([
                    "default-bullet-numbering",
                    "own-list",
                ]);
                expect(numbering.ReferenceConfig).to.deep.equal([[{ level: 0, format: LevelFormat.UPPER_ROMAN, text: "%1)", start: 4 }]]);
                const written = JSON.stringify(new Formatter().format(numbering));
                expect(written).to.include('{"w:numFmt":{"_attr":{"w:val":"upperRoman"}}}');
                expect(written).to.include('{"w:lvlText":{"_attr":{"w:val":"%1)"}}}');
                expect(written).to.include('{"w:startOverride":{"_attr":{"w:val":4}}}');
            });

            it("should restart every configured level in a new instance, each from its own start", () => {
                const numbering = new Numbering({
                    config: [
                        {
                            reference: "nested",
                            levels: [
                                { level: 0, format: LevelFormat.DECIMAL, text: "%1." },
                                { level: 1, format: LevelFormat.DECIMAL, text: "%2.", start: 3 },
                                { level: 2, format: LevelFormat.DECIMAL, text: "%3." },
                            ],
                        },
                    ],
                });

                numbering.createConcreteNumberingInstance("nested", 1);

                const written = JSON.stringify(new Formatter().format(numbering.ConcreteNumbering[1]));
                expect(written).to.equal(
                    JSON.stringify({
                        "w:num": [
                            { _attr: { "w:numId": 2 } },
                            { "w:abstractNumId": { _attr: { "w:val": 2 } } },
                            { "w:lvlOverride": [{ _attr: { "w:ilvl": 0 } }, { "w:startOverride": { _attr: { "w:val": 1 } } }] },
                            { "w:lvlOverride": [{ _attr: { "w:ilvl": 1 } }, { "w:startOverride": { _attr: { "w:val": 3 } } }] },
                            { "w:lvlOverride": [{ _attr: { "w:ilvl": 2 } }, { "w:startOverride": { _attr: { "w:val": 1 } } }] },
                        ],
                    }),
                );
            });

            it("should add a list's own definition once, however many paragraphs and instances give it", () => {
                const numbering = new Numbering({ config: [] });
                const definition = { reference: "own-list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] };

                numbering.createConcreteNumberingInstance("own-list", 0, definition);
                numbering.createConcreteNumberingInstance("own-list", 0, definition);
                numbering.createConcreteNumberingInstance("own-list", 1, definition);

                expect(numbering.ConcreteNumbering.map(({ instance }) => instance)).to.deep.equal([0, 0, 1]);
                expect(numbering.ReferenceConfig).to.have.length(1);
                expect(JSON.stringify(new Formatter().format(numbering)).split('"w:abstractNum"').length - 1).to.equal(2);
            });

            it("should keep the document's own definition of a reference, rather than one a paragraph gives", () => {
                const numbering = new Numbering({
                    config: [{ reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", start: 7 }] }],
                });

                numbering.createConcreteNumberingInstance("steps", 0, {
                    reference: "steps",
                    levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: "%1)" }],
                });

                const written = JSON.stringify(new Formatter().format(numbering));
                expect(written).to.include('{"w:numFmt":{"_attr":{"w:val":"decimal"}}}');
                expect(written).not.to.include("lowerLetter");
                expect(written).to.include('{"w:startOverride":{"_attr":{"w:val":7}}}');
            });

            it("should keep the first definition a paragraph gives of a reference", () => {
                const numbering = new Numbering({ config: [] });

                numbering.createConcreteNumberingInstance("own-list", 0, {
                    reference: "own-list",
                    levels: [{ level: 0, format: LevelFormat.LOWER_ROMAN, text: "%1." }],
                });
                numbering.createConcreteNumberingInstance("own-list", 1, {
                    reference: "own-list",
                    levels: [{ level: 0, format: LevelFormat.UPPER_LETTER, text: "%1." }],
                });

                const written = JSON.stringify(new Formatter().format(numbering));
                expect(written).to.include("lowerRoman");
                expect(written).not.to.include("upperLetter");
            });
        });
        describe("#referenceConfigMap", () => {
            it("should store level configs into referenceConfigMap", () => {
                const numbering = new Numbering({
                    config: [
                        {
                            reference: "test-reference",
                            levels: [
                                {
                                    level: 0,
                                    start: 10,
                                },
                            ],
                        },
                    ],
                });
                numbering.createConcreteNumberingInstance("test-reference", 0);
                const referenceConfig = numbering.ReferenceConfig[0];
                const zeroLevelConfig = referenceConfig[0];
                expect(zeroLevelConfig.start).to.be.equal(10);
            });
        });
    });

    describe("#prepForXml", () => {
        it("should write each definition once, in order, when written again", () => {
            const numbering = new Numbering({ config: [{ reference: "test-reference", levels: [{ level: 0 }] }] });

            numbering.createConcreteNumberingInstance("test-reference", 0);
            new Formatter().format(numbering);
            // Such as a list first used in a header, which is written after the document
            numbering.createConcreteNumberingInstance("test-reference", 1);
            const tree = new Formatter().format(numbering);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const names = tree["w:numbering"].map((element: any) => Object.keys(element)[0]);
            expect(names).to.deep.equal(["_attr", "w:abstractNum", "w:abstractNum", "w:num", "w:num", "w:num"]);
        });
    });

    describe("lists that paragraphs give the definitions of", () => {
        it("should write each list once, in a document with no numbering option, with the paragraphs' list ids", async () => {
            const roman = { reference: "roman", levels: [{ level: 0, format: LevelFormat.UPPER_ROMAN, text: "%1." }] };
            const letters = { reference: "letters", levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: "%1)", start: 3 }] };
            const file = new File({
                sections: [
                    {
                        children: [
                            new Paragraph({ text: "One", numbering: { reference: roman, level: 0 } }),
                            new Paragraph({ text: "Two", numbering: { reference: roman, level: 0 } }),
                            new Table({
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [new Paragraph({ text: "Cell", numbering: { reference: letters, level: 0 } })],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });

            const zip = await JSZip.loadAsync(await Packer.toBuffer(file));
            const document = await zip.file("word/document.xml")!.async("text");
            const numbering = await zip.file("word/numbering.xml")!.async("text");

            expect([...document.matchAll(/<w:numId w:val="([^"]*)"\/>/g)].map(([, id]) => id)).to.deep.equal(["2", "2", "3"]);
            expect(numbering.split("<w:abstractNum ").length - 1).to.equal(3);
            expect(numbering).to.match(/<w:num w:numId="2"><w:abstractNumId w:val="\d+"\/>/);
            expect(numbering).to.contain('<w:numFmt w:val="upperRoman"/>');
            expect(numbering).to.contain('<w:lvlText w:val="%1)"/>');
            expect(numbering).to.contain('<w:startOverride w:val="3"/>');
        });

        it("should write the lists again when the document is packed again", async () => {
            const roman = { reference: "roman", levels: [{ level: 0, format: LevelFormat.UPPER_ROMAN, text: "%1." }] };
            const file = new File({
                sections: [{ children: [new Paragraph({ text: "One", numbering: { reference: roman, level: 0 } })] }],
            });

            const first = await (await JSZip.loadAsync(await Packer.toBuffer(file))).file("word/numbering.xml")!.async("text");
            const second = await (await JSZip.loadAsync(await Packer.toBuffer(file))).file("word/numbering.xml")!.async("text");

            expect(second).to.equal(first);
            expect(second.split("<w:abstractNum ").length - 1).to.equal(2);
        });
    });
});
