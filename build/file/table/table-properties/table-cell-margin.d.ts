import { IgnoreIfEmptyXmlComponent } from "../../../file/xml-components";
import { WidthType } from "../table-width";
export interface ITableCellMarginOptions {
    readonly marginUnitType?: WidthType;
    readonly top?: number;
    readonly bottom?: number;
    readonly left?: number;
    readonly right?: number;
}
export declare enum TableCellMarginElementType {
    TABLE = "w:tblCellMar",
    TABLE_CELL = "w:tcMar"
}
export declare class TableCellMargin extends IgnoreIfEmptyXmlComponent {
    constructor(type: TableCellMarginElementType, { marginUnitType, top, left, bottom, right }: ITableCellMarginOptions);
}
