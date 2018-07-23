import { XmlComponent } from "file/xml-components";
import { Footer } from "./footer/footer";
import { IMediaData, Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";
export declare class FooterWrapper {
    private readonly media;
    private readonly footer;
    private readonly relationships;
    constructor(media: Media, referenceId: number);
    addParagraph(paragraph: Paragraph): void;
    createParagraph(text?: string): Paragraph;
    addTable(table: Table): void;
    createTable(rows: number, cols: number): Table;
    addDrawing(imageData: IMediaData): void;
    addChildElement(childElement: XmlComponent | string): void;
    createImage(image: string): void;
    readonly Footer: Footer;
    readonly Relationships: Relationships;
}
