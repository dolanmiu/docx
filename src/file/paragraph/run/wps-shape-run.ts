import { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import { WpsShapeCoreOptions } from "@file/drawing/inline/graphic/graphic-data/wps";

import { Drawing, IFloating } from "../../drawing";
import { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import { SolidFillOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import { IMediaDataTransformation, IMediaTransformation, WpsMediaData } from "../../media";
import { Run } from "../run";

type CoreShapeOptions = {
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

export type IWpsShapeOptions = WpsShapeCoreOptions & { readonly type: "wps" } & CoreShapeOptions;

const createTransformation = (options: IMediaTransformation): IMediaDataTransformation => ({
    pixels: {
        x: Math.round(options.width),
        y: Math.round(options.height),
    },
    emus: {
        x: Math.round(options.width * 9525),
        y: Math.round(options.height * 9525),
    },
    flip: options.flip,
    rotation: options.rotation ? options.rotation * 60000 : undefined,
});

export class WpsShapeRun extends Run {
    private readonly wpsShapeData: WpsMediaData;

    public constructor(options: IWpsShapeOptions) {
        super({});

        this.wpsShapeData = {
            type: options.type,
            transformation: createTransformation(options.transformation),
            data: { ...options },
        };
        const drawing = new Drawing(this.wpsShapeData, {
            floating: options.floating,
            docProperties: options.altText,
            outline: options.outline,
            solidFill: options.solidFill,
        });

        this.root.push(drawing);
    }
}
