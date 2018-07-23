import { XmlAttributeComponent } from "file/xml-components";
export interface IContentTypeAttributes {
    xmlns?: string;
}
export declare class ContentTypeAttributes extends XmlAttributeComponent<IContentTypeAttributes> {
    protected xmlKeys: {
        xmlns: string;
    };
}
