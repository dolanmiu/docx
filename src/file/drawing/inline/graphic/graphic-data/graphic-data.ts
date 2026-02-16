/**
 * Graphic data module for DrawingML elements.
 *
 * This module provides the graphicData element that contains
 * the actual graphical content within a graphic element.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";
import { OutlineOptions } from "./pic/shape-properties/outline/outline";

/**
 * Represents graphical data within a DrawingML graphic element.
 *
 * GraphicData contains the actual picture, chart, or other graphical
 * content referenced by a graphic element. It uses a URI to identify
 * the type of content being stored.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GraphicalObjectData">
 *   <xsd:sequence>
 *     <xsd:any minOccurs="0" maxOccurs="unbounded" processContents="strict"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="uri" type="xsd:token" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const graphicData = new GraphicData({
 *   mediaData: imageData,
 *   transform: transformation,
 *   outline: { color: "000000", width: 9525 }
 * });
 * ```
 */
export class GraphicData extends XmlComponent {
    private readonly pic: Pic;

    public constructor({
        mediaData,
        transform,
        outline,
    }: {
        readonly mediaData: IMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
    }) {
        super("a:graphicData");

        this.root.push(
            new GraphicDataAttributes({
                uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.pic = new Pic({ mediaData, transform, outline });

        this.root.push(this.pic);
    }
}
