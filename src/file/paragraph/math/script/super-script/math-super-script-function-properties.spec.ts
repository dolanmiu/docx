import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathSuperScriptProperties } from "./math-super-script-function-properties";

describe("createMathSuperScriptProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScriptProperties with correct root key", () => {
            const mathSuperScriptProperties = createMathSuperScriptProperties();

            const tree = new Formatter().format(mathSuperScriptProperties);
            expect(tree).to.deep.equal({
                "m:sSupPr": {},
            });
        });
    });
});
