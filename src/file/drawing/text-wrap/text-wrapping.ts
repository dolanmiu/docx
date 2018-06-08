// http://officeopenxml.com/drwPicFloating-textWrap.php
import { Distance } from "../drawing";

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

export interface TextWrapping {
    textWrapStyle: TextWrapStyle;
    wrapTextOption?: WrapTextOption;
    distanceFromText?: Distance;
}
