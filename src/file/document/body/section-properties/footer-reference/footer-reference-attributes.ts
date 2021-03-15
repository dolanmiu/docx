import { XmlAttributeComponent } from "file/xml-components";

export enum FooterReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

export class FooterReferenceAttributes extends XmlAttributeComponent<{
    readonly type: string;
    readonly id: string;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}
