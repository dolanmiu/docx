/**
 * Table module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPtableGrid.php
 *
 * @module
 */
import { Body } from "@file/document/body/body";
import { FileChild } from "@file/file-child";
import type { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

import type { AlignmentType } from "../paragraph";
import { DEFAULT_AVAILABLE_WIDTH, resolveColumnWidths } from "./column-widths";
import { type ITableGridChangeOptions, TableGrid } from "./grid";
import { TableCell, VerticalMergeType } from "./table-cell";
import type { ITableCellSpacingProperties } from "./table-cell-spacing";
import {
    type ITableBordersOptions,
    type ITableFloatOptions,
    type ITablePropertiesChangeOptions,
    TableProperties,
} from "./table-properties";
import type { ITableCellMarginOptions } from "./table-properties/table-cell-margin";
import type { TableLayoutType } from "./table-properties/table-layout";
import type { ITableLookOptions } from "./table-properties/table-look";
import { TableRow } from "./table-row";
import type { ITableWidthProperties } from "./table-width";

/**
 * Options for creating a Table element.
 *
 * @see {@link Table}
 */
export type ITableOptions = {
    readonly rows: readonly TableRow[];
    /** Preferred width of the table. Defaults to auto. */
    readonly width?: ITableWidthProperties;
    /**
     * Widths of the grid columns (`w:tblGrid`) in twips (twentieths of a point).
     *
     * Word treats the grid as a hint and lays the table out from `width` and the cells'
     * widths, but Google Docs, Apple Pages and QuickLook lay the table out from the grid
     * alone and ignore percentage widths. When omitted, the grid is derived from `width`
     * and the cells' widths, resolved against the page (or, for nested tables, the
     * parent cell) when the document is packed, so the table renders the same in every
     * consumer. Supply explicit values to take full control of the grid.
     */
    readonly columnWidths?: readonly number[];
    readonly columnWidthsRevision?: ITableGridChangeOptions;
    readonly margins?: ITableCellMarginOptions;
    readonly indent?: ITableWidthProperties;
    readonly float?: ITableFloatOptions;
    readonly layout?: (typeof TableLayoutType)[keyof typeof TableLayoutType];
    readonly style?: string;
    readonly borders?: ITableBordersOptions;
    readonly alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    readonly visuallyRightToLeft?: boolean;
    readonly tableLook?: ITableLookOptions;
    readonly cellSpacing?: ITableCellSpacingProperties;
    readonly revision?: ITablePropertiesChangeOptions;
};

/**
 * Represents a table in a WordprocessingML document.
 *
 * A table is a set of paragraphs (and other block-level content) arranged in rows and columns.
 * Tables are used to organize content into a grid structure.
 *
 * Reference: http://officeopenxml.com/WPtable.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Tbl">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_RangeMarkupElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="tblPr" type="CT_TblPr"/>
 *     <xsd:element name="tblGrid" type="CT_TblGrid"/>
 *     <xsd:group ref="EG_ContentRowContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Table({
 *   rows: [
 *     new TableRow({
 *       children: [
 *         new TableCell({ children: [new Paragraph("Cell 1")] }),
 *         new TableCell({ children: [new Paragraph("Cell 2")] }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export class Table extends FileChild {
    private readonly rows: readonly TableRow[];
    private readonly width: ITableWidthProperties;
    private readonly columnWidths: readonly number[] | undefined;
    private readonly columnWidthsRevision: ITableGridChangeOptions | undefined;
    /**
     * Grid column widths in twips: the explicit `columnWidths`, or the widths derived
     * from the table and cell widths (re-resolved against the actual page or parent
     * cell every time the table is serialized).
     */
    // eslint-disable-next-line functional/prefer-readonly-type
    private resolvedColumnWidths: readonly number[];

    public constructor({
        rows,
        width,
        columnWidths,
        columnWidthsRevision,
        margins,
        indent,
        float,
        layout,
        style,
        borders,
        alignment,
        visuallyRightToLeft,
        tableLook,
        cellSpacing,
        revision,
    }: ITableOptions) {
        super("w:tbl");

        this.rows = rows;
        this.width = width ?? { size: 100 };
        this.columnWidths = columnWidths;
        this.columnWidthsRevision = columnWidthsRevision;

        rows.forEach((row, rowIndex) => {
            if (rowIndex === rows.length - 1) {
                // don't process the end row
                return;
            }
            let columnIndex = 0;
            row.cells.forEach((cell) => {
                // Row Span has to be added in this method and not the constructor because it needs to know information about the column which happens after Table Cell construction
                // Row Span of 1 will crash word as it will add RESTART and not a corresponding CONTINUE
                if (cell.options.rowSpan && cell.options.rowSpan > 1) {
                    const continueCell = new TableCell({
                        // the inserted CONTINUE cell has rowSpan, and will be handled when process the next row
                        rowSpan: cell.options.rowSpan - 1,
                        columnSpan: cell.options.columnSpan,
                        borders: cell.options.borders,
                        children: [],
                        verticalMerge: VerticalMergeType.CONTINUE,
                    });
                    rows[rowIndex + 1].addCellToColumnIndex(continueCell, columnIndex);
                }
                columnIndex += cell.options.columnSpan || 1;
            });
        });

        // The grid is derived here (against the default page) so that a table formatted
        // on its own is already sensible; it is re-resolved against the real page or
        // parent cell in prepForXml.
        this.resolvedColumnWidths =
            columnWidths ?? resolveColumnWidths({ rows, width: this.width, availableWidth: DEFAULT_AVAILABLE_WIDTH });

        this.root.push(
            new TableProperties({
                borders: borders ?? {},
                width: this.width,
                indent,
                float,
                layout,
                style,
                alignment,
                cellMargin: margins,
                visuallyRightToLeft,
                tableLook,
                cellSpacing,
                revision,
            }),
        );

        this.root.push(new TableGrid(this.resolvedColumnWidths, columnWidthsRevision));

        for (const row of rows) {
            this.root.push(row);
        }
    }

    /**
     * Widths of the grid columns in twips, as they will be written to `w:tblGrid`.
     *
     * These are the explicit `columnWidths` when given, otherwise the widths derived
     * from the table and cell widths. Derived widths are resolved against the page (or
     * the parent cell for nested tables) during serialization, so before that they
     * reflect the default page size.
     */
    public get ColumnWidths(): readonly number[] {
        return this.resolvedColumnWidths;
    }

    /**
     * Width in twips, according to the grid, of a cell in one of this table's rows.
     *
     * Used by nested tables to resolve their own widths against the cell they sit in.
     *
     * @param row - A row of this table
     * @param cell - A cell of that row
     * @returns The summed width of the grid columns the cell spans, or undefined if the cell cannot be located on the grid
     */
    public getCellWidth(row: TableRow, cell: TableCell): number | undefined {
        const { cells } = row;
        const cellIndex = cells.indexOf(cell);
        if (cellIndex === -1) {
            return undefined;
        }

        const start = cells.slice(0, cellIndex).reduce((column, previous) => column + (previous.options.columnSpan || 1), 0);
        const columns = this.resolvedColumnWidths.slice(start, start + (cell.options.columnSpan || 1));
        return columns.length === 0 ? undefined : columns.reduce((sum, columnWidth) => sum + columnWidth, 0);
    }

    /**
     * Resolves derived grid column widths against the width actually available to the
     * table (the section's text width, or the parent cell for nested tables) before
     * serializing.
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.columnWidths === undefined) {
            // eslint-disable-next-line functional/immutable-data
            this.resolvedColumnWidths = resolveColumnWidths({
                rows: this.rows,
                width: this.width,
                availableWidth: this.resolveAvailableWidth(context),
            });
            const gridIndex = this.root.findIndex((component) => component instanceof TableGrid);
            this.root[gridIndex] = new TableGrid(this.resolvedColumnWidths, this.columnWidthsRevision);
        }

        return super.prepForXml(context);
    }

    /**
     * Finds the width in twips available to this table from the serialization context:
     * the parent cell for a nested table, otherwise the text width of the section the
     * table belongs to (the first section for headers, footers and other parts). Falls
     * back to the default page when the context carries no document.
     */
    private resolveAvailableWidth(context: IContext): number {
        const { stack }: { readonly stack: readonly unknown[] } = context;

        // Nested table: a table is a direct child of its cell, so the stack ends with
        // [..., parent Table, TableRow, TableCell]
        const cell = stack[stack.length - 1];
        const row = stack[stack.length - 2];
        const parentTable = stack[stack.length - 3];
        if (cell instanceof TableCell && row instanceof TableRow && parentTable instanceof Table) {
            const cellWidth = parentTable.getCellWidth(row, cell);
            if (cellWidth !== undefined) {
                return cellWidth;
            }
        }

        // Top-level table: the section is found through the body, using the body's direct
        // child that (transitively) contains this table. Headers, footers and other parts
        // are not on the body, so they resolve against the first section.
        const bodyIndex = stack.findIndex((component) => component instanceof Body);
        const documentBody = context.file?.Document?.View.Body;
        const section =
            bodyIndex >= 0
                ? (stack[bodyIndex] as Body).getSectionPropertiesFor((stack[bodyIndex + 1] as XmlComponent | undefined) ?? this)
                : documentBody?.getSectionPropertiesFor();

        return section?.AvailableTextWidth ?? DEFAULT_AVAILABLE_WIDTH;
    }
}
