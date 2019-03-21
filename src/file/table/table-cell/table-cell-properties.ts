import { XmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { ITableCellMargainOptions, TableCellMargain } from "./cell-margain/table-cell-margains";
import { GridSpan, TableCellBorders, TableCellWidth, VAlign, VerticalAlign, VMerge, VMergeType, WidthType } from "./table-cell-components";

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

    public setWidth(width: string | number, type: WidthType = WidthType.AUTO): TableCellProperties {
        this.root.push(new TableCellWidth(width, type));

        return this;
    }

    public setShading(attrs: ITableShadingAttributesProperties): TableCellProperties {
        this.root.push(new TableShading(attrs));

        return this;
    }

    public addMargains(options: ITableCellMargainOptions): TableCellProperties {
        this.root.push(new TableCellMargain(options));

        return this;
    }
}
