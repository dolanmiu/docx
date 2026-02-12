import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createSubScript, createSuperScript } from "./script";

describe("createSubScript", () => {
    it("should create a SubScript element with correct attributes", () => {
        const subScript = createSubScript();
        const tree = new Formatter().format(subScript);
        expect(tree).to.deep.equal({
            "w:vertAlign": { _attr: { "w:val": "subscript" } },
        });
    });
});

describe("createSuperScript", () => {
    it("should create a SuperScript element with correct attributes", () => {
        const superScript = createSuperScript();
        const tree = new Formatter().format(superScript);
        expect(tree).to.deep.equal({
            "w:vertAlign": { _attr: { "w:val": "superscript" } },
        });
    });
});
