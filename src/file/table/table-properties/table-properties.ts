import { IgnoreIfEmptyXmlComponent } from "file/xml-components";

import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { WidthType } from "../table-cell";
import { TableBorders } from "./table-borders";
import { TableCellMargin } from "./table-cell-margin";
import { ITableFloatOptions, TableFloatProperties } from "./table-float-properties";
import { TableLayout, TableLayoutType } from "./table-layout";
import { PreferredTableWidth } from "./table-width";

export class TableProperties extends IgnoreIfEmptyXmlComponent {
    private readonly cellMargin: TableCellMargin;

    constructor() {
        super("w:tblPr");

        this.cellMargin = new TableCellMargin();
        this.root.push(this.cellMargin);
    }

    public setWidth(width: number, type: WidthType = WidthType.AUTO): TableProperties {
        this.root.push(new PreferredTableWidth(type, width));
        return this;
    }

    public setFixedWidthLayout(): TableProperties {
        this.root.push(new TableLayout(TableLayoutType.FIXED));
        return this;
    }

    public setBorder(): TableProperties {
        this.root.push(new TableBorders());
        return this;
    }

    public get CellMargin(): TableCellMargin {
        return this.cellMargin;
    }

    public setTableFloatProperties(tableFloatOptions: ITableFloatOptions): TableProperties {
        this.root.push(new TableFloatProperties(tableFloatOptions));
        return this;
    }

    public setShading(attrs: ITableShadingAttributesProperties): TableProperties {
        this.root.push(new TableShading(attrs));

        return this;
    }
}
