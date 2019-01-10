import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import {
    FooterReference,
    FooterReferenceType,
    HeaderReference,
    HeaderReferenceType,
    IHeaderFooterGroup,
    SectionPropertiesOptions,
} from "./document/body/section-properties";
import { IDrawingOptions } from "./drawing";
import { IFileProperties } from "./file-properties";
import { FooterWrapper, IDocumentFooter } from "./footer-wrapper";
import { FootNotes } from "./footnotes";
import { HeaderWrapper, IDocumentHeader } from "./header-wrapper";
import { Image, Media } from "./media";
import { Numbering } from "./numbering";
import { Bookmark, Hyperlink, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { Settings } from "./settings";
import { Styles } from "./styles";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { DefaultStylesFactory } from "./styles/factory";
import { Table } from "./table";
import { TableOfContents } from "./table-of-contents";

export class File {
    // tslint:disable-next-line:readonly-keyword
    private currentRelationshipId: number = 1;

    private readonly document: Document;
    private readonly headers: IDocumentHeader[] = [];
    private readonly footers: IDocumentFooter[] = [];
    private readonly docRelationships: Relationships;
    private readonly coreProperties: CoreProperties;
    private readonly numbering: Numbering;
    private readonly media: Media;
    private readonly fileRelationships: Relationships;
    private readonly footNotes: FootNotes;
    private readonly settings: Settings;
    private readonly contentTypes: ContentTypes;
    private readonly appProperties: AppProperties;
    // tslint:disable-next-line:readonly-keyword
    private styles: Styles;

    constructor(
        options: IPropertiesOptions = {
            creator: "Un-named",
            revision: "1",
            lastModifiedBy: "Un-named",
        },
        sectionPropertiesOptions: SectionPropertiesOptions = {},
        fileProperties: IFileProperties = {},
    ) {
        this.coreProperties = new CoreProperties(options);
        this.numbering = new Numbering();
        this.docRelationships = new Relationships();
        this.media = new Media();
        this.fileRelationships = new Relationships();
        this.appProperties = new AppProperties();
        this.footNotes = new FootNotes();
        this.contentTypes = new ContentTypes();

        if (fileProperties.template) {
            this.currentRelationshipId = fileProperties.template.currentRelationshipId + 1;
        }

        // set up styles
        if (fileProperties.template && options.externalStyles) {
            throw Error("can not use both template and external styles");
        }
        if (fileProperties.template) {
            this.styles = fileProperties.template.styles;
        } else if (options.externalStyles) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.styles = stylesFactory.newInstance();
        }

        this.addDefaultRelationships();

        if (fileProperties.template && fileProperties.template.headers) {
            for (const templateHeader of fileProperties.template.headers) {
                this.addHeaderToDocument(templateHeader.header, templateHeader.type);
            }
        } else {
            this.createHeader();
        }

        if (fileProperties.template && fileProperties.template.footers) {
            for (const templateFooter of fileProperties.template.footers) {
                this.addFooterToDocument(templateFooter.footer, templateFooter.type);
            }
        } else {
            this.createFooter();
        }

        const newSectionPropertiesOptions = {
            ...sectionPropertiesOptions,
            headers: this.groupHeaders(this.headers, sectionPropertiesOptions.headers),
            footers: this.groupFooters(this.footers, sectionPropertiesOptions.footers),
        };

        this.document = new Document(newSectionPropertiesOptions);
        this.settings = new Settings();
    }

    public addTableOfContents(toc: TableOfContents): void {
        this.document.addTableOfContents(toc);
    }

    public addParagraph(paragraph: Paragraph): File {
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

    public addImage(image: Image): File {
        this.document.addParagraph(image.Paragraph);
        return this;
    }

    public createImage(
        buffer: Buffer | string | Uint8Array | ArrayBuffer,
        width?: number,
        height?: number,
        drawingOptions?: IDrawingOptions,
    ): Image {
        const image = Media.addImage(this, buffer, width, height, drawingOptions);
        this.document.addParagraph(image.Paragraph);

        return image;
    }

    public createHyperlink(link: string, text?: string): Hyperlink {
        const newText = text === undefined ? link : text;
        const hyperlink = new Hyperlink(newText, this.docRelationships.RelationshipCount);
        this.docRelationships.createRelationship(
            hyperlink.linkId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            link,
            "External",
        );
        return hyperlink;
    }

    public createInternalHyperLink(anchor: string, text?: string): Hyperlink {
        const newText = text === undefined ? anchor : text;
        const hyperlink = new Hyperlink(newText, this.docRelationships.RelationshipCount, anchor);
        // NOTE: unlike File#createHyperlink(), since the link is to an internal bookmark
        // we don't need to create a new relationship.
        return hyperlink;
    }

    public createBookmark(name: string, text?: string): Bookmark {
        const newText = text === undefined ? name : text;
        const bookmark = new Bookmark(name, newText, this.docRelationships.RelationshipCount);
        return bookmark;
    }

    public addSection(sectionPropertiesOptions: SectionPropertiesOptions): void {
        this.document.Body.addSection(sectionPropertiesOptions);
    }

    public createFootnote(paragraph: Paragraph): void {
        this.footNotes.createFootNote(paragraph);
    }

    public createHeader(): HeaderWrapper {
        const header = new HeaderWrapper(this.media, this.currentRelationshipId++);
        this.addHeaderToDocument(header);
        return header;
    }

    public createFooter(): FooterWrapper {
        const footer = new FooterWrapper(this.media, this.currentRelationshipId++);
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

    public createEvenPageHeader(): HeaderWrapper {
        const headerWrapper = this.createHeader();

        this.document.Body.DefaultSection.addChildElement(
            new HeaderReference({
                headerType: HeaderReferenceType.EVEN,
                headerId: headerWrapper.Header.ReferenceId,
            }),
        );

        return headerWrapper;
    }

    public createFirstPageFooter(): FooterWrapper {
        const footerWrapper = this.createFooter();

        this.document.Body.DefaultSection.addChildElement(
            new FooterReference({
                footerType: FooterReferenceType.FIRST,
                footerId: footerWrapper.Footer.ReferenceId,
            }),
        );

        return footerWrapper;
    }

    public createEvenPageFooter(): FooterWrapper {
        const footerWrapper = this.createFooter();

        this.document.Body.DefaultSection.addChildElement(
            new FooterReference({
                footerType: FooterReferenceType.EVEN,
                footerId: footerWrapper.Footer.ReferenceId,
            }),
        );

        return footerWrapper;
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

    public verifyUpdateFields(): void {
        if (this.document.getTablesOfContents().length) {
            this.settings.addUpdateFields();
        }
    }

    private addHeaderToDocument(header: HeaderWrapper, type: HeaderReferenceType = HeaderReferenceType.DEFAULT): void {
        this.headers.push({ header, type });
        this.docRelationships.createRelationship(
            header.Header.ReferenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            `header${this.headers.length}.xml`,
        );
        this.contentTypes.addHeader(this.headers.length);
    }

    private addFooterToDocument(footer: FooterWrapper, type: FooterReferenceType = FooterReferenceType.DEFAULT): void {
        this.footers.push({ footer, type });
        this.docRelationships.createRelationship(
            footer.Footer.ReferenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer",
            `footer${this.footers.length}.xml`,
        );
        this.contentTypes.addFooter(this.footers.length);
    }

    private addDefaultRelationships(): void {
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

        this.docRelationships.createRelationship(
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            "styles.xml",
        );
        this.docRelationships.createRelationship(
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering",
            "numbering.xml",
        );
        this.docRelationships.createRelationship(
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes",
            "footnotes.xml",
        );
    }

    private groupHeaders(headers: IDocumentHeader[], group: IHeaderFooterGroup<HeaderWrapper> = {}): IHeaderFooterGroup<HeaderWrapper> {
        let newGroup = group;

        for (const header of headers) {
            switch (header.type) {
                case HeaderReferenceType.DEFAULT:
                    newGroup = {
                        ...newGroup,
                        default: header.header,
                    };
                    break;
                case HeaderReferenceType.FIRST:
                    newGroup = {
                        ...newGroup,
                        first: header.header,
                    };
                    break;
                case HeaderReferenceType.EVEN:
                    newGroup = {
                        ...newGroup,
                        even: header.header,
                    };
                    break;
                default:
                    newGroup = {
                        ...newGroup,
                        default: header.header,
                    };
                    break;
            }
        }

        return newGroup;
    }

    private groupFooters(footers: IDocumentFooter[], group: IHeaderFooterGroup<FooterWrapper> = {}): IHeaderFooterGroup<FooterWrapper> {
        let newGroup = group;

        for (const footer of footers) {
            switch (footer.type) {
                case FooterReferenceType.DEFAULT:
                    newGroup = {
                        ...newGroup,
                        default: footer.footer,
                    };
                    break;
                case FooterReferenceType.FIRST:
                    newGroup = {
                        ...newGroup,
                        first: footer.footer,
                    };
                    break;
                case FooterReferenceType.EVEN:
                    newGroup = {
                        ...newGroup,
                        even: footer.footer,
                    };
                    break;
                default:
                    newGroup = {
                        ...newGroup,
                        default: footer.footer,
                    };
                    break;
            }
        }

        return newGroup;
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

    public get Settings(): Settings {
        return this.settings;
    }
}
