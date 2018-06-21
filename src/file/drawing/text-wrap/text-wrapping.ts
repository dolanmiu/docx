// http://officeopenxml.com/drwPicFloating-textWrap.php
import { IDistance } from "../drawing";

export enum TextWrapStyle {
    NONE,
    SQUARE,
    TIGHT,
    TOP_AND_BOTTOM,
}

export enum WrapTextOption {
    BOTH_SIDES = "bothSides",
    LEFT = "left",
    RIGHT = "right",
    LARGEST = "largest",
}

export interface ITextWrapping {
    textWrapStyle: TextWrapStyle;
    wrapTextOption?: WrapTextOption;
    distanceFromText?: IDistance;
}
