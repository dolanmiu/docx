/**
 * Reads a .docx, parsed, into what its pages are laid out from, as `read-document.ts` reads a document being written: its
 * body, with its styles, lists, settings, headers, footers and notes, found through the relationships of its package.
 * It reads templates `patchDocument` has patched, and documents saved from Word.
 *
 * @module
 */
import type { Element } from "xml-js";

import { type XmlObject, attributesOf, childrenOf, find, readTextStyles, readThemeFonts } from "../text-layout";
import { type DocumentContent, type DocumentParts, type EmbeddedFont, type ReadOptions, facesOf, readContent } from "./read-document";

/** A relationship of a part to another part of the package */
type Relationship = {
    readonly id: string;
    /** The last part of its type, such as "styles" for `.../relationships/styles`, whether its type is transitional or strict */
    readonly type: string;
    /** The path of the part it refers to */
    readonly path: string;
};

// The part a package's main document is at when its relationships don't say
const DEFAULT_DOCUMENT = "word/document.xml";

/**
 * An element as xml-js parses it, formatted as docx formats elements: `{ "w:p": [{ _attr: {...} }, ...content] }`, with
 * text as strings.
 */
const formatted = (element: Element): unknown => {
    if (element.type === "text" || element.type === "cdata") {
        return String(element.type === "text" ? element.text : element.cdata);
    }
    return {
        [String(element.name)]: [
            ...(element.attributes === undefined ? [] : [{ _attr: element.attributes }]),
            ...(element.elements ?? []).filter(({ type }) => type === "element" || type === "text" || type === "cdata").map(formatted),
        ],
    };
};

/** The content of a formatted element: its attributes, the elements in it and its text */
const contentOf = (element: XmlObject): readonly unknown[] => Object.values(element)[0] as readonly unknown[];

/** The root element of a part, such as `w:document`, formatted */
const rootOf = (part: Element | undefined): XmlObject | undefined => {
    const root = part?.elements?.find(({ type }) => type === "element");
    return root && (formatted(root) as XmlObject);
};

// A part's folder, with its slash, such as "word/" for word/document.xml, or "" for a part at the package's root
const folderOf = (path: string): string => path.slice(0, path.lastIndexOf("/") + 1);

/**
 * The path of the part a relationship's target refers to: relative to the folder of the part the relationship belongs to,
 * or from the package's root if it starts with "/".
 */
const resolveTarget = (from: string, target: string): string =>
    (target.startsWith("/") ? target : `${folderOf(from)}${target}`)
        .split("/")
        .reduce<readonly string[]>((segments, segment) => {
            if (segment === "" || segment === ".") {
                return segments;
            }
            return segment === ".." ? segments.slice(0, -1) : [...segments, segment];
        }, [])
        .join("/");

/** The relationships of the part at the path to the other parts of the package, from its relationships part */
const relationshipsOf = (parts: ReadonlyMap<string, Element>, from: string): readonly Relationship[] => {
    const relationshipsPath = `${folderOf(from)}_rels/${from.slice(folderOf(from).length)}.rels`;
    const root = rootOf(parts.get(relationshipsPath));
    return childrenOf(root && contentOf(root))
        .filter((child) => "Relationship" in child)
        .flatMap((child) => {
            const { Id: id, Type: type, Target: target, TargetMode: mode } = attributesOf(child.Relationship);
            return typeof id !== "string" || typeof target !== "string" || mode === "External"
                ? []
                : [{ id, type: String(type).slice(String(type).lastIndexOf("/") + 1), path: resolveTarget(from, target) }];
        });
};

// The faces a font table embeds of a font, and whether each is bold and italic
const EMBEDDED_FACES = [
    ["w:embedRegular", false, false],
    ["w:embedBold", true, false],
    ["w:embedItalic", false, true],
    ["w:embedBoldItalic", true, true],
] as const;

/**
 * A font file as a document embeds it: its first 32 bytes mixed with the bytes of its key (`w:fontKey`), a GUID, from
 * the last to the first, as Word obfuscates the fonts it embeds, and docx does. Undefined for a key that isn't a GUID.
 */
const deobfuscated = (bytes: Uint8Array, fontKey: unknown): Uint8Array | undefined => {
    if (fontKey === undefined) {
        return bytes;
    }
    const digits = String(fontKey).replace(/[{}-]/g, "");
    if (!/^[0-9a-f]{32}$/i.test(digits)) {
        return undefined;
    }
    const key = Array.from({ length: 16 }, (_, index) => parseInt(digits.slice(30 - index * 2, 32 - index * 2), 16));
    // eslint-disable-next-line no-bitwise
    return bytes.map((byte, index) => (index < 32 ? byte ^ key[index % 16] : byte));
};

/**
 * The font files a document embeds, from its font table (`w:fonts`) and the files the table's relationships refer to.
 */
const embeddedFontsOf = (
    parts: ReadonlyMap<string, Element>,
    binaryParts: ReadonlyMap<string, Uint8Array>,
    fontTablePath: string,
): readonly EmbeddedFont[] => {
    const fontTable = rootOf(parts.get(fontTablePath));
    const relationships = relationshipsOf(parts, fontTablePath);
    return childrenOf(fontTable && contentOf(fontTable))
        .filter((child) => "w:font" in child)
        .flatMap((child) => {
            const name = attributesOf(child["w:font"])["w:name"];
            const faces = childrenOf(child["w:font"]);
            return EMBEDDED_FACES.flatMap(([element, bold, italic]) => {
                const { "r:id": id, "w:fontKey": fontKey } = attributesOf(find(faces, element));
                const path = relationships.find((relationship) => relationship.id === id)?.path;
                const bytes = path === undefined ? undefined : binaryParts.get(path);
                const data = bytes && deobfuscated(bytes, fontKey);
                return name === undefined || data === undefined ? [] : [{ name: String(name), data, bold, italic }];
            });
        });
};

/**
 * Reads a .docx's main document, with the parts it refers to.
 *
 * @param parts - The XML parts of its package, parsed by xml-js's `xml2js`, not compact and keeping the spaces between
 * elements, by their paths, such as "word/document.xml"
 * @param binaryParts - Its other parts, such as the fonts it embeds, by their paths
 * @param options - How it is read: to be laid out with a guess, or not
 */
export const readDocx = (
    parts: ReadonlyMap<string, Element>,
    binaryParts: ReadonlyMap<string, Uint8Array> = new Map(),
    options: ReadOptions = {},
): DocumentContent => {
    const documentPath = relationshipsOf(parts, "").find(({ type }) => type === "officeDocument")?.path ?? DEFAULT_DOCUMENT;
    const relationships = relationshipsOf(parts, documentPath);
    const partOf = (type: string): XmlObject | undefined => {
        const relationship = relationships.find((candidate) => candidate.type === type);
        return relationship && rootOf(parts.get(relationship.path));
    };
    const theme = partOf("theme");
    const fontTable = relationships.find((relationship) => relationship.type === "fontTable");
    const documentParts: DocumentParts = {
        styles: readTextStyles(partOf("styles") ?? { "w:styles": [] }, theme && readThemeFonts(theme)),
        numbering: partOf("numbering"),
        settings: partOf("settings"),
        headersAndFooters: new Map(
            relationships.flatMap(({ id, type, path }) => {
                const part = type === "header" || type === "footer" ? rootOf(parts.get(path)) : undefined;
                return part ? [[id, contentOf(part)] as const] : [];
            }),
        ),
        footnotes: partOf("footnotes"),
        endnotes: partOf("endnotes"),
        fonts: fontTable === undefined ? [] : facesOf(embeddedFontsOf(parts, binaryParts, fontTable.path)),
    };
    const document = rootOf(parts.get(documentPath));
    return readContent({ "w:body": find(childrenOf(document && contentOf(document)), "w:body") ?? [] }, documentParts, options);
};
