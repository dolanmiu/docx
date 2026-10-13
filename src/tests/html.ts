/**
 * Helpers for tests of docx/html: content written as WordprocessingML, with the ids that differ from one writing to
 * the next made the same, so content from HTML can be compared with the same content made by hand.
 *
 * @module
 * @internal
 */
// cspell:ignore IHDR IDAT IEND
import JSZip from "jszip";
import { deflateSync } from "node:zlib";
import xml from "xml";

import { Formatter } from "@export/formatter";
import { Packer } from "@export/packer/packer";
import { File } from "@file/file";
import type { Paragraph } from "@file/paragraph";
import type { Table } from "@file/table";
import type { IContext } from "@file/xml-components";

/**
 * Written content with its ids made the same each time: relationships', bookmarks', tracked changes' and drawings'
 * ids, and the references of the lists docx/html makes, which are counted across documents.
 */
export const normalized = (text: string): string =>
    text
        .replace(/r:(id|embed)="[^"]*"/g, 'r:$1="rId"')
        .replace(/w:id="\d+"/g, 'w:id="0"')
        .replace(/ id="\d+"/g, ' id="0"')
        .replace(/docx-html-list-\d+/g, "list");

/** A document to write content in, and its context */
const contextOf = (): IContext => {
    const file = new File({ sections: [] });
    return { file, viewWrapper: file.Document, stack: [] } as unknown as IContext;
};

/** Paragraphs and tables written as WordprocessingML, in one document */
export const written = (children: readonly (Paragraph | Table)[]): string => {
    const context = contextOf();
    return children.map((child) => xml(new Formatter().format(child, context))).join("");
};

/**
 * Paragraphs and tables written as WordprocessingML, in one document, with their ids made the same each time.
 */
export const formatted = (children: readonly (Paragraph | Table)[]): string => normalized(written(children));

/** A paragraph of a list, as Word reads it: its list, numbered from 0 in the order lists start, its level and its text */
export type ListParagraph = { readonly list: number; readonly level: number; readonly text: string };

/** A level of a list, as Word reads it: its number format, the text of its number, and the number it starts at */
export type ListLevel = { readonly format: string; readonly text: string; readonly start: number };

/**
 * The lists of paragraphs and tables, as Word reads them from a document they are packed in: each list paragraph's
 * list and level, and each list's levels, with the start of each list's own first level, which Word starts it at.
 */
export const listsIn = async (
    children: readonly (Paragraph | Table)[],
): Promise<{ readonly paragraphs: readonly ListParagraph[]; readonly levels: readonly (readonly ListLevel[])[] }> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(new File({ sections: [{ children }] })));
    const document = await zip.file("word/document.xml")!.async("text");
    const numbering = await zip.file("word/numbering.xml")!.async("text");
    // The lists, in the order they start
    const numIds = [...new Set([...document.matchAll(/<w:numId w:val="(\d+)"\/>/g)].map(([, numId]) => numId))].filter(
        (numId) => numId !== "0",
    );
    const paragraphs = [...document.matchAll(/<w:p\b[^>]*>(.*?)<\/w:p>/g)].flatMap(([, content]) => {
        const numId = /<w:numId w:val="(\d+)"\/>/.exec(content)?.[1];
        if (numId === undefined || numId === "0") {
            return [];
        }
        const level = Number(/<w:ilvl w:val="(\d+)"\/>/.exec(content)![1]);
        const text = [...content.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(([, part]) => part).join("");
        return [{ list: numIds.indexOf(numId), level, text }];
    });
    const abstractOf = (numId: string): string => {
        const [, abstractNumId] = new RegExp(`<w:num w:numId="${numId}"><w:abstractNumId w:val="(\\d+)"/>`).exec(numbering)!;
        return abstractNumId;
    };
    const levels = numIds.map((numId) => {
        const [, abstract] = new RegExp(`<w:abstractNum w:abstractNumId="${abstractOf(numId)}"[^>]*>(.*?)</w:abstractNum>`).exec(
            numbering,
        )!;
        return [...abstract.matchAll(/<w:lvl w:ilvl="\d+"[^>]*>(.*?)<\/w:lvl>/g)].map(([, level]) => ({
            format: /<w:numFmt w:val="([^"]*)"\/>/.exec(level)![1],
            text: /<w:lvlText w:val="([^"]*)"\/>/.exec(level)?.[1] ?? "",
            start: Number(/<w:start w:val="(\d+)"\/>/.exec(level)![1]),
        }));
    });
    return { paragraphs, levels };
};

const crc32 = (bytes: Uint8Array): number => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        // eslint-disable-next-line no-bitwise
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            // eslint-disable-next-line no-bitwise
            crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
        }
    }
    // eslint-disable-next-line no-bitwise
    return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Uint8Array): Uint8Array => {
    const typed = new Uint8Array([...new TextEncoder().encode(type), ...data]);
    const { length } = data;
    const crc = crc32(typed);
    // eslint-disable-next-line no-bitwise
    const bigEndian = (value: number): readonly number[] => [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    return new Uint8Array([...bigEndian(length), ...typed, ...bigEndian(crc)]);
};

/**
 * A PNG of a size, all of one transparent colour, which is a whole file an image viewer opens.
 */
export const png = (width: number, height: number): Uint8Array => {
    const header = new Uint8Array([
        ...chunk(
            "IHDR",
            new Uint8Array([
                // eslint-disable-next-line no-bitwise
                ...[width >>> 24, (width >>> 16) & 255, (width >>> 8) & 255, width & 255],
                // eslint-disable-next-line no-bitwise
                ...[height >>> 24, (height >>> 16) & 255, (height >>> 8) & 255, height & 255],
                8,
                6,
                0,
                0,
                0,
            ]),
        ),
    ]);
    // Each row: no filter, and four bytes a pixel
    const rows = new Uint8Array(height * (width * 4 + 1));
    return new Uint8Array([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...header,
        ...chunk("IDAT", new Uint8Array(deflateSync(Buffer.from(rows)))),
        ...chunk("IEND", new Uint8Array()),
    ]);
};

/** A PNG as a data URL */
export const pngDataUrl = (width: number, height: number): string =>
    `data:image/png;base64,${Buffer.from(png(width, height)).toString("base64")}`;
