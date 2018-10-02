import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { FooterReferenceType } from "./document";
import { Footer } from "./footer/footer";
import { Image, Media } from "./media";
import { ImageParagraph, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentFooter {
    footer: FooterWrapper;
    type: FooterReferenceType;
}

export class FooterWrapper {
    private readonly footer: Footer;
    private readonly relationships: Relationships;
    private readonly media: Media;

    constructor(referenceId: number, initContent?: XmlComponent) {
        this.media = new Media();
        this.footer = new Footer(referenceId, initContent);
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

    public addChildElement(childElement: XmlComponent): void {
        this.footer.addChildElement(childElement);
    }

    public addImageRelationship(image: Buffer, refId: number, width?: number, height?: number): IMediaData {
        const mediaData = this.media.addMedia(image, refId, width, height);
        this.relationships.createRelationship(
            refId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return mediaData;
    }

    public addHyperlinkRelationship(target: string, refId: number, targetMode?: "External" | undefined): void {
        this.relationships.createRelationship(
            refId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            target,
            targetMode,
        );
    }

    public createImage(image: Buffer, width?: number, height?: number): void {
        const mediaData = this.addImageRelationship(image, this.relationships.RelationshipCount, width, height);
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

    public get Media(): Media {
        return this.media;
    }
}
