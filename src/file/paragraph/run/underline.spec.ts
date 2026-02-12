import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { UnderlineType, createUnderline } from "./underline";

describe("createUnderline", () => {
    it("should create a new Underline element with w:u as the rootKey", () => {
        const underline = createUnderline();
        const tree = new Formatter().format(underline);
        expect(tree).to.deep.equal({
            "w:u": {
                _attr: {
                    "w:val": "single",
                },
            },
        });
    });

    it("should default to 'single' and no color", () => {
        const underline = createUnderline();
        const tree = new Formatter().format(underline);
        expect(tree).to.deep.equal({
            "w:u": { _attr: { "w:val": "single" } },
        });
    });

    it("should use the given style type and color", () => {
        const underline = createUnderline(UnderlineType.DOUBLE, "FF00CC");
        const tree = new Formatter().format(underline);
        expect(tree).to.deep.equal({
            "w:u": { _attr: { "w:val": "double", "w:color": "FF00CC" } },
        });
    });
});
