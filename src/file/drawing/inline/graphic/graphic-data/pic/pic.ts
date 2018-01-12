// http://officeopenxml.com/drwPic.php
import { XmlComponent } from "file/xml-components";
import { BlipFill } from "./blip/blip-fill";
import { NonVisualPicProperties } from "./non-visual-pic-properties/non-visual-pic-properties";
import { ShapeProperties } from "./shape-properties/shape-properties";

export class Pic extends XmlComponent {

    constructor(referenceId: number) {
        super("pic:pic");

        this.root.push(new NonVisualPicProperties());
        this.root.push(new BlipFill(referenceId));
        this.root.push(new ShapeProperties());
    }
}
