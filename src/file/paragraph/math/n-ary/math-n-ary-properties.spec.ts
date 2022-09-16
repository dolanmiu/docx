import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathNAryProperties } from "./math-n-ary-properties";

describe("MathNAryProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathNAryProperties with correct root key", () => {
            const mathNAryProperties = new MathNAryProperties("∑", true, true);

            const tree = new Formatter().format(mathNAryProperties);
            expect(tree).to.deep.equal({
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
            });
        });

        it("should add super-script hide attributes", () => {
            const mathNAryProperties = new MathNAryProperties("∑", false, true);

            const tree = new Formatter().format(mathNAryProperties);
            expect(tree).to.deep.equal({
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
                ],
            });
        });

        it("should add sub-script hide attributes", () => {
            const mathNAryProperties = new MathNAryProperties("∑", true, false);

            const tree = new Formatter().format(mathNAryProperties);
            expect(tree).to.deep.equal({
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
                        "m:subHide": {
                            _attr: {
                                "m:val": 1,
                            },
                        },
                    },
                ],
            });
        });

        it("should add both super-script and sub-script hide attributes", () => {
            const mathNAryProperties = new MathNAryProperties("∑", false, false);

            const tree = new Formatter().format(mathNAryProperties);
            expect(tree).to.deep.equal({
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
            });
        });
    });
});
