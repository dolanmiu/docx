/**
 * Text wrapping module for DrawingML elements.
 *
 * This module provides text wrapping options for floating/anchored drawings.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import type { IDistance } from "../drawing";

/**
 * Enumeration of text wrapping types for floating drawings.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @publicApi
 */
export const TextWrappingType = {
    /** Text doesn't wrap around the drawing. It is drawn in front of or behind the text */
    NONE: 0,
    /** Text wraps around the drawing's box */
    SQUARE: 1,
    /** Text wraps closely around the drawing's outline */
    TIGHT: 2,
    /** Text sits above and below the drawing, not beside it */
    TOP_AND_BOTTOM: 3,
    /** Text wraps closely around the drawing's outline, and fills any open space inside it */
    THROUGH: 4,
} as const;

/**
 * Enumeration of text wrapping sides for floating drawings.
 *
 * Specifies on which side(s) text can wrap around the drawing.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @publicApi
 */
export const TextWrappingSide = {
    /** Text wraps on both sides of the drawing */
    BOTH_SIDES: "bothSides",
    /** Text wraps only on the left side */
    LEFT: "left",
    /** Text wraps only on the right side */
    RIGHT: "right",
    /** Text wraps on the side with more space */
    LARGEST: "largest",
} as const;

/**
 * Options for configuring text wrapping around a drawing.
 */
export type ITextWrapping = {
    readonly type: (typeof TextWrappingType)[keyof typeof TextWrappingType];
    readonly side?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
    readonly margins?: IDistance;
};
