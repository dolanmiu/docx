import { XmlAttributeComponent } from "file/xml-components";

export interface IHyperlinkAttributesProperties {
    id?: string;
    anchor?: string;
    history: number;
}

export class HyperlinkAttributes extends XmlAttributeComponent<IHyperlinkAttributesProperties> {
    protected xmlKeys = {
        id: "r:id",
        history: "w:history",
        anchor: "w:anchor",
    };
}
