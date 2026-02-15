/**
 * Offset (position) element for DrawingML shapes.
 *
 * This module defines the position of a shape or picture in EMUs.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 *
 * @module
 */
// http://officeopenxml.com/drwSp-size.php
import { XmlComponent } from "@file/xml-components";

import { OffsetAttributes } from "./off-attributes";

/**
 * Represents the offset (position) of a DrawingML shape.
 *
 * Defines the x and y coordinates of the shape's position in
 * English Metric Units (EMUs). One EMU equals 1/914,400 of an inch.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Point2D">
 *   <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
 *   <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const offset = new Offset();
 * ```
 */
export class Offset extends XmlComponent {
    public constructor() {
        super("a:off");

        this.root.push(
            new OffsetAttributes({
                x: 0,
                y: 0,
            }),
        );
    }
}
