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
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

type IWrapTopAndBottomAttributes = {
    readonly distT?: number;
    readonly distB?: number;
};

/**
 * Creates top-and-bottom text wrapping for a floating drawing.
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
export const createWrapTopAndBottom = (
    margins: IMargins = {
        top: 0,
        bottom: 0,
    },
): XmlComponent =>
    new BuilderElement<IWrapTopAndBottomAttributes>({
        name: "wp:wrapTopAndBottom",
        attributes: {
            distT: { key: "distT", value: margins.top },
            distB: { key: "distB", value: margins.bottom },
        },
    });
