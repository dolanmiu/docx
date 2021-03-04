// http://officeopenxml.com/WPtableProperties.php
import { IgnoreIfEmptyXmlComponent } from "file/xml-components";

import { Alignment, AlignmentType } from "../../paragraph";
import { ITableShadingAttributesProperties, TableShading } from "../shading";
import { WidthType } from "../table-cell";
import { ITableBordersOptions, TableBorders } from "./table-borders";
import { ITableCellMarginOptions, TableCellMargin } from "./table-cell-margin";
import { ITableFloatOptions, TableFloatProperties } from "./table-float-properties";
import { TableLayout, TableLayoutType } from "./table-layout";
import { PreferredTableWidth } from "./table-width";

export interface ITablePropertiesOptions {
    readonly width?: {
        readonly size: number;
        readonly type?: WidthType;
    };
    readonly layout?: TableLayoutType;
    readonly borders?: ITableBordersOptions;
    readonly float?: ITableFloatOptions;
    readonly shading?: ITableShadingAttributesProperties;
    readonly alignment?: AlignmentType;
    readonly cellMargin?: ITableCellMarginOptions;
}

export class TableProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITablePropertiesOptions) {
        super("w:tblPr");

        this.root.push(new TableCellMargin(options.cellMargin || {}));

        if (options.borders) {
            this.root.push(new TableBorders(options.borders));
        }

        if (options.width) {
            this.root.push(new PreferredTableWidth(options.width.type, options.width.size));
        }

        if (options.float) {
            this.root.push(new TableFloatProperties(options.float));
        }

        if (options.layout) {
            this.root.push(new TableLayout(options.layout));
        }

        if (options.alignment) {
            this.root.push(new Alignment(options.alignment));
        }

        if (options.shading) {
            this.root.push(new TableShading(options.shading));
        }
    }
}
