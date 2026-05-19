/**
 * Math Base module for Office MathML.
 *
 * This module provides the base element (m:e) that contains
 * the primary content of math structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_e-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";

/**
 * Options for creating a math base element.
 */
type MathBaseOptions = {
    /** The content of the base */
    readonly children: readonly MathComponent[];
};

/**
 * Creates a math base element.
 *
 * The math base (m:e) is used within math structures like fractions,
 * radicals, and n-ary operators to contain the primary expression.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_e-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMathArg">
 *   <xsd:sequence>
 *     <xsd:element name="argPr" type="CT_OMathArgPr" minOccurs="0"/>
 *     <xsd:group ref="EG_OMathMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathBase = ({ children }: MathBaseOptions): XmlComponent =>
    new BuilderElement({
        name: "m:e",
        children,
    });
