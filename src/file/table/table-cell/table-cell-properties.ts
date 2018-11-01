import { XmlComponent } from "file/xml-components";

import {
    GridSpan,
    ITableCellShadingAttributesProperties,
    TableCellBorders,
    TableCellShading,
    TableCellWidth,
    VAlign,
    VerticalAlign,
    VMerge,
    VMergeType,
    WidthType,
} from "./table-cell-components";

export class TableCellProperties extends XmlComponent {
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

    public addVerticalMerge(type: VMergeType): TableCellProperties {
        this.root.push(new VMerge(type));

        return this;
    }

    public setVerticalAlign(type: VerticalAlign): TableCellProperties {
        this.root.push(new VAlign(type));

        return this;
    }

    public setWidth(width: string | number, type: WidthType): TableCellProperties {
        this.root.push(new TableCellWidth(width, type));

        return this;
    }

    public setShading(attrs: ITableCellShadingAttributesProperties): TableCellProperties {
        this.root.push(new TableCellShading(attrs));

        return this;
    }
}
