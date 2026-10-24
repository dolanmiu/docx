/**
 * Writes the parts that something in a document adds to the package, such as charts, for the compiler and for
 * `patchDocument`.
 *
 * @module
 */
import type { File } from "@file/file";
import type { PackagePart, PackagePartRelationshipType } from "@file/package-part/package-part";
import { Relationships } from "@file/relationships";
import type { XmlComponent } from "@file/xml-components";
import { stringifyXmlable } from "@util/xml";
import { zipFiles } from "@util/zip";

import { Formatter } from "../formatter";
import type { PrettifyType } from "./packer";

/**
 * A part that something in the document adds to the package, such as a chart or its embedded workbook, or the
 * relationships of one.
 */
export type PackagePartFile = {
    readonly data: string | Uint8Array;
    readonly path: string;
};

type Prettify = (typeof PrettifyType)[keyof typeof PrettifyType] | undefined;

const formatter = new Formatter();

/**
 * Formats a part's XML, with the relationships that anything in it that refers to other parts adds to.
 */
const xmlifyPart = (file: File, content: XmlComponent, prettify: Prettify, relationships: Relationships, standalone = true): string =>
    stringifyXmlable(formatter.format(content, { viewWrapper: { View: content, Relationships: relationships }, file, stack: [] }), {
        indent: prettify,
        declaration: standalone ? { standalone: "yes", encoding: "UTF-8" } : { encoding: "UTF-8" },
    });

const xmlifyPackagePart = (
    file: File,
    part: PackagePart<PackagePartRelationshipType>,
    path: string,
    prettify: Prettify,
): readonly PackagePartFile[] => {
    const { content } = part.options;
    if (content instanceof Uint8Array) {
        return [{ data: content, path: `word/${path}` }];
    }

    if ("files" in content) {
        const embedded = zipFiles(
            content.files.map(({ path: filePath, content: fileContent }) => [
                filePath,
                fileContent instanceof Uint8Array ? fileContent : xmlifyPart(file, fileContent, prettify, new Relationships()),
            ]),
        );
        return [{ data: embedded, path: `word/${path}` }];
    }

    // Relationships added while the XML is written, such as to a chart's workbook, are relative to the part's folder
    const relationships = file.PackageParts.createRelationships(path);
    const data = xmlifyPart(file, content, prettify, relationships);
    const folder = path.slice(0, path.lastIndexOf("/"));
    const name = path.slice(path.lastIndexOf("/") + 1);
    return [
        { data, path: `word/${path}` },
        ...(relationships.RelationshipCount > 0
            ? [{ data: xmlifyPart(file, relationships, prettify, relationships, false), path: `word/${folder}/_rels/${name}.rels` }]
            : []),
    ];
};

/**
 * Writes the parts added to the package while the document's parts were written, such as charts. A part's XML can add
 * parts of its own, such as a chart's embedded workbook, so the parts added meanwhile are written after.
 *
 * @param from - How many of the parts have been written
 */
export const xmlifyPackageParts = (file: File, prettify: Prettify, from: number = 0): readonly PackagePartFile[] => {
    const parts = file.PackageParts.Array.slice(from);
    if (parts.length === 0) {
        return [];
    }
    return [
        ...parts.flatMap(({ part, path }) => xmlifyPackagePart(file, part, path, prettify)),
        ...xmlifyPackageParts(file, prettify, from + parts.length),
    ];
};
