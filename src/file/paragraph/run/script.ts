import { BuilderElement, XmlComponent } from "@file/xml-components";

type IVerticalAlignAttributes = {
    readonly val: string;
};

const createVerticalAlignRun = (type: string): XmlComponent =>
    new BuilderElement<IVerticalAlignAttributes>({
        name: "w:vertAlign",
        attributes: {
            val: { key: "w:val", value: type },
        },
    });

export const createSuperScript = (): XmlComponent => createVerticalAlignRun("superscript");

export const createSubScript = (): XmlComponent => createVerticalAlignRun("subscript");
