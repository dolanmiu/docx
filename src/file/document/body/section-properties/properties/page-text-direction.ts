/**
 * Page text direction module for WordprocessingML section properties.
 *
 * Defines text flow direction for pages in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Specifies the text flow direction for pages in a section.
 *
 * This controls whether text flows horizontally (left-to-right) or
 * vertically (top-to-bottom), commonly used for East Asian languages.
 */
export const PageTextDirectionType = {
    /** Left-to-right, top-to-bottom (standard Western text flow) */
    LEFT_TO_RIGHT_TOP_TO_BOTTOM: "lrTb",
    /** Top-to-bottom, right-to-left (vertical East Asian text flow) */
    TOP_TO_BOTTOM_RIGHT_TO_LEFT: "tbRl",
} as const;

class PageTextDirectionAttributes extends XmlAttributeComponent<{
    readonly val: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents text direction (textDirection) for pages in a section.
 *
 * This element specifies the direction and orientation of text flow
 * for all pages in a section.
 *
 * Reference: http://officeopenxml.com/WPsectionPr.php
 *
 * @example
 * ```typescript
 * // Horizontal text flow (left-to-right, top-to-bottom)
 * new PageTextDirection(PageTextDirectionType.LEFT_TO_RIGHT_TOP_TO_BOTTOM);
 *
 * // Vertical text flow (top-to-bottom, right-to-left)
 * new PageTextDirection(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT);
 * ```
 */
export class PageTextDirection extends XmlComponent {
    public constructor(value: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType]) {
        super("w:textDirection");

        this.root.push(
            new PageTextDirectionAttributes({
                val: value,
            }),
        );
    }
}
