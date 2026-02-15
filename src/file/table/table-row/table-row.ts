/**
 * Table row module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { TableCell } from "../table-cell";
import { ITableRowPropertiesOptions, TableRowProperties } from "./table-row-properties";

/**
 * Options for creating a TableRow element.
 *
 * @see {@link TableRow}
 */
export type ITableRowOptions = {
    /** Array of TableCell elements that make up the row */
    readonly children: readonly TableCell[];
} & ITableRowPropertiesOptions;

/**
 * Represents a table row in a WordprocessingML document.
 *
 * A table row is a single row of cells within a table. Each row contains
 * one or more table cells that hold the actual content.
 *
 * Reference: http://officeopenxml.com/WPtableRow.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Row">
 *   <xsd:sequence>
 *     <xsd:element name="tblPrEx" type="CT_TblPrEx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_ContentCellContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidTr" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableRow({
 *   children: [
 *     new TableCell({ children: [new Paragraph("Cell 1")] }),
 *     new TableCell({ children: [new Paragraph("Cell 2")] }),
 *   ],
 * });
 * ```
 */
export class TableRow extends XmlComponent {
    public constructor(private readonly options: ITableRowOptions) {
        super("w:tr");
        this.root.push(new TableRowProperties(options));

        for (const child of options.children) {
            this.root.push(child);
        }
    }

    public get CellCount(): number {
        return this.options.children.length;
    }

    public get cells(): readonly TableCell[] {
        return this.root.filter((xmlComponent) => xmlComponent instanceof TableCell);
    }

    public addCellToIndex(cell: TableCell, index: number): void {
        // Offset because properties is also in root.
        this.root.splice(index + 1, 0, cell);
    }

    public addCellToColumnIndex(cell: TableCell, columnIndex: number): void {
        const rootIndex = this.columnIndexToRootIndex(columnIndex, true);
        this.addCellToIndex(cell, rootIndex - 1);
    }

    public rootIndexToColumnIndex(rootIndex: number): number {
        // convert the root index to the virtual column index
        if (rootIndex < 1 || rootIndex >= this.root.length) {
            throw new Error(`cell 'rootIndex' should between 1 to ${this.root.length - 1}`);
        }
        let colIdx = 0;
        // Offset because properties is also in root.
        for (let rootIdx = 1; rootIdx < rootIndex; rootIdx++) {
            const cell = this.root[rootIdx] as TableCell;
            colIdx += cell.options.columnSpan || 1;
        }
        return colIdx;
    }

    public columnIndexToRootIndex(columnIndex: number, allowEndNewCell: boolean = false): number {
        // convert the virtual column index to the root index
        // `allowEndNewCell` for get index to inert new cell
        if (columnIndex < 0) {
            throw new Error(`cell 'columnIndex' should not less than zero`);
        }
        let colIdx = 0;
        // Offset because properties is also in root.
        let rootIdx = 1;
        while (colIdx <= columnIndex) {
            if (rootIdx >= this.root.length) {
                if (allowEndNewCell) {
                    // for inserting verticalMerge CONTINUE cell at end of row
                    return this.root.length;
                } else {
                    throw new Error(`cell 'columnIndex' should not great than ${colIdx - 1}`);
                }
            }
            const cell = this.root[rootIdx] as TableCell;
            rootIdx += 1;
            colIdx += (cell && cell.options.columnSpan) || 1;
        }
        return rootIdx - 1;
    }
}
