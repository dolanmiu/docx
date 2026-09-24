import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeColor } from "./shape-color";

describe("createShapeColor", () => {
    it("should create an RGB colour", () => {
        const tree = new Formatter().format(createShapeColor("1F4E79"));
        expect(tree).to.deep.equal({ "a:srgbClr": { _attr: { val: "1F4E79" } } });
    });

    it("should strip a leading #", () => {
        const tree = new Formatter().format(createShapeColor("#1F4E79"));
        expect(tree).to.deep.equal({ "a:srgbClr": { _attr: { val: "1F4E79" } } });
    });

    it("should write transparency as an alpha (opacity) in thousandths of a percent", () => {
        const tree = new Formatter().format(createShapeColor("1F4E79", 25));
        expect(tree).to.deep.equal({
            "a:srgbClr": [{ _attr: { val: "1F4E79" } }, { "a:alpha": { _attr: { val: 75000 } } }],
        });
    });

    it("should leave out the alpha when the transparency is 0", () => {
        const tree = new Formatter().format(createShapeColor("1F4E79", 0));
        expect(tree).to.deep.equal({ "a:srgbClr": { _attr: { val: "1F4E79" } } });
    });

    it("should reject auto and malformed colours", () => {
        expect(() => createShapeColor("auto")).to.throw("Invalid shape color 'auto'");
        expect(() => createShapeColor("red")).to.throw("Invalid hex value");
        expect(() => createShapeColor("FFF")).to.throw("Invalid hex value");
    });

    it("should reject a transparency outside 0 to 100", () => {
        expect(() => createShapeColor("000000", 101)).to.throw("Invalid transparency 101");
        expect(() => createShapeColor("000000", -1)).to.throw("Invalid transparency -1");
    });
});
