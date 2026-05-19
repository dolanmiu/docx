import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createSpacing } from "./spacing";

describe("Spacing", () => {
    describe("#createSpacing", () => {
        it("should set the properties given", () => {
            const spacing = createSpacing({ before: 100, after: 120, line: 150 });
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:spacing": { _attr: { "w:after": 120, "w:before": 100, "w:line": 150 } },
            });
        });

        it("should only set the given properties", () => {
            const spacing = createSpacing({ before: 100 });
            const tree = new Formatter().format(spacing);
            expect(tree).to.deep.equal({
                "w:spacing": { _attr: { "w:before": 100 } },
            });
        });
    });
});
