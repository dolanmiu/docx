import { IgnoreIfEmptyXmlComponent } from "../../../file/xml-components";
import { AlignmentType } from "../../paragraph";
import { IShadingAttributesProperties } from "../../shading";
import { ITableWidthProperties } from "../table-width";
import { ITableBordersOptions } from "./table-borders";
import { ITableCellMarginOptions } from "./table-cell-margin";
import { ITableFloatOptions } from "./table-float-properties";
import { TableLayoutType } from "./table-layout";
export interface ITablePropertiesOptions {
    readonly width?: ITableWidthProperties;
    readonly indent?: ITableWidthProperties;
    readonly layout?: TableLayoutType;
    readonly borders?: ITableBordersOptions;
    readonly float?: ITableFloatOptions;
    readonly shading?: IShadingAttributesProperties;
    readonly style?: string;
    readonly alignment?: AlignmentType;
    readonly cellMargin?: ITableCellMarginOptions;
    readonly visuallyRightToLeft?: boolean;
}
export declare class TableProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITablePropertiesOptions);
}
