import { XmlComponent } from "../../file/xml-components";
export declare enum WidthType {
    AUTO = "auto",
    DXA = "dxa",
    NIL = "nil",
    PERCENTAGE = "pct"
}
export interface ITableWidthProperties {
    readonly size: string | number;
    readonly type?: WidthType;
}
export declare class TableWidthElement extends XmlComponent {
    constructor(name: string, { type, size }: ITableWidthProperties);
}
