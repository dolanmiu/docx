import { IMediaData } from "file/media";
import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import { SectionPropertiesOptions } from "./document/body/section-properties/section-properties";
import { FooterWrapper } from "./footer-wrapper";
import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Paragraph, PictureRun } from "./paragraph";
import { Relationships } from "./relationships";
import { Styles } from "./styles";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { DefaultStylesFactory } from "./styles/factory";
import { Table } from "./table";

export class File {
    private readonly document: Document;
    private readonly styles: Styles;
    private readonly coreProperties: CoreProperties;
    private readonly numbering: Numbering;
    private readonly media: Media;
    private readonly docRelationships: Relationships;
    private readonly fileRelationships: Relationships;
    private readonly headerWrapper: HeaderWrapper;
    private readonly footerWrapper: FooterWrapper;
    private readonly contentTypes: ContentTypes;
    private readonly appProperties: AppProperties;

    constructor(options?: IPropertiesOptions, sectionPropertiesOptions?: SectionPropertiesOptions) {
        this.document = new Document(sectionPropertiesOptions);

        if (!options) {
            options = {
                creator: "Un-named",
                revision: "1",
                lastModifiedBy: "Un-named",
            };
        }

        if (options.externalStyles) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.styles = stylesFactory.newInstance();
        }

        this.coreProperties = new CoreProperties(options);
        this.numbering = new Numbering();
        this.docRelationships = new Relationships();
        this.docRelationships.createRelationship(
            1,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            "styles.xml",
        );
        this.docRelationships.createRelationship(
            2,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering",
            "numbering.xml",
        );
        this.docRelationships.createRelationship(
            3,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            "header1.xml",
        );
        this.docRelationships.createRelationship(
            4,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            "footer1.xml",
        );
        this.media = new Media();
        this.headerWrapper = new HeaderWrapper(this.media);
        this.footerWrapper = new FooterWrapper(this.media);
        this.contentTypes = new ContentTypes();
        this.fileRelationships = new Relationships();
        this.fileRelationships.createRelationship(
            1,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
            "word/document.xml",
        );
        this.fileRelationships.createRelationship(
            2,
            "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
            "docProps/core.xml",
        );
        this.fileRelationships.createRelationship(
            3,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
            "docProps/app.xml",
        );
        this.appProperties = new AppProperties();
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

    public createImage(image: string): PictureRun {
        const mediaData = this.media.addMedia(image, this.docRelationships.RelationshipCount);
        this.docRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return this.document.createDrawing(mediaData);
    }

    public createImageData(imageName: string, data: Buffer, width?: number, height?: number): IMediaData {
        const mediaData = this.media.addMediaWithData(imageName, data, this.docRelationships.RelationshipCount, width, height);
        this.docRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return mediaData;
    }

    public get Document(): Document {
        return this.document;
    }

    public get Styles(): Styles {
        return this.styles;
    }

    public get CoreProperties(): CoreProperties {
        return this.coreProperties;
    }

    public get Numbering(): Numbering {
        return this.numbering;
    }

    public get Media(): Media {
        return this.media;
    }

    public get DocumentRelationships(): Relationships {
        return this.docRelationships;
    }

    public get FileRelationships(): Relationships {
        return this.fileRelationships;
    }

    public get Header(): HeaderWrapper {
        return this.headerWrapper;
    }

    public get Footer(): FooterWrapper {
        return this.footerWrapper;
    }

    public get ContentTypes(): ContentTypes {
        return this.contentTypes;
    }

    public get AppProperties(): AppProperties {
        return this.appProperties;
    }
}
