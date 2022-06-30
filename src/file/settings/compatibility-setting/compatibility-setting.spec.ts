import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { CompatibilitySetting } from "./compatibility-setting";

describe("CompatibilitySetting", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const compatibilitySetting = new CompatibilitySetting(15);

            const tree = new Formatter().format(compatibilitySetting);
            expect(tree).to.deep.equal({
                "w:compatSetting": {
                    _attr: {
                        "w:name": "compatibilityMode",
                        "w:uri": "http://schemas.microsoft.com/office/word",
                        "w:val": 15,
                    },
                },
            });
        });
    });
});
