/**
 * VML value formatting helpers.
 *
 * VML predates OOXML and uses its own attribute value conventions, which
 * differ from those used by WordprocessingML and DrawingML. This module
 * converts JavaScript-friendly values into those conventions.
 *
 * @module
 */

/**
 * VML boolean attribute value (ST_TrueFalse).
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TrueFalse">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="t"/>
 *     <xsd:enumeration value="f"/>
 *     <xsd:enumeration value="true"/>
 *     <xsd:enumeration value="false"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export type VmlTrueFalse = "t" | "f";

/**
 * Converts a boolean into the VML `t`/`f` representation.
 *
 * Undefined values are passed through so that optional attributes are omitted
 * from the generated XML.
 *
 * @param value - The boolean to convert
 * @returns `"t"` for true, `"f"` for false, or `undefined` when no value was given
 *
 * @example
 * ```typescript
 * vmlTrueFalse(true); // "t"
 * vmlTrueFalse(false); // "f"
 * vmlTrueFalse(undefined); // undefined
 * ```
 */
export const vmlTrueFalse = (value: boolean | undefined): VmlTrueFalse | undefined => (value === undefined ? undefined : value ? "t" : "f");

/**
 * Normalizes a colour for VML colour attributes (ST_ColorType).
 *
 * VML accepts either a named colour (`silver`, `red`, ...) or a hex triplet
 * prefixed with `#`. Hex values are accepted with or without the leading `#`
 * and are always emitted with it so that Word does not mistake them for
 * colour names. Any other value is passed through unchanged.
 *
 * @param value - A named colour, or a 6-digit hex colour with or without `#`
 * @returns The colour formatted for VML
 *
 * @example
 * ```typescript
 * vmlColorValue("C0C0C0"); // "#C0C0C0"
 * vmlColorValue("#ff0000"); // "#ff0000"
 * vmlColorValue("silver"); // "silver"
 * ```
 */
export const vmlColorValue = (value: string): string => (/^#?[0-9a-fA-F]{6}$/.test(value) ? `#${value.replace(/^#/, "")}` : value);

/**
 * Formats a fraction as a VML fixed-point value.
 *
 * Several VML attributes (`gain`, `blacklevel`, ...) accept fixed-point
 * numbers where 65536 represents 1.0. These are written with an `f` suffix.
 *
 * @param value - The fraction to convert, where 1 represents 65536
 * @returns The fixed-point representation, e.g. `"19661f"`
 *
 * @example
 * ```typescript
 * vmlFixedPoint(0.5); // "32768f"
 * ```
 */
export const vmlFixedPoint = (value: number): string => `${Math.round(value * 65536)}f`;
