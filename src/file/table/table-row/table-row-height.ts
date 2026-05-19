/**
 * Table row height module for WordprocessingML documents.
 *
 * This module provides row height configuration including rules for how height should be applied.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { type PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

/**
 * Height rules for table rows.
 *
 * Specifies how the height value should be interpreted.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HeightRule">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="auto"/>
 *     <xsd:enumeration value="exact"/>
 *     <xsd:enumeration value="atLeast"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const HeightRule = {
    /** Height is determined based on the content, so value is ignored. */
    AUTO: "auto",
    /** At least the value specified */
    ATLEAST: "atLeast",
    /** Exactly the value specified */
    EXACT: "exact",
} as const;

/**
 * Creates table row height (trHeight) in a WordprocessingML document.
 *
 * The trHeight element specifies the height of a table row, along with a rule
 * determining how the height should be applied.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Height">
 *   <xsd:attribute name="val" type="s:ST_TwipsMeasure"/>
 *   <xsd:attribute name="hRule" type="ST_HeightRule"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createTableRowHeight(1000, HeightRule.EXACT);
 * ```
 */
export const createTableRowHeight = (
    value: number | PositiveUniversalMeasure,
    rule: (typeof HeightRule)[keyof typeof HeightRule],
): XmlComponent =>
    new BuilderElement<{
        readonly value: number | string;
        readonly rule: (typeof HeightRule)[keyof typeof HeightRule];
    }>({
        name: "w:trHeight",
        attributes: {
            value: { key: "w:val", value: twipsMeasureValue(value) },
            rule: { key: "w:hRule", value: rule },
        },
    });
