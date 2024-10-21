import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { Relationships } from "./relationships";

describe("Relationships", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const properties = new Relationships();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["Relationships"]);
            expect(tree["Relationships"]).to.deep.equal({
                _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" },
            });
        });
    });
});
