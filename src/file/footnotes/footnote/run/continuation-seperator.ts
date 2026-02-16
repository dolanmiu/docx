/**
 * Footnote continuation separator module for WordprocessingML documents.
 *
 * This module provides the continuation separator element that defines
 * the line used when footnotes span multiple pages.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents a footnote continuation separator in WordprocessingML.
 *
 * ContinuationSeperator creates the separator line that appears when
 * footnotes continue from a previous page to the current page.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="continuationSeparator" type="CT_Empty" minOccurs="0"/>
 * ```
 *
 * @internal
 */
export class ContinuationSeperator extends XmlComponent {
    public constructor() {
        super("w:continuationSeparator");
    }
}
