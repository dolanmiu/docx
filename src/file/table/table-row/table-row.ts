import { HeightRule } from "file/table/table-row/table-row-height";
import { XmlComponent } from "file/xml-components";
import { TableCell } from "../table-cell";
import { TableRowProperties } from "./table-row-properties";

export interface ITableRowOptions {
    readonly cantSplit?: boolean;
    readonly tableHeader?: boolean;
    readonly height?: {
        readonly value: number;
        readonly rule: HeightRule;
    };
    readonly children: TableCell[];
}

export class TableRow extends XmlComponent {
    private readonly properties: TableRowProperties;

    constructor(private readonly options: ITableRowOptions) {
        super("w:tr");
        this.properties = new TableRowProperties();
        this.root.push(this.properties);

        for (const child of options.children) {
            this.root.push(child);
        }

        if (options.cantSplit) {
            this.properties.setCantSplit();
        }

        if (options.tableHeader) {
            this.properties.setTableHeader();
        }

        if (options.height) {
            this.properties.setHeight(options.height.value, options.height.rule);
        }
    }

    public get CellCount(): number {
        return this.options.children.length;
    }

    public get cells(): TableCell[] {
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
