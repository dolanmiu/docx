/**
 * Paragraph module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPparagraph.php
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { FootnoteReferenceRun } from "@file/footnotes";
import { IContext, IXmlableObject } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import { CheckBox } from "../checkbox";
import { TargetModeType } from "../relationships/relationship/relationship";
import { DeletedTextRun, InsertedTextRun } from "../track-revision";
import { ColumnBreak, PageBreak } from "./formatting/break";
import { Bookmark, ConcreteHyperlink, ExternalHyperlink, InternalHyperlink } from "./links";
import { Math } from "./math";
import { IParagraphPropertiesOptions, ParagraphProperties } from "./properties";
import { ImageRun, Run, SequentialIdentifier, SimpleField, SimpleMailMergeField, SymbolRun, TextRun } from "./run";
import { Comment, CommentRangeEnd, CommentRangeStart, CommentReference, Comments } from "./run/comment-run";

/**
 * The types of children that can be contained within a Paragraph element.
 * This union type represents all valid inline content elements that can appear
 * within a paragraph in WordprocessingML.
 */
export type ParagraphChild =
    | TextRun
    | ImageRun
    | SymbolRun
    | Bookmark
    | PageBreak
    | ColumnBreak
    | SequentialIdentifier
    | FootnoteReferenceRun
    | InternalHyperlink
    | ExternalHyperlink
    | InsertedTextRun
    | DeletedTextRun
    | Math
    | SimpleField
    | SimpleMailMergeField
    | Comments
    | Comment
    | CommentRangeStart
    | CommentRangeEnd
    | CommentReference
    | CheckBox;

/**
 * Options for creating a Paragraph element.
 *
 * @property text - Simple text content for the paragraph (creates a single TextRun)
 * @property children - Array of child elements (runs, hyperlinks, bookmarks, etc.)
 */
export type IParagraphOptions = {
    /** Simple text content for the paragraph. Creates a single TextRun. */
    readonly text?: string;
    /** Array of child elements such as TextRun, ImageRun, Hyperlink, Bookmark, etc. */
    readonly children?: readonly ParagraphChild[];
} & IParagraphPropertiesOptions;

/**
 * Represents a paragraph in a WordprocessingML document.
 *
 * A paragraph is the primary unit of block-level content in a document and can contain
 * various inline elements such as text runs, images, hyperlinks, and bookmarks.
 *
 * Reference: http://officeopenxml.com/WPparagraph.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_P">
 *   <xsd:sequence>
 *     <xsd:element name="pPr" type="CT_PPr" minOccurs="0"/>
 *     <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rsidRPr" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidR" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidDel" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidP" type="ST_LongHexNumber"/>
 *   <xsd:attribute name="rsidRDefault" type="ST_LongHexNumber"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Simple paragraph with text
 * new Paragraph("Hello World");
 *
 * // Paragraph with options
 * new Paragraph({
 *   children: [new TextRun("Hello"), new TextRun({ text: "World", bold: true })],
 *   alignment: AlignmentType.CENTER,
 * });
 * ```
 */
export class Paragraph extends FileChild {
    private readonly properties: ParagraphProperties;

    public constructor(options: string | IParagraphOptions) {
        super("w:p");

        if (typeof options === "string") {
            this.properties = new ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(new TextRun(options));
            return this;
        }

        this.properties = new ParagraphProperties(options);

        this.root.push(this.properties);

        if (options.text) {
            this.root.push(new TextRun(options.text));
        }

        if (options.children) {
            for (const child of options.children) {
                if (child instanceof Bookmark) {
                    this.root.push(child.start);
                    for (const textRun of child.children) {
                        this.root.push(textRun);
                    }
                    this.root.push(child.end);
                    continue;
                }

                this.root.push(child);
            }
        }
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        for (const element of this.root) {
            if (element instanceof ExternalHyperlink) {
                const index = this.root.indexOf(element);
                const concreteHyperlink = new ConcreteHyperlink(element.options.children, uniqueId());
                context.viewWrapper.Relationships.addRelationship(
                    concreteHyperlink.linkId,
                    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                    element.options.link,
                    TargetModeType.EXTERNAL,
                );
                this.root[index] = concreteHyperlink;
            }
        }

        return super.prepForXml(context);
    }

    public addRunToFront(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }
}
