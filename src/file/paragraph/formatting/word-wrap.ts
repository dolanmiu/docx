/**
 * Word wrap module for WordprocessingML documents.
 *
 * This module provides word wrap settings for paragraphs.
 *
 * Reference: http://officeopenxml.com/WPalignment.php
 *
 * @see http://officeopenxml.com/WPtableAlignment.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Attributes for the word wrap element.
 * @internal
 */
export class WordWrapAttributes extends XmlAttributeComponent<{ readonly val: 0 }> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents word wrap settings in a WordprocessingML document.
 *
 * The wordWrap element specifies whether word wrap should be disabled
 * for the paragraph.
 */
export class WordWrap extends XmlComponent {
    public constructor() {
        super("w:wordWrap");
        this.root.push(new WordWrapAttributes({ val: 0 }));
    }
}
