/**
 * Bookmark module for WordprocessingML documents.
 *
 * Bookmarks are used to identify a location or selection of text within a document.
 * They can be used as targets for hyperlinks.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";
import { bookmarkUniqueNumericIdGen } from "@util/convenience-functions";

import type { ParagraphChild } from "../paragraph";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

/**
 * Options for creating a bookmark.
 *
 * @property id - The bookmark name used for reference
 * @property children - Array of paragraph children contained within the bookmark range
 */
export type IBookmarkOptions = {
    /** The bookmark name used for reference */
    readonly id: string;
    /** Array of paragraph children contained within the bookmark range */
    readonly children: readonly ParagraphChild[];
};

/**
 * Represents a bookmark in a WordprocessingML document.
 *
 * A bookmark identifies a location or range of content that can be referenced
 * elsewhere, such as from a hyperlink or table of contents. The bookmark consists
 * of a start marker, content, and an end marker.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
 * <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
 *
 * <xsd:complexType name="CT_Bookmark">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_BookmarkRange">
 *       <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a bookmark around a heading
 * new Bookmark({
 *   id: "section1",
 *   children: [new TextRun("Section 1 Heading")],
 * });
 *
 * // Link to the bookmark from elsewhere
 * new InternalHyperlink({
 *   children: [new TextRun("Go to Section 1")],
 *   anchor: "section1",
 * });
 * ```
 */
export class Bookmark {
    private readonly bookmarkUniqueNumericId = bookmarkUniqueNumericIdGen();

    public readonly start: BookmarkStart;
    public readonly children: readonly ParagraphChild[];
    public readonly end: BookmarkEnd;

    public constructor(options: IBookmarkOptions) {
        const linkId = this.bookmarkUniqueNumericId();

        this.start = new BookmarkStart(options.id, linkId);
        this.children = options.children;
        this.end = new BookmarkEnd(linkId);
    }
}

/**
 * Represents the start marker of a bookmark range.
 *
 * This element marks the beginning of a bookmarked region in the document.
 * It must be paired with a corresponding BookmarkEnd element with the same id.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
 *
 * <xsd:complexType name="CT_Bookmark">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_BookmarkRange">
 *       <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new BookmarkStart("myBookmark", 1);
 * ```
 */
export class BookmarkStart extends XmlComponent {
    public constructor(id: string, linkId: number) {
        super("w:bookmarkStart");

        const attributes = new BookmarkStartAttributes({
            name: id,
            id: linkId,
        });
        this.root.push(attributes);
    }
}

/**
 * Represents the end marker of a bookmark range.
 *
 * This element marks the end of a bookmarked region in the document.
 * It must be paired with a corresponding BookmarkStart element with the same id.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
 *
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_Markup">
 *       <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new BookmarkEnd(1);
 * ```
 */
export class BookmarkEnd extends XmlComponent {
    public constructor(linkId: number) {
        super("w:bookmarkEnd");

        const attributes = new BookmarkEndAttributes({
            id: linkId,
        });
        this.root.push(attributes);
    }
}
