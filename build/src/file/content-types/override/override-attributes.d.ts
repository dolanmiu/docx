import { XmlAttributeComponent } from "file/xml-components";
export interface IOverrideAttributes {
    contentType: string;
    partName?: string;
}
export declare class OverrideAttributes extends XmlAttributeComponent<IOverrideAttributes> {
    protected xmlKeys: {
        contentType: string;
        partName: string;
    };
}
