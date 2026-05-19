/**
 * Offset attributes for DrawingML shapes.
 *
 * This module defines the x and y coordinate attributes for shape offset.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for shape offset (position).
 *
 * Defines the x and y coordinates in EMUs.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
 * <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
 * ```
 *
 * @internal
 */
export class OffsetAttributes extends XmlAttributeComponent<{
    /** X coordinate in EMUs (English Metric Units) */
    readonly x?: number;
    /** Y coordinate in EMUs (English Metric Units) */
    readonly y?: number;
}> {
    protected readonly xmlKeys = {
        x: "x",
        y: "y",
    };
}
