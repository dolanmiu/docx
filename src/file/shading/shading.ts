/**
 * Shading module for WordprocessingML documents.
 *
 * Shading is used to apply background colors and patterns to paragraphs,
 * table cells, and text runs. The shading type is identical in all places.
 *
 * Reference: http://officeopenxml.com/WPshading.php
 *
 * @see http://officeopenxml.com/WPtableShading.php
 * @see http://officeopenxml.com/WPtableCellProperties-Shading.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Shd">
 *   <xsd:attribute name="val" type="ST_Shd" use="required"/>
 *   <xsd:attribute name="color" type="ST_HexColor" use="optional"/>
 *   <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="fill" type="ST_HexColor" use="optional"/>
 *   <xsd:attribute name="themeFill" type="ST_ThemeColor" use="optional"/>
 *   <xsd:attribute name="themeFillTint" type="ST_UcharHexNumber" use="optional"/>
 *   <xsd:attribute name="themeFillShade" type="ST_UcharHexNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

/**
 * Properties for configuring shading.
 *
 * @property fill - Background fill color in hex format (e.g., "FF0000" for red)
 * @property color - Pattern color in hex format
 * @property type - Shading pattern type
 */
export type IShadingAttributesProperties = {
    readonly fill?: string;
    readonly color?: string;
    readonly type?: (typeof ShadingType)[keyof typeof ShadingType];
};

/**
 * Creates a shading element for a WordprocessingML document.
 *
 * The shd element specifies the shading applied to the paragraph,
 * table cell, or text run.
 *
 * Reference: http://officeopenxml.com/WPshading.php
 */
export const createShading = ({ fill, color, type }: IShadingAttributesProperties): XmlComponent =>
    new BuilderElement<IShadingAttributesProperties>({
        name: "w:shd",
        attributes: {
            fill: { key: "w:fill", value: fill === undefined ? undefined : hexColorValue(fill) },
            color: { key: "w:color", value: color === undefined ? undefined : hexColorValue(color) },
            type: { key: "w:val", value: type },
        },
    });

/**
 * Shading pattern types.
 *
 * Specifies the pattern used for shading. The pattern combines the fill
 * color and the pattern color.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Shd">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="clear"/>
 *     <xsd:enumeration value="solid"/>
 *     <xsd:enumeration value="horzStripe"/>
 *     <xsd:enumeration value="vertStripe"/>
 *     <xsd:enumeration value="reverseDiagStripe"/>
 *     <xsd:enumeration value="diagStripe"/>
 *     <xsd:enumeration value="horzCross"/>
 *     <xsd:enumeration value="diagCross"/>
 *     <!-- ... percent values ... -->
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const ShadingType = {
    /** Clear shading - no pattern, fill color only */
    CLEAR: "clear",
    DIAGONAL_CROSS: "diagCross",
    DIAGONAL_STRIPE: "diagStripe",
    HORIZONTAL_CROSS: "horzCross",
    HORIZONTAL_STRIPE: "horzStripe",
    NIL: "nil",
    PERCENT_5: "pct5",
    PERCENT_10: "pct10",
    PERCENT_12: "pct12",
    PERCENT_15: "pct15",
    PERCENT_20: "pct20",
    PERCENT_25: "pct25",
    PERCENT_30: "pct30",
    PERCENT_35: "pct35",
    PERCENT_37: "pct37",
    PERCENT_40: "pct40",
    PERCENT_45: "pct45",
    PERCENT_50: "pct50",
    PERCENT_55: "pct55",
    PERCENT_60: "pct60",
    PERCENT_62: "pct62",
    PERCENT_65: "pct65",
    PERCENT_70: "pct70",
    PERCENT_75: "pct75",
    PERCENT_80: "pct80",
    PERCENT_85: "pct85",
    PERCENT_87: "pct87",
    PERCENT_90: "pct90",
    PERCENT_95: "pct95",
    REVERSE_DIAGONAL_STRIPE: "reverseDiagStripe",
    SOLID: "solid",
    THIN_DIAGONAL_CROSS: "thinDiagCross",
    THIN_DIAGONAL_STRIPE: "thinDiagStripe",
    THIN_HORIZONTAL_CROSS: "thinHorzCross",
    THIN_REVERSE_DIAGONAL_STRIPE: "thinReverseDiagStripe",
    THIN_VERTICAL_STRIPE: "thinVertStripe",
    VERTICAL_STRIPE: "vertStripe",
} as const;
