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
export interface ITableOptions {
    readonly rows: number;
    readonly columns: number;
    readonly width?: number;
    readonly widthUnitType?: WidthType;
    readonly columnWidths?: number[];
    readonly margins?: {
        readonly marginUnitType?: WidthType;
        readonly top?: number;
        readonly bottom?: number;
        readonly right?: number;
        readonly left?: number;
    };
    readonly float?: ITableFloatOptions;
}

export class Table extends XmlComponent {
    private readonly properties: TableProperties;
    private readonly rows: TableRow[];

    constructor({
        rows,
        columns,
        width = 100,
        widthUnitType = WidthType.AUTO,
        columnWidths = Array<number>(columns).fill(100),
        margins: { marginUnitType, top, bottom, right, left } = { marginUnitType: WidthType.AUTO, top: 0, bottom: 0, right: 0, left: 0 },
        float,
    }: ITableOptions) {
        super("w:tbl");
        this.properties = new TableProperties();
        this.root.push(this.properties);
        this.properties.setBorder();
        this.properties.setWidth(width, widthUnitType);
        this.properties.CellMargin.addBottomMargin(bottom || 0, marginUnitType);
        this.properties.CellMargin.addTopMargin(top || 0, marginUnitType);
        this.properties.CellMargin.addLeftMargin(left || 0, marginUnitType);
        this.properties.CellMargin.addRightMargin(right || 0, marginUnitType);
        const grid = new TableGrid(columnWidths);

        this.root.push(grid);

        this.rows = Array(rows)
            .fill(0)
            .map(() => {
                const cells = Array(columns)
                    .fill(0)
                    .map(() => new TableCell());
                const row = new TableRow(cells);
                return row;
            });

        this.rows.forEach((x) => this.root.push(x));

        if (float) {
            this.properties.setTableFloatProperties(float);
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
}
