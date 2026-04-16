/**
 * CommentsExtended module for WordprocessingML documents.
 *
 * Generates word/commentsExtended.xml which stores comment reply threading
 * relationships using w15:commentEx elements.
 *
 * Reference: ISO/IEC 29500 + Microsoft wml-2012.xsd
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import type { ICommentThreadData } from "./comment-run";

/**
 * @internal
 */
class CommentsExtendedAttributes extends XmlAttributeComponent<{
    readonly "xmlns:wpc"?: string;
    readonly "xmlns:mc"?: string;
    readonly "xmlns:w15"?: string;
    readonly "mc:Ignorable"?: string;
}> {
    protected readonly xmlKeys = {
        "xmlns:wpc": "xmlns:wpc",
        "xmlns:mc": "xmlns:mc",
        "xmlns:w15": "xmlns:w15",
        "mc:Ignorable": "mc:Ignorable",
    };
}

/**
 * @internal
 */
class CommentExAttributes extends XmlAttributeComponent<{
    readonly paraId: string;
    readonly paraIdParent?: string;
    readonly done?: string;
}> {
    protected readonly xmlKeys = {
        paraId: "w15:paraId",
        paraIdParent: "w15:paraIdParent",
        done: "w15:done",
    };
}

/**
 * @internal
 */
class CommentEx extends XmlComponent {
    public constructor(options: ICommentThreadData) {
        super("w15:commentEx");

        this.root.push(
            new CommentExAttributes({
                paraId: options.paraId,
                paraIdParent: options.parentParaId,
                done: options.done !== undefined ? (options.done ? "1" : "0") : undefined,
            }),
        );
    }
}

/**
 * Represents the commentsExtended part (word/commentsExtended.xml).
 *
 * Contains w15:commentEx elements that define comment reply threading
 * and resolved status.
 *
 * ## XSD Schema (wml-2012.xsd)
 * ```xml
 * <xsd:complexType name="CT_CommentsEx">
 *   <xsd:sequence>
 *     <xsd:element name="commentEx" type="CT_CommentEx" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export class CommentsExtended extends XmlComponent {
    public constructor(threadData: readonly ICommentThreadData[]) {
        super("w15:commentsEx");

        this.root.push(
            new CommentsExtendedAttributes({
                "xmlns:wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                "mc:Ignorable": "w15",
            }),
        );

        for (const data of threadData) {
            this.root.push(new CommentEx(data));
        }
    }
}
