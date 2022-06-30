import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { MathSubSuperScriptProperties } from "./math-sub-super-script-function-properties";

describe("MathSubSuperScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathSubSuperScriptProperties with correct root key", () => {
            const mathSubSuperScriptProperties = new MathSubSuperScriptProperties();

            const tree = new Formatter().format(mathSubSuperScriptProperties);
            expect(tree).to.deep.equal({
                "m:sSubSupPr": {},
            });
        });
    });
});
