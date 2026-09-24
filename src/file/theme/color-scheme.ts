/**
 * Color scheme module for DrawingML themes.
 *
 * The twelve colors of a document's theme: the dark and light colors text and backgrounds use, six accent colors,
 * and the colors of hyperlinks.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * @module
 */
// cspell:ignore hlink Hlink
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

/**
 * The colors of a document's theme, each a 6-digit hex color such as `"4472C4"`.
 *
 * Word shows these colors at the top of its color menus, and text, tables and shapes that use a theme color change
 * when the theme's colors change. The colors not given are Office's.
 *
 * @publicApi
 */
export type IThemeColorsOptions = {
    /** The dark color for text on a light background (`dk1`). Default is the system's window text color, black */
    readonly dark1?: string;
    /** The light color for backgrounds (`lt1`). Default is the system's window color, white */
    readonly light1?: string;
    /** A second dark color for text (`dk2`). Default is `"44546A"` */
    readonly dark2?: string;
    /** A second light color for backgrounds (`lt2`). Default is `"E7E6E6"` */
    readonly light2?: string;
    /** Default is `"4472C4"`, blue */
    readonly accent1?: string;
    /** Default is `"ED7D31"`, orange */
    readonly accent2?: string;
    /** Default is `"A5A5A5"`, gray */
    readonly accent3?: string;
    /** Default is `"FFC000"`, gold */
    readonly accent4?: string;
    /** Default is `"5B9BD5"`, light blue */
    readonly accent5?: string;
    /** Default is `"70AD47"`, green */
    readonly accent6?: string;
    /** The color of hyperlinks (`hlink`). Default is `"0563C1"` */
    readonly hyperlink?: string;
    /** The color of hyperlinks that have been followed (`folHlink`). Default is `"954F72"` */
    readonly followedHyperlink?: string;
};

type ThemeColorName = keyof IThemeColorsOptions;

/**
 * Each color of a theme, as a 6-digit hex color.
 */
export type ThemeColorValues = Readonly<Record<ThemeColorName, string>>;

/* cspell:disable */
// Each color, in the order the scheme lists them, and its OOXML name
const COLOR_OOXML_NAMES: Readonly<Record<ThemeColorName, string>> = {
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
};
/* cspell:enable */

// Office's colors, from Office 2016 to 2021. Its dark and light colors are the system's window text and window colors
const OFFICE_COLORS: Readonly<Record<Exclude<ThemeColorName, "dark1" | "light1">, string>> = {
    dark2: "44546A",
    light2: "E7E6E6",
    accent1: "4472C4",
    accent2: "ED7D31",
    accent3: "A5A5A5",
    accent4: "FFC000",
    accent5: "5B9BD5",
    accent6: "70AD47",
    hyperlink: "0563C1",
    followedHyperlink: "954F72",
};

const OFFICE_SYSTEM_COLORS: Readonly<Record<"dark1" | "light1", { readonly value: string; readonly lastColor: string }>> = {
    dark1: { value: "windowText", lastColor: "000000" },
    light1: { value: "window", lastColor: "FFFFFF" },
};

const rgbColorValue = (name: ThemeColorName, color: string): string => {
    if (color === "auto") {
        throw new Error(`Invalid theme color ${name} 'auto'. Expected 6 digit hex value`);
    }
    return hexColorValue(color);
};

/**
 * The hex color of each of a theme's colors, with Office's in place of those not given. The system's window text and
 * window colors are black and white.
 *
 * @throws If a color isn't a 6-digit hex value
 */
export const themeColorValues = (colors: IThemeColorsOptions = {}): ThemeColorValues =>
    Object.fromEntries(
        (Object.keys(COLOR_OOXML_NAMES) as readonly ThemeColorName[]).map((name) => {
            const color = colors[name];
            const office = name === "dark1" || name === "light1" ? OFFICE_SYSTEM_COLORS[name].lastColor : OFFICE_COLORS[name];
            return [name, color === undefined ? office : rgbColorValue(name, color)];
        }),
    ) as ThemeColorValues;

const createRgbColor = (name: ThemeColorName, color: string): XmlComponent =>
    new BuilderElement<{ readonly value: string }>({
        name: "a:srgbClr",
        attributes: { value: { key: "val", value: rgbColorValue(name, color) } },
    });

const createColor = (name: ThemeColorName, colors: IThemeColorsOptions): XmlComponent => {
    const color = colors[name];
    const system = name === "dark1" || name === "light1" ? OFFICE_SYSTEM_COLORS[name] : undefined;
    return new BuilderElement({
        name: `a:${COLOR_OOXML_NAMES[name]}`,
        children: [
            color === undefined && system
                ? new BuilderElement<{ readonly value: string; readonly lastColor: string }>({
                      name: "a:sysClr",
                      attributes: {
                          value: { key: "val", value: system.value },
                          lastColor: { key: "lastClr", value: system.lastColor },
                      },
                  })
                : createRgbColor(name, color ?? OFFICE_COLORS[name as keyof typeof OFFICE_COLORS]),
        ],
    });
};

/**
 * Creates a theme's color scheme, with Office's colors in place of those not given.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ColorScheme">
 *   <xsd:sequence>
 *     <xsd:element name="dk1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="lt1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="dk2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="lt2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent1" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent2" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent3" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent4" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent5" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="accent6" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="hlink" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="folHlink" type="CT_Color" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="xsd:string" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @throws If a color isn't a 6-digit hex value
 */
export const createColorScheme = (name: string, colors: IThemeColorsOptions = {}): XmlComponent =>
    new BuilderElement<{ readonly name: string }>({
        name: "a:clrScheme",
        attributes: { name: { key: "name", value: name } },
        children: (Object.keys(COLOR_OOXML_NAMES) as readonly ThemeColorName[]).map((color) => createColor(color, colors)),
    });
