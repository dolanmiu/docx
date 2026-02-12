/**
 * Paragraph style module for WordprocessingML documents.
 *
 * This module provides paragraph style references including heading levels.
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

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
 * Creates a paragraph style reference for a WordprocessingML document.
 *
 * The pStyle element specifies the paragraph style to apply to the paragraph.
 *
 * Reference: http://officeopenxml.com/WPstyle.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_String">
 *   <xsd:attribute name="val" type="s:ST_String" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Using a built-in heading style
 * new Paragraph({
 *   style: HeadingLevel.HEADING_1,
 *   children: [new TextRun("Chapter 1")],
 * });
 *
 * // Using a custom style
 * new Paragraph({
 *   style: "MyCustomStyle",
 *   children: [new TextRun("Styled text")],
 * });
 * ```
 */
export const createParagraphStyle = (styleId: string): XmlComponent =>
    new BuilderElement<{ readonly val: string }>({
        name: "w:pStyle",
        attributes: {
            val: { key: "w:val", value: styleId },
        },
    });
