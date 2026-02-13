/**
 * Outline level module for WordprocessingML documents.
 *
 * This module provides the outline level element which specifies
 * the outline level of a paragraph for document outline/TOC purposes.
 *
 * Reference: http://officeopenxml.com/WPparagraph.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

/**
 * Represents an outline level for a paragraph.
 *
 * The outline level determines the paragraph's position in the document
 * outline and affects table of contents generation. Level 0 corresponds
 * to Heading 1, level 1 to Heading 2, etc.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DecimalNumber">
 *   <xsd:attribute name="val" type="xsd:integer" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Set outline level to 0 (Heading 1)
 * new OutlineLevel(0);
 *
 * // Set outline level to 2 (Heading 3)
 * new OutlineLevel(2);
 * ```
 */
export class OutlineLevel extends XmlComponent {
    public constructor(public readonly level: number) {
        super("w:outlineLvl");

        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}
