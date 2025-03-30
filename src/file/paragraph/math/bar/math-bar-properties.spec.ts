import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathBarProperties } from "./math-bar-properties";
describe("MathBarProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathBarProperties with top key", () => {
            const mathBarProperties = new MathBarProperties("top");

            const tree = new Formatter().format(mathBarProperties);

            expect(tree).to.deep.equal({
                "m:barPr": [
                    {
                        "m:pos": {
                            _attr: {
                                "m:val": "top",
                            },
                        },
                    },
                ],
            });
        });
        it("should create a MathBarProperties with bottom key", () => {
            const mathBarProperties = new MathBarProperties("bot");

            const tree = new Formatter().format(mathBarProperties);

            expect(tree).to.deep.equal({
                "m:barPr": [
                    {
                        "m:pos": {
                            _attr: {
                                "m:val": "bot",
                            },
                        },
                    },
                ],
            });
        });
    });
});
