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
 * Writes text content, escaped, as the xml package did, writing nothing for undefined.
 */
const writeText = (value: unknown): string => (value === undefined ? "" : String(escapeValue(value)));

/**
 * Options for {@link stringifyXmlable}.
 */
export type StringifyXmlableOptions = {
    /** What to indent each level with, such as two spaces. Without it, the XML is written on one line. */
    readonly indent?: string;
    /** Write an XML declaration first, with these attributes. */
    readonly declaration?: { readonly encoding?: string; readonly standalone?: string };
};

/**
 * Writes an element as the xml package did, quirks and all, so that docx writes the same XML byte for byte. Its XML
 * is pushed onto `out` in pieces, which are joined once at the end, rather than built as a string for each element.
 *
 * @param data - The object to write, such as `{ "w:b": {} }`
 * @param indent - What to indent each level with, or an empty string to write one line
 * @param indents - The indentation of this element
 * @param isLast - Whether this is the last object written, which isn't followed by a line break
 * @param out - The pieces of XML written so far
 */
const write = (data: object, indent: string, indents: string, isLast: boolean, out: string[]): void => {
    // An empty object has no name, and writes nothing
    const name = Object.keys(data)[0] as string | undefined;
    const values: unknown = name === undefined ? undefined : (data as Record<string, unknown>)[name];

    // The open tag is written once the attributes and the content are known, as an attribute can come after content
    const start = out.length;
    // eslint-disable-next-line functional/immutable-data
    out.push("");
    let attributes = "";
    // How many items of content the element has, which decides how it is indented
    let length = 0;
    const addAttributes = (attr: Readonly<Record<string, unknown>>): void => {
        for (const key of Object.keys(attr)) {
            attributes += ` ${key}="${String(escapeValue(attr[key]))}"`;
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
                out.push(`<![CDATA[${cdata.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`);
                length++;
            }
            if (Array.isArray(values)) {
                let isStringContent = false;
                const childIndents = indents + indent;
                // Where the last item of content starts, so that text can take its place
                let lastStart = out.length;
                length++;
                for (const value of values) {
                    if (typeof value === "object") {
                        if (Object.keys(value)[0] === "_attr") {
                            addAttributes((value as { readonly _attr: Record<string, unknown> })._attr);
                        } else {
                            lastStart = out.length;
                            length++;
                            write(value as object, indent, childIndents, false, out);
                        }
                    } else {
                        // Text takes the place of whatever came before it, as it did in the xml package
                        // eslint-disable-next-line functional/immutable-data
                        out.length = lastStart;
                        isStringContent = true;
                        // eslint-disable-next-line functional/immutable-data
                        out.push(writeText(value));
                    }
                }
                if (!isStringContent) {
                    length++;
                }
            }
        }
    } else {
        // eslint-disable-next-line functional/immutable-data
        out.push(writeText(values));
        length++;
    }

    const open =
        indents + (name ? `<${name}` : "") + attributes + (length > 0 ? (name ? ">" : "") : "/>") + (indent && length > 1 ? "\n" : "");
    if (length === 0) {
        // eslint-disable-next-line functional/immutable-data
        out[start] = open + (indent ? "\n" : "");
        return;
    }
    // eslint-disable-next-line functional/immutable-data
    out[start] = open;
    // eslint-disable-next-line functional/immutable-data
    out.push((length > 1 ? indents : "") + (name ? `</${name}>` : "") + (indent && !isLast ? "\n" : ""));
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
    const standalone = declaration?.standalone ? ` standalone="${escapeAll(declaration.standalone)}"` : "";
    const declarationXml =
        declaration === undefined
            ? ""
            : `<?xml version="1.0" encoding="${escapeAll(declaration.encoding || "UTF-8")}"${standalone}?>${indent ? "\n" : ""}`;
    const out: string[] = [declarationXml];
    items.forEach((item, i) => write(item, indent, "", i === items.length - 1, out));
    return out.join("");
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
