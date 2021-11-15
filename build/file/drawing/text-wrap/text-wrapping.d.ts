import { IDistance } from "../drawing";
export declare enum TextWrappingType {
    NONE = 0,
    SQUARE = 1,
    TIGHT = 2,
    TOP_AND_BOTTOM = 3
}
export declare enum TextWrappingSide {
    BOTH_SIDES = "bothSides",
    LEFT = "left",
    RIGHT = "right",
    LARGEST = "largest"
}
export interface ITextWrapping {
    readonly type: TextWrappingType;
    readonly side?: TextWrappingSide;
    readonly margins?: IDistance;
}
