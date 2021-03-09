import { IgnoreIfEmptyXmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { ITableCellMarginOptions, TableCellMargin } from "./cell-margin/table-cell-margins";
import {
    GridSpan,
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

export class TableCellProperties extends IgnoreIfEmptyXmlComponent {
    private readonly cellBorder: TableCellBorders;

    constructor() {
        super("w:tcPr");
        this.cellBorder = new TableCellBorders();
        this.root.push(this.cellBorder);
    }

    public get Borders(): TableCellBorders {
        return this.cellBorder;
    }

    public addGridSpan(cellSpan: number): TableCellProperties {
        this.root.push(new GridSpan(cellSpan));

        return this;
    }

    public addVerticalMerge(type: VerticalMergeType): TableCellProperties {
        this.root.push(new VerticalMerge(type));

        return this;
    }

    public setVerticalAlign(type: VerticalAlign): TableCellProperties {
        this.root.push(new VAlign(type));

        return this;
    }

    public setWidth(width: string | number, type: WidthType = WidthType.AUTO): TableCellProperties {
        this.root.push(new TableCellWidth(width, type));

        return this;
    }

    public setShading(attrs: ITableShadingAttributesProperties): TableCellProperties {
        this.root.push(new TableShading(attrs));

        return this;
    }

    public addMargins(options: ITableCellMarginOptions): TableCellProperties {
        this.root.push(new TableCellMargin(options));

        return this;
    }

    public setTextDirection(type: TextDirection): TableCellProperties {
        this.root.push(new TDirection(type));

        return this;
    }
}
