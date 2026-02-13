/**
 * Paragraph style module for WordprocessingML documents.
 *
 * This module provides paragraph style references including heading levels.
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

/**
 * Built-in heading level styles.
 *
 * These are the standard heading styles available in Word documents.
 */
export const HeadingLevel = {
    /** Heading 1 style */
    HEADING_1: "Heading1",
    /** Heading 2 style */
    HEADING_2: "Heading2",
    /** Heading 3 style */
    HEADING_3: "Heading3",
    /** Heading 4 style */
    HEADING_4: "Heading4",
    /** Heading 5 style */
    HEADING_5: "Heading5",
    /** Heading 6 style */
    HEADING_6: "Heading6",
    /** Title style */
    TITLE: "Title",
} as const;

/**
 * Represents a paragraph style reference in a WordprocessingML document.
 *
 * The pStyle element specifies the paragraph style to apply to the paragraph.
 */
export class Style extends XmlComponent {
    public constructor(styleId: string) {
        super("w:pStyle");
        this.root.push(
            new Attributes({
                val: styleId,
            }),
        );
    }
}
