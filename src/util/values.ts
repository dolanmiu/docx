/**
 * Runtime validation and type conversion functions for OOXML specification values.
 *
 * This module provides runtime checks and cleanup for value types in the OOXML spec
 * that aren't easily expressed through the TypeScript type system alone. These
 * validators help prevent silent failures and corrupted documents by enforcing
 * spec-compliant values at runtime.
 *
 * @module
 */

/**
 * A measurement value with optional sign and unit suffix.
 *
 * Supports units: mm (millimeters), cm (centimeters), in (inches),
 * pt (points), pc (picas), pi (picas).
 *
 * Pattern: `-?[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)`
 *
 * @example
 * ```typescript
 * const measure: UniversalMeasure = "10.5mm";
 * const negative: UniversalMeasure = "-5pt";
 * ```
 */
export type UniversalMeasure = `${"-" | ""}${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;

/**
 * A positive measurement value with unit suffix.
 *
 * Same as UniversalMeasure but restricted to positive values only.
 *
 * Reference: ST_PositiveUniversalMeasure in OOXML specification
 *
 * @example
 * ```typescript
 * const measure: PositiveUniversalMeasure = "10.5mm";
 * ```
 */
export type PositiveUniversalMeasure = `${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;

/**
 * A percentage value with optional sign.
 *
 * Pattern: `-?[0-9]+(\.[0-9]+)?%`
 *
 * Reference: ST_Percentage in OOXML specification
 *
 * @example
 * ```typescript
 * const percent: Percentage = "50%";
 * const negative: Percentage = "-10.5%";
 * ```
 */
export type Percentage = `${"-" | ""}${number}%`;

/**
 * A positive percentage value.
 *
 * Same as Percentage but restricted to positive values only.
 *
 * Reference: ST_PositivePercentage in OOXML specification
 *
 * @example
 * ```typescript
 * const percent: PositivePercentage = "50%";
 * ```
 */
export type PositivePercentage = `${number}%`;

/**
 * A relative measurement value using em or ex units.
 *
 * Used in VML text boxes for font-relative measurements.
 *
 * @example
 * ```typescript
 * const measure: RelativeMeasure = "2em";
 * const negative: RelativeMeasure = "-0.5ex";
 * ```
 */
export type RelativeMeasure = `${"-" | ""}${number}${"em" | "ex"}`;

/**
 * Validates and converts a number to an integer (decimal number).
 *
 * Reference: ST_DecimalNumber in OOXML specification
 *
 * @param val - The number to validate and convert
 * @returns The floored integer value
 * @throws Error if the value is NaN
 *
 * @example
 * ```typescript
 * const num = decimalNumber(10.7); // Returns 10
 * const negative = decimalNumber(-5.3); // Returns -5
 * ```
 */
export const decimalNumber = (val: number): number => {
    if (isNaN(val)) {
        throw new Error(`Invalid value '${val}' specified. Must be an integer.`);
    }
    return Math.floor(val);
};

/**
 * Validates and converts a number to a positive integer (unsigned decimal number).
 *
 * Reference: ST_UnsignedDecimalNumber in OOXML specification
 *
 * @param val - The number to validate and convert
 * @returns The floored positive integer value
 * @throws Error if the value is NaN or negative
 *
 * @example
 * ```typescript
 * const num = unsignedDecimalNumber(10.7); // Returns 10
 * const invalid = unsignedDecimalNumber(-5); // Throws Error
 * ```
 */
export const unsignedDecimalNumber = (val: number): number => {
    const value = decimalNumber(val);
    if (value < 0) {
        throw new Error(`Invalid value '${val}' specified. Must be a positive integer.`);
    }
    return value;
};

/**
 * Validates and normalizes a hexadecimal binary value.
 *
 * The xsd:hexBinary type represents binary data as a sequence of binary octets
 * using hexadecimal encoding, where each binary octet is a two-character
 * hexadecimal number. Both lowercase and uppercase letters A-F are permitted.
 *
 * @param val - The hexadecimal string to validate
 * @param length - The expected length in bytes (not characters)
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid hex string of the expected length
 *
 * @example
 * ```typescript
 * hexBinary("0FB8", 2); // Valid: 2 bytes = 4 characters
 * hexBinary("ABC", 2); // Invalid: wrong length
 * ```
 */
const hexBinary = (val: string, length: number): string => {
    const expectedLength = length * 2;
    if (val.length !== expectedLength || isNaN(Number(`0x${val}`))) {
        throw new Error(`Invalid hex value '${val}'. Expected ${expectedLength} digit hex value`);
    }
    return val;
};

/**
 * Validates a long hexadecimal number (4 bytes / 8 characters).
 *
 * Reference: ST_LongHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 8-character hex string
 *
 * @example
 * ```typescript
 * const hex = longHexNumber("ABCD1234"); // Valid
 * ```
 */
export const longHexNumber = (val: string): string => hexBinary(val, 4);

/**
 * Validates a short hexadecimal number (2 bytes / 4 characters).
 *
 * Reference: ST_ShortHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 4-character hex string
 *
 * @example
 * ```typescript
 * const hex = shortHexNumber("AB12"); // Valid
 * ```
 */
export const shortHexNumber = (val: string): string => hexBinary(val, 2);

/**
 * Validates a single-byte hexadecimal number (1 byte / 2 characters).
 *
 * Reference: ST_UcharHexNumber in OOXML specification
 *
 * @param val - The hexadecimal string to validate
 * @returns The validated hexadecimal string
 * @throws Error if the value is not a valid 2-character hex string
 *
 * @example
 * ```typescript
 * const hex = uCharHexNumber("FF"); // Valid
 * ```
 */
export const uCharHexNumber = (val: string): string => hexBinary(val, 1);

/**
 * Normalizes a universal measure value by parsing and reformatting.
 *
 * Ensures the numeric portion is properly formatted while preserving the unit.
 *
 * Reference: ST_UniversalMeasure in OOXML specification
 *
 * @param val - The universal measure string to normalize
 * @returns The normalized universal measure
 *
 * @example
 * ```typescript
 * const measure = universalMeasureValue("10.500mm"); // Returns "10.5mm"
 * ```
 */
export const universalMeasureValue = (val: UniversalMeasure): UniversalMeasure => {
    const unit = val.slice(-2);
    const amount = val.substring(0, val.length - 2);
    return `${Number(amount)}${unit}` as UniversalMeasure;
};

/**
 * Validates and normalizes a positive universal measure value.
 *
 * Reference: ST_PositiveUniversalMeasure in OOXML specification
 *
 * @param val - The positive universal measure string to validate
 * @returns The normalized positive universal measure
 * @throws Error if the value is negative
 *
 * @example
 * ```typescript
 * const measure = positiveUniversalMeasureValue("10.5mm"); // Valid
 * const invalid = positiveUniversalMeasureValue("-5mm"); // Throws Error
 * ```
 */
export const positiveUniversalMeasureValue = (val: PositiveUniversalMeasure): PositiveUniversalMeasure => {
    const value = universalMeasureValue(val);
    if (parseFloat(value) < 0) {
        throw new Error(`Invalid value '${value}' specified. Expected a positive number.`);
    }
    return value as PositiveUniversalMeasure;
};

/**
 * Validates and normalizes a hexadecimal color value.
 *
 * Accepts either "auto" or a 6-character RGB hex value (with or without # prefix).
 * The # prefix is commonly used but technically invalid in OOXML, so it is stripped
 * for strict compliance.
 *
 * Reference: ST_HexColor in OOXML specification
 *
 * @param val - The color value to validate ("auto" or hex color)
 * @returns The normalized color value
 * @throws Error if the hex color is invalid
 *
 * @example
 * ```typescript
 * const color1 = hexColorValue("auto"); // Returns "auto"
 * const color2 = hexColorValue("FF0000"); // Returns "FF0000"
 * const color3 = hexColorValue("#00FF00"); // Returns "00FF00" (# stripped)
 * ```
 */
export const hexColorValue = (val: string): string => {
    if (val === "auto") {
        return val;
    }
    // It's super common to see colors prefixed with a pound, but technically invalid here.
    // Most clients work with it, but strip it off anyway for strict compliance.
    const color = val.charAt(0) === "#" ? val.substring(1) : val;
    return hexBinary(color, 3);
};

/**
 * Validates a signed TWIP measurement value.
 *
 * Accepts either a universal measure string or a numeric TWIP value.
 *
 * Reference: ST_SignedTwipsMeasure in OOXML specification
 *
 * @param val - The measurement value (universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const measure1 = signedTwipsMeasureValue("10mm");
 * const measure2 = signedTwipsMeasureValue(1440); // 1 inch in TWIP
 * ```
 */
export const signedTwipsMeasureValue = (val: UniversalMeasure | number): UniversalMeasure | number =>
    typeof val === "string" ? universalMeasureValue(val) : decimalNumber(val);

/**
 * Validates a half-point (HPS) measurement value.
 *
 * Accepts either a positive universal measure string or a positive number.
 * HPS (half-points) are commonly used for font sizes.
 *
 * Reference: ST_HpsMeasure in OOXML specification
 *
 * @param val - The measurement value (positive universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const fontSize1 = hpsMeasureValue("12pt");
 * const fontSize2 = hpsMeasureValue(24); // 12pt in half-points
 * ```
 */
export const hpsMeasureValue = (val: PositiveUniversalMeasure | number): string | number =>
    typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);

/**
 * Validates a signed half-point (HPS) measurement value.
 *
 * Accepts either a universal measure string or a numeric value.
 *
 * Reference: ST_SignedHpsMeasure in OOXML specification
 *
 * @param val - The measurement value (universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const spacing1 = signedHpsMeasureValue("6pt");
 * const spacing2 = signedHpsMeasureValue(-12); // Negative spacing
 * ```
 */
export const signedHpsMeasureValue = (val: UniversalMeasure | number): string | number =>
    typeof val === "string" ? universalMeasureValue(val) : decimalNumber(val);

/**
 * Validates a positive TWIP measurement value.
 *
 * Accepts either a positive universal measure string or a positive number.
 *
 * Reference: ST_TwipsMeasure in OOXML specification
 *
 * @param val - The measurement value (positive universal measure or number)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const width1 = twipsMeasureValue("25.4mm");
 * const width2 = twipsMeasureValue(1440); // 1 inch in TWIP
 * ```
 */
export const twipsMeasureValue = (val: PositiveUniversalMeasure | number): PositiveUniversalMeasure | number =>
    typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);

/**
 * Normalizes a percentage value by parsing and reformatting.
 *
 * Reference: ST_Percentage in OOXML specification
 *
 * @param val - The percentage string to normalize
 * @returns The normalized percentage
 *
 * @example
 * ```typescript
 * const percent = percentageValue("50.000%"); // Returns "50%"
 * ```
 */
export const percentageValue = (val: Percentage): Percentage => {
    const percent = val.substring(0, val.length - 1);
    return `${Number(percent)}%`;
};

/**
 * Validates a measurement value that can be expressed as a number, percentage, or universal measure.
 *
 * Reference: ST_MeasurementOrPercent in OOXML specification
 *
 * @param val - The measurement value (number, percentage, or universal measure)
 * @returns The normalized measurement value
 *
 * @example
 * ```typescript
 * const measure1 = measurementOrPercentValue(100); // Unqualified number
 * const measure2 = measurementOrPercentValue("50%"); // Percentage
 * const measure3 = measurementOrPercentValue("10mm"); // Universal measure
 * ```
 */
export const measurementOrPercentValue = (val: number | Percentage | UniversalMeasure): number | UniversalMeasure | Percentage => {
    if (typeof val === "number") {
        return decimalNumber(val);
    }
    if (val.slice(-1) === "%") {
        return percentageValue(val as Percentage);
    }
    return universalMeasureValue(val as UniversalMeasure);
};

/**
 * Validates an eighth-point measurement value.
 *
 * Eighth-points are used for fine-grained measurements in text formatting.
 *
 * Reference: ST_EighthPointMeasure in OOXML specification
 *
 * @param val - The measurement value in eighth-points
 * @returns The validated positive integer value
 *
 * @example
 * ```typescript
 * const measure = eighthPointMeasureValue(16); // 2 points
 * ```
 */
export const eighthPointMeasureValue = unsignedDecimalNumber;

/**
 * Validates a point measurement value.
 *
 * Reference: ST_PointMeasure in OOXML specification
 *
 * @param val - The measurement value in points
 * @returns The validated positive integer value
 *
 * @example
 * ```typescript
 * const fontSize = pointMeasureValue(12); // 12pt
 * ```
 */
export const pointMeasureValue = unsignedDecimalNumber;

// cspell:words CCYY
/**
 * Converts a JavaScript Date object to an ISO 8601 date-time string.
 *
 * The format is CCYY-MM-DDThh:mm:ss.sssZ where T is a literal and Z indicates UTC.
 * This matches the xsd:dateTime format required by OOXML.
 *
 * Reference: ST_DateTime in OOXML specification
 *
 * @param val - The Date object to convert
 * @returns An ISO 8601 formatted date-time string
 *
 * @example
 * ```typescript
 * const now = new Date();
 * const timestamp = dateTimeValue(now); // Returns "2024-01-15T10:30:00.000Z"
 * ```
 */
export const dateTimeValue = (val: Date): string => val.toISOString();
