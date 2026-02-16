/**
 * Math Radical module for Office MathML.
 *
 * This module provides the MathRadical class for radical (root) expressions.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_rad-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { MathDegree } from "./math-degree";
import { MathRadicalProperties } from "./math-radical-properties";

/**
 * Options for creating a MathRadical.
 *
 * @see {@link MathRadical}
 */
export type IMathRadicalOptions = {
    /** The content under the radical sign */
    readonly children: readonly MathComponent[];
    /** Optional degree of the root (e.g., 3 for cube root). If omitted, square root is assumed. */
    readonly degree?: readonly MathComponent[];
};

/**
 * Represents a radical (root) expression in a math equation.
 *
 * MathRadical displays a radical symbol (√) with optional degree for
 * n-th roots (cube root, fourth root, etc.).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_rad-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Rad">
 *   <xsd:sequence>
 *     <xsd:element name="radPr" type="CT_RadPr" minOccurs="0"/>
 *     <xsd:element name="deg" type="CT_OMathArg"/>
 *     <xsd:element name="e" type="CT_OMathArg"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Square root of x
 * new MathRadical({ children: [new MathRun("x")] });
 *
 * // Cube root of x
 * new MathRadical({
 *   children: [new MathRun("x")],
 *   degree: [new MathRun("3")],
 * });
 * ```
 */
export class MathRadical extends XmlComponent {
    public constructor(options: IMathRadicalOptions) {
        super("m:rad");

        this.root.push(new MathRadicalProperties(!!options.degree));
        this.root.push(new MathDegree(options.degree));
        this.root.push(createMathBase({ children: options.children }));
    }
}
