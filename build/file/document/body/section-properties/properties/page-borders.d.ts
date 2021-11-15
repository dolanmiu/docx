import { IBorderOptions } from "../../../../../file/border";
import { IgnoreIfEmptyXmlComponent } from "../../../../../file/xml-components";
export declare enum PageBorderDisplay {
    ALL_PAGES = "allPages",
    FIRST_PAGE = "firstPage",
    NOT_FIRST_PAGE = "notFirstPage"
}
export declare enum PageBorderOffsetFrom {
    PAGE = "page",
    TEXT = "text"
}
export declare enum PageBorderZOrder {
    BACK = "back",
    FRONT = "front"
}
export interface IPageBorderAttributes {
    readonly display?: PageBorderDisplay;
    readonly offsetFrom?: PageBorderOffsetFrom;
    readonly zOrder?: PageBorderZOrder;
}
export interface IPageBordersOptions {
    readonly pageBorders?: IPageBorderAttributes;
    readonly pageBorderTop?: IBorderOptions;
    readonly pageBorderRight?: IBorderOptions;
    readonly pageBorderBottom?: IBorderOptions;
    readonly pageBorderLeft?: IBorderOptions;
}
export declare class PageBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IPageBordersOptions);
}
