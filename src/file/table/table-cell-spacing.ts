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
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { type Percentage, type UniversalMeasure, measurementOrPercentValue } from "@util/values";

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
 * @see {@link createTableCellSpacing}
 */
export type ITableCellSpacingProperties = {
    /** The spacing value (in twips, percentage, or universal measure) */
    readonly value: number | Percentage | UniversalMeasure;
    /** The type of measurement (defaults to DXA/twips) */
    readonly type?: (typeof CellSpacingType)[keyof typeof CellSpacingType];
};

/**
 * Creates table cell spacing in a WordprocessingML document.
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
 * createTableCellSpacing({ value: 100, type: CellSpacingType.DXA });
 * ```
 */
export const createTableCellSpacing = ({ type = CellSpacingType.DXA, value }: ITableCellSpacingProperties): XmlComponent =>
    new BuilderElement<ITableCellSpacingProperties>({
        name: "w:tblCellSpacing",
        attributes: {
            type: { key: "w:type", value: type },
            value: { key: "w:w", value: measurementOrPercentValue(value) },
        },
    });
