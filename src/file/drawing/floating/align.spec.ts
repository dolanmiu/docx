import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { VerticalPositionAlign } from "@file/shared/alignment";

import { createAlign } from "./align";

describe("Align", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(createAlign(VerticalPositionAlign.CENTER));
            expect(tree).to.deep.equal({
                "wp:align": ["center"],
            });
        });
    });
});
