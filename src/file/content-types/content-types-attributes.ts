import { XmlAttributeComponent } from "file/xml-components";

export interface IContentTypeAttributes {
    readonly xmlns?: string;
}

export class ContentTypeAttributes extends XmlAttributeComponent<IContentTypeAttributes> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}
