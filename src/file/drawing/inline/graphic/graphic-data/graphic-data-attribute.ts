/**
 * Graphic data attributes module.
 *
 * This module defines the URI attribute that identifies the type
 * of graphical content within a graphicData element.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML attributes component for graphic data.
 *
 * The URI attribute identifies the schema namespace of the content
 * stored in the graphicData element. For pictures, this is typically
 * "http://schemas.openxmlformats.org/drawingml/2006/picture".
 *
 * @internal
 */
export class GraphicDataAttributes extends XmlAttributeComponent<{
    /** URI identifying the type of graphical content */
    readonly uri?: string;
}> {
    protected readonly xmlKeys = {
        uri: "uri",
    };
}
