/**
 * Colours for shape fills and lines.
 *
 * `src/charts/chart-color.ts` is a copy of this file, as `docx/charts` and `docx/shapes` are separate entries that import
 * only `docx`. Make a fix in both.
 *
 * @module
 */
import { BuilderElement, type ThemeColor, type ThemeColorName, type XmlComponent, hexColorValue } from "docx";

import { percentageValue } from "./shape-units";

/**
 * One of the twelve colours of the document's theme, as `Document`'s `theme.colors` names them. The same as `docx`'s
 * `ThemeColorName`.
 *
 * @publicApi
 */
export type ShapeThemeColorName = ThemeColorName;

/* cspell:disable */
// Each colour of the document's theme mapped to its OOXML name (`ST_SchemeColorVal`)
const THEME_COLOR_OOXML_NAMES: ReadonlyMap<string, string> = new Map(
    Object.entries({
        dark1: "dk1",
        light1: "lt1",
        dark2: "dk2",
        light2: "lt2",
        accent1: "accent1",
        accent2: "accent2",
        accent3: "accent3",
        accent4: "accent4",
        accent5: "accent5",
        accent6: "accent6",
        hyperlink: "hlink",
        followedHyperlink: "folHlink",
    } satisfies Record<ShapeThemeColorName, string>),
);

// The right name for OOXML's names, and for the names Word's colour menus give the dark and light colours
const THEME_COLOR_SUGGESTIONS: ReadonlyMap<string, string> = new Map([
    ...[...THEME_COLOR_OOXML_NAMES].map(([name, ooxml]) => [ooxml, name] as const),
    ["text1", "dark1"],
    ["background1", "light1"],
    ["text2", "dark2"],
    ["background2", "light2"],
]);
/* cspell:enable */

/**
 * A colour of the document's theme, lighter or darker if you like, as Word's colour menus offer them: "Blue, Accent 1,
 * Lighter 40%" is `{ theme: "accent1", lighter: 40 }`. The shape changes colour when the theme's colours change. The
 * same as `docx`'s `ThemeColor`, which text, borders and shading take.
 *
 * @publicApi
 */
export type ShapeThemeColor = ThemeColor;

/**
 * A colour: a 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }`.
 *
 * @publicApi
 */
export type ShapeColor = string | ShapeThemeColor;

type ColorChange = { readonly name: string; readonly value: number };

const createColorChange = ({ name, value }: ColorChange): XmlComponent =>
    new BuilderElement<{ readonly value: number }>({ name, attributes: { value: { key: "val", value } } });

/**
 * How a theme colour is made lighter or darker, as Word does it: by scaling its luminance (`lumMod`), and for a lighter
 * colour, adding to it (`lumOff`). Both are in thousandths of a percent.
 */
const themeColorChanges = ({ lighter, darker }: ShapeThemeColor): readonly ColorChange[] => {
    if (lighter !== undefined && darker !== undefined) {
        throw new Error("Invalid theme colour. Expected lighter or darker, not both");
    }
    if (lighter !== undefined) {
        const amount = percentageValue(lighter, "lighter");
        return [
            { name: "a:lumMod", value: Math.round((100 - amount) * 1000) },
            { name: "a:lumOff", value: Math.round(amount * 1000) },
        ];
    }
    return darker === undefined ? [] : [{ name: "a:lumMod", value: Math.round((100 - percentageValue(darker, "darker")) * 1000) }];
};

const createThemeColor = (color: ShapeThemeColor, changes: readonly ColorChange[]): XmlComponent => {
    const name = THEME_COLOR_OOXML_NAMES.get(color.theme);
    if (name === undefined) {
        const suggestion = THEME_COLOR_SUGGESTIONS.get(color.theme);
        throw new Error(
            `Invalid theme colour "${color.theme}". ${suggestion ? `Did you mean "${suggestion}"?` : `Expected one of ${[...THEME_COLOR_OOXML_NAMES.keys()].join(", ")}`}`,
        );
    }
    return new BuilderElement<{ readonly value: string }>({
        name: "a:schemeClr",
        attributes: { value: { key: "val", value: name } },
        children: [...themeColorChanges(color), ...changes].map(createColorChange),
    });
};

/**
 * Creates an `a:srgbClr` element from a hex colour, or an `a:schemeClr` element from a colour of the document's theme,
 * with an optional transparency.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SRgbColor">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_SchemeColor">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param color - A 6-digit hex colour such as `"FF0000"` or `"#FF0000"`, or a colour of the document's theme
 * @param transparency - From 0 (opaque) to 100 (invisible)
 * @throws If the colour is not a 6-digit hex value or a colour of the theme, or a percentage is outside 0 to 100
 *
 * @example
 * ```typescript
 * createShapeColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
 * createShapeColor({ theme: "accent1", darker: 25 }); // <a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>
 * ```
 */
export const createShapeColor = (color: ShapeColor, transparency?: number): XmlComponent => {
    // Alpha is opacity in thousandths of a percent
    const changes: readonly ColorChange[] = transparency
        ? [{ name: "a:alpha", value: Math.round((100 - percentageValue(transparency, "transparency")) * 1000) }]
        : [];

    if (typeof color !== "string") {
        return createThemeColor(color, changes);
    }

    if (color === "auto") {
        throw new Error(`Invalid shape color 'auto'. Expected 6 digit hex value`);
    }

    return new BuilderElement<{ readonly value: string }>({
        name: "a:srgbClr",
        attributes: {
            value: { key: "val", value: hexColorValue(color) },
        },
        children: changes.map(createColorChange),
    });
};

/**
 * Whether a fill or line given as an object is a colour of the document's theme.
 */
export const isThemeColor = (value: object): value is ShapeThemeColor => "theme" in value;
