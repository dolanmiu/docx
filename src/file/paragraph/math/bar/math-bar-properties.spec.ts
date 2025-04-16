import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathBarProperties } from "./math-bar-properties";

describe("MathBarProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathBarProperties with top key", () => {
            const mathBarProperties = createMathBarProperties({ type: "top" });

            const tree = new Formatter().format(mathBarProperties);

            expect(tree).to.deep.equal({
                "m:barPr": [
                    {
                        "m:pos": {
                            _attr: {
                                "w:val": "top",
                            },
                        },
                    },
                ],
            });
        });
        it("should create a MathBarProperties with bottom key", () => {
            const mathBarProperties = createMathBarProperties({ type: "bot" });

            const tree = new Formatter().format(mathBarProperties);

            expect(tree).to.deep.equal({
                "m:barPr": [
                    {
                        "m:pos": {
                            _attr: {
                                "w:val": "bot",
                            },
                        },
                    },
                ],
            });
        });
    });
});
