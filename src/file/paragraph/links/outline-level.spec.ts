import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { OutlineLevel } from "./outline-level";

describe("ParagraphOutlineLevel", () => {
    let outlineLevel: OutlineLevel;

    describe("#constructor()", () => {
        it("should create an outlineLevel with given value", () => {
            outlineLevel = new OutlineLevel(0);
            const tree = new Formatter().format(outlineLevel);
            expect(tree).to.deep.equal({
                "w:outlineLvl": {
                    _attr: {
                        "w:val": 0,
                    },
                },
            });
        });
    });
});
