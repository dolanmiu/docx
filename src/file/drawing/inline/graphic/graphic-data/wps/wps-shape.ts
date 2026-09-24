import type { IMediaDataTransformation } from "@file/media";
import type { Paragraph } from "@file/paragraph";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { type IBodyPropertiesOptions, createBodyProperties } from "./body-properties";
import { type INonVisualShapePropertiesOptions, createNonVisualShapeProperties } from "./non-visual-shape-properties";
import { type PresetShapeCoreOptions, createPresetShape } from "./preset-shape/preset-shape";
import { createWpsTextBox } from "./wps-text-box";
import type { OutlineOptions } from "../pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "../pic/shape-properties/outline/solid-fill";
import { ShapeProperties } from "../pic/shape-properties/shape-properties";

export type WpsShapeCoreOptions = {
    readonly children: readonly Paragraph[];
    readonly nonVisualProperties?: INonVisualShapePropertiesOptions;
    readonly bodyProperties?: IBodyPropertiesOptions;
};

export type WpsShapeOptions = (WpsShapeCoreOptions | PresetShapeCoreOptions) & {
    readonly transformation: IMediaDataTransformation;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

export const createWpsShape = (options: WpsShapeOptions): XmlComponent =>
    // Preset shapes (ShapeRun) carry a geometry; text boxes (WpsShapeRun) do not
    "geometry" in options ? createPresetShape(options) : createTextBoxShape(options);

const createTextBoxShape = (options: WpsShapeCoreOptions & WpsShapeOptions): XmlComponent =>
    new BuilderElement({
        name: "wps:wsp",
        children: [
            createNonVisualShapeProperties(options.nonVisualProperties),
            new ShapeProperties({
                element: "wps",
                transform: options.transformation,
                outline: options.outline,
                solidFill: options.solidFill,
            }),
            createWpsTextBox(options.children),
            createBodyProperties(options.bodyProperties),
        ],
    });
