import { XmlAttributeComponent } from "file/xml-components";
export interface IHyperlinkAttributesProperties {
    id?: string;
    history: number;
}
export declare class HyperlinkAttributes extends XmlAttributeComponent<IHyperlinkAttributesProperties> {
    protected xmlKeys: {
        id: string;
        history: string;
    };
}
