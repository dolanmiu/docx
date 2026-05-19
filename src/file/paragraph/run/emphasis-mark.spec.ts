import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createDotEmphasisMark, createEmphasisMark } from "./emphasis-mark";

describe("createEmphasisMark", () => {
    it("should create a new EmphasisMark element with w:em as the rootKey", () => {
        const emphasisMark = createEmphasisMark();
        const tree = new Formatter().format(emphasisMark);
        expect(tree).to.deep.equal({
            "w:em": { _attr: { "w:val": "dot" } },
        });
    });
});

describe("createDotEmphasisMark", () => {
    it("should put value in attribute", () => {
        const emphasisMark = createDotEmphasisMark();
        const tree = new Formatter().format(emphasisMark);
        expect(tree).to.deep.equal({
            "w:em": { _attr: { "w:val": "dot" } },
        });
    });
});
