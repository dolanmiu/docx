import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathFraction } from "./math-fraction";

describe("MathFraction", () => {
    describe("#constructor()", () => {
        it("should create a MathFraction with correct root key", () => {
            const mathFraction = new MathFraction({
                numerator: [new MathRun("2")],
                denominator: [new MathRun("2")],
            });
            const tree = new Formatter().format(mathFraction);
            expect(tree).to.deep.equal({
                "m:f": [
                    {
                        "m:num": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["2"],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "m:den": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["2"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it.each([
            ["stacked", "bar"],
            ["skewed", "skw"],
            ["linear", "lin"],
            ["noBar", "noBar"],
        ] as const)("writes a %s fraction with m:type %s", (type, value) => {
            const tree = new Formatter().format(new MathFraction({ numerator: [new MathRun("a")], denominator: [new MathRun("b")], type }));
            expect(tree).to.deep.equal({
                "m:f": [
                    { "m:fPr": [{ "m:type": { _attr: { "m:val": value } } }] },
                    { "m:num": [{ "m:r": [{ "m:t": ["a"] }] }] },
                    { "m:den": [{ "m:r": [{ "m:t": ["b"] }] }] },
                ],
            });
        });

        it("throws for a type it doesn't know, for code that isn't type checked", () => {
            // @ts-expect-error -- not a type
            expect(() => new MathFraction({ numerator: [], denominator: [], type: "lin" })).toThrow(
                'MathFraction: type is "lin", which isn\'t one of stacked, skewed, linear, noBar',
            );
        });
    });
});
