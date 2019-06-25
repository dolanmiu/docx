import { XmlComponent } from "file/xml-components";

import { FooterReferenceType } from "./document";
import { IDrawingOptions } from "./drawing";
import { Footer } from "./footer/footer";
import { Image, Media } from "./media";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Table } from "./table";

export interface IDocumentFooter {
    readonly footer: FooterWrapper;
    readonly type: FooterReferenceType;
}

export class FooterWrapper {
    private readonly footer: Footer;
    private readonly relationships: Relationships;

    constructor(private readonly media: Media, referenceId: number, initContent?: XmlComponent) {
        this.footer = new Footer(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public addParagraph(paragraph: Paragraph): void {
        this.footer.addParagraph(paragraph);
    }

    public addTable(table: Table): void {
        this.footer.addTable(table);
    }

    public addImage(image: Image): FooterWrapper {
        this.footer.addParagraph(image.Paragraph);
        return this;
    }

    public addChildElement(childElement: XmlComponent): void {
        this.footer.addChildElement(childElement);
    }

    public createImage(
        buffer: Buffer | string | Uint8Array | ArrayBuffer,
        width?: number,
        height?: number,
        drawingOptions?: IDrawingOptions,
    ): Paragraph {
        const image = Media.addImage(this, buffer, width, height, drawingOptions);
        const paragraph = new Paragraph(image);
        this.addParagraph(paragraph);

        return paragraph;
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
