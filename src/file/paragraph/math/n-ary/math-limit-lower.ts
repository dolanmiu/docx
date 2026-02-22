/**
 * Math Lower Limit module for Office MathML.
 *
 * This module provides the lower limit structure for math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limLow-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { MathLimit } from "./math-limit";

/**
 * Options for creating a MathLimitLower.
 *
 * @see {@link MathLimitLower}
 */
export type IMathLimitLowerOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The limit expression that appears below the base */
    readonly limit: readonly MathComponent[];
};

/**
 * Represents a lower limit structure in a math equation.
 *
 * MathLimitLower displays content with a limit underneath,
 * commonly used for limits in calculus (e.g., lim with x→0 below).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limLow-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LimLow">
 *   <xsd:sequence>
 *     <xsd:element name="limLowPr" type="CT_LimLowPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="lim" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // lim with x→0 underneath
 * new MathLimitLower({
 *   children: [new MathRun("lim")],
 *   limit: [new MathRun("x→0")],
 * });
 * ```
 */
export class MathLimitLower extends XmlComponent {
    public constructor(options: IMathLimitLowerOptions) {
        super("m:limLow");

        this.root.push(createMathBase({ children: options.children }));
        this.root.push(new MathLimit(options.limit));
    }
}
