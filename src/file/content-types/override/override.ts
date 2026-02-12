import { BuilderElement, XmlComponent } from "@file/xml-components";

type IOverrideAttributes = {
    readonly contentType: string;
    readonly partName?: string;
};

export const createOverride = (contentType: string, partName?: string): XmlComponent =>
    new BuilderElement<IOverrideAttributes>({
        name: "Override",
        attributes: {
            contentType: { key: "ContentType", value: contentType },
            partName: { key: "PartName", value: partName },
        },
    });
