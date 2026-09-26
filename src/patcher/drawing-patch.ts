/**
 * Patches for drawings in a template whose alt text holds a placeholder, such as a chart made in Word whose data a patch
 * replaces, and the parts of the template's package they read and change.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @module
 */
// cspell:ignore descr
import xml from "xml";
import type { Element } from "xml-js";

import { Formatter } from "@export/formatter";
import type { File } from "@file/file";
import type { PackagePart } from "@file/package-part";
import type { IContext, XmlComponent } from "@file/xml-components";

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
 * placeholder in text. It changes the drawing, and the parts it refers to, in place. `ChartDataPatch` from `docx/charts`
 * is one: it replaces the data of a chart made in Word.
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

/**
 * The path of a part's relationships part, such as word/_rels/document.xml.rels for word/document.xml.
 */
export const relationshipsPathOf = (path: string): string => {
    const slash = path.lastIndexOf("/");
    return `${path.slice(0, slash + 1)}_rels/${path.slice(slash + 1)}.rels`;
};

/**
 * The part a relationships part belongs to, or "" for the package's own (_rels/.rels), whose targets are from its root.
 */
export const sourceOfRelationships = (path: string): string => path.replace(/(^|\/)_rels\/([^/]*)\.rels$/, "$1$2");

// A part's folder, with its slash, such as "word/" for word/document.xml, or "" for a part at the package's root
const folderOf = (path: string): string => path.slice(0, path.lastIndexOf("/") + 1);

/**
 * The path of the part a relationship's target refers to: relative to the folder of the part the relationship belongs
 * to, or from the package's root if it starts with "/". Backslashes, which some applications write, are read as slashes.
 *
 * @param from - The path of the part the relationship belongs to
 */
export const resolveTarget = (from: string, target: string): string => {
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

/**
 * A relationship's target for a part, relative to the folder of the part the relationship belongs to, such as
 * "../embeddings/Microsoft_Excel_Worksheet1.xlsx" from word/charts/chart1.xml.
 *
 * @param from - The path of the part the relationship belongs to
 * @param to - The path of the part it refers to
 */
export const relativeTarget = (from: string, to: string): string => {
    const folders = folderOf(from).split("/").filter(Boolean);
    const segments = to.split("/");
    const common = folders.findIndex((folder, index) => index >= segments.length - 1 || segments[index] !== folder);
    const shared = common === -1 ? folders.length : common;
    return [...folders.slice(shared).map(() => ".."), ...segments.slice(shared)].join("/");
};

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

/**
 * The template's package, as a patch reads and changes it.
 *
 * @param parts - The template's XML parts, parsed, by their paths, which are changed in place
 * @param binaryParts - The template's other parts, by their paths
 * @param context - The context to format XML with
 */
const createTemplatePackage = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    // eslint-disable-next-line functional/prefer-readonly-type
    binaryParts: Map<string, Uint8Array>,
    file: File,
    context: IContext,
): TemplatePackage => {
    const formatter = new Formatter();
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

    // The path of the part inside the package that a relationship refers to, if the package has it
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

    const removePart = (path: string): void => {
        /* eslint-disable functional/immutable-data */
        parts.delete(path);
        binaryParts.delete(path);
        parts.delete(relationshipsPathOf(path));
        /* eslint-enable functional/immutable-data */
        const contentTypes = parts.get(CONTENT_TYPES);
        if (contentTypes !== undefined) {
            removeContentTypeOverride(contentTypes, `/${path}`);
        }
    };

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
            // The part it referred to, such as a workbook with the template's own data, unless something else refers to
            // it. The package's content types, a relationships part and the part itself are never removed
            if (
                previous !== undefined &&
                previous !== from.path &&
                previous !== CONTENT_TYPES &&
                !previous.endsWith(".rels") &&
                !isReferenced(previous)
            ) {
                removePart(previous);
            }
            return String(relationship.attributes.Id);
        },

        format: (content) => toJson(xml(formatter.format(content, context))).elements![0],
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

    for (const { drawing, patch } of found) {
        patch.patch(drawing, createTemplatePackage(parts, binaryParts, file, createContext(drawing.part.path)));
    }
};
