import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import { FooterWrapper } from "./footer-wrapper";
import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Styles } from "./styles";
import { DefaultStylesFactory } from "./styles/factory";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { Table } from "./table";
import { IMediaData } from "index";
import { FooterReferenceType, HeaderReferenceType, SectionPropertiesOptions } from "./document/body/section-properties";

export class File {
    private readonly document: Document;
    private readonly styles: Styles;
    private readonly coreProperties: CoreProperties;
    private readonly numbering: Numbering;
    private readonly media: Media;
    private readonly docRelationships: Relationships;
    private readonly fileRelationships: Relationships;
    private readonly headerWrapper: HeaderWrapper[] = [];
    private readonly footerWrapper: FooterWrapper[] = [];
    private readonly contentTypes: ContentTypes;
    private readonly appProperties: AppProperties;

    private nextId: number = 1;

    constructor(options?: IPropertiesOptions, sectionPropertiesOptions?: SectionPropertiesOptions) {
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
            this.nextId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            "styles.xml",
        );
        this.docRelationships.createRelationship(
            this.nextId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering",
            "numbering.xml",
        );
        this.contentTypes = new ContentTypes();
        this.media = new Media();

        const header = new HeaderWrapper(this.media, this.nextId++);
        this.headerWrapper.push(header);
        this.docRelationships.createRelationship(
            header.Header.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            `header1.xml`,
        );
        this.contentTypes.addHeader(this.headerWrapper.length);

        const footer = new FooterWrapper(this.media, this.nextId++);
        this.footerWrapper.push(footer);
        this.docRelationships.createRelationship(
            footer.Footer.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            "footer1.xml",
        );
        this.contentTypes.addFooter(this.footerWrapper.length);

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

        if (!sectionPropertiesOptions) {
            sectionPropertiesOptions = {
                footerType: FooterReferenceType.DEFAULT,
                headerType: HeaderReferenceType.DEFAULT,
                headerId: header.Header.referenceId,
                footerId: footer.Footer.referenceId,
            };
        } else {
            sectionPropertiesOptions.headerId = header.Header.referenceId;
            sectionPropertiesOptions.footerId = footer.Footer.referenceId;
        }
        this.document = new Document(sectionPropertiesOptions);
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
        const mediaData = this.media.addMedia(image, this.nextId++);
        this.docRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        this.document.createDrawing(mediaData);
    }

    public createImageData(imageName: string, data: Buffer, width?: number, height?: number): IMediaData {
        const mediaData = this.media.addMediaWithData(imageName, data, this.nextId++, width, height);
        this.docRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return mediaData;
    }

    public addSection(sectionPropertiesOptions: SectionPropertiesOptions) {
        this.document.Body.addSection(sectionPropertiesOptions);
    }

    /**
     * Creates new header.
     */
    public createHeader(): HeaderWrapper {
        const header = new HeaderWrapper(this.media, this.nextId++);
        this.headerWrapper.push(header);
        this.docRelationships.createRelationship(
            header.Header.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            `header${this.headerWrapper.length}.xml`,
        );
        this.contentTypes.addHeader(this.headerWrapper.length);
        return header;
    }

    /**
     * Creates new footer.
     */
    public createFooter(): FooterWrapper {
        const footer = new FooterWrapper(this.media, this.nextId++);
        this.footerWrapper.push(footer);
        this.docRelationships.createRelationship(
            footer.Footer.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            `footer${this.footerWrapper.length}.xml`,
        );
        this.contentTypes.addFooter(this.footerWrapper.length);
        return footer;
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
        return this.headerWrapper[0];
    }

    public get Headers(): HeaderWrapper[] {
        return this.headerWrapper;
    }

    public HeaderByRefNumber(refId: number): HeaderWrapper {
        const entry = this.headerWrapper.find((h) => h.Header.referenceId === refId);
        if (entry) return entry;
        throw new Error(`There is no header with given reference id ${refId}`);
    }

    public get Footer(): FooterWrapper {
        return this.footerWrapper[0];
    }

    public get Footers(): FooterWrapper[] {
        return this.footerWrapper;
    }

    public FooterByRefNumber(refId: number): FooterWrapper {
        const entry = this.footerWrapper.find((h) => h.Footer.referenceId === refId);
        if (entry) return entry;
        throw new Error(`There is no footer with given reference id ${refId}`);
    }

    public get ContentTypes(): ContentTypes {
        return this.contentTypes;
    }

    public get AppProperties(): AppProperties {
        return this.appProperties;
    }
}
