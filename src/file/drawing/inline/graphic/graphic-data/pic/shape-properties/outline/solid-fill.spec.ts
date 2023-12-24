import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createSolidFill } from "./solid-fill";

describe("createSolidFill", () => {
    it("should create", () => {
        const tree = new Formatter().format(createSolidFill({ rgbColor: "FFFFFF" }));
        expect(tree).to.deep.equal({
            "a:solidFill": [
                {
                    "a:srgbClr": {
                        _attr: {
                            val: "FFFFFF",
                        },
                    },
                },
            ],
        });
    });
});
