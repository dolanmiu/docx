// http://officeopenxml.com/drwPicFloating-position.php
import { ITextWrapping } from "../text-wrap";

export enum HorizontalPositionRelativeFrom {
    CHARACTER = "character",
    COLUMN = "column",
    INSIDE_MARGIN = "insideMargin",
    LEFT_MARGIN = "leftMargin",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    RIGHT_MARGIN = "rightMargin",
}

export enum VerticalPositionRelativeFrom {
    BOTTOM_MARGIN = "bottomMargin",
    INSIDE_MARGIN = "insideMargin",
    LINE = "line",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    PARAGRAPH = "paragraph",
    TOP_MARGIN = "topMargin",
}

export enum HorizontalPositionAlign {
    CENTER = "center",
    INSIDE = "inside",
    LEFT = "left",
    OUTSIDE = "outside",
    RIGHT = "right",
}

export enum VerticalPositionAlign {
    BOTTOM = "bottom",
    CENTER = "center",
    INSIDE = "inside",
    OUTSIDE = "outside",
    TOP = "top",
}

export interface IHorizontalPositionOptions {
    readonly relative?: HorizontalPositionRelativeFrom;
    readonly align?: HorizontalPositionAlign;
    readonly offset?: number;
}

export interface IVerticalPositionOptions {
    readonly relative?: VerticalPositionRelativeFrom;
    readonly align?: VerticalPositionAlign;
    readonly offset?: number;
}

export interface IMargins {
    readonly left?: number;
    readonly bottom?: number;
    readonly top?: number;
    readonly right?: number;
}

export interface IFloating {
    readonly horizontalPosition: IHorizontalPositionOptions;
    readonly verticalPosition: IVerticalPositionOptions;
    readonly allowOverlap?: boolean;
    readonly lockAnchor?: boolean;
    readonly behindDocument?: boolean;
    readonly layoutInCell?: boolean;
    readonly margins?: IMargins;
    readonly wrap?: ITextWrapping;
}
