/**
 * Comment module for WordprocessingML documents.
 *
 * This module provides support for comments (annotations) in documents. Comments
 * consist of comment ranges (start/end markers), comment references, and the
 * actual comment content.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { Relationships } from "@file/relationships";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Options for creating a single comment.
 *
 * @property id - Unique identifier for the comment
 * @property children - Content of the comment (typically paragraphs)
 * @property initials - Initials of the comment author
 * @property author - Name of the comment author
 * @property date - Date and time the comment was created
 */
export type ICommentOptions = {
    /** Unique identifier for the comment */
    readonly id: number;
    /** Content of the comment (typically paragraphs) */
    readonly children: readonly FileChild[];
    /** Initials of the comment author */
    readonly initials?: string;
    /** Name of the comment author */
    readonly author?: string;
    /** Date and time the comment was created */
    readonly date?: Date;
};

/**
 * Options for creating a comments container.
 *
 * @property children - Array of comment definitions
 */
export type ICommentsOptions = {
    /** Array of comment definitions */
    readonly children: readonly ICommentOptions[];
};

/**
 * @internal
 */
class CommentAttributes extends XmlAttributeComponent<{
    readonly id: number;
    readonly initials?: string;
    readonly author?: string;
    readonly date?: string;
}> {
    protected readonly xmlKeys = { id: "w:id", initials: "w:initials", author: "w:author", date: "w:date" };
}

/**
 * @internal
 */
class CommentRangeAttributes extends XmlAttributeComponent<{ readonly id: number }> {
    protected readonly xmlKeys = { id: "w:id" };
}

/**
 * @internal
 */
class RootCommentsAttributes extends XmlAttributeComponent<{
    readonly "xmlns:cx"?: string;
    readonly "xmlns:cx1"?: string;
    readonly "xmlns:cx2"?: string;
    readonly "xmlns:cx3"?: string;
    readonly "xmlns:cx4"?: string;
    readonly "xmlns:cx5"?: string;
    readonly "xmlns:cx6"?: string;
    readonly "xmlns:cx7"?: string;
    readonly "xmlns:cx8"?: string;
    readonly "xmlns:mc"?: string;
    readonly "xmlns:aink"?: string;
    readonly "xmlns:am3d"?: string;
    readonly "xmlns:o"?: string;
    readonly "xmlns:r"?: string;
    readonly "xmlns:m"?: string;
    readonly "xmlns:v"?: string;
    readonly "xmlns:wp14"?: string;
    readonly "xmlns:wp"?: string;
    readonly "xmlns:w10"?: string;
    readonly "xmlns:w"?: string;
    readonly "xmlns:w14"?: string;
    readonly "xmlns:w15"?: string;
    readonly "xmlns:w16cex"?: string;
    readonly "xmlns:w16cid"?: string;
    readonly "xmlns:w16"?: string;
    readonly "xmlns:w16sdtdh"?: string;
    readonly "xmlns:w16se"?: string;
    readonly "xmlns:wpg": string;
    readonly "xmlns:wpi"?: string;
    readonly "xmlns:wne"?: string;
    readonly "xmlns:wps"?: string;
}> {
    protected readonly xmlKeys = {
        "xmlns:cx": "xmlns:cx",
        "xmlns:cx1": "xmlns:cx1",
        "xmlns:cx2": "xmlns:cx2",
        "xmlns:cx3": "xmlns:cx3",
        "xmlns:cx4": "xmlns:cx4",
        "xmlns:cx5": "xmlns:cx5",
        "xmlns:cx6": "xmlns:cx6",
        "xmlns:cx7": "xmlns:cx7",
        "xmlns:cx8": "xmlns:cx8",
        "xmlns:mc": "xmlns:mc",
        "xmlns:aink": "xmlns:aink",
        "xmlns:am3d": "xmlns:am3d",
        "xmlns:o": "xmlns:o",
        "xmlns:r": "xmlns:r",
        "xmlns:m": "xmlns:m",
        "xmlns:v": "xmlns:v",
        "xmlns:wp14": "xmlns:wp14",
        "xmlns:wp": "xmlns:wp",
        "xmlns:w10": "xmlns:w10",
        "xmlns:w": "xmlns:w",
        "xmlns:w14": "xmlns:w14",
        "xmlns:w15": "xmlns:w15",
        "xmlns:w16cex": "xmlns:w16cex",
        "xmlns:w16cid": "xmlns:w16cid",
        "xmlns:w16": "xmlns:w16",
        "xmlns:w16sdtdh": "xmlns:w16sdtdh",
        "xmlns:w16se": "xmlns:w16se",
        "xmlns:wpg": "xmlns:wpg",
        "xmlns:wpi": "xmlns:wpi",
        "xmlns:wne": "xmlns:wne",
        "xmlns:wps": "xmlns:wps",
    };
}

/**
 * Represents the start of a comment range in a WordprocessingML document.
 *
 * Marks the beginning of a region of text that is associated with a comment.
 * Must be paired with a CommentRangeEnd with the same ID.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentRangeStart(0);
 * ```
 */
export class CommentRangeStart extends XmlComponent {
    public constructor(id: number) {
        super("w:commentRangeStart");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

/**
 * Represents the end of a comment range in a WordprocessingML document.
 *
 * Marks the end of a region of text that is associated with a comment.
 * Must be paired with a CommentRangeStart with the same ID.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MarkupRange">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentRangeEnd(0);
 * ```
 */
export class CommentRangeEnd extends XmlComponent {
    public constructor(id: number) {
        super("w:commentRangeEnd");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

/**
 * Represents a reference to a comment in a WordprocessingML document.
 *
 * This element is placed within a run to create a link to a comment.
 * It should be placed after the CommentRangeEnd element.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Markup">
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new CommentReference(0);
 * ```
 */
export class CommentReference extends XmlComponent {
    public constructor(id: number) {
        super("w:commentReference");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

/**
 * Represents a single comment in a WordprocessingML document.
 *
 * Contains the actual content of a comment, including author information
 * and the comment text (typically paragraphs).
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Comment">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="initials" type="s:ST_String"/>
 *   <xsd:attribute name="author" type="s:ST_String"/>
 *   <xsd:attribute name="date" type="s:ST_DateTime"/>
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Comment({
 *   id: 0,
 *   author: "John Doe",
 *   initials: "JD",
 *   children: [new Paragraph("This is a comment")],
 * });
 * ```
 */
export class Comment extends XmlComponent {
    public constructor({ id, initials, author, date = new Date(), children }: ICommentOptions) {
        super("w:comment");

        this.root.push(
            new CommentAttributes({
                id,
                initials,
                author,
                date: date.toISOString(),
            }),
        );

        for (const child of children) {
            this.root.push(child);
        }
    }
}

/**
 * Represents the comments container in a WordprocessingML document.
 *
 * This is the root element for the comments.xml file that stores all
 * comment definitions in the document.
 *
 * Reference: http://officeopenxml.com/WPrun.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="comments" type="CT_Comments"/>
 * <xsd:complexType name="CT_Comments">
 *   <xsd:sequence>
 *     <xsd:element name="comment" type="CT_Comment" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Comments({
 *   children: [
 *     {
 *       id: 0,
 *       author: "John Doe",
 *       children: [new Paragraph("First comment")],
 *     },
 *     {
 *       id: 1,
 *       author: "Jane Smith",
 *       children: [new Paragraph("Second comment")],
 *     },
 *   ],
 * });
 * ```
 */
export class Comments extends XmlComponent {
    private readonly relationships: Relationships;

    public constructor({ children }: ICommentsOptions) {
        super("w:comments");

        this.root.push(
            new RootCommentsAttributes({
                "xmlns:cx": "http://schemas.microsoft.com/office/drawing/2014/chartex",
                "xmlns:cx1": "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                "xmlns:cx2": "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                "xmlns:cx3": "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                "xmlns:cx4": "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                "xmlns:cx5": "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                "xmlns:cx6": "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                "xmlns:cx7": "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                "xmlns:cx8": "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "xmlns:aink": "http://schemas.microsoft.com/office/drawing/2016/ink",
                "xmlns:am3d": "http://schemas.microsoft.com/office/drawing/2017/model3d",
                "xmlns:o": "urn:schemas-microsoft-com:office:office",
                "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                "xmlns:v": "urn:schemas-microsoft-com:vml",
                "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                "xmlns:w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                "xmlns:w16": "http://schemas.microsoft.com/office/word/2018/wordml",
                "xmlns:w16sdtdh": "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
                "xmlns:w16se": "http://schemas.microsoft.com/office/word/2015/wordml/symex",
                "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            }),
        );

        for (const child of children) {
            this.root.push(new Comment(child));
        }

        this.relationships = new Relationships();
    }

    public get Relationships(): Relationships {
        return this.relationships;
    }
}
