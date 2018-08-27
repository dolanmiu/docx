// http://officeopenxml.com/drwPic.php
import { XmlComponent } from "file/xml-components";
import { BlipFill } from "./blip/blip-fill";
import { NonVisualPicProperties } from "./non-visual-pic-properties/non-visual-pic-properties";
import { PicAttributes } from "./pic-attributes";
import { ShapeProperties } from "./shape-properties/shape-properties";

export class Pic extends XmlComponent {
    private readonly shapeProperties: ShapeProperties;

    constructor(referenceId: number, x: number, y: number) {
        super("pic:pic");

        this.root.push(
            new PicAttributes({
                xmlns: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.shapeProperties = new ShapeProperties(x, y);

        this.root.push(new NonVisualPicProperties());
        this.root.push(new BlipFill(referenceId));
        this.root.push(new ShapeProperties(x, y));
    }

    public setXY(x: number, y: number): void {
        this.shapeProperties.setXY(x, y);
    }
}
