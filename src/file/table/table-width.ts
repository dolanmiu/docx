/**
 * Table width module for WordprocessingML documents.
 *
 * This module provides width specifications for tables and cells.
 *
 * Reference: http://officeopenxml.com/WPtableWidth.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { type Percentage, type UniversalMeasure, measurementOrPercentValue } from "@util/values";

/**
 * Width type values for tables and cells.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblWidth">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="nil"/>
 *     <xsd:enumeration value="pct"/>
 *     <xsd:enumeration value="dxa"/>
 *     <xsd:enumeration value="auto"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
 */
export const WidthType = {
    /** Auto. */
    AUTO: "auto",
    /** Value is in twentieths of a point */
    DXA: "dxa",
    /** No (empty) value. */
    NIL: "nil",
    /** Value is in percentage. */
    PERCENTAGE: "pct",
} as const;

/**
 * Properties for specifying table or cell width.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblWidth">
 *   <xsd:attribute name="w" type="ST_MeasurementOrPercent"/>
 *   <xsd:attribute name="type" type="ST_TblWidth"/>
 * </xsd:complexType>
 * ```
 */
export type ITableWidthProperties = {
    readonly size: number | Percentage | UniversalMeasure;
    readonly type?: (typeof WidthType)[keyof typeof WidthType];
};

/**
 * Creates a table width element in a WordprocessingML document.
 *
 * Used for specifying widths of tables, cells, margins, and indentation.
 *
 * Reference: http://officeopenxml.com/WPtableWidth.php
 *
 * @example
 * ```typescript
 * createTableWidthElement("w:tblW", { size: 5000, type: WidthType.DXA });
 * createTableWidthElement("w:tcW", { size: 50, type: WidthType.PERCENTAGE });
 * ```
 */
export const createTableWidthElement = (name: string, { type = WidthType.AUTO, size }: ITableWidthProperties): XmlComponent => {
    let tableWidthValue = size;
    if (type === WidthType.PERCENTAGE && typeof size === "number") {
        tableWidthValue = `${size}%`;
    }

    return new BuilderElement<ITableWidthProperties>({
        name,
        attributes: {
            type: { key: "w:type", value: type },
            size: { key: "w:w", value: measurementOrPercentValue(tableWidthValue) },
        },
    });
};
