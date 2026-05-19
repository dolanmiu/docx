/**
 * Footer wrapper module for WordprocessingML documents.
 *
 * This module provides a wrapper for document footers, managing footer content
 * along with their relationships and media. Footers can be configured for
 * different pages (first, even, odd, default).
 *
 * Reference: http://officeopenxml.com/WPfooter.php
 *
 * @module
 */
import type { XmlComponent } from "@file/xml-components";

import type { HeaderFooterReferenceType } from "./document";
import type { IViewWrapper } from "./document-wrapper";
import { Footer } from "./footer/footer";
import type { Media } from "./media";
import type { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import type { Table } from "./table";

/**
 * Configuration for a document footer.
 *
 * @property footer - The FooterWrapper instance containing the footer content
 * @property type - The footer type (default, first page, even pages)
 */
export type IDocumentFooter = {
    readonly footer: FooterWrapper;
    readonly type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
};

/**
 * Wrapper for document footers.
 *
 * FooterWrapper combines a Footer view with its Relationships and Media,
 * enabling footers to contain paragraphs, tables, images, and hyperlinks.
 * Each section can have multiple footers for different page types.
 *
 * Reference: http://officeopenxml.com/WPfooter.php
 *
 * @example
 * ```typescript
 * const footerWrapper = new FooterWrapper(media, 1);
 * footerWrapper.add(new Paragraph("Page Footer"));
 * footerWrapper.add(new Table({
 *   rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Cell")] })] })],
 * }));
 * ```
 */
export class FooterWrapper implements IViewWrapper {
    private readonly footer: Footer;
    private readonly relationships: Relationships;

    public constructor(
        private readonly media: Media,
        referenceId: number,
        initContent?: XmlComponent,
    ) {
        this.footer = new Footer(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public add(item: Paragraph | Table): void {
        this.footer.add(item);
    }

    public addChildElement(childElement: XmlComponent): void {
        this.footer.addChildElement(childElement);
    }

    public get View(): Footer {
        return this.footer;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }

    public get Media(): Media {
        return this.media;
    }
}
