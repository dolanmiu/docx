// http://officeopenxml.com/WPtableGrid.php
import { XmlComponent } from "@file/xml-components";

import { AlignmentType } from "../paragraph";
import { TableGrid } from "./grid";
import { TableCell, VerticalMergeType } from "./table-cell";
import { ITableBordersOptions, ITableFloatOptions, TableProperties } from "./table-properties";
import { ITableCellMarginOptions } from "./table-properties/table-cell-margin";
import { TableLayoutType } from "./table-properties/table-layout";
import { TableRow } from "./table-row";
import { ITableWidthProperties } from "./table-width";

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
    readonly rows: readonly TableRow[];
    readonly width?: ITableWidthProperties;
    readonly columnWidths?: readonly number[];
    readonly margins?: ITableCellMarginOptions;
    readonly indent?: ITableWidthProperties;
    readonly float?: ITableFloatOptions;
    readonly layout?: TableLayoutType;
    readonly style?: string;
    readonly borders?: ITableBordersOptions;
    readonly alignment?: AlignmentType;
    readonly visuallyRightToLeft?: boolean;
}

export class Table extends XmlComponent {
    public constructor({
        rows,
        width,
        // eslint-disable-next-line functional/immutable-data
        columnWidths = Array<number>(Math.max(...rows.map((row) => row.CellCount))).fill(100),
        margins,
        indent,
        float,
        layout,
        style,
        borders,
        alignment,
        visuallyRightToLeft,
    }: ITableOptions) {
        super("w:tbl");

        this.root.push(
            new TableProperties({
                borders: borders ?? {},
                width: width ?? { size: 100 },
                indent,
                float,
                layout,
                style,
                alignment,
                cellMargin: margins,
                visuallyRightToLeft,
            }),
        );

        this.root.push(new TableGrid(columnWidths));

        for (const row of rows) {
            this.root.push(row);
        }

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
    }
}
