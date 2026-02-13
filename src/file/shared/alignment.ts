/**
 * Alignment constants for DrawingML positioning.
 *
 * This module provides horizontal and vertical alignment options
 * for floating drawings.
 *
 * @module
 */

/**
 * Horizontal alignment options for floating drawings.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_AlignH.html
 */
export const HorizontalPositionAlign = {
    /** Center horizontally */
    CENTER: "center",
    /** Align to inside margin (left on odd, right on even pages) */
    INSIDE: "inside",
    /** Align to left */
    LEFT: "left",
    /** Align to outside margin (right on odd, left on even pages) */
    OUTSIDE: "outside",
    /** Align to right */
    RIGHT: "right",
} as const;

/**
 * Vertical alignment options for floating drawings.
 *
 * Reference: https://www.datypic.com/sc/ooxml/t-wp_ST_AlignV.html
 */
export const VerticalPositionAlign = {
    /** Align to bottom */
    BOTTOM: "bottom",
    /** Center vertically */
    CENTER: "center",
    /** Align to inside margin */
    INSIDE: "inside",
    /** Align to outside margin */
    OUTSIDE: "outside",
    /** Align to top */
    TOP: "top",
} as const;
