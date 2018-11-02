import { XmlAttributeComponent } from "file/xml-components";

export interface IPicAttributes {
    readonly xmlns?: string;
}

export class PicAttributes extends XmlAttributeComponent<IPicAttributes> {
    protected readonly xmlKeys = {
        xmlns: "xmlns:pic",
    };
}
