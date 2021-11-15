import { XmlAttributeComponent, XmlComponent } from "../../../../../file/xml-components";
export interface IPageMarginAttributes {
    readonly top?: number | string;
    readonly right?: number | string;
    readonly bottom?: number | string;
    readonly left?: number | string;
    readonly header?: number | string;
    readonly footer?: number | string;
    readonly gutter?: number | string;
}
export declare class PageMarginAttributes extends XmlAttributeComponent<IPageMarginAttributes> {
    protected readonly xmlKeys: {
        top: string;
        right: string;
        bottom: string;
        left: string;
        header: string;
        footer: string;
        gutter: string;
    };
}
export declare class PageMargin extends XmlComponent {
    constructor(top: number | string, right: number | string, bottom: number | string, left: number | string, header: number | string, footer: number | string, gutter: number | string);
}
