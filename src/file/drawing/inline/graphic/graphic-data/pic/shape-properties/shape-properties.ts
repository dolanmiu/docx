// http://officeopenxml.com/drwSp-SpPr.php
import { XmlComponent } from "file/xml-components";
import { Form } from "./form";
// import { NoFill } from "./no-fill";
// import { Outline } from "./outline/outline";
import { PresetGeometry } from "./preset-geometry/preset-geometry";
import { ShapePropertiesAttributes } from "./shape-properties-attributes";

export class ShapeProperties extends XmlComponent {
    private readonly form: Form;

    constructor(x: number, y: number) {
        super("pic:spPr");

        this.root.push(
            new ShapePropertiesAttributes({
                bwMode: "auto",
            }),
        );

        this.form = new Form(x, y);

        this.root.push(this.form);
        this.root.push(new PresetGeometry());
        // this.root.push(new NoFill());
        // this.root.push(new Outline());
    }

    public setXY(x: number, y: number): void {
        this.form.setXY(x, y);
    }
}
