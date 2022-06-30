import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathSubScriptHide } from "./math-sub-script-hide";

describe("MathSubScriptHide", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScriptHide with correct root key", () => {
            const mathSubScriptHide = new MathSubScriptHide();

            const tree = new Formatter().format(mathSubScriptHide);
            expect(tree).to.deep.equal({
                "m:subHide": {
                    _attr: {
                        "m:val": 1,
                    },
                },
            });
        });
    });
});
