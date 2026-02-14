/**
 * Paragraph spacing module for WordprocessingML documents.
 *
 * This module provides spacing options for paragraphs including space before,
 * space after, and line spacing.
 *
 * Reference: http://officeopenxml.com/WPspacing.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Line spacing rule types.
 *
 * Specifies how the line height is calculated.
 */
export const LineRuleType = {
    /** Line spacing is at least the specified value */
    AT_LEAST: "atLeast",
    /** Line spacing is exactly the specified value */
    EXACTLY: "exactly",
    /** Line spacing is exactly the specified value (alias for EXACTLY) */
    EXACT: "exact",
    /** Line spacing is automatically determined based on content */
    AUTO: "auto",
} as const;

/**
 * Properties for configuring paragraph spacing.
 *
 * All values are in twips (twentieths of a point) unless otherwise specified.
 */
export type ISpacingProperties = {
    readonly after?: number;
    readonly before?: number;
    readonly line?: number;
    readonly lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType];
    readonly beforeAutoSpacing?: boolean;
    readonly afterAutoSpacing?: boolean;
};

class SpacingAttributes extends XmlAttributeComponent<ISpacingProperties> {
    protected readonly xmlKeys = {
        after: "w:after",
        before: "w:before",
        line: "w:line",
        lineRule: "w:lineRule",
        beforeAutoSpacing: "w:beforeAutospacing",
        afterAutoSpacing: "w:afterAutospacing",
    };
}

/**
 * Represents paragraph spacing in a WordprocessingML document.
 *
 * The spacing element specifies the spacing between lines and paragraphs.
 *
 * Reference: http://officeopenxml.com/WPspacing.php
 */
export class Spacing extends XmlComponent {
    public constructor(options: ISpacingProperties) {
        super("w:spacing");
        this.root.push(new SpacingAttributes(options));
    }
}
