/**
 * CommentsExtensible module for WordprocessingML documents.
 *
 * Generates word/commentsExtensible.xml which stores extended comment metadata
 * such as the UTC date of creation keyed by durableId.
 *
 * Reference: Microsoft wml-cex-2018.xsd
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import type { ICommentExtensibleData } from "./comment-run";

/**
 * @internal
 */
class CommentsExtensibleAttributes extends XmlAttributeComponent<{
    readonly "xmlns:w16cex"?: string;
    readonly "xmlns:mc"?: string;
    readonly "mc:Ignorable"?: string;
}> {
    protected readonly xmlKeys = {
        "xmlns:w16cex": "xmlns:w16cex",
        "xmlns:mc": "xmlns:mc",
        "mc:Ignorable": "mc:Ignorable",
    };
}

/**
 * @internal
 */
class CommentExtensibleAttributes extends XmlAttributeComponent<{
    readonly durableId: string;
    readonly dateUtc?: string;
}> {
    protected readonly xmlKeys = {
        durableId: "w16cex:durableId",
        dateUtc: "w16cex:dateUtc",
    };
}

/**
 * @internal
 */
class CommentExtensible extends XmlComponent {
    public constructor(options: ICommentExtensibleData) {
        super("w16cex:commentExtensible");

        this.root.push(
            new CommentExtensibleAttributes({
                durableId: options.durableId,
                dateUtc: options.dateUtc,
            }),
        );
    }
}

/**
 * Represents the commentsExtensible part (word/commentsExtensible.xml).
 *
 * Contains w16cex:commentExtensible elements that define extended metadata
 * (UTC date, etc.) per comment keyed by durableId.
 *
 * ## XSD Schema (wml-cex-2018.xsd)
 * ```xml
 * <xsd:complexType name="CT_CommentsExtensible">
 *   <xsd:sequence>
 *     <xsd:element name="commentExtensible" type="CT_CommentExtensible" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * <xsd:complexType name="CT_CommentExtensible">
 *   <xsd:attribute name="durableId" type="w12:ST_LongHexNumber" use="required"/>
 *   <xsd:attribute name="dateUtc" type="w12:ST_DateTime" use="optional"/>
 * </xsd:complexType>
 * ```
 */
export class CommentsExtensible extends XmlComponent {
    public constructor(commentExtensibleData: readonly ICommentExtensibleData[]) {
        super("w16cex:commentsExtensible");

        this.root.push(
            new CommentsExtensibleAttributes({
                "xmlns:w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "mc:Ignorable": "w16cex",
            }),
        );

        for (const data of commentExtensibleData) {
            this.root.push(new CommentExtensible(data));
        }
    }
}
