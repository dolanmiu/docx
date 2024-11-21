import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createLineNumberType } from "./line-number";

describe("createLineNumberType", () => {
    it("should work", () => {
        const textDirection = createLineNumberType({ countBy: 0, start: 0, restart: "newPage", distance: 10 });

        const tree = new Formatter().format(textDirection);
        expect(tree).to.deep.equal({
            "w:lnNumType": { _attr: { "w:countBy": 0, "w:start": 0, "w:restart": "newPage", "w:distance": 10 } },
        });
    });

    it("should work with string measures for distance", () => {
        const textDirection = createLineNumberType({ countBy: 0, start: 0, restart: "newPage", distance: "10mm" });

        const tree = new Formatter().format(textDirection);
        expect(tree).to.deep.equal({
            "w:lnNumType": { _attr: { "w:countBy": 0, "w:start": 0, "w:restart": "newPage", "w:distance": "10mm" } },
        });
    });

    it("should work with blank entries", () => {
        const textDirection = createLineNumberType({});

        const tree = new Formatter().format(textDirection);
        expect(tree).to.deep.equal({
            "w:lnNumType": { _attr: {} },
        });
    });
});
