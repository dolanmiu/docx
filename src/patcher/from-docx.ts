import * as JSZip from "jszip";
import { Element, js2xml } from "xml-js";

import { ParagraphChild } from "@file/paragraph";
import { FileChild } from "@file/file-child";
import { IMediaData, Media } from "@file/media";
import { IViewWrapper } from "@file/document-wrapper";
import { File } from "@file/file";
import { IContext } from "@file/xml-components";
import { ImageReplacer } from "@export/packer/image-replacer";

import { replacer } from "./replacer";
import { findLocationOfText } from "./traverser";
import { toJson } from "./util";
import { appendRelationship, getNextRelationshipIndex } from "./relationship-manager";
import { appendContentType } from "./content-types-manager";

// eslint-disable-next-line functional/prefer-readonly-type
type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream;

export enum PatchType {
    DOCUMENT = "file",
    PARAGRAPH = "paragraph",
}

type ParagraphPatch = {
    readonly type: PatchType.PARAGRAPH;
    readonly children: readonly ParagraphChild[];
};

type FilePatch = {
    readonly type: PatchType.DOCUMENT;
    readonly children: readonly FileChild[];
};

interface IRelationshipReplacement {
    readonly key: string;
    readonly mediaDatas: readonly IMediaData[];
}

export type IPatch = ParagraphPatch | FilePatch;

export interface PatchDocumentOptions {
    readonly patches: { readonly [key: string]: IPatch };
}

const imageReplacer = new ImageReplacer();

export const patchDocument = async (data: InputDataType, options: PatchDocumentOptions): Promise<Buffer> => {
    const zipContent = await JSZip.loadAsync(data);

    const context: IContext = {
        file: {
            Media: new Media(),
        } as unknown as File,
        viewWrapper: {} as unknown as IViewWrapper,
        stack: [],
    };

    const map = new Map<string, Element>();

    // eslint-disable-next-line functional/prefer-readonly-type
    const relationshipReplacement: IRelationshipReplacement[] = [];
    let hasMedia = false;

    for (const [key, value] of Object.entries(zipContent.files)) {
        const json = toJson(await value.async("text"));
        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {
            for (const [patchKey, patchValue] of Object.entries(options.patches)) {
                const patchText = `{{${patchKey}}}`;
                const renderedParagraphs = findLocationOfText(json, patchText);
                // TODO: mutates json. Make it immutable
                replacer(json, patchValue, patchText, renderedParagraphs, context);
            }

            const mediaDatas = imageReplacer.getMediaData(JSON.stringify(json), context.file.Media);
            if (mediaDatas.length > 0) {
                hasMedia = true;
                // eslint-disable-next-line functional/immutable-data
                relationshipReplacement.push({
                    key,
                    mediaDatas,
                });
            }
        }

        map.set(key, json);
    }

    for (const { key, mediaDatas } of relationshipReplacement) {
        // eslint-disable-next-line functional/immutable-data
        const relationshipsJson = map.get(`word/_rels/${key.split("/").pop()}.rels`);

        if (relationshipsJson) {
            const index = getNextRelationshipIndex(relationshipsJson);
            const newJson = imageReplacer.replace(JSON.stringify(map.get(key)), mediaDatas, index);
            map.set(key, JSON.parse(newJson) as Element);

            for (const { fileName } of mediaDatas) {
                appendRelationship(
                    relationshipsJson,
                    index,
                    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                    `media/${fileName}`,
                );
            }
        }
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
    }

    const zip = new JSZip();

    for (const [key, value] of map) {
        const output = toXml(value);

        zip.file(key, output);
    }

    for (const { stream, fileName } of context.file.Media.Array) {
        zip.file(`word/media/${fileName}`, stream);
    }

    return zip.generateAsync({
        type: "nodebuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });
};

const toXml = (jsonObj: Element): string => {
    const output = js2xml(jsonObj);
    return output;
};
