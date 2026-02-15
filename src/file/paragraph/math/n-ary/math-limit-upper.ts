/**
 * Math Upper Limit module for Office MathML.
 *
 * This module provides the upper limit structure for math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limUpp-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "./math-base";
import { MathLimit } from "./math-limit";

/**
 * Options for creating a MathLimitUpper.
 *
 * @see {@link MathLimitUpper}
 */
export type IMathLimitUpperOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The limit expression that appears above the base */
    readonly limit: readonly MathComponent[];
};

/**
 * Represents an upper limit structure in a math equation.
 *
 * MathLimitUpper displays content with a limit above,
 * commonly used for mathematical notation like lim with conditions above.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_limUpp-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LimUpp">
 *   <xsd:sequence>
 *     <xsd:element name="limUppPr" type="CT_LimUppPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="lim" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Expression with limit above
 * new MathLimitUpper({
 *   children: [new MathRun("max")],
 *   limit: [new MathRun("x∈S")],
 * });
 * ```
 */
export class MathLimitUpper extends XmlComponent {
    public constructor(options: IMathLimitUpperOptions) {
        super("m:limUpp");

        this.root.push(createMathBase({ children: options.children }));
        this.root.push(new MathLimit(options.limit));
    }
}
