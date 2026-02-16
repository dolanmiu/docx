/**
 * Math SuperScript Element module for Office MathML.
 *
 * This module provides the superscript element for n-ary operators and other structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sup-3.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

/**
 * Options for creating a superscript element.
 */
type MathSuperScriptElementOptions = {
    /** The content of the superscript */
    readonly children: readonly MathComponent[];
};

/**
 * Creates a superscript element for math structures.
 *
 * This element contains the superscript content, used in n-ary operators,
 * script objects, and other structures that support superscripts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sup-3.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathSuperScriptElement = ({ children }: MathSuperScriptElementOptions): XmlComponent =>
    new BuilderElement({
        name: "m:sup",
        children,
    });
