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
import { StringValueElement, XmlComponent } from "@file/xml-components";

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
