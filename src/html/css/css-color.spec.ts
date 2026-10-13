// cspell:ignore oklab oklch rrggbb rrggbbaa gradians FFABCD BFBFFF FCFCFC
import { describe, expect, it } from "vitest";

import { type CssColor, parseColor, toHex } from "./css-color";

const rgba = (red: number, green: number, blue: number, alpha = 1): CssColor => ({ red, green, blue, alpha });

/** The colour the value is read as, as Word writes it, or "currentcolor" or undefined as parseColor gives them */
const hexOf = (value: string): string | undefined => {
    const color = parseColor(value);
    return typeof color === "object" ? toHex(color) : color;
};

/** The colour's channels, rounded to 4 decimal places, so the floating point arithmetic of the conversions doesn't matter */
const channelsOf = (value: string): readonly number[] | string | undefined => {
    const color = parseColor(value);
    return typeof color === "object"
        ? [color.red, color.green, color.blue, color.alpha].map((channel) => Math.round(channel * 10000) / 10000)
        : color;
};

/* cspell:disable */
// Each named colour and its hex, from the color-name package rather than from css-color.ts, to check it against
const NAMED_COLORS = `
    aliceblue F0F8FF antiquewhite FAEBD7 aqua 00FFFF aquamarine 7FFFD4 azure F0FFFF beige F5F5DC bisque FFE4C4 black 000000
    blanchedalmond FFEBCD blue 0000FF blueviolet 8A2BE2 brown A52A2A burlywood DEB887 cadetblue 5F9EA0 chartreuse 7FFF00
    chocolate D2691E coral FF7F50 cornflowerblue 6495ED cornsilk FFF8DC crimson DC143C cyan 00FFFF darkblue 00008B
    darkcyan 008B8B darkgoldenrod B8860B darkgray A9A9A9 darkgreen 006400 darkgrey A9A9A9 darkkhaki BDB76B darkmagenta 8B008B
    darkolivegreen 556B2F darkorange FF8C00 darkorchid 9932CC darkred 8B0000 darksalmon E9967A darkseagreen 8FBC8F
    darkslateblue 483D8B darkslategray 2F4F4F darkslategrey 2F4F4F darkturquoise 00CED1 darkviolet 9400D3 deeppink FF1493
    deepskyblue 00BFFF dimgray 696969 dimgrey 696969 dodgerblue 1E90FF firebrick B22222 floralwhite FFFAF0 forestgreen 228B22
    fuchsia FF00FF gainsboro DCDCDC ghostwhite F8F8FF gold FFD700 goldenrod DAA520 gray 808080 green 008000 greenyellow ADFF2F
    grey 808080 honeydew F0FFF0 hotpink FF69B4 indianred CD5C5C indigo 4B0082 ivory FFFFF0 khaki F0E68C lavender E6E6FA
    lavenderblush FFF0F5 lawngreen 7CFC00 lemonchiffon FFFACD lightblue ADD8E6 lightcoral F08080 lightcyan E0FFFF
    lightgoldenrodyellow FAFAD2 lightgray D3D3D3 lightgreen 90EE90 lightgrey D3D3D3 lightpink FFB6C1 lightsalmon FFA07A
    lightseagreen 20B2AA lightskyblue 87CEFA lightslategray 778899 lightslategrey 778899 lightsteelblue B0C4DE
    lightyellow FFFFE0 lime 00FF00 limegreen 32CD32 linen FAF0E6 magenta FF00FF maroon 800000 mediumaquamarine 66CDAA
    mediumblue 0000CD mediumorchid BA55D3 mediumpurple 9370DB mediumseagreen 3CB371 mediumslateblue 7B68EE
    mediumspringgreen 00FA9A mediumturquoise 48D1CC mediumvioletred C71585 midnightblue 191970 mintcream F5FFFA mistyrose FFE4E1
    moccasin FFE4B5 navajowhite FFDEAD navy 000080 oldlace FDF5E6 olive 808000 olivedrab 6B8E23 orange FFA500 orangered FF4500
    orchid DA70D6 palegoldenrod EEE8AA palegreen 98FB98 paleturquoise AFEEEE palevioletred DB7093 papayawhip FFEFD5
    peachpuff FFDAB9 peru CD853F pink FFC0CB plum DDA0DD powderblue B0E0E6 purple 800080 rebeccapurple 663399 red FF0000
    rosybrown BC8F8F royalblue 4169E1 saddlebrown 8B4513 salmon FA8072 sandybrown F4A460 seagreen 2E8B57 seashell FFF5EE
    sienna A0522D silver C0C0C0 skyblue 87CEEB slateblue 6A5ACD slategray 708090 slategrey 708090 snow FFFAFA springgreen 00FF7F
    steelblue 4682B4 tan D2B48C teal 008080 thistle D8BFD8 tomato FF6347 turquoise 40E0D0 violet EE82EE wheat F5DEB3
    white FFFFFF whitesmoke F5F5F5 yellow FFFF00 yellowgreen 9ACD32
`;
/* cspell:enable */

describe("parseColor", () => {
    describe("keywords", () => {
        it.each(["currentcolor", "currentColor", "CURRENTCOLOR", "  currentcolor\n"])(
            "reads %j as currentcolor, for the caller to resolve",
            (value) => {
                expect(parseColor(value)).toBe("currentcolor");
            },
        );

        it("reads transparent as black with an alpha of 0, in any case", () => {
            expect(parseColor("transparent")).toEqual(rgba(0, 0, 0, 0));
            expect(parseColor(" Transparent ")).toEqual(rgba(0, 0, 0, 0));
        });

        it.each(["inherit", "initial", "unset", "revert", "revert-layer"])("doesn't read the CSS-wide keyword %s as a colour", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });

        it.each(["Canvas", "CanvasText", "ButtonText", "Highlight", "LinkText"])(
            "doesn't read the system colour %s, which only a browser knows",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["", "   ", "\n\t"])("doesn't read the empty value %j", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });

    describe("hex", () => {
        it("reads #rgb, with each digit standing for itself twice", () => {
            expect(parseColor("#f80")).toEqual(rgba(255, 136, 0));
        });

        it("reads #rgba, with the alpha out of 255", () => {
            expect(parseColor("#f808")).toEqual(rgba(255, 136, 0, 0x88 / 255));
        });

        it("reads #rrggbb", () => {
            expect(parseColor("#12ab9f")).toEqual(rgba(0x12, 0xab, 0x9f));
        });

        it("reads #rrggbbaa, with the alpha out of 255", () => {
            expect(parseColor("#ff000080")).toEqual(rgba(255, 0, 0, 128 / 255));
            expect(parseColor("#00000000")).toEqual(rgba(0, 0, 0, 0));
            expect(parseColor("#000000ff")).toEqual(rgba(0, 0, 0, 1));
        });

        it("reads uppercase and mixed case digits", () => {
            expect(parseColor("#FFAA00")).toEqual(rgba(255, 170, 0));
            expect(parseColor("#fFaA00")).toEqual(rgba(255, 170, 0));
            expect(parseColor("#ABC")).toEqual(rgba(0xaa, 0xbb, 0xcc));
        });

        it("ignores whitespace around it", () => {
            expect(parseColor("  #ff0000\n")).toEqual(rgba(255, 0, 0));
        });

        it.each(["#", "#f", "#12", "#12345", "#1234567", "#123456789", "#1234567890"])(
            "doesn't read %s, which has a number of digits hex can't have",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["#ggg", "#12345g", "#ff 000", "# fff", "#fff f", "#-12", "#0x123"])(
            "doesn't read %j, which has a character that isn't a hex digit",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it("doesn't read hex digits without a #", () => {
            expect(parseColor("ff0000")).toBeUndefined();
        });
    });

    describe("named colours", () => {
        it("reads each of the 148 named colours as its hex", () => {
            const words = NAMED_COLORS.trim().split(/\s+/);
            const named = Array.from({ length: words.length / 2 }, (_, index) => [words[index * 2], words[index * 2 + 1]]);

            expect(named).toHaveLength(148);
            expect(named.map(([name]) => [name, hexOf(name)])).toEqual(named);
        });

        it("reads a named colour as its channels", () => {
            expect(parseColor("red")).toEqual(rgba(255, 0, 0));
            expect(parseColor("rebeccapurple")).toEqual(rgba(0x66, 0x33, 0x99));
        });

        it("reads both spellings of grey", () => {
            expect(hexOf("gray")).toBe("808080");
            expect(hexOf("grey")).toBe("808080");
            expect(hexOf("darkslategray")).toBe("2F4F4F");
            expect(hexOf("darkslategrey")).toBe("2F4F4F");
            expect(hexOf("lightgray")).toBe("D3D3D3");
            expect(hexOf("lightgrey")).toBe("D3D3D3");
        });

        it("reads names in any case, with whitespace around them", () => {
            expect(hexOf("RebeccaPurple")).toBe("663399");
            expect(hexOf("  CORNFLOWERBLUE\t")).toBe("6495ED");
        });

        it.each(["redd", "alice blue", "light-blue", "blue1", "crimson red"])("doesn't read %j, which isn't a named colour", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });

    describe("rgb() and rgba()", () => {
        it("reads the space-separated syntax", () => {
            expect(parseColor("rgb(255 128 0)")).toEqual(rgba(255, 128, 0));
        });

        it("reads the legacy comma-separated syntax", () => {
            expect(parseColor("rgb(255, 128, 0)")).toEqual(rgba(255, 128, 0));
            expect(parseColor("rgb(255,128,0)")).toEqual(rgba(255, 128, 0));
        });

        it("reads rgba() as rgb(), with or without an alpha", () => {
            expect(parseColor("rgba(255, 128, 0)")).toEqual(rgba(255, 128, 0));
            expect(parseColor("rgba(255 128 0)")).toEqual(rgba(255, 128, 0));
            expect(parseColor("rgb(255, 128, 0, 0.5)")).toEqual(rgba(255, 128, 0, 0.5));
            expect(parseColor("rgba(255, 128, 0, 0.5)")).toEqual(rgba(255, 128, 0, 0.5));
        });

        it("reads an alpha after a slash in the space-separated syntax, with or without spaces around it", () => {
            expect(parseColor("rgb(255 128 0 / 0.25)")).toEqual(rgba(255, 128, 0, 0.25));
            expect(parseColor("rgb(255 128 0/0.25)")).toEqual(rgba(255, 128, 0, 0.25));
            expect(parseColor("rgba(255 128 0 /0.25)")).toEqual(rgba(255, 128, 0, 0.25));
        });

        it("reads an alpha as a percentage in either syntax", () => {
            expect(parseColor("rgb(255 128 0 / 50%)")).toEqual(rgba(255, 128, 0, 0.5));
            expect(parseColor("rgba(255, 128, 0, 25%)")).toEqual(rgba(255, 128, 0, 0.25));
        });

        it("reads channels as percentages of 255, exactly, so 50% is 127.5", () => {
            expect(parseColor("rgb(50%, 0%, 100%)")).toEqual(rgba(127.5, 0, 255));
            expect(parseColor("rgb(50% 0% 100%)")).toEqual(rgba(127.5, 0, 255));
        });

        it("reads numbers and percentages mixed in the space-separated syntax", () => {
            expect(parseColor("rgb(255 50% 0)")).toEqual(rgba(255, 127.5, 0));
        });

        it("doesn't read numbers and percentages mixed in the legacy syntax, which takes one or the other", () => {
            expect(parseColor("rgb(255, 50%, 0)")).toBeUndefined();
            expect(parseColor("rgb(100%, 128, 0)")).toBeUndefined();
        });

        it("reads decimals, signs and exponents, in any case", () => {
            expect(parseColor("rgb(127.5, 0.25, .5)")).toEqual(rgba(127.5, 0.25, 0.5));
            expect(parseColor("rgb(+10 1E2 2.5e1)")).toEqual(rgba(10, 100, 25));
            expect(parseColor("rgb(1e-1 0 0)")).toEqual(rgba(0.1, 0, 0));
        });

        it("clamps channels to 0 to 255", () => {
            expect(parseColor("rgb(300 -20 128)")).toEqual(rgba(255, 0, 128));
            expect(parseColor("rgb(150%, -10%, 0%)")).toEqual(rgba(255, 0, 0));
        });

        it("clamps an alpha to 0 to 1", () => {
            expect(parseColor("rgb(0 0 0 / 1.5)")).toEqual(rgba(0, 0, 0, 1));
            expect(parseColor("rgb(0 0 0 / 150%)")).toEqual(rgba(0, 0, 0, 1));
            expect(parseColor("rgb(0 0 0 / -0.5)")).toEqual(rgba(0, 0, 0, 0));
        });

        it("reads a channel too large for a number as 255", () => {
            expect(parseColor("rgb(1e999 0 0)")).toEqual(rgba(255, 0, 0));
        });

        it("reads none as 0 in the space-separated syntax, for channels and alpha", () => {
            expect(parseColor("rgb(none 128 none)")).toEqual(rgba(0, 128, 0));
            expect(parseColor("rgb(255 0 0 / none)")).toEqual(rgba(255, 0, 0, 0));
            expect(parseColor("rgb(NONE 0 0)")).toEqual(rgba(0, 0, 0));
        });

        it("doesn't read none in the legacy syntax", () => {
            expect(parseColor("rgb(none, 0, 0)")).toBeUndefined();
            expect(parseColor("rgba(255, 0, 0, none)")).toBeUndefined();
        });

        it("reads the function's name in any case", () => {
            expect(parseColor("RGB(255 0 0)")).toEqual(rgba(255, 0, 0));
            expect(parseColor("RgBa(255, 0, 0, 0.5)")).toEqual(rgba(255, 0, 0, 0.5));
        });

        it("ignores extra whitespace inside the brackets, and around the commas", () => {
            expect(parseColor("rgb(  255   128\n\t0  )")).toEqual(rgba(255, 128, 0));
            expect(parseColor("rgb( 255 , 128 ,0 , 0.5 )")).toEqual(rgba(255, 128, 0, 0.5));
            expect(parseColor("  rgb(255 128 0 / 0.5)  ")).toEqual(rgba(255, 128, 0, 0.5));
        });

        it.each(["rgb()", "rgb(255)", "rgb(255 0)", "rgb(255 0 0 0)", "rgb(255, 0)", "rgb(255, 0, 0, 0.5, 1)", "rgba(1, 2, 3, 4, 5, 6)"])(
            "doesn't read %s, which has the wrong number of arguments",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["rgb(255, 0 0)", "rgb(255 0, 0)", "rgb(255, 0, 0 / 0.5)", "rgb(255 0 0, 0.5)", "rgb(255, 0, 0, / 0.5)"])(
            "doesn't read %s, which mixes commas with spaces or slashes",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each([
            "rgb(255,,0)",
            "rgb(255, 0, 0,)",
            "rgb(,255, 0, 0)",
            "rgb(255 0 0 /)",
            "rgb(255 0 0 / )",
            "rgb(255 0 0 / 0.5 / 1)",
            "rgb(255 0 0 / 0.5 1)",
        ])("doesn't read %s, which has an empty or extra argument", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });

        it.each([
            "rgb(1. 0 0)",
            "rgb(1e 0 0)",
            "rgb(- 0 0)",
            "rgb(1.2.3 0 0)",
            "rgb(0x10 0 0)",
            "rgb(++1 0 0)",
            "rgb(1 2 three)",
            "rgb(10% 0 0 / 50 %)",
        ])("doesn't read %s, which has an argument that isn't a number", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });

        it.each(["rgb(10px 0 0)", "rgb(10deg 0 0)", "rgb(0 0 0 / 1deg)", "rgb(0 0 0 / 1px)"])(
            "doesn't read %s, which has a unit the argument can't take",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );
    });

    describe("hsl() and hsla()", () => {
        it("reads the space-separated syntax", () => {
            expect(parseColor("hsl(120deg 100% 25%)")).toEqual(rgba(0, 127.5, 0));
        });

        it("reads the legacy comma-separated syntax", () => {
            expect(parseColor("hsl(120, 100%, 25%)")).toEqual(rgba(0, 127.5, 0));
        });

        it("reads hsla() as hsl(), with or without an alpha", () => {
            expect(parseColor("hsla(120, 100%, 25%)")).toEqual(rgba(0, 127.5, 0));
            expect(parseColor("hsla(120, 100%, 25%, 0.5)")).toEqual(rgba(0, 127.5, 0, 0.5));
            expect(parseColor("hsl(120 100% 25% / 50%)")).toEqual(rgba(0, 127.5, 0, 0.5));
            expect(parseColor("hsla(120 100% 25% / 0.5)")).toEqual(rgba(0, 127.5, 0, 0.5));
        });

        it("reads a colour that isn't on the edge of the colour wheel", () => {
            expect(channelsOf("hsl(270 60% 70%)")).toEqual([178.5, 132.6, 224.4, 1]);
            expect(hexOf("hsl(270 60% 70%)")).toBe("B385E0");
        });

        it("reads the primary and secondary colours around the wheel", () => {
            expect(hexOf("hsl(0 100% 50%)")).toBe("FF0000");
            expect(hexOf("hsl(60 100% 50%)")).toBe("FFFF00");
            expect(hexOf("hsl(120 100% 50%)")).toBe("00FF00");
            expect(hexOf("hsl(180 100% 50%)")).toBe("00FFFF");
            expect(hexOf("hsl(240 100% 50%)")).toBe("0000FF");
            expect(hexOf("hsl(300 100% 50%)")).toBe("FF00FF");
        });

        it("reads saturation and lightness as plain numbers in the space-separated syntax", () => {
            expect(parseColor("hsl(120 100 25)")).toEqual(rgba(0, 127.5, 0));
        });

        it("doesn't read saturation and lightness as plain numbers in the legacy syntax, which takes percentages", () => {
            expect(parseColor("hsl(120, 100, 25)")).toBeUndefined();
            expect(parseColor("hsl(120, 100%, 25)")).toBeUndefined();
        });

        it("reads a hue in degrees, radians, gradians or turns", () => {
            expect(channelsOf("hsl(180deg 100% 50%)")).toEqual([0, 255, 255, 1]);
            expect(channelsOf(`hsl(${Math.PI}rad 100% 50%)`)).toEqual([0, 255, 255, 1]);
            expect(channelsOf("hsl(200grad 100% 50%)")).toEqual([0, 255, 255, 1]);
            expect(channelsOf("hsl(0.5turn 100% 50%)")).toEqual([0, 255, 255, 1]);
            expect(channelsOf("hsl(0.5TURN, 100%, 50%)")).toEqual([0, 255, 255, 1]);
        });

        it("wraps a hue around the colour wheel", () => {
            expect(hexOf("hsl(-120 100% 50%)")).toBe("0000FF");
            expect(hexOf("hsl(480 100% 50%)")).toBe("00FF00");
            expect(hexOf("hsl(360deg 100% 50%)")).toBe("FF0000");
            expect(hexOf("hsl(-1turn 100% 50%)")).toBe("FF0000");
        });

        it("reads a saturation below 0 as 0, so the colour is grey", () => {
            expect(parseColor("hsl(0 -50% 50%)")).toEqual(rgba(127.5, 127.5, 127.5));
        });

        it("clips a lightness above 100% to white and below 0% to black", () => {
            expect(parseColor("hsl(0 100% 150%)")).toEqual(rgba(255, 255, 255));
            expect(parseColor("hsl(0 100% -50%)")).toEqual(rgba(0, 0, 0));
        });

        it("reads none as 0 in the space-separated syntax", () => {
            expect(parseColor("hsl(none none 50%)")).toEqual(rgba(127.5, 127.5, 127.5));
            expect(parseColor("hsl(none 100% 50% / none)")).toEqual(rgba(255, 0, 0, 0));
        });

        it("doesn't read none in the legacy syntax", () => {
            expect(parseColor("hsl(none, 100%, 50%)")).toBeUndefined();
        });

        it("reads a hue too large for a number as black rather than as NaN", () => {
            expect(parseColor("hsl(1e999 100% 50%)")).toEqual(rgba(0, 0, 0));
        });

        it.each(["hsl(50% 100% 50%)", "hsl(120 100deg 50%)", "hsl(120px 100% 50%)", "hsl(120 100% 50% / 1turn)"])(
            "doesn't read %s, which has a unit the argument can't take",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["hsl(120 100%)", "hsl(120, 100%)", "hsl(120 100% 50% 1)", "hsl(120, 100% 50%)", "hsla(120, 100%, 50%, 1, 1)"])(
            "doesn't read %s, which has the wrong arguments",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );
    });

    describe("hwb()", () => {
        it("reads a hue with whiteness and blackness", () => {
            expect(channelsOf("hwb(194 0% 0%)")).toEqual([0, 195.5, 255, 1]);
            expect(channelsOf("hwb(120 20% 30%)")).toEqual([51, 178.5, 51, 1]);
        });

        it("reads whiteness and blackness as plain numbers", () => {
            expect(channelsOf("hwb(120 20 30)")).toEqual(channelsOf("hwb(120 20% 30%)"));
        });

        it("reads a grey when whiteness and blackness come to 100% or more, in their proportions", () => {
            expect(parseColor("hwb(0 50% 50%)")).toEqual(rgba(127.5, 127.5, 127.5));
            expect(parseColor("hwb(0 60% 60%)")).toEqual(rgba(127.5, 127.5, 127.5));
            expect(parseColor("hwb(0 100% 0%)")).toEqual(rgba(255, 255, 255));
            expect(parseColor("hwb(0 0% 100%)")).toEqual(rgba(0, 0, 0));
        });

        it("reads a hue in any of its units, wrapped around the wheel", () => {
            expect(hexOf("hwb(0.5turn 0% 0%)")).toBe("00FFFF");
            expect(hexOf("hwb(-240 0% 0%)")).toBe("00FF00");
        });

        it("reads an alpha and none", () => {
            expect(parseColor("hwb(none 0% 0% / 0.5)")).toEqual(rgba(255, 0, 0, 0.5));
            expect(parseColor("hwb(0 none none / 25%)")).toEqual(rgba(255, 0, 0, 0.25));
        });

        it("doesn't read the comma-separated syntax, which hwb() doesn't have", () => {
            expect(parseColor("hwb(120, 20%, 30%)")).toBeUndefined();
        });

        it("doesn't read the wrong number of arguments", () => {
            expect(parseColor("hwb(120 20%)")).toBeUndefined();
            expect(parseColor("hwb(120 20% 30% 40%)")).toBeUndefined();
        });
    });

    describe("lab() and lch()", () => {
        it("reads sRGB's red, within rounding", () => {
            expect(hexOf("lab(54.29 80.82 69.89)")).toBe("FF0000");
            expect(hexOf("lch(54.29 106.84 40.85)")).toBe("FF0000");
        });

        it("reads CSS Color 4's example of the same colour in lab() and lch()", () => {
            expect(hexOf("lab(29.2345% 39.3825 20.0664)")).toBe("7D2329");
            expect(hexOf("lch(29.2345% 44.2 27)")).toBe("7D2329");
        });

        it("reads a lightness of 100 as white and 0 as black", () => {
            expect(hexOf("lab(100 0 0)")).toBe("FFFFFF");
            expect(parseColor("lab(0 0 0)")).toEqual(rgba(0, 0, 0));
        });

        it("reads a dark grey, darker than the curve of lightness reaches", () => {
            expect(channelsOf("lab(5 0 0)")).toEqual([16.8377, 16.8377, 16.8377, 1]);
        });

        it("reads a lightness as a percentage of 100", () => {
            expect(channelsOf("lab(50% 0 0)")).toEqual(channelsOf("lab(50 0 0)"));
            expect(channelsOf("lch(50% 30 120)")).toEqual(channelsOf("lch(50 30 120)"));
        });

        it("reads a and b as percentages of 125, and chroma as a percentage of 150", () => {
            expect(channelsOf("lab(50 40% -40%)")).toEqual(channelsOf("lab(50 50 -50)"));
            expect(channelsOf("lch(50 20% 120)")).toEqual(channelsOf("lch(50 30 120)"));
        });

        it("clamps a lightness to 0 to 100", () => {
            expect(channelsOf("lab(-10 50 0)")).toEqual(channelsOf("lab(0 50 0)"));
            expect(channelsOf("lch(-10 50 0)")).toEqual(channelsOf("lch(0 50 0)"));
            expect(hexOf("lab(150 0 0)")).toBe("FFFFFF");
        });

        it("reads a chroma below 0 as 0, so the colour is grey", () => {
            expect(channelsOf("lch(50 -30 0)")).toEqual(channelsOf("lch(50 0 0)"));
            expect(hexOf("lch(50 0 0)")).toBe("777777");
        });

        it("reads a hue in any of its units", () => {
            expect(channelsOf("lch(29.2345% 44.2 0.075turn)")).toEqual(channelsOf("lch(29.2345% 44.2 27deg)"));
            expect(channelsOf("lch(29.2345% 44.2 387)")).toEqual(channelsOf("lch(29.2345% 44.2 27)"));
        });

        it("reads an alpha and none", () => {
            expect(channelsOf("lab(none none none / 0.5)")).toEqual([0, 0, 0, 0.5]);
            expect(channelsOf("lch(50 30 none)")).toEqual(channelsOf("lch(50 30 0)"));
        });

        it("clips a colour outside sRGB to it, channel by channel", () => {
            expect(channelsOf("lab(50 100 0)")).toEqual(expect.arrayContaining([255]));
        });

        it("reads values too large for the conversions without NaN", () => {
            const color = parseColor("lab(50 1e300 0)");

            expect(color).toEqual({ red: expect.any(Number), green: expect.any(Number), blue: expect.any(Number), alpha: 1 });
            expect(Object.values(color as CssColor).every((channel) => channel >= 0 && channel <= 255)).toBe(true);
        });

        it.each([
            "lab(50, 0, 0)",
            "lch(50, 30, 120)",
            "lab(50 0)",
            "lch(50 30 120 0)",
            "lab(50deg 0 0)",
            "lab(50 0 0deg)",
            "lch(50 30 120%)",
        ])("doesn't read %s, which has the wrong arguments", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });

    describe("oklab() and oklch()", () => {
        it("reads sRGB's red, within rounding", () => {
            expect(hexOf("oklab(0.628 0.2249 0.1258)")).toBe("FF0000");
            expect(hexOf("oklch(62.8% 0.2577 29.23)")).toBe("FF0000");
        });

        it("reads CSS Color 4's example of the same colour in oklab() and oklch()", () => {
            expect(hexOf("oklab(40.101% 0.1147 0.0453)")).toBe("7D2329");
            expect(hexOf("oklch(40.101% 0.12332 21.555)")).toBe("7D2329");
        });

        it("reads a lightness of 1 as white and 0 as black", () => {
            expect(hexOf("oklab(1 0 0)")).toBe("FFFFFF");
            expect(parseColor("oklch(0 0 0)")).toEqual(rgba(0, 0, 0));
        });

        it("reads a lightness as a percentage of 1", () => {
            expect(channelsOf("oklab(50% 0.1 0)")).toEqual(channelsOf("oklab(0.5 0.1 0)"));
        });

        it("reads a, b and chroma as percentages of 0.4", () => {
            expect(channelsOf("oklab(0.5 50% -25%)")).toEqual(channelsOf("oklab(0.5 0.2 -0.1)"));
            expect(channelsOf("oklch(0.6 25% 120)")).toEqual(channelsOf("oklch(0.6 0.1 120)"));
        });

        it("clamps a lightness to 0 to 1", () => {
            expect(channelsOf("oklab(-0.5 0.1 0)")).toEqual(channelsOf("oklab(0 0.1 0)"));
            expect(hexOf("oklab(1.5 0 0)")).toBe("FFFFFF");
        });

        it("reads a chroma below 0 as 0, so the colour is grey", () => {
            expect(channelsOf("oklch(0.6 -0.1 120)")).toEqual(channelsOf("oklch(0.6 0 120)"));
        });

        it("reads a hue in any of its units", () => {
            expect(channelsOf(`oklch(62.8% 0.2577 ${(29.23 * Math.PI) / 180}rad)`)).toEqual(channelsOf("oklch(62.8% 0.2577 29.23)"));
            expect(channelsOf("oklch(62.8% 0.2577 0.1turn)")).toEqual(channelsOf("oklch(62.8% 0.2577 36deg)"));
        });

        it("clips a colour outside sRGB to it, channel by channel", () => {
            expect(parseColor("oklch(0.9 0.4 150)")).toEqual(rgba(0, 255, 0));
        });

        it("reads an alpha and none", () => {
            expect(channelsOf("oklch(none none none / 50%)")).toEqual([0, 0, 0, 0.5]);
        });

        it.each([
            "oklab(0.5, 0, 0)",
            "oklch(0.5, 0.1, 120)",
            "oklab(0.5 0)",
            "oklch(0.5 0.1 120 0)",
            "oklab(0.5 0 0deg)",
            "oklch(0.5 0.1 120%)",
        ])("doesn't read %s, which has the wrong arguments", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });

    describe("color()", () => {
        it("reads sRGB, with channels from 0 to 1 or as percentages", () => {
            expect(parseColor("color(srgb 1 0.5 0)")).toEqual(rgba(255, 127.5, 0));
            expect(parseColor("color(srgb 100% 50% 0%)")).toEqual(rgba(255, 127.5, 0));
        });

        it("reads an alpha after a slash", () => {
            expect(parseColor("color(srgb 1 0 0 / 0.5)")).toEqual(rgba(255, 0, 0, 0.5));
            expect(parseColor("color(srgb 1 0 0/25%)")).toEqual(rgba(255, 0, 0, 0.25));
        });

        it("reads linear sRGB, through sRGB's transfer function", () => {
            expect(channelsOf("color(srgb-linear 1 0 0)")).toEqual([255, 0, 0, 1]);
            expect(channelsOf("color(srgb-linear 0.214 0.214 0.214)")).toEqual([127.4887, 127.4887, 127.4887, 1]);
            expect(channelsOf("color(srgb-linear 0.001 0.001 0.001)")).toEqual([3.2946, 3.2946, 3.2946, 1]);
        });

        it("reads Display P3, keeping its greys, as it has sRGB's white and transfer function", () => {
            expect(channelsOf("color(display-p3 0.5 0.5 0.5)")).toEqual([127.5, 127.5, 127.5, 1]);
            expect(channelsOf("color(display-p3 0.02 0.02 0.02)")).toEqual([5.1, 5.1, 5.1, 1]);
            expect(hexOf("color(display-p3 1 1 1)")).toBe("FFFFFF");
        });

        it("reads Display P3's version of sRGB's red, within rounding", () => {
            expect(hexOf("color(display-p3 0.9175 0.2003 0.1386)")).toBe("FF0000");
        });

        it("clips Display P3's red, which is more vivid than sRGB has, to sRGB's red", () => {
            expect(parseColor("color(display-p3 1 0 0)")).toEqual(rgba(255, 0, 0));
        });

        it("reads XYZ with a D65 white, as xyz or xyz-d65", () => {
            expect(hexOf("color(xyz-d65 0.9505 1 1.089)")).toBe("FFFFFF");
            expect(hexOf("color(xyz 0.4124 0.2126 0.0193)")).toBe("FF0000");
            expect(channelsOf("color(xyz 0.2 0.3 0.4)")).toEqual(channelsOf("color(xyz-d65 0.2 0.3 0.4)"));
        });

        it("reads XYZ with a D50 white, adapted to sRGB's D65 white", () => {
            expect(hexOf("color(xyz-d50 0.9642 1 0.8251)")).toBe("FFFFFF");
            expect(hexOf("color(xyz-d50 0.4361 0.2225 0.0139)")).toBe("FF0000");
        });

        it("reads none as 0", () => {
            expect(parseColor("color(srgb none 1 none / none)")).toEqual(rgba(0, 255, 0, 0));
        });

        it("reads the function and colour space in any case", () => {
            expect(parseColor("COLOR(SRGB 1 0 0)")).toEqual(rgba(255, 0, 0));
            expect(hexOf("Color(Display-P3 1 1 1)")).toBe("FFFFFF");
        });

        it.each([
            "color(srgb 1 0)",
            "color(srgb 1 0 0 0)",
            "color(1 0 0)",
            "color()",
            "color(srgb)",
            "color(srgb, 1, 0, 0)",
            "color(unknown-space 1 0 0)",
            "color(srgb 1deg 0 0)",
            "color(srgb 1 0 0 / 1 / 1)",
        ])("doesn't read %s, which has the wrong arguments", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });

    describe("values that aren't colours", () => {
        it.each([
            "var(--accent)",
            "color-mix(in srgb, red, blue)",
            "calc(1)",
            "foo(1 2 3)",
            "device-cmyk(0 0 0 1)",
            "light-dark(red, blue)",
        ])("doesn't read %s, which it doesn't know", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });

        it.each(["rgb(calc(255) 0 0)", "rgb(var(--red) 0 0)", "hsl(from red h s l)"])(
            "doesn't read %s, which needs more than the value to work out",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["rgb(255 0 0", "rgb 255 0 0)", "rgb((255 0 0)", "rgb(255 0 0))", "rgb(255 (0) 0)", "(255 0 0)"])(
            "doesn't read %s, which has unbalanced brackets",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["rgb(255 0 0) x", "rgb(255 0 0);", "red blue", "#fff !important", "red;", "x rgb(255 0 0)"])(
            "doesn't read %j, which has more than the colour",
            (value) => {
                expect(parseColor(value)).toBeUndefined();
            },
        );

        it.each(["rgb (255 0 0)", "not a colour", "123", "()", "rgb", "-", "#"])("doesn't read %j", (value) => {
            expect(parseColor(value)).toBeUndefined();
        });
    });
});

describe("toHex", () => {
    it("writes six uppercase hex digits with no #, with leading zeros", () => {
        expect(toHex(rgba(1, 2, 10))).toBe("01020A");
        expect(toHex(rgba(255, 171, 205))).toBe("FFABCD");
    });

    it("rounds each channel to the nearest whole number, with halves up", () => {
        expect(toHex(rgba(127.5, 127.49, 0.5))).toBe("807F01");
    });

    it("writes an opaque colour as it is, whatever the background", () => {
        expect(toHex(rgba(255, 128, 0), rgba(0, 0, 255))).toBe("FF8000");
    });

    it("blends a partly transparent colour over white when no background is given", () => {
        expect(toHex(rgba(255, 0, 0, 0.5))).toBe("FF8080");
        expect(toHex(rgba(0, 0, 255, 0.25))).toBe("BFBFFF");
    });

    it("blends a partly transparent colour over the background given", () => {
        expect(toHex(rgba(255, 0, 0, 0.5), rgba(0, 0, 255))).toBe("800080");
        expect(toHex(rgba(255, 255, 255, 0.2), rgba(0, 0, 0))).toBe("333333");
    });

    it("takes the background as opaque, whatever its alpha", () => {
        expect(toHex(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0))).toBe("808080");
    });

    it("writes nothing for a fully transparent colour, whatever the background", () => {
        expect(toHex(rgba(255, 0, 0, 0))).toBeUndefined();
        expect(toHex(rgba(0, 0, 0, 0), rgba(0, 0, 0))).toBeUndefined();
    });

    it("writes a nearly transparent colour as nearly the background", () => {
        expect(toHex(rgba(0, 0, 0, 0.001))).toBe("FFFFFF");
        expect(toHex(rgba(0, 0, 0, 0.01))).toBe("FCFCFC");
    });

    it("clamps channels outside 0 to 255, for a colour not read by parseColor", () => {
        expect(toHex(rgba(300, -5, 128))).toBe("FF0080");
    });

    it("writes colours parseColor reads, blending their alpha", () => {
        expect(hexOf("rgba(255, 0, 0, 0.5)")).toBe("FF8080");
        expect(hexOf("#ff000080")).toBe("FF7F7F");
        expect(hexOf("hsl(30 100% 50%)")).toBe("FF8000");
        expect(hexOf("transparent")).toBeUndefined();
    });
});
