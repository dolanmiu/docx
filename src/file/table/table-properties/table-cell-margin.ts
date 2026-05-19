/**
 * Table cell margin module for WordprocessingML documents.
 *
 * This module provides cell margin settings for tables and individual cells.
 * Margins define the padding between cell content and cell borders.
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
 * @module
 */
import { WidthType, createTableWidthElement } from "@file/table";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Options for configuring table cell margins.
 *
 * All margin values are specified in the units defined by `marginUnitType`.
 * If `marginUnitType` is not specified, values are in DXA (twentieths of a point).
 *
 * @example
 * ```typescript
 * // Set uniform margins of 100 twips on all sides
 * const margins: ITableCellMarginOptions = {
 *   top: 100,
 *   bottom: 100,
 *   left: 100,
 *   right: 100,
 * };
 *
 * // Set margins using percentage-based width
 * const percentMargins: ITableCellMarginOptions = {
 *   marginUnitType: WidthType.PERCENTAGE,
 *   left: 5,
 *   right: 5,
 * };
 * ```
 */
export type ITableCellMarginOptions = {
    /**
     * The unit type for margin values.
     * Defaults to DXA (twentieths of a point) if not specified.
     *
     * @default WidthType.DXA
     */
    readonly marginUnitType?: (typeof WidthType)[keyof typeof WidthType];

    /**
     * Top margin (padding above cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly top?: number;

    /**
     * Bottom margin (padding below cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly bottom?: number;

    /**
     * Left margin (padding to the left of cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly left?: number;

    /**
     * Right margin (padding to the right of cell content).
     * Value is in units specified by `marginUnitType`.
     */
    readonly right?: number;
};

/**
 * Builds an array of margin child elements based on the provided options.
 *
 * @internal
 */
const buildMarginChildren = ({
    marginUnitType = WidthType.DXA,
    top,
    left,
    bottom,
    right,
}: ITableCellMarginOptions): readonly XmlComponent[] =>
    (
        [
            { name: "w:top", size: top },
            { name: "w:left", size: left },
            { name: "w:bottom", size: bottom },
            { name: "w:right", size: right },
        ] as const
    )
        .filter((entry): entry is { readonly name: typeof entry.name; readonly size: number } => entry.size !== undefined)
        .map(({ name, size }) => createTableWidthElement(name, { type: marginUnitType, size }));

/**
 * Creates a table-level cell margin element (tblCellMar).
 *
 * The tblCellMar element specifies the default cell margins for all cells
 * in the table. Individual cells can override these defaults using
 * cell-level margins (tcMar).
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties-Margins.php
 *
 * @param options - The margin options
 * @returns An XmlComponent representing the tblCellMar element, or undefined if no margins specified
 *
 * @example
 * ```typescript
 * // Table with 100 twip margins on all sides
 * new Table({
 *   rows: [...],
 *   margins: {
 *     top: 100,
 *     bottom: 100,
 *     left: 100,
 *     right: 100,
 *   },
 * });
 * ```
 */
export const createTableCellMargin = (options: ITableCellMarginOptions): XmlComponent | undefined => {
    const children = buildMarginChildren(options);

    if (children.length === 0) {
        return undefined;
    }

    return new BuilderElement({
        name: "w:tblCellMar",
        children,
    });
};

/**
 * Creates a cell-level margin element (tcMar).
 *
 * The tcMar element specifies the margins for a specific table cell,
 * overriding any table-level default margins (tblCellMar).
 *
 * Reference: http://officeopenxml.com/WPtableCellProperties-Margins.php
 *
 * @param options - The margin options
 * @returns An XmlComponent representing the tcMar element, or undefined if no margins specified
 *
 * @example
 * ```typescript
 * // Cell with custom margins
 * new TableCell({
 *   children: [...],
 *   margins: {
 *     top: 50,
 *     bottom: 50,
 *     left: 100,
 *     right: 100,
 *   },
 * });
 * ```
 */
export const createCellMargin = (options: ITableCellMarginOptions): XmlComponent | undefined => {
    const children = buildMarginChildren(options);

    if (children.length === 0) {
        return undefined;
    }

    return new BuilderElement({
        name: "w:tcMar",
        children,
    });
};
