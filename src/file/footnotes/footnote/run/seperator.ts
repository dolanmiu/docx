/**
 * Footnote separator module for WordprocessingML documents.
 *
 * This module provides the separator element that defines the line
 * separating body text from footnotes.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a footnote separator in WordprocessingML.
 *
 * Seperator creates the separator line that appears between the main
 * document text and the footnote area at the bottom of the page.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="separator" type="CT_Empty" minOccurs="0"/>
 * ```
 *
 * @internal
 */
export class Seperator extends XmlComponent {
    public constructor() {
        super("w:separator");
    }
}
