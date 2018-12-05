import { XmlComponent } from "file/xml-components";

import { FooterReferenceType } from "./document";
import { Footer } from "./footer/footer";
import { IOnCompile } from "./life-cycles";
import { Image, Media } from "./media";
import { ImageParagraph, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentFooter {
    readonly footer: FooterWrapper;
    readonly type: FooterReferenceType;
}

export class FooterWrapper implements IOnCompile {
    private readonly footer: Footer;
    private readonly relationships: Relationships;

    constructor(private readonly media: Media, referenceId: number, initContent?: XmlComponent) {
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

    public createImage(image: Buffer | string | Uint8Array | ArrayBuffer, width?: number, height?: number): void {
        const mediaData = this.media.addMedia(image, this.relationships.RelationshipCount, width, height);
        this.addImage(new Image(new ImageParagraph(mediaData)));
    }

    public addImage(image: Image): FooterWrapper {
        this.footer.addParagraph(image.Paragraph);
        return this;
    }

    public onCompile(): void {
        this.media.Array.forEach((mediaData) => {
            this.relationships.createRelationship(
                mediaData.referenceId,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                `media/${mediaData.fileName}`,
            );
        });
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
