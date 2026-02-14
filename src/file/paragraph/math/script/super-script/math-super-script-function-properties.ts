/**
 * Math SuperScript Properties module for Office MathML.
 *
 * This module provides properties for superscript structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSupPr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates properties for a superscript structure.
 *
 * This element specifies properties for the superscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSupPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSupPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSupPr",
    });
