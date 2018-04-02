import { XmlAttributeComponent } from "../../../../../file/xml-components";
export interface IPageMarginAttributes {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    header?: number;
    footer?: number;
    gutter?: number;
}
export declare class PageMarginAttributes extends XmlAttributeComponent<IPageMarginAttributes> {
    protected xmlKeys: {
        top: string;
        right: string;
        bottom: string;
        left: string;
        header: string;
        footer: string;
        gutter: string;
    };
}
