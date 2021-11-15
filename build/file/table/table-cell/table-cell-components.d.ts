import { IBorderOptions } from "../../../file/border";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "../../../file/xml-components";
export interface ITableCellBorders {
    readonly top?: IBorderOptions;
    readonly start?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly end?: IBorderOptions;
    readonly right?: IBorderOptions;
}
export declare class TableCellBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellBorders);
}
export declare class GridSpan extends XmlComponent {
    constructor(value: number);
}
export declare enum VerticalMergeType {
    CONTINUE = "continue",
    RESTART = "restart"
}
export declare class VerticalMerge extends XmlComponent {
    constructor(value: VerticalMergeType);
}
export declare enum TextDirection {
    BOTTOM_TO_TOP_LEFT_TO_RIGHT = "btLr",
    LEFT_TO_RIGHT_TOP_TO_BOTTOM = "lrTb",
    TOP_TO_BOTTOM_RIGHT_TO_LEFT = "tbRl"
}
export declare class TDirection extends XmlComponent {
    constructor(value: TextDirection);
}
