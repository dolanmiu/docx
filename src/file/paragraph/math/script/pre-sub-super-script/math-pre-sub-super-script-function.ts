/**
 * Math Pre-Sub-Super-Script module for Office MathML.
 *
 * This module provides pre-scripts with both subscript and superscript,
 * where the scripts appear before (to the left of) the base.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPre-1.html
 *
 * @module
 */
import { BuilderElement } from "@file/xml-components";

import { createMathPreSubSuperScriptProperties } from "./math-pre-sub-super-script-function-properties";
import type { MathComponent } from "../../math-component";
import { createMathBase, createMathSubScriptElement, createMathSuperScriptElement } from "../../n-ary";

/**
 * Options for creating a MathPreSubSuperScript.
 *
 * @see {@link MathPreSubSuperScript}
 */
export type IMathPreSubSuperScriptOptions = {
    /** The base expression */
    readonly children: readonly MathComponent[];
    /** The pre-subscript expression (appears lower-left of base) */
    readonly subScript: readonly MathComponent[];
    /** The pre-superscript expression (appears upper-left of base) */
    readonly superScript: readonly MathComponent[];
};

/**
 * Represents a pre-subscript and pre-superscript expression in a math equation.
 *
 * MathPreSubSuperScript displays a base with both subscript and superscript
 * positioned before (to the left of) the base, commonly used in tensor notation.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_sPre-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SPre">
 *   <xsd:sequence>
 *     <xsd:element name="sPrePr" type="CT_SPrePr" minOccurs="0"/>
 *     <xsd:element name="sub" type="CT_OMathArg"/>
 *     <xsd:element name="sup" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Pre-scripts for tensor notation
 * new MathPreSubSuperScript({
 *   children: [new MathRun("T")],
 *   subScript: [new MathRun("i")],
 *   superScript: [new MathRun("j")],
 * });
 * ```
 */
export class MathPreSubSuperScript extends BuilderElement {
    public constructor({ children, subScript, superScript }: IMathPreSubSuperScriptOptions) {
        super({
            name: "m:sPre",
            children: [
                createMathPreSubSuperScriptProperties(),
                createMathBase({ children: children }),
                createMathSubScriptElement({ children: subScript }),
                createMathSuperScriptElement({ children: superScript }),
            ],
        });
    }
}
