/**
 * Table cell margin module for WordprocessingML documents.
 *
 * This module provides cell margin settings for tables and individual cells.
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties-Margins.php
 *
 * @module
 */
import { WidthType, createTableWidthElement } from "@file/table";
import { IgnoreIfEmptyXmlComponent } from "@file/xml-components";

/**
 * Options for configuring table cell margins.
 *
 * @see {@link TableCellMargin}
 */
export type ITableCellMarginOptions = {
    /** The unit type for margin values (defaults to DXA/twips) */
    readonly marginUnitType?: (typeof WidthType)[keyof typeof WidthType];
    /** Top margin in specified units */
    readonly top?: number;
    /** Bottom margin in specified units */
    readonly bottom?: number;
    /** Left margin in specified units */
    readonly left?: number;
    /** Right margin in specified units */
    readonly right?: number;
};

/**
 * Element type for table cell margins.
 *
 * Used to differentiate between table-level and cell-level margin elements.
 */
export const TableCellMarginElementType = {
    TABLE: "w:tblCellMar",
    TABLE_CELL: "w:tcMar",
} as const;

/**
 * Represents table cell margins in a WordprocessingML document.
 *
 * The tblCellMar (table level) or tcMar (cell level) element specifies
 * the default cell margins for a table or individual cell.
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties-Margins.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblCellMar">
 *   <xsd:sequence>
 *     <xsd:element name="top" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="start" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="left" type="CT_TblWidth" minOccurs="0"/>
 *     <xsd:element name="bottom" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="end" type="CT_TblWidth" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="right" type="CT_TblWidth" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableCellMargin(TableCellMarginElementType.TABLE, {
 *   top: 100,
 *   bottom: 100,
 *   left: 100,
 *   right: 100,
 * });
 * ```
 */
export class TableCellMargin extends IgnoreIfEmptyXmlComponent {
    public constructor(
        type: (typeof TableCellMarginElementType)[keyof typeof TableCellMarginElementType],
        { marginUnitType = WidthType.DXA, top, left, bottom, right }: ITableCellMarginOptions,
    ) {
        super(type);

        if (top !== undefined) {
            this.root.push(createTableWidthElement("w:top", { type: marginUnitType, size: top }));
        }

        if (left !== undefined) {
            this.root.push(createTableWidthElement("w:left", { type: marginUnitType, size: left }));
        }

        if (bottom !== undefined) {
            this.root.push(createTableWidthElement("w:bottom", { type: marginUnitType, size: bottom }));
        }

        if (right !== undefined) {
            this.root.push(createTableWidthElement("w:right", { type: marginUnitType, size: right }));
        }
    }
}
