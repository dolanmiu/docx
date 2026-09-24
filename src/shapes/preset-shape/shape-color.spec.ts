// cspell:ignore hlink
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

    it("should write a colour of the document's theme by its OOXML name", () => {
        expect(new Formatter().format(createShapeColor({ theme: "accent1" }))).to.deep.equal({
            "a:schemeClr": { _attr: { val: "accent1" } },
        });
        expect(new Formatter().format(createShapeColor({ theme: "dark2" }))).to.deep.equal({ "a:schemeClr": { _attr: { val: "dk2" } } });
        expect(new Formatter().format(createShapeColor({ theme: "followedHyperlink" }))).to.deep.equal({
            "a:schemeClr": { _attr: { val: "folHlink" } },
        });
    });

    it("should make a theme colour lighter or darker as Word's colour menus do", () => {
        // "Lighter 40%" scales the luminance to 60% and adds 40%
        expect(new Formatter().format(createShapeColor({ theme: "accent1", lighter: 40 }))).to.deep.equal({
            "a:schemeClr": [
                { _attr: { val: "accent1" } },
                { "a:lumMod": { _attr: { val: 60000 } } },
                { "a:lumOff": { _attr: { val: 40000 } } },
            ],
        });
        // "Darker 25%" scales the luminance to 75%
        expect(new Formatter().format(createShapeColor({ theme: "accent1", darker: 25 }))).to.deep.equal({
            "a:schemeClr": [{ _attr: { val: "accent1" } }, { "a:lumMod": { _attr: { val: 75000 } } }],
        });
    });

    it("should write the transparency of a theme colour after its changes", () => {
        expect(new Formatter().format(createShapeColor({ theme: "light1", darker: 5 }, 30))).to.deep.equal({
            "a:schemeClr": [{ _attr: { val: "lt1" } }, { "a:lumMod": { _attr: { val: 95000 } } }, { "a:alpha": { _attr: { val: 70000 } } }],
        });
    });

    it("should reject a theme colour that isn't one, that is lighter and darker, or a change outside 0 to 100", () => {
        expect(() => createShapeColor({ theme: "accent7" as "accent1" })).to.throw(
            'Invalid theme colour "accent7". Expected one of dark1, light1',
        );
        expect(() => createShapeColor({ theme: "toString" as "accent1" })).to.throw('Invalid theme colour "toString"');
        // OOXML's names, and the names Word's colour menus give the dark and light colours
        expect(() => createShapeColor({ theme: "hlink" as "accent1" })).to.throw('Invalid theme colour "hlink". Did you mean "hyperlink"?');
        expect(() => createShapeColor({ theme: "text1" as "accent1" })).to.throw('Did you mean "dark1"?');
        expect(() => createShapeColor({ theme: "accent1", lighter: 20, darker: 20 })).to.throw("Expected lighter or darker, not both");
        expect(() => createShapeColor({ theme: "accent1", lighter: 120 })).to.throw("Invalid lighter 120");
        expect(() => createShapeColor({ theme: "accent1", darker: -5 })).to.throw("Invalid darker -5");
    });
});
