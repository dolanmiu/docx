import { XmlAttributeComponent } from "file/xml-components";

export interface IFootnoteAttributesProperties {
    type?: string;
    id: number;
}

export class FootnoteAttributes extends XmlAttributeComponent<IFootnoteAttributesProperties> {
    protected xmlKeys = {
        type: "w:type",
        id: "w:id",
    };
}
