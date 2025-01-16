// http://officeopenxml.com/drwPicFloating-position.php
// http://officeopenxml.com/drwPicFloating.php
import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";

import { ITextWrapping } from "../text-wrap";

/**
 * Horizontal Relative Positioning
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromH.html
 */
export const HorizontalPositionRelativeFrom = {
    /**
     * ## Character
     *
     * Specifies that the horizontal positioning shall be relative to the position of the anchor within its run content.
     */
    CHARACTER: "character",
    /**
     * ## Column
     *
     * Specifies that the horizontal positioning shall be relative to the extents of the column which contains its anchor.
     */
    COLUMN: "column",
    /**
     * ## Inside Margin
     *
     * Specifies that the horizontal positioning shall be relative to the inside margin of the current page (the left margin on odd pages, right on even pages).
     */
    INSIDE_MARGIN: "insideMargin",
    /**
     * ## Left Margin
     *
     * Specifies that the horizontal positioning shall be relative to the left margin of the page.
     */
    LEFT_MARGIN: "leftMargin",
    /**
     * ## Page Margin
     *
     * Specifies that the horizontal positioning shall be relative to the page margins.
     */
    MARGIN: "margin",
    /**
     * ## Outside Margin
     *
     * Specifies that the horizontal positioning shall be relative to the outside margin of the current page (the right margin on odd pages, left on even pages).
     */
    OUTSIDE_MARGIN: "outsideMargin",
    /**
     * ## Page Edge
     *
     * Specifies that the horizontal positioning shall be relative to the edge of the page.
     */
    PAGE: "page",
    /**
     * ## Right Margin
     *
     * Specifies that the horizontal positioning shall be relative to the right margin of the page.
     */
    RIGHT_MARGIN: "rightMargin",
} as const;

/**
 * Vertical Relative Positioning
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromV.html
 */
export const VerticalPositionRelativeFrom = {
    /**
     * ## Bottom Margin
     *
     * Specifies that the vertical positioning shall be relative to the bottom margin of the current page.
     */
    BOTTOM_MARGIN: "bottomMargin",
    /**
     * ## Inside Margin
     *
     * Specifies that the vertical positioning shall be relative to the inside margin of the current page.
     */
    INSIDE_MARGIN: "insideMargin",
    /**
     * ## Line
     *
     * Specifies that the vertical positioning shall be relative to the line containing the anchor character.
     */
    LINE: "line",
    /**
     * ## Page Margin
     *
     * Specifies that the vertical positioning shall be relative to the page margins.
     */
    MARGIN: "margin",
    /**
     * ## Outside Margin
     *
     * Specifies that the vertical positioning shall be relative to the outside margin of the current page.
     */
    OUTSIDE_MARGIN: "outsideMargin",
    /**
     * ## Page Edge
     *
     * Specifies that the vertical positioning shall be relative to the edge of the page.
     */
    PAGE: "page",
    /**
     * ## Paragraph
     *
     * Specifies that the vertical positioning shall be relative to the paragraph which contains the drawing anchor.
     */
    PARAGRAPH: "paragraph",
    /**
     * ## Top Margin
     *
     * Specifies that the vertical positioning shall be relative to the top margin of the current page.
     */
    TOP_MARGIN: "topMargin",
} as const;

export type IHorizontalPositionOptions = {
    readonly relative?: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    readonly align?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    readonly offset?: number;
};

export type IVerticalPositionOptions = {
    readonly relative?: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    readonly align?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    readonly offset?: number;
};

export type IMargins = {
    readonly left?: number;
    readonly bottom?: number;
    readonly top?: number;
    readonly right?: number;
};

export type IFloating = {
    readonly horizontalPosition: IHorizontalPositionOptions;
    readonly verticalPosition: IVerticalPositionOptions;
    readonly allowOverlap?: boolean;
    readonly lockAnchor?: boolean;
    readonly behindDocument?: boolean;
    readonly layoutInCell?: boolean;
    readonly margins?: IMargins;
    readonly wrap?: ITextWrapping;
    readonly zIndex?: number;
};
