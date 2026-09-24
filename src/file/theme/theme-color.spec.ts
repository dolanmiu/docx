import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import type { IContext } from "@file/xml-components";

import { Theme } from "./theme";
import { COLOR_ATTRIBUTES, type ColorOption, createColorElement } from "./theme-color";

const format = (color: ColorOption | undefined, context?: IContext): Record<string, unknown> =>
    new Formatter().format(createColorElement("w:color", [{ keys: { ...COLOR_ATTRIBUTES, color: "w:val" }, color }]), context)["w:color"]
        ._attr as Record<string, unknown>;

// A document whose theme has colors of its own
const contextWithTheme = (theme: Theme): IContext => ({ file: { Theme: theme }, stack: [] }) as unknown as IContext;

describe("createColorElement", () => {
    it("should write a hex color as it did before theme colors", () => {
        expect(format("FF0000")).to.deep.equal({ "w:val": "FF0000" });
        expect(format("#1F4E79")).to.deep.equal({ "w:val": "1F4E79" });
        expect(format("auto")).to.deep.equal({ "w:val": "auto" });
        expect(format(undefined)).to.deep.equal({});
    });

    it("should write the other attributes in the order given, around the color's", () => {
        const tree = new Formatter().format(
            createColorElement("w:top", [
                { key: "w:val", value: "single" },
                { keys: COLOR_ATTRIBUTES, color: { theme: "accent1", darker: 25 } },
                { key: "w:sz", value: 4 },
                { key: "w:space", value: undefined },
            ]),
        );
        expect(Object.keys(tree["w:top"]._attr)).to.deep.equal(["w:val", "w:color", "w:themeColor", "w:themeShade", "w:sz"]);
    });

    it("should write a theme color with the color it comes to in Office's theme", () => {
        expect(format({ theme: "accent1" })).to.deep.equal({ "w:val": "4472C4", "w:themeColor": "accent1" });
        // The system's window text and window colors
        expect(format({ theme: "dark1" })).to.deep.equal({ "w:val": "000000", "w:themeColor": "dark1" });
        expect(format({ theme: "followedHyperlink" })).to.deep.equal({ "w:val": "954F72", "w:themeColor": "followedHyperlink" });
    });

    it("should make a theme color lighter or darker as Word's color menus do", () => {
        // The colors Word writes for "Blue, Accent 1" and its lighter and darker versions. For some other colors, the hex
        // color is one or two off Word's in a channel, such as 366091 for Office 2007's accent 1, darker 25%, where Word
        // writes 365F91
        expect(format({ theme: "accent1", lighter: 80 })).to.deep.equal({
            "w:val": "D9E2F3",
            "w:themeColor": "accent1",
            "w:themeTint": "33",
        });
        expect(format({ theme: "accent1", lighter: 60 })).to.deep.equal({
            "w:val": "B4C6E7",
            "w:themeColor": "accent1",
            "w:themeTint": "66",
        });
        expect(format({ theme: "accent1", lighter: 40 })).to.deep.equal({
            "w:val": "8EAADB",
            "w:themeColor": "accent1",
            "w:themeTint": "99",
        });
        expect(format({ theme: "accent1", darker: 25 })).to.deep.equal({
            "w:val": "2F5496",
            "w:themeColor": "accent1",
            "w:themeShade": "BF",
        });
        expect(format({ theme: "accent1", darker: 50 })).to.deep.equal({
            "w:val": "1F3864",
            "w:themeColor": "accent1",
            "w:themeShade": "80",
        });
        // And for black and white
        expect(format({ theme: "dark1", lighter: 50 })).to.deep.equal({ "w:val": "7F7F7F", "w:themeColor": "dark1", "w:themeTint": "80" });
        expect(format({ theme: "dark1", lighter: 35 })).to.deep.equal({ "w:val": "595959", "w:themeColor": "dark1", "w:themeTint": "A6" });
        expect(format({ theme: "light1", darker: 5 })).to.deep.equal({ "w:val": "F2F2F2", "w:themeColor": "light1", "w:themeShade": "F2" });
        expect(format({ theme: "light1", darker: 15 })).to.deep.equal({
            "w:val": "D9D9D9",
            "w:themeColor": "light1",
            "w:themeShade": "D9",
        });
    });

    it("should keep the hue of colors all round the color wheel", () => {
        const theme = new Theme({
            colors: {
                accent1: "ED7D31",
                accent2: "FFC000",
                accent3: "70AD47",
                accent4: "3D9970",
                accent5: "5B9BD5",
                accent6: "6C5B7B",
                hyperlink: "C62D8A",
            },
        });
        const context = contextWithTheme(theme);
        const lighter = (["accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hyperlink"] as const).map(
            (name) => format({ theme: name, lighter: 50 }, context)["w:val"],
        );
        // As Python's colorsys works them out, rounded down
        expect(lighter).to.deep.equal(["F5BD97", "FFDF7F", "B6D8A0", "94D4B8", "ACCCE9", "B5A9BF", "E691C5"]);
    });

    it("should leave out a change of 0, and go all the way to white or black at 100", () => {
        expect(format({ theme: "accent2", lighter: 0 })).to.deep.equal({ "w:val": "ED7D31", "w:themeColor": "accent2" });
        expect(format({ theme: "accent2", darker: 0 })).to.deep.equal({ "w:val": "ED7D31", "w:themeColor": "accent2" });
        expect(format({ theme: "accent2", lighter: 100 })).to.deep.equal({
            "w:val": "FFFFFF",
            "w:themeColor": "accent2",
            "w:themeTint": "00",
        });
        expect(format({ theme: "accent2", darker: 100 })).to.deep.equal({
            "w:val": "000000",
            "w:themeColor": "accent2",
            "w:themeShade": "00",
        });
    });

    it("should write the color a theme color comes to in the document's theme", () => {
        const context = contextWithTheme(new Theme({ colors: { accent1: "#2E7D32", dark1: "1B1B1B" } }));
        expect(format({ theme: "accent1" }, context)).to.deep.equal({ "w:val": "2E7D32", "w:themeColor": "accent1" });
        expect(format({ theme: "dark1" }, context)).to.deep.equal({ "w:val": "1B1B1B", "w:themeColor": "dark1" });
        // Colors the theme doesn't give are Office's
        expect(format({ theme: "accent2" }, context)).to.deep.equal({ "w:val": "ED7D31", "w:themeColor": "accent2" });
    });

    it("should throw when the element is created, for a color that isn't valid", () => {
        const create = (color: ColorOption) => () => createColorElement("w:color", [{ keys: COLOR_ATTRIBUTES, color }]);
        expect(create("red")).to.throw("Invalid hex value 'red'");
        expect(create({ theme: "accent7" as "accent1" })).to.throw('Invalid theme color "accent7". Expected one of dark1, light1, dark2');
        expect(create({ theme: "toString" as "accent1" })).to.throw('Invalid theme color "toString". Expected one of');
        // DrawingML's names, and the names Word's color menus give the dark and light colors
        expect(create({ theme: "hlink" as "accent1" })).to.throw('Invalid theme color "hlink". Did you mean "hyperlink"?');
        expect(create({ theme: "text1" as "accent1" })).to.throw('Did you mean "dark1"?');
        expect(create({ theme: "background2" as "accent1" })).to.throw('Did you mean "light2"?');
        expect(create({ theme: "accent1", lighter: 20, darker: 20 })).to.throw("Expected lighter or darker, not both");
        expect(create({ theme: "accent1", lighter: 120 })).to.throw("Invalid lighter 120. Expected a number from 0 to 100");
        expect(create({ theme: "accent1", darker: -5 })).to.throw("Invalid darker -5");
        expect(create({ theme: "accent1", darker: Number.NaN })).to.throw("Invalid darker NaN");
    });
});
