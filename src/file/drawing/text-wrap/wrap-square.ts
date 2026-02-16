/**
 * Wrap Square module for DrawingML text wrapping.
 *
 * This module provides square text wrapping for floating drawings
 * where text wraps around a rectangular bounding box.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { IDistance } from "../drawing";
import { IMargins } from "../floating";
import { ITextWrapping, TextWrappingSide } from "./text-wrapping";

type IWrapSquareAttributes = {
    readonly wrapText?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
} & IDistance;

/**
 * Attributes for the WrapSquare element.
 * @internal
 */
class WrapSquareAttributes extends XmlAttributeComponent<IWrapSquareAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
        wrapText: "wrapText",
    };
}

/**
 * Represents square text wrapping for a floating drawing.
 *
 * WrapSquare causes text to wrap around the rectangular bounding box
 * of the drawing on the specified side(s).
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapSquare">
 *   <xsd:sequence>
 *     <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distT" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distB" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 */
export class WrapSquare extends XmlComponent {
    public constructor(
        textWrapping: ITextWrapping,
        margins: IMargins = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        },
    ) {
        super("wp:wrapSquare");

        this.root.push(
            new WrapSquareAttributes({
                wrapText: textWrapping.side || TextWrappingSide.BOTH_SIDES,
                distT: margins.top,
                distB: margins.bottom,
                distL: margins.left,
                distR: margins.right,
            }),
        );
    }
}
