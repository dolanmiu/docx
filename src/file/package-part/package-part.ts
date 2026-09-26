/**
 * Parts that something in a document adds to the package when it is written, such as a chart and its embedded workbook.
 *
 * Reference: http://officeopenxml.com/anatomyofOOXML.php
 *
 * @module
 */
import type { ContentTypes } from "@file/content-types/content-types";
import { Relationships } from "@file/relationships";
import type { RelationshipType } from "@file/relationships/relationship/relationship";
import type { IContext, XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

/**
 * A file of a package that is embedded in the document, such as a sheet of an embedded workbook.
 */
export type EmbeddedPackageFile = {
    /** The file's path in the embedded package, such as "xl/workbook.xml" */
    readonly path: string;
    /** The file's XML, formatted as the document's parts are, or its bytes */
    readonly content: XmlComponent | Uint8Array;
};

/**
 * Options for a {@link PackagePart}.
 */
export type PackagePartOptions = {
    /** The folder under word/ the part is written in, such as "charts" */
    readonly folder: string;
    /** The start of the part's file name, which is numbered in the order parts are added: "chart" for word/charts/chart1.xml */
    readonly name: string;
    /** The extension of the part's file name, such as "xml" */
    readonly extension: string;
    /** The part's content type, such as "application/vnd.openxmlformats-officedocument.drawingml.chart+xml" */
    readonly contentType: string;
    /** The type of the relationship to the part from the part that refers to it, such as the chart relationship */
    readonly relationshipType: RelationshipType;
    /**
     * The part's content: XML, formatted as the document's parts are, its bytes, or the files of a package, such as an
     * embedded workbook, which are zipped. XML can refer to other parts by calling their {@link PackagePart.addTo} when
     * it is formatted, as a document does
     */
    readonly content: XmlComponent | Uint8Array | { readonly files: readonly EmbeddedPackageFile[] };
};

// The folders under word/ that docx writes parts of its own in
const RESERVED_FOLDERS = new Set(["_rels", "fonts", "media", "theme"]);

/**
 * A part that something in a document adds to the package when it is written, such as a chart, with the relationship to
 * it from the part it is used in: the document, a header, a footer, the footnotes, the endnotes or the comments.
 *
 * The part is added once, however many times it is written, and parts are numbered in the order they are added, such
 * as word/charts/chart1.xml and word/charts/chart2.xml. The XML that refers to the part uses {@link relationshipId}, and
 * calls {@link addTo} from its `prepForXml`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * const chart = new PackagePart({
 *   folder: "charts",
 *   name: "chart",
 *   extension: "xml",
 *   contentType: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
 *   relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
 *   content: chartSpace,
 * });
 *
 * class ChartReference extends XmlComponent {
 *   public prepForXml(context: IContext): IXmlableObject | undefined {
 *     chart.addTo(context);
 *     return super.prepForXml(context);
 *   }
 * }
 * ```
 */
export class PackagePart {
    private readonly id = uniqueId();
    /** The id of the relationship to the part, such as a chart's `r:id` in the document */
    public readonly relationshipId = `rId${this.id}`;
    // The relationship lists the part has been added to, so writing a document twice doesn't add it twice
    private readonly addedTo = new WeakSet<object>();

    /**
     * @throws If the folder isn't a single folder name, or is one of the folders docx writes parts of its own in
     */
    public constructor(public readonly options: PackagePartOptions) {
        if (!/^[\w-]+$/.test(options.folder) || RESERVED_FOLDERS.has(options.folder)) {
            throw new Error(`Invalid package part folder "${options.folder}". Expected a folder name docx doesn't use, such as "charts"`);
        }
    }

    /**
     * Adds the part to the package being written, once, and a relationship to it from the part being written.
     *
     * @throws When the document is being patched: `patchDocument` can't add parts to a package yet
     */
    public addTo(context: IContext): void {
        // patchDocument formats patches with a stand-in file, which has no package parts
        const parts = context.file.PackageParts as PackageParts | undefined;
        if (parts === undefined) {
            throw new Error("patchDocument can't add parts to a document yet, such as a chart's. Add charts with a new Document");
        }

        const path = parts.add(this);
        const relationships = context.viewWrapper.Relationships;
        if (this.addedTo.has(relationships)) {
            return;
        }
        this.addedTo.add(relationships);
        relationships.addRelationship(this.id, this.options.relationshipType, parts.getTarget(relationships, path));
    }
}

/**
 * The parts added to a document's package when it is written, with their paths under word/, in the order they were
 * added. Not part of the public API: `File` holds one, and the compiler writes its parts.
 */
export class PackageParts {
    private readonly paths = new Map<PackagePart, string>();
    // The folders of the parts whose XML is being written, by the relationships the XML is formatted with
    private readonly folders = new WeakMap<Relationships, string>();

    public constructor(private readonly contentTypes: ContentTypes) {}

    /**
     * Adds a part, and its content type, once.
     *
     * @returns The part's path under word/, such as "charts/chart1.xml"
     */
    public add(part: PackagePart): string {
        const added = this.paths.get(part);
        if (added !== undefined) {
            return added;
        }

        const { folder, name, extension, contentType } = part.options;
        // Numbered after the parts already added with the same folder and name
        const count = [...this.paths.keys()].filter(({ options }) => options.folder === folder && options.name === name).length;
        const path = `${folder}/${name}${count + 1}.${extension}`;
        // eslint-disable-next-line functional/immutable-data
        this.paths.set(part, path);
        this.contentTypes.addOverride(contentType, `/word/${path}`);
        return path;
    }

    /**
     * Each part added, with its path under word/, in the order they were added.
     */
    public get Array(): readonly { readonly part: PackagePart; readonly path: string }[] {
        return [...this.paths].map(([part, path]) => ({ part, path }));
    }

    /**
     * Creates the relationships of a part whose XML is being written, so the parts its XML refers to are found from its
     * folder.
     *
     * @param path - The part's path under word/
     */
    public createRelationships(path: string): Relationships {
        const relationships = new Relationships();
        this.folders.set(relationships, path.slice(0, path.indexOf("/")));
        return relationships;
    }

    /**
     * The target of a relationship to a part, relative to the part the relationships are from. The document, headers,
     * footers, footnotes, endnotes and comments are all in word/.
     *
     * @param path - The part's path under word/
     */
    public getTarget(relationships: Relationships, path: string): string {
        const from = this.folders.get(relationships);
        if (from === undefined) {
            return path;
        }
        return path.startsWith(`${from}/`) ? path.slice(from.length + 1) : `../${path}`;
    }
}
