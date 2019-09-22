// http://officeopenxml.com/WPtableGrid.php
import { Paragraph } from "file/paragraph";
import { BorderStyle } from "file/styles";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties } from "../shading";
import { Table } from "../table";
import { TableRow } from "../table-row";
import { ITableCellMarginOptions } from "./cell-margin/table-cell-margins";
import { VerticalAlign, VMergeType } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

export interface ITableCellOptions {
    readonly shading?: ITableShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: VerticalAlign;
    readonly verticalMerge?: VMergeType;
    readonly columnSpan?: number;
    readonly rowSpan?: number;
    readonly borders?: {
        readonly top?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly bottom?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly left?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
        readonly right?: {
            readonly style: BorderStyle;
            readonly size: number;
            readonly color: string;
        };
    };
    readonly children: Array<Paragraph | Table>;
}

interface ITableCellMetaData {
    readonly column: TableCell[];
    readonly row: TableRow;
}

export class TableCell extends XmlComponent {
    private readonly properties: TableCellProperties;
    // tslint:disable-next-line: readonly-keyword
    private metaData: ITableCellMetaData;

    constructor(readonly options: ITableCellOptions) {
        super("w:tc");

        this.properties = new TableCellProperties();
        this.root.push(this.properties);

        for (const child of options.children) {
            this.root.push(child);
        }

        if (options.verticalAlign) {
            this.properties.setVerticalAlign(options.verticalAlign);
        }

        if (options.verticalMerge) {
            this.properties.addVerticalMerge(options.verticalMerge);
        }

        if (options.margins) {
            this.properties.addMargins(options.margins);
        }

        if (options.shading) {
            this.properties.setShading(options.shading);
        }

        if (options.columnSpan) {
            this.properties.addGridSpan(options.columnSpan);
        }

        if (options.borders) {
            if (options.borders.top) {
                this.properties.Borders.addTopBorder(options.borders.top.style, options.borders.top.size, options.borders.top.color);
            }
            if (options.borders.bottom) {
                this.properties.Borders.addBottomBorder(
                    options.borders.bottom.style,
                    options.borders.bottom.size,
                    options.borders.bottom.color,
                );
            }
            if (options.borders.left) {
                this.properties.Borders.addLeftBorder(options.borders.left.style, options.borders.left.size, options.borders.left.color);
            }
            if (options.borders.right) {
                this.properties.Borders.addRightBorder(
                    options.borders.right.style,
                    options.borders.right.size,
                    options.borders.right.color,
                );
            }
        }
    }

    public prepForXml(): IXmlableObject | undefined {
        // Row Span has to be added in this method and not the constructor because it needs to know information about the column which happens after Table Cell construction
        // Row Span of 1 will crash word as it will add RESTART and not a corresponding CONTINUE
        if (this.options.rowSpan && this.options.rowSpan > 1) {
            this.properties.addVerticalMerge(VMergeType.RESTART);

            const currentIndex = this.metaData.column.indexOf(this);
            for (let i = currentIndex + 1; i <= currentIndex + this.options.rowSpan - 1; i++) {
                this.metaData.column[i].metaData.row.Children.splice(
                    i,
                    0,
                    new TableCell({
                        children: [],
                    }),
                );
                this.metaData.column[i].properties.addVerticalMerge(VMergeType.CONTINUE);
            }
        }

        // Cells must end with a paragraph
        if (!(this.root[this.root.length - 1] instanceof Paragraph)) {
            this.root.push(new Paragraph({}));
        }
        return super.prepForXml();
    }

    public set MetaData(metaData: ITableCellMetaData) {
        this.metaData = metaData;
    }
}
