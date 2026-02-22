/**
 * Header wrapper module for WordprocessingML documents.
 *
 * This module provides a wrapper for document headers, managing header content
 * along with their relationships and media. Headers can be configured for
 * different pages (first, even, odd, default).
 *
 * Reference: http://officeopenxml.com/WPheader.php
 *
 * @module
 */
import type { XmlComponent } from "@file/xml-components";

import type { HeaderFooterReferenceType } from "./document";
import type { IViewWrapper } from "./document-wrapper";
import { Header } from "./header/header";
import type { Media } from "./media";
import type { Paragraph } from "./paragraph";
import { Relationships } from "./relationships";
import type { Table } from "./table";

/**
 * Configuration for a document header.
 *
 * @property header - The HeaderWrapper instance containing the header content
 * @property type - The header type (default, first page, even pages)
 */
export type IDocumentHeader = {
    readonly header: HeaderWrapper;
    readonly type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
};

/**
 * Wrapper for document headers.
 *
 * HeaderWrapper combines a Header view with its Relationships and Media,
 * enabling headers to contain paragraphs, tables, images, and hyperlinks.
 * Each section can have multiple headers for different page types.
 *
 * Reference: http://officeopenxml.com/WPheader.php
 *
 * @example
 * ```typescript
 * const headerWrapper = new HeaderWrapper(media, 1);
 * headerWrapper.add(new Paragraph("Page Header"));
 * headerWrapper.add(new Table({
 *   rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Cell")] })] })],
 * }));
 * ```
 */
export class HeaderWrapper implements IViewWrapper {
    private readonly header: Header;
    private readonly relationships: Relationships;

    public constructor(
        private readonly media: Media,
        referenceId: number,
        initContent?: XmlComponent,
    ) {
        this.header = new Header(referenceId, initContent);
        this.relationships = new Relationships();
    }

    public add(item: Paragraph | Table): HeaderWrapper {
        this.header.add(item);

        return this;
    }

    public addChildElement(childElement: XmlComponent | string): void {
        this.header.addChildElement(childElement);
    }

    public get View(): Header {
        return this.header;
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }

    public get Media(): Media {
        return this.media;
    }
}
