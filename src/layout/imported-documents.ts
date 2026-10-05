/**
 * The documents a .docx imports (`w:altChunk`): parts of its package in another format, most often another .docx, which
 * Word turns into paragraphs and tables of the document's own when it opens it, and saves in their place. An imported
 * .docx is turned into the document's own here as Word turns it, before the document is read, so it is laid out as Word
 * lays it out (`scripts/layout-probes/word-imported-documents.ts`):
 *
 * - its body goes where `w:altChunk` is, in the body, a table cell, a header or a note, without its section's properties,
 *   and with an empty paragraph at its end when it doesn't end with one, as Word gives every document (AC1, AC2, AC4a, AC7,
 *   AC9, AC10). An imported document of several sections stops, as Word lays it out in ways not yet followed (AC4b)
 * - a style of the same type and name as one of the document's, whatever its id and the case of its name, is the
 *   document's, and the document's defaults, theme and settings are the document's (AC3, AC16). A style only the
 *   imported document has keeps how it looks there, with new ids where the document has its ids (AC3f): a paragraph
 *   style with the styles it is based on there and the imported document's defaults (AC3d, AS1, AS2, AS4), and Word's
 *   own font and size, Times New Roman 10, where those give none (`stops2/word-stops-imported.ts` IM3), a character
 *   style with only what it and the character styles it is based on give (AS3), and a table style based on the
 *   document's styles of the names of those it is based on (AS6). Paragraphs and tables of no style are in the imported
 *   document's default style, the document's of its name or one added (AS5)
 * - one whose formatting is kept as it is (`w:matchSrc`) keeps its paragraph and character styles of the document's
 *   names too, as styles only it has, but its table styles of the document's names, such as Normal Table, are the
 *   document's, and so is its theme, and Word gives its last paragraph none of its space after (AC3g, AS7 to AS9, IM2)
 * - its lists are lists of their own, numbered from their own start, and its notes are numbered with the document's
 *   (AC5, AC6)
 * - a bookmark of a name the document has is the document's, wherever it is (AC11a, AC11b). A bookmark of a name two
 *   imported documents have is left out of both, as which Word keeps isn't known
 * - a .docx it imports is turned into its own first (AC12)
 *
 * Those that aren't followed are left for the layout to stop at, with why: a document in another format, such as HTML or
 * plain text, which Word converts its own way (AC8); one with a style of its own whose defaults leave out some of the
 * document's other than its font and size, or its spacing and indents where they are Word's own, and East Asian or
 * right-to-left text in one whose styles give no font, and one whose formatting is kept that ends in a paragraph of a
 * content control or custom XML, which Word's PDFs haven't shown; and one with a page reference or number of pages, whose
 * number docx can't write in it.
 *
 * @module
 */
import type { Element } from "xml-js";

import {
    type FontFace,
    type XmlObject,
    attributesOf,
    childrenOf,
    find,
    isEastAsian,
    isObject,
    stringOf,
    withoutUndefined,
} from "../text-layout";

/** A .docx's package: its XML parts, parsed, its other parts, and the .docx files it imports, read the same way */
export type DocxPackage = {
    readonly parts: ReadonlyMap<string, Element>;
    readonly binaryParts?: ReadonlyMap<string, Uint8Array>;
    readonly importedDocuments?: ReadonlyMap<string, DocxPackage>;
};

/** A part a part of a document imports */
export type ImportedPart = {
    /** Its content type, which says what format it is in */
    readonly contentType?: string;
    /** It read, when it is a .docx that could be */
    readonly document?: DocxParts;
};

/** The content of a part of a document, formatted, with what it imports, by the ids of its relationships to them */
export type ContentPart = { readonly content: readonly unknown[]; readonly imports: ReadonlyMap<string, ImportedPart> };

/** A document's footnotes or endnotes (`w:footnotes`, `w:endnotes`), formatted, with what they import */
export type NotesPart = { readonly notes: XmlObject; readonly imports: ReadonlyMap<string, ImportedPart> };

/** The parts of a .docx the layout reads, formatted as docx formats elements */
export type DocxParts = {
    /** The content of its body (`w:body`) */
    readonly body: ContentPart;
    readonly styles?: XmlObject;
    readonly theme?: XmlObject;
    readonly numbering?: XmlObject;
    readonly settings?: XmlObject;
    /** The content of each header and footer, by the id of the relationship to it */
    readonly headersAndFooters: ReadonlyMap<string, ContentPart>;
    readonly footnotes?: NotesPart;
    readonly endnotes?: NotesPart;
    readonly fonts: readonly FontFace[];
};

const nameOf = (element: XmlObject): string => Object.keys(element)[0];
const contentOf = (element: XmlObject): readonly unknown[] => {
    const [content] = Object.values(element);
    return Array.isArray(content) ? content : [];
};

// The content types of a .docx, as a document and as a template, with and without macros
const DOCX_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml",
    "application/vnd.ms-word.document.macroEnabled.main+xml",
    "application/vnd.ms-word.template.macroEnabledTemplate.main+xml",
]);

// The formats Word imports other than .docx, which it converts its own way, by their content types
const OTHER_FORMATS: readonly (readonly [RegExp, string])[] = [
    [/^(text\/html|application\/xhtml\+xml)$/, "HTML"],
    [/^(application|text)\/rtf$/, "RTF"],
    [/^message\/rfc822$/, "MHT"],
    [/^text\/plain$/, "plain text"],
    [/^(application|text)\/xml$/, "XML"],
];

/** Why an imported part that isn't turned into the document's own can't be laid out */
const reasonOf = (imported: ImportedPart | undefined): string => {
    const contentType = imported?.contentType?.toLowerCase().split(";")[0].trim() ?? "";
    if (imported === undefined || DOCX_TYPES.has(contentType)) {
        return "an imported document that can't be read";
    }
    const format = OTHER_FORMATS.find(([type]) => type.test(contentType))?.[1];
    return format === undefined ? "an imported document in a format not yet followed" : `an imported document in ${format}`;
};

/**
 * Content with each `w:altChunk` in it, and in its tables, content controls and notes, replaced by what Word turns the
 * part it imports into, or, where that isn't followed, by itself with why (`reason`), which the layout stops at.
 */
const replaceImports = (
    content: readonly unknown[],
    imports: ReadonlyMap<string, ImportedPart>,
    turn: (imported: ImportedPart, element: XmlObject) => readonly unknown[] | string,
): readonly unknown[] =>
    content.flatMap((element) => {
        if (!isObject(element)) {
            return [element];
        }
        const name = nameOf(element);
        if (name === "w:altChunk") {
            const imported = imports.get(String(attributesOf(element[name])["r:id"]));
            const turned = imported?.document === undefined ? reasonOf(imported) : turn(imported, element);
            return typeof turned === "string" ? [{ [name]: [{ _attr: { ...attributesOf(element[name]), reason: turned } }] }] : turned;
        }
        return name === "_attr" || name === "w:p" ? [element] : [{ [name]: replaceImports(contentOf(element), imports, turn) }];
    });

/** The elements among content, and in them, that satisfy a test, in order */
const elementsIn = (content: readonly unknown[], test: (element: XmlObject) => boolean): readonly XmlObject[] =>
    content.filter(isObject).flatMap((element) => [...(test(element) ? [element] : []), ...elementsIn(contentOf(element), test)]);

/** The names of the bookmarks that start in content */
const bookmarksIn = (content: readonly unknown[]): readonly string[] =>
    elementsIn(content, (element) => "w:bookmarkStart" in element).flatMap((element) => {
        const name = stringOf(attributesOf(element["w:bookmarkStart"])["w:name"]);
        return name === undefined ? [] : [name];
    });

/** Content without the bookmarks of these names, and their ends */
const withoutBookmarks = (content: readonly unknown[], names: ReadonlySet<string>): readonly unknown[] => {
    const isLeftOut = (element: XmlObject): boolean =>
        "w:bookmarkStart" in element && names.has(String(attributesOf(element["w:bookmarkStart"])["w:name"]));
    const ids = new Set(elementsIn(content, isLeftOut).map((element) => String(attributesOf(element["w:bookmarkStart"])["w:id"])));
    const without = (elements: readonly unknown[]): readonly unknown[] =>
        elements.flatMap((element) => {
            if (!isObject(element)) {
                return [element];
            }
            const name = nameOf(element);
            if (isLeftOut(element) || (name === "w:bookmarkEnd" && ids.has(String(attributesOf(element[name])["w:id"])))) {
                return [];
            }
            return name === "_attr" ? [element] : [{ [name]: without(contentOf(element)) }];
        });
    return ids.size === 0 ? content : without(content);
};

// A field whose result is a page's number or a number of pages, which docx writes once the pages are laid out, and can't
// write in an imported document, whose fields Word shows as they are written
const PAGE_FIELD = /^\s*(PAGEREF|NUMPAGES|SECTIONPAGES)\b/i;

/** Whether content has a page reference or number of pages, as a field of runs or a simple field */
const hasPageField = (content: readonly unknown[]): boolean =>
    elementsIn(content, (element) => {
        const name = nameOf(element);
        const instruction =
            name === "w:fldSimple"
                ? String(attributesOf(element[name])["w:instr"])
                : contentOf(element)
                      .filter((text) => typeof text === "string")
                      .join("");
        return (name === "w:fldSimple" || name === "w:instrText") && PAGE_FIELD.test(instruction);
    }).length > 0;

/** New ids for the ids of an imported document's styles, lists or notes, by its ids */
type Ids = ReadonlyMap<string, string>;

/** The new ids of what an imported document's content refers to by id, in the document it is put into */
type Renames = {
    readonly styles: Ids;
    readonly lists: Ids;
    readonly footnotes: Ids;
    readonly endnotes: Ids;
};

// The attributes that refer to each kind of thing by its id, by the elements they are on
const REFERENCES: Readonly<Record<string, readonly [string, keyof Renames]>> = {
    "w:pStyle": ["w:val", "styles"],
    "w:rStyle": ["w:val", "styles"],
    "w:tblStyle": ["w:val", "styles"],
    "w:basedOn": ["w:val", "styles"],
    "w:next": ["w:val", "styles"],
    "w:link": ["w:val", "styles"],
    "w:numStyleLink": ["w:val", "styles"],
    "w:styleLink": ["w:val", "styles"],
    "w:numId": ["w:val", "lists"],
    "w:footnoteReference": ["w:id", "footnotes"],
    "w:endnoteReference": ["w:id", "endnotes"],
};

/** Content with what it refers to by id renamed */
const renamed = (content: readonly unknown[], renames: Renames): readonly unknown[] =>
    content.map((element) => {
        if (!isObject(element)) {
            return element;
        }
        const name = nameOf(element);
        if (name === "_attr") {
            return element;
        }
        const reference = REFERENCES[name];
        const children = contentOf(element).map((child) => {
            if (reference === undefined || !isObject(child) || !("_attr" in child)) {
                return child;
            }
            const [attribute, kind] = reference;
            const id = renames[kind].get(String(attributesOf(child)[attribute]));
            return id === undefined ? child : { _attr: { ...attributesOf(child), [attribute]: id } };
        });
        return { [name]: renamed(children, renames) };
    });

/** An id not among those taken: the one given if it isn't, or else it with the lowest number after it that isn't */
const freeId = (id: string, taken: ReadonlySet<string>): string => {
    let free = id;
    for (let count = 1; taken.has(free); count++) {
        free = `${id}${count}`;
    }
    return free;
};

/** The elements of a name in a part's root, such as the `w:style` elements of `w:styles` */
const elementsOf = (root: XmlObject | undefined, name: string): readonly XmlObject[] =>
    childrenOf(root && Object.values(root)[0]).filter((child) => name in child);

/** A part's root with elements added at its end */
const withAdded = (root: XmlObject, added: readonly XmlObject[]): XmlObject => ({ [nameOf(root)]: [...contentOf(root), ...added] });

/** An element with new values of its attributes, and without those given as undefined */
const withAttributes = (element: XmlObject, attributes: Readonly<Record<string, string | undefined>>): XmlObject => {
    const name = nameOf(element);
    const all = Object.entries({ ...attributesOf(element[name]), ...attributes }).filter(([, value]) => value !== undefined);
    return { [name]: [{ _attr: Object.fromEntries(all) }, ...childrenOf(element[name]).filter((child) => !("_attr" in child))] };
};

type Style = {
    readonly id: string;
    readonly element: XmlObject;
    /** A paragraph style for one without a type, as Word takes it */
    readonly type: string;
    /** Its type and name, which Word knows it by, whatever its name's case (AC3k) */
    readonly key?: string;
    readonly basedOn?: string;
    /** Whether it is its type's default, which paragraphs or tables that name no style are in */
    readonly isDefault: boolean;
};

/** A part's styles */
const stylesOf = (root: XmlObject | undefined): readonly Style[] =>
    elementsOf(root, "w:style").flatMap((element) => {
        const attributes = attributesOf(element["w:style"]);
        const id = stringOf(attributes["w:styleId"]);
        const children = childrenOf(element["w:style"]);
        const name = stringOf(attributesOf(find(children, "w:name"))["w:val"]);
        const type = stringOf(attributes["w:type"]) ?? "paragraph";
        const basedOn = stringOf(attributesOf(find(children, "w:basedOn"))["w:val"]);
        const isDefault = attributes["w:default"] !== undefined && !["0", "false", "off"].includes(String(attributes["w:default"]));
        return id === undefined
            ? []
            : [{ id, element, type, key: name === undefined ? undefined : `${type} ${name.toLowerCase()}`, basedOn, isDefault }];
    });

/** The properties a document's defaults (`w:docDefaults`) give paragraphs or runs: their element, `w:pPr` or `w:rPr` */
const defaultsOf = (root: XmlObject | undefined, kind: "w:pPr" | "w:rPr"): readonly XmlObject[] =>
    childrenOf(find(childrenOf(find(childrenOf(find(elementsOf(root, "w:docDefaults"), "w:docDefaults")), `${kind}Default`)), kind));

/**
 * What a document's defaults give, each named by its element, and the spacing and indents by each of their attributes,
 * which a document may give some of
 */
const defaultKeysOf = (root: XmlObject | undefined): ReadonlySet<string> =>
    new Set(
        [...defaultsOf(root, "w:pPr"), ...defaultsOf(root, "w:rPr")].flatMap((element) => {
            const name = nameOf(element);
            return name === "w:spacing" || name === "w:ind"
                ? Object.keys(attributesOf(element[name])).map((attribute) => `${name} ${attribute}`)
                : [name];
        }),
    );

// What Word gives a document whose defaults leave out its text's font or size: Times New Roman 10, as it gave the
// paragraphs of an imported document's own style, based on its defaults of neither, where the document's are Calibri 11
// (scripts/layout-probes/stops2/word-stops-imported.ts IM3a, IM3b: lines of 230 twips)
const BUILT_IN_RUN: Readonly<Record<string, XmlObject>> = {
    "w:rFonts": { "w:rFonts": [{ _attr: { "w:ascii": "Times New Roman", "w:hAnsi": "Times New Roman" } }] },
    "w:sz": { "w:sz": [{ _attr: { "w:val": 20 } }] },
    "w:szCs": { "w:szCs": [{ _attr: { "w:val": 20 } }] },
};
// Word's spacing and indents where a document gives none: nothing before or after a paragraph, single lines, no indent
const BUILT_IN_PARAGRAPH: Readonly<Record<string, string>> = {
    "w:spacing w:before": "0",
    "w:spacing w:after": "0",
    "w:spacing w:line": "240",
    "w:spacing w:lineRule": "auto",
    "w:ind w:left": "0",
    "w:ind w:start": "0",
    "w:ind w:right": "0",
    "w:ind w:end": "0",
    "w:ind w:firstLine": "0",
    "w:ind w:hanging": "0",
};

/** The value of a key of {@link defaultKeysOf} in a document's defaults: an attribute of its spacing or indents */
const defaultValueOf = (root: XmlObject | undefined, key: string): string | undefined => {
    const [name, attribute] = key.split(" ");
    return stringOf(attributesOf(find(defaultsOf(root, "w:pPr"), name))[attribute]);
};

/** An imported document's styles put into a document's: those added, and the ids its paragraphs and tables refer to */
type MergedStyles = {
    readonly added: readonly XmlObject[];
    readonly ids: Ids;
    /** The style that paragraphs, or tables, of no style of their own are in, where it isn't the document's default */
    readonly defaults: { readonly paragraph?: string; readonly table?: string };
    /** Why its styles can't be put in as Word puts them, where they can't */
    readonly unsupported?: string;
    /** Whether the styles added give its Latin text Word's own font, as the imported document's defaults give none */
    readonly ownFont?: boolean;
};

/**
 * The styles of an imported document, put into a document's. Each of the same type and name as one of the document's is
 * the document's (AC3), and the others are added, with new ids where the document has their ids (AC3f), looking as they
 * do in the imported document: a paragraph style with the styles it is based on there and its defaults, whatever the
 * document's of their names (AC3d, AS1, AS2, AS4), a character style with those it is based on there (AS3), and a table
 * style based on the document's of the names of those it is based on (AS6). Those added for others to be based on aren't
 * any type's default, nor are those added, and paragraphs and tables of no style of their own are in the imported
 * document's default, added or not (AS5). With its formatting kept (`keep`), its paragraph and character styles are all
 * added so, those of the document's names too, and only its table styles of the document's names are the document's:
 * Times New Roman 14 with 240 after in its Normal is kept, and so is its Heading 1 of 20 points where the document's is
 * 16, but its Normal Table's cells of no margins are the document's of 108 (word-imported-styles.docx AS7, AS9,
 * stops2/word-stops-imported.ts IM2a, IM2d).
 */
const mergeStyles = (into: XmlObject | undefined, imported: XmlObject | undefined, keep = false): MergedStyles => {
    const own = stylesOf(into);
    // The first of a name, as one added for an imported document may have the name of one before it
    const keys = own.flatMap(({ key, id }) => (key === undefined ? [] : [[key, id] as const]));
    const byKey = new Map(keys.filter(([key], index) => keys.findIndex(([other]) => other === key) === index));
    const theirs = stylesOf(imported);
    const byId = new Map(theirs.map((style) => [style.id, style]));
    const matched = new Map(
        theirs.flatMap(({ id, key, type }) =>
            key !== undefined && byKey.has(key) && (!keep || type === "table") ? [[id, byKey.get(key)!] as const] : [],
        ),
    );
    // The styles added: those the document doesn't have, and those they are based on, as far as a style based on one
    // before it, or on none, or, for a table style, on one the document has
    const chainOf = (id: string | undefined, seen: readonly string[]): readonly string[] => {
        const style = id === undefined ? undefined : byId.get(id);
        return style === undefined || seen.includes(style.id) || (style.type === "table" && matched.has(style.id))
            ? seen
            : chainOf(style.basedOn, [...seen, style.id]);
    };
    const kept = new Set(theirs.filter((style) => !matched.has(style.id)).flatMap(({ id }) => chainOf(id, [])));
    const keptParagraphs = theirs.filter(({ id, type }) => kept.has(id) && type === "paragraph");
    // The paragraph styles added are based on the imported document's defaults, as a style of their own, as they look
    // as they do there, and where those leave out the document's font or size, or its spacing or indents of other than
    // Word's own, Word's own (IM3a, IM3b). Where they leave out something else, it isn't known
    const ownDefaults = defaultKeysOf(into);
    const theirDefaults = defaultKeysOf(imported);
    const leftOut = [...ownDefaults].filter((key) => !theirDefaults.has(key));
    if (
        keptParagraphs.length > 0 &&
        leftOut.some(
            (key) => !(key in BUILT_IN_RUN) && (!(key in BUILT_IN_PARAGRAPH) || defaultValueOf(into, key) !== BUILT_IN_PARAGRAPH[key]),
        )
    ) {
        return {
            added: [],
            ids: new Map(),
            defaults: {},
            unsupported: "a style of an imported document's own, where its defaults leave out some of the document's",
        };
    }
    const taken = [...own.map((style) => style.id), ...theirs.filter(({ id }) => kept.has(id)).map(({ id }) => id)];
    const defaultsId = freeId("ImportedDefaults", new Set(taken));
    // Each with an id the document doesn't have, nor those added before it
    const keptIds = [...kept].reduce<ReadonlyMap<string, string>>(
        (before, id) => new Map([...before, [id, freeId(id, new Set([...own.map((style) => style.id), defaultsId, ...before.values()]))]]),
        new Map(),
    );
    // What refers to a style refers to the document's, or to the one added
    const ids = new Map(theirs.map(({ id }) => [id, matched.get(id) ?? keptIds.get(id)!] as const));
    // Based on the styles added, rather than the document's of their names
    const bases = new Map([...ids, ...keptIds]);
    const added = theirs
        .filter(({ id }) => kept.has(id))
        .map(({ id, element, type, basedOn }) => {
            const style = withAttributes(element, { "w:styleId": keptIds.get(id), "w:default": undefined });
            const children = contentOf(style).filter(
                // One added only for others to be based on, as the document has a style of its name, has no name, so the
                // documents imported after it don't take it for the document's
                (child) =>
                    !isObject(child) ||
                    !(
                        ("w:name" in child && matched.has(id)) ||
                        ("w:basedOn" in child && type === "paragraph" && !kept.has(String(basedOn)))
                    ),
            );
            // A paragraph style based on no other added is based on the imported document's defaults
            const based =
                type === "paragraph" && !kept.has(String(basedOn))
                    ? [...children, { "w:basedOn": [{ _attr: { "w:val": defaultsId } }] }]
                    : children;
            return renamed([{ "w:style": based }], {
                styles: bases,
                lists: new Map(),
                footnotes: new Map(),
                endnotes: new Map(),
            })[0] as XmlObject;
        });
    const defaults =
        keptParagraphs.length === 0
            ? []
            : [
                  {
                      "w:style": [
                          { _attr: { "w:type": "paragraph", "w:styleId": defaultsId } },
                          { "w:pPr": defaultsOf(imported, "w:pPr") },
                          {
                              "w:rPr": [
                                  ...defaultsOf(imported, "w:rPr"),
                                  ...leftOut.flatMap((key) => (key in BUILT_IN_RUN ? [BUILT_IN_RUN[key]] : [])),
                              ],
                          },
                      ],
                  },
              ];
    /** The id of the imported document's default style of a type, where paragraphs or tables of no style are in another than the document's */
    const defaultOf = (type: string): string | undefined => {
        const theirsDefault = theirs.find((style) => style.type === type && style.isDefault);
        const id = theirsDefault && ids.get(theirsDefault.id);
        return id === own.find((style) => style.type === type && style.isDefault)?.id ? undefined : id;
    };
    return {
        added: [...defaults, ...added],
        ids,
        defaults: withoutUndefined({ paragraph: defaultOf("paragraph"), table: defaultOf("table") }),
        ...(keptParagraphs.length > 0 && leftOut.includes("w:rFonts") ? { ownFont: true } : {}),
    };
};

/** Content whose paragraphs and tables of no style of their own are in these */
const withDefaultStyles = (content: readonly unknown[], defaults: MergedStyles["defaults"]): readonly unknown[] => {
    const styled = (element: XmlObject, properties: string, styleElement: string, id: string | undefined): XmlObject => {
        const name = nameOf(element);
        const children = contentOf(element);
        const given = children.find((child) => isObject(child) && properties in child) as XmlObject | undefined;
        if (id === undefined || (given !== undefined && find(childrenOf(given[properties]), styleElement) !== undefined)) {
            return element;
        }
        const style = { [styleElement]: [{ _attr: { "w:val": id } }] };
        return {
            [name]:
                given === undefined
                    ? [{ [properties]: [style] }, ...children]
                    : children.map((child) => (child === given ? { [properties]: [style, ...contentOf(given)] } : child)),
        };
    };
    return content.map((element) => {
        if (!isObject(element)) {
            return element;
        }
        const name = nameOf(element);
        if (name === "w:p") {
            return styled(element, "w:pPr", "w:pStyle", defaults.paragraph);
        }
        const inner = name === "_attr" ? element : { [name]: withDefaultStyles(contentOf(element), defaults) };
        return name === "w:tbl" ? styled(inner, "w:tblPr", "w:tblStyle", defaults.table) : inner;
    });
};

/** Content whose last paragraph has no space after it, whatever its style gives it */
const withNoSpaceAfter = (content: readonly unknown[]): readonly unknown[] => {
    const at = content.findLastIndex((element) => isObject(element) && nameOf(element) === "w:p");
    const paragraph = content[at] as XmlObject;
    const children = contentOf(paragraph);
    const properties = children.find((child) => isObject(child) && "w:pPr" in child) as XmlObject | undefined;
    const ownProperties = childrenOf(properties?.["w:pPr"]);
    const given = attributesOf(ownProperties.find((child) => "w:spacing" in child)?.["w:spacing"]);
    const spacing = { "w:spacing": [{ _attr: { ...given, "w:after": 0, "w:afterAutospacing": 0 } }] };
    const spaced = {
        "w:p": [
            { "w:pPr": [...ownProperties.filter((child) => !("w:spacing" in child)), spacing] },
            ...children.filter((child) => child !== properties),
        ],
    };
    return [...content.slice(0, at), spaced, ...content.slice(at + 1)];
};

/** The numbers an attribute gives elements of a part's root, such as each list's `w:numId` */
const numbersOf = (root: XmlObject | undefined, name: string, attribute: string): readonly number[] =>
    elementsOf(root, name)
        .map((element) => Number(attributesOf(element[name])[attribute]))
        .filter(Number.isFinite);

/** Elements given new numbers by an attribute, from one past the highest of those taken, in order */
const renumbered = (
    elements: readonly XmlObject[],
    attribute: string,
    taken: readonly number[],
): { readonly elements: readonly XmlObject[]; readonly ids: Ids } => {
    const first = Math.max(0, ...taken) + 1;
    const ids = new Map(
        elements.map((element, index) => [String(attributesOf(Object.values(element)[0])[attribute]), String(first + index)]),
    );
    return {
        elements: elements.map((element) =>
            withAttributes(element, { [attribute]: ids.get(String(attributesOf(Object.values(element)[0])[attribute])) }),
        ),
        ids,
    };
};

/**
 * The lists of an imported document, put into a document's: its definitions (`w:abstractNum`) and lists (`w:num`), each
 * with a new number after the document's own, so they are lists of their own (AC5)
 */
const mergeLists = (
    into: XmlObject | undefined,
    imported: XmlObject | undefined,
): { readonly added: readonly XmlObject[]; readonly ids: Ids } => {
    const definitions = renumbered(
        elementsOf(imported, "w:abstractNum"),
        "w:abstractNumId",
        numbersOf(into, "w:abstractNum", "w:abstractNumId"),
    );
    const lists = renumbered(elementsOf(imported, "w:num"), "w:numId", numbersOf(into, "w:num", "w:numId"));
    // Each list refers to its definition by its new number
    const withDefinitions = lists.elements.map((list) => ({
        "w:num": contentOf(list).map((child) =>
            isObject(child) && "w:abstractNumId" in child
                ? withAttributes(child, { "w:val": definitions.ids.get(String(attributesOf(child["w:abstractNumId"])["w:val"])) })
                : child,
        ),
    }));
    return { added: [...definitions.elements, ...withDefinitions], ids: lists.ids };
};

// The notes Word lays out above notes, rather than as notes
const SEPARATORS = new Set(["separator", "continuationSeparator", "continuationNotice"]);

/** The footnotes or endnotes of an imported document, each with a new id after the document's own (AC6) */
const mergeNotes = (
    into: XmlObject | undefined,
    imported: XmlObject | undefined,
    name: "w:footnote" | "w:endnote",
): { readonly elements: readonly XmlObject[]; readonly ids: Ids } =>
    renumbered(
        elementsOf(imported, name).filter((note) => !SEPARATORS.has(String(attributesOf(note[name])["w:type"]))),
        "w:id",
        numbersOf(into, name, "w:id"),
    );

/** The block-level elements Word lays out as a paragraph or a table, which a document's body ends with */
const lastBlockOf = (content: readonly unknown[]): XmlObject | undefined => {
    const blocks = content.filter(isObject).filter((element) => ["w:p", "w:tbl", "w:sdt", "w:customXml"].includes(nameOf(element)));
    const last = blocks[blocks.length - 1];
    if (last === undefined || nameOf(last) === "w:p" || nameOf(last) === "w:tbl") {
        return last;
    }
    // A content control's or custom XML's last block, which may hold none
    return lastBlockOf(nameOf(last) === "w:sdt" ? childrenOf(find(childrenOf(last["w:sdt"]), "w:sdtContent")) : contentOf(last));
};

/** Whether a part imports anything */
const importsAnything = (part: { readonly imports: ReadonlyMap<string, ImportedPart> } | undefined): boolean =>
    part !== undefined && part.imports.size > 0;

/** Notes added to a document's, and the imported document's separators, for a document that has no notes of its own */
type AddedNotes = { readonly separators: readonly XmlObject[]; readonly notes: readonly XmlObject[] };

/**
 * A .docx's parts with the documents they import turned into their own paragraphs and tables, as Word turns them when it
 * opens the document, and those not followed left in place with why the layout stops at them.
 */
export const withImports = (parts: DocxParts): DocxParts => {
    const contentParts = [parts.body, ...parts.headersAndFooters.values()];
    const notesParts = [parts.footnotes, parts.endnotes].filter((part): part is NotesPart => part !== undefined);
    if (![...contentParts, ...notesParts].some(importsAnything)) {
        return parts;
    }
    // Each imported .docx, with what it imports turned into its own
    const documents = new Map(
        [...contentParts, ...notesParts].flatMap((part) =>
            [...part.imports.values()].flatMap((imported) =>
                imported.document ? [[imported, withImports(imported.document)] as const] : [],
            ),
        ),
    );
    // The bookmarks of names the document has, or more than one imported document has, which are left out of those
    const importedBookmarks = [...documents.values()].flatMap((document) => [...new Set(bookmarksIn(document.body.content))]);
    const leftOut = new Set([
        ...contentParts.flatMap(({ content }) => bookmarksIn(content)),
        ...notesParts.flatMap(({ notes }) => bookmarksIn([notes])),
        ...importedBookmarks.filter((name, index) => importedBookmarks.indexOf(name) !== index),
    ]);

    // What the imported documents add to the document's styles, lists and notes, as each is turned
    let { styles, numbering } = parts;
    const added: Record<"footnote" | "endnote", AddedNotes> = {
        footnote: { separators: [], notes: [] },
        endnote: { separators: [], notes: [] },
    };
    /** The notes of a kind the document has, its own and those added, by which new ones are numbered */
    const notesSoFar = (kind: "footnote" | "endnote"): XmlObject => ({
        [`w:${kind}s`]: [...elementsOf(parts[`${kind}s`]?.notes, `w:${kind}`), ...added[kind].notes],
    });
    const addNotes = (
        kind: "footnote" | "endnote",
        document: DocxParts,
        renames: (ids: Ids) => Renames,
        defaults: MergedStyles["defaults"],
    ): Ids => {
        const imported = document[`${kind}s`]?.notes;
        const { elements, ids } = mergeNotes(notesSoFar(kind), imported, `w:${kind}`);
        const separators = elementsOf(imported, `w:${kind}`).filter((note) =>
            SEPARATORS.has(String(attributesOf(note[`w:${kind}`])["w:type"])),
        );
        // eslint-disable-next-line functional/immutable-data
        added[kind] = {
            separators: added[kind].separators.length > 0 ? added[kind].separators : separators,
            notes: [...added[kind].notes, ...(withDefaultStyles(renamed(elements, renames(ids)), defaults) as readonly XmlObject[])],
        };
        return ids;
    };

    const turn = (imported: ImportedPart, element: XmlObject): readonly unknown[] | string => {
        const document = documents.get(imported)!;
        const { content } = document.body;
        // The section's properties at the end of its body, and any in its paragraphs, which end sections before
        if (
            elementsIn(content, (child) => "w:sectPr" in child).length >
            content.filter((child) => isObject(child) && "w:sectPr" in child).length
        ) {
            return "an imported document of several sections";
        }
        const keep = find(childrenOf(find(childrenOf(element["w:altChunk"]), "w:altChunkPr")), "w:matchSrc") !== undefined;
        if (
            hasPageField(content) ||
            [document.footnotes, document.endnotes].some((part) => part !== undefined && hasPageField([part.notes]))
        ) {
            return "a page reference or number of pages in an imported document";
        }
        const style = mergeStyles(styles, document.styles, keep);
        if (style.unsupported !== undefined) {
            return style.unsupported;
        }
        // Which font Word gives its East Asian and right-to-left text, where its styles give its Latin text Word's own, hasn't
        // been seen
        const eastAsianOrComplex =
            elementsIn(content, (child) => "w:rtl" in child || "w:cs" in child).length > 0 ||
            elementsIn(content, (child) => "w:t" in child).some((text) => [...contentOf(text).join("")].some(isEastAsian));
        if (style.ownFont === true && eastAsianOrComplex) {
            return "East Asian or right-to-left text in an imported document whose own styles give no font";
        }
        const blocks = content.filter((child) => !isObject(child) || !("w:sectPr" in child));
        const last = lastBlockOf(blocks);
        // With its formatting kept, which paragraph Word gives none of its space after, where its last is in a content control
        // or custom XML, hasn't been seen
        if (keep && last !== undefined && nameOf(last) === "w:p" && !blocks.includes(last)) {
            return "an imported document whose formatting is kept that ends in a content control or custom XML";
        }
        const list = mergeLists(numbering, document.numbering);
        const withIds = (notes: { readonly footnotes?: Ids; readonly endnotes?: Ids }): Renames => ({
            styles: style.ids,
            lists: list.ids,
            footnotes: notes.footnotes ?? new Map(),
            endnotes: notes.endnotes ?? new Map(),
        });
        // A note refers to no other notes
        const footnotes = addNotes("footnote", document, () => withIds({}), style.defaults);
        const endnotes = addNotes("endnote", document, () => withIds({}), style.defaults);
        const renames = withIds({ footnotes, endnotes });
        const none = new Map<string, string>();
        // The styles added are already based on each other by their new ids
        styles = withAdded(styles ?? { "w:styles": [] }, renamed(style.added, { ...renames, styles: none }) as readonly XmlObject[]);
        numbering = withAdded(numbering ?? { "w:numbering": [] }, renamed(list.added, renames) as readonly XmlObject[]);
        // Its body, without its section's properties, and ending with a paragraph, as Word gives every document (AC2b, AC2c).
        // With its formatting kept, Word gives its last paragraph none of its space after (AS9, IM2a, IM2b)
        const ended = last !== undefined && nameOf(last) === "w:p" ? blocks : [...blocks, { "w:p": [] }];
        const own = withDefaultStyles(renamed(ended, renames), style.defaults);
        return withoutBookmarks(keep ? withNoSpaceAfter(own) : own, leftOut);
    };

    const turned = (part: ContentPart): ContentPart =>
        part.imports.size === 0 ? part : { ...part, content: replaceImports(part.content, part.imports, turn) };
    const body = turned(parts.body);
    const headersAndFooters = new Map([...parts.headersAndFooters].map(([id, part]) => [id, turned(part)] as const));
    const ownNotes = (part: NotesPart | undefined): XmlObject | undefined =>
        part &&
        (part.imports.size === 0 ? part.notes : { [nameOf(part.notes)]: replaceImports(contentOf(part.notes), part.imports, turn) });
    const ownFootnotes = ownNotes(parts.footnotes);
    const ownEndnotes = ownNotes(parts.endnotes);
    /** A document's notes of a kind, its own and those added: with the imported document's separators if it had none */
    const notesOf = (kind: "footnote" | "endnote", own: XmlObject | undefined, part: NotesPart | undefined): NotesPart | undefined => {
        const { separators, notes } = added[kind];
        const root = own ?? (notes.length > 0 ? { [`w:${kind}s`]: separators } : undefined);
        return root && { notes: withAdded(root, notes), imports: part?.imports ?? new Map() };
    };
    return {
        ...parts,
        body,
        headersAndFooters,
        ...(styles === undefined ? {} : { styles }),
        ...(numbering === undefined ? {} : { numbering }),
        ...withoutUndefined({
            footnotes: notesOf("footnote", ownFootnotes, parts.footnotes),
            endnotes: notesOf("endnote", ownEndnotes, parts.endnotes),
        }),
    };
};
