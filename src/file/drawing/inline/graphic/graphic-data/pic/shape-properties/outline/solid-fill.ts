import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createSolidRgbColor } from "./rgb-color";
import { SchemeColor, createSchemeColor } from "./scheme-color";

export type RgbColorOptions = {
    readonly type: "rgb";
    readonly value: string;
};

export type SchemeColorOptions = {
    readonly type: "scheme";
    readonly value: (typeof SchemeColor)[keyof typeof SchemeColor];
};

export type SolidFillOptions = RgbColorOptions | SchemeColorOptions;

export const createSolidFill = (options: SolidFillOptions): XmlComponent =>
    new BuilderElement({
        name: "a:solidFill",
        children: [options.type === "rgb" ? createSolidRgbColor(options) : createSchemeColor(options)],
    });
