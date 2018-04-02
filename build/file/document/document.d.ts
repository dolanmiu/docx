import { IMediaData } from "../../file/media";
import { XmlComponent } from "../../file/xml-components";
import { Paragraph, PictureRun } from "../paragraph";
import { Table } from "../table";
import { SectionPropertiesOptions } from "./body/section-properties/section-properties";
export declare class Document extends XmlComponent {
    private readonly body;
    constructor(sectionPropertiesOptions?: SectionPropertiesOptions);
    addParagraph(paragraph: Paragraph): void;
    createParagraph(text?: string): Paragraph;
    addTable(table: Table): void;
    createTable(rows: number, cols: number): Table;
    addDrawing(pictureParagraph: Paragraph): void;
    createDrawing(imageData: IMediaData): PictureRun;
}
