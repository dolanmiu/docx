import { XmlAttributeComponent } from "file/xml-components";

export interface IPageSizeAttributes {
    width?: number;
    height?: number;
}

export class PageSizeAttributes extends XmlAttributeComponent<IPageSizeAttributes> {
    protected xmlKeys = {
        width: "w:w",
        height: "w:h",
    };
}
