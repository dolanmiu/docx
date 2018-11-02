import { XmlAttributeComponent } from "file/xml-components";

export interface IDefaultAttributes {
    readonly contentType: string;
    readonly extension?: string;
}

export class DefaultAttributes extends XmlAttributeComponent<IDefaultAttributes> {
    protected readonly xmlKeys = {
        contentType: "ContentType",
        extension: "Extension",
    };
}
