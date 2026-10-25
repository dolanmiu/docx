// cspell:ignore メイリオ SAVON
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Theme } from "@file/theme";
import { Document, type IThemeFontsOptions, Packer } from "docx";

import { ColorSchemes } from "./color-schemes";
import { FontSchemes } from "./font-schemes";
import { readTheme } from "./read-theme";
import { Themes } from "./themes";

type Tree = readonly Record<string, unknown>[];

// The Latin font of each of a theme's fonts, as the theme is written
const writtenLatinFonts = (theme: Theme): readonly unknown[] => {
    const [, fonts] = (new Formatter().format(theme)["a:theme"] as Tree)[1]["a:themeElements"] as Tree;
    return (fonts["a:fontScheme"] as Tree)
        .slice(1)
        .map(
            (collection) =>
                ((Object.values(collection)[0] as Tree)[0]["a:latin"] as { readonly _attr: { readonly typeface: string } })._attr.typeface,
        );
};

const latinFonts = (fonts: IThemeFontsOptions): readonly unknown[] =>
    [fonts.headings, fonts.body].map((font) => (typeof font === "string" ? font : font?.latin));

describe("Themes", () => {
    it("should have each of Word's themes, with Office's first, as Word's Design > Themes gallery has them", () => {
        expect(Object.keys(Themes)).to.deep.equal([
            "OFFICE",
            "OFFICE_2013_2022",
            "ATLAS",
            "BADGE",
            "BERLIN",
            "CELESTIAL",
            "CROP",
            "DEPTH",
            "DROPLET",
            "FACET",
            "FEATHERED",
            "GALLERY",
            "HEADLINES",
            "INTEGRAL",
            "ION",
            "ION_BOARDROOM",
            "MADISON",
            "MAIN_EVENT",
            "MESH",
            "ORGANIC",
            "PARALLAX",
            "PARCEL",
            "RETROSPECT",
            "SAVON",
            "SLICE",
            "VAPOR_TRAIL",
            "VIEW",
            "WISP",
            "WOOD_TYPE",
        ]);
    });

    it("should write each theme with its colors and fonts", () => {
        for (const options of Object.values(Themes)) {
            const theme = new Theme(options);
            expect(theme.Colors).to.deep.include(options.colors);
            expect(writtenLatinFonts(theme)).to.deep.equal(latinFonts(options.fonts));
        }
    });

    it("should write Word's Facet theme as Word has it, with its own fonts for other scripts", async () => {
        const facet = readTheme(await Packer.toBuffer(new Document({ theme: Themes.FACET, sections: [] })));
        expect(facet.name).to.equal("Facet");
        expect(facet.colors).to.deep.equal({
            dark2: "2C3C43",
            light2: "EBEBEB",
            accent1: "90C226",
            accent2: "54A021",
            accent3: "E6B91E",
            accent4: "E76618",
            accent5: "C42F1A",
            accent6: "918655",
            hyperlink: "99CA3C",
            followedHyperlink: "B9D181",
        });
        expect(facet.fonts?.headings).to.deep.include({ latin: "Trebuchet MS" });
        // Facet's font for Japanese text, in place of Office's
        expect(facet.fonts?.headings).to.have.nested.property("scripts.Jpan", "メイリオ");
        expect(facet.fonts?.body).to.have.nested.property("scripts.Jpan", "メイリオ");
    });
});

describe("ColorSchemes", () => {
    it("should have the colors of Word's Design > Colors gallery, with Office's first", () => {
        expect(Object.keys(ColorSchemes)).to.have.length(24);
        expect(Object.keys(ColorSchemes).slice(0, 4)).to.deep.equal(["OFFICE", "OFFICE_2013_2022", "OFFICE_2007_2010", "ASPECT"]);
        expect(ColorSchemes.OFFICE).to.deep.equal(Themes.OFFICE.colors);
        expect(ColorSchemes.BLUE_GREEN).to.deep.include({ accent1: "3494BA", accent6: "2683C6" });
    });

    it("should write each set of colors, with the system's window text and window colors where it has them", () => {
        for (const colors of Object.values(ColorSchemes)) {
            expect(new Theme({ colors }).Colors).to.deep.equal({ dark1: "000000", light1: "FFFFFF", ...colors });
        }
    });
});

describe("FontSchemes", () => {
    it("should have the fonts of Word's Design > Fonts gallery, with Office's first", () => {
        expect(Object.keys(FontSchemes)).to.have.length(26);
        expect(Object.keys(FontSchemes).slice(0, 4)).to.deep.equal(["OFFICE", "OFFICE_2013_2022", "OFFICE_2007_2010", "ARIAL"]);
        expect(FontSchemes.OFFICE).to.deep.equal(Themes.OFFICE.fonts);
        expect(latinFonts(FontSchemes.OFFICE_2007_2010)).to.deep.equal(["Cambria", "Calibri"]);
        expect(latinFonts(FontSchemes.GEORGIA)).to.deep.equal(["Georgia", "Georgia"]);
    });

    it("should write each set of fonts", () => {
        for (const fonts of Object.values(FontSchemes)) {
            expect(writtenLatinFonts(new Theme({ fonts }))).to.deep.equal(latinFonts(fonts));
        }
    });
});
