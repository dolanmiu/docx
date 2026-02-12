/**
 * Page number module for WordprocessingML section properties.
 *
 * Defines page numbering format and starting value for document sections.
 *
 * Reference: http://officeopenxml.com/WPSectionPgNumType.php
 *
 * @module
 */
import { NumberFormat } from "@file/shared/number-format";
import { BuilderElement, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Specifies the separator character between chapter number and page number.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_ChapterSep">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="hyphen"/>
 *     <xsd:enumeration value="period"/>
 *     <xsd:enumeration value="colon"/>
 *     <xsd:enumeration value="emDash"/>
 *     <xsd:enumeration value="enDash"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const PageNumberSeparator = {
    /** Hyphen separator (-) */
    HYPHEN: "hyphen",
    /** Period separator (.) */
    PERIOD: "period",
    /** Colon separator (:) */
    COLON: "colon",
    /** Em dash separator (—) */
    EM_DASH: "emDash",
    /** En dash separator (–) */
    EN_DASH: "endash",
} as const;

/**
 * Options for configuring page numbering.
 *
 * @property start - Starting page number for the section
 * @property formatType - Number format (decimal, roman, letter, etc.)
 * @property separator - Separator between chapter and page number
 */
export type IPageNumberTypeAttributes = {
    /** Starting page number for the section */
    readonly start?: number;
    /** Number format (decimal, roman, letter, etc., default: decimal) */
    readonly formatType?: (typeof NumberFormat)[keyof typeof NumberFormat];
    /** Separator between chapter and page number (default: hyphen) */
    readonly separator?: (typeof PageNumberSeparator)[keyof typeof PageNumberSeparator];
};

/**
 * Creates page numbering settings (pgNumType) for a document section.
 *
 * This element specifies the page numbering format and starting value
 * for all pages in a section.
 *
 * Reference: http://officeopenxml.com/WPSectionPgNumType.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PageNumber">
 *   <xsd:attribute name="fmt" type="ST_NumberFormat" use="optional" default="decimal"/>
 *   <xsd:attribute name="start" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="chapStyle" type="ST_DecimalNumber" use="optional"/>
 *   <xsd:attribute name="chapSep" type="ST_ChapterSep" use="optional" default="hyphen"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Start page numbering at 5 with lowercase roman numerals
 * createPageNumberType({
 *   start: 5,
 *   formatType: NumberFormat.LOWER_ROMAN
 * });
 * ```
 */
export const createPageNumberType = ({ start, formatType, separator }: IPageNumberTypeAttributes): XmlComponent =>
    new BuilderElement<IPageNumberTypeAttributes>({
        name: "w:pgNumType",
        attributes: {
            start: { key: "w:start", value: start === undefined ? undefined : decimalNumber(start) },
            formatType: { key: "w:fmt", value: formatType },
            separator: { key: "w:chapSep", value: separator },
        },
    });
