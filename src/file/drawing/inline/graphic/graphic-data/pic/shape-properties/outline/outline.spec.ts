import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createOutline } from "./outline";
import { SchemeColor } from "./scheme-color";

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

    it("should create solid rgb fill", () => {
        const tree = new Formatter().format(createOutline({ type: "solidFill", solidFillType: "rgb", value: "FFFFFF" }));
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

    it("should create solid scheme fill", () => {
        const tree = new Formatter().format(createOutline({ type: "solidFill", solidFillType: "scheme", value: SchemeColor.ACCENT1 }));
        expect(tree).to.deep.equal({
            "a:ln": [
                {
                    _attr: {},
                },
                {
                    "a:solidFill": [
                        {
                            "a:schemeClr": {
                                _attr: {
                                    val: "accent1",
                                },
                            },
                        },
                    ],
                },
            ],
        });
    });

    it("should write the OOXML values for cap, compound line and alignment", () => {
        const tree = new Formatter().format(
            createOutline({ type: "noFill", width: 12700, cap: "ROUND", compoundLine: "THICK_THIN", align: "INSET" }),
        );
        expect(tree).to.deep.equal({
            "a:ln": [
                {
                    _attr: {
                        w: 12700,
                        cap: "rnd",
                        cmpd: "thickThin",
                        algn: "in",
                    },
                },
                {
                    "a:noFill": {},
                },
            ],
        });
    });
});
