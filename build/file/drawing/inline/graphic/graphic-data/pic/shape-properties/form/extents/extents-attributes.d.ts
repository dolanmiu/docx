import { XmlAttributeComponent } from "../../../../../../../../../file/xml-components";
export interface IExtentsAttributes {
    cx?: number;
    cy?: number;
}
export declare class ExtentsAttributes extends XmlAttributeComponent<IExtentsAttributes> {
    protected xmlKeys: {
        cx: string;
        cy: string;
    };
}
