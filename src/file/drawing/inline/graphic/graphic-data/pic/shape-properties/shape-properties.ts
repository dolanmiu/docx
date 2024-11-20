// http://officeopenxml.com/drwSp-SpPr.php
import { IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { Form } from "./form";
import { createNoFill } from "./outline/no-fill";
import { OutlineOptions, createOutline } from "./outline/outline";
import { PresetGeometry } from "./preset-geometry/preset-geometry";
import { ShapePropertiesAttributes } from "./shape-properties-attributes";

export class ShapeProperties extends XmlComponent {
    private readonly form: Form;

    public constructor({ outline, transform }: { readonly outline?: OutlineOptions; readonly transform: IMediaDataTransformation }) {
        super("pic:spPr");

        this.root.push(
            new ShapePropertiesAttributes({
                bwMode: "auto",
            }),
        );

        this.form = new Form(transform);

        this.root.push(this.form);
        this.root.push(new PresetGeometry());

        if (outline) {
            this.root.push(createNoFill());
            this.root.push(createOutline(outline));
        }
    }
}
