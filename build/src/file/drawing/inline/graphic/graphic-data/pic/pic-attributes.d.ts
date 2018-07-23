import { XmlAttributeComponent } from "file/xml-components";
export interface IPicAttributes {
    xmlns?: string;
}
export declare class PicAttributes extends XmlAttributeComponent<IPicAttributes> {
    protected xmlKeys: {
        xmlns: string;
    };
}
