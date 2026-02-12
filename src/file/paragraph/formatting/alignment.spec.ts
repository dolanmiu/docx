import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { AlignmentType, createAlignment } from "./alignment";

describe("Alignment", () => {
    it("should create", () => {
        const alignment = createAlignment(AlignmentType.BOTH);
        const tree = new Formatter().format(alignment);

        expect(tree).to.deep.equal({
            "w:jc": {
                _attr: {
                    "w:val": "both",
                },
            },
        });
    });
});
