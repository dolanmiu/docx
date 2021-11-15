import { Paragraph } from "../../../file/paragraph";
import { IContext, IXmlableObject, XmlComponent } from "../../../file/xml-components";
import { Table } from "../table";
import { ITableCellPropertiesOptions } from "./table-cell-properties";
export interface ITableCellOptions extends ITableCellPropertiesOptions {
    readonly children: (Paragraph | Table)[];
}
export declare class TableCell extends XmlComponent {
    readonly options: ITableCellOptions;
    constructor(options: ITableCellOptions);
    prepForXml(context: IContext): IXmlableObject | undefined;
}
