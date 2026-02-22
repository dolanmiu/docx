/**
 * Math SubScript module for Office MathML.
 *
 * This module provides the MathSubScript class for subscript expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSub-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { createMathSubScriptProperties } from "./math-sub-script-function-properties";
import type { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement } from "../../n-ary";

/**
 * Options for creating a MathSubScript.
 *
 * @see {@link MathSubScript}
 */
export type IMathSubScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The subscript expression */
    readonly subScript: readonly MathComponent[];
};

/**
 * Represents a subscript expression in a math equation.
 *
 * MathSubScript displays a base with a subscript, like x₁.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sSub-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SSub">
 *   <xsd:sequence>
 *     <xsd:element name="sSubPr" type="CT_SSubPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // x with subscript 1
 * new MathSubScript({
 *   children: [new MathRun("x")],
 *   subScript: [new MathRun("1")],
 * });
 * ```
 */
export class MathSubScript extends XmlComponent {
    public constructor(options: IMathSubScriptOptions) {
        super("m:sSub");

        this.root.push(createMathSubScriptProperties());
        this.root.push(createMathBase({ children: options.children }));
        this.root.push(createMathSubScriptElement({ children: options.subScript }));
    }
}
