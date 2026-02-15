/**
 * Math Integral module for Office MathML.
 *
 * This module provides the MathIntegral class for integral (∫) expressions.
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
 * Options for creating a MathIntegral.
 *
 * @see {@link MathIntegral}
 */
export type IMathIntegralOptions = {
    /** The integrand expression */
    readonly children: readonly MathComponent[];
    /** Optional lower bound of integration */
    readonly subScript?: readonly MathComponent[];
    /** Optional upper bound of integration */
    readonly superScript?: readonly MathComponent[];
};

/**
 * Represents an integral (∫) expression in a math equation.
 *
 * MathIntegral displays the integral symbol with optional bounds.
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
 * // Definite integral from 0 to 1
 * new MathIntegral({
 *   children: [new MathRun("f(x) dx")],
 *   subScript: [new MathRun("0")],
 *   superScript: [new MathRun("1")],
 * });
 * ```
 */
export class MathIntegral extends XmlComponent {
    public constructor(options: IMathIntegralOptions) {
        super("m:nary");

        this.root.push(
            createMathNAryProperties({
                accent: "",
                hasSuperScript: !!options.superScript,
                hasSubScript: !!options.subScript,
                limitLocationVal: "subSup",
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
