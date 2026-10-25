/**
 * Patches for drawings in a template whose alt text holds a placeholder, such as a chart made in Word whose data a patch
 * replaces, and the parts of the template's package they read and change.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @module
 */
// cspell:ignore descr

import { Formatter } from "@export/formatter";
import type { File } from "@file/file";
import type { PackagePart } from "@file/package-part";
import type { IContext, XmlComponent } from "@file/xml-components";
import { relationshipsPathOf, relativeTarget, resolveTarget, sourceOfRelationships } from "@util/package-paths";
import { type XmlElement as Element, stringifyXmlable } from "@util/xml";

import { removeContentTypeOverride } from "./content-types-manager";
import { PatchType } from "./patch-type";
import { createRelationshipFile, getNextRelationshipIndex } from "./relationship-manager";
import { getFirstLevelElements, toJson } from "./util";

/**
 * A part of a template's package, as a {@link DrawingPatch} sees it.
 *
 * @publicApi
 */
export type TemplatePart = {
    /** The part's path in the package, such as "word/charts/chart1.xml" */
    readonly path: string;
    /** The part's XML, parsed, which a patch can change in place, or undefined if the part isn't XML, such as a workbook */
    readonly xml: Element | undefined;
};

/**
 * A drawing in a template whose alt text holds a placeholder, such as a chart made in Word.
 *
 * @publicApi
 */
export type TemplateDrawing = {
    /** The placeholder, with its delimiters, such as "{{sales}}" */
    readonly placeholder: string;
    /**
     * The drawing, `wp:inline` or `wp:anchor`, or in a group or drawing canvas, its `graphicFrame`, which a patch can
     * change in place
     */
    readonly element: Element;
    /** The drawing's non-visual properties, `wp:docPr` or `wpg:cNvPr`, whose `descr` and `title` are its alt text */
    readonly properties: Element;
    /** The part the drawing is in, such as the document or a header */
    readonly part: TemplatePart;
};

/**
 * What a {@link DrawingPatch} can do with the template's package.
 *
 * @publicApi
 */
export type TemplatePackage = {
    /**
     * The part a relationship of a part refers to, such as the chart a drawing's `c:chart` refers to by its `r:id`.
     *
     * @returns The part, or undefined if the part has no such relationship, the relationship is to something outside the
     * package, or the package has no such part
     */
    readonly getRelatedPart: (from: TemplatePart, relationshipId: string) => TemplatePart | undefined;
    /**
     * Points a relationship of a part to a new part, such as a chart's to a new workbook, or adds the relationship if the
     * part has none with the id. The part the relationship referred to is removed from the package, unless something
     * else refers to it.
     *
     * @param relationshipId - The relationship's id, or undefined for a new relationship
     * @returns The relationship's id
     */
    readonly replaceRelatedPart: (from: TemplatePart, relationshipId: string | undefined, part: PackagePart) => string;
    /** Formats XML as the template's parts are parsed, to put in one of them */
    readonly format: (content: XmlComponent) => Element;
};

/**
 * A patch for a drawing in a template whose alt text holds the placeholder, such as `{{sales}}`, rather than for the
 * placeholder in text. It changes the drawing, and the parts it refers to, in place. {@link ImagePatch} is one: it
 * replaces a picture's image. So is `ChartDataPatch` from `docx/charts`, which replaces the data of a chart made in Word.
 *
 * A drawing's alt text is its description (`descr`) or title. A drawing patch leaves the placeholder in text as it is.
 *
 * @publicApi
 */
export abstract class DrawingPatch {
    public readonly type = PatchType.DRAWING;

    /**
     * Changes a drawing whose alt text holds the placeholder, and the parts it refers to. `patchDocument` calls it for
     * each such drawing before it patches text, so it only sees the template's own drawings.
     *
     * A relationship the drawing referred to that nothing in its part refers to once it is patched, such as to a
     * picture's old image, is then removed, and so is the part it referred to, unless something else refers to it.
     *
     * @throws If the drawing can't be patched, which stops the document being patched
     */
    public abstract patch(drawing: TemplateDrawing, template: TemplatePackage): void;
}

/**
 * A drawing, with its non-visual properties.
 */
export type FoundDrawing = {
    readonly element: Element;
    readonly properties: Element;
};

// The elements that are drawings, and their child that holds their alt text. A Map, so that a name such as
// "constructor" isn't found on Object's prototype
const DRAWING_PROPERTIES: ReadonlyMap<string, string> = new Map([
    ["wp:inline", "wp:docPr"],
    ["wp:anchor", "wp:docPr"],
    ["wpg:graphicFrame", "wpg:cNvPr"],
    ["wpc:graphicFrame", "wpg:cNvPr"],
]);

/**
 * Each drawing in an element, in document order, including drawings in text boxes and in both a choice and its
 * fallback (`mc:AlternateContent`).
 */
export const findDrawings = (element: Element): readonly FoundDrawing[] =>
    (element.elements ?? []).flatMap((child) => {
        const name = child.name === undefined ? undefined : DRAWING_PROPERTIES.get(child.name);
        const properties = name === undefined ? undefined : child.elements?.find((e) => e.name === name);
        return [...(properties ? [{ element: child, properties }] : []), ...findDrawings(child)];
    });

/**
 * A drawing's alt text: its description, then its title.
 */
export const altTextOf = (properties: Element): readonly string[] =>
    [properties.attributes?.descr, properties.attributes?.title].flatMap((text) => (text === undefined ? [] : [String(text)]));

const CONTENT_TYPES = "[Content_Types].xml";

/**
 * A relationships part's relationships, which can be added to. A part without the `Relationships` element is given one.
 */
// eslint-disable-next-line functional/prefer-readonly-type
const relationshipsIn = (relationships: Element): Element[] => {
    if (!relationships.elements?.some((element) => element.name === "Relationships")) {
        // eslint-disable-next-line functional/immutable-data
        relationships.elements = [...(relationships.elements ?? []), ...createRelationshipFile().elements!];
    }
    return getFirstLevelElements(relationships, "Relationships");
};

// The relationships namespace, whose attributes, such as a picture's r:embed, refer to relationships by their ids
const RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/**
 * The prefixes an element and its descendants give the relationships namespace, with "r", which Word uses.
 */
const relationshipPrefixesIn = (element: Element): ReadonlySet<string> =>
    new Set([
        "r",
        ...Object.entries(element.attributes ?? {}).flatMap(([name, value]) =>
            name.startsWith("xmlns:") && value === RELATIONSHIPS_NAMESPACE ? [name.slice("xmlns:".length)] : [],
        ),
        ...(element.elements ?? []).flatMap((child) => [...relationshipPrefixesIn(child)]),
    ]);

/**
 * The ids of the relationships an element and its descendants refer to, such as a picture's `r:embed`.
 *
 * @param prefixes - The prefixes of the relationships namespace in the element's part
 */
const relationshipIdsIn = (element: Element, prefixes: ReadonlySet<string>): ReadonlySet<string> =>
    new Set([
        ...Object.entries(element.attributes ?? {}).flatMap(([name, value]) =>
            name.includes(":") && prefixes.has(name.slice(0, name.indexOf(":"))) ? [String(value)] : [],
        ),
        ...(element.elements ?? []).flatMap((child) => [...relationshipIdsIn(child, prefixes)]),
    ]);

/**
 * The template's parts and the relationships between them, as drawing patches read and change them.
 */
type TemplateContents = {
    /** The relationship of a part with an id */
    readonly findRelationship: (from: string, id: string) => Element | undefined;
    /** The path of the part inside the package that a relationship refers to, if the package has it */
    readonly pathOf: (from: string, relationship: Element) => string | undefined;
    /**
     * Removes the part a relationship referred to, unless something else refers to it. The package's content types, a
     * relationships part and the part the relationship is from are never removed
     */
    readonly removeIfUnreferenced: (from: string, path: string | undefined) => void;
    /** Removes the relationships of a part with the ids, and the parts they referred to, unless something else refers to them */
    readonly removeRelationships: (from: string, ids: ReadonlySet<string>) => void;
};

/**
 * Reads and changes the template's parts and the relationships between them.
 *
 * @param parts - The template's XML parts, parsed, by their paths, which are changed in place
 * @param binaryParts - The template's other parts, by their paths
 */
const contentsOf = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    // eslint-disable-next-line functional/prefer-readonly-type
    binaryParts: Map<string, Uint8Array>,
): TemplateContents => {
    const has = (path: string): boolean => parts.has(path) || binaryParts.has(path);

    // The path the package has a part at: as given, with its escapes decoded, or in other capitals, since part names
    // are compared without case
    const findPath = (path: string): string | undefined => {
        if (has(path)) {
            return path;
        }
        const decoded = ((): string | undefined => {
            try {
                return decodeURI(path);
            } catch {
                return undefined;
            }
        })();
        if (decoded !== undefined && has(decoded)) {
            return decoded;
        }
        const lower = path.toLowerCase();
        return [...parts.keys(), ...binaryParts.keys()].find((key) => key.toLowerCase() === lower);
    };

    const findRelationship = (from: string, id: string): Element | undefined => {
        const relationships = parts.get(relationshipsPathOf(from));
        return relationships === undefined
            ? undefined
            : getFirstLevelElements(relationships, "Relationships").find(
                  (relationship) => relationship.name === "Relationship" && relationship.attributes?.Id === id,
              );
    };

    const pathOf = (from: string, relationship: Element): string | undefined => {
        const target = relationship.attributes?.Target;
        return relationship.attributes?.TargetMode === "External" || target === undefined
            ? undefined
            : findPath(resolveTarget(from, String(target)));
    };

    const isReferenced = (path: string): boolean =>
        [...parts].some(
            ([relationshipsPath, relationships]) =>
                relationshipsPath.endsWith(".rels") &&
                getFirstLevelElements(relationships, "Relationships").some(
                    (relationship) => pathOf(sourceOfRelationships(relationshipsPath), relationship) === path,
                ),
        );

    const removeIfUnreferenced = (from: string, path: string | undefined): void => {
        if (path === undefined || path === from || path === CONTENT_TYPES || path.endsWith(".rels") || isReferenced(path)) {
            return;
        }
        const relationships = parts.get(relationshipsPathOf(path));
        /* eslint-disable functional/immutable-data */
        parts.delete(path);
        binaryParts.delete(path);
        parts.delete(relationshipsPathOf(path));
        /* eslint-enable functional/immutable-data */
        const contentTypes = parts.get(CONTENT_TYPES);
        if (contentTypes !== undefined) {
            removeContentTypeOverride(contentTypes, `/${path}`);
        }
        // The parts only it referred to, such as a chart's workbook
        for (const relationship of relationships === undefined ? [] : getFirstLevelElements(relationships, "Relationships")) {
            removeIfUnreferenced(path, pathOf(path, relationship));
        }
    };

    const removeRelationships = (from: string, ids: ReadonlySet<string>): void => {
        const relationships = parts.get(relationshipsPathOf(from))?.elements?.find((element) => element.name === "Relationships");
        const removed = (relationships?.elements ?? []).filter(
            (relationship) => relationship.name === "Relationship" && ids.has(String(relationship.attributes?.Id)),
        );
        if (relationships === undefined || removed.length === 0) {
            return;
        }
        // eslint-disable-next-line functional/immutable-data
        relationships.elements = relationships.elements!.filter((element) => !removed.includes(element));
        for (const relationship of removed) {
            removeIfUnreferenced(from, pathOf(from, relationship));
        }
    };

    return { findRelationship, pathOf, removeIfUnreferenced, removeRelationships };
};

/**
 * The template's package, as a patch reads and changes it.
 *
 * @param parts - The template's XML parts, parsed, by their paths, which are changed in place
 * @param contents - Reads and changes the template's parts and the relationships between them
 * @param context - The context to format XML with
 */
const createTemplatePackage = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    { findRelationship, pathOf, removeIfUnreferenced }: TemplateContents,
    file: File,
    context: IContext,
): TemplatePackage => {
    const formatter = new Formatter();

    return {
        getRelatedPart: (from, relationshipId) => {
            const relationship = findRelationship(from.path, relationshipId);
            const path = relationship === undefined ? undefined : pathOf(from.path, relationship);
            return path === undefined ? undefined : { path, xml: parts.get(path) };
        },

        replaceRelatedPart: (from, relationshipId, part) => {
            const path = `word/${file.PackageParts.add(part)}`;
            const { relationshipType } = part.options;
            const target = relativeTarget(from.path, path);
            const relationship = relationshipId === undefined ? undefined : findRelationship(from.path, relationshipId);

            if (relationship === undefined) {
                const relationshipsPath = relationshipsPathOf(from.path);
                const relationships = parts.get(relationshipsPath) ?? createRelationshipFile();
                // eslint-disable-next-line functional/immutable-data
                parts.set(relationshipsPath, relationships);
                const id = relationshipId ?? `rId${getNextRelationshipIndex(relationships)}`;
                // eslint-disable-next-line functional/immutable-data
                relationshipsIn(relationships).push({
                    type: "element",
                    name: "Relationship",
                    attributes: { Id: id, Type: relationshipType, Target: target },
                });
                return id;
            }

            const previous = pathOf(from.path, relationship);
            // The new part is inside the package, whatever the old one was
            // It was found by its id, so it has attributes
            const attributes = Object.fromEntries(Object.entries(relationship.attributes!).filter(([name]) => name !== "TargetMode"));
            // eslint-disable-next-line functional/immutable-data
            relationship.attributes = { ...attributes, Type: relationshipType, Target: target };
            // The part it referred to, such as a workbook with the template's own data
            removeIfUnreferenced(from.path, previous);
            return String(relationship.attributes.Id);
        },

        format: (content) => toJson(stringifyXmlable(formatter.format(content, context))).elements![0],
    };
};

/**
 * Applies the patches for drawings whose alt text holds their placeholder, such as charts. Every drawing is found
 * before any is patched, so a patch only sees the template's own alt text.
 *
 * @param parts - The template's XML parts, parsed, by their paths, which are changed in place
 * @param binaryParts - The template's other parts, by their paths, which parts can be removed from
 * @param patches - Each drawing patch, by its key
 * @param createContext - Creates the context to format XML for a part with
 * @throws If a drawing's alt text holds the placeholders of more than one patch, or a patch throws
 */
export const patchDrawings = (
    {
        parts,
        binaryParts,
        file,
        patches,
        delimiters,
    }: {
        // eslint-disable-next-line functional/prefer-readonly-type
        readonly parts: Map<string, Element>;
        // eslint-disable-next-line functional/prefer-readonly-type
        readonly binaryParts: Map<string, Uint8Array>;
        readonly file: File;
        readonly patches: readonly (readonly [key: string, patch: DrawingPatch])[];
        readonly delimiters: { readonly start: string; readonly end: string };
    },
    createContext: (path: string) => IContext,
): void => {
    const placeholders = patches.map(([key, patch]) => ({ placeholder: `${delimiters.start}${key}${delimiters.end}`, patch }));

    const found = [...parts]
        .filter(([path]) => path.startsWith("word/") && !path.endsWith(".rels"))
        .flatMap(([path, xmlPart]) =>
            findDrawings(xmlPart).flatMap((drawing) => {
                const altText = altTextOf(drawing.properties);
                const matches = placeholders.filter(({ placeholder }) => altText.some((text) => text.includes(placeholder)));
                if (matches.length > 1) {
                    throw new Error(
                        `The drawing "${drawing.properties.attributes?.name ?? ""}" in ${path} has the placeholders ` +
                            `${matches.map(({ placeholder }) => placeholder).join(" and ")} in its alt text. A drawing can only be patched once`,
                    );
                }
                return matches.map(({ placeholder, patch }) => ({
                    drawing: { placeholder, ...drawing, part: { path, xml: xmlPart } },
                    patch,
                }));
            }),
        );

    const contents = contentsOf(parts, binaryParts);
    for (const { drawing, patch } of found) {
        const referenced = relationshipIdsIn(drawing.element, relationshipPrefixesIn(drawing.part.xml));
        patch.patch(drawing, createTemplatePackage(parts, contents, file, createContext(drawing.part.path)));
        // The relationships the drawing no longer refers to, such as to a picture's old image, unless something else in
        // its part does, such as another picture of the same image
        const used = relationshipIdsIn(drawing.part.xml, relationshipPrefixesIn(drawing.part.xml));
        contents.removeRelationships(drawing.part.path, new Set([...referenced].filter((id) => !used.has(id))));
    }
};
