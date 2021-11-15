import { IgnoreIfEmptyXmlComponent } from "../../../file/xml-components";
import { HeightRule } from "./table-row-height";
export interface ITableRowPropertiesOptions {
    readonly cantSplit?: boolean;
    readonly tableHeader?: boolean;
    readonly height?: {
        readonly value: number | string;
        readonly rule: HeightRule;
    };
}
export declare class TableRowProperties extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableRowPropertiesOptions);
}
