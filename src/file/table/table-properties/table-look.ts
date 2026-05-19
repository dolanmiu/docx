/**
 * Table look module for WordprocessingML documents.
 *
 * Table look specifies conditional formatting settings that determine which
 * special formatting is applied to a table. These settings control whether
 * special formatting is applied to the first row, last row, first column,
 * last column, and whether to display horizontal or vertical banding.
 *
 * Reference: http://officeopenxml.com/WPtblLook.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblLook">
 *   <xsd:attribute name="firstRow" type="s:ST_OnOff"/>
 *   <xsd:attribute name="lastRow" type="s:ST_OnOff"/>
 *   <xsd:attribute name="firstColumn" type="s:ST_OnOff"/>
 *   <xsd:attribute name="lastColumn" type="s:ST_OnOff"/>
 *   <xsd:attribute name="noHBand" type="s:ST_OnOff"/>
 *   <xsd:attribute name="noVBand" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Options for configuring table look conditional formatting.
 *
 * These options control which conditional formatting styles are applied
 * to the table. When a table style defines special formatting for these
 * regions (e.g., bold headers, alternating row colors), these flags
 * determine whether that special formatting is visible.
 *
 * @example
 * ```typescript
 * // Apply header row and first column formatting with horizontal banding
 * const tableLook: ITableLookOptions = {
 *   firstRow: true,      // Apply header row formatting
 *   firstColumn: true,   // Apply first column formatting
 *   noHBand: false,      // Enable horizontal row banding
 *   noVBand: true,       // Disable vertical column banding
 * };
 * ```
 */
export type ITableLookOptions = {
    /**
     * Apply first row conditional formatting.
     * When true, the first row of the table uses the special formatting
     * defined for header rows in the table style.
     */
    readonly firstRow?: boolean;

    /**
     * Apply last row conditional formatting.
     * When true, the last row of the table uses the special formatting
     * defined for total/footer rows in the table style.
     */
    readonly lastRow?: boolean;

    /**
     * Apply first column conditional formatting.
     * When true, the first column of the table uses the special formatting
     * defined for first columns in the table style.
     */
    readonly firstColumn?: boolean;

    /**
     * Apply last column conditional formatting.
     * When true, the last column of the table uses the special formatting
     * defined for last columns in the table style.
     */
    readonly lastColumn?: boolean;

    /**
     * Disable horizontal row banding.
     * When true, horizontal banding (alternating row colors) is disabled.
     * When false or undefined, horizontal banding is enabled if defined in the table style.
     */
    readonly noHBand?: boolean;

    /**
     * Disable vertical column banding.
     * When true, vertical banding (alternating column colors) is disabled.
     * When false or undefined, vertical banding is enabled if defined in the table style.
     */
    readonly noVBand?: boolean;
};

/**
 * Creates a table look element for conditional formatting settings.
 *
 * The tblLook element specifies which conditional formatting settings
 * are active for a table. These settings work in conjunction with table
 * styles to apply special formatting to specific regions of the table.
 *
 * Reference: http://officeopenxml.com/WPtblLook.php
 *
 * @example
 * ```typescript
 * // Table with header row formatting and alternating row colors
 * new Table({
 *   rows: [...],
 *   tableLook: {
 *     firstRow: true,
 *     noHBand: false,
 *     noVBand: true,
 *   },
 * });
 * ```
 */
export const createTableLook = ({ firstRow, lastRow, firstColumn, lastColumn, noHBand, noVBand }: ITableLookOptions): XmlComponent =>
    new BuilderElement<ITableLookOptions>({
        name: "w:tblLook",
        attributes: {
            firstRow: { key: "w:firstRow", value: firstRow },
            lastRow: { key: "w:lastRow", value: lastRow },
            firstColumn: { key: "w:firstColumn", value: firstColumn },
            lastColumn: { key: "w:lastColumn", value: lastColumn },
            noHBand: { key: "w:noHBand", value: noHBand },
            noVBand: { key: "w:noVBand", value: noVBand },
        },
    });
