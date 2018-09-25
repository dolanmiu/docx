import { XmlAttributeComponent } from "file/xml-components";

export interface IPageMarginAttributes {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    header?: number;
    footer?: number;
    gutter?: number;
    mirror?: boolean;
}

export class PageMarginAttributes extends XmlAttributeComponent<IPageMarginAttributes> {
    protected xmlKeys = {
        top: "w:top",
        right: "w:right",
        bottom: "w:bottom",
        left: "w:left",
        header: "w:header",
        footer: "w:footer",
        gutter: "w:gutter",
        mirror: "w:mirrorMargins",
    };
}
