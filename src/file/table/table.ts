// http://officeopenxml.com/WPtableGrid.php
import { XmlComponent } from "file/xml-components";

import { AlignmentType } from "../paragraph";
import { TableGrid } from "./grid";
import { TableCell, VerticalMergeType, WidthType } from "./table-cell";
import { ITableBordersOptions, ITableFloatOptions, TableProperties } from "./table-properties";
import { TableLayoutType } from "./table-properties/table-layout";
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
    readonly rows: TableRow[];
    readonly width?: {
        readonly size: number;
        readonly type?: WidthType;
    };
    readonly columnWidths?: number[];
    readonly margins?: {
        readonly marginUnitType?: WidthType;
        readonly top?: number;
        readonly bottom?: number;
        readonly right?: number;
        readonly left?: number;
    };
    readonly float?: ITableFloatOptions;
    readonly layout?: TableLayoutType;
    readonly style?: string;
    readonly borders?: ITableBordersOptions;
    readonly alignment?: AlignmentType;
    readonly visuallyRightToLeft?: boolean;
}

export class Table extends XmlComponent {
    constructor({
        rows,
        width,
        columnWidths = Array<number>(Math.max(...rows.map((row) => row.CellCount))).fill(100),
        margins: { marginUnitType, top, bottom, right, left } = { marginUnitType: WidthType.AUTO, top: 0, bottom: 0, right: 0, left: 0 },
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
                float,
                layout,
                style,
                alignment,
                cellMargin: {
                    bottom: {
                        value: bottom || 0,
                        type: marginUnitType,
                    },
                    top: {
                        value: top || 0,
                        type: marginUnitType,
                    },
                    left: {
                        value: left || 0,
                        type: marginUnitType,
                    },
                    right: {
                        value: right || 0,
                        type: marginUnitType,
                    },
                },
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
