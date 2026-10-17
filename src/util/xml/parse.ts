/**
 * Reads XML into an {@link XmlElement} tree.
 *
 * @module
 */
import type { XmlAttributes, XmlDeclarationAttributes, XmlElement } from "./types";

/**
 * Options for {@link parseXml}.
 */
export type ParseXmlOptions = {
    /**
     * Keep text that is only whitespace, such as the space in `<w:t xml:space="preserve"> </w:t>` or the line breaks
     * between elements. Without it, such text is left out.
     */
    readonly keepWhitespaceText?: boolean;
};

const PREDEFINED_ENTITIES: ReadonlyMap<string, string> = new Map([
    ["amp", "&"],
    ["lt", "<"],
    ["gt", ">"],
    ["quot", '"'],
    ["apos", "'"], // cspell:words apos
]);

const ENTITY_REFERENCE = /&([^;]*);?/g;

/**
 * Decodes the five entities XML predefines and character references, such as `&#xA0;`. XML that declares entities of
 * its own in a DTD is not supported, so that no input can expand into more than it holds.
 */
const decodeEntities = (raw: string): string =>
    raw.indexOf("&") === -1
        ? raw
        : raw.replace(ENTITY_REFERENCE, (reference: string, name: string) => {
              if (!reference.endsWith(";")) {
                  throw new Error(`Invalid XML: "&" that starts no entity, in "${raw}"`);
              }
              const predefined = PREDEFINED_ENTITIES.get(name);
              if (predefined !== undefined) {
                  return predefined;
              }
              const codePoint = /^#x[0-9a-f]+$/i.test(name)
                  ? parseInt(name.slice(2), 16)
                  : /^#[0-9]+$/.test(name)
                    ? parseInt(name.slice(1), 10)
                    : Number.NaN;
              if (!(codePoint > 0 && codePoint <= 0x10ffff)) {
                  throw new Error(`Invalid XML: unknown entity "${reference}"`);
              }
              return String.fromCodePoint(codePoint);
          });

const isWhitespace = (char: string): boolean => char === " " || char === "\n" || char === "\t" || char === "\r";

const DECLARATION_ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const parseDeclarationAttributes = (body: string): XmlDeclarationAttributes =>
    Object.fromEntries(
        [...body.matchAll(DECLARATION_ATTRIBUTE)].map(([, name, doubleQuoted, singleQuoted]) => [name, doubleQuoted ?? singleQuoted]),
    );

/**
 * Reads XML into a tree of {@link XmlElement}s, the shape xml-js gave for `xml2js(text)`.
 *
 * Throws on XML that isn't well formed, such as an element that isn't closed or an entity XML doesn't predefine.
 *
 * @param text - The XML
 * @param options - Whether to keep text that is only whitespace
 * @returns The document, with its declaration and the nodes at its top level
 */
export const parseXml = (text: string, { keepWhitespaceText = false }: ParseXmlOptions = {}): XmlElement => {
    // The tree is built in place, as a document's body can have thousands of children
    const document: XmlElement = {};
    // eslint-disable-next-line functional/prefer-readonly-type
    const open: XmlElement[] = [];
    let position = text.charCodeAt(0) === 0xfeff ? 1 : 0;

    // Whitespace before the first tag isn't part of the document
    while (position < text.length && isWhitespace(text[position])) {
        position++;
    }

    const append = (node: XmlElement): void => {
        const parent = open.length === 0 ? document : open[open.length - 1];
        // eslint-disable-next-line functional/immutable-data
        (parent.elements ??= []).push(node);
    };

    const appendText = (raw: string): void => {
        if (raw.trim() === "") {
            if (raw !== "" && keepWhitespaceText) {
                append({ type: "text", text: raw });
            }
            return;
        }
        if (open.length === 0) {
            throw new Error(`Invalid XML: text outside of the root element, "${raw.trim()}"`);
        }
        append({ type: "text", text: decodeEntities(raw) });
    };

    const indexOfOrThrow = (search: string, from: number, what: string): number => {
        const index = text.indexOf(search, from);
        if (index === -1) {
            throw new Error(`Invalid XML: ${what} that isn't closed`);
        }
        return index;
    };

    while (position < text.length) {
        const tagStart = text.indexOf("<", position);
        appendText(text.slice(position, tagStart === -1 ? text.length : tagStart));
        if (tagStart === -1) {
            break;
        }

        if (text.startsWith("<?", tagStart)) {
            const end = indexOfOrThrow("?>", tagStart + 2, "processing instruction");
            const content = text.slice(tagStart + 2, end);
            const nameEnd = content.search(/\s/);
            const name = nameEnd === -1 ? content : content.slice(0, nameEnd);
            const body = nameEnd === -1 ? "" : content.slice(nameEnd).trimStart();
            if (name.toLowerCase() === "xml") {
                const attributes = parseDeclarationAttributes(body);
                // eslint-disable-next-line functional/immutable-data
                document.declaration = Object.keys(attributes).length > 0 ? { attributes } : {};
            } else {
                append({ type: "instruction", name, instruction: body });
            }
            position = end + 2;
        } else if (text.startsWith("<!--", tagStart)) {
            const end = indexOfOrThrow("-->", tagStart + 4, "comment");
            const comment = text.slice(tagStart + 4, end);
            if (comment !== "") {
                append({ type: "comment", comment });
            }
            position = end + 3;
        } else if (text.startsWith("<![CDATA[", tagStart)) {
            const end = indexOfOrThrow("]]>", tagStart + 9, "CDATA section");
            const cdata = text.slice(tagStart + 9, end);
            if (cdata !== "") {
                append({ type: "cdata", cdata });
            }
            position = end + 3;
        } else if (text.startsWith("<!DOCTYPE", tagStart)) {
            // The DOCTYPE ends at the first ">" that isn't in its internal subset, between "[" and "]", or quoted
            let end = tagStart + 9;
            let quote: string | undefined;
            let inSubset = false;
            for (; end < text.length; end++) {
                const char = text[end];
                if (quote !== undefined) {
                    quote = char === quote ? undefined : quote;
                } else if (char === '"' || char === "'") {
                    quote = char;
                } else if (char === "[") {
                    inSubset = true;
                } else if (char === "]") {
                    inSubset = false;
                } else if (char === ">" && !inSubset) {
                    break;
                }
            }
            if (end === text.length) {
                throw new Error("Invalid XML: DOCTYPE that isn't closed");
            }
            append({ type: "doctype", doctype: text.slice(tagStart + 9, end).replace(/^ /, "") });
            position = end + 1;
        } else if (text.startsWith("</", tagStart)) {
            const end = indexOfOrThrow(">", tagStart + 2, "closing tag");
            const name = text.slice(tagStart + 2, end).trimEnd();
            // eslint-disable-next-line functional/immutable-data
            const element = open.pop();
            if (element?.name !== name) {
                throw new Error(`Invalid XML: closing tag </${name}> doesn't match <${element?.name ?? ""}>`);
            }
            position = end + 1;
        } else {
            position = parseStartTag(text, tagStart + 1, (element, selfClosing) => {
                append(element);
                if (!selfClosing) {
                    // eslint-disable-next-line functional/immutable-data
                    open.push(element);
                }
            });
        }
    }

    if (open.length > 0) {
        throw new Error(`Invalid XML: <${open[open.length - 1].name}> isn't closed`);
    }

    // xml-js gave the declaration before the nodes
    const { elements, ...rest } = document;
    return elements === undefined ? rest : { ...rest, elements };
};

/**
 * Reads a start tag from just after its "<", such as `w:p w14:paraId="1A2B3C4D">` or `w:br/>`.
 *
 * @returns The position just after the tag's ">"
 */
const parseStartTag = (text: string, from: number, onElement: (element: XmlElement, selfClosing: boolean) => void): number => {
    let nameEnd = from;
    while (nameEnd < text.length && !isWhitespace(text[nameEnd]) && text[nameEnd] !== "/" && text[nameEnd] !== ">") {
        nameEnd++;
    }
    const name = text.slice(from, nameEnd);
    if (name === "") {
        throw new Error("Invalid XML: tag without a name");
    }

    // Entries, not an object, so that an attribute such as __proto__ is one of them rather than the object's prototype
    // eslint-disable-next-line functional/prefer-readonly-type
    const attributes: (readonly [string, string])[] = [];
    let position = nameEnd;
    for (;;) {
        while (position < text.length && isWhitespace(text[position])) {
            position++;
        }
        if (position >= text.length) {
            throw new Error(`Invalid XML: <${name}> that isn't closed`);
        }
        if (text[position] === ">" || text.startsWith("/>", position)) {
            const selfClosing = text[position] === "/";
            onElement(
                {
                    type: "element",
                    name,
                    ...(attributes.length > 0 ? { attributes: Object.fromEntries(attributes) as XmlAttributes } : {}),
                },
                selfClosing,
            );
            return position + (selfClosing ? 2 : 1);
        }

        const equals = text.indexOf("=", position);
        const attributeName = text.slice(position, equals === -1 ? text.length : equals).trimEnd();
        if (equals === -1 || attributeName === "" || /[\s/>]/.test(attributeName)) {
            throw new Error(`Invalid XML: attribute of <${name}> without a value`);
        }
        let valueStart = equals + 1;
        while (valueStart < text.length && isWhitespace(text[valueStart])) {
            valueStart++;
        }
        const quote = text[valueStart];
        if (quote !== '"' && quote !== "'") {
            throw new Error(`Invalid XML: value of ${attributeName} on <${name}> isn't quoted`);
        }
        const valueEnd = text.indexOf(quote, valueStart + 1);
        if (valueEnd === -1) {
            throw new Error(`Invalid XML: value of ${attributeName} on <${name}> isn't closed`);
        }
        // Like xml-js, the first of attributes with the same name is kept
        if (!attributes.some(([existing]) => existing === attributeName)) {
            // eslint-disable-next-line functional/immutable-data
            attributes.push([attributeName, decodeEntities(text.slice(valueStart + 1, valueEnd))]);
        }
        position = valueEnd + 1;
    }
};
