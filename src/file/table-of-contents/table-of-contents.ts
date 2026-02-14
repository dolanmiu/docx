/**
 * Table of Contents module for WordprocessingML documents.
 *
 * This module provides support for generating a table of contents
 * based on heading styles in the document.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { Paragraph } from "@file/paragraph";
import { Run } from "@file/paragraph/run";
import { Begin, End, Separate } from "@file/paragraph/run/field";

import { FieldInstruction } from "./field-instruction";
import { StructuredDocumentTagContent } from "./sdt-content";
import { StructuredDocumentTagProperties } from "./sdt-properties";
import { ITableOfContentsOptions } from "./table-of-contents-properties";

/**
 * Represents a Table of Contents in a WordprocessingML document.
 *
 * TableOfContents creates an auto-generated list of document headings
 * with page numbers. It uses a TOC field code to generate entries.
 *
 * Reference: http://officeopenxml.com/WPtableOfContents.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtBlock">
 *   <xsd:sequence>
 *     <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0"/>
 *     <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0"/>
 *     <xsd:element name="sdtContent" type="CT_SdtContentBlock" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new TableOfContents("Contents", {
 *   hyperlink: true,
 *   headingStyleRange: "1-3",
 * });
 * ```
 */
export class TableOfContents extends FileChild {
    public constructor(alias: string = "Table of Contents", properties?: ITableOfContentsOptions) {
        super("w:sdt");
        this.root.push(new StructuredDocumentTagProperties(alias));

        const content = new StructuredDocumentTagContent();

        const beginParagraph = new Paragraph({
            children: [
                new Run({
                    children: [new Begin(true), new FieldInstruction(properties), new Separate()],
                }),
            ],
        });

        content.addChildElement(beginParagraph);

        const endParagraph = new Paragraph({
            children: [
                new Run({
                    children: [new End()],
                }),
            ],
        });

        content.addChildElement(endParagraph);

        this.root.push(content);
    }
}
