import { XmlAttributeComponent } from "file/xml-components";

export enum PageOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape",
}

export interface IPageSizeAttributes {
    readonly width?: number;
    readonly height?: number;
    readonly orientation?: PageOrientation;
}

export class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected readonly xmlKeys = {
        width: "w:w",
        height: "w:h",
        orientation: "w:orient",
    };
}
