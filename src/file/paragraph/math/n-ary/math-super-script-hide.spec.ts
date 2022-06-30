import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathSuperScriptHide } from "./math-super-script-hide";

describe("MathSuperScriptHide", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScriptHide with correct root key", () => {
            const mathSuperScriptHide = new MathSuperScriptHide();

            const tree = new Formatter().format(mathSuperScriptHide);
            expect(tree).to.deep.equal({
                "m:supHide": {
                    _attr: {
                        "m:val": 1,
                    },
                },
            });
        });
    });
});
