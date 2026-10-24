/**
 * Structured Document Tag Properties module.
 *
 * This module represents the properties of a structured document tag,
 * such as aliases and other metadata.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_sdtPr-1.html
 *
 * @module
 */
import { BuilderElement, StringValueElement, XmlComponent } from "@file/xml-components";

/**
 * Represents the properties of a Structured Document Tag.
 *
 * The StructuredDocumentTagProperties defines metadata for a structured document tag,
 * including display names (aliases), tags, and content control types.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_sdtPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtPr">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0"/>
 *     <xsd:element name="alias" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="tag" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="id" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="lock" type="CT_Lock" minOccurs="0"/>
 *     <xsd:element name="placeholder" type="CT_Placeholder" minOccurs="0"/>
 *     <xsd:element name="temporary" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="showingPlcHdr" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="dataBinding" type="CT_DataBinding" minOccurs="0"/>
 *     <xsd:element name="label" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="tabIndex" type="CT_UnsignedDecimalNumber" minOccurs="0"/>
 *     <xsd:choice minOccurs="0" maxOccurs="1">
 *       <xsd:element name="equation" type="CT_Empty"/>
 *       <xsd:element name="comboBox" type="CT_SdtComboBox"/>
 *       <xsd:element name="date" type="CT_SdtDate"/>
 *       ...
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create properties with an alias
 * new StructuredDocumentTagProperties("Table of Contents");
 * ```
 */
export class StructuredDocumentTagProperties extends XmlComponent {
    public constructor(alias?: string) {
        super("w:sdtPr");

        if (alias) {
            this.root.push(new StringValueElement("w:alias", alias));
        }
    }
}

/**
 * Creates the document part properties of a Structured Document Tag, which make it one of Word's building blocks of the
 * gallery named, such as "Table of Contents". Word then shows the content control with the gallery's commands, such as
 * Update Table for a table of contents. It is unique, so inserting another from the gallery replaces it.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-w_docPartObj-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtDocPart">
 *   <xsd:sequence>
 *     <xsd:element name="docPartGallery" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="docPartCategory" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="docPartUnique" type="CT_OnOff" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createDocumentPartObject("Table of Contents");
 * ```
 */
export const createDocumentPartObject = (gallery: string): XmlComponent =>
    new BuilderElement({
        name: "w:docPartObj",
        children: [new StringValueElement("w:docPartGallery", gallery), new BuilderElement({ name: "w:docPartUnique" })],
    });
