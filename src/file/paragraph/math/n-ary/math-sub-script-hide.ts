/**
 * Math SubScript Hide module for Office MathML.
 *
 * This module provides the element to hide subscripts in n-ary operators.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_subHide-1.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates a subscript hide element for n-ary operators.
 *
 * This element indicates that the subscript (lower limit) should be hidden
 * in n-ary operators when no subscript is provided.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_subHide-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="ST_OnOff"/>
 * </xsd:complexType>
 * ```
 */
export const createMathSubScriptHide = (): XmlComponent =>
    new BuilderElement<{ readonly hide: number }>({
        name: "m:subHide",
        attributes: {
            hide: { key: "m:val", value: 1 },
        },
    });
