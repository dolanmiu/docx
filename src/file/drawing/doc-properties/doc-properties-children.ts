/**
 * Child elements for document properties.
 *
 * This module provides hyperlink elements that can be attached to
 * drawing elements for interactive behavior.
 *
 * @module
 */
//     <sequence>
//         <element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1" />
//         <element name="hlinkHover" type="CT_Hyperlink" minOccurs="0" maxOccurs="1" />
//         <element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1" />
//     </sequence>

import { BuilderElement, type XmlComponent } from "@file/xml-components";

// <xsd:complexType name="CT_Hyperlink">
//     <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded" />
//     <xsd:attribute name="tgtFrame" type="s:ST_String" use="optional" />
//     <xsd:attribute name="tooltip" type="s:ST_String" use="optional" />
//     <xsd:attribute name="docLocation" type="s:ST_String" use="optional" />
//     <xsd:attribute name="history" type="s:ST_OnOff" use="optional" />
//     <xsd:attribute name="anchor" type="s:ST_String" use="optional" />
//     <xsd:attribute ref="r:id" />
// </xsd:complexType>

// TODO: Implement the rest of the attributes

/**
 * Creates a click hyperlink element for a drawing.
 *
 * This element defines what happens when a user clicks on a drawing element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="tgtFrame" type="s:ST_String"/>
 *   <xsd:attribute name="tooltip" type="s:ST_String"/>
 *   <xsd:attribute name="docLocation" type="s:ST_String"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff"/>
 *   <xsd:attribute name="anchor" type="s:ST_String"/>
 *   <xsd:attribute ref="r:id"/>
 * </xsd:complexType>
 * ```
 *
 * @param linkId - The relationship ID for the hyperlink target
 * @param hasXmlNs - Whether to include the XML namespace declaration
 * @returns An XML component representing the click hyperlink
 */
export const createHyperlinkClick = (linkId: string, hasXmlNs: boolean): XmlComponent =>
    new BuilderElement({
        name: "a:hlinkClick",
        attributes: {
            ...(hasXmlNs
                ? {
                      xmlns: {
                          key: "xmlns:a",
                          value: "http://schemas.openxmlformats.org/drawingml/2006/main",
                      },
                  }
                : {}),
            id: {
                key: "r:id",
                value: `rId${linkId}`,
            },
        },
    });

/**
 * Creates a hover hyperlink element for a drawing.
 *
 * This element defines what happens when a user hovers over a drawing element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Hyperlink">
 *   <xsd:group ref="EG_PContent" minOccurs="0" maxOccurs="unbounded"/>
 *   <xsd:attribute name="tgtFrame" type="s:ST_String"/>
 *   <xsd:attribute name="tooltip" type="s:ST_String"/>
 *   <xsd:attribute name="docLocation" type="s:ST_String"/>
 *   <xsd:attribute name="history" type="s:ST_OnOff"/>
 *   <xsd:attribute name="anchor" type="s:ST_String"/>
 *   <xsd:attribute ref="r:id"/>
 * </xsd:complexType>
 * ```
 *
 * @param linkId - The relationship ID for the hyperlink target
 * @param hasXmlNs - Whether to include the XML namespace declaration
 * @returns An XML component representing the hover hyperlink
 */
export const createHyperlinkHover = (linkId: string, hasXmlNs: boolean): XmlComponent =>
    new BuilderElement({
        name: "a:hlinkHover",
        attributes: {
            ...(hasXmlNs
                ? {
                      xmlns: {
                          key: "xmlns:a",
                          value: "http://schemas.openxmlformats.org/drawingml/2006/main",
                      },
                  }
                : {}),
            id: {
                key: "r:id",
                value: `rId${linkId}`,
            },
        },
    });
