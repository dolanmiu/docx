import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createCompatibilitySetting } from "./compatibility-setting";

describe("createCompatibilitySetting", () => {
    it("creates a compatibility setting with version", () => {
        const compatibilitySetting = createCompatibilitySetting(15);

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
