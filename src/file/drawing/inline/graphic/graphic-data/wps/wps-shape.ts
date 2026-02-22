import { IMediaDataTransformation } from "@file/media";
import { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

import { BodyProperties, IBodyPropertiesOptions } from "./body-properties";
import { INonVisualShapePropertiesOptions, NonVisualShapeProperties } from "./non-visual-shape-properties";
import { WpsTextBox } from "./wps-text-box";
import { OutlineOptions } from "../pic/shape-properties/outline/outline";
import { SolidFillOptions } from "../pic/shape-properties/outline/solid-fill";
import { ShapeProperties } from "../pic/shape-properties/shape-properties";

export type WpsShapeCoreOptions = {
    readonly children: readonly Paragraph[];
    readonly nonVisualProperties?: INonVisualShapePropertiesOptions;
    readonly bodyProperties?: IBodyPropertiesOptions;
};

export type WpsShapeOptions = WpsShapeCoreOptions & {
    readonly transformation: IMediaDataTransformation;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

export class WpsShape extends XmlComponent {
    public constructor(options: WpsShapeOptions) {
        super("wps:wsp");

        this.root.push(new NonVisualShapeProperties(options.nonVisualProperties));
        this.root.push(
            new ShapeProperties({
                element: "wps",
                transform: options.transformation,
                outline: options.outline,
                solidFill: options.solidFill,
            }),
        );
        this.root.push(new WpsTextBox(options.children));
        this.root.push(new BodyProperties(options.bodyProperties));
    }
}
