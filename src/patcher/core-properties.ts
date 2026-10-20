/**
 * The properties of a patched document, such as its title, which Word shows in File > Info.
 *
 * @module
 */
import type { IPropertiesOptions } from "@file/core-properties";
import type { XmlElement as Element } from "@util/xml";

import { resolveTarget } from "./drawing-patch";
import { appendRelationship, createRelationshipFile, getNextRelationshipIndex } from "./relationship-manager";
import { getFirstLevelElements, toJson } from "./util";

/**
 * The properties of a document that `patchDocument` sets, with the names `Document` gives them. Word shows `keywords`
 * as the document's tags and `description` as its comments.
 */
export type PatchDocumentProperties = Pick<
    IPropertiesOptions,
    "title" | "subject" | "creator" | "keywords" | "description" | "lastModifiedBy" | "revision"
>;

const CORE_PROPERTIES_RELATIONSHIP_TYPE = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties";
const CORE_PROPERTIES_CONTENT_TYPE = "application/vnd.openxmlformats-package.core-properties+xml";
const PACKAGE_RELATIONSHIPS_PATH = "_rels/.rels";
// Where Word and docx put the core properties
const CORE_PROPERTIES_PATH = "docProps/core.xml";

const NAMESPACES = {
    cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    dc: "http://purl.org/dc/elements/1.1/",
} as const;

// The element of each property: its namespace, by its usual prefix, and its name, in the order Document writes them
const ELEMENTS: Readonly<Record<keyof PatchDocumentProperties, { readonly namespace: keyof typeof NAMESPACES; readonly name: string }>> = {
    title: { namespace: "dc", name: "title" },
    subject: { namespace: "dc", name: "subject" },
    creator: { namespace: "dc", name: "creator" },
    keywords: { namespace: "cp", name: "keywords" },
    description: { namespace: "dc", name: "description" },
    lastModifiedBy: { namespace: "cp", name: "lastModifiedBy" },
    revision: { namespace: "cp", name: "revision" },
};

// The text of a property's element. An empty value clears the property
// eslint-disable-next-line functional/prefer-readonly-type
const textOf = (value: string | number): Element[] => (value === "" ? [] : [{ type: "text", text: String(value) }]);

// An element's name without its namespace prefix, which a document may choose. The core properties' elements each have
// a name of their own, whatever their namespace, so they are found by it
const localName = (element: Element): string | undefined => element.name?.slice(element.name.indexOf(":") + 1);

/**
 * The prefix, with its colon, that the root gives a namespace, or none if it's the default one. A root without the
 * namespace is given it with its usual prefix.
 */
const prefixOf = (root: Element, namespace: keyof typeof NAMESPACES): string => {
    const declaration = Object.entries({ ...root.attributes }).find(
        ([name, value]) => (name === "xmlns" || name.startsWith("xmlns:")) && value === NAMESPACES[namespace],
    )?.[0];
    if (declaration === undefined) {
        root.attributes = { ...root.attributes, [`xmlns:${namespace}`]: NAMESPACES[namespace] };
        return `${namespace}:`;
    }
    return declaration === "xmlns" ? "" : `${declaration.slice("xmlns:".length)}:`;
};

/**
 * The text of a part, in UTF-16, from its byte order mark, or else in UTF-8.
 */
const decode = (bytes: Uint8Array): string => {
    const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le" : bytes[0] === 0xfe && bytes[1] === 0xff ? "utf-16be" : "utf-8";
    return new TextDecoder(encoding).decode(bytes);
};

/**
 * The package's part at a path, if it has one. The patcher keeps a part in UTF-16, or one whose name doesn't end in
 * .xml, with its other parts, as it found it, so that is read and moved to its XML parts, to be written in UTF-8 with
 * them, rather than written over them as it was.
 */
const readPart = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    // eslint-disable-next-line functional/prefer-readonly-type
    binaryParts: Map<string, Uint8Array>,
    path: string,
): Element | undefined => {
    const bytes = binaryParts.get(path);
    if (bytes === undefined) {
        return parts.get(path);
    }

    const part = toJson(decode(bytes));
    if (part.declaration?.attributes) {
        // eslint-disable-next-line functional/immutable-data
        part.declaration.attributes.encoding = "UTF-8";
    }
    // eslint-disable-next-line functional/immutable-data
    binaryParts.delete(path);
    // eslint-disable-next-line functional/immutable-data
    parts.set(path, part);
    return part;
};

/**
 * The path of the package's core properties part, found from its relationships. A package without one is given a
 * relationship to docProps/core.xml.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const corePropertiesPathOf = (parts: Map<string, Element>): string => {
    const relationships = parts.get(PACKAGE_RELATIONSHIPS_PATH) ?? createRelationshipFile();
    const target = getFirstLevelElements(relationships, "Relationships").find(
        (relationship) => relationship.attributes?.Type === CORE_PROPERTIES_RELATIONSHIP_TYPE,
    )?.attributes?.Target;
    if (typeof target === "string") {
        return resolveTarget("", target);
    }

    appendRelationship(relationships, getNextRelationshipIndex(relationships), CORE_PROPERTIES_RELATIONSHIP_TYPE, CORE_PROPERTIES_PATH);
    // eslint-disable-next-line functional/immutable-data
    parts.set(PACKAGE_RELATIONSHIPS_PATH, relationships);
    return CORE_PROPERTIES_PATH;
};

/**
 * Sets the given properties of a document in its core properties part, replacing the template's, and leaves the
 * others as they are. A template without the part is given one.
 *
 * @param parts - The package's XML parts, by their paths, which the part is set in
 * @param binaryParts - The package's other parts, by their paths, which the part is taken from if it's one of them
 * @param addContentTypeOverride - Adds the content type of the part, if it's new
 */
export const patchCoreProperties = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    // eslint-disable-next-line functional/prefer-readonly-type
    binaryParts: Map<string, Uint8Array>,
    properties: PatchDocumentProperties,
    { addContentTypeOverride }: { readonly addContentTypeOverride: (contentType: string, partName: string) => void },
): void => {
    const path = corePropertiesPathOf(parts);
    const existing = readPart(parts, binaryParts, path);
    const part: Element = existing ?? {
        declaration: { attributes: { version: "1.0", encoding: "UTF-8", standalone: "yes" } },
        elements: [{ type: "element", name: "cp:coreProperties", attributes: { "xmlns:cp": NAMESPACES.cp }, elements: [] }],
    };
    if (existing === undefined) {
        // eslint-disable-next-line functional/immutable-data
        parts.set(path, part);
        addContentTypeOverride(CORE_PROPERTIES_CONTENT_TYPE, `/${path}`);
    }

    const root = part.elements?.find((element) => localName(element) === "coreProperties");
    if (root === undefined) {
        throw new Error(`Could not find the core properties in ${path}`);
    }
    root.elements ??= [];

    // Only the properties are read, so options with others, such as a Document's, can be given
    for (const [key, { namespace, name }] of Object.entries(ELEMENTS)) {
        const value = properties[key as keyof PatchDocumentProperties];
        if (value === undefined) {
            continue;
        }
        const element = root.elements.find((item) => localName(item) === name);
        if (element) {
            // The value replaces the element's, and any keywords in other languages that it has
            // eslint-disable-next-line functional/immutable-data
            element.elements = textOf(value);
        } else {
            root.elements.push({ type: "element", name: `${prefixOf(root, namespace)}${name}`, elements: textOf(value) });
        }
    }
};
