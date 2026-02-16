/**
 * Math Sub-Super-Script Properties module for Office MathML.
 *
 * This module provides properties for combined subscript and superscript structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSupPr-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates properties for a combined subscript and superscript structure.
 *
 * This element specifies properties for the subscript-superscript object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSupPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubSupPr">
 *   <xsd:sequence>
 *     <xsd:element name="alignScripts" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathSubSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sSubSupPr",
    });
