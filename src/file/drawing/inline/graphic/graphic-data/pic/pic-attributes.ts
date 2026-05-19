/**
 * Picture attributes module.
 *
 * This module defines the XML namespace attribute for picture elements.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * Attributes for picture elements.
 *
 * Defines the XML namespace declaration for picture elements in DrawingML.
 *
 * @internal
 */
export class PicAttributes extends XmlAttributeComponent<{
    /** Picture namespace declaration (http://schemas.openxmlformats.org/drawingml/2006/picture) */
    readonly xmlns?: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns:pic",
    };
}
