import { XmlComponent } from "file/xml-components";

import { HeaderReferenceType } from "./document";
import { Header } from "./header/header";
import { Image, IMediaData, Media } from "./media";
import { ImageParagraph, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentHeader {
    readonly header: HeaderWrapper;
    readonly type: HeaderReferenceType;
}

export class HeaderWrapper {
    private readonly header: Header;
    private readonly relationships: Relationships;

    constructor(private readonly media: Media, referenceId: number, initContent?: XmlComponent) {
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

    public addImageRelationship(image: Buffer, refId: number, width?: number, height?: number): IMediaData {
        const mediaData = this.media.addMedia(image, refId, width, height);
        this.relationships.createRelationship(
            mediaData.referenceId,
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

    public createImage(image: Buffer | string | Uint8Array | ArrayBuffer, width?: number, height?: number): void {
        // TODO
        // tslint:disable-next-line:no-any
        const mediaData = this.addImageRelationship(image as any, this.relationships.RelationshipCount, width, height);
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

    public get Media(): Media {
        return this.media;
    }
}
