import { XmlAttributeComponent } from "file/xml-components";
export interface IExtentAttributes {
    cx?: number;
    cy?: number;
}
export declare class ExtentAttributes extends XmlAttributeComponent<IExtentAttributes> {
    protected xmlKeys: {
        cx: string;
        cy: string;
    };
}
