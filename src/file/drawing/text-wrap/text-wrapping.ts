/**
 * Text wrapping module for DrawingML elements.
 *
 * This module provides text wrapping options for floating/anchored drawings.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { IDistance } from "../drawing";

/**
 * Enumeration of text wrapping types for floating drawings.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @publicApi
 */
export const TextWrappingType = {
    NONE: 0,
    SQUARE: 1,
    TIGHT: 2,
    TOP_AND_BOTTOM: 3,
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
