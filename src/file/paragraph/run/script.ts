/**
 * Subscript and superscript module for WordprocessingML documents.
 *
 * This module provides vertical alignment elements for subscript
 * and superscript text formatting.
 *
 * Reference: http://officeopenxml.com/WPtextFormatting.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_VerticalAlignRun">
 *   <xsd:attribute name="val" type="ST_VerticalAlignRun" use="required"/>
 * </xsd:complexType>
 * <xsd:simpleType name="ST_VerticalAlignRun">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="baseline"/>
 *     <xsd:enumeration value="superscript"/>
 *     <xsd:enumeration value="subscript"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

type IVerticalAlignAttributes = {
    readonly val: string;
};

/**
 * Creates a vertical alignment run element.
 * @internal
 */
const createVerticalAlignRun = (type: string): XmlComponent =>
    new BuilderElement<IVerticalAlignAttributes>({
        name: "w:vertAlign",
        attributes: {
            val: { key: "w:val", value: type },
        },
    });

/**
 * Creates superscript text formatting.
 *
 * Raises text above the baseline, commonly used for exponents
 * and ordinal indicators.
 */
export const createSuperScript = (): XmlComponent => createVerticalAlignRun("superscript");

/**
 * Creates subscript text formatting.
 *
 * Lowers text below the baseline, commonly used for chemical
 * formulas and footnote references.
 */
export const createSubScript = (): XmlComponent => createVerticalAlignRun("subscript");
