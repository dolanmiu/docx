/**
 * Paragraph border module for WordprocessingML documents.
 *
 * This module provides border options for paragraphs.
 *
 * Reference: http://officeopenxml.com/WPborders.php
 *
 * @module
 */
import { BorderElement, BorderStyle, IBorderOptions } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "@file/xml-components";

/**
 * Options for configuring paragraph borders.
 *
 * Borders can be applied to top, bottom, left, right, and between paragraphs.
 */
export type IBordersOptions = {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly between?: IBorderOptions;
};

/**
 * Represents paragraph borders in a WordprocessingML document.
 *
 * The pBdr element specifies borders that surround the paragraph.
 *
 * Reference: http://officeopenxml.com/WPborders.php
 */
export class Border extends IgnoreIfEmptyXmlComponent {
    public constructor(options: IBordersOptions) {
        super("w:pBdr");

        if (options.top) {
            this.root.push(new BorderElement("w:top", options.top));
        }

        if (options.bottom) {
            this.root.push(new BorderElement("w:bottom", options.bottom));
        }

        if (options.left) {
            this.root.push(new BorderElement("w:left", options.left));
        }

        if (options.right) {
            this.root.push(new BorderElement("w:right", options.right));
        }

        if (options.between) {
            this.root.push(new BorderElement("w:between", options.between));
        }
    }
}

/**
 * Represents a thematic break (horizontal rule) in a WordprocessingML document.
 *
 * Creates a horizontal line across the paragraph using a bottom border.
 */
export class ThematicBreak extends XmlComponent {
    public constructor() {
        super("w:pBdr");
        const bottom = new BorderElement("w:bottom", {
            color: "auto",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
        });
        this.root.push(bottom);
    }
}
