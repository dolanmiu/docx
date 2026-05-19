/**
 * Math Degree Hide module for Office MathML.
 *
 * This module provides the element to hide the degree in radical structures.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_degHide-1.html
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * @internal
 */
class MathDegreeHideAttributes extends XmlAttributeComponent<{ readonly hide: number }> {
    protected readonly xmlKeys = { hide: "m:val" };
}

/**
 * Represents a property to hide the degree in a radical.
 *
 * MathDegreeHide is used in radical properties to hide the degree,
 * typically for square roots where the degree (2) is not displayed.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_degHide-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @internal
 */
export class MathDegreeHide extends XmlComponent {
    public constructor() {
        super("m:degHide");

        this.root.push(new MathDegreeHideAttributes({ hide: 1 }));
    }
}
