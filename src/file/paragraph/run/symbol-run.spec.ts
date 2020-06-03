import { expect } from "chai";

import { EmphasisMarkType } from "./emphasis-mark";

import { Formatter } from "export/formatter";

import { UnderlineType } from "./underline";

import { SymbolRun } from "./symbol-run";

describe("SymbolRun", () => {
    let run: SymbolRun;

    describe("#constructor()", () => {
        it("should create symbol run from text input", () => {
            run = new SymbolRun("F071");
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:sym": { _attr: { "w:char": "F071", "w:font": "Wingdings" } } }],
            });
        });

        it("should create symbol run from object input with just 'char' specified", () => {
            run = new SymbolRun({ char: "F071" });
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:sym": { _attr: { "w:char": "F071", "w:font": "Wingdings" } } }],
            });
        });

        it("should create symbol run from object input with just 'char' specified", () => {
            run = new SymbolRun({ char: "F071", symbolfont: "Arial" });
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:sym": { _attr: { "w:char": "F071", "w:font": "Arial" } } }],
            });
        });

        it("should add other standard run properties", () => {
            run = new SymbolRun({
                char: "F071",
                symbolfont: "Arial",
                italics: true,
                bold: true,
                underline: {
                    color: "red",
                    type: UnderlineType.DOUBLE,
                },
                emphasisMark: {
                    type: EmphasisMarkType.DOT,
                },
                color: "green",
                size: 40,
                highlight: "yellow",
            });

            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [
                    {
                        "w:rPr": [
                            { "w:b": { _attr: { "w:val": true } } },
                            { "w:bCs": { _attr: { "w:val": true } } },
                            { "w:i": { _attr: { "w:val": true } } },
                            { "w:iCs": { _attr: { "w:val": true } } },
                            { "w:u": { _attr: { "w:val": "double", "w:color": "red" } } },
                            { "w:em": { _attr: { "w:val": "dot" } } },
                            { "w:color": { _attr: { "w:val": "green" } } },
                            { "w:sz": { _attr: { "w:val": 40 } } },
                            { "w:szCs": { _attr: { "w:val": 40 } } },
                            { "w:highlight": { _attr: { "w:val": "yellow" } } },
                            { "w:highlightCs": { _attr: { "w:val": "yellow" } } },
                        ],
                    },
                    {
                        "w:sym": { _attr: { "w:char": "F071", "w:font": "Arial" } },
                    },
                ],
            });
        });
    });
});
