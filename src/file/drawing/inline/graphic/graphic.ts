/**
 * Graphic module for DrawingML elements.
 *
 * This module provides the graphic element that contains
 * pictures and other visual content.
 *
 * @module
 */
import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { GraphicData } from "./graphic-data";
import { OutlineOptions } from "./graphic-data/pic/shape-properties/outline/outline";

/**
 * Attributes for the graphic element.
 * @internal
 */
class GraphicAttributes extends XmlAttributeComponent<{
    readonly a: string;
}> {
    protected readonly xmlKeys = {
        a: "xmlns:a",
    };
}

/**
 * Represents a graphic element in DrawingML.
 *
 * Graphic is the container for graphical content such as
 * pictures, shapes, and charts within a drawing.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GraphicalObject">
 *   <xsd:sequence>
 *     <xsd:element name="graphicData" type="CT_GraphicalObjectData"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const graphic = new Graphic({
 *   mediaData: imageData,
 *   transform: transformation,
 *   outline: { color: "FF0000", width: 9525 }
 * });
 * ```
 */
export class Graphic extends XmlComponent {
    private readonly data: GraphicData;

    public constructor({
        mediaData,
        transform,
        outline,
    }: {
        readonly mediaData: IMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
    }) {
        super("a:graphic");
        this.root.push(
            new GraphicAttributes({
                a: "http://schemas.openxmlformats.org/drawingml/2006/main",
            }),
        );

        this.data = new GraphicData({ mediaData, transform, outline });

        this.root.push(this.data);
    }
}
