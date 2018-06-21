import { Header } from "./header/header";
import { IMediaData, Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";
import { XmlComponent } from ".";

export class HeaderWrapper {
    private readonly header: Header;
    private readonly relationships: Relationships;

    constructor(private readonly media: Media, referenceId: number) {
        this.header = new Header(referenceId);
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

    public addDrawing(imageData: IMediaData): void {
        this.header.addDrawing(imageData);
    }

    public addChildElement(childElement: XmlComponent | string) {
        this.header.addChildElement(childElement);
    }

    public createImage(image: string): void {
        const mediaData = this.media.addMedia(image, this.relationships.RelationshipCount);
        this.relationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        this.addDrawing(mediaData);
    }

    public get Header(): Header {
        return this.header;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
