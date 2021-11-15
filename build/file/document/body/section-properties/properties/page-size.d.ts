import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export declare enum PageOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}
export interface IPageSizeAttributes {
    readonly width?: number | string;
    readonly height?: number | string;
    readonly orientation?: PageOrientation;
}
export declare class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected readonly xmlKeys: {
        width: string;
        height: string;
        orientation: string;
    };
}
export declare class PageSize extends XmlComponent {
    constructor(width: number | string, height: number | string, orientation: PageOrientation);
}
