import { AppProperties } from "./app-properties/app-properties";
import { ContentTypes } from "./content-types/content-types";
import { CoreProperties, IPropertiesOptions } from "./core-properties";
import { CustomProperties } from "./custom-properties";
import { HeaderFooterReferenceType, ISectionPropertiesOptions } from "./document/body/section-properties";
import { DocumentWrapper } from "./document-wrapper";
import { FileChild } from "./file-child";
import { FontWrapper } from "./fonts/font-wrapper";
import { FooterWrapper, IDocumentFooter } from "./footer-wrapper";
import { FootnotesWrapper } from "./footnotes-wrapper";
import { Footer, Header } from "./header";
import { HeaderWrapper, IDocumentHeader } from "./header-wrapper";
import { Media } from "./media";
import { Numbering } from "./numbering";
import { Comments } from "./paragraph/run/comment-run";
import { Relationships } from "./relationships";
import { Settings } from "./settings";
import { Styles } from "./styles";
import { ExternalStylesFactory } from "./styles/external-styles-factory";
import { DefaultStylesFactory } from "./styles/factory";

export type ISectionOptions = {
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
    readonly properties?: ISectionPropertiesOptions;
    readonly children: readonly FileChild[];
};

export class File {
    // eslint-disable-next-line functional/prefer-readonly-type
    private currentRelationshipId: number = 1;

    private readonly documentWrapper: DocumentWrapper;
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly headers: IDocumentHeader[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    private readonly footers: IDocumentFooter[] = [];
    private readonly coreProperties: CoreProperties;
    private readonly numbering: Numbering;
    private readonly media: Media;
    private readonly fileRelationships: Relationships;
    private readonly footnotesWrapper: FootnotesWrapper;
    private readonly settings: Settings;
    private readonly contentTypes: ContentTypes;
    private readonly customProperties: CustomProperties;
    private readonly appProperties: AppProperties;
    private readonly styles: Styles;
    private readonly comments: Comments;
    private readonly fontWrapper: FontWrapper;

    public constructor(options: IPropertiesOptions) {
        this.coreProperties = new CoreProperties({
            ...options,
            creator: options.creator ?? "Un-named",
            revision: options.revision ?? 1,
            lastModifiedBy: options.lastModifiedBy ?? "Un-named",
        });

        this.numbering = new Numbering(options.numbering ? options.numbering : { config: [] });

        this.comments = new Comments(options.comments ?? { children: [] });
        this.fileRelationships = new Relationships();
        this.customProperties = new CustomProperties(options.customProperties ?? []);
        this.appProperties = new AppProperties();
        this.footnotesWrapper = new FootnotesWrapper();
        this.contentTypes = new ContentTypes();
        this.documentWrapper = new DocumentWrapper({ background: options.background });
        this.settings = new Settings({
            compatibilityModeVersion: options.compatabilityModeVersion,
            compatibility: options.compatibility,
            evenAndOddHeaders: options.evenAndOddHeaderAndFooters ? true : false,
            trackRevisions: options.features?.trackRevisions,
            updateFields: options.features?.updateFields,
            defaultTabStop: options.defaultTabStop,
            hyphenation: {
                autoHyphenation: options.hyphenation?.autoHyphenation,
                hyphenationZone: options.hyphenation?.hyphenationZone,
                consecutiveHyphenLimit: options.hyphenation?.consecutiveHyphenLimit,
                doNotHyphenateCaps: options.hyphenation?.doNotHyphenateCaps,
            },
        });

        this.media = new Media();

        if (options.externalStyles !== undefined) {
            const stylesFactory = new ExternalStylesFactory();
            this.styles = stylesFactory.newInstance(options.externalStyles);
        } else if (options.styles) {
            const stylesFactory = new DefaultStylesFactory();
            const defaultStyles = stylesFactory.newInstance(options.styles.default);
            this.styles = new Styles({
                ...defaultStyles,
                ...options.styles,
            });
        } else {
            const stylesFactory = new DefaultStylesFactory();
            this.styles = new Styles(stylesFactory.newInstance());
        }

        this.addDefaultRelationships();

        for (const section of options.sections) {
            this.addSection(section);
        }

        if (options.footnotes) {
            // eslint-disable-next-line guard-for-in
            for (const key in options.footnotes) {
                this.footnotesWrapper.View.createFootNote(parseFloat(key), options.footnotes[key].children);
            }
        }

        this.fontWrapper = new FontWrapper(options.fonts ?? []);
    }

    private addSection({ headers = {}, footers = {}, children, properties }: ISectionOptions): void {
        this.documentWrapper.View.Body.addSection({
            ...properties,
            headerWrapperGroup: {
                default: headers.default ? this.createHeader(headers.default) : undefined,
                first: headers.first ? this.createHeader(headers.first) : undefined,
                even: headers.even ? this.createHeader(headers.even) : undefined,
            },
            footerWrapperGroup: {
                default: footers.default ? this.createFooter(footers.default) : undefined,
                first: footers.first ? this.createFooter(footers.first) : undefined,
                even: footers.even ? this.createFooter(footers.even) : undefined,
            },
        });

        for (const child of children) {
            this.documentWrapper.View.add(child);
        }
    }

    private createHeader(header: Header): HeaderWrapper {
        // eslint-disable-next-line functional/immutable-data
        const wrapper = new HeaderWrapper(this.media, this.currentRelationshipId++);

        for (const child of header.options.children) {
            wrapper.add(child);
        }

        this.addHeaderToDocument(wrapper);
        return wrapper;
    }

    private createFooter(footer: Footer): FooterWrapper {
        // eslint-disable-next-line functional/immutable-data
        const wrapper = new FooterWrapper(this.media, this.currentRelationshipId++);

        for (const child of footer.options.children) {
            wrapper.add(child);
        }

        this.addFooterToDocument(wrapper);
        return wrapper;
    }

    private addHeaderToDocument(
        header: HeaderWrapper,
        type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType] = HeaderFooterReferenceType.DEFAULT,
    ): void {
        // eslint-disable-next-line functional/immutable-data
        this.headers.push({ header, type });
        this.documentWrapper.Relationships.createRelationship(
            header.View.ReferenceId,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header",
            `header${this.headers.length}.xml`,
        );
        this.contentTypes.addHeader(this.headers.length);
    }

    private addFooterToDocument(
        footer: FooterWrapper,
        type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType] = HeaderFooterReferenceType.DEFAULT,
    ): void {
        // eslint-disable-next-line functional/immutable-data
        this.footers.push({ footer, type });
        this.documentWrapper.Relationships.createRelationship(
            footer.View.ReferenceId,
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
        this.fileRelationships.createRelationship(
            4,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties",
            "docProps/custom.xml",
        );

        this.documentWrapper.Relationships.createRelationship(
            // eslint-disable-next-line functional/immutable-data
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
            "styles.xml",
        );
        this.documentWrapper.Relationships.createRelationship(
            // eslint-disable-next-line functional/immutable-data
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering",
            "numbering.xml",
        );
        this.documentWrapper.Relationships.createRelationship(
            // eslint-disable-next-line functional/immutable-data
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes",
            "footnotes.xml",
        );
        this.documentWrapper.Relationships.createRelationship(
            // eslint-disable-next-line functional/immutable-data
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings",
            "settings.xml",
        );
        this.documentWrapper.Relationships.createRelationship(
            // eslint-disable-next-line functional/immutable-data
            this.currentRelationshipId++,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments",
            "comments.xml",
        );
    }

    public get Document(): DocumentWrapper {
        return this.documentWrapper;
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

    public get FileRelationships(): Relationships {
        return this.fileRelationships;
    }

    public get Headers(): readonly HeaderWrapper[] {
        return this.headers.map((item) => item.header);
    }

    public get Footers(): readonly FooterWrapper[] {
        return this.footers.map((item) => item.footer);
    }

    public get ContentTypes(): ContentTypes {
        return this.contentTypes;
    }

    public get CustomProperties(): CustomProperties {
        return this.customProperties;
    }

    public get AppProperties(): AppProperties {
        return this.appProperties;
    }

    public get FootNotes(): FootnotesWrapper {
        return this.footnotesWrapper;
    }

    public get Settings(): Settings {
        return this.settings;
    }

    public get Comments(): Comments {
        return this.comments;
    }

    public get FontTable(): FontWrapper {
        return this.fontWrapper;
    }
}
