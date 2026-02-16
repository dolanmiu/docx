/**
 * Table cell spacing module for WordprocessingML documents.
 *
 * This module provides cell spacing settings for tables, controlling
 * the space between cells in a table.
 *
 * Reference: http://officeopenxml.com/WPtableCellSpacing.php
 *
 * @module
 */
import { NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { Percentage, UniversalMeasure, measurementOrPercentValue } from "@util/values";

/**
 * Cell spacing measurement types.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblCellSpacing">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="dxa"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const CellSpacingType = {
    /** Value is in twentieths of a point */
    DXA: "dxa",
    /** No (empty) value. */
    NIL: "nil",
} as const;

/**
 * Properties for table cell spacing.
 *
 * @see {@link TableCellSpacingElement}
 */
export type ITableCellSpacingProperties = {
    /** The spacing value (in twips, percentage, or universal measure) */
    readonly value: number | Percentage | UniversalMeasure;
    /** The type of measurement (defaults to DXA/twips) */
    readonly type?: (typeof CellSpacingType)[keyof typeof CellSpacingType];
};

/**
 * Represents table cell spacing in a WordprocessingML document.
 *
 * The tblCellSpacing element specifies the spacing between cells in a table.
 *
 * Reference: http://officeopenxml.com/WPtableCellSpacing.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblCellSpacing">
 *   <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
 *   <xsd:attribute name="type" type="ST_TblCellSpacing"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCellSpacingElement({ value: 100, type: CellSpacingType.DXA });
 * ```
 */
export class TableCellSpacingElement extends XmlComponent {
    public constructor({ type = CellSpacingType.DXA, value }: ITableCellSpacingProperties) {
        super("w:tblCellSpacing");

        this.root.push(
            new NextAttributeComponent<ITableCellSpacingProperties>({
                type: { key: "w:type", value: type },
                value: { key: "w:w", value: measurementOrPercentValue(value) },
            }),
        );
    }
}
