import { XmlAttributeComponent } from "file/xml-components";

export interface IPageSizeAttributes {
    width?: number;
    height?: number;
    orientation?: string;
}

export class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected xmlKeys = {
        width: "w:w",
        height: "w:h",
        orientation: "w:orient",
    };
}
