/**
 * Structured Document Tag Content module.
 *
 * This module represents the content container for structured document tags,
 * including table of contents elements.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents the content portion of a Structured Document Tag.
 *
 * The StructuredDocumentTagContent contains the actual content elements
 * (paragraphs, tables, etc.) within a structured document tag, such as
 * the paragraphs that make up a table of contents.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtContentBlock">
 *   <xsd:group ref="EG_ContentBlockContent" minOccurs="0" maxOccurs="unbounded"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const content = new StructuredDocumentTagContent();
 * content.addChildElement(new Paragraph("Content"));
 * ```
 */
export class StructuredDocumentTagContent extends XmlComponent {
    public constructor() {
        super("w:sdtContent");
    }
}
