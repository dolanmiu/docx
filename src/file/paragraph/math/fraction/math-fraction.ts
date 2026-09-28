/**
 * Math Fraction module for Office MathML.
 *
 * This module provides the MathFraction class for fraction expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_f-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { MathDenominator } from "./math-denominator";
import { MathNumerator } from "./math-numerator";

/**
 * How a fraction is drawn (`m:type`):
 *
 * - `"stacked"`: the numerator over the denominator, with a bar between them;
 * - `"skewed"`: the numerator up and to the left of a slash, and the denominator down and to the right, as ½;
 * - `"linear"`: on one line, with a slash between them, as a/b;
 * - `"noBar"`: stacked, with no bar between them, as in a binomial coefficient.
 */
export type MathFractionType = "stacked" | "skewed" | "linear" | "noBar";

const TYPES: Readonly<Record<MathFractionType, string>> = { stacked: "bar", skewed: "skw", linear: "lin", noBar: "noBar" };

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
    /**
     * How the fraction is drawn: stacked, skewed, linear, or stacked with no bar.
     * @default "stacked"
     */
    readonly type?: MathFractionType;
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
 *
 * // n over k, as a binomial coefficient, in brackets
 * new MathRoundBrackets({
 *   children: [new MathFraction({ numerator: [new MathRun("n")], denominator: [new MathRun("k")], type: "noBar" })],
 * });
 * ```
 */
export class MathFraction extends XmlComponent {
    public constructor(options: IMathFractionOptions) {
        super("m:f");

        if (options.type !== undefined) {
            if (!Object.keys(TYPES).includes(options.type)) {
                throw new Error(`MathFraction: type is "${options.type}", which isn't one of ${Object.keys(TYPES).join(", ")}`);
            }
            this.root.push(
                new BuilderElement({
                    name: "m:fPr",
                    children: [
                        new BuilderElement<{ readonly value: string }>({
                            name: "m:type",
                            attributes: { value: { key: "m:val", value: TYPES[options.type] } },
                        }),
                    ],
                }),
            );
        }

        this.root.push(new MathNumerator(options.numerator));
        this.root.push(new MathDenominator(options.denominator));
    }
}
