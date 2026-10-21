/**
 * Bibliographies: the list of a document's sources, in the style of its citations, as Word's References > Bibliography
 * inserts it.
 *
 * @module
 */
import {
    BuilderElement,
    FileChild,
    type IContext,
    type IParagraphOptions,
    type IXmlableObject,
    Paragraph,
    TextRun,
    type XmlComponent,
} from "docx";

import { documentSourcesOf } from "./document-sources";
import { createFieldRuns, runsOf } from "./field";
import { formatBibliography } from "./format";
import type { FormattedText } from "./styles/formatted-text";

/** What Word writes, in bold, in a bibliography of a document with no sources */
const NO_SOURCES = "Invalid source specified.";

/**
 * Options for a {@link Bibliography}.
 *
 * @publicApi
 */
export type BibliographyOptions = {
    /**
     * A heading above the list, such as "References" or "Works Cited", in the Heading 1 style, as Word's built-in
     * bibliographies have. Without one, the bibliography is the list alone, as Word's Insert Bibliography inserts it
     */
    readonly title?: string;
};

/** A paragraph with the runs given */
const paragraphOf = (children: readonly XmlComponent[], options: IParagraphOptions = {}): Paragraph => {
    const paragraph = new Paragraph(options);
    for (const child of children) {
        paragraph.addChildElement(child);
    }
    return paragraph;
};

/**
 * An entry's paragraph, in the Bibliography style, with the lines after its first indented half an inch if the style's
 * are. Its mark is kept out of spelling and grammar checks, as its runs are
 */
const entryOf = (children: readonly XmlComponent[], hangingIndent = false): Paragraph =>
    paragraphOf(children, {
        style: "Bibliography",
        ...(hangingIndent ? { indent: { left: 720, hanging: 720 } } : {}),
        run: { noProof: true },
    });

const tableCellSpacing = (): XmlComponent =>
    new BuilderElement<{ readonly width: number; readonly type: string }>({
        name: "w:tblCellSpacing",
        attributes: { width: { key: "w:w", value: 15 }, type: { key: "w:type", value: "dxa" } },
    });

const cellOf = (width: { readonly width: number; readonly type: string }, text: FormattedText): XmlComponent =>
    new BuilderElement({
        name: "w:tc",
        children: [
            new BuilderElement({
                name: "w:tcPr",
                children: [
                    new BuilderElement<{ readonly width: number; readonly type: string }>({
                        name: "w:tcW",
                        attributes: { width: { key: "w:w", value: width.width }, type: { key: "w:type", value: width.type } },
                    }),
                    new BuilderElement({ name: "w:hideMark" }),
                ],
            }),
            entryOf(runsOf(text)),
        ],
    });

/**
 * A bibliography of numbered sources, as Word writes IEEE's: a table as wide as the text, of each source's number and
 * its entry, the number's column as narrow as its numbers.
 */
const tableOf = (rows: readonly (readonly [FormattedText, FormattedText])[]): XmlComponent => {
    const margin = (side: string): XmlComponent =>
        new BuilderElement<{ readonly width: number; readonly type: string }>({
            name: `w:${side}`,
            attributes: { width: { key: "w:w", value: 15 }, type: { key: "w:type", value: "dxa" } },
        });
    return new BuilderElement({
        name: "w:tbl",
        children: [
            new BuilderElement({
                name: "w:tblPr",
                children: [
                    new BuilderElement<{ readonly width: number; readonly type: string }>({
                        name: "w:tblW",
                        attributes: { width: { key: "w:w", value: 5000 }, type: { key: "w:type", value: "pct" } },
                    }),
                    tableCellSpacing(),
                    new BuilderElement({ name: "w:tblCellMar", children: ["top", "left", "bottom", "right"].map(margin) }),
                    new BuilderElement<{
                        readonly value: string;
                        readonly firstRow: number;
                        readonly lastRow: number;
                        readonly firstColumn: number;
                        readonly lastColumn: number;
                        readonly noHBand: number;
                        readonly noVBand: number;
                    }>({
                        name: "w:tblLook",
                        attributes: {
                            value: { key: "w:val", value: "04A0" },
                            firstRow: { key: "w:firstRow", value: 1 },
                            lastRow: { key: "w:lastRow", value: 0 },
                            firstColumn: { key: "w:firstColumn", value: 1 },
                            lastColumn: { key: "w:lastColumn", value: 0 },
                            noHBand: { key: "w:noHBand", value: 0 },
                            noVBand: { key: "w:noVBand", value: 1 },
                        },
                    }),
                ],
            }),
            // The columns' widths Word gives them in a page of A4 or Letter, which Word works out again from the cells'
            new BuilderElement({
                name: "w:tblGrid",
                children: [409, 8617].map(
                    (width) =>
                        new BuilderElement<{ readonly width: number }>({
                            name: "w:gridCol",
                            attributes: { width: { key: "w:w", value: width } },
                        }),
                ),
            }),
            ...rows.map(
                ([label, entry]) =>
                    new BuilderElement({
                        name: "w:tr",
                        children: [
                            new BuilderElement({ name: "w:trPr", children: [tableCellSpacing()] }),
                            cellOf({ width: 50, type: "pct" }, label),
                            cellOf({ width: 0, type: "auto" }, entry),
                        ],
                    }),
            ),
        ],
    });
};

/**
 * The bibliography's content control and its BIBLIOGRAPHY field, whose result is the document's sources in the style of
 * its citations. The field starts in the first paragraph and ends in a paragraph of its own after the last, as Word
 * writes it.
 */
const createBibliographyControl = (context: IContext): XmlComponent => {
    const { style, sources } = documentSourcesOf(context);
    const bibliography = formatBibliography(style, sources);
    const [begin, instruction, separate, end] = createFieldRuns(" BIBLIOGRAPHY ", []);
    const fieldStart = [begin, instruction, separate];
    // With no sources, Word writes the field and what it says, in bold, in one paragraph with no style
    const content =
        sources.length === 0
            ? [paragraphOf([...fieldStart, ...runsOf([{ text: NO_SOURCES, bold: true }]), end])]
            : "rows" in bibliography
              ? // The field starts in a paragraph of its own before a table, with no style, and an empty paragraph follows
                // the table before the one the field ends in
                [
                    paragraphOf(fieldStart, { run: { noProof: true } }),
                    tableOf(bibliography.rows),
                    paragraphOf([], { run: { noProof: true } }),
                    paragraphOf([end]),
                ]
              : [
                    ...bibliography.paragraphs.map((entry, index) =>
                        entryOf([...(index === 0 ? fieldStart : []), ...runsOf(entry)], bibliography.hangingIndent),
                    ),
                    // The field ends in a paragraph of its own, with no style
                    paragraphOf([end]),
                ];
    return new BuilderElement({
        name: "w:sdt",
        children: [
            new BuilderElement({ name: "w:sdtPr", children: [new BuilderElement({ name: "w:bibliography" })] }),
            new BuilderElement({ name: "w:sdtContent", children: content }),
        ],
    });
};

/**
 * A bibliography: the list of the document's sources, in the style of its citations, as Word's References >
 * Bibliography inserts it. It lists every source of the document's bibliography, cited or not, and Word writes it again
 * when it updates the document's fields, or when the style is changed.
 *
 * The document needs its sources: give it `bibliography: createBibliography({ sources })`.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // As Word's built-in "References" bibliography: a heading, then the list
 * new Bibliography({ title: "References" });
 * ```
 */
export class Bibliography extends FileChild {
    public constructor(private readonly options: BibliographyOptions = {}) {
        super("w:sdt");
    }

    /**
     * With a title, written as Word's built-in bibliographies are, in a content control of Word's Bibliographies gallery,
     * with the title as a Heading 1 before the bibliography's own content control. Without one, it is that content
     * control alone
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        const list = createBibliographyControl(context);
        if (this.options.title === undefined) {
            return list.prepForXml(context);
        }
        return new BuilderElement({
            name: "w:sdt",
            children: [
                new BuilderElement({
                    name: "w:sdtPr",
                    children: [
                        new BuilderElement({
                            name: "w:docPartObj",
                            children: [
                                new BuilderElement<{ readonly value: string }>({
                                    name: "w:docPartGallery",
                                    attributes: { value: { key: "w:val", value: "Bibliographies" } },
                                }),
                                new BuilderElement({ name: "w:docPartUnique" }),
                            ],
                        }),
                    ],
                }),
                new BuilderElement({
                    name: "w:sdtContent",
                    children: [new Paragraph({ style: "Heading1", children: [new TextRun(this.options.title)] }), list],
                }),
            ],
        }).prepForXml(context);
    }
}
