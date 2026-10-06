/**
 * Reads a .docx, parsed, into what its pages are laid out from, as `read-document.ts` reads a document being written: its
 * body, with its styles, lists, settings, headers, footers and notes, found through the relationships of its package.
 * It reads templates `patchDocument` has patched, and documents saved from Word.
 *
 * @module
 */
import type { Element } from "xml-js";

import { type XmlObject, attributesOf, childrenOf, find, readTextStyles, readThemeFonts, stringOf, withoutUndefined } from "../text-layout";
import type { DataStores } from "./bound-controls";
import { imageSizeOf } from "./image-sizes";
import { type DocxPackage, type DocxParts, type ImportedPart, type NotesPart, type PictureSizes, withImports } from "./imported-documents";
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
 * or from the package's root if it starts with "/". Backslashes, which some tools write, are read as slashes, as
 * patchDocument reads them.
 */
const resolveTarget = (from: string, target: string): string => {
    const normalized = target.replace(/\\/g, "/");
    return (normalized.startsWith("/") ? normalized : `${folderOf(from)}${normalized}`)
        .split("/")
        .reduce<readonly string[]>((segments, segment) => {
            if (segment === "" || segment === ".") {
                return segments;
            }
            return segment === ".." ? segments.slice(0, -1) : [...segments, segment];
        }, [])
        .join("/");
};

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

/** The content type of a part of a package, from its `[Content_Types].xml`: its own, or that of its extension */
const contentTypeOf = (parts: ReadonlyMap<string, Element>, path: string): string | undefined => {
    const root = rootOf(parts.get("[Content_Types].xml"));
    const types = childrenOf(root && contentOf(root)).map((child) => attributesOf(Object.values(child)[0]));
    const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
    const type =
        types.find(({ PartName: name }) => typeof name === "string" && name.replace(/^\//, "").toLowerCase() === path.toLowerCase()) ??
        types.find(({ Extension: other, PartName: name }) => name === undefined && String(other).toLowerCase() === extension);
    return stringOf(type?.ContentType);
};

/**
 * Reads a .docx's package into the parts of its main document the layout reads, formatted, with the documents each of
 * them imports.
 */
const readParts = (docx: DocxPackage): DocxParts => {
    const { parts, binaryParts = new Map(), importedDocuments = new Map() } = docx;
    const documentPath = relationshipsOf(parts, "").find(({ type }) => type === "officeDocument")?.path ?? DEFAULT_DOCUMENT;
    const relationships = relationshipsOf(parts, documentPath);
    const pathOf = (type: string): string | undefined => relationships.find((candidate) => candidate.type === type)?.path;
    const partOf = (type: string): XmlObject | undefined => {
        const path = pathOf(type);
        return path === undefined ? undefined : rootOf(parts.get(path));
    };
    /** The documents a part imports, by the ids of its relationships to them */
    const importsOf = (path: string): ReadonlyMap<string, ImportedPart> =>
        new Map(
            relationshipsOf(parts, path)
                .filter(({ type }) => type === "aFChunk")
                .map(({ id, path: target }) => {
                    const imported = importedDocuments.get(target);
                    return [
                        id,
                        withoutUndefined({
                            contentType: contentTypeOf(parts, target),
                            document: imported && readParts(imported),
                            data: binaryParts.get(target),
                        }),
                    ] as const;
                }),
        );
    /** The sizes of the images a part refers to, by the ids of its relationships to them, read from their files */
    const picturesOf = (path: string): PictureSizes =>
        new Map(
            relationshipsOf(parts, path)
                .filter(({ type }) => type === "image")
                .flatMap(({ id, path: target }) => {
                    const data = binaryParts.get(target);
                    return data === undefined ? [] : [[id, imageSizeOf(data)] as const];
                }),
        );
    const fontTable = pathOf("fontTable");
    const headersAndFooters = relationships.filter(({ type }) => type === "header" || type === "footer");
    const document = rootOf(parts.get(documentPath));
    const notes = (type: string): NotesPart | undefined => {
        const path = pathOf(type);
        const root = path === undefined ? undefined : rootOf(parts.get(path));
        return root && path !== undefined ? { notes: root, imports: importsOf(path), pictures: picturesOf(path) } : undefined;
    };
    return withoutUndefined({
        body: {
            content: childrenOf(find(childrenOf(document && contentOf(document)), "w:body")),
            imports: importsOf(documentPath),
            pictures: picturesOf(documentPath),
        },
        styles: partOf("styles"),
        theme: partOf("theme"),
        numbering: partOf("numbering"),
        settings: partOf("settings"),
        webSettings: partOf("webSettings"),
        headersAndFooters: new Map(
            headersAndFooters.flatMap(({ id, path }) => {
                const part = rootOf(parts.get(path));
                return part ? [[id, { content: contentOf(part), imports: importsOf(path), pictures: picturesOf(path) }] as const] : [];
            }),
        ),
        footnotes: notes("footnotes"),
        endnotes: notes("endnotes"),
        fonts: fontTable === undefined ? [] : facesOf(embeddedFontsOf(parts, binaryParts, fontTable)),
    });
};

// The ids Word gives a package's core and extended properties, as stores of data a content control can be bound to
// (`w:storeItemID`), as a custom XML part has its own (`ds:itemID`)
const PROPERTY_STORES: readonly (readonly [string, string])[] = [
    ["core-properties", "{6C3C8BC8-F283-45AE-878A-BAB7291924A1}"],
    ["extended-properties", "{6668398D-A668-4E3E-A5EB-62B293D839F1}"],
];

/**
 * The stores of data a package's content controls can be bound to, by their ids in capitals: its core and extended
 * properties, and the custom XML parts of its main document, by the ids their properties' parts give them
 */
const dataStoresOf = (parts: ReadonlyMap<string, Element>, documentPath: string): DataStores => {
    const properties = PROPERTY_STORES.flatMap(([type, id]) => {
        const path = relationshipsOf(parts, "").find((relationship) => relationship.type === type)?.path;
        const root = path === undefined ? undefined : rootOf(parts.get(path));
        return root ? [[id, root] as const] : [];
    });
    const custom = relationshipsOf(parts, documentPath)
        .filter(({ type }) => type === "customXml")
        .flatMap(({ path }) => {
            const root = rootOf(parts.get(path));
            const itemProperties = relationshipsOf(parts, path).find(({ type }) => type === "customXmlProps");
            const item = itemProperties && rootOf(parts.get(itemProperties.path));
            const id = Object.entries(attributesOf(item && Object.values(item)[0])).find(([name]) => /(^|:)itemID$/.test(name))?.[1];
            return root && id !== undefined ? [[String(id).toUpperCase(), root] as const] : [];
        });
    return new Map([...properties, ...custom]);
};

/**
 * Reads a .docx's main document, with the parts it refers to, and the documents it imports (`w:altChunk`) as Word turns
 * them into its own paragraphs and tables when it opens it (see `imported-documents.ts`).
 *
 * @param parts - The XML parts of its package, parsed by xml-js's `xml2js`, not compact and keeping the spaces between
 * elements, by their paths, such as "word/document.xml"
 * @param binaryParts - Its other parts, such as the fonts it embeds, by their paths
 * @param options - How it is read: to be laid out with a guess, or not
 * @param importedDocuments - The .docx files it imports, by their paths, each read as it is
 */
export const readDocx = (
    parts: ReadonlyMap<string, Element>,
    binaryParts: ReadonlyMap<string, Uint8Array> = new Map(),
    options: ReadOptions = {},
    importedDocuments: ReadonlyMap<string, DocxPackage> = new Map(),
): DocumentContent => {
    const read = withImports(readParts({ parts, binaryParts, importedDocuments }));
    const documentPath = relationshipsOf(parts, "").find(({ type }) => type === "officeDocument")?.path ?? DEFAULT_DOCUMENT;
    const documentParts: DocumentParts = {
        styles: readTextStyles(read.styles ?? { "w:styles": [] }, read.theme && readThemeFonts(read.theme)),
        numbering: read.numbering,
        settings: read.settings,
        webSettings: read.webSettings,
        headersAndFooters: new Map([...read.headersAndFooters].map(([id, { content }]) => [id, content])),
        footnotes: read.footnotes?.notes,
        endnotes: read.endnotes?.notes,
        fonts: read.fonts,
        dataStores: dataStoresOf(parts, documentPath),
        pictures: withoutUndefined({
            body: read.body.pictures,
            headersAndFooters: new Map([...read.headersAndFooters].map(([id, { pictures }]) => [id, pictures])),
            footnotes: read.footnotes?.pictures,
            endnotes: read.endnotes?.pictures,
        }),
    };
    return readContent({ "w:body": read.body.content }, documentParts, options);
};
