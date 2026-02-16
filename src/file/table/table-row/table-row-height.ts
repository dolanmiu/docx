/**
 * Table row height module for WordprocessingML documents.
 *
 * This module provides row height configuration including rules for how height should be applied.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { PositiveUniversalMeasure, twipsMeasureValue } from "@util/values";

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
 * Attributes for table row height element.
 *
 * Internal component for managing trHeight attributes.
 */
export class TableRowHeightAttributes extends XmlAttributeComponent<{
    /** Height value in twips */
    readonly value: number | string;
    /** Height rule determining how the height value is applied */
    readonly rule: (typeof HeightRule)[keyof typeof HeightRule];
}> {
    protected readonly xmlKeys = { value: "w:val", rule: "w:hRule" };
}

/**
 * Represents table row height (trHeight) in a WordprocessingML document.
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
 * new TableRowHeight(1000, HeightRule.EXACT);
 * ```
 */
export class TableRowHeight extends XmlComponent {
    public constructor(value: number | PositiveUniversalMeasure, rule: (typeof HeightRule)[keyof typeof HeightRule]) {
        super("w:trHeight");

        this.root.push(
            new TableRowHeightAttributes({
                value: twipsMeasureValue(value),
                rule: rule,
            }),
        );
    }
}
