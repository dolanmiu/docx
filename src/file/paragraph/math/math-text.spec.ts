import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathText } from "./math-text";

describe("MathText", () => {
    describe("#constructor()", () => {
        it("should create a MathText with correct root key", () => {
            const mathText = new MathText("2+2");
            const tree = new Formatter().format(mathText);
            expect(tree).to.deep.equal({
                "m:t": ["2+2"],
            });
        });
    });
});
