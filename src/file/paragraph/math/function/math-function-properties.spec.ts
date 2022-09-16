import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathFunctionProperties } from "./math-function-properties";

describe("MathFunctionProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathFunctionProperties with correct root key", () => {
            const mathFunctionProperties = new MathFunctionProperties();

            const tree = new Formatter().format(mathFunctionProperties);
            expect(tree).to.deep.equal({
                "m:funcPr": {},
            });
        });
    });
});
