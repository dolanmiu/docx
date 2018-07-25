import { IMediaData } from "file/media";
import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import { FooterReferenceType, HeaderReference, HeaderReferenceType } from "./document/body/section-properties";
import { SectionPropertiesOptions } from "./document/body/section-properties/section-properties";
import { FooterWrapper } from "./footer-wrapper";
import { FootNotes } from "./footnotes";
import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Bookmark, Hyperlink, Paragraph, PictureRun } from "./paragraph";
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
    private readonly headerWrapper: HeaderWrapper[] = [];
    private readonly footerWrapper: FooterWrapper[] = [];
    private readonly footNotes: FootNotes;

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

        this.docRelationships.createRelationship(
            this.nextId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes",
            "footnotes.xml",
        );
        this.media = new Media();

        const header = this.createHeader();
        const footer = this.createFooter();

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

        this.footNotes = new FootNotes();
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

    public createImage(image: string): PictureRun {
        const mediaData = this.media.addMedia(image, this.nextId++);
        this.docRelationships.createRelationship(
            mediaData.referenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            `media/${mediaData.fileName}`,
        );
        return this.document.createDrawing(mediaData);
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

    public createHyperlink(link: string, text?: string): Hyperlink {
        text = text === undefined ? link : text;
        const hyperlink = new Hyperlink(text, this.docRelationships.RelationshipCount);
        this.docRelationships.createRelationship(
            hyperlink.linkId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            link,
            "External",
        );
        return hyperlink;
    }

    public createInternalHyperLink(anchor: string, text?: string): Hyperlink {
        text = text === undefined ? anchor : text;
        const hyperlink = new Hyperlink(text, this.docRelationships.RelationshipCount, anchor);
        // NOTE: unlike File#createHyperlink(), since the link is to an internal bookmark
        // we don't need to create a new relationship.
        return hyperlink;
    }

    public createBookmark(name: string, text?: string): Bookmark {
        text = text === undefined ? name : text;
        const bookmark = new Bookmark(name, text, this.docRelationships.RelationshipCount);
        return bookmark;
    }

    public addSection(sectionPropertiesOptions: SectionPropertiesOptions): void {
        this.document.Body.addSection(sectionPropertiesOptions);
    }

    public createFootnote(paragraph: Paragraph): void {
        this.footNotes.createFootNote(paragraph);
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

    public createFirstPageHeader(): HeaderWrapper {
        const headerWrapper = this.createHeader();

        this.document.Body.DefaultSection.addChildElement(
            new HeaderReference({
                headerType: HeaderReferenceType.FIRST,
                headerId: headerWrapper.Header.referenceId,
            }),
        );

        return headerWrapper;
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
        if (entry) {
            return entry;
        }
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
        if (entry) {
            return entry;
        }
        throw new Error(`There is no footer with given reference id ${refId}`);
    }

    public get ContentTypes(): ContentTypes {
        return this.contentTypes;
    }

    public get AppProperties(): AppProperties {
        return this.appProperties;
    }

    public get FootNotes(): FootNotes {
        return this.footNotes;
    }
}
