/**
 * Document background module for WordprocessingML documents.
 *
 * This module provides functionality for setting document background colors
 * and theme-based backgrounds.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { hexColorValue, uCharHexNumber } from "@util/values";

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
    /** Background color in hex format (e.g., "FF0000" for red) */
    readonly color?: string;
    /** Theme color name (e.g., "accent1", "dark1") */
    readonly themeColor?: string;
    /** Theme shade value (darkens the theme color) */
    readonly themeShade?: string;
    /** Theme tint value (lightens the theme color) */
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
 * new DocumentBackground({ themeColor: "accent1" }); // Theme accent color
 * ```
 */
export class DocumentBackground extends XmlComponent {
    public constructor(options: IDocumentBackgroundOptions) {
        super("w:background");

        this.root.push(
            new DocumentBackgroundAttributes({
                color: options.color === undefined ? undefined : hexColorValue(options.color),
                themeColor: options.themeColor,
                themeShade: options.themeShade === undefined ? undefined : uCharHexNumber(options.themeShade),
                themeTint: options.themeTint === undefined ? undefined : uCharHexNumber(options.themeTint),
            }),
        );
    }
}
