/**
 * Math Round Brackets module for Office MathML.
 *
 * This module provides the MathRoundBrackets class for parentheses.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBracketProperties } from "./math-bracket-properties";

/**
 * Represents round brackets (parentheses) in a math equation.
 *
 * MathRoundBrackets displays content surrounded by parentheses ( ).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_D">
 *   <xsd:sequence>
 *     <xsd:element name="dPr" type="CT_DPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRoundBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
export class MathRoundBrackets extends XmlComponent {
    public constructor(options: { readonly children: readonly MathComponent[] }) {
        super("m:d");

        this.root.push(createMathBracketProperties({}));
        this.root.push(createMathBase({ children: options.children }));
    }
}
