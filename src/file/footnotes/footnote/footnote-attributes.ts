/**
 * Footnote attributes module for WordprocessingML documents.
 *
 * This module defines attributes for individual footnote elements.
 *
 * Reference: http://officeopenxml.com/WPfootnotes.php
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Represents the attributes for a footnote element.
 *
 * FootnoteAttributes defines the type and unique identifier for each footnote.
 *
 * @internal
 */
export class FootnoteAttributes extends XmlAttributeComponent<{
    /** Type of footnote (separator, continuationSeparator, or normal) */
    readonly type?: string;
    /** Unique numeric identifier for this footnote */
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "w:id",
    };
}
