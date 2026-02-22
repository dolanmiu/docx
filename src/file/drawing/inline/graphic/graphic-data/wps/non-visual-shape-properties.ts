import { BuilderElement, type XmlComponent } from "@file/xml-components";

export type INonVisualShapePropertiesOptions = {
    readonly txBox: string;
};

export const createNonVisualShapeProperties = (options: INonVisualShapePropertiesOptions = { txBox: "1" }): XmlComponent =>
    new BuilderElement<{ readonly txBox: string }>({
        name: "wps:cNvSpPr",
        attributes: {
            txBox: { key: "txBox", value: options.txBox },
        },
    });
