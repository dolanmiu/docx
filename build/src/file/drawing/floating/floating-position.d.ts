export declare enum HorizontalPositionRelativeFrom {
    CHARACTER = "character",
    COLUMN = "column",
    INSIDE_MARGIN = "insideMargin",
    LEFT_MARGIN = "leftMargin",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    RIGHT_MARGIN = "rightMargin"
}
export declare enum VerticalPositionRelativeFrom {
    BOTTOM_MARGIN = "bottomMargin",
    INSIDE_MARGIN = "insideMargin",
    LINE = "line",
    MARGIN = "margin",
    OUTSIDE_MARGIN = "outsideMargin",
    PAGE = "page",
    PARAGRAPH = "paragraph",
    TOP_MARGIN = "topMargin"
}
export declare enum HorizontalPositionAlign {
    CENTER = "center",
    INSIDE = "inside",
    LEFT = "left",
    OUTSIDE = "outside",
    RIGHT = "right"
}
export declare enum VerticalPositionAlign {
    BOTTOM = "bottom",
    CENTER = "center",
    INSIDE = "inside",
    OUTSIDE = "outside",
    TOP = "top"
}
export interface IHorizontalPositionOptions {
    relative: HorizontalPositionRelativeFrom;
    align?: HorizontalPositionAlign;
    offset?: number;
}
export interface IVerticalPositionOptions {
    relative: VerticalPositionRelativeFrom;
    align?: VerticalPositionAlign;
    offset?: number;
}
export interface IFloating {
    horizontalPosition: IHorizontalPositionOptions;
    verticalPosition: IVerticalPositionOptions;
    allowOverlap?: boolean;
    lockAnchor?: boolean;
    behindDocument?: boolean;
    layoutInCell?: boolean;
}
