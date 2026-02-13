/**
 * Wrap Top and Bottom module for DrawingML text wrapping.
 *
 * This module provides top-and-bottom text wrapping for floating drawings
 * where text appears above and below the drawing but not beside it.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

/**
 * Attributes for the WrapTopAndBottom element.
 * @internal
 */
class WrapTopAndBottomAttributes extends XmlAttributeComponent<{
    readonly distT?: number;
    readonly distB?: number;
}> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

/**
 * Represents top-and-bottom text wrapping for a floating drawing.
 *
 * WrapTopAndBottom causes text to appear above and below the drawing
 * without wrapping beside it, creating a line break effect.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapTopBottom">
 *   <xsd:sequence>
 *     <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="distT" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distB" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 */
export class WrapTopAndBottom extends XmlComponent {
    public constructor(
        margins: IMargins = {
            top: 0,
            bottom: 0,
        },
    ) {
        super("wp:wrapTopAndBottom");

        this.root.push(
            new WrapTopAndBottomAttributes({
                distT: margins.top,
                distB: margins.bottom,
            }),
        );
    }
}
