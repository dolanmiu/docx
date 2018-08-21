import { XmlComponent } from "file/xml-components";
import { Footer } from "./footer/footer";
import { Image, Media } from "./media";
import { ImageParagraph, Paragraph } from "./paragraph";
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

    public addChildElement(childElement: XmlComponent | string): void {
        this.footer.addChildElement(childElement);
    }

    public createImage(image: Buffer, width?: number, height?: number): void {
        const mediaData = this.media.addMedia(image, this.relationships.RelationshipCount, width, height);
        this.relationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        this.addImage(new Image(new ImageParagraph(mediaData)));
    }

    public addImage(image: Image): FooterWrapper {
        this.footer.addParagraph(image.Paragraph);
        return this;
    }

    public get Footer(): Footer {
        return this.footer;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
