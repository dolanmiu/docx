/**
 * Theme module for WordprocessingML documents.
 *
 * A document's theme (`word/theme/theme1.xml`) gives it a set of colors, a font for headings and one for body text,
 * and the fills, lines and effects of shapes styled by the theme. Text, tables and shapes that use the theme's colors
 * and fonts change when the theme changes, as they do in Word's Design tab.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * @module
 */
import { BuilderElement, NextAttributeComponent, XmlComponent } from "@file/xml-components";

import { type IThemeColorsOptions, createColorScheme } from "./color-scheme";
import { type IThemeFontsOptions, createFontScheme } from "./font-scheme";
import { createFormatScheme } from "./format-scheme";

export type { IThemeColorsOptions } from "./color-scheme";
export type { IThemeFontOptions, IThemeFontsOptions } from "./font-scheme";

/**
 * Options for a document's theme. Anything not given is as Office's theme has it, from Office 2016 to 2021.
 *
 * @publicApi
 */
export type IThemeOptions = {
    /** The theme's name, as Word shows it. Default is `"Office Theme"` */
    readonly name?: string;
    /** The theme's colors */
    readonly colors?: IThemeColorsOptions;
    /** The theme's fonts for headings and body text */
    readonly fonts?: IThemeFontsOptions;
};

/**
 * Represents the theme of a document, written to `word/theme/theme1.xml`.
 *
 * Every document has one: Office's theme, from Office 2016 to 2021, with the colors and fonts the options give.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="theme" type="CT_OfficeStyleSheet"/>
 *
 * <xsd:complexType name="CT_OfficeStyleSheet">
 *   <xsd:sequence>
 *     <xsd:element name="themeElements" type="CT_BaseStyles" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="objectDefaults" type="CT_ObjectStyleDefaults" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extraClrSchemeLst" type="CT_ColorSchemeList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="custClrLst" type="CT_CustomColorList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_BaseStyles">
 *   <xsd:sequence>
 *     <xsd:element name="clrScheme" type="CT_ColorScheme" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="fontScheme" type="CT_FontScheme" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="fmtScheme" type="CT_StyleMatrix" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // A document whose theme has a green accent and Georgia for headings
 * const doc = new Document({
 *   theme: { colors: { accent1: "2E7D32" }, fonts: { headings: "Georgia" } },
 *   sections: [],
 * });
 * ```
 */
export class Theme extends XmlComponent {
    public constructor({ name = "Office Theme", colors, fonts }: IThemeOptions = {}) {
        super("a:theme");

        this.root.push(
            new NextAttributeComponent<{ readonly namespace: string; readonly name: string }>({
                namespace: { key: "xmlns:a", value: "http://schemas.openxmlformats.org/drawingml/2006/main" },
                name: { key: "name", value: name },
            }),
        );
        this.root.push(
            new BuilderElement({
                name: "a:themeElements",
                children: [
                    // Office's schemes are named "Office". Schemes of your own are named after the theme
                    createColorScheme(colors ? name : "Office", colors),
                    createFontScheme(fonts ? name : "Office", fonts),
                    createFormatScheme(),
                ],
            }),
        );
        this.root.push(new BuilderElement({ name: "a:objectDefaults" }));
        this.root.push(new BuilderElement({ name: "a:extraClrSchemeLst" }));
    }
}
