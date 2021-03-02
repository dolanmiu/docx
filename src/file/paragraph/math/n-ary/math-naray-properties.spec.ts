import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathNArayProperties } from "./math-naray-properties";

describe("MathNArayProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathNArayProperties with correct root key", () => {
            const mathNArayProperties = new MathNArayProperties("∑", true, true);

            const tree = new Formatter().format(mathNArayProperties);
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
            const mathNArayProperties = new MathNArayProperties("∑", false, true);

            const tree = new Formatter().format(mathNArayProperties);
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
            const mathNArayProperties = new MathNArayProperties("∑", true, false);

            const tree = new Formatter().format(mathNArayProperties);
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
            const mathNArayProperties = new MathNArayProperties("∑", false, false);

            const tree = new Formatter().format(mathNArayProperties);
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
