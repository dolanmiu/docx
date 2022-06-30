import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { MathPreSubSuperScriptProperties } from "./math-pre-sub-super-script-function-properties";

describe("MathPreSubSuperScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathPreSubSuperScriptProperties with correct root key", () => {
            const mathPreSubSuperScriptProperties = new MathPreSubSuperScriptProperties();

            const tree = new Formatter().format(mathPreSubSuperScriptProperties);
            expect(tree).to.deep.equal({
                "m:sPrePr": {},
            });
        });
    });
});
