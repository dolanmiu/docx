import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathBracketProperties } from "./math-bracket-properties";

describe("MathBracketProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathBracketProperties with correct root key", () => {
            const mathBracketProperties = new MathBracketProperties();

            const tree = new Formatter().format(mathBracketProperties);
            expect(tree).to.deep.equal({
                "m:dPr": {},
            });
        });

        it("should create a MathBracketProperties with correct root key and add brackets", () => {
            const mathBracketProperties = new MathBracketProperties({
                beginningCharacter: "[",
                endingCharacter: "]",
            });

            const tree = new Formatter().format(mathBracketProperties);
            expect(tree).to.deep.equal({
                "m:dPr": [
                    {
                        "m:begChr": {
                            _attr: {
                                "m:val": "[",
                            },
                        },
                    },
                    {
                        "m:endChr": {
                            _attr: {
                                "m:val": "]",
                            },
                        },
                    },
                ],
            });
        });
    });
});
