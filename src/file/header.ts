/**
 * Header and footer module for WordprocessingML documents.
 *
 * This module provides classes for creating headers and footers
 * that can be attached to document sections.
 *
 * Reference: http://officeopenxml.com/WPSectionHeaderFooters.php
 *
 * @module
 */
import { Paragraph } from "./paragraph";
import { Table } from "./table";

/**
 * Options for creating a header or footer.
 *
 * @see {@link Header}
 * @see {@link Footer}
 */
export type IHeaderOptions = {
    /** The content elements (paragraphs and tables) for the header/footer */
    readonly children: readonly (Paragraph | Table)[];
};

/**
 * Represents a document header.
 *
 * Headers appear at the top of each page in a section and can contain
 * paragraphs, tables, images, and other content.
 *
 * @example
 * ```typescript
 * const header = new Header({
 *   children: [
 *     new Paragraph({ children: [new TextRun("Company Name")] }),
 *   ],
 * });
 * ```
 */
export class Header {
    public readonly options: IHeaderOptions;

    public constructor(options: IHeaderOptions = { children: [] }) {
        this.options = options;
    }
}

/**
 * Represents a document footer.
 *
 * Footers appear at the bottom of each page in a section and can contain
 * paragraphs, tables, images, and other content.
 *
 * @example
 * ```typescript
 * const footer = new Footer({
 *   children: [
 *     new Paragraph({ children: [new TextRun("Page "), PageNumber.CURRENT] }),
 *   ],
 * });
 * ```
 */
export class Footer {
    public readonly options: IHeaderOptions;

    public constructor(options: IHeaderOptions = { children: [] }) {
        this.options = options;
    }
}
