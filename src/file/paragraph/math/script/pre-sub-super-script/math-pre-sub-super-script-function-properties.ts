/**
 * Math Pre-Sub-Super-Script Properties module for Office MathML.
 *
 * This module provides properties for pre-script structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPrePr-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates properties for a pre-subscript and pre-superscript structure.
 *
 * This element specifies properties for the pre-script object.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPrePr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SPrePr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathPreSubSuperScriptProperties = (): XmlComponent =>
    new BuilderElement({
        name: "m:sPrePr",
    });
