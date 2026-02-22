/**
 * Floating position module for DrawingML elements.
 *
 * This module provides positioning options for floating/anchored drawings,
 * including horizontal and vertical relative positioning.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-position.php
 *
 * @module
 */
import type { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";

import type { ITextWrapping } from "../text-wrap";

/**
 * Horizontal Relative Positioning.
 *
 * Specifies the horizontal base from which the drawing position is calculated.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromH.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_RelFromH">
 *   <xsd:restriction base="xsd:token">
 *     <xsd:enumeration value="margin"/>
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="column"/>
 *     <xsd:enumeration value="character"/>
 *     <xsd:enumeration value="leftMargin"/>
 *     <xsd:enumeration value="rightMargin"/>
 *     <xsd:enumeration value="insideMargin"/>
 *     <xsd:enumeration value="outsideMargin"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
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
 * Vertical Relative Positioning.
 *
 * Specifies the vertical base from which the drawing position is calculated.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_RelFromV.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_RelFromV">
 *   <xsd:restriction base="xsd:token">
 *     <xsd:enumeration value="margin"/>
 *     <xsd:enumeration value="page"/>
 *     <xsd:enumeration value="paragraph"/>
 *     <xsd:enumeration value="line"/>
 *     <xsd:enumeration value="topMargin"/>
 *     <xsd:enumeration value="bottomMargin"/>
 *     <xsd:enumeration value="insideMargin"/>
 *     <xsd:enumeration value="outsideMargin"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @publicApi
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

/**
 * Options for horizontal positioning of a floating drawing.
 */
export type IHorizontalPositionOptions = {
    /** The base from which horizontal position is calculated */
    readonly relative?: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    /** Alignment relative to the horizontal base */
    readonly align?: (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign];
    /** Offset in EMUs from the horizontal base */
    readonly offset?: number;
};

/**
 * Options for vertical positioning of a floating drawing.
 */
export type IVerticalPositionOptions = {
    /** The base from which vertical position is calculated */
    readonly relative?: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    /** Alignment relative to the vertical base */
    readonly align?: (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign];
    /** Offset in EMUs from the vertical base */
    readonly offset?: number;
};

/**
 * Margin distances around a floating drawing in EMUs.
 */
export type IMargins = {
    readonly left?: number;
    readonly bottom?: number;
    readonly top?: number;
    readonly right?: number;
};

/**
 * Configuration options for a floating/anchored drawing.
 *
 * @see {@link Anchor}
 */
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
