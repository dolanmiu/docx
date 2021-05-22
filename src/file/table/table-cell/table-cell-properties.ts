import { IgnoreIfEmptyXmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { ITableCellMarginOptions, TableCellMargin } from "./cell-margin/table-cell-margins";
import {
    GridSpan,
    ITableCellBorders,
    TableCellBorders,
    TableCellWidth,
    TDirection,
    TextDirection,
    VAlign,
    VerticalAlign,
    VerticalMerge,
    VerticalMergeType,
    WidthType,
} from "./table-cell-components";

export interface ITableCellPropertiesOptions {
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
    readonly borders?: ITableCellBorders;
}

export class TableCellProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellPropertiesOptions) {
        super("w:tcPr");

        if (options.width) {
            this.root.push(new TableCellWidth(options.width.size, options.width.type));
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
            this.root.push(new TableShading(options.shading));
        }

        if (options.margins) {
            this.root.push(new TableCellMargin(options.margins));
        }

        if (options.textDirection) {
            this.root.push(new TDirection(options.textDirection));
        }

        if (options.verticalAlign) {
            this.root.push(new VAlign(options.verticalAlign));
        }
    }
}
