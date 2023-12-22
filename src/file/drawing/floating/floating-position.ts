// http://officeopenxml.com/drwPicFloating-position.php
// http://officeopenxml.com/drwPicFloating.php
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";

import { ITextWrapping } from "../text-wrap";

/* eslint-disable @typescript-eslint/naming-convention */
export const HorizontalPositionRelativeFrom = {
    CHARACTER: "character",
    COLUMN: "column",
    INSIDE_MARGIN: "insideMargin",
    LEFT_MARGIN: "leftMargin",
    MARGIN: "margin",
    OUTSIDE_MARGIN: "outsideMargin",
    PAGE: "page",
    RIGHT_MARGIN: "rightMargin",
} as const;

export const VerticalPositionRelativeFrom = {
    BOTTOM_MARGIN: "bottomMargin",
    INSIDE_MARGIN: "insideMargin",
    LINE: "line",
    MARGIN: "margin",
    OUTSIDE_MARGIN: "outsideMargin",
    PAGE: "page",
    PARAGRAPH: "paragraph",
    TOP_MARGIN: "topMargin",
} as const;

/* eslint-enable */
export interface IHorizontalPositionOptions {
    readonly relative?: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    readonly align?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    readonly offset?: number;
}

export interface IVerticalPositionOptions {
    readonly relative?: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    readonly align?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
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
    readonly zIndex?: number;
}
