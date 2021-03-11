// http://officeopenxml.com/WPtableGrid.php
import { Paragraph } from "file/paragraph";
import { BorderStyle } from "file/styles";
import { IContext, IXmlableObject, XmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties } from "../shading";
import { Table } from "../table";
import { ITableCellMarginOptions } from "./cell-margin/table-cell-margins";
import { TextDirection, VerticalAlign, VerticalMergeType, WidthType } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

export interface ITableCellOptions {
    readonly shading?: ITableShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: VerticalAlign;
    readonly textDirection?: TextDirection;
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
    readonly children: (Paragraph | Table)[];
}

export class TableCell extends XmlComponent {
    constructor(readonly options: ITableCellOptions) {
        super("w:tc");

        const properties = new TableCellProperties();
        this.root.push(properties);

        for (const child of options.children) {
            this.root.push(child);
        }

        if (options.verticalAlign) {
            properties.setVerticalAlign(options.verticalAlign);
        }

        if (options.textDirection) {
            properties.setTextDirection(options.textDirection);
        }

        if (options.verticalMerge) {
            properties.addVerticalMerge(options.verticalMerge);
        } else if (options.rowSpan && options.rowSpan > 1) {
            // if cell already have a `verticalMerge`, don't handle `rowSpan`
            properties.addVerticalMerge(VerticalMergeType.RESTART);
        }

        if (options.margins) {
            properties.addMargins(options.margins);
        }

        if (options.shading) {
            properties.setShading(options.shading);
        }

        if (options.columnSpan) {
            properties.addGridSpan(options.columnSpan);
        }

        if (options.width) {
            properties.setWidth(options.width.size, options.width.type);
        }

        if (options.borders) {
            if (options.borders.top) {
                properties.Borders.addTopBorder(options.borders.top.style, options.borders.top.size, options.borders.top.color);
            }
            if (options.borders.bottom) {
                properties.Borders.addBottomBorder(options.borders.bottom.style, options.borders.bottom.size, options.borders.bottom.color);
            }
            if (options.borders.left) {
                properties.Borders.addLeftBorder(options.borders.left.style, options.borders.left.size, options.borders.left.color);
            }
            if (options.borders.right) {
                properties.Borders.addRightBorder(options.borders.right.style, options.borders.right.size, options.borders.right.color);
            }
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Cells must end with a paragraph
        if (!(this.root[this.root.length - 1] instanceof Paragraph)) {
            this.root.push(new Paragraph({}));
        }
        return super.prepForXml(context);
    }
}
