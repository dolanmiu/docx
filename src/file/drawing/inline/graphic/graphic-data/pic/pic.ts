/**
 * Picture module for DrawingML elements.
 *
 * This module provides the picture element that represents an image
 * within a DrawingML graphic.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
// http://officeopenxml.com/drwPic.php
import type { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { BlipFill } from "./blip/blip-fill";
import { NonVisualPicProperties } from "./non-visual-pic-properties/non-visual-pic-properties";
import { PicAttributes } from "./pic-attributes";
import type { OutlineOptions } from "./shape-properties/outline/outline";
import { ShapeProperties } from "./shape-properties/shape-properties";

/**
 * Represents a picture element in DrawingML.
 *
 * A picture contains non-visual properties, image data (blip fill),
 * and shape properties that define how the image is displayed.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Picture">
 *   <xsd:sequence>
 *     <xsd:element name="nvPicPr" type="CT_PictureNonVisual"/>
 *     <xsd:element name="blipFill" type="CT_BlipFillProperties"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const pic = new Pic({
 *   mediaData: imageData,
 *   transform: { emus: { x: 914400, y: 914400 } },
 *   outline: { color: "000000", width: 9525 }
 * });
 * ```
 */
export class Pic extends XmlComponent {
    public constructor({
        mediaData,
        transform,
        outline,
    }: {
        readonly mediaData: IMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
    }) {
        super("pic:pic");

        this.root.push(
            new PicAttributes({
                xmlns: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.root.push(new NonVisualPicProperties());
        this.root.push(new BlipFill(mediaData));
        this.root.push(new ShapeProperties({ element: "pic", transform, outline }));
    }
}
