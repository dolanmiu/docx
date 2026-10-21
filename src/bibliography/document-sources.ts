/**
 * A document's sources: the part Word keeps them in, and the sources as its citations and bibliographies write them,
 * numbered in the order the document cites them.
 *
 * @module
 */
import { BuilderElement, type File, type IContext, type IXmlableObject, XmlComponent } from "docx";

import { type CitedSourceOptions, citationOrderOf } from "./format";
import type { Source } from "./source";
import type { StyleDefinition } from "./styles/style";
import { type WordSource, createSourceXml, wordSourceOf } from "./word-source";

const BIBLIOGRAPHY_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/bibliography";

/** The sources each citation cites, by the citation, which a document's citations are found by */
export const citedSourcesOf = new WeakMap<object, readonly CitedSourceOptions[]>();

/**
 * The tags of the sources the document's citations cite, in the order they are in its parts: its body, footnotes,
 * endnotes, headers and footers.
 *
 * A component can keep its children in any of its properties, such as a hyperlink's options or a footnote's first
 * paragraph, until it is written, so each property of each component is looked in, in order, and each object once.
 */
const citedTagsOf = (file: File): readonly string[] => {
    const visited = new WeakSet<object>();
    const visit = (value: unknown): readonly string[] => {
        if (typeof value !== "object" || value === null || visited.has(value) || ArrayBuffer.isView(value)) {
            return [];
        }
        visited.add(value);
        const cited = citedSourcesOf.get(value);
        if (cited) {
            return cited.map(({ source }) => source);
        }
        return (Array.isArray(value) ? value : Object.values(value)).flatMap(visit);
    };
    return [
        file.Document.View,
        file.FootNotes.View,
        file.Endnotes.View,
        ...file.Headers.map((header) => header.View),
        ...file.Footers.map((footer) => footer.View),
    ].flatMap(visit);
};

/** A document's sources, as its citations and bibliographies write them, and the style they're written in */
export type DocumentSources = {
    readonly style: StyleDefinition;
    readonly sources: readonly WordSource[];
};

/**
 * A document's sources and the style they're written in, for the document's `bibliography`: the part Word keeps them
 * in (customXml/item1.xml), which `createBibliography` makes.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Sources">
 *   <xsd:sequence>
 *     <xsd:element name="Source" type="CT_SourceType" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="SelectedStyle" type="s:ST_String"/>
 *   <xsd:attribute name="StyleName" type="s:ST_String"/>
 *   <xsd:attribute name="URI" type="s:ST_String"/>
 * </xsd:complexType>
 * ```
 */
export class BibliographySources extends XmlComponent {
    // Each document's sources, numbered in the order it cites them
    private readonly documents = new WeakMap<File, DocumentSources>();

    /**
     * @throws If a source has no tag, or the same tag as another, or both people and an organization in one role
     */
    public constructor(
        public readonly style: StyleDefinition,
        public readonly sources: readonly Source[],
    ) {
        super("b:Sources");
        for (const source of sources) {
            wordSourceOf(source, 0);
        }
        const repeated = sources.find((source, index) => sources.findIndex(({ tag }) => tag === source.tag) !== index);
        if (repeated) {
            throw new Error(`Two of the bibliography's sources have the tag "${repeated.tag}". Give each source a tag of its own`);
        }
    }

    /** The document's sources, numbered in the order it cites them */
    public sourcesOf(file: File): DocumentSources {
        const known = this.documents.get(file);
        if (known) {
            return known;
        }
        const order = citationOrderOf(
            this.sources.map(({ tag }) => tag),
            citedTagsOf(file),
        );
        const sources = { style: this.style, sources: this.sources.map((source) => wordSourceOf(source, order.get(source.tag)!)) };
        this.documents.set(file, sources);
        return sources;
    }

    /**
     * Written with the file of Word's style after a backslash, as Word for Windows writes it (Word for Mac writes a slash,
     * and reads either), its name and version, and each source, with the order the document cites it in.
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        return new BuilderElement<{
            readonly selectedStyle: string;
            readonly styleName: string;
            readonly version: string;
            readonly prefix: string;
            readonly namespace: string;
        }>({
            name: "b:Sources",
            attributes: {
                selectedStyle: { key: "SelectedStyle", value: `\\${this.style.file}` },
                styleName: { key: "StyleName", value: this.style.name },
                version: { key: "Version", value: this.style.version },
                prefix: { key: "xmlns:b", value: BIBLIOGRAPHY_NAMESPACE },
                namespace: { key: "xmlns", value: BIBLIOGRAPHY_NAMESPACE },
            },
            children: this.sourcesOf(context.file).sources.map(createSourceXml),
        }).prepForXml(context);
    }
}

/**
 * The sources of the document being written, which its citations and bibliographies write.
 *
 * @throws If the document has no bibliography, or one that `createBibliography` didn't make
 */
export const documentSourcesOf = (context: IContext): DocumentSources => {
    const sources = context.file.Bibliography?.sources;
    if (!(sources instanceof BibliographySources)) {
        throw new Error(
            "A citation or a bibliography needs the document's sources. Give the Document `bibliography: createBibliography({ sources })` from docx/bibliography",
        );
    }
    return sources.sourcesOf(context.file);
};
