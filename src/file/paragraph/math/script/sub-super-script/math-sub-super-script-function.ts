/**
 * Math SubSuperScript module for Office MathML.
 *
 * This module provides the MathSubSuperScript class for combined subscript/superscript.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSup-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { createMathSubSuperScriptProperties } from "./math-sub-super-script-function-properties";
import { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement, createMathSuperScriptElement } from "../../n-ary";

/**
 * Options for creating a MathSubSuperScript.
 *
 * @see {@link MathSubSuperScript}
 */
export type IMathSubSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The subscript expression */
    readonly subScript: readonly MathComponent[];
    /** The superscript expression */
    readonly superScript: readonly MathComponent[];
};

/**
 * Represents a combined subscript and superscript expression in a math equation.
 *
 * MathSubSuperScript displays a base with both a subscript and superscript,
 * commonly used for tensor notation or indexed variables with exponents.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSubSup-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSubSup">
 *   <xsd:sequence>
 *     <xsd:element name="sSubSupPr" type="CT_SSubSupPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x with subscript i and superscript 2
 * new MathSubSuperScript({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("i")],
 *   superScript: [new MathRun("2")],
 * });
 * ```
 */
export class MathSubSuperScript extends XmlComponent {
    public constructor(options: IMathSubSuperScriptOptions) {
        super("m:sSubSup");

        this.root.push(createMathSubSuperScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSubScriptElement({ children: options.subScript }));
        this.root.push(createMathSuperScriptElement({ children: options.superScript }));
    }
}
