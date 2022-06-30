import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { MathSubScriptProperties } from "./math-sub-script-function-properties";

describe("MathSubScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScriptProperties with correct root key", () => {
            const mathSubScriptProperties = new MathSubScriptProperties();

            const tree = new Formatter().format(mathSubScriptProperties);
            expect(tree).to.deep.equal({
                "m:sSubPr": {},
            });
        });
    });
});
