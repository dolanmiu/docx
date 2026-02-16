/**
 * Footnote module for WordprocessingML documents.
 *
 * This module provides support for footnotes that appear at the bottom
 * of the page referenced from the main document text.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

import { FootnoteAttributes } from "./footnote-attributes";
import { FootnoteRefRun } from "./run/footnote-ref-run";

/**
 * Enumeration of footnote types.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @publicApi
 */
export const FootnoteType = {
    /** Separator line between body text and footnotes */
    SEPERATOR: "separator",
    /** Continuation separator for footnotes spanning pages */
    CONTINUATION_SEPERATOR: "continuationSeparator",
} as const;

/**
 * Options for creating a Footnote.
 *
 * @property id - Unique numeric identifier for this footnote
 * @property type - Type of footnote (separator, continuationSeparator, or normal)
 * @property children - Array of paragraphs that make up the footnote content
 *
 * @see {@link Footnote}
 */
export type IFootnoteOptions = {
    /** Unique numeric identifier for this footnote */
    readonly id: number;
    /** Type of footnote (separator or continuation separator) */
    readonly type?: (typeof FootnoteType)[keyof typeof FootnoteType];
    /** Paragraph content of the footnote */
    readonly children: readonly Paragraph[];
};

/**
 * Represents a footnote in a WordprocessingML document.
 *
 * Footnotes appear at the bottom of the page and are referenced
 * from the main document text using footnote reference marks.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FtnEdn">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_BlockLevelElts" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_FtnEdn"/>
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a footnote with content
 * const footnote = new Footnote({
 *   id: 1,
 *   children: [
 *     new Paragraph({
 *       children: [
 *         new TextRun("This is the footnote content."),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export class Footnote extends XmlComponent {
    public constructor(options: IFootnoteOptions) {
        super("w:footnote");
        this.root.push(
            new FootnoteAttributes({
                type: options.type,
                id: options.id,
            }),
        );

        for (let i = 0; i < options.children.length; i++) {
            const child = options.children[i];

            if (i === 0) {
                child.addRunToFront(new FootnoteRefRun());
            }

            this.root.push(child);
        }
    }
}
