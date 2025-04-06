import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathSubScriptProperties } from "./math-sub-script-function-properties";

describe("createMathSubScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScriptProperties with correct root key", () => {
            const mathSubScriptProperties = createMathSubScriptProperties();

            const tree = new Formatter().format(mathSubScriptProperties);
            expect(tree).to.deep.equal({
                "m:sSubPr": {},
            });
        });
    });
});
