/**
 * Section type module for WordprocessingML section properties.
 *
 * Defines how a section begins relative to the previous section.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Specifies the type of section break.
 *
 * This determines where the section begins relative to the previous section.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_SectionMark">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nextPage"/>
 *     <xsd:enumeration value="nextColumn"/>
 *     <xsd:enumeration value="continuous"/>
 *     <xsd:enumeration value="evenPage"/>
 *     <xsd:enumeration value="oddPage"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const SectionType = {
    /** Section begins on the next page */
    NEXT_PAGE: "nextPage",
    /** Section begins on the next column */
    NEXT_COLUMN: "nextColumn",
    /** Section begins immediately following the previous section */
    CONTINUOUS: "continuous",
    /** Section begins on the next even-numbered page */
    EVEN_PAGE: "evenPage",
    /** Section begins on the next odd-numbered page */
    ODD_PAGE: "oddPage",
} as const;

type ISectionTypeAttributes = {
    readonly val: (typeof SectionType)[keyof typeof SectionType];
};

/**
 * Creates section type (type) for a document section.
 *
 * This element specifies the type of section break, which determines
 * where the new section begins relative to the previous section.
 *
 * Reference: http://officeopenxml.com/WPsection.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SectType">
 *   <xsd:attribute name="val" type="ST_SectionMark"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a continuous section (no page break)
 * createSectionType(SectionType.CONTINUOUS);
 *
 * // Create a section that starts on next odd page
 * createSectionType(SectionType.ODD_PAGE);
 * ```
 */
export const createSectionType = (value: (typeof SectionType)[keyof typeof SectionType]): XmlComponent =>
    new BuilderElement<ISectionTypeAttributes>({
        name: "w:type",
        attributes: {
            val: { key: "w:val", value: value },
        },
    });
