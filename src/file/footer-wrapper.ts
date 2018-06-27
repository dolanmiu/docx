import { XmlComponent } from "file/xml-components";
import { Footer } from "./footer/footer";
import { IMediaData, Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export class FooterWrapper {
    private readonly footer: Footer;
    private readonly relationships: Relationships;

    constructor(private readonly media: Media, referenceId: number) {
        this.footer = new Footer(referenceId);
        this.relationships = new Relationships();
    }

    public addParagraph(paragraph: Paragraph): void {
        this.footer.addParagraph(paragraph);
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addParagraph(para);
        return para;
    }

    public addTable(table: Table): void {
        this.footer.addTable(table);
    }

    public createTable(rows: number, cols: number): Table {
        return this.footer.createTable(rows, cols);
    }

    public addDrawing(imageData: IMediaData): void {
        this.footer.addDrawing(imageData);
    }

    public addChildElement(childElement: XmlComponent | string): void {
        this.footer.addChildElement(childElement);
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

    public get Footer(): Footer {
        return this.footer;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
