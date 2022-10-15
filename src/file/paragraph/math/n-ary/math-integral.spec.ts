import { expect } from "chai";

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
                                        "m:val": "undOvr",
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

        it("should create a MathIntegral with correct root key without sub-script and super-scripts", () => {
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
                                        "m:val": "undOvr",
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
                            {
                                "m:subHide": {
                                    _attr: {
                                        "m:val": 1,
                                    },
                                },
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
    });
});
