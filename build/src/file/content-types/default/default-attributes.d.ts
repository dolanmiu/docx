import { XmlAttributeComponent } from "file/xml-components";
export interface IDefaultAttributes {
    contentType: string;
    extension?: string;
}
export declare class DefaultAttributes extends XmlAttributeComponent<IDefaultAttributes> {
    protected xmlKeys: {
        contentType: string;
        extension: string;
    };
}
