import { XmlAttributeComponent } from "file/xml-components";
export interface IFootnoteAttributesProperties {
    type?: string;
    id: number;
}
export declare class FootnoteAttributes extends XmlAttributeComponent<IFootnoteAttributesProperties> {
    protected xmlKeys: {
        type: string;
        id: string;
    };
}
