/**
 * Non-visual properties attributes module.
 *
 * This module defines the attributes for non-visual drawing properties
 * including ID, name, and description.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for non-visual drawing properties.
 *
 * Defines the identification and descriptive attributes for DrawingML objects.
 *
 * @internal
 */
export class NonVisualPropertiesAttributes extends XmlAttributeComponent<{
    /** Unique identifier for the drawing element */
    readonly id?: number;
    /** Name of the drawing element */
    readonly name?: string;
    /** Description of the drawing element */
    readonly descr?: string;
}> {
    protected readonly xmlKeys = {
        id: "id",
        name: "name",
        descr: "descr",
    };
}
