/**
 * Document patching module for modifying existing .docx files.
 *
 * This module provides functionality to patch existing Word documents by replacing
 * placeholder text with new content while preserving the original document structure.
 *
 * @module
 */
import JSZip from "jszip";
import { type Element, js2xml } from "xml-js";

import { ImageReplacer } from "@export/packer/image-replacer";
import { xmlifyPackageParts } from "@export/packer/package-part-writer";
import { DocumentAttributeNamespaces } from "@file/document";
import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import type { FileChild } from "@file/file-child";
import { type IMediaData, Media } from "@file/media";
import { PackageParts } from "@file/package-part/package-part";
import { Bookmark, ConcreteHyperlink, ExternalHyperlink, type Paragraph, type ParagraphChild } from "@file/paragraph";
import { type RelationshipType, TargetModeType } from "@file/relationships/relationship/relationship";
import type { IContext } from "@file/xml-components";
import { encodeUtf8, uniqueId } from "@util/convenience-functions";
import type { OutputByType, OutputType } from "@util/output-type";

import { findBookmarkIds, renumberBookmarksAvoiding } from "./bookmark-ids";
import { appendContentType, appendContentTypeOverride } from "./content-types-manager";
import { type DrawingPatch, patchDrawings, relationshipsPathOf } from "./drawing-patch";
import { patchNotes } from "./notes";
import { type TemplatePageNumberEstimator, fillTemplatePageNumbers } from "./page-numbers";
import { PatchType } from "./patch-type";
import { appendRelationship, createRelationshipFile, getNextRelationshipIndex } from "./relationship-manager";
import { replacer } from "./replacer";
import { patchTableRows } from "./table-rows";
import { readThemeColors } from "./theme-colors";
import { toJson } from "./util";

/**
 * Supported input data types for document patching.
 *
 * The patcher can accept documents in various formats including buffers,
 * arrays, and streams.
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream | JSZip;

export { PatchType } from "./patch-type";
export { DrawingPatch } from "./drawing-patch";
export type { TemplateDrawing, TemplatePackage, TemplatePart } from "./drawing-patch";
export type { PatchedTemplate, TemplatePageNumberEstimator } from "./page-numbers";

/**
 * Patch definition for paragraph-level replacement.
 *
 * Replaces placeholder text with inline content (runs, hyperlinks, etc.)
 * while preserving the surrounding paragraph structure.
 */
type ParagraphPatch = {
    /** Indicates this is a paragraph-level patch */
    readonly type: typeof PatchType.PARAGRAPH;
    /** Content to insert (runs, hyperlinks, images, etc.) */
    readonly children: readonly ParagraphChild[];
};

/**
 * Patch definition for document-level replacement.
 *
 * Replaces placeholder text with block-level content (entire paragraphs, tables, etc.).
 */
type FilePatch = {
    /** Indicates this is a document-level patch */
    readonly type: typeof PatchType.DOCUMENT;
    /** Content to insert (paragraphs, tables, etc.) */
    readonly children: readonly FileChild[];
};

/**
 * Internal type for tracking image relationships that need to be added.
 */
type IImageRelationshipAddition = {
    /** XML file path where the image is used */
    readonly key: string;
    /** Media data for the images */
    readonly mediaDatas: readonly IMediaData[];
};

/**
 * Internal type for tracking the relationships that need to be added, such as to a hyperlink's address or a chart.
 */
type IRelationshipAddition = {
    /** XML file path the relationship is from */
    readonly key: string;
    /** The relationship's id, without its "rId" */
    readonly id: string | number;
    readonly type: RelationshipType;
    readonly target: string;
    readonly targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType];
};

/**
 * Union type representing all patch types.
 */
export type IPatch = ParagraphPatch | FilePatch;

/**
 * Patch definition that repeats the rows of a table in the template, once for each row of data, so a table can be
 * designed in Word and filled in with any number of rows.
 *
 * The rows it repeats are those that hold its fields: placeholders made of the patch's key, a dot and the field's name,
 * such as `{{items.name}}` and `{{items.price}}` for the patch `items`. Each copy's fields are patched with a row's
 * patches, by their field's name, and the other rows of the table, such as its header, are kept as they are. Rows next
 * to each other are repeated together, such as a row for an item and a row for its notes.
 *
 * A field that a row has no patch for is left empty. With no rows, the rows are removed, and so is a table left with
 * none. The other patches are applied after the rows are repeated, so a placeholder of theirs in a repeated row, such as
 * `{{currency}}`, is patched in every copy.
 *
 * @example
 * ```typescript
 * const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });
 *
 * await patchDocument({
 *   outputType: "nodebuffer",
 *   data: template,
 *   patches: {
 *     items: {
 *       type: PatchType.TABLE_ROWS,
 *       rows: [
 *         { name: text("Apples"), price: text("1.20") },
 *         { name: text("Pears"), price: text("0.90") },
 *       ],
 *     },
 *   },
 * });
 * ```
 *
 * @publicApi
 */
export type TableRowsPatch = {
    /** Indicates this patch repeats the rows of a table */
    readonly type: typeof PatchType.TABLE_ROWS;
    /**
     * The patches for each copy of the rows, by the name of the field they patch, such as `name` for `{{items.name}}`.
     * A field's patch can repeat rows of a table in the copy in turn, whose fields are then such as
     * `{{items.parts.name}}`. When those fields are in the copy's own row, rather than in a table in it, the row is
     * repeated for each part, with its item's fields, and an item without parts has no row
     */
    readonly rows: readonly Readonly<Record<string, IPatch | TableRowsPatch | undefined>>[];
};

/**
 * Output format types for patched documents.
 */
export type PatchDocumentOutputType = OutputType;

/**
 * Options for patching a document.
 *
 * @property outputType - Desired output format (buffer, blob, string, etc.)
 * @property data - The input document to patch
 * @property patches - Map of placeholder keys to patch definitions
 * @property keepOriginalStyles - Whether to preserve original text formatting
 * @property placeholderDelimiters - Custom delimiter characters for placeholders
 * @property recursive - Whether to replace every occurrence of a placeholder in a paragraph, rather than only the first
 * @property footnotes - The footnotes that patches refer to with a `FootnoteReferenceRun`
 * @property endnotes - The endnotes that patches refer to with an `EndnoteReferenceRun`
 * @property pageNumbers - Works out the page each bookmark is on, to write the page numbers of page references
 */
export type PatchDocumentOptions<T extends PatchDocumentOutputType = PatchDocumentOutputType> = {
    /** Output format type */
    readonly outputType: T;
    /** Input document data */
    readonly data: InputDataType;
    /**
     * Mapping of placeholder keys to patch content, to a {@link TableRowsPatch} that repeats the rows of a table, or to a
     * {@link DrawingPatch}, such as `docx/charts`' `ChartDataPatch`, for a drawing whose alt text holds the placeholder
     */
    readonly patches: Readonly<Record<string, IPatch | TableRowsPatch | DrawingPatch>>;
    /** Preserve original formatting of replaced text (default: true) */
    readonly keepOriginalStyles?: boolean;
    /** Custom placeholder delimiters (default: {{ and }}) */
    readonly placeholderDelimiters?: Readonly<{
        readonly start: string;
        readonly end: string;
    }>;
    /** Replace every occurrence of a placeholder in a paragraph, rather than only the first (default: true) */
    readonly recursive?: boolean;
    /**
     * The footnotes that patches refer to, by the id given to their `FootnoteReferenceRun`s, as in a `Document`. Each
     * reference a patch inserts gets a footnote of its own, with an id that none of the document's footnotes have
     */
    readonly footnotes?: Readonly<Record<string, { readonly children: readonly Paragraph[] }>>;
    /** The endnotes that patches refer to, by the id given to their `EndnoteReferenceRun`s, as with footnotes */
    readonly endnotes?: Readonly<Record<string, { readonly children: readonly Paragraph[] }>>;
    /**
     * Works out the page each bookmark of the patched document is on, and how many pages it has, so the page numbers of
     * its tables of contents and page references, and its numbers of pages, are written with it, rather than left as they
     * were in the template. Give it `estimatePageNumbers` from `docx/layout`. See {@link TemplatePageNumberEstimator}
     */
    readonly pageNumbers?: TemplatePageNumberEstimator;
};

/**
 * Throws if a patch, or a patch for a field of one of its rows, isn't one `patchDocument` can apply, such as a patch
 * from JavaScript without its children.
 *
 * @param key - The patch's key, such as "items", or for a field of a row, such as "items.name"
 * @param inTableRow - Whether the patch is for a field of a row, where a drawing patch can't be
 */
const assertValidPatch = (
    key: string,
    patch: IPatch | TableRowsPatch | DrawingPatch,
    { inTableRow }: { readonly inTableRow: boolean },
): void => {
    if (patch?.type === PatchType.TABLE_ROWS && Array.isArray(patch.rows)) {
        for (const row of patch.rows as readonly unknown[]) {
            if (typeof row !== "object" || row === null) {
                throw new Error(`Invalid patch "${key}". Expected each of its rows to be an object of patches, by the name of their field`);
            }
            for (const [field, fieldPatch] of Object.entries(row as TableRowsPatch["rows"][number])) {
                // A field without a patch is left empty
                if (fieldPatch !== undefined) {
                    assertValidPatch(`${key}.${field}`, fieldPatch, { inTableRow: true });
                }
            }
        }
        return;
    }

    const valid =
        patch?.type === PatchType.DRAWING
            ? !inTableRow && typeof patch.patch === "function"
            : patch?.type !== PatchType.TABLE_ROWS && Array.isArray(patch?.children);
    if (!valid) {
        const others = inTableRow
            ? "or { type: PatchType.TABLE_ROWS, rows: [...] }"
            : "{ type: PatchType.TABLE_ROWS, rows: [...] }, or a drawing patch such as ChartDataPatch from docx/charts";
        throw new Error(`Invalid patch "${key}". Expected { type: PatchType.PARAGRAPH or PatchType.DOCUMENT, children: [...] }, ${others}`);
    }
};

const imageReplacer = new ImageReplacer();
const UTF16LE = new Uint8Array([0xff, 0xfe]);
const UTF16BE = new Uint8Array([0xfe, 0xff]);

const compareByteArrays = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Patches an existing .docx document by replacing placeholders with new content.
 *
 * This function opens an existing Word document, searches for placeholder text
 * (e.g., {{name}}), and replaces it with the provided content while preserving
 * the original document structure and optionally the original formatting.
 *
 * @param options - Configuration options for patching
 * @returns A promise resolving to the patched document in the specified output format
 *
 * @example
 * ```typescript
 * // Patch with paragraph content
 * const buffer = await patchDocument({
 *   outputType: "nodebuffer",
 *   data: templateBuffer,
 *   patches: {
 *     name: {
 *       type: PatchType.PARAGRAPH,
 *       children: [new TextRun({ text: "John Doe", bold: true })],
 *     },
 *   },
 * });
 *
 * // Patch with custom delimiters
 * const buffer = await patchDocument({
 *   outputType: "nodebuffer",
 *   data: templateBuffer,
 *   patches: { ... },
 *   placeholderDelimiters: { start: "<<", end: ">>" },
 * });
 * ```
 *
 * @publicApi
 */
export const patchDocument = async <T extends PatchDocumentOutputType = PatchDocumentOutputType>({
    outputType,
    data,
    patches,
    keepOriginalStyles,
    placeholderDelimiters = { start: "{{", end: "}}" } as const,
    recursive = true,
    footnotes,
    endnotes,
    pageNumbers,
}: PatchDocumentOptions<T>): Promise<OutputByType[T]> => {
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);
    const contexts = new Map<string, IContext>();
    // Theme colors in patches are written with the hex color they come to in the document's theme
    const themeColors = await readThemeColors(zipContent);
    // The content types of parts that patches add to the package, such as charts
    // eslint-disable-next-line functional/prefer-readonly-type
    const contentTypeOverrides: { readonly contentType: string; readonly partName: string }[] = [];
    const file = {
        Media: new Media(),
        Theme: themeColors && { Colors: themeColors },
        PackageParts: new PackageParts(
            {
                // eslint-disable-next-line functional/immutable-data
                addOverride: (contentType: string, partName: string) => contentTypeOverrides.push({ contentType, partName }),
            },
            // New parts take numbers the template's own parts, such as its charts, don't have
            new Set(
                Object.keys(zipContent.files)
                    .filter((path) => path.startsWith("word/"))
                    .map((path) => path.slice("word/".length)),
            ),
        ),
    } as unknown as File;

    const map = new Map<string, Element>();

    // eslint-disable-next-line functional/prefer-readonly-type
    const imageRelationshipAdditions: IImageRelationshipAddition[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const relationshipAdditions: IRelationshipAddition[] = [];
    let hasMedia = false;

    const binaryContentMap = new Map<string, Uint8Array>();

    if (!placeholderDelimiters?.start.trim() || !placeholderDelimiters?.end.trim()) {
        throw new Error("Both start and end delimiters must be non-empty strings.");
    }
    const { start, end } = placeholderDelimiters;

    for (const [key, patch] of Object.entries(patches)) {
        assertValidPatch(key, patch, { inTableRow: false });
    }

    for (const [key, value] of Object.entries(zipContent.files)) {
        const binaryValue = await value.async("uint8array");
        const startBytes = binaryValue.slice(0, 2);
        if (compareByteArrays(startBytes, UTF16LE) || compareByteArrays(startBytes, UTF16BE)) {
            // eslint-disable-next-line functional/immutable-data
            binaryContentMap.set(key, binaryValue);
            continue;
        }

        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {
            // eslint-disable-next-line functional/immutable-data
            binaryContentMap.set(key, binaryValue);
            continue;
        }

        const json = toJson(await value.async("text"));

        if (key === "word/document.xml") {
            const document = json.elements?.find((i) => i.name === "w:document");
            if (document && document.attributes) {
                // We could check all namespaces from Document, but we'll instead
                // check only those that may be used by our element types.

                for (const ns of ["mc", "wp", "r", "w15", "m"] as const) {
                    // eslint-disable-next-line functional/immutable-data
                    document.attributes[`xmlns:${ns}`] = DocumentAttributeNamespaces[ns];
                }
                // eslint-disable-next-line functional/immutable-data
                document.attributes["mc:Ignorable"] = `${document.attributes["mc:Ignorable"] || ""} w15`.trim();
            }
        }

        // eslint-disable-next-line functional/immutable-data
        map.set(key, json);
    }

    // Bookmark ids must be unique within the document, so the bookmarks patches insert are kept clear of the template's
    const renumberBookmarks = renumberBookmarksAvoiding([...map.values()].flatMap(findBookmarkIds));

    const createContext = (key: string): IContext => ({
        file,
        viewWrapper: {
            Relationships: {
                addRelationship: (
                    id: string | number,
                    type: RelationshipType,
                    target: string,
                    targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
                ) => {
                    // eslint-disable-next-line functional/immutable-data
                    relationshipAdditions.push({ key, id, type, target, targetMode });
                },
            },
        } as unknown as IViewWrapper,
        stack: [],
    });

    // The footnotes and endnotes that the patches refer to are written once the patches are in, one for each reference
    const notes = patchNotes({ footnotes, endnotes }, map, {
        createContext,
        // eslint-disable-next-line functional/immutable-data
        addContentTypeOverride: (contentType, partName) => contentTypeOverrides.push({ contentType, partName }),
        renumberBookmarks,
    });

    // Drawings whose alt text holds a placeholder, such as charts, are patched first, so their patches only see the
    // template's own drawings, and not those the other patches add
    patchDrawings(
        {
            parts: map,
            binaryParts: binaryContentMap,
            file,
            patches: Object.entries(patches).flatMap(([key, patch]) => (patch.type === PatchType.DRAWING ? [[key, patch] as const] : [])),
            delimiters: { start, end },
        },
        createContext,
    );

    const textPatches = Object.entries(patches).flatMap(([key, patch]) =>
        patch.type === PatchType.DRAWING ? [] : [[key, patch] as const],
    );
    // Rows of tables are repeated first, so the other patches fill their placeholders in every copy of a row
    const patchesInOrder = [
        ...textPatches.filter(([, patch]) => patch.type === PatchType.TABLE_ROWS),
        ...textPatches.filter(([, patch]) => patch.type !== PatchType.TABLE_ROWS),
    ];

    for (const [key, json] of [...map]) {
        if (!key.startsWith("word/") || key.endsWith(".xml.rels")) {
            continue;
        }
        const context = createContext(key);
        // eslint-disable-next-line functional/immutable-data
        contexts.set(key, context);

        // Patches a placeholder in an element of the part: its root, or a copy of the rows of a table that a patch repeats
        const patchPlaceholder = (element: Element, patchKey: string, patchValue: IPatch | TableRowsPatch): void => {
            if (patchValue.type === PatchType.TABLE_ROWS) {
                patchTableRows({ json: element, key: patchKey, patch: patchValue, delimiters: { start, end }, patchPlaceholder });
                return;
            }

            // The relationships of the patch's hyperlinks, which the part only gets if the placeholder is in it
            // eslint-disable-next-line functional/prefer-readonly-type
            const hyperlinkRelationships: IRelationshipAddition[] = [];

            // TODO: mutates json. Make it immutable
            // The replacer patches every occurrence in one pass, and never searches the content it inserts,
            // so a patch that contains its own placeholder is fine
            // https://github.com/dolanmiu/docx/issues/2267
            const { didFindOccurrence } = replacer({
                json: element,
                patch: {
                    ...patchValue,
                    children: patchValue.children
                        // A bookmark is written as its start, its children and its end, as it is in a paragraph
                        .flatMap((child) => (child instanceof Bookmark ? child.writtenAs : [child]))
                        .map((child) => {
                            // We need to replace external hyperlinks with concrete hyperlinks
                            if (child instanceof ExternalHyperlink) {
                                const concreteHyperlink = new ConcreteHyperlink(child.options.children, uniqueId());
                                // eslint-disable-next-line functional/immutable-data
                                hyperlinkRelationships.push({
                                    key,
                                    id: concreteHyperlink.linkId,
                                    type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                                    target: child.options.link,
                                    targetMode: TargetModeType.EXTERNAL,
                                });
                                return concreteHyperlink;
                            } else {
                                return child;
                            }
                        }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
                patchText: `${start}${patchKey}${end}`,
                context,
                keepOriginalStyles,
                recursive,
                renumberIds: (elements) => notes.renumber(renumberBookmarks(elements)),
            });

            if (didFindOccurrence) {
                // eslint-disable-next-line functional/immutable-data
                relationshipAdditions.push(...hyperlinkRelationships);
            }
        };

        for (const [patchKey, patchValue] of patchesInOrder) {
            patchPlaceholder(json, patchKey, patchValue);
        }
    }

    notes.write();

    for (const [key, json] of map) {
        if (!key.startsWith("word/") || key.endsWith(".xml.rels")) {
            continue;
        }
        const mediaDatas = imageReplacer.getMediaData(JSON.stringify(json), file.Media);
        if (mediaDatas.length > 0) {
            hasMedia = true;
            // eslint-disable-next-line functional/immutable-data
            imageRelationshipAdditions.push({
                key,
                mediaDatas,
            });
        }
    }

    for (const { key, mediaDatas } of imageRelationshipAdditions) {
        const relationshipKey = relationshipsPathOf(key);
        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();
        // eslint-disable-next-line functional/immutable-data
        map.set(relationshipKey, relationshipsJson);

        const index = getNextRelationshipIndex(relationshipsJson);
        const newJson = imageReplacer.replace(JSON.stringify(map.get(key)), mediaDatas, index);
        // eslint-disable-next-line functional/immutable-data
        map.set(key, JSON.parse(newJson) as Element);

        for (let i = 0; i < mediaDatas.length; i++) {
            const { fileName } = mediaDatas[i];
            appendRelationship(
                relationshipsJson,
                index + i,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                `media/${fileName}`,
            );
        }
    }

    for (const { key, id, type, target, targetMode } of relationshipAdditions) {
        const relationshipKey = relationshipsPathOf(key);

        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();
        // eslint-disable-next-line functional/immutable-data
        map.set(relationshipKey, relationshipsJson);

        appendRelationship(relationshipsJson, id, type, target, targetMode);
    }

    // The pages are worked out once everything is patched in
    if (pageNumbers) {
        fillTemplatePageNumbers(map, pageNumbers);
    }

    // The parts that patches added to the package, such as charts, which add their own parts as they are written, such
    // as a chart's workbook
    const packageParts = xmlifyPackageParts(file, undefined);

    if (hasMedia || contentTypeOverrides.length > 0) {
        const contentTypesJson = map.get("[Content_Types].xml");

        if (!contentTypesJson) {
            throw new Error("Could not find content types file");
        }

        if (hasMedia) {
            appendContentType(contentTypesJson, "image/png", "png");
            appendContentType(contentTypesJson, "image/jpeg", "jpeg");
            appendContentType(contentTypesJson, "image/jpeg", "jpg");
            appendContentType(contentTypesJson, "image/bmp", "bmp");
            appendContentType(contentTypesJson, "image/gif", "gif");
            appendContentType(contentTypesJson, "image/svg+xml", "svg");
        }

        for (const { contentType, partName } of contentTypeOverrides) {
            appendContentTypeOverride(contentTypesJson, contentType, partName);
        }
    }

    const zip = new JSZip();

    for (const [key, value] of map) {
        const output = toXml(value);

        zip.file(key, encodeUtf8(output));
    }

    for (const [key, value] of binaryContentMap) {
        zip.file(key, value);
    }

    for (const { data: stream, fileName } of file.Media.Array) {
        zip.file(`word/media/${fileName}`, stream);
    }

    for (const { path, data: partData } of packageParts) {
        zip.file(path, typeof partData === "string" ? encodeUtf8(partData) : partData);
    }

    return zip.generateAsync({
        type: outputType,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });
};

/**
 * The element with an extra escape on each "&" in its text and attributes. xml-js reads "&amp;" in text as an "&"
 * already escaped, and would write a text's literal "&amp;", such as in a document about HTML, as "&". It escapes the
 * quotes in an attribute before `attributeValueFn` is given it, so that can't tell its "&quot;" from a literal one.
 */
const withAmpersandsEscaped = (element: Element): Element => ({
    ...element,
    ...(element.attributes === undefined
        ? {}
        : {
              attributes: Object.fromEntries(
                  Object.entries(element.attributes).map(([key, value]) => [
                      key,
                      value === undefined ? value : String(value).replace(/&/g, "&amp;"),
                  ]),
              ),
          }),
    ...(element.elements === undefined
        ? {}
        : {
              elements: element.elements.map((child) =>
                  child.type === "text" ? { ...child, text: String(child.text).replace(/&/g, "&amp;") } : withAmpersandsEscaped(child),
              ),
          }),
});

const toXml = (jsonObj: Element): string => {
    const output = js2xml(withAmpersandsEscaped(jsonObj), {
        // xml-js has already escaped the quotes, and withAmpersandsEscaped each "&"
        attributeValueFn: (str) => String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;"), // cspell:words apos
    });
    return output;
};
