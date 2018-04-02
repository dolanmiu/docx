import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IHeaderReferenceAttributes {
    type: string;
    id: string;
}
export declare class HeaderReferenceAttributes extends XmlAttributeComponent<IHeaderReferenceAttributes> {
    protected xmlKeys: {
        type: string;
        id: string;
    };
}
