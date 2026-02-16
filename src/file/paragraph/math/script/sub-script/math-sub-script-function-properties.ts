/**
 * Math SubScript Properties module for Office MathML.
 *
 * This module provides properties for subscript structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubPr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates properties for a subscript structure.
 *
 * This element specifies properties for the subscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathSubScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSubPr",
    });
