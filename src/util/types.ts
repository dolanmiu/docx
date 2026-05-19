/**
 * Type definitions for OOXML specification values.
 *
 * This module contains TypeScript type definitions that correspond to
 * specific types defined in the OOXML specification, primarily for VML
 * (Vector Markup Language) elements.
 *
 * @module
 */

/**
 * Inset mode for VML text boxes.
 *
 * Specifies whether inset values are automatically calculated or custom-defined.
 * This type is used exclusively in VML (Vector Markup Language) elements.
 *
 * - `auto` - Inset values are automatically calculated
 * - `custom` - Inset values are explicitly specified
 *
 * Reference: ST_InsetMode in OOXML specification
 *
 * @example
 * ```typescript
 * const insetMode: InsetMode = "auto";
 * ```
 */
export type InsetMode = "auto" | "custom";
