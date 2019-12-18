// http://officeopenxml.com/WPtableGrid.php
import { Paragraph } from "file/paragraph";
import { BorderStyle } from "file/styles";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { File } from "../../file";
import { ITableShadingAttributesProperties } from "../shading";
import { Table } from "../table";
import { ITableCellMarginOptions } from "./cell-margin/table-cell-margins";
import { VerticalAlign, VerticalMergeType, WidthType } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

export interface ITableCellOptions {
    readonly shading?: ITableShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: VerticalAlign;
    readonly verticalMerge?: VerticalMergeType;
    readonly width?: {
        readonly size: number | string;
        readonly type?: WidthType;
    };
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

export class TableCell extends XmlComponent {
    private readonly properties: TableCellProperties;

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

        if (options.rowSpan && options.rowSpan > 1) {
            this.properties.addVerticalMerge(VerticalMergeType.RESTART);
        }

        if (options.width) {
            this.properties.setWidth(options.width.size, options.width.type);
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

    public prepForXml(file?: File): IXmlableObject | undefined {
        // Cells must end with a paragraph
        if (!(this.root[this.root.length - 1] instanceof Paragraph)) {
            this.root.push(new Paragraph({}));
        }
        return super.prepForXml(file);
    }
}
