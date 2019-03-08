// http://officeopenxml.com/WPtableGrid.php
import { XmlComponent } from "file/xml-components";

import { TableGrid } from "./grid";
import { TableCell, WidthType } from "./table-cell";
import { TableColumn } from "./table-column";
import { ITableFloatOptions, TableProperties } from "./table-properties";
import { TableRow } from "./table-row";
/*
    0-width columns don't get rendered correctly, so we need
    to give them some value. A reasonable default would be
    ~6in / numCols, but if we do that it becomes very hard
    to resize the table using setWidth, unless the layout
    algorithm is set to 'fixed'. Instead, the approach here
    means even in 'auto' layout, setting a width on the
    table will make it look reasonable, as the layout
    algorithm will expand columns to fit its content
 */
export interface IWidthOptions {
    readonly width: number;
    readonly type?: WidthType;
}

export class Table extends XmlComponent {
    private readonly properties: TableProperties;
    private readonly rows: TableRow[];

    constructor(
        rowCount: number,
        columnCount: number,
        widthOptions: IWidthOptions = { width: 100, type: WidthType.AUTO },
        colSizes: number[] = Array<number>(columnCount).fill(100),
    ) {
        super("w:tbl");
        this.properties = new TableProperties();
        this.root.push(this.properties);
        this.properties.setBorder();
        this.properties.setWidth(widthOptions.width, widthOptions.type);
        const grid = new TableGrid(colSizes);

        this.root.push(grid);

        this.rows = [];
        for (let i = 0; i < rowCount; i++) {
            const cells = Array<TableCell>(columnCount).fill(new TableCell());
            const row = new TableRow(cells);
            this.rows.push(row);
            this.root.push(row);
        }
    }

    public getRow(index: number): TableRow {
        const row = this.rows[index];

        if (!row) {
            throw Error("Index out of bounds when trying to get row on table");
        }

        return row;
    }

    public getColumn(index: number): TableColumn {
        // This is a convinence method for people who like to work with columns
        const cells = this.rows.map((row) => row.getCell(index));
        return new TableColumn(cells);
    }

    public getCell(row: number, col: number): TableCell {
        return this.getRow(row).getCell(col);
    }

    public setFixedWidthLayout(): Table {
        this.properties.setFixedWidthLayout();
        return this;
    }

    public float(tableFloatOptions: ITableFloatOptions): Table {
        this.properties.setTableFloatProperties(tableFloatOptions);
        return this;
    }
}
