// http://officeopenxml.com/drwSp-SpPr.php
import { IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { Form } from "./form";
import { createNoFill } from "./outline/no-fill";
import { OutlineOptions, createOutline } from "./outline/outline";
import { SolidFillOptions, createSolidFill } from "./outline/solid-fill";
import { PresetGeometry } from "./preset-geometry/preset-geometry";
import { ShapePropertiesAttributes } from "./shape-properties-attributes";

export class ShapeProperties extends XmlComponent {
    private readonly form: Form;

    public constructor({
        element,
        outline,
        solidFill,
        transform,
    }: {
        readonly element: string;
        readonly outline?: OutlineOptions;
        readonly solidFill?: SolidFillOptions;
        readonly transform: IMediaDataTransformation;
    }) {
        super(`${element}:spPr`);

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

        if (solidFill) {
            this.root.push(createSolidFill(solidFill));
        }
    }
}
