/**
 * Theme color module for WordprocessingML documents.
 *
 * Text, underlines, borders and shading can be in a color of the document's theme, lighter or darker as Word's color
 * menus offer them. Word writes the theme color's name, how much lighter (`themeTint`) or darker (`themeShade`) it
 * is, and the color it comes to in hex, for applications that don't read the theme. The hex color is worked out in
 * HSL as the standard describes, and is close to Word's but not always the same.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * @module
 */
import { BaseXmlComponent, type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

import { type ThemeColorValues, themeColorValues } from "./color-scheme";

/**
 * One of the twelve colors of the document's theme, as `Document`'s `theme.colors` names them.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_ThemeColor">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="dark1"/>
 *     <xsd:enumeration value="light1"/>
 *     <xsd:enumeration value="dark2"/>
 *     <xsd:enumeration value="light2"/>
 *     <xsd:enumeration value="accent1"/>
 *     <xsd:enumeration value="accent2"/>
 *     <xsd:enumeration value="accent3"/>
 *     <xsd:enumeration value="accent4"/>
 *     <xsd:enumeration value="accent5"/>
 *     <xsd:enumeration value="accent6"/>
 *     <xsd:enumeration value="hyperlink"/>
 *     <xsd:enumeration value="followedHyperlink"/>
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="background1"/>
 *     <xsd:enumeration value="text1"/>
 *     <xsd:enumeration value="background2"/>
 *     <xsd:enumeration value="text2"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export type ThemeColorName =
    | "dark1"
    | "light1"
    | "dark2"
    | "light2"
    | "accent1"
    | "accent2"
    | "accent3"
    | "accent4"
    | "accent5"
    | "accent6"
    | "hyperlink"
    | "followedHyperlink";

/**
 * A color of the document's theme, lighter or darker if you like, as Word's color menus offer them: "Blue, Accent 1,
 * Lighter 40%" is `{ theme: "accent1", lighter: 40 }`. It changes when the theme's colors change.
 *
 * @publicApi
 */
export type ThemeColor = {
    /** The theme's color, such as `"accent1"` or `"dark2"` */
    readonly theme: ThemeColorName;
    /** Makes the color lighter, from 0 (unchanged) to 100 (white) */
    readonly lighter?: number;
    /** Makes the color darker, from 0 (unchanged) to 100 (black) */
    readonly darker?: number;
};

const THEME_COLOR_NAMES: ReadonlySet<string> = new Set<ThemeColorName>([
    "dark1",
    "light1",
    "dark2",
    "light2",
    "accent1",
    "accent2",
    "accent3",
    "accent4",
    "accent5",
    "accent6",
    "hyperlink",
    "followedHyperlink",
]);

/* cspell:disable */
// The right name for DrawingML's names, and for the names Word's color menus give the dark and light colors
const THEME_COLOR_SUGGESTIONS: ReadonlyMap<string, ThemeColorName> = new Map([
    ["dk1", "dark1"],
    ["lt1", "light1"],
    ["dk2", "dark2"],
    ["lt2", "light2"],
    ["hlink", "hyperlink"],
    ["folHlink", "followedHyperlink"],
    ["text1", "dark1"],
    ["background1", "light1"],
    ["text2", "dark2"],
    ["background2", "light2"],
]);
/* cspell:enable */

const changeValue = (value: number, option: string): number => {
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
    }
    // How much of the color is kept, from 0 to 255, as Word writes it
    return Math.round(255 * (1 - value / 100));
};

type ThemeColorChange = { readonly tint?: number; readonly shade?: number };

/**
 * Checks a theme color, and works out its tint or shade.
 *
 * @throws If the color isn't one of the theme's, is both lighter and darker, or a change is outside 0 to 100
 */
const themeColorChange = ({ theme, lighter, darker }: ThemeColor): ThemeColorChange => {
    if (!THEME_COLOR_NAMES.has(theme)) {
        const suggestion = THEME_COLOR_SUGGESTIONS.get(theme);
        throw new Error(
            `Invalid theme color "${theme}". ${suggestion ? `Did you mean "${suggestion}"?` : `Expected one of ${[...THEME_COLOR_NAMES].join(", ")}`}`,
        );
    }
    if (lighter !== undefined && darker !== undefined) {
        throw new Error("Invalid theme color. Expected lighter or darker, not both");
    }
    // Unchanged colors are written without a tint or shade
    const tint = lighter === undefined ? undefined : changeValue(lighter, "lighter");
    const shade = darker === undefined ? undefined : changeValue(darker, "darker");
    return { tint: tint === 255 ? undefined : tint, shade: shade === 255 ? undefined : shade };
};

type Hsl = { readonly hue: number; readonly saturation: number; readonly lightness: number };

const toHsl = (hex: string): Hsl => {
    const [red, green, blue] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;
    const range = max - min;
    if (range === 0) {
        return { hue: 0, saturation: 0, lightness };
    }
    const hue = max === red ? ((green - blue) / range + 6) % 6 : max === green ? (blue - red) / range + 2 : (red - green) / range + 4;
    return { hue: hue * 60, saturation: range / (1 - Math.abs(2 * lightness - 1)), lightness };
};

const toHex = ({ hue, saturation, lightness }: Hsl): string => {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const [red, green, blue] =
        hue < 60
            ? [chroma, second, 0]
            : hue < 120
              ? [second, chroma, 0]
              : hue < 180
                ? [0, chroma, second]
                : hue < 240
                  ? [0, second, chroma]
                  : hue < 300
                    ? [second, 0, chroma]
                    : [chroma, 0, second];
    const lowest = lightness - chroma / 2;
    // Rounded down. This gives Word's value for about half of the colors of its color menus, and is within two of it in
    // each channel for the rest
    return [red, green, blue]
        .map((value) =>
            Math.floor((value + lowest) * 255 + 1e-9)
                .toString(16)
                .padStart(2, "0"),
        )
        .join("")
        .toUpperCase();
};

/**
 * The color a theme color comes to: its lightness moved towards white by its tint, or towards black by its shade.
 */
const applyChange = (hex: string, { tint, shade }: ThemeColorChange): string => {
    if (tint === undefined && shade === undefined) {
        return hex;
    }
    const hsl = toHsl(hex);
    const lightness = tint === undefined ? (hsl.lightness * shade!) / 255 : (hsl.lightness * tint) / 255 + (1 - tint / 255);
    return toHex({ ...hsl, lightness });
};

const hexByte = (value: number | undefined): string | undefined =>
    value === undefined ? undefined : value.toString(16).padStart(2, "0").toUpperCase();

/**
 * A color option: a 6-digit hex color such as `"FF0000"`, `"auto"`, or a color of the document's theme such as
 * `{ theme: "accent1" }`.
 */
export type ColorOption = string | ThemeColor;

/**
 * The attributes a color is written with: the hex color, and the theme color's name, tint and shade.
 */
export type ColorAttributeKeys = {
    readonly color: string;
    readonly theme: string;
    readonly tint: string;
    readonly shade: string;
};

type ColorAttributeValues = {
    readonly color: string;
    readonly theme?: ThemeColorName;
    readonly tint?: string;
    readonly shade?: string;
};

type CheckedColor =
    | { readonly type: "hex"; readonly value: string }
    | { readonly type: "theme"; readonly color: ThemeColor; readonly change: ThemeColorChange };

/**
 * Checks a color option, so that mistakes throw when an element is created rather than when it is written.
 *
 * @throws If a hex color isn't 6 hex digits, or a theme color isn't valid
 */
const checkColor = (color: ColorOption): CheckedColor =>
    typeof color === "string" ? { type: "hex", value: hexColorValue(color) } : { type: "theme", color, change: themeColorChange(color) };

const colorValues = (checked: CheckedColor, colors: ThemeColorValues): ColorAttributeValues =>
    checked.type === "hex"
        ? { color: checked.value }
        : {
              color: applyChange(colors[checked.color.theme], checked.change),
              theme: checked.color.theme,
              tint: hexByte(checked.change.tint),
              shade: hexByte(checked.change.shade),
          };

// Office's colors, for elements formatted outside a document
const OFFICE_THEME_COLORS = themeColorValues();

/**
 * An attribute of an element with colors: a plain attribute, or a color written with the attributes `keys` names.
 */
export type ColorElementAttribute =
    | { readonly key: string; readonly value: string | number | boolean | undefined }
    | { readonly keys: ColorAttributeKeys; readonly color: ColorOption | undefined };

type CheckedAttribute =
    | { readonly key: string; readonly value: string | number | boolean | undefined }
    | { readonly keys: ColorAttributeKeys; readonly color: CheckedColor | undefined };

/**
 * The attributes of an element with colors, some of which may be the theme's. A theme color is written with the hex
 * color it comes to in the document's theme, so that is worked out when the element is written. Attributes are written
 * in the order given.
 *
 * @internal
 */
export class ColorAttributeComponent extends BaseXmlComponent {
    private readonly attributes: readonly CheckedAttribute[];

    /**
     * @throws If a color isn't valid
     */
    public constructor(attributes: readonly ColorElementAttribute[]) {
        super("_attr");
        this.attributes = attributes.map((attribute): CheckedAttribute =>
            "keys" in attribute
                ? { keys: attribute.keys, color: attribute.color === undefined ? undefined : checkColor(attribute.color) }
                : attribute,
        );
    }

    public prepForXml(context: IContext): IXmlableObject {
        const themeColors = context.file?.Theme?.Colors ?? OFFICE_THEME_COLORS;
        const entries = this.attributes.flatMap((attribute): readonly (readonly [string, string | number | boolean | undefined])[] => {
            if (!("keys" in attribute)) {
                return [[attribute.key, attribute.value]];
            }
            if (attribute.color === undefined) {
                return [];
            }
            const { keys } = attribute;
            const values = colorValues(attribute.color, themeColors);
            return [
                [keys.color, values.color],
                [keys.theme, values.theme],
                [keys.tint, values.tint],
                [keys.shade, values.shade],
            ];
        });
        return { _attr: Object.fromEntries(entries.filter(([, value]) => value !== undefined)) };
    }
}

class ColorElement extends XmlComponent {
    public constructor(name: string, attributes: readonly ColorElementAttribute[]) {
        super(name);
        this.root.push(new ColorAttributeComponent(attributes));
    }
}

/**
 * Creates an element whose attributes include colors, some of which may be the theme's.
 *
 * @throws If a color isn't valid
 */
export const createColorElement = (name: string, attributes: readonly ColorElementAttribute[]): XmlComponent =>
    new ColorElement(name, attributes);

/**
 * The attributes most elements write a color with: `w:color`, `w:themeColor`, `w:themeTint` and `w:themeShade`.
 */
export const COLOR_ATTRIBUTES: ColorAttributeKeys = {
    color: "w:color",
    theme: "w:themeColor",
    tint: "w:themeTint",
    shade: "w:themeShade",
};
