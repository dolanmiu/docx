import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createSimplePos } from "./simple-pos";

describe("createSimplePos", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(createSimplePos());
            expect(tree).to.deep.equal({
                "wp:simplePos": {
                    _attr: {
                        x: 0,
                        y: 0,
                    },
                },
            });
        });
    });
});
