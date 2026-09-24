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
