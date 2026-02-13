/**
 * Wrap Tight module for DrawingML text wrapping.
 *
 * This module provides tight text wrapping for floating drawings
 * where text wraps closely around the image shape.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

/**
 * Attributes for the WrapTight element.
 * @internal
 */
class WrapTightAttributes extends XmlAttributeComponent<{
    readonly distT?: number;
    readonly distB?: number;
}> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

/**
 * Represents tight text wrapping for a floating drawing.
 *
 * WrapTight causes text to wrap closely around the contours
 * of the drawing rather than its rectangular bounding box.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapTight">
 *   <xsd:sequence>
 *     <xsd:element name="wrapPolygon" type="CT_WrapPath"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 */
export class WrapTight extends XmlComponent {
    public constructor(
        margins: IMargins = {
            top: 0,
            bottom: 0,
        },
    ) {
        super("wp:wrapTight");

        this.root.push(
            new WrapTightAttributes({
                distT: margins.top,
                distB: margins.bottom,
            }),
        );
    }
}
