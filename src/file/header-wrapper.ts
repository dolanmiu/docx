import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Header } from "./header/header";
import { Image, Media } from "./media";
import { ImageParagraph, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export class HeaderWrapper {
    private readonly header: Header;
    private readonly relationships: Relationships;
    public readonly media = new Media();

    // constructor(private readonly media: Media, referenceId: number, initContent? : XmlComponent) {
    constructor(referenceId: number, initContent?: XmlComponent) {
        this.header = new Header(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public addParagraph(paragraph: Paragraph): void {
        this.header.addParagraph(paragraph);
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addParagraph(para);
        return para;
    }

    public addTable(table: Table): void {
        this.header.addTable(table);
    }

    public createTable(rows: number, cols: number): Table {
        return this.header.createTable(rows, cols);
    }

    public addChildElement(childElement: XmlComponent | string): void {
        this.header.addChildElement(childElement);
    }

    public addImageRelation(image: Buffer, refId: number, width?: number, height?: number): IMediaData {
        const mediaData = this.media.addMedia(image, refId, width, height);
        this.relationships.createRelationship(
            refId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return mediaData;
    }

    public createImage(image: Buffer, width?: number, height?: number): void {
        const mediaData = this.addImageRelation(image, this.relationships.RelationshipCount, width, height);
        this.addImage(new Image(new ImageParagraph(mediaData)));
    }

    public addImage(image: Image): HeaderWrapper {
        this.header.addParagraph(image.Paragraph);
        return this;
    }

    public get Header(): Header {
        return this.header;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
