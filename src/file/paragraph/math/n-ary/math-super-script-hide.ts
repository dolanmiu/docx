/**
 * Math SuperScript Hide module for Office MathML.
 *
 * This module provides the element to hide superscripts in n-ary operators.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_supHide-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates a superscript hide element for n-ary operators.
 *
 * This element indicates that the superscript (upper limit) should be hidden
 * in n-ary operators when no superscript is provided.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_supHide-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="ST_OnOff"/>
 * </xsd:complexType>
 * ```
 */
export const createMathSuperScriptHide = (): XmlComponent =>
    new BuilderElement<{ readonly hide: number }>({
        name: "m:supHide",
        attributes: {
            hide: { key: "m:val", value: 1 },
        },
    });
