import { BuilderElement, XmlComponent } from "@file/xml-components";

export type EffectExtentAttributes = {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
};

export const createEffectExtent = ({ top, right, bottom, left }: EffectExtentAttributes): XmlComponent =>
    new BuilderElement<EffectExtentAttributes>({
        name: "wp:effectExtent",
        attributes: {
            top: {
                key: "t",
                value: top,
            },
            right: {
                key: "r",
                value: right,
            },
            bottom: {
                key: "b",
                value: bottom,
            },
            left: {
                key: "l",
                value: left,
            },
        },
    });
