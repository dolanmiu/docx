/**
 * Colours for series, bars and slices.
 *
 * A copy of `src/shapes/preset-shape/shape-color.ts`, as `docx/charts` and `docx/shapes` are separate entries that
 * import only `docx`. Make a fix in both.
 *
 * @module
 */
import { BuilderElement, type ThemeColor, type ThemeColorName, type XmlComponent, hexColorValue } from "docx";

/**
 * A colour: a 6-digit hex colour such as `"FF0000"`, or a colour of the document's theme such as `{ theme: "accent1" }`.
 */
export type ChartColor = string | ThemeColor;

/**
 * Checks that a percentage option is between 0 and 100 and returns it.
 *
 * @throws If the value is outside 0 to 100
 */
const percentageValue = (value: number, option: string): number => {
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
    }
    return value;
};

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
    } satisfies Record<ThemeColorName, string>),
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

type ColorChange = { readonly name: string; readonly value: number };

const createColorChange = ({ name, value }: ColorChange): XmlComponent =>
    new BuilderElement<{ readonly value: number }>({ name, attributes: { value: { key: "val", value } } });

/**
 * How a theme colour is made lighter or darker, as Word does it: by scaling its luminance (`lumMod`), and for a lighter
 * colour, adding to it (`lumOff`). Both are in thousandths of a percent.
 */
const themeColorChanges = ({ lighter, darker }: ThemeColor): readonly ColorChange[] => {
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

const createThemeColor = (color: ThemeColor, changes: readonly ColorChange[]): XmlComponent => {
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
 * createChartColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
 * createChartColor({ theme: "accent1", darker: 25 }); // <a:schemeClr val="accent1"><a:lumMod val="75000"/></a:schemeClr>
 * ```
 */
export const createChartColor = (color: ChartColor, transparency?: number): XmlComponent => {
    // Alpha is opacity in thousandths of a percent
    const changes: readonly ColorChange[] = transparency
        ? [{ name: "a:alpha", value: Math.round((100 - percentageValue(transparency, "transparency")) * 1000) }]
        : [];

    if (typeof color !== "string") {
        return createThemeColor(color, changes);
    }

    if (color === "auto") {
        throw new Error(`Invalid chart color 'auto'. Expected 6 digit hex value`);
    }

    return new BuilderElement<{ readonly value: string }>({
        name: "a:srgbClr",
        attributes: {
            value: { key: "val", value: hexColorValue(color) },
        },
        children: changes.map(createColorChange),
    });
};
