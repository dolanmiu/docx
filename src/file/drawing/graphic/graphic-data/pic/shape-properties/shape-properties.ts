// http://officeopenxml.com/drwSp-SpPr.php
import { XmlComponent } from "file/xml-components";
import { Form } from "./form";
// import { NoFill } from "./no-fill";
// import { Outline } from "./outline/outline";
import { PresetGeometry } from "./preset-geometry/preset-geometry";
import { ShapePropertiesAttributes } from "./shape-properties-attributes";

export class ShapeProperties extends XmlComponent {
    constructor(x: number, y: number) {
        super("pic:spPr");

        this.root.push(
            new ShapePropertiesAttributes({
                bwMode: "auto",
            }),
        );

        this.root.push(new Form(x, y));
        this.root.push(new PresetGeometry());
        // this.root.push(new NoFill());
        // this.root.push(new Outline());
    }
}
