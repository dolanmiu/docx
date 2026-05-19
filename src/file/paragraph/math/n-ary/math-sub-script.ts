/**
 * Math SubScript Element module for Office MathML.
 *
 * This module provides the subscript element for n-ary operators and other structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sub-3.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";

/**
 * Options for creating a subscript element.
 */
type MathSubScriptElementOptions = {
    /** The content of the subscript */
    readonly children: readonly MathComponent[];
};

/**
 * Creates a subscript element for math structures.
 *
 * This element contains the subscript content, used in n-ary operators,
 * script objects, and other structures that support subscripts.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sub-3.html
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
export const createMathSubScriptElement = ({ children }: MathSubScriptElementOptions): XmlComponent =>
    new BuilderElement({
        name: "m:sub",
        children,
    });
