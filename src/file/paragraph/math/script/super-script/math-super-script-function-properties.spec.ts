import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { MathSuperScriptProperties } from "./math-super-script-function-properties";

describe("MathSuperScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScriptProperties with correct root key", () => {
            const mathSuperScriptProperties = new MathSuperScriptProperties();

            const tree = new Formatter().format(mathSuperScriptProperties);
            expect(tree).to.deep.equal({
                "m:sSupPr": {},
            });
        });
    });
});
