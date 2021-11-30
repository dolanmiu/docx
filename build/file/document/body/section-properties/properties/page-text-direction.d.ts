import { XmlComponent } from "../../../../../file/xml-components";
export declare enum PageTextDirectionType {
    LEFT_TO_RIGHT_TOP_TO_BOTTOM = "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT = "tbRl"
}
export declare class PageTextDirection extends XmlComponent {
    constructor(value: PageTextDirectionType);
}
