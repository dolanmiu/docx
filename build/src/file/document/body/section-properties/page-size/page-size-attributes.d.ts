import { XmlAttributeComponent } from "file/xml-components";
export declare enum PageOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}
export interface IPageSizeAttributes {
    width?: number;
    height?: number;
    orientation?: PageOrientation;
}
export declare class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected xmlKeys: {
        width: string;
        height: string;
        orientation: string;
    };
}
