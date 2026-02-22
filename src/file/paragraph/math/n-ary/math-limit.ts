/**
 * Math Limit module for Office MathML.
 *
 * This module provides the limit element for under/over limit structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_lim-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";

/**
 * Represents a limit in a math equation.
 *
 * MathLimit is used within limit structures to specify the limit
 * expression that appears above or below the base.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_lim-1.html
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
export class MathLimit extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:lim");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
