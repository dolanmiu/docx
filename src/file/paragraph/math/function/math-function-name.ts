/**
 * Math Function Name module for Office MathML.
 *
 * This module provides the function name element for function structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_fName-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

/**
 * Represents a function name in a math equation.
 *
 * MathFunctionName contains the function name (e.g., sin, cos, log)
 * that appears before the function argument.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_fName-1.html
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
 *
 * @internal
 */
export class MathFunctionName extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:fName");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
