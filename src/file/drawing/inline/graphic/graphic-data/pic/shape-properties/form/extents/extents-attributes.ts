/**
 * Extents attributes for DrawingML shapes.
 *
 * This module defines the width and height attributes for shape extents.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for shape extents (size).
 *
 * Defines the width (cx) and height (cy) in EMUs.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:attribute name="cx" type="ST_PositiveCoordinate" use="required"/>
 * <xsd:attribute name="cy" type="ST_PositiveCoordinate" use="required"/>
 * ```
 *
 * @internal
 */
export class ExtentsAttributes extends XmlAttributeComponent<{
    /** Width in EMUs (English Metric Units) */
    readonly cx?: number;
    /** Height in EMUs (English Metric Units) */
    readonly cy?: number;
}> {
    protected readonly xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
