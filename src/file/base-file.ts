import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import { FooterReferenceType, HeaderReference, HeaderReferenceType, SectionPropertiesOptions } from "./document/body/section-properties";
import { FooterWrapper, IDocumentFooter } from "./footer-wrapper";
import { FootNotes } from "./footnotes";
import { HeaderWrapper, IDocumentHeader } from "./header-wrapper";
import { Image, Media } from "./media";
import { Numbering } from "./numbering";
import { Bookmark, Hyperlink, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Styles } from "./styles";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { DefaultStylesFactory } from "./styles/factory";
import { Table } from "./table";

export abstract class BaseFile {
    protected currentRelationshipId: number = 1;

    protected document: Document;
    protected headers: IDocumentHeader[] = [];
    protected footers: IDocumentFooter[] = [];
    protected docRelationships: Relationships;
    protected styles: Styles;
    protected coreProperties: CoreProperties;
    protected numbering: Numbering;
    protected media: Media;
    protected fileRelationships: Relationships;
    protected footNotes: FootNotes;
    protected contentTypes: ContentTypes;
    protected appProperties: AppProperties;

    constructor(options: IPropertiesOptions) {
        this.coreProperties = new CoreProperties(options);
        this.numbering = new Numbering();
        this.docRelationships = new Relationships();
        this.media = new Media();
        this.fileRelationships = new Relationships();
        this.appProperties = new AppProperties();
        this.footNotes = new FootNotes();
        this.contentTypes = new ContentTypes();

        if (options.externalStyles) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.styles = stylesFactory.newInstance();
        }
    }

    public addParagraph(paragraph: Paragraph): BaseFile {
        this.document.addParagraph(paragraph);
        return this;
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

    public addImage(image: Image): BaseFile {
        this.document.addParagraph(image.Paragraph);
        return this;
    }

    public createImage(buffer: Buffer | string | Uint8Array | ArrayBuffer, width?: number, height?: number): Image {
        const image = Media.addImage(this, buffer, width, height);
        this.document.addParagraph(image.Paragraph);

        return image;
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

    public createHeader(): HeaderWrapper {
        const header = new HeaderWrapper(this.currentRelationshipId++);
        this.addHeaderToDocument(header);
        return header;
    }

    public createFooter(): FooterWrapper {
        const footer = new FooterWrapper(this.currentRelationshipId++);
        this.addFooterToDocument(footer);
        return footer;
    }

    public createFirstPageHeader(): HeaderWrapper {
        const headerWrapper = this.createHeader();

        this.document.Body.DefaultSection.addChildElement(
            new HeaderReference({
                headerType: HeaderReferenceType.FIRST,
                headerId: headerWrapper.Header.ReferenceId,
            }),
        );

        return headerWrapper;
    }

    public getFooterByReferenceNumber(refId: number): FooterWrapper {
        const entry = this.footers.map((item) => item.footer).find((h) => h.Footer.ReferenceId === refId);
        if (entry) {
            return entry;
        }
        throw new Error(`There is no footer with given reference id ${refId}`);
    }

    public getHeaderByReferenceNumber(refId: number): HeaderWrapper {
        const entry = this.headers.map((item) => item.header).find((h) => h.Header.ReferenceId === refId);
        if (entry) {
            return entry;
        }
        throw new Error(`There is no header with given reference id ${refId}`);
    }

    protected addHeaderToDocument(header: HeaderWrapper, type: HeaderReferenceType = HeaderReferenceType.DEFAULT): void {
        this.headers.push({ header, type });
        this.docRelationships.createRelationship(
            header.Header.ReferenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            `header${this.headers.length}.xml`,
        );
        this.contentTypes.addHeader(this.headers.length);
    }

    protected addFooterToDocument(footer: FooterWrapper, type: FooterReferenceType = FooterReferenceType.DEFAULT): void {
        this.footers.push({ footer, type });
        this.docRelationships.createRelationship(
            footer.Footer.ReferenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            `footer${this.footers.length}.xml`,
        );
        this.contentTypes.addFooter(this.footers.length);
    }

    protected addDefaultRelationships(): void {
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
    }

    public get Document(): Document {
        return this.document;
    }

    public get Styles(): Styles {
        return this.styles;
    }

    public set Styles(styles: Styles) {
        this.styles = styles;
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
        return this.headers[0].header;
    }

    public get Headers(): HeaderWrapper[] {
        return this.headers.map((item) => item.header);
    }

    public get Footer(): FooterWrapper {
        return this.footers[0].footer;
    }

    public get Footers(): FooterWrapper[] {
        return this.footers.map((item) => item.footer);
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
