/**
 * Math Run module for Office MathML.
 *
 * This module provides the MathRun class for text content within math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathText } from "./math-text";

/**
 * Represents a run of text within a math equation.
 *
 * MathRun is the container for text content in Office MathML,
 * similar to how Run contains text in regular paragraphs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPR" minOccurs="0"/>
 *     <xsd:group ref="EG_ScriptStyle" minOccurs="0"/>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element ref="w:br"/>
 *       <xsd:element name="t" type="CT_Text"/>
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRun("x + y");
 * ```
 */
export class MathRun extends XmlComponent {
    public constructor(text: string) {
        super("m:r");

        this.root.push(new MathText(text));
    }
}
