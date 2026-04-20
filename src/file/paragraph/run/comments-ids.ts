/**
 * CommentsIds module for WordprocessingML documents.
 *
 * Generates word/commentsIds.xml which maps each comment's paraId to a stable
 * durableId, enabling tools (including Word) to correlate comments across
 * revisions and with commentsExtensible.xml.
 *
 * Reference: Microsoft wml-cid-2016.xsd
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import type { ICommentIdData } from "./comment-run";

/**
 * @internal
 */
class CommentsIdsAttributes extends XmlAttributeComponent<{
    readonly "xmlns:w16cid"?: string;
    readonly "xmlns:mc"?: string;
    readonly "mc:Ignorable"?: string;
}> {
    protected readonly xmlKeys = {
        "xmlns:w16cid": "xmlns:w16cid",
        "xmlns:mc": "xmlns:mc",
        "mc:Ignorable": "mc:Ignorable",
    };
}

/**
 * @internal
 */
class CommentIdAttributes extends XmlAttributeComponent<{
    readonly paraId: string;
    readonly durableId: string;
}> {
    protected readonly xmlKeys = {
        paraId: "w16cid:paraId",
        durableId: "w16cid:durableId",
    };
}

/**
 * @internal
 */
class CommentId extends XmlComponent {
    public constructor(options: ICommentIdData) {
        super("w16cid:commentId");

        this.root.push(
            new CommentIdAttributes({
                paraId: options.paraId,
                durableId: options.durableId,
            }),
        );
    }
}

/**
 * Represents the commentsIds part (word/commentsIds.xml).
 *
 * Contains w16cid:commentId elements that map comment paraIds to durableIds.
 *
 * ## XSD Schema (wml-cid-2016.xsd)
 * ```xml
 * <xsd:complexType name="CT_CommentsIds">
 *   <xsd:sequence>
 *     <xsd:element name="commentId" type="CT_CommentId" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * <xsd:complexType name="CT_CommentId">
 *   <xsd:attribute name="paraId" type="w12:ST_LongHexNumber" use="required"/>
 *   <xsd:attribute name="durableId" type="w12:ST_LongHexNumber" use="required"/>
 * </xsd:complexType>
 * ```
 */
export class CommentsIds extends XmlComponent {
    public constructor(commentIdData: readonly ICommentIdData[]) {
        super("w16cid:commentsIds");

        this.root.push(
            new CommentsIdsAttributes({
                "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "mc:Ignorable": "w16cid",
            }),
        );

        for (const data of commentIdData) {
            this.root.push(new CommentId(data));
        }
    }
}
