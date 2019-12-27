import * as shortid from "shortid";
import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { Document } from "./document";
import {
    FooterReferenceType,
    HeaderReferenceType,
    IPageSizeAttributes,
    SectionPropertiesOptions,
} from "./document/body/section-properties";
import { IPageMarginAttributes } from "./document/body/section-properties/page-margin/page-margin-attributes";
import { IFileProperties } from "./file-properties";
import { FooterWrapper, IDocumentFooter } from "./footer-wrapper";
import { FootNotes } from "./footnotes";
import { Footer, Header } from "./header";
import { HeaderWrapper, IDocumentHeader } from "./header-wrapper";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Hyperlink, HyperlinkRef, HyperlinkType, Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import { TargetModeType } from "./relationships/relationship/relationship";
import { Settings } from "./settings";
import { Styles } from "./styles";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { DefaultStylesFactory } from "./styles/factory";
import { Table } from "./table";
import { TableOfContents } from "./table-of-contents";

export interface ISectionOptions {
    readonly headers?: {
        readonly default?: Header;
        readonly first?: Header;
        readonly even?: Header;
    };
    readonly footers?: {
        readonly default?: Footer;
        readonly first?: Footer;
        readonly even?: Footer;
    };
    readonly size?: IPageSizeAttributes;
    readonly margins?: IPageMarginAttributes;
    readonly properties?: SectionPropertiesOptions;
    readonly children: Array<Paragraph | Table | TableOfContents | HyperlinkRef>;
}

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
    private readonly styles: Styles;
    private readonly hyperlinkCache: { readonly [key: string]: Hyperlink } = {};

    constructor(
        options: IPropertiesOptions = {
            creator: "Un-named",
            revision: "1",
            lastModifiedBy: "Un-named",
        },
        fileProperties: IFileProperties = {},
        sections: ISectionOptions[] = [],
    ) {
        this.coreProperties = new CoreProperties(options);
        this.numbering = new Numbering(
            options.numbering
                ? options.numbering
                : {
                      config: [],
                  },
        );
        this.docRelationships = new Relationships();
        this.fileRelationships = new Relationships();
        this.appProperties = new AppProperties();
        this.footNotes = new FootNotes();
        this.contentTypes = new ContentTypes();
        this.document = new Document();
        this.settings = new Settings();

        this.media = fileProperties.template && fileProperties.template.media ? fileProperties.template.media : new Media();

        if (fileProperties.template) {
            this.currentRelationshipId = fileProperties.template.currentRelationshipId + 1;
        }

        // set up styles
        if (fileProperties.template && options.externalStyles) {
            throw Error("can not use both template and external styles");
        }
        if (fileProperties.template) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(fileProperties.template.styles);
        } else if (options.externalStyles) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        } else if (options.styles) {
            const stylesFactory = new DefaultStylesFactory();
            const defaultStyles = stylesFactory.newInstance();
            this.styles = new Styles({
                ...defaultStyles,
                ...options.styles,
            });
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.styles = new Styles(stylesFactory.newInstance());
        }

        this.addDefaultRelationships();

        if (fileProperties.template && fileProperties.template.headers) {
            for (const templateHeader of fileProperties.template.headers) {
                this.addHeaderToDocument(templateHeader.header, templateHeader.type);
            }
        }

        if (fileProperties.template && fileProperties.template.footers) {
            for (const templateFooter of fileProperties.template.footers) {
                this.addFooterToDocument(templateFooter.footer, templateFooter.type);
            }
        }

        for (const section of sections) {
            this.document.Body.addSection(section.properties ? section.properties : {});

            for (const child of section.children) {
                if (child instanceof HyperlinkRef) {
                    const hyperlink = this.hyperlinkCache[child.id];
                    this.document.add(hyperlink);
                    continue;
                }

                this.document.add(child);
            }
        }

        if (options.footnotes) {
            for (const paragraph of options.footnotes) {
                this.footNotes.createFootNote(paragraph);
            }
        }

        if (options.hyperlinks) {
            const cache = {};

            for (const key in options.hyperlinks) {
                if (!options.hyperlinks[key]) {
                    continue;
                }

                const hyperlinkRef = options.hyperlinks[key];

                const hyperlink =
                    hyperlinkRef.type === HyperlinkType.EXTERNAL
                        ? this.createHyperlink(hyperlinkRef.link, hyperlinkRef.text)
                        : this.createInternalHyperLink(key, hyperlinkRef.text);

                cache[key] = hyperlink;
            }

            this.hyperlinkCache = cache;
        }
    }

    public addSection({
        headers = { default: new Header() },
        footers = { default: new Header() },
        margins = {},
        size = {},
        properties,
        children,
    }: ISectionOptions): void {
        this.document.Body.addSection({
            ...properties,
            headers: {
                default: headers.default ? this.createHeader(headers.default) : this.createHeader(new Header()),
                first: headers.first ? this.createHeader(headers.first) : undefined,
                even: headers.even ? this.createHeader(headers.even) : undefined,
            },
            footers: {
                default: footers.default ? this.createFooter(footers.default) : this.createFooter(new Footer()),
                first: footers.first ? this.createFooter(footers.first) : undefined,
                even: footers.even ? this.createFooter(footers.even) : undefined,
            },
            ...margins,
            ...size,
        });

        for (const child of children) {
            if (child instanceof HyperlinkRef) {
                const hyperlink = this.hyperlinkCache[child.id];
                this.document.add(hyperlink);
                continue;
            }

            this.document.add(child);
        }
    }

    public verifyUpdateFields(): void {
        if (this.document.getTablesOfContents().length) {
            this.settings.addUpdateFields();
        }
    }

    private createHyperlink(link: string, text: string = link): Hyperlink {
        const hyperlink = new Hyperlink(text, shortid.generate().toLowerCase());
        this.docRelationships.createRelationship(
            hyperlink.linkId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            link,
            TargetModeType.EXTERNAL,
        );
        return hyperlink;
    }

    private createInternalHyperLink(anchor: string, text: string = anchor): Hyperlink {
        const hyperlink = new Hyperlink(text, shortid.generate().toLowerCase(), anchor);
        // NOTE: unlike File#createHyperlink(), since the link is to an internal bookmark
        // we don't need to create a new relationship.
        return hyperlink;
    }

    private createHeader(header: Header): HeaderWrapper {
        const wrapper = new HeaderWrapper(this.media, this.currentRelationshipId++);

        for (const child of header.options.children) {
            wrapper.add(child);
        }

        this.addHeaderToDocument(wrapper);
        return wrapper;
    }

    private createFooter(footer: Footer): FooterWrapper {
        const wrapper = new FooterWrapper(this.media, this.currentRelationshipId++);

        for (const child of footer.options.children) {
            wrapper.add(child);
        }

        this.addFooterToDocument(wrapper);
        return wrapper;
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
        this.docRelationships.createRelationship(
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings",
            "settings.xml",
        );
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

    public get Headers(): HeaderWrapper[] {
        return this.headers.map((item) => item.header);
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

    public get HyperlinkCache(): { readonly [key: string]: Hyperlink } {
        return this.hyperlinkCache;
    }
}
