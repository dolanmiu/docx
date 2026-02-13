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

import { ParagraphChild } from "../paragraph";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

/**
 * Represents a bookmark in a WordprocessingML document.
 *
 * A bookmark identifies a location or range of content that can be referenced
 * elsewhere, such as from a hyperlink or table of contents.
 *
 * Reference: http://officeopenxml.com/WPbookmark.php
 *
 * @example
 * ```typescript
 * new Bookmark({
 *   id: "section1",
 *   children: [new TextRun("Section 1 Heading")],
 * });
 * ```
 */
export class Bookmark {
    private readonly bookmarkUniqueNumericId = bookmarkUniqueNumericIdGen();

    public readonly start: BookmarkStart;
    public readonly children: readonly ParagraphChild[];
    public readonly end: BookmarkEnd;

    public constructor(options: { readonly id: string; readonly children: readonly ParagraphChild[] }) {
        const linkId = this.bookmarkUniqueNumericId();

        this.start = new BookmarkStart(options.id, linkId);
        this.children = options.children;
        this.end = new BookmarkEnd(linkId);
    }
}

/**
 * Represents the start of a bookmark range.
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
 * Represents the end of a bookmark range.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>
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
