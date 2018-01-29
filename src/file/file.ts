import { Document } from "./document";
import { SectionPropertiesOptions } from "./document/body/section-properties/section-properties";
import { Footer } from "./footer/footer";
import { Header } from "./header/header";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Paragraph } from "./paragraph";
import { IPropertiesOptions, Properties } from "./properties";
import { Relationships } from "./relationships";
import { Styles } from "./styles";
import { DefaultStylesFactory } from "./styles/factory";
import { Table } from "./table";

export class File {
    private readonly document: Document;
    private readonly styles: Styles;
    private readonly properties: Properties;
    private readonly numbering: Numbering;
    private readonly media: Media;
    private readonly relationships: Relationships;
    private readonly header: Header;
    private readonly footer: Footer;

    constructor(options?: IPropertiesOptions, sectionPropertiesOptions?: SectionPropertiesOptions) {
        this.document = new Document(sectionPropertiesOptions);
        const stylesFactory = new DefaultStylesFactory();
        this.styles = stylesFactory.newInstance();

        if (!options) {
            options = {
                creator: "Un-named",
                revision: "1",
                lastModifiedBy: "Un-named",
            };
        }

        this.properties = new Properties(options);
        this.numbering = new Numbering();
        this.relationships = new Relationships();
        this.media = new Media();
        this.header = new Header();
        this.footer = new Footer();
    }

    public addParagraph(paragraph: Paragraph): void {
        this.document.addParagraph(paragraph);
    }

    public createParagraph(text?: string): Paragraph {
        return this.document.createParagraph(text);
    }

    public addTable(table: Table): void {
        return this.document.addTable(table);
    }

    public createTable(rows: number, cols: number): Table {
        return this.document.createTable(rows, cols);
    }

    public createImage(image: string): void {
        const mediaData = this.media.addMedia(image, this.relationships.RelationshipCount);
        this.relationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        this.document.createDrawing(mediaData);
    }

    public get Document(): Document {
        return this.document;
    }

    public get Styles(): Styles {
        return this.styles;
    }

    public get Properties(): Properties {
        return this.properties;
    }

    public get Numbering(): Numbering {
        return this.numbering;
    }

    public get Media(): Media {
        return this.media;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }

    public get Header(): Header {
        return this.header;
    }

    public get Footer(): Footer {
        return this.footer;
    }
}
