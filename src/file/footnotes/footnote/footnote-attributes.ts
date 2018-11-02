import { XmlAttributeComponent } from "file/xml-components";

export interface IFootnoteAttributesProperties {
    readonly type?: string;
    readonly id: number;
}

export class FootnoteAttributes extends XmlAttributeComponent<IFootnoteAttributesProperties> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "w:id",
    };
}
