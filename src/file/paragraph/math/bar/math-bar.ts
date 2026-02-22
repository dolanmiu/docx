/**
 * Math Bar module for Office MathML.
 *
 * This module provides the math bar (overline/underline) element.
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-m_bar-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBarProperties } from "./math-bar-properties";

/**
 * Options for creating a math bar element.
 */
type MathBarOptions = {
    /** Position of the bar: "top" for overline, "bot" for underline */
    readonly type: "top" | "bot";
    /** Content under/over the bar */
    readonly children: readonly MathComponent[];
};

/**
 * Creates a math bar (overline or underline) element.
 *
 * Math bars are used for mathematical notation like vector symbols
 * (overline) or underlining expressions.
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-m_bar-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Bar">
 *   <xsd:sequence>
 *     <xsd:element name="barPr" type="CT_BarPr" minOccurs="0"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathBar = ({ type, children }: MathBarOptions): XmlComponent =>
    new BuilderElement({
        name: "m:bar",
        children: [createMathBarProperties({ type }), createMathBase({ children })],
    });
