import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { Theme } from "./theme";

type Tree = readonly Record<string, unknown>[];

const format = (theme: Theme): Tree => new Formatter().format(theme)["a:theme"];

const elements = (theme: Theme): { readonly colors: Tree; readonly fonts: Tree; readonly formats: Tree } => {
    const [colors, fonts, formats] = format(theme)[1]["a:themeElements"] as Tree;
    return {
        colors: colors["a:clrScheme"] as Tree,
        fonts: fonts["a:fontScheme"] as Tree,
        formats: formats["a:fmtScheme"] as Tree,
    };
};

const fontCollection = (fonts: Tree, name: "a:majorFont" | "a:minorFont"): Tree => fonts.find((child) => name in child)![name] as Tree;

describe("Theme", () => {
    it("should write Office's theme when given no options", () => {
        const theme = new Theme();
        const tree = format(theme);
        expect(tree[0]).to.deep.equal({
            _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main", name: "Office Theme" },
        });
        expect(tree.slice(2)).to.deep.equal([{ "a:objectDefaults": {} }, { "a:extraClrSchemeLst": {} }]);

        const { colors, fonts, formats } = elements(theme);
        expect(colors[0]).to.deep.equal({ _attr: { name: "Office" } });
        // The dark and light colors are the system's window text and window colors
        expect(colors[1]).to.deep.equal({ "a:dk1": [{ "a:sysClr": { _attr: { val: "windowText", lastClr: "000000" } } }] });
        expect(colors[2]).to.deep.equal({ "a:lt1": [{ "a:sysClr": { _attr: { val: "window", lastClr: "FFFFFF" } } }] });
        expect(colors.slice(3).map((color) => Object.keys(color)[0])).to.deep.equal([
            "a:dk2",
            "a:lt2",
            "a:accent1",
            "a:accent2",
            "a:accent3",
            "a:accent4",
            "a:accent5",
            "a:accent6",
            "a:hlink",
            "a:folHlink",
        ]);
        expect(colors[5]).to.deep.equal({ "a:accent1": [{ "a:srgbClr": { _attr: { val: "4472C4" } } }] });
        expect(colors[12]).to.deep.equal({ "a:folHlink": [{ "a:srgbClr": { _attr: { val: "954F72" } } }] });

        expect(fonts[0]).to.deep.equal({ _attr: { name: "Office" } });
        const headings = fontCollection(fonts, "a:majorFont");
        const body = fontCollection(fonts, "a:minorFont");
        expect(headings.slice(0, 4)).to.deep.equal([
            { "a:latin": { _attr: { typeface: "Calibri Light", panose: "020F0302020204030204" } } },
            { "a:ea": { _attr: { typeface: "" } } },
            { "a:cs": { _attr: { typeface: "" } } },
            { "a:font": { _attr: { script: "Jpan", typeface: "游ゴシック Light" } } },
        ]);
        expect(body[0]).to.deep.equal({ "a:latin": { _attr: { typeface: "Calibri", panose: "020F0502020204030204" } } });
        // Headings and body text have different fonts for some scripts, and the same for others
        expect(body[3]).to.deep.equal({ "a:font": { _attr: { script: "Jpan", typeface: "游明朝" } } });
        expect(body[4]).to.deep.equal(headings[4]);
        expect(headings).to.have.length(50);

        expect(formats[0]).to.deep.equal({ _attr: { name: "Office" } });
        // Three of each, from subtle to intense
        expect(formats.slice(1).map((list) => [Object.keys(list)[0], (Object.values(list)[0] as Tree).length])).to.deep.equal([
            ["a:fillStyleLst", 3],
            ["a:lnStyleLst", 3],
            ["a:effectStyleLst", 3],
            ["a:bgFillStyleLst", 3],
        ]);
    });

    it("should write the colors given in place of Office's, and name the colors after the theme", () => {
        const { colors, fonts } = elements(
            new Theme({ name: "Harbour", colors: { dark1: "#1B1B1B", light1: "FAFAFA", accent2: "c62828", followedHyperlink: "6A1B9A" } }),
        );
        expect(colors[0]).to.deep.equal({ _attr: { name: "Harbour" } });
        expect(colors[1]).to.deep.equal({ "a:dk1": [{ "a:srgbClr": { _attr: { val: "1B1B1B" } } }] });
        expect(colors[2]).to.deep.equal({ "a:lt1": [{ "a:srgbClr": { _attr: { val: "FAFAFA" } } }] });
        expect(colors[5]).to.deep.equal({ "a:accent1": [{ "a:srgbClr": { _attr: { val: "4472C4" } } }] });
        expect(colors[6]).to.deep.equal({ "a:accent2": [{ "a:srgbClr": { _attr: { val: "c62828" } } }] });
        expect(colors[12]).to.deep.equal({ "a:folHlink": [{ "a:srgbClr": { _attr: { val: "6A1B9A" } } }] });
        // The fonts are still Office's
        expect(fonts[0]).to.deep.equal({ _attr: { name: "Office" } });
    });

    it("should write the fonts given in place of Office's, without Office's font descriptions", () => {
        const { colors, fonts } = elements(
            new Theme({
                name: "Harbour",
                fonts: { headings: "Georgia", body: { latin: "Segoe UI", eastAsia: "Yu Gothic", complexScript: "Tahoma" } },
            }),
        );
        expect(colors[0]).to.deep.equal({ _attr: { name: "Office" } });
        expect(fonts[0]).to.deep.equal({ _attr: { name: "Harbour" } });
        expect(fontCollection(fonts, "a:majorFont").slice(0, 3)).to.deep.equal([
            { "a:latin": { _attr: { typeface: "Georgia" } } },
            { "a:ea": { _attr: { typeface: "" } } },
            { "a:cs": { _attr: { typeface: "" } } },
        ]);
        expect(fontCollection(fonts, "a:minorFont").slice(0, 3)).to.deep.equal([
            { "a:latin": { _attr: { typeface: "Segoe UI" } } },
            { "a:ea": { _attr: { typeface: "Yu Gothic" } } },
            { "a:cs": { _attr: { typeface: "Tahoma" } } },
        ]);
    });

    it("should keep Office's font for Latin text when only fonts for other scripts are given", () => {
        const { fonts } = elements(new Theme({ fonts: { headings: { eastAsia: "Yu Gothic Light" } } }));
        expect(fontCollection(fonts, "a:majorFont").slice(0, 2)).to.deep.equal([
            { "a:latin": { _attr: { typeface: "Calibri Light", panose: "020F0302020204030204" } } },
            { "a:ea": { _attr: { typeface: "Yu Gothic Light" } } },
        ]);
    });

    it("should throw for a color that isn't a hex color", () => {
        expect(() => new Theme({ colors: { accent1: "auto" } })).to.throw("Invalid theme color accent1 'auto'. Expected 6 digit hex value");
        expect(() => new Theme({ colors: { hyperlink: "blue" } })).to.throw();
    });
});
