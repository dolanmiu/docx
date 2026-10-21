/**
 * Citations: references in the text to one or more of a document's sources, such as "(Baker, 2010)", as Word's
 * References > Insert Citation inserts them.
 *
 * @module
 */
import { BuilderElement, type IContext, type IXmlableObject, Run, XmlComponent } from "docx";

import { citedSourcesOf, documentSourcesOf } from "./document-sources";
import { createFieldRuns, runsOf } from "./field";
import { type CitedSourceOptions, formatCitation } from "./format";

/** A field's value in its instruction: in quotes, with the quotes and backslashes in it escaped, as Word writes one */
const quoted = (value: string): string => `"${value.replace(/[\\"]/g, "\\$&")}"`;

/** A source's tag in a field's instruction: as it is, unless it has a space or a quote in it */
const tagOf = (tag: string): string => (/[\s"\\]/.test(tag) ? quoted(tag) : tag);

/** The switches of a source of a citation, after its tag */
const switchesOf = ({ pages, volume, prefix, suffix, hideAuthor, hideYear, hideTitle }: CitedSourceOptions): readonly string[] => [
    ...(prefix !== undefined ? [`\\f ${quoted(prefix)}`] : []),
    ...(suffix !== undefined ? [`\\s ${quoted(suffix)}`] : []),
    ...(pages !== undefined ? [`\\p ${quoted(pages)}`] : []),
    ...(volume !== undefined ? [`\\v ${quoted(volume)}`] : []),
    ...(hideAuthor ? ["\\n"] : []),
    ...(hideYear ? ["\\y"] : []),
    ...(hideTitle ? ["\\t"] : []),
];

/**
 * A citation's field instruction, such as ` CITATION Dic06 \p "50" \l 1033 `: the first source's tag and switches, the
 * language, English, and each other source after `\m`.
 */
export const citationInstructionOf = (cited: readonly CitedSourceOptions[]): string =>
    ` CITATION ${cited
        .map((source, index) =>
            [
                index === 0 ? tagOf(source.source) : `\\m ${tagOf(source.source)}`,
                ...switchesOf(source),
                ...(index === 0 ? ["\\l 1033"] : []),
            ].join(" "),
        )
        .join("  ")} `;

/**
 * The citation as Word writes it: a citation content control, with a CITATION field, whose result is the citation in
 * the style of the document's bibliography.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SdtRun">
 *   <xsd:sequence>
 *     <xsd:element name="sdtPr" type="CT_SdtPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="sdtEndPr" type="CT_SdtEndPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="sdtContent" type="CT_SdtContentRun" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
class CitationContentControl extends XmlComponent {
    public constructor(private readonly cited: readonly CitedSourceOptions[]) {
        super("w:sdt");
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        const { style, sources } = documentSourcesOf(context);
        return new BuilderElement({
            name: "w:sdt",
            children: [
                new BuilderElement({ name: "w:sdtPr", children: [new BuilderElement({ name: "w:citation" })] }),
                new BuilderElement({
                    name: "w:sdtContent",
                    children: createFieldRuns(citationInstructionOf(this.cited), runsOf(formatCitation(style, sources, this.cited))),
                }),
            ],
        }).prepForXml(context);
    }
}

/**
 * A citation of one or more of the document's sources, by their tags, such as "(Baker, 2010)" in APA, as Word's
 * References > Insert Citation inserts it. It is written in the style of the document's bibliography, and Word writes
 * it again when it updates the document's fields, or when the style is changed.
 *
 * The document needs its sources: give it `bibliography: createBibliography({ sources })`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new Paragraph({ children: [new TextRun("Pizza is older than you think "), new Citation("Bak10")] });
 *
 * // Pages, and text before the citation
 * new Citation({ source: "Bak10", pages: "50", prefix: "see " });
 *
 * // Two sources, as one citation: "(Baker, 2010; Evans, 2019, p. 20)"
 * new Citation(["Bak10", { source: "Eva19", pages: "20" }]);
 * ```
 */
export class Citation extends Run {
    private readonly cited: readonly CitedSourceOptions[];

    /**
     * @param cited - The source cited, by its tag, or with how it is cited, or several sources, cited together
     * @throws If no source is cited
     */
    public constructor(cited: string | CitedSourceOptions | readonly (string | CitedSourceOptions)[]) {
        super({});
        const list = (Array.isArray(cited) ? cited : [cited]) as readonly (string | CitedSourceOptions)[];
        if (list.length === 0) {
            throw new Error('A citation cites no source. Give it the tag of the source it cites, such as "Dic06"');
        }
        this.cited = list.map((source) => (typeof source === "string" ? { source } : source));
        citedSourcesOf.set(this, this.cited);
    }

    /** Written as Word's citation content control, in place of a run */
    public override get writtenAs(): readonly XmlComponent[] {
        return [new CitationContentControl(this.cited)];
    }
}
