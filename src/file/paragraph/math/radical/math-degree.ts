/**
 * Math Degree module for Office MathML.
 *
 * This module provides the degree element for radical structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_deg-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";

/**
 * Represents the degree of a radical (root) in a math equation.
 *
 * MathDegree specifies the degree of the root, such as 3 for cube root.
 * For square roots, this element is typically hidden.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_deg-1.html
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
export class MathDegree extends XmlComponent {
    public constructor(children?: readonly MathComponent[]) {
        super("m:deg");

        if (!!children) {
            for (const child of children) {
                this.root.push(child);
            }
        }
    }
}
