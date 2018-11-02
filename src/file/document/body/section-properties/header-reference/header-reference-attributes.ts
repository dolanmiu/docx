import { XmlAttributeComponent } from "file/xml-components";

export enum HeaderReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

export interface IHeaderReferenceAttributes {
    readonly type: string;
    readonly id: string;
}

export class HeaderReferenceAttributes extends XmlAttributeComponent<IHeaderReferenceAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
