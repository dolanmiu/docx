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
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { IDistance } from "../drawing";
import { IMargins } from "../floating";
import { ITextWrapping, TextWrappingSide } from "./text-wrapping";

type IWrapSquareAttributes = {
    readonly wrapText?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
} & IDistance;

/**
 * Creates square text wrapping for a floating drawing.
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
export const createWrapSquare = (
    textWrapping: ITextWrapping,
    margins: IMargins = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
): XmlComponent =>
    new BuilderElement<IWrapSquareAttributes>({
        name: "wp:wrapSquare",
        attributes: {
            wrapText: { key: "wrapText", value: textWrapping.side || TextWrappingSide.BOTH_SIDES },
            distT: { key: "distT", value: margins.top },
            distB: { key: "distB", value: margins.bottom },
            distL: { key: "distL", value: margins.left },
            distR: { key: "distR", value: margins.right },
        },
    });
