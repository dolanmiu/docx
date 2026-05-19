/**
 * Footnote reference marker module for WordprocessingML documents.
 *
 * This module provides the automatic footnote reference marker that appears
 * at the beginning of footnote content.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a footnote reference marker in WordprocessingML.
 *
 * FootnoteRef creates the automatic reference mark (typically a superscript
 * number) that appears at the beginning of the footnote content itself.
 * This corresponds to the w:footnoteRef element in OOXML.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="footnoteRef" type="CT_Empty" minOccurs="0"/>
 * ```
 *
 * @internal
 */
export class FootnoteRef extends XmlComponent {
    public constructor() {
        super("w:footnoteRef");
    }
}
