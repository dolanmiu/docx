/**
 * Preset geometry attributes for DrawingML shapes.
 *
 * This module defines the shape type attribute for preset geometries.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for preset geometry.
 *
 * Defines the shape type identifier for a preset geometry.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:attribute name="prst" type="ST_ShapeType" use="required"/>
 * ```
 *
 * @internal
 */
export class PresetGeometryAttributes extends XmlAttributeComponent<{
    /** Preset shape type (e.g., "rect", "ellipse", "triangle") */
    readonly prst?: string;
}> {
    protected readonly xmlKeys = {
        prst: "prst",
    };
}
