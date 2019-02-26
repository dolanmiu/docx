// http://officeopenxml.com/WPtableGrid.php
import { XmlComponent } from "file/xml-components";

import { TableGrid } from "./grid";
import { TableCell, WidthType } from "./table-cell";
import { ITableFloatOptions, TableProperties } from "./table-properties";
import { TableRow } from "./table-row";

export class Table extends XmlComponent {
    private readonly properties: TableProperties;
    private readonly rows: TableRow[];
    private readonly grid: TableGrid;

    constructor(rows: number, cols: number, colSizes?: number[]) {
        super("w:tbl");
        this.properties = new TableProperties();
        this.root.push(this.properties);
        this.properties.setBorder();

        if (colSizes && colSizes.length > 0) {
            this.grid = new TableGrid(colSizes);
        } else {
            const gridCols: number[] = [];
            for (let i = 0; i < cols; i++) {
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
                gridCols.push(100);
            }
            this.grid = new TableGrid(gridCols);
        }

        this.root.push(this.grid);

        this.rows = [];
        for (let i = 0; i < rows; i++) {
            const cells: TableCell[] = [];
            for (let j = 0; j < cols; j++) {
                cells.push(new TableCell());
            }
            const row = new TableRow(cells);
            this.rows.push(row);
            this.root.push(row);
        }
    }

    public getRow(ix: number): TableRow {
        const row = this.rows[ix];

        if (!row) {
            throw Error("Index out of bounds when trying to get row on table");
        }

        return row;
    }

    public getCell(row: number, col: number): TableCell {
        return this.getRow(row).getCell(col);
    }

    public setWidth(type: WidthType, width: number | string): Table {
        this.properties.setWidth(type, width);
        return this;
    }

    public setFixedWidthLayout(): Table {
        this.properties.setFixedWidthLayout();
        return this;
    }

    public float(tableFloatOptions: ITableFloatOptions): Table {
        this.properties.setTableFloatProperties(tableFloatOptions);
        return this;
    }

    public get Properties(): TableProperties {
        return this.properties;
    }
}
