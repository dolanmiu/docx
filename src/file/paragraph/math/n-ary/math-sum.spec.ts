import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathSum } from "./math-sum";

describe("MathSum", () => {
    describe("#constructor()", () => {
        it("should create a MathSum with correct root key", () => {
            const mathSum = new MathSum({
                children: [new MathRun("1")],
                subScript: [new MathRun("2")],
                superScript: [new MathRun("3")],
            });

            const tree = new Formatter().format(mathSum);
            expect(tree).to.deep.equal({
                "m:nary": [
                    {
                        "m:naryPr": [
                            {
                                "m:chr": {
                                    _attr: {
                                        "m:val": "∑",
                                    },
                                },
                            },
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

        it("should add a hide when there is no subScript or superScript", () => {
            const mathSum = new MathSum({
                children: [new MathRun("1")],
            });

            const tree = new Formatter().format(mathSum);
            expect(tree).to.deep.equal({
                "m:nary": [
                    {
                        "m:naryPr": [
                            {
                                "m:chr": {
                                    _attr: {
                                        "m:val": "∑",
                                    },
                                },
                            },
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
