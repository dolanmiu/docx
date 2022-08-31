import { VerticalAlign, VerticalAlignElement } from "@file/vertical-align";
import { IgnoreIfEmptyXmlComponent } from "@file/xml-components";

import { IShadingAttributesProperties, Shading } from "../../shading";
import { ITableCellMarginOptions, TableCellMargin, TableCellMarginElementType } from "../table-properties/table-cell-margin";
import { ITableWidthProperties, TableWidthElement } from "../table-width";
import {
    GridSpan,
    ITableCellBorders,
    TableCellBorders,
    TDirection,
    TextDirection,
    VerticalMerge,
    VerticalMergeType,
} from "./table-cell-components";

export interface ITableCellPropertiesOptions {
    readonly shading?: IShadingAttributesProperties;
    readonly margins?: ITableCellMarginOptions;
    readonly verticalAlign?: VerticalAlign;
    readonly textDirection?: TextDirection;
    readonly verticalMerge?: VerticalMergeType;
    readonly width?: ITableWidthProperties;
    readonly columnSpan?: number;
    readonly rowSpan?: number;
    readonly borders?: ITableCellBorders;
}

export class TableCellProperties extends IgnoreIfEmptyXmlComponent {
    public constructor(options: ITableCellPropertiesOptions) {
        super("w:tcPr");

        if (options.width) {
            this.root.push(new TableWidthElement("w:tcW", options.width));
        }

        if (options.columnSpan) {
            this.root.push(new GridSpan(options.columnSpan));
        }

        if (options.verticalMerge) {
            this.root.push(new VerticalMerge(options.verticalMerge));
        } else if (options.rowSpan && options.rowSpan > 1) {
            // if cell already have a `verticalMerge`, don't handle `rowSpan`
            this.root.push(new VerticalMerge(VerticalMergeType.RESTART));
        }

        if (options.borders) {
            this.root.push(new TableCellBorders(options.borders));
        }

        if (options.shading) {
            this.root.push(new Shading(options.shading));
        }

        if (options.margins) {
            this.root.push(new TableCellMargin(TableCellMarginElementType.TABLE_CELL, options.margins));
        }

        if (options.textDirection) {
            this.root.push(new TDirection(options.textDirection));
        }

        if (options.verticalAlign) {
            this.root.push(new VerticalAlignElement(options.verticalAlign));
        }
    }
}
