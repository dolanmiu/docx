/**
 * Scheme color element for DrawingML shapes.
 *
 * This module provides scheme-based color support for solid fills,
 * allowing colors to be defined using theme color schemes.
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for scheme color.
 */
type SchemeColorOptions = {
    /** Scheme color value */
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

// <xsd:simpleType name="ST_SchemeColorVal">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="bg1"/>
//         <xsd:enumeration value="tx1"/>
//         <xsd:enumeration value="bg2"/>
//         <xsd:enumeration value="tx2"/>
//         <xsd:enumeration value="accent1"/>
//         <xsd:enumeration value="accent2"/>
//         <xsd:enumeration value="accent3"/>
//         <xsd:enumeration value="accent4"/>
//         <xsd:enumeration value="accent5"/>
//         <xsd:enumeration value="accent6"/>
//         <xsd:enumeration value="hlink"/>
//         <xsd:enumeration value="folHlink"/>
//         <xsd:enumeration value="dk1"/>
//         <xsd:enumeration value="lt1"/>
//         <xsd:enumeration value="dk2"/>
//         <xsd:enumeration value="lt2"/>
//         <xsd:enumeration value="phClr"/>
//     </xsd:restriction>
// </xsd:simpleType>

// cspell:ignore folHlink, phClr, hlink

/**
 * Scheme color values for theme-based colors.
 *
 * These values reference colors defined in the document's color scheme/theme.
 */
export const SchemeColor = {
    /** Background color 1 */
    BG1: "bg1",
    /** Text color 1 */
    TX1: "tx1",
    /** Background color 2 */
    BG2: "bg2",
    /** Text color 2 */
    TX2: "tx2",
    /** Accent color 1 */
    ACCENT1: "accent1",
    /** Accent color 2 */
    ACCENT2: "accent2",
    /** Accent color 3 */
    ACCENT3: "accent3",
    /** Accent color 4 */
    ACCENT4: "accent4",
    /** Accent color 5 */
    ACCENT5: "accent5",
    /** Accent color 6 */
    ACCENT6: "accent6",
    /** Hyperlink color */
    HLINK: "hlink",
    /** Followed hyperlink color */
    FOLHLINK: "folHlink",
    /** Dark color 1 */
    DK1: "dk1",
    /** Light color 1 */
    LT1: "lt1",
    /** Dark color 2 */
    DK2: "dk2",
    /** Light color 2 */
    LT2: "lt2",
    /** Placeholder color */
    PHCLR: "phClr",
} as const;

// <xsd:complexType name="CT_SchemeColor">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
// </xsd:complexType>

/**
 * Creates a scheme color element.
 *
 * Specifies a color using a theme color scheme reference.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SchemeColor">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="val" type="ST_SchemeColorVal" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const accentColor = createSchemeColor({ value: SchemeColor.ACCENT1 });
 * const bgColor = createSchemeColor({ value: SchemeColor.BG1 });
 * ```
 */
export const createSchemeColor = (options: SchemeColorOptions): XmlComponent =>
    new BuilderElement<SchemeColorOptions>({
        name: "a:schemeClr",
        attributes: {
            value: {
                key: "val",
                value: options.value,
            },
        },
    });
