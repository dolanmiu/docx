import { XmlAttributeComponent } from "file/xml-components";

export interface IHeaderReferenceAttributes {
    type: string;
    id: string;
}

export class HeaderReferenceAttributes extends XmlAttributeComponent<IHeaderReferenceAttributes> {
    protected xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
