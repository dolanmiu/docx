import { IMediaData } from "../../file/media";
import { XmlComponent } from "../../file/xml-components";
import { Paragraph } from "../paragraph";
import { Table } from "../table";
export declare class Footer extends XmlComponent {
    constructor();
    addParagraph(paragraph: Paragraph): void;
    createParagraph(text?: string): Paragraph;
    addTable(table: Table): void;
    createTable(rows: number, cols: number): Table;
    addDrawing(imageData: IMediaData): void;
}
