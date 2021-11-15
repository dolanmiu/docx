import { XmlComponent } from "../../file/xml-components";
import { AlignmentType } from "../paragraph";
import { ITableBordersOptions, ITableFloatOptions } from "./table-properties";
import { ITableCellMarginOptions } from "./table-properties/table-cell-margin";
import { TableLayoutType } from "./table-properties/table-layout";
import { TableRow } from "./table-row";
import { ITableWidthProperties } from "./table-width";
export interface ITableOptions {
    readonly rows: TableRow[];
    readonly width?: ITableWidthProperties;
    readonly columnWidths?: number[];
    readonly margins?: ITableCellMarginOptions;
    readonly indent?: ITableWidthProperties;
    readonly float?: ITableFloatOptions;
    readonly layout?: TableLayoutType;
    readonly style?: string;
    readonly borders?: ITableBordersOptions;
    readonly alignment?: AlignmentType;
    readonly visuallyRightToLeft?: boolean;
}
export declare class Table extends XmlComponent {
    constructor({ rows, width, columnWidths, margins, indent, float, layout, style, borders, alignment, visuallyRightToLeft, }: ITableOptions);
}
