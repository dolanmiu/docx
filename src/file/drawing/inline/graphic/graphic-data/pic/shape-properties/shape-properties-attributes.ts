/**
 * Shape properties attributes for DrawingML.
 *
 * This module defines attributes for shape properties.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for shape properties.
 *
 * Defines optional attributes such as black and white mode.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:attribute name="bwMode" type="ST_BlackWhiteMode" use="optional"/>
 * ```
 *
 * @internal
 */
export class ShapePropertiesAttributes extends XmlAttributeComponent<{
    /** Black and white display mode */
    readonly bwMode?: string;
}> {
    protected readonly xmlKeys = {
        bwMode: "bwMode",
    };
}
