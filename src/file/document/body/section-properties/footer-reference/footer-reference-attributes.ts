import { XmlAttributeComponent } from "file/xml-components";

export enum FooterReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

export interface IFooterReferenceAttributes {
    readonly type: string;
    readonly id: string;
}

export class FooterReferenceAttributes extends XmlAttributeComponent<IFooterReferenceAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
