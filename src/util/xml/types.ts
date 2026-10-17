/**
 * The tree that docx reads XML into, such as the parts of a document it patches or the XML given to
 * `convertToXmlComponent`.
 *
 * @module
 */
/* eslint-disable functional/prefer-readonly-type -- Changes to a document, such as patches, are made to its tree in place */

/**
 * The attributes of an element, by name.
 */
export type XmlAttributes = Record<string, string | number | undefined>;

/**
 * The attributes of an XML declaration, such as `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`.
 */
export type XmlDeclarationAttributes = {
    version?: string | number;
    encoding?: string;
    standalone?: "yes" | "no";
};

/**
 * A node of an XML document, or the document itself.
 *
 * It has the shape of xml-js's non-compact `Element`, which docx used before it read XML itself, so a tree from
 * xml-js can still be given wherever docx takes one. `type` says which of the other fields the node has:
 *
 * - The document has no `type`. It has its `declaration`, if it has one, and the nodes at its top level in `elements`.
 * - `"element"` has its `name`, and its `attributes` and `elements` if it has any.
 * - `"text"` has its `text`, with entities such as `&amp;` decoded.
 * - `"cdata"`, `"comment"` and `"doctype"` have their content in the field of their name.
 * - `"instruction"`, a processing instruction such as `<?mso-application progid="Word.Document"?>`, has its `name`
 *   and the rest in `instruction`.
 */
export type XmlElement = {
    declaration?: { attributes?: XmlDeclarationAttributes };
    instruction?: string;
    attributes?: XmlAttributes;
    cdata?: string;
    doctype?: string;
    comment?: string;
    text?: string | number | boolean;
    type?: string;
    name?: string;
    elements?: XmlElement[];
};
