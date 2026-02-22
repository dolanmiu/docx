/**
 * Textbox types module.
 *
 * Defines common types used across textbox-related components.
 *
 * @module
 */
import type { Percentage, RelativeMeasure, UniversalMeasure } from "@util/values";

/**
 * Represents a length unit value for VML shape styling.
 *
 * Length units can be specified in multiple formats:
 * - "auto" - Automatically calculated by the application
 * - number - Numeric value (typically in points)
 * - Percentage - Percentage-based measurement
 * - UniversalMeasure - Measurement with explicit units (pt, cm, in, etc.)
 * - RelativeMeasure - Relative measurement units
 */
export type LengthUnit = "auto" | number | Percentage | UniversalMeasure | RelativeMeasure;
