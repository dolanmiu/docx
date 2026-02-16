/**
 * XML-serializable object types for the docx library.
 *
 * This module defines the core types used for representing XML structures
 * in an object format that can be serialized using the xml library.
 *
 * @module
 */

/**
 * Attributes for an XML element.
 *
 * Maps attribute names to their values. Attribute values can be strings,
 * numbers, or booleans, which will be converted to strings in the final XML.
 */
export type IXmlAttribute = Readonly<Record<string, string | number | boolean>>;

/**
 * Object that can be serialized to XML.
 *
 * This interface represents the intermediate object structure used by the xml library
 * to generate the final XML output. Objects typically have a structure like:
 * ```
 * {
 *   "w:elementName": {
 *     _attr: { "w:attribute": "value" },
 *     // child elements or text
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions
export interface IXmlableObject extends Record<string, unknown> {
    // readonly _attr?: IXmlAttribute;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly [key: string]: any;
}
// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND3 = "";
