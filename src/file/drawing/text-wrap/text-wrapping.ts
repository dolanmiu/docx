// http://officeopenxml.com/drwPicFloating-textWrap.php
import { IDistance } from "../drawing";

export enum TextWrappingType {
    NONE,
    SQUARE,
    TIGHT,
    TOP_AND_BOTTOM,
}

export enum TextWrappingSide {
    BOTH_SIDES = "bothSides",
    LEFT = "left",
    RIGHT = "right",
    LARGEST = "largest",
}

export interface ITextWrapping {
    readonly type: TextWrappingType;
    readonly side?: TextWrappingSide;
    readonly margins?: IDistance;
}
