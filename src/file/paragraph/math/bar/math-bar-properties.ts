/**
 * Math Bar Properties module for Office MathML.
 *
 * This module provides properties for bar (overline/underline) structures in math equations.
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-m_barPr-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createMathBarPos } from "./math-bar-pos";

/**
 * Creates properties for a math bar structure.
 *
 * This element specifies properties for the bar object,
 * primarily the position (top for overline, bottom for underline).
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-m_barPr-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_BarPr">
 *   <xsd:sequence>
 *     <xsd:element name="pos" type="CT_TopBot" minOccurs="0"/>
 *     <xsd:element name="ctrlPr" type="CT_CtrlPr" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createMathBarProperties = ({ type }: { readonly type: string }): XmlComponent =>
    new BuilderElement({
        name: "m:barPr",
        children: [createMathBarPos({ val: type })],
    });
