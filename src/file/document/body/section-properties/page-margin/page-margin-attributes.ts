import { XmlAttributeComponent } from "file/xml-components";

export interface IPageMarginAttributes {
    readonly top?: number;
    readonly right?: number;
    readonly bottom?: number;
    readonly left?: number;
    readonly header?: number;
    readonly footer?: number;
    readonly gutter?: number;
    readonly mirror?: boolean;
}

export class PageMarginAttributes extends XmlAttributeComponent<IPageMarginAttributes> {
    protected readonly xmlKeys = {
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
