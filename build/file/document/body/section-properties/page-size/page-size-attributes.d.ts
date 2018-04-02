import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IPageSizeAttributes {
    width?: number;
    height?: number;
    orientation?: string;
}
export declare class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected xmlKeys: {
        width: string;
        height: string;
        orientation: string;
    };
}
