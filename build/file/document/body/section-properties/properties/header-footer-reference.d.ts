import { XmlComponent } from "../../../../../file/xml-components";
export declare enum HeaderFooterReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even"
}
export interface IHeaderFooterOptions {
    readonly type?: HeaderFooterReferenceType;
    readonly id?: number;
}
export declare enum HeaderFooterType {
    HEADER = "w:headerReference",
    FOOTER = "w:footerReference"
}
export declare class HeaderFooterReference extends XmlComponent {
    constructor(type: HeaderFooterType, options: IHeaderFooterOptions);
}
