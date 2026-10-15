/**
 * Placeholder module for the `{key}` tokens docx writes before it knows an image's or a list's id.
 *
 * @module
 */

const PLACEHOLDER = /\{([^{}]+)\}/g;

/**
 * Replaces each `{key}` in the XML whose key has a value, in one pass over the XML. Other text in braces, such as a
 * font's key, is left as it is.
 *
 * @param xmlData - The XML string containing placeholders
 * @param values - The value to write for each key
 * @returns XML string with the placeholders replaced
 */
export const replacePlaceholders = (xmlData: string, values: ReadonlyMap<string, string>): string =>
    values.size === 0 ? xmlData : xmlData.replace(PLACEHOLDER, (placeholder, key: string) => values.get(key) ?? placeholder);

/**
 * Finds the keys of the `{key}` placeholders in the XML, in one pass over the XML.
 *
 * @param xmlData - The XML string to search
 * @returns The key of every placeholder in the XML
 */
export const findPlaceholders = (xmlData: string): ReadonlySet<string> =>
    new Set(Array.from(xmlData.matchAll(PLACEHOLDER), ([, key]) => key));
