import { XmlAttributeComponent } from "file/xml-components";

export interface IHeaderReferenceAttributes {
    readonly value: string;
}

export class TitlePageAttributes extends XmlAttributeComponent<IHeaderReferenceAttributes> {
    protected readonly xmlKeys = {
        value: "w:val",
    };
}
