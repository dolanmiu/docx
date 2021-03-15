import { XmlAttributeComponent } from "file/xml-components";

export enum HeaderReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

export class HeaderReferenceAttributes extends XmlAttributeComponent<{
    readonly type: string;
    readonly id: string;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
