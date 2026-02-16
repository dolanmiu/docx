/**
 * Space type module for WordprocessingML documents.
 *
 * This module provides the xml:space attribute values for
 * controlling whitespace handling in text elements.
 *
 * @module
 */

/**
 * XML space handling modes.
 *
 * Controls how whitespace is handled in text elements.
 *
 * @example
 * ```typescript
 * // Preserve whitespace (spaces, newlines)
 * SpaceType.PRESERVE;
 *
 * // Default whitespace handling
 * SpaceType.DEFAULT;
 * ```
 */
export const SpaceType = {
    DEFAULT: "default",
    PRESERVE: "preserve",
} as const;
