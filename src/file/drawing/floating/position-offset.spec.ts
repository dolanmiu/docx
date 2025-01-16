import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createPositionOffset } from "./position-offset";

describe("createPositionOffset", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(createPositionOffset(50));
            expect(tree).to.deep.equal({
                "wp:posOffset": ["50"],
            });
        });
    });
});
