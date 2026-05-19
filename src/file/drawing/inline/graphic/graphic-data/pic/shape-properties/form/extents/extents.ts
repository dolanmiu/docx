/**
 * Extents (size) element for DrawingML shapes.
 *
 * This module defines the size of a shape or picture in EMUs.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 *
 * @module
 */
// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "@file/xml-components";

import { ExtentsAttributes } from "./extents-attributes";

/**
 * Represents the extents (size) of a DrawingML shape.
 *
 * Defines the width and height of the shape in English Metric Units (EMUs).
 * One EMU equals 1/914,400 of an inch.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PositiveSize2D">
 *   <xsd:attribute name="cx" type="ST_PositiveCoordinate" use="required"/>
 *   <xsd:attribute name="cy" type="ST_PositiveCoordinate" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a 1-inch by 1-inch shape
 * const extents = new Extents(914400, 914400);
 * ```
 */
export class Extents extends XmlComponent {
    private readonly attributes: ExtentsAttributes;

    public constructor(x: number, y: number) {
        super("a:ext");

        this.attributes = new ExtentsAttributes({
            cx: x,
            cy: y,
        });

        this.root.push(this.attributes);
    }
}
