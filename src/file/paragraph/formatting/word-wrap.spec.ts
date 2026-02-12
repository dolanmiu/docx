import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createWordWrap } from "./word-wrap";

describe("WordWrap", () => {
    it("should create", () => {
        const wordWrap = createWordWrap();
        const tree = new Formatter().format(wordWrap);

        expect(tree).to.deep.equal({
            "w:wordWrap": {
                _attr: {
                    "w:val": 0,
                },
            },
        });
    });
});
