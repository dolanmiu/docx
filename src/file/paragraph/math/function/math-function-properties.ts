/**
 * Math Function Properties module for Office MathML.
 *
 * This module provides properties for function structures in math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_funcPr-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Represents properties for a math function structure.
 *
 * This element specifies properties for the function object,
 * such as function name alignment and spacing.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_funcPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FuncPr">
 *   <xsd:sequence>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export class MathFunctionProperties extends XmlComponent {
    public constructor() {
        super("m:funcPr");
    }
}
