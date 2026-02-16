/**
 * Utility functions for XML manipulation in document patching.
 *
 * @module
 */
import xml from "xml";
import { Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { Text } from "@file/paragraph/run/run-components/text";

const formatter = new Formatter();

/**
 * Converts XML string to JSON element structure.
 *
 * Parses XML text into a JavaScript object representation that can be
 * manipulated programmatically. Preserves spaces between elements for
 * accurate text handling.
 *
 * @param xmlData - The XML string to parse
 * @returns Parsed XML as an Element object
 *
 * @example
 * ```typescript
 * const element = toJson('<w:p><w:r><w:t>Hello</w:t></w:r></w:p>');
 * ```
 */
export const toJson = (xmlData: string): Element => {
    const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as Element;
    return xmlObj;
};

/**
 * Creates text element contents from a text string.
 *
 * Generates the XML element structure for a text node (w:t) by formatting
 * a Text component and extracting its element contents. Used when creating
 * new text runs during replacement operations.
 *
 * @param text - The text content to wrap in element structure
 * @returns Array of XML elements representing the text
 *
 * @example
 * ```typescript
 * const elements = createTextElementContents("Hello World");
 * // Returns XML elements for <w:t>Hello World</w:t>
 * ```
 */
// eslint-disable-next-line functional/prefer-readonly-type
export const createTextElementContents = (text: string): Element[] => {
    const textJson = toJson(xml(formatter.format(new Text({ text }))));

    return textJson.elements![0].elements ?? [];
};

/**
 * Adds xml:space="preserve" attribute to an element.
 *
 * The xml:space attribute instructs XML processors to preserve whitespace
 * in the element's content. This is important when text contains leading
 * or trailing spaces that must be maintained.
 *
 * @param element - The element to patch
 * @returns New element with xml:space attribute added
 *
 * @example
 * ```typescript
 * const patched = patchSpaceAttribute(textElement);
 * // Adds xml:space="preserve" to maintain whitespace
 * ```
 */
export const patchSpaceAttribute = (element: Element): Element => ({
    ...element,
    attributes: {
        "xml:space": "preserve",
    },
});

/**
 * Retrieves first-level child elements by parent element name.
 *
 * Finds the first element with the specified name and returns its children.
 * Used to access collections like relationship elements or content type definitions.
 *
 * @param relationships - The parent XML element to search
 * @param id - The element name to find
 * @returns Array of child elements
 *
 * @example
 * ```typescript
 * const rels = getFirstLevelElements(relationshipsXml, "Relationships");
 * // Returns array of Relationship elements
 * ```
 */
// eslint-disable-next-line functional/prefer-readonly-type
export const getFirstLevelElements = (relationships: Element, id: string): Element[] =>
    relationships.elements?.filter((e) => e.name === id)[0].elements ?? [];
