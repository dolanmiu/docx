import { XmlAttributeComponent } from "file/xml-components";

export enum PageOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape",
}

export interface IPageSizeAttributes {
    width?: number;
    height?: number;
    orientation?: PageOrientation;
}

export class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected xmlKeys = {
        width: "w:w",
        height: "w:h",
        orientation: "w:orient",
    };
}
