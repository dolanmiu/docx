/**
 * App Properties module for WordprocessingML documents.
 *
 * Provides support for extended document properties specific to Office applications.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesExtended.xsd
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { AppPropertiesAttributes } from "./app-properties-attributes";

/**
 * Represents the extended application properties of a WordprocessingML document.
 *
 * Extended properties contain application-specific metadata such as total editing time,
 * word count, character count, and other Office-specific information.
 *
 * Reference: ISO-IEC29500-4_2016 shared-documentPropertiesExtended.xsd
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Properties">
 *   <xsd:sequence>
 *     <xsd:element name="Template" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Manager" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Company" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Pages" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Words" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Characters" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="PresentationFormat" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="Lines" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Paragraphs" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="CharactersWithSpaces" type="xsd:int" minOccurs="0"/>
 *     <xsd:element name="Application" type="xsd:string" minOccurs="0"/>
 *     <xsd:element name="DocSecurity" type="xsd:int" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const appProps = new AppProperties();
 * ```
 */
export class AppProperties extends XmlComponent {
    public constructor() {
        super("Properties");

        this.root.push(
            new AppPropertiesAttributes({
                xmlns: "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties",
                vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
            }),
        );
    }
}
