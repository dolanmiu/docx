import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathNArayProperties } from "./math-naray-properties";

describe("MathNArayProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathNArayProperties with correct root key", () => {
            const mathNArayProperties = new MathNArayProperties("∑");

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
    });
});
