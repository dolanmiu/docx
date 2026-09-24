/**
 * Document background module for WordprocessingML documents.
 *
 * This module provides functionality for setting document background colors,
 * in hex or in a color of the document's theme.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * @module
 */
import { COLOR_ATTRIBUTES, ColorAttributeComponent, type ThemeColor } from "@file/theme/theme-color";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { uCharHexNumber } from "@util/values";

/**
 * Attributes for the document background element.
 *
 * ## XSD Schema (ST_ThemeColor)
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
 * @internal
 */
export class DocumentBackgroundAttributes extends XmlAttributeComponent<{
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}> {
    protected readonly xmlKeys = {
        color: "w:color",
        themeColor: "w:themeColor",
        themeShade: "w:themeShade",
        themeTint: "w:themeTint",
    };
}

/**
 * Options for creating a document background.
 *
 * @see {@link DocumentBackground}
 */
export type IDocumentBackgroundOptions = {
    /**
     * Background color: a hex color such as `"FF0000"`, or a color of the document's theme such as
     * `{ theme: "accent1", lighter: 80 }`
     */
    readonly color?: string | ThemeColor;
    /**
     * Theme color name (e.g., "accent1", "dark1")
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1" }`
     */
    readonly themeColor?: string;
    /**
     * Theme shade value (darkens the theme color)
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1", darker: 25 }`
     */
    readonly themeShade?: string;
    /**
     * Theme tint value (lightens the theme color)
     *
     * @deprecated Give `color` a theme color instead, such as `{ theme: "accent1", lighter: 40 }`
     */
    readonly themeTint?: string;
};

/**
 * Represents a document background in a WordprocessingML document.
 *
 * The background element specifies the background color or theme color
 * for the document.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Background">
 *   <xsd:sequence>
 *     <xsd:sequence maxOccurs="unbounded">
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0" maxOccurs="unbounded"/>
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office" minOccurs="0" maxOccurs="unbounded"/>
 *     </xsd:sequence>
 *     <xsd:element name="drawing" type="CT_Drawing" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="color" type="ST_HexColor" use="optional" default="auto"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new DocumentBackground({ color: "FFFF00" }); // Yellow background
 * new DocumentBackground({ color: { theme: "accent1", lighter: 80 } }); // A light version of the theme's first accent color
 * ```
 */
export class DocumentBackground extends XmlComponent {
    /**
     * @throws If a color isn't valid, or `color` is a theme color and `themeColor`, `themeShade` or `themeTint` is given
     */
    public constructor({ color, themeColor, themeShade, themeTint }: IDocumentBackgroundOptions) {
        super("w:background");

        if (typeof color === "object" && (themeColor !== undefined || themeShade !== undefined || themeTint !== undefined)) {
            throw new Error("Invalid background. Expected a theme color in color, or themeColor, themeShade and themeTint, not both");
        }

        this.root.push(
            new ColorAttributeComponent([
                { keys: COLOR_ATTRIBUTES, color },
                { key: "w:themeColor", value: themeColor },
                { key: "w:themeShade", value: themeShade === undefined ? undefined : uCharHexNumber(themeShade) },
                { key: "w:themeTint", value: themeTint === undefined ? undefined : uCharHexNumber(themeTint) },
            ]),
        );
    }
}
