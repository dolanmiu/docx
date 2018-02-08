import { XmlAttributeComponent } from "file/xml-components";

export interface IDefaultAttributes {
    contentType: string;
    extension?: string;
}

export class DefaultAttributes extends XmlAttributeComponent<IDefaultAttributes> {
    protected xmlKeys = {
        contentType: "ContentType",
        extension: "Extension",
    };
}
