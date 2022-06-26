import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathRadical } from "./math-radical";

describe("MathRadical", () => {
    describe("#constructor()", () => {
        it("should create a MathRadical with correct root key", () => {
            const mathRadical = new MathRadical({
                children: [new MathRun("e")],
                degree: [new MathRun("2")],
            });

            const tree = new Formatter().format(mathRadical);
            expect(tree).to.deep.equal({
                "m:rad": [
                    {
                        "m:radPr": {},
                    },
                    {
                        "m:deg": [
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
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["e"],
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
