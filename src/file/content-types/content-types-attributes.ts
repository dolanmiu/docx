import { XmlAttributeComponent } from "file/xml-components";

export interface IContentTypeAttributes {
    xmlns?: string;
}

export class ContentTypeAttributes extends XmlAttributeComponent<IContentTypeAttributes> {
    protected xmlKeys = {
        xmlns: "xmlns",
    };
}
