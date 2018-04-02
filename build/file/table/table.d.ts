import { IXmlableObject, XmlComponent } from "../../file/xml-components";
import { Paragraph } from "../paragraph";
import { WidthTypes } from "./properties";
export declare class Table extends XmlComponent {
    private readonly properties;
    private readonly rows;
    private readonly grid;
    constructor(rows: number, cols: number);
    getRow(ix: number): TableRow;
    getCell(row: number, col: number): TableCell;
    setWidth(type: WidthTypes, width: number | string): Table;
    fixedWidthLayout(): Table;
}
export declare class TableRow extends XmlComponent {
    private readonly cells;
    private readonly properties;
    constructor(cells: TableCell[]);
    getCell(ix: number): TableCell;
}
export declare class TableRowProperties extends XmlComponent {
    constructor();
}
export declare class TableCell extends XmlComponent {
    private readonly properties;
    constructor();
    addContent(content: Paragraph | Table): TableCell;
    prepForXml(): IXmlableObject;
    createParagraph(text?: string): Paragraph;
}
export declare class TableCellProperties extends XmlComponent {
    constructor();
}
