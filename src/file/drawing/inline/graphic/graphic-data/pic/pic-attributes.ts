import { XmlAttributeComponent } from "file/xml-components";

export interface IPicAttributes {
    xmlns?: string;
}

export class PicAttributes extends XmlAttributeComponent<IPicAttributes> {
    protected xmlKeys = {
        xmlns: "xmlns:pic",
    };
}
