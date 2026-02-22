/**
 * Math Fraction module for Office MathML.
 *
 * This module provides the MathFraction class for fraction expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_f-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { MathDenominator } from "./math-denominator";
import { MathNumerator } from "./math-numerator";

/**
 * Options for creating a MathFraction.
 *
 * @see {@link MathFraction}
 */
export type IMathFractionOptions = {
    /** Math components for the numerator (top) of the fraction */
    readonly numerator: readonly MathComponent[];
    /** Math components for the denominator (bottom) of the fraction */
    readonly denominator: readonly MathComponent[];
};

/**
 * Represents a fraction in a math equation.
 *
 * MathFraction displays a numerator over a denominator with a fraction bar.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_f-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_F">
 *   <xsd:sequence>
 *     <xsd:element name="fPr" type="CT_FPr" minOccurs="0"/>
 *     <xsd:element name="num" type="CT_OMathArg"/>
 *     <xsd:element name="den" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathFraction({
 *   numerator: [new MathRun("a + b")],
 *   denominator: [new MathRun("c")],
 * });
 * ```
 */
export class MathFraction extends XmlComponent {
    public constructor(options: IMathFractionOptions) {
        super("m:f");

        this.root.push(new MathNumerator(options.numerator));
        this.root.push(new MathDenominator(options.denominator));
    }
}
