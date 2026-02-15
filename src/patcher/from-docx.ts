/**
 * Document patching module for modifying existing .docx files.
 *
 * This module provides functionality to patch existing Word documents by replacing
 * placeholder text with new content while preserving the original document structure.
 *
 * @module
 */
import JSZip from "jszip";
import { Element, js2xml } from "xml-js";

import { ImageReplacer } from "@export/packer/image-replacer";
import { DocumentAttributeNamespaces } from "@file/document";
import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { FileChild } from "@file/file-child";
import { IMediaData, Media } from "@file/media";
import { ConcreteHyperlink, ExternalHyperlink, ParagraphChild } from "@file/paragraph";
import { TargetModeType } from "@file/relationships/relationship/relationship";
import { IContext } from "@file/xml-components";
import { encodeUtf8, uniqueId } from "@util/convenience-functions";
import { OutputByType, OutputType } from "@util/output-type";

import { appendContentType } from "./content-types-manager";
import { appendRelationship, getNextRelationshipIndex } from "./relationship-manager";
import { replacer } from "./replacer";
import { toJson } from "./util";

/**
 * Supported input data types for document patching.
 *
 * The patcher can accept documents in various formats including buffers,
 * arrays, and streams.
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream | JSZip;

/**
 * Patch type enumeration.
 *
 * Determines how the replacement content should be inserted into the document.
 *
 * @publicApi
 */
export const PatchType = {
    /** Replace entire file-level elements (e.g., whole paragraphs) */
    DOCUMENT: "file",
    /** Replace content within paragraphs (inline replacement) */
    PARAGRAPH: "paragraph",
} as const;

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
 * Internal type for tracking hyperlink relationships that need to be added.
 */
type IHyperlinkRelationshipAddition = {
    /** XML file path where the hyperlink is used */
    readonly key: string;
    /** Hyperlink relationship details */
    readonly hyperlink: { readonly id: string; readonly link: string };
};

/**
 * Union type representing all patch types.
 */
export type IPatch = ParagraphPatch | FilePatch;

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
 * @property recursive - Whether to search for multiple occurrences of placeholders
 */
export type PatchDocumentOptions<T extends PatchDocumentOutputType = PatchDocumentOutputType> = {
    /** Output format type */
    readonly outputType: T;
    /** Input document data */
    readonly data: InputDataType;
    /** Mapping of placeholder keys to patch content */
    readonly patches: Readonly<Record<string, IPatch>>;
    /** Preserve original formatting of replaced text (default: true) */
    readonly keepOriginalStyles?: boolean;
    /** Custom placeholder delimiters (default: {{ and }}) */
    readonly placeholderDelimiters?: Readonly<{
        readonly start: string;
        readonly end: string;
    }>;
    /** Search for multiple occurrences after patching (default: true) */
    readonly recursive?: boolean;
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
    /**
     * Search for occurrences over patched document
     */
    recursive = true,
}: PatchDocumentOptions<T>): Promise<OutputByType[T]> => {
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);
    const contexts = new Map<string, IContext>();
    const file = {
        Media: new Media(),
    } as unknown as File;

    const map = new Map<string, Element>();

    // eslint-disable-next-line functional/prefer-readonly-type
    const imageRelationshipAdditions: IImageRelationshipAddition[] = [];
    // eslint-disable-next-line functional/prefer-readonly-type
    const hyperlinkRelationshipAdditions: IHyperlinkRelationshipAddition[] = [];
    let hasMedia = false;

    const binaryContentMap = new Map<string, Uint8Array>();

    for (const [key, value] of Object.entries(zipContent.files)) {
        const binaryValue = await value.async("uint8array");
        const startBytes = binaryValue.slice(0, 2);
        if (compareByteArrays(startBytes, UTF16LE) || compareByteArrays(startBytes, UTF16BE)) {
            binaryContentMap.set(key, binaryValue);
            continue;
        }

        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {
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

        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {
            const context: IContext = {
                file,
                viewWrapper: {
                    Relationships: {
                        addRelationship: (
                            linkId: string,
                            _: string,
                            target: string,
                            __: (typeof TargetModeType)[keyof typeof TargetModeType],
                        ) => {
                            // eslint-disable-next-line functional/immutable-data
                            hyperlinkRelationshipAdditions.push({
                                key,
                                hyperlink: {
                                    id: linkId,
                                    link: target,
                                },
                            });
                        },
                    },
                } as unknown as IViewWrapper,
                stack: [],
            };
            contexts.set(key, context);

            if (!placeholderDelimiters?.start.trim() || !placeholderDelimiters?.end.trim()) {
                throw new Error("Both start and end delimiters must be non-empty strings.");
            }

            const { start, end } = placeholderDelimiters;

            for (const [patchKey, patchValue] of Object.entries(patches)) {
                const patchText = `${start}${patchKey}${end}`;
                // TODO: mutates json. Make it immutable
                // We need to loop through to catch every occurrence of the patch text
                // It is possible that the patch text is in the same run
                // This algorithm is limited to one patch per text run
                // We break out of the loop once it cannot find any more occurrences
                // https://github.com/dolanmiu/docx/issues/2267
                while (true) {
                    const { didFindOccurrence } = replacer({
                        json,
                        patch: {
                            ...patchValue,
                            children: patchValue.children.map((element) => {
                                // We need to replace external hyperlinks with concrete hyperlinks
                                if (element instanceof ExternalHyperlink) {
                                    const concreteHyperlink = new ConcreteHyperlink(element.options.children, uniqueId());
                                    // eslint-disable-next-line functional/immutable-data
                                    hyperlinkRelationshipAdditions.push({
                                        key,
                                        hyperlink: {
                                            id: concreteHyperlink.linkId,
                                            link: element.options.link,
                                        },
                                    });
                                    return concreteHyperlink;
                                } else {
                                    return element;
                                }
                            }),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any,
                        patchText,
                        context,
                        keepOriginalStyles,
                    });
                    // What the reason doing that? Once document is patched - it search over patched json again, that takes too long if patched document has big and deep structure.
                    if (!recursive || !didFindOccurrence) {
                        break;
                    }
                }
            }

            const mediaDatas = imageReplacer.getMediaData(JSON.stringify(json), context.file.Media);
            if (mediaDatas.length > 0) {
                hasMedia = true;
                // eslint-disable-next-line functional/immutable-data
                imageRelationshipAdditions.push({
                    key,
                    mediaDatas,
                });
            }
        }

        map.set(key, json);
    }

    for (const { key, mediaDatas } of imageRelationshipAdditions) {
        // eslint-disable-next-line functional/immutable-data
        const relationshipKey = `word/_rels/${key.split("/").pop()}.rels`;
        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();
        map.set(relationshipKey, relationshipsJson);

        const index = getNextRelationshipIndex(relationshipsJson);
        const newJson = imageReplacer.replace(JSON.stringify(map.get(key)), mediaDatas, index);
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

    for (const { key, hyperlink } of hyperlinkRelationshipAdditions) {
        // eslint-disable-next-line functional/immutable-data
        const relationshipKey = `word/_rels/${key.split("/").pop()}.rels`;

        const relationshipsJson = map.get(relationshipKey) ?? createRelationshipFile();
        map.set(relationshipKey, relationshipsJson);

        appendRelationship(
            relationshipsJson,
            hyperlink.id,
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            hyperlink.link,
            TargetModeType.EXTERNAL,
        );
    }

    if (hasMedia) {
        const contentTypesJson = map.get("[Content_Types].xml");

        if (!contentTypesJson) {
            throw new Error("Could not find content types file");
        }

        appendContentType(contentTypesJson, "image/png", "png");
        appendContentType(contentTypesJson, "image/jpeg", "jpeg");
        appendContentType(contentTypesJson, "image/jpeg", "jpg");
        appendContentType(contentTypesJson, "image/bmp", "bmp");
        appendContentType(contentTypesJson, "image/gif", "gif");
        appendContentType(contentTypesJson, "image/svg+xml", "svg");
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

    return zip.generateAsync({
        type: outputType,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });
};

const toXml = (jsonObj: Element): string => {
    const output = js2xml(jsonObj, {
        attributeValueFn: (str) =>
            String(str)
                .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;"), // cspell:words apos
    });
    return output;
};

const createRelationshipFile = (): Element => ({
    declaration: {
        attributes: {
            version: "1.0",
            encoding: "UTF-8",
            standalone: "yes",
        },
    },
    elements: [
        {
            type: "element",
            name: "Relationships",
            attributes: {
                xmlns: "http://schemas.openxmlformats.org/package/2006/relationships",
            },
            elements: [],
        },
    ],
});
