import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathIntegral } from "./math-integral";

describe("MathIntegral", () => {
    describe("#constructor()", () => {
        it("should create a MathIntegral with correct root key", () => {
            const mathIntegral = new MathIntegral({
                children: [new MathRun("1")],
                subScript: [new MathRun("2")],
                superScript: [new MathRun("3")],
            });

            const tree = new Formatter().format(mathIntegral);
            expect(tree).to.deep.equal({
                "m:nary": [
                    {
                        "m:naryPr": [
                            {
                                "m:limLoc": {
                                    _attr: {
                                        "m:val": "subSup",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "m:sub": [
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
                        "m:sup": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["3"],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["1"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should hide both limits, and still write them empty, without sub-script and super-scripts", () => {
            const mathIntegral = new MathIntegral({
                children: [new MathRun("1")],
            });

            const tree = new Formatter().format(mathIntegral);
            expect(tree).to.deep.equal({
                "m:nary": [
                    {
                        "m:naryPr": [
                            {
                                "m:limLoc": {
                                    _attr: {
                                        "m:val": "subSup",
                                    },
                                },
                            },
                            {
                                "m:subHide": {
                                    _attr: {
                                        "m:val": 1,
                                    },
                                },
                            },
                            {
                                "m:supHide": {
                                    _attr: {
                                        "m:val": 1,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "m:sub": {},
                    },
                    {
                        "m:sup": {},
                    },
                    {
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["1"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it.each([
            ["aboveBelow", "undOvr"],
            ["side", "subSup"],
        ] as const)("puts the limits %s with m:limLoc %s", (limits, value) => {
            const tree = new Formatter().format(new MathIntegral({ children: [new MathRun("x")], subScript: [new MathRun("a")], limits }));
            expect(tree["m:nary"][0]["m:naryPr"]).toContainEqual({ "m:limLoc": { _attr: { "m:val": value } } });
        });

        it("throws for limits it doesn't know, for code that isn't type checked", () => {
            // @ts-expect-error -- not a position
            expect(() => new MathIntegral({ children: [], limits: "undOvr" })).toThrow(
                'MathIntegral: limits is "undOvr", which isn\'t one of aboveBelow, side',
            );
        });
    });
});
