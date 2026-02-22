/**
 * Math Function module for Office MathML.
 *
 * This module provides the MathFunction class for function expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_func-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { MathFunctionName } from "./math-function-name";
import { MathFunctionProperties } from "./math-function-properties";

/**
 * Options for creating a MathFunction.
 *
 * @see {@link MathFunction}
 */
export type IMathFunctionOptions = {
    /** The function argument (e.g., the expression inside sin(...)) */
    readonly children: readonly MathComponent[];
    /** The function name (e.g., "sin", "cos", "log") */
    readonly name: readonly MathComponent[];
};

/**
 * Represents a mathematical function in a math equation.
 *
 * MathFunction displays a function name followed by its argument,
 * such as sin(x), cos(θ), or log(n).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_func-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Func">
 *   <xsd:sequence>
 *     <xsd:element name="funcPr" type="CT_FuncPr" minOccurs="0"/>
 *     <xsd:element name="fName" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // sin(x)
 * new MathFunction({
 *   name: [new MathRun("sin")],
 *   children: [new MathRun("x")],
 * });
 * ```
 */
export class MathFunction extends XmlComponent {
    public constructor(options: IMathFunctionOptions) {
        super("m:func");

        this.root.push(new MathFunctionProperties());
        this.root.push(new MathFunctionName(options.name));
        this.root.push(createMathBase({ children: options.children }));
    }
}
