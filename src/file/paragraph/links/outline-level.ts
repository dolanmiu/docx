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
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates an outline level element for a paragraph.
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
 * createOutlineLevel(0);
 *
 * // Set outline level to 2 (Heading 3)
 * createOutlineLevel(2);
 * ```
 */
export const createOutlineLevel = (level: number): XmlComponent =>
    new BuilderElement<{ readonly val: number }>({
        name: "w:outlineLvl",
        attributes: {
            val: { key: "w:val", value: level },
        },
    });
