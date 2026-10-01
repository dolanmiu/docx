/**
 * Page number module for WordprocessingML section properties.
 *
 * Defines page numbering format and starting value for document sections.
 *
 * Reference: http://officeopenxml.com/WPSectionPgNumType.php
 *
 * @module
 */
import type { NumberFormat } from "@file/shared/number-format";
import { BuilderElement, type XmlComponent } from "@file/xml-components";
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
 *
 * @publicApi
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
    /** En dash separator (–), written as `enDash` */
    EN_DASH: "endash",
} as const;

/**
 * Options for configuring page numbering.
 *
 * @property start - Starting page number for the section
 * @property formatType - Number format (decimal, roman, letter, etc.)
 * @property separator - Separator between chapter and page number
 * @property chapterHeadingLevel - The level of the headings whose numbers are the chapter numbers
 */
export type IPageNumberTypeAttributes = {
    /** Starting page number for the section */
    readonly start?: number;
    /** Number format (decimal, roman, letter, etc., default: decimal) */
    readonly formatType?: (typeof NumberFormat)[keyof typeof NumberFormat];
    /** Separator between chapter and page number (default: hyphen) */
    readonly separator?: (typeof PageNumberSeparator)[keyof typeof PageNumberSeparator];
    /**
     * Puts the chapter number before each page number, such as "2-5" for page 5 of chapter 2. The chapter number is the
     * number of the last heading of this level (1 to 9, for `HeadingLevel.HEADING_1` to `HEADING_9`), so those headings
     * must be numbered through their style (`w:chapStyle`)
     */
    readonly chapterHeadingLevel?: number;
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
export const createPageNumberType = ({ start, formatType, separator, chapterHeadingLevel }: IPageNumberTypeAttributes): XmlComponent =>
    new BuilderElement<Omit<IPageNumberTypeAttributes, "separator"> & { readonly separator?: string }>({
        name: "w:pgNumType",
        attributes: {
            start: { key: "w:start", value: start === undefined ? undefined : decimalNumber(start) },
            formatType: { key: "w:fmt", value: formatType },
            // The schema's name for an en dash is enDash, which EN_DASH has been spelled differently from
            separator: { key: "w:chapSep", value: separator === PageNumberSeparator.EN_DASH ? "enDash" : separator },
            chapterHeadingLevel: {
                key: "w:chapStyle",
                value: chapterHeadingLevel === undefined ? undefined : decimalNumber(chapterHeadingLevel),
            },
        },
    });
