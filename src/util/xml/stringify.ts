/**
 * Writes XML, from the objects docx's `Formatter` makes or from an {@link XmlElement} tree.
 *
 * @module
 */
import type { IXmlableObject } from "@file/xml-components/xmlable-object";

import type { XmlElement } from "./types";

const ESCAPES: ReadonlyMap<string, string> = new Map([
    ["&", "&amp;"],
    ['"', "&quot;"],
    ["'", "&apos;"], // cspell:words apos
    ["<", "&lt;"],
    [">", "&gt;"],
]);

// The control characters other than tab, line feed and carriage return are not allowed anywhere in an XML 1.0 document,
// not even as character references, so they are left out: a part that has one can't be parsed, and Word can't open the
// document. U+FFFE and U+FFFF aren't allowed either, but are kept, as the patcher writes U+FFFF as its split token
// (`SPLIT_TOKEN` in src/patcher/replacer.ts) through stringifyXmlable and looks for it in what comes back
const escapeAll = (value: string): string =>
    // eslint-disable-next-line no-control-regex
    value.replace(/[&"'<>\x00-\x08\x0B\x0C\x0E-\x1F]/g, (char) => ESCAPES.get(char) ?? "");

const escapeText = (value: string): string =>
    // eslint-disable-next-line no-control-regex
    value.replace(/[&<>\x00-\x08\x0B\x0C\x0E-\x1F]/g, (char) => ESCAPES.get(char) ?? "");

/**
 * Escapes a value the way the xml package did, leaving values that aren't strings, such as numbers, as they are.
 */
const escapeValue = <T>(value: T): T | string => (typeof value === "string" ? escapeAll(value) : value);

/**
 * Options for {@link stringifyXmlable}.
 */
export type StringifyXmlableOptions = {
    /** What to indent each level with, such as two spaces. Without it, the XML is written on one line. */
    readonly indent?: string;
    /** Write an XML declaration first, with these attributes. */
    readonly declaration?: { readonly encoding?: string; readonly standalone?: string };
};

type ResolvedContent = ResolvedElement | string | number | boolean | undefined;

type ResolvedElement = {
    readonly name: string | undefined;
    readonly attributes: readonly string[];
    readonly content: readonly ResolvedContent[];
    readonly indents: string;
};

/**
 * Works out an element's tag, attributes and content, as the xml package did, quirks and all, so that docx writes the
 * same XML byte for byte.
 */
const resolve = (data: object, indent: string, depth: number): ResolvedElement => {
    // An empty object has no name, and writes nothing
    const name = Object.keys(data)[0] as string | undefined;
    const values: unknown = name === undefined ? undefined : (data as Record<string, unknown>)[name];

    // Built in place, as an element of a document's body can have thousands of children
    // eslint-disable-next-line functional/prefer-readonly-type
    const attributes: string[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const content: ResolvedContent[] = [];
    const addAttributes = (attr: Readonly<Record<string, unknown>>): void => {
        for (const [key, value] of Object.entries(attr)) {
            // eslint-disable-next-line functional/immutable-data
            attributes.push(`${key}="${String(escapeValue(value))}"`);
        }
    };

    if (typeof values === "object") {
        if (values !== null) {
            const { _attr: attr, _cdata: cdata } = values as { readonly _attr?: Record<string, unknown>; readonly _cdata?: string };
            if (attr) {
                addAttributes(attr);
            }
            if (cdata) {
                // eslint-disable-next-line functional/immutable-data
                content.push(`<![CDATA[${cdata.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`);
            }
            if (Array.isArray(values)) {
                let isStringContent = false;
                // eslint-disable-next-line functional/immutable-data
                content.push("");
                for (const value of values) {
                    if (typeof value === "object") {
                        if (Object.keys(value)[0] === "_attr") {
                            addAttributes((value as { readonly _attr: Record<string, unknown> })._attr);
                        } else {
                            // eslint-disable-next-line functional/immutable-data
                            content.push(resolve(value as object, indent, depth + 1));
                        }
                    } else {
                        // Text takes the place of whatever came before it, as it did in the xml package
                        // eslint-disable-next-line functional/immutable-data
                        content.pop();
                        isStringContent = true;
                        // eslint-disable-next-line functional/immutable-data
                        content.push(escapeValue(value as string));
                    }
                }
                if (!isStringContent) {
                    // eslint-disable-next-line functional/immutable-data
                    content.push("");
                }
            }
        }
    } else {
        // eslint-disable-next-line functional/immutable-data
        content.push(escapeValue(values as string | number | boolean | undefined));
    }

    return { name, attributes, content, indents: depth > 1 ? indent.repeat(depth - 1) : "" };
};

const format = (element: ResolvedElement | string | number | boolean, indent: string, isLast: boolean): string => {
    if (typeof element !== "object") {
        return String(element);
    }
    const { name, attributes, content, indents } = element;
    const { length } = content;
    const open =
        indents +
        (name ? `<${name}` : "") +
        (attributes.length > 0 ? ` ${attributes.join(" ")}` : "") +
        (length > 0 ? (name ? ">" : "") : "/>") +
        (indent && length > 1 ? "\n" : "");
    if (length === 0) {
        return open + (indent ? "\n" : "");
    }
    const children = content.map((child) => (child === undefined ? "" : format(child, indent, false))).join("");
    return open + children + (length > 1 ? indents : "") + (name ? `</${name}>` : "") + (indent && !isLast ? "\n" : "");
};

/**
 * Writes the XML of an object from docx's `Formatter`, such as `{ "w:b": { _attr: { "w:val": false } } }`,
 * as the xml package did.
 *
 * @param input - The object, or several to write one after another
 * @param options - How to indent, and the XML declaration to write first
 * @returns The XML
 */
export const stringifyXmlable = (
    input: IXmlableObject | readonly IXmlableObject[],
    { indent = "", declaration }: StringifyXmlableOptions = {},
): string => {
    const items = Array.isArray(input) ? input : [input];
    const startDepth = indent ? 1 : 0;
    const standalone = declaration?.standalone ? ` standalone="${escapeAll(declaration.standalone)}"` : "";
    const declarationXml =
        declaration === undefined
            ? ""
            : `<?xml version="1.0" encoding="${escapeAll(declaration.encoding || "UTF-8")}"${standalone}?>${indent ? "\n" : ""}`;
    return declarationXml + items.map((item, i) => format(resolve(item, indent, startDepth), indent, i === items.length - 1)).join("");
};

const stringifyAttributes = (attributes: XmlElement["attributes"]): string =>
    Object.entries(attributes ?? {})
        .flatMap(([key, value]) => (value === undefined || value === null ? [] : [` ${key}="${escapeAll(String(value))}"`]))
        .join("");

const stringifyNode = (node: XmlElement): string => {
    switch (node.type) {
        case "element": {
            const elements = node.elements ?? [];
            const open = `<${node.name}${stringifyAttributes(node.attributes)}`;
            // An empty element that preserves its whitespace is written with both tags, as xml-js did
            return elements.length > 0 || node.attributes?.["xml:space"] === "preserve"
                ? `${open}>${elements.map(stringifyNode).join("")}</${node.name}>`
                : `${open}/>`;
        }
        case "text":
            return escapeText(String(node.text));
        case "cdata":
            return `<![CDATA[${String(node.cdata).replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
        case "comment":
            return `<!--${node.comment}-->`;
        case "doctype":
            return `<!DOCTYPE ${node.doctype}>`;
        case "instruction":
            return `<?${node.name}${node.instruction ? ` ${node.instruction}` : ""}?>`;
        default:
            return "";
    }
};

/**
 * Writes the XML of an {@link XmlElement} tree, such as one from {@link parseXml}.
 *
 * @param document - The document, with its declaration and the nodes at its top level
 * @returns The XML
 */
export const stringifyElement = (document: XmlElement): string =>
    (document.declaration ? `<?xml${stringifyAttributes(document.declaration.attributes)}?>` : "") +
    (document.elements ?? []).map(stringifyNode).join("");
