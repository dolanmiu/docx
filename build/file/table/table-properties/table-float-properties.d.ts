import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
import { OverlapType } from "./table-overlap";
export declare enum TableAnchorType {
    MARGIN = "margin",
    PAGE = "page",
    TEXT = "text"
}
export declare enum RelativeHorizontalPosition {
    CENTER = "center",
    INSIDE = "inside",
    LEFT = "left",
    OUTSIDE = "outside",
    RIGHT = "right"
}
export declare enum RelativeVerticalPosition {
    CENTER = "center",
    INSIDE = "inside",
    BOTTOM = "bottom",
    OUTSIDE = "outside",
    INLINE = "inline",
    TOP = "top"
}
export interface ITableFloatOptions {
    readonly horizontalAnchor?: TableAnchorType;
    readonly absoluteHorizontalPosition?: number | string;
    readonly relativeHorizontalPosition?: RelativeHorizontalPosition;
    readonly verticalAnchor?: TableAnchorType;
    readonly absoluteVerticalPosition?: number | string;
    readonly relativeVerticalPosition?: RelativeVerticalPosition;
    readonly bottomFromText?: number | string;
    readonly topFromText?: number | string;
    readonly leftFromText?: number | string;
    readonly rightFromText?: number | string;
    readonly overlap?: OverlapType;
}
export declare class TableFloatOptionsAttributes extends XmlAttributeComponent<ITableFloatOptions> {
    protected readonly xmlKeys: {
        horizontalAnchor: string;
        verticalAnchor: string;
        absoluteHorizontalPosition: string;
        relativeHorizontalPosition: string;
        absoluteVerticalPosition: string;
        relativeVerticalPosition: string;
        bottomFromText: string;
        topFromText: string;
        leftFromText: string;
        rightFromText: string;
    };
}
export declare class TableFloatProperties extends XmlComponent {
    constructor({ leftFromText, rightFromText, topFromText, bottomFromText, absoluteHorizontalPosition, absoluteVerticalPosition, ...options }: ITableFloatOptions);
}
