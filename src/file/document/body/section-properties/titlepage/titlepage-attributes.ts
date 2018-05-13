import { XmlAttributeComponent } from "file/xml-components";

export interface IHeaderReferenceAttributes {
    value: string;
}

export class TitlePageAttributes extends XmlAttributeComponent<IHeaderReferenceAttributes> {
    protected xmlKeys = {
        value: "w:val",
    };
}