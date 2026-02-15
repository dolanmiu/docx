/**
 * Math SuperScript module for Office MathML.
 *
 * This module provides the MathSuperScript class for superscript expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSup-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { createMathSuperScriptProperties } from "./math-super-script-function-properties";
import { MathComponent } from "../../math-component";
import { createMathBase, createMathSuperScriptElement } from "../../n-ary";

/**
 * Options for creating a MathSuperScript.
 *
 * @see {@link MathSuperScript}
 */
export type IMathSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The superscript (exponent) expression */
    readonly superScript: readonly MathComponent[];
};

/**
 * Represents a superscript expression in a math equation.
 *
 * MathSuperScript displays a base with an exponent, like x².
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSup-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSup">
 *   <xsd:sequence>
 *     <xsd:element name="sSupPr" type="CT_SSupPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x squared
 * new MathSuperScript({
 *   children: [new MathRun("x")],
 *   superScript: [new MathRun("2")],
 * });
 * ```
 */
export class MathSuperScript extends XmlComponent {
    public constructor(options: IMathSuperScriptOptions) {
        super("m:sSup");

        this.root.push(createMathSuperScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSuperScriptElement({ children: options.superScript }));
    }
}
