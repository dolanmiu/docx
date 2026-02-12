import { BuilderElement, XmlComponent } from "@file/xml-components";

type IDefaultAttributes = {
    readonly contentType: string;
    readonly extension?: string;
};

export const createDefault = (contentType: string, extension?: string): XmlComponent =>
    new BuilderElement<IDefaultAttributes>({
        name: "Default",
        attributes: {
            contentType: { key: "ContentType", value: contentType },
            extension: { key: "Extension", value: extension },
        },
    });
