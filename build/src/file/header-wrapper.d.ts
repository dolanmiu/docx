import { XmlComponent } from "file/xml-components";
import { Header } from "./header/header";
import { IMediaData, Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";
export declare class HeaderWrapper {
    private readonly media;
    private readonly header;
    private readonly relationships;
    constructor(media: Media, referenceId: number);
    addParagraph(paragraph: Paragraph): void;
    createParagraph(text?: string): Paragraph;
    addTable(table: Table): void;
    createTable(rows: number, cols: number): Table;
    addDrawing(imageData: IMediaData): void;
    addChildElement(childElement: XmlComponent | string): void;
    createImage(image: string): void;
    readonly Header: Header;
    readonly Relationships: Relationships;
}
