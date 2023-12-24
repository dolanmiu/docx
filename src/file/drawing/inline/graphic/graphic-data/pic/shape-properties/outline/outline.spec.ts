import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createOutline } from "./outline";

describe("createOutline", () => {
    it("should create no fill", () => {
        const tree = new Formatter().format(createOutline({ type: "noFill" }));
        expect(tree).to.deep.equal({
            "a:ln": [
                {
                    _attr: {},
                },
                {
                    "a:noFill": {},
                },
            ],
        });
    });

    it("should create solid fill", () => {
        const tree = new Formatter().format(createOutline({ type: "solidFill", color: "FFFFFF" }));
        expect(tree).to.deep.equal({
            "a:ln": [
                {
                    _attr: {},
                },
                {
                    "a:solidFill": [
                        {
                            "a:srgbClr": {
                                _attr: {
                                    val: "FFFFFF",
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });
});
