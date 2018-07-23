import { IDistance } from "../drawing";
export declare enum TextWrapStyle {
    NONE = 0,
    SQUARE = 1,
    TIGHT = 2,
    TOP_AND_BOTTOM = 3
}
export declare enum WrapTextOption {
    BOTH_SIDES = "bothSides",
    LEFT = "left",
    RIGHT = "right",
    LARGEST = "largest"
}
export interface ITextWrapping {
    textWrapStyle: TextWrapStyle;
    wrapTextOption?: WrapTextOption;
    distanceFromText?: IDistance;
}
