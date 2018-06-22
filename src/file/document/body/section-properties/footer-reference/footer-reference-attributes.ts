import { XmlAttributeComponent } from "file/xml-components";

export enum FooterReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

export interface IFooterReferenceAttributes {
    type: string;
    id: string;
}

export class FooterReferenceAttributes extends XmlAttributeComponent<IFooterReferenceAttributes> {
    protected xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
