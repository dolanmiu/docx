/**
 * Math Radical Properties module for Office MathML.
 *
 * This module provides properties for radical (root) structures in math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_radPr-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathDegreeHide } from "./math-degree-hide";

/**
 * Represents properties for a radical structure.
 *
 * This element specifies properties for the radical object,
 * such as whether to hide the degree (for square roots).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_radPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RadPr">
 *   <xsd:sequence>
 *     <xsd:element name="degHide" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export class MathRadicalProperties extends XmlComponent {
    public constructor(hasDegree: boolean) {
        super("m:radPr");

        if (!hasDegree) {
            this.root.push(new MathDegreeHide());
        }
    }
}
