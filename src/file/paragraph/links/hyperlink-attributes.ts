import { XmlAttributeComponent } from "@file/xml-components";

export interface IHyperlinkAttributesProperties {
    readonly id?: string;
    readonly anchor?: string;
    readonly history: number;
}

export class HyperlinkAttributes extends XmlAttributeComponent<IHyperlinkAttributesProperties> {
    protected readonly xmlKeys = {
        id: "r:id",
        history: "w:history",
        anchor: "w:anchor",
    };
}
