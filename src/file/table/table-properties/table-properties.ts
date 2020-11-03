// http://officeopenxml.com/WPtableProperties.php
import { IgnoreIfEmptyXmlComponent } from "file/xml-components";

import { Alignment, AlignmentType } from "../../paragraph";
import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { WidthType } from "../table-cell";
import { ITableBordersOptions, TableBorders } from "./table-borders";
import { ITableFloatOptions, TableFloatProperties } from "./table-float-properties";
import { TableLayout, TableLayoutType } from "./table-layout";
import { TableLevelCellMargin } from "./table-level-cell-margin";
import { PreferredTableWidth } from "./table-width";

export class TableProperties extends IgnoreIfEmptyXmlComponent {
    private readonly cellMargin: TableLevelCellMargin;

    constructor() {
        super("w:tblPr");

        this.cellMargin = new TableLevelCellMargin();
        this.root.push(this.cellMargin);
    }

    public setWidth(width: number, type: WidthType = WidthType.AUTO): TableProperties {
        this.root.push(new PreferredTableWidth(type, width));
        return this;
    }

    public setLayout(type: TableLayoutType): void {
        this.root.push(new TableLayout(type));
    }

    public setBorder(borderOptions: ITableBordersOptions): TableProperties {
        this.root.push(new TableBorders(borderOptions));
        return this;
    }

    public get CellMargin(): TableLevelCellMargin {
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

    public setAlignment(type: AlignmentType): void {
        this.root.push(new Alignment(type));
    }
}
