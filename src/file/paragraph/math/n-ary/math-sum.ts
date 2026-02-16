/**
 * Math Sum module for Office MathML.
 *
 * This module provides the MathSum class for summation (Σ) expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_nary-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { createMathNAryProperties } from "./math-n-ary-properties";
import { createMathSubScriptElement } from "./math-sub-script";
import { createMathSuperScriptElement } from "./math-super-script";

/**
 * Options for creating a MathSum.
 *
 * @see {@link MathSum}
 */
export type IMathSumOptions = {
    /** The expression being summed */
    readonly children: readonly MathComponent[];
    /** Optional lower bound (subscript) of the sum */
    readonly subScript?: readonly MathComponent[];
    /** Optional upper bound (superscript) of the sum */
    readonly superScript?: readonly MathComponent[];
};

/**
 * Represents a summation (Σ) expression in a math equation.
 *
 * MathSum displays the summation symbol with optional lower and upper bounds.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_nary-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Nary">
 *   <xsd:sequence>
 *     <xsd:element name="naryPr" type="CT_NaryPr" minOccurs="0"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Sum from i=1 to n
 * new MathSum({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("i=1")],
 *   superScript: [new MathRun("n")],
 * });
 * ```
 */
export class MathSum extends XmlComponent {
    public constructor(options: IMathSumOptions) {
        super("m:nary");

        this.root.push(
            createMathNAryProperties({
                accent: "∑",
                hasSuperScript: !!options.superScript,
                hasSubScript: !!options.subScript,
            }),
        );

        if (!!options.subScript) {
            this.root.push(createMathSubScriptElement({ children: options.subScript }));
        }

        if (!!options.superScript) {
            this.root.push(createMathSuperScriptElement({ children: options.superScript }));
        }

        this.root.push(createMathBase({ children: options.children }));
    }
}
