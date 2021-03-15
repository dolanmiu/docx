// http://officeopenxml.com/drwPic.php
import { IMediaData, IMediaDataTransformation } from "file/media";
import { XmlComponent } from "file/xml-components";

import { BlipFill } from "./blip/blip-fill";
import { NonVisualPicProperties } from "./non-visual-pic-properties/non-visual-pic-properties";
import { PicAttributes } from "./pic-attributes";
import { ShapeProperties } from "./shape-properties/shape-properties";

export class Pic extends XmlComponent {
    private readonly shapeProperties: ShapeProperties;

    constructor(mediaData: IMediaData, transform: IMediaDataTransformation) {
        super("pic:pic");

        this.root.push(
            new PicAttributes({
                xmlns: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.shapeProperties = new ShapeProperties(transform);

        this.root.push(new NonVisualPicProperties());
        this.root.push(new BlipFill(mediaData));
        this.root.push(new ShapeProperties(transform));
    }

    public setXY(x: number, y: number): void {
        this.shapeProperties.setXY(x, y);
    }
}
