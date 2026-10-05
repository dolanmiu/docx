import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Table, TableCell, TableRow, WidthType } from "@file/table";
import {
    AlignmentType,
    Bookmark,
    BorderStyle,
    ColumnBreak,
    DayLong,
    Document,
    EmphasisMarkType,
    EndnoteReferenceRun,
    type EstimatedPageNumbers,
    FootnoteReferenceRun,
    FrameAnchorType,
    Header,
    HeadingLevel,
    type IContext,
    type IFrameOptions,
    type IPropertiesOptions,
    type IXmlableObject,
    ImageRun,
    LineRuleType,
    NumberFormat,
    Packer,
    PageBreak,
    PageNumber,
    PageNumberElement,
    type PageNumberEstimator,
    PageNumberSeparator,
    PageReference,
    Paragraph,
    PatchType,
    SectionType,
    SimpleField,
    TabStopType,
    TableOfContents,
    type TemplatePageNumberEstimator,
    TextRun,
    patchDocument,
} from "docx";
import { buildTestFont, buildTestFontCollection, tableOffset } from "tests/font-file";

import { estimatePageNumbers, estimatePageNumbersWith } from "./estimate-page-numbers";
import { layoutDocument } from "./layout-document";
import type { FontToMeasure } from "./measure-width";

const contextOf = (file: File): IContext => ({ file, viewWrapper: file.Document, stack: [] }) as unknown as IContext;

/** The page numbers a document is written with */
const estimateOf = (options: IPropertiesOptions, estimator: PageNumberEstimator = estimatePageNumbers): EstimatedPageNumbers => {
    let estimate: EstimatedPageNumbers = { bookmarks: new Map() };
    const file = new File({
        ...options,
        pageNumbers: (body, context) => {
            estimate = estimator(body, context);
            return estimate;
        },
    });
    new Formatter().format(file.Document.View, contextOf(file));
    return estimate;
};

const pageNumbersOf = (options: IPropertiesOptions, estimator?: PageNumberEstimator): Record<string, string> =>
    Object.fromEntries(estimateOf(options, estimator).bookmarks);

// A text frame, which the layout doesn't follow yet
const FRAME: IFrameOptions = {
    type: "absolute",
    position: { x: 1000, y: 1000 },
    width: 2000,
    height: 1000,
    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
};
// A border round a text frame's paragraph, which takes room beside it in a way not yet followed
const FRAME_BORDER = { top: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "auto" } } as const;

const heading = (text: string, bookmark: string): Paragraph =>
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new Bookmark({ id: bookmark, children: [new TextRun(text)] })] });

/**
 * The document of a template with a page reference and a number of pages, once patchDocument has filled it in with two
 * pages of chapters, with the page numbers the estimator works out
 */
const patchedTemplateOf = async (pageNumbers: TemplatePageNumberEstimator): Promise<string> => {
    const template = await Packer.toBuffer(
        new Document({
            sections: [
                {
                    children: [
                        new Paragraph({ children: [new TextRun("The end is on page "), new PageReference("end")] }),
                        new Paragraph("{{chapters}}"),
                        heading("The end", "end"),
                        new Paragraph({ children: [new TextRun({ children: ["Pages: ", PageNumber.TOTAL_PAGES] })] }),
                    ],
                },
            ],
        }),
    );
    const patched = await patchDocument({
        outputType: "nodebuffer",
        data: template,
        patches: {
            chapters: {
                type: PatchType.DOCUMENT,
                children: [1, 2].map((chapter) => new Paragraph({ children: [new TextRun(`Chapter ${chapter}`), new PageBreak()] })),
            },
        },
        pageNumbers,
    });
    return (await JSZip.loadAsync(patched)).file("word/document.xml")!.async("text");
};

/** The results written into the fields of a document */
const resultsOf = (document: string): readonly string[] =>
    [...document.matchAll(/<w:fldChar w:fldCharType="separate"\/><w:t xml:space="preserve">([^<]*)<\/w:t>/g)].map(([, result]) => result);

/** The text of each paragraph of a document, with what is written in its fields, from its XML */
const paragraphTexts = (document: string): readonly string[] =>
    document
        .split("</w:p>")
        .map((paragraph) => [...paragraph.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map(([, text]) => text).join(""));

// Calibri 11, single spaced, on A4 with 1440 margins: 51 lines to a page, as the probes of word-watertight-*.ts are laid out
const PROBE_STYLES: IPropertiesOptions["styles"] = {
    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    paragraphStyles: [
        { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
    ],
};

/**
 * The probes of scripts/layout-probes/word-watertight-fields.ts, FD1 to FD4: page references to a bookmark across two pages,
 * with \\p, in formats of their own and to a bookmark in a footnote, and numbers of pages in a format of their own, each
 * with the page it is on
 */
const fieldsProbe = (): IPropertiesOptions => {
    const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
    const fill = (probe: string, count: number): readonly Paragraph[] =>
        Array.from({ length: count }, (_, index) => line(`${probe} fill ${index + 1}`));
    const reference = (label: string, bookmark: string, switches = ""): Paragraph =>
        new Paragraph({
            children: [
                new TextRun(`${label} `),
                ...(switches === "" ? [new PageReference(bookmark)] : [new SimpleField(`PAGEREF ${bookmark} ${switches}`, "?")]),
                new TextRun({ children: [" on page ", PageNumber.CURRENT] }),
            ],
        });
    const target = (id: string, text: string): Paragraph =>
        new Paragraph({ children: [new Bookmark({ id, children: [new TextRun(text)] })] });
    return {
        styles: PROBE_STYLES,
        footnotes: { 1: { children: [target("fd4note", "FD4 bookmark in the footnote")] } },
        sections: [
            {
                children: [
                    ...fill("FD1", 50),
                    new Paragraph({
                        widowControl: false,
                        children: [
                            new Bookmark({
                                id: "fd1span",
                                children: [new TextRun("FD1 bookmark starts"), new TextRun({ text: "FD1 bookmark ends", break: 1 })],
                            }),
                        ],
                    }),
                    ...fill("FD1 after", 60),
                    reference("FD1 reference", "fd1span"),
                ],
            },
            {
                children: [
                    reference("FD2 above", "fd2target", "\\p"),
                    ...fill("FD2", 10),
                    target("fd2target", "FD2 target"),
                    reference("FD2 below", "fd2target", "\\p"),
                    ...fill("FD2 after", 50),
                    reference("FD2 other page", "fd2target", "\\p"),
                ],
            },
            {
                children: [
                    ...fill("FD3", 51 * 4),
                    target("fd3target", "FD3 target"),
                    reference("FD3 roman", "fd3target", "\\* roman"),
                    reference("FD3 ALPHABETIC", "fd3target", "\\* ALPHABETIC"),
                    reference("FD3 Ordinal", "fd3target", "\\* Ordinal"),
                    reference("FD3 picture", "fd3target", '\\# "00"'),
                    new Paragraph({ children: [new TextRun("FD3 numpages roman "), new SimpleField("NUMPAGES \\* roman", "?")] }),
                    new Paragraph({ children: [new TextRun("FD3 sectionpages roman "), new SimpleField("SECTIONPAGES \\* roman", "?")] }),
                ],
            },
            {
                children: [
                    new Paragraph({ children: [new TextRun("FD4 note here"), new FootnoteReferenceRun(1)] }),
                    ...fill("FD4", 60),
                    reference("FD4 reference", "fd4note"),
                ],
            },
        ],
    };
};

/**
 * The probes of scripts/layout-probes/word-page-fields.ts, PF1 to PF8: page references with \\p across columns and table
 * cells, to pages in roman numerals or with chapter numbers, with capitals and number formats; formats, capitals and
 * pictures of page references, numbers of pages and page numbers; PAGE and SECTION fields and page number blocks in the
 * body, a footnote, a footnote continued on the next page, and an endnote; and bookmarks in them. Without PF8f and PF8g,
 * page references with \\p in a footnote, which the layout stops at
 */
const pageFieldsProbe = (): IPropertiesOptions => {
    type Child = string | TextRun | Bookmark | SimpleField | FootnoteReferenceRun | EndnoteReferenceRun | ColumnBreak;
    const line = (...children: readonly Child[]): Paragraph =>
        new Paragraph({ children: children.map((child) => (typeof child === "string" ? new TextRun(child) : child)) });
    const fill = (name: string, count: number): readonly Paragraph[] =>
        Array.from({ length: count }, (_, i) => line(`${name} fill ${i + 1}`));
    const field = (instruction: string): SimpleField => new SimpleField(instruction, "?");
    const probe = (name: string, instruction: string): Paragraph => line(`${name} `, field(instruction), " end");
    const target = (id: string, text: string): Bookmark => new Bookmark({ id, children: [new TextRun(text)] });
    const page = (): TextRun => new TextRun({ children: [PageNumber.CURRENT] });
    const pageBlock = (): TextRun => new TextRun({ children: [new PageNumberElement()] });
    const cell = (...children: readonly Paragraph[]): TableCell =>
        new TableCell({ width: { size: 4513, type: WidthType.DXA }, children: [...children] });
    return {
        styles: {
            default: PROBE_STYLES.default,
            paragraphStyles: [
                { id: "Heading1", name: "heading 1", run: { size: 22 }, paragraph: { numbering: { reference: "chapter", level: 0 } } },
                ...PROBE_STYLES.paragraphStyles!,
                { id: "EndnoteText", name: "endnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "chapter",
                    levels: [{ level: 0, format: "decimal", text: "Chapter %1", start: 1, alignment: AlignmentType.LEFT }],
                },
            ],
        },
        footnotes: {
            1: { children: [line(target("pf8c", "PF8 bookmark c"))] },
            2: {
                children: [line(target("pf8d", "PF8 bookmark d")), line("PF7g note page ", page(), " section ", field("SECTION"), " end")],
            },
            3: {
                children: [
                    line("PF7h first part page ", page(), " section ", field("SECTION"), " end"),
                    ...fill("PF8 long note", 36),
                    line(target("pf8a", "PF8 bookmark a")),
                    line("PF7h rest page ", page(), " section ", field("SECTION"), " end"),
                ],
            },
        },
        endnotes: {
            1: {
                children: [
                    line(target("pf8b", "PF8 bookmark b")),
                    line("PF7i endnote page ", page(), " section ", field("SECTION"), " end"),
                ],
            },
        },
        sections: [
            {
                properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
                children: [
                    probe("PF3a", "PAGEREF pf3 \\p"),
                    probe("PF3b", "PAGEREF pf3 \\p \\* Upper"),
                    probe("PF3c", "PAGEREF pf3 \\p \\* Arabic"),
                    probe("PF3e", "PAGEREF pf3chapter \\p"),
                    probe("PF4a", "PAGEREF pf3 \\* Arabic"),
                    probe("PF4b", "PAGEREF pf3 \\* ALPHABETIC"),
                    probe("PF4c", "PAGEREF pf3 \\* roman"),
                    probe("PF4d", "PAGEREF pf3chapter \\* roman"),
                    probe("PF4e", "PAGEREF pf3chapter \\* Arabic"),
                    probe("PF5a", "PAGEREF pf5 \\* roman \\* Upper"),
                    probe("PF5b", "PAGEREF pf5 \\* ALPHABETIC \\* Lower"),
                    probe("PF5c", "PAGEREF pf5 \\* Ordinal \\* Upper"),
                    probe("PF5d", "PAGEREF pf5 \\* Ordinal \\* FirstCap"),
                    probe("PF5e", 'PAGEREF pf5 \\# "00"'),
                    probe("PF5f", 'PAGEREF pf5 \\# "000"'),
                    probe("PF5g", 'PAGEREF pf5 \\# "0"'),
                    probe("PF5h", 'PAGEREF pf5 \\# "#"'),
                    probe("PF5i", 'PAGEREF pf1234 \\# "#,##0"'),
                    probe("PF5j", 'PAGEREF pf1234 \\# "00"'),
                    probe("PF5k", "PAGEREF pf5 \\* Arabic \\* MERGEFORMAT"),
                    probe("PF6a", "NUMPAGES \\* Arabic \\* MERGEFORMAT"),
                    probe("PF6b", "NUMPAGES \\* ALPHABETIC"),
                    probe("PF6c", 'NUMPAGES \\# "000"'),
                    probe("PF6d", "SECTIONPAGES \\* Ordinal"),
                    probe("PF7a", "PAGE \\* roman"),
                    probe("PF7b", 'PAGE \\# "00"'),
                    probe("PF8a", "PAGEREF pf8a"),
                    probe("PF8b", "PAGEREF pf8b"),
                    probe("PF8c", "PAGEREF pf8c"),
                ],
            },
            {
                properties: { column: { count: 2, space: 720 } },
                children: [
                    ...fill("PF1 first", 4),
                    probe("PF1b", "PAGEREF pf1two \\p"),
                    ...fill("PF1 first more", 4),
                    line(target("pf1one", "PF1 target one")),
                    ...fill("PF1 first after", 5),
                    line(new ColumnBreak()),
                    ...fill("PF1 second", 4),
                    probe("PF1a", "PAGEREF pf1one \\p"),
                    ...fill("PF1 second more", 14),
                    line(target("pf1two", "PF1 target two")),
                ],
            },
            {
                children: [
                    new Table({
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [4513, 4513],
                        rows: [
                            new TableRow({
                                children: [
                                    cell(line(target("pf2a", "PF2 target a"))),
                                    cell(probe("PF2a", "PAGEREF pf2a \\p"), line(target("pf2b", "PF2 target b"))),
                                ],
                            }),
                            new TableRow({ children: [cell(probe("PF2b", "PAGEREF pf2b \\p")), cell(line("PF2 cell"))] }),
                        ],
                    }),
                ],
            },
            {
                properties: { page: { pageNumbers: { start: 4, formatType: NumberFormat.LOWER_ROMAN } } },
                children: [
                    line(target("pf3", "PF3 target")),
                    probe("PF3d", "PAGEREF pf3 \\p \\* Upper"),
                    probe("PF7c", "PAGE \\* Arabic"),
                    line("PF7d ", pageBlock(), " end"),
                    probe("PF7f", "SECTION \\* roman"),
                ],
            },
            {
                properties: {
                    page: {
                        pageNumbers: {
                            start: 1,
                            formatType: NumberFormat.DECIMAL,
                            chapterHeadingLevel: 1,
                            separator: PageNumberSeparator.HYPHEN,
                        },
                    },
                },
                children: [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("PF chapter heading")] }),
                    ...fill("PF chapter", 55),
                    line(target("pf3chapter", "PF3 chapter target")),
                    line("PF7e ", pageBlock(), " end"),
                    line("PF8 chapter note", new FootnoteReferenceRun(1)),
                ],
            },
            {
                properties: { page: { pageNumbers: { start: 5, formatType: NumberFormat.DECIMAL } } },
                children: [line(target("pf5", "PF5 target")), line("PF8 endnote", new EndnoteReferenceRun(1))],
            },
            {
                properties: { page: { pageNumbers: { start: 1234, formatType: NumberFormat.DECIMAL } } },
                children: [line(target("pf1234", "PF5 target 1234"))],
            },
            {
                properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
                children: [
                    probe("PF8d", "PAGEREF pf8d \\p"),
                    ...fill("PF8", 3),
                    line("PF8 short note", new FootnoteReferenceRun(2)),
                    line(target("pf8body", "PF8 body target")),
                    probe("PF8e", "PAGEREF pf8d \\p"),
                    ...fill("PF8 more", 20),
                    line("PF8 long note", new FootnoteReferenceRun(3)),
                    ...fill("PF8 after", 40),
                ],
            },
        ],
    };
};

/** The lines of a document written with the page numbers estimatePageNumbers works out whose text starts with a probe's name */
const probeLines = async (options: IPropertiesOptions, probe: RegExp): Promise<readonly string[]> => {
    const written = await Packer.toBuffer(new Document({ ...options, pageNumbers: estimatePageNumbers }));
    const document = await (await JSZip.loadAsync(written)).file("word/document.xml")!.async("text");
    expect(document).not.to.include("w:dirty");
    return paragraphTexts(document).filter((text) => probe.test(text));
};

describe("estimatePageNumbers", () => {
    it("should squeeze one more word onto the lines of a justified paragraph, as Word does, which can bring a heading back a page", () => {
        // Word squeezed "coast" onto the line of word-justify.docx's J10_02, which is 9026 twips wide, less its indent of
        // 709: a paragraph of one line justified, and two left-aligned. 30 of them, on pages of 51 lines
        const paragraphs = (alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]): readonly Paragraph[] =>
            Array.from(
                { length: 30 },
                () =>
                    new Paragraph({
                        alignment,
                        indent: { right: 709 },
                        children: [
                            new TextRun("J10_02 the survey of the coast was made in the summer by boat and on foot from the to coast"),
                        ],
                    }),
            );
        const document = (alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]): IPropertiesOptions => ({
            styles: {
                default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
            },
            sections: [{ children: [...paragraphs(alignment), heading("End", "end")] }],
        });
        expect(pageNumbersOf(document(AlignmentType.JUSTIFIED))).to.deep.include({ end: "1" });
        expect(pageNumbersOf(document())).to.deep.include({ end: "2" });
        // With an en space among its spaces, which Word hasn't been seen squeezing, the line stops the layout
        const enSpace = new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { right: 709 },
            children: [
                new TextRun(
                    `J10_02 the${String.fromCodePoint(0x2002)}survey of the coast was made in the summer by boat and on foot from the to coast`,
                ),
            ],
        });
        expect(
            pageNumbersOf({
                styles: {
                    default: {
                        document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
                    },
                },
                sections: [{ children: [heading("Before", "before"), enSpace, heading("After", "after")] }],
            }),
        ).to.deep.equal({ before: "1" });
    });

    it("should work out the page each bookmark starts on", () => {
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("First", "first"),
                        new Paragraph({ children: [new TextRun("Text"), new PageBreak()] }),
                        heading("Second", "second"),
                    ],
                },
            ],
        });
        expect(pages).to.deep.include({ first: "1", second: "2" });
    });

    it("should lay the table of contents out with its page numbers, and again if they change how it wraps", () => {
        // An entry that just fits on a line without its page number, and wraps with it
        const long = "Heading ".repeat(9).trim();
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-1" }),
                        ...Array.from({ length: 3 }, (_, index) => heading(`${long} ${index}`, `h${index}`)),
                        new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9026 }], children: [new PageReference("h0")] }),
                    ],
                },
            ],
        });
        expect(pages).to.deep.include({ h0: "1", h1: "1", h2: "1" });
    });

    it("should give no page numbers when they still change after three passes, rather than numbers that may be wrong", () => {
        // Lines of 300 points, two to a page, and a page reference as wide as a line when it says 1, and as narrow as nothing
        // when it says 2 or nothing, so the bookmark after it is on page 2 when it says 1, and on page 1 when it says 2
        const line = { line: 6000, lineRule: LineRuleType.EXACT };
        const options: IPropertiesOptions = {
            sections: [
                {
                    children: [
                        new Paragraph({ spacing: line, children: [new TextRun("On page"), new PageReference("target")] }),
                        new Paragraph({ spacing: line, children: [new Bookmark({ id: "target", children: [new TextRun("Target")] })] }),
                    ],
                },
            ],
        };
        const changing = estimatePageNumbersWith({ measureWidth: (text) => (text === "1" ? 1000 : text.length) });
        expect(estimateOf(options, changing)).to.deep.equal({ bookmarks: new Map() });
        expect(pageNumbersOf(options, estimatePageNumbersWith({ measureWidth: (text) => text.length }))).to.deep.equal({ target: "1" });
    });

    it("should lay out a document without sections on a page of Word's defaults, and write it", async () => {
        expect(estimateOf({ sections: [] })).to.deep.equal({
            bookmarks: new Map(),
            pageCount: 1,
            sectionPageCounts: [1],
            bookmarkPageNumbers: new Map(),
            relativePositions: new Map(),
        });
        const written = await Packer.toBuffer(new Document({ pageNumbers: estimatePageNumbers, sections: [] }));
        expect((await JSZip.loadAsync(written)).file("word/document.xml")).not.to.equal(null);
    });

    it("should give the bookmarks after a table that text flows around page numbers, as Word puts the text after it beside it", () => {
        // word-watertight-tables.docx TB11: the lines after the table start beside it, 3220 twips in
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("Before", "before"),
                        new Table({
                            width: { size: 3000, type: WidthType.DXA },
                            columnWidths: [3000],
                            float: { horizontalAnchor: "margin", verticalAnchor: "text", rightFromText: 200 },
                            rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("Floating")] })] })],
                        }),
                        heading("After", "after"),
                    ],
                },
            ],
        });
        expect(pages).to.deep.equal({ before: "1", after: "1" });
    });

    it("should leave the bookmarks after something it can't lay out without page numbers", () => {
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("Before", "before"),
                        new Paragraph({ frame: FRAME, border: FRAME_BORDER, children: [new TextRun("In a text frame")] }),
                        heading("After", "after"),
                    ],
                },
            ],
        });
        expect(pages).to.deep.equal({ before: "1" });
    });

    it("should work out the number of pages of the document and of each section, when it lays out all of it", () => {
        const estimate = estimateOf({
            sections: [
                {
                    children: [
                        heading("First", "first"),
                        new Paragraph({ children: [new TextRun("Text"), new PageBreak(), new TextRun("More")] }),
                    ],
                },
                { children: [new Paragraph({ children: [new TextRun({ children: ["Page 1 of ", PageNumber.TOTAL_PAGES] })] })] },
            ],
        });
        expect(estimate).to.deep.include({ pageCount: 3, sectionPageCounts: [2, 1] });
        const stopped = estimateOf({ sections: [{ children: [new Paragraph({ frame: FRAME, children: [new TextRun("Framed")] })] }] });
        expect(stopped.pageCount).to.equal(undefined);
        expect(stopped.sectionPageCounts).to.deep.equal([undefined]);
    });

    it("should work out the page numbers of a template once patchDocument has patched it, and write them clean", async () => {
        const document = await patchedTemplateOf(estimatePageNumbers);
        // The page reference and the number of pages
        expect(resultsOf(document)).to.deep.equal(["3", "3"]);
        // The template's page reference was written dirty, without page numbers
        expect(document).not.to.contain("w:dirty");
    });

    it("should lay out a .docx a template imports as Word turns it into the template's own, and stop at one in another format (word-imported-documents.docx)", async () => {
        // Two pages of chapters, imported between a page reference and the heading it refers to
        const chapters = await Packer.toBuffer(
            new Document({
                sections: [
                    {
                        children: [1, 2].map(
                            (chapter) => new Paragraph({ children: [new TextRun(`Chapter ${chapter}`), new PageBreak()] }),
                        ),
                    },
                ],
            }),
        );
        const template = await JSZip.loadAsync(
            await Packer.toBuffer(
                new Document({
                    sections: [
                        {
                            children: [
                                new Paragraph({ children: [new TextRun("The end is on page "), new PageReference("end")] }),
                                new Paragraph("Imported here"),
                                heading("The end", "end"),
                            ],
                        },
                    ],
                }),
            ),
        );
        /** The template importing a part in place of its second paragraph, patched with the page numbers worked out */
        const importing = async (target: string, contentType: string, data: Uint8Array | string): Promise<string> => {
            const zip = await JSZip.loadAsync(await template.generateAsync({ type: "uint8array" }));
            const edit = async (path: string, change: (xml: string) => string): Promise<void> => {
                zip.file(path, change(await zip.file(path)!.async("text")));
            };
            await edit("word/document.xml", (xml) =>
                xml.replace(/<w:p>(?:(?!<w:p>).)*?Imported here.*?<\/w:p>/, '<w:altChunk r:id="rIdImported"/>'),
            );
            await edit("word/_rels/document.xml.rels", (xml) =>
                xml.replace(
                    "</Relationships>",
                    `<Relationship Id="rIdImported" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="${target}"/></Relationships>`,
                ),
            );
            await edit("[Content_Types].xml", (xml) =>
                xml.replace("</Types>", `<Override ContentType="${contentType}" PartName="/word/${target}"/></Types>`),
            );
            zip.file(`word/${target}`, data);
            const patched = await patchDocument({
                outputType: "nodebuffer",
                data: await zip.generateAsync({ type: "nodebuffer" }),
                patches: {},
                pageNumbers: estimatePageNumbers,
            });
            return (await JSZip.loadAsync(patched)).file("word/document.xml")!.async("text");
        };
        expect(
            resultsOf(
                await importing(
                    "chapters.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                    chapters,
                ),
            ),
        ).to.deep.equal(["3"]);
        // Word converts HTML its own way, so the page reference after it is left blank
        expect(resultsOf(await importing("chapters.html", "text/html", "<p>Chapter 1</p>"))).to.deep.equal([""]);
    });

    it('should lay a document out the same with its lengths given with units, such as "1in" and "12pt", as in numbers', () => {
        // 120 lines of 12 points on A4 pages with 1-inch margins run onto a third page, where the bookmark after them is.
        // Before docx/layout read units, "1in" was 1 twip and "12pt" 12 half-points, and the bookmark was on page 2
        const document = (margin: number | "1in", size: number | "12pt"): IPropertiesOptions => ({
            sections: [
                {
                    properties: { page: { margin: { top: margin, bottom: margin, left: margin, right: margin } } },
                    children: [
                        ...Array.from(
                            { length: 120 },
                            (_, index) => new Paragraph({ children: [new TextRun({ text: `Line ${index}`, size })] }),
                        ),
                        new Paragraph({ children: [new Bookmark({ id: "end", children: [new TextRun("End")] })] }),
                    ],
                },
            ],
        });
        const inNumbers = estimateOf(document(1440, 24));
        expect(estimateOf(document("1in", "12pt"))).to.deep.equal(inNumbers);
        expect(inNumbers).to.deep.include({ pageCount: 3 });
        expect(Object.fromEntries(inNumbers.bookmarks)).to.deep.equal({ end: "3" });
    });

    it("should make lines of two fonts, and with pictures, as tall as Word does", () => {
        const styles: IPropertiesOptions["styles"] = {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        };
        /** The page of each of these paragraphs, whose first words are bookmarked as line1, line2 and on */
        const pagesOf = (count: number, line: (label: Bookmark) => ConstructorParameters<typeof Paragraph>[0]): Record<string, string> =>
            pageNumbersOf({
                styles,
                sections: [
                    {
                        children: Array.from(
                            { length: count },
                            (_, index) =>
                                new Paragraph(
                                    line(new Bookmark({ id: `line${index + 1}`, children: [new TextRun(`line ${index + 1} `)] })),
                                ),
                        ),
                    },
                ],
            });
        // Calibri 11 with a word of Courier New: 50 lines on a page in Word, where docx/layout had 51
        // (scripts/layout-probes/word-watertight-text.ts TX9a)
        expect(pagesOf(52, (label) => ({ children: [label, new TextRun({ text: "mono", font: "Courier New" })] }))).to.include({
            line50: "1",
            line51: "2",
        });
        // A 30-point picture beside Calibri 11, on the baseline: 21 on a page, where docx/layout had 23 (TX8b), and at 1.15
        // lines, 20, the last with its spacing below the bottom of the page (TX8c)
        const picture = (): ImageRun => new ImageRun({ type: "png", data: Buffer.from(""), transformation: { width: 27, height: 40 } });
        expect(pagesOf(22, (label) => ({ children: [label, picture()] }))).to.include({ line21: "1", line22: "2" });
        expect(pagesOf(22, (label) => ({ spacing: { line: 276, lineRule: LineRuleType.AUTO }, children: [label, picture()] }))).to.include({
            line20: "1",
            line21: "2",
        });
    });

    it("should lay out superscript, raised text, emphasis marks and borders around text as Word does", () => {
        const styles: IPropertiesOptions["styles"] = {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        };
        /** The page of each of these paragraphs, whose first words are bookmarked as line1, line2 and on */
        const pagesOf = (count: number, word: ConstructorParameters<typeof TextRun>[0]): Record<string, string> =>
            pageNumbersOf({
                styles,
                sections: [
                    {
                        children: Array.from(
                            { length: count },
                            (_, index) =>
                                new Paragraph({
                                    children: [
                                        new Bookmark({ id: `line${index + 1}`, children: [new TextRun(`line ${index + 1} `)] }),
                                        new TextRun(word),
                                    ],
                                }),
                        ),
                    },
                ],
            });
        // 100 digits in superscript, at 7 points, fit on a line, as they don't at 11, so 51 such lines are on a page
        // (scripts/layout-probes/word-watertight-text.ts TX1)
        expect(pagesOf(52, { text: "0123456789".repeat(10), superScript: true })).to.include({ line51: "1", line52: "2" });
        // Raised 6 points, as docx writes it: 35 lines on a page, where docx/layout had 51 (TX2a, and word-run-formatting.ts
        // RF5f)
        expect(pagesOf(36, { text: "raised", position: "6pt" })).to.include({ line35: "1", line36: "2" });
        // Emphasis marks: 41 lines on a page (TX15)
        expect(pagesOf(42, { text: "dotted", emphasisMark: { type: EmphasisMarkType.DOT } })).to.include({ line41: "1", line42: "2" });
        // A border of half a point 4 points away: 31 lines on a page (word-run-formatting.ts RF7a)
        expect(pagesOf(32, { text: "boxed", border: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "auto" } })).to.include({
            line31: "1",
            line32: "2",
        });
    });

    it("should place nothing without a document to lay out", () => {
        expect(estimatePageNumbers({ "w:body": [] } as IXmlableObject, { stack: [] } as unknown as IContext)).to.deep.equal({
            bookmarks: new Map(),
        });
        expect((estimatePageNumbers as (body: IXmlableObject) => EstimatedPageNumbers)({ "w:body": [] })).to.deep.equal({
            bookmarks: new Map(),
        });
    });

    describe("page references and page numbers, as Word writes them", () => {
        it("should write page references with \\p, in formats of their own and to bookmarks in footnotes, and numbers of pages in formats, as Word wrote them (word-watertight-fields.docx FD1 to FD4)", async () => {
            // Word, once its fields were updated: FD1 1, FD2 below, above and on page 4, FD3 x, J, 10th, 10, xii and v, FD4 11. The
            // PAGE fields Word writes itself, so docx leaves them empty
            expect(
                await probeLines(
                    fieldsProbe(),
                    /^FD\d (reference|above|below|other|roman|ALPHABETIC|Ordinal|picture|numpages|sectionpages)/,
                ),
            ).to.deep.equal([
                "FD1 reference 1 on page ",
                "FD2 above below on page ",
                "FD2 below above on page ",
                "FD2 other page on page 4 on page ",
                "FD3 roman x on page ",
                "FD3 ALPHABETIC J on page ",
                "FD3 Ordinal 10th on page ",
                "FD3 picture 10 on page ",
                "FD3 numpages roman xii",
                "FD3 sectionpages roman v",
                "FD4 reference 11 on page ",
            ]);
        });

        it("should write page references with \\p, formats, capitals and pictures, and to bookmarks in notes, as Word wrote them (word-page-fields.docx PF1 to PF8)", async () => {
            // Word, once its fields were updated: by the order of the text across columns and cells (PF1, PF2); "on page" and
            // the page as it shows it, in capitals too, and with a number format the page's number (PF3); formats of the
            // page's number without its chapter number (PF4); capitals after the format, and pictures (PF5, PF6); the page of
            // a note's reference for a bookmark in it, even in the part of a footnote on the next page and in an endnote, and
            // "on page" its reference's page from the text on the same page (PF8)
            expect(await probeLines(pageFieldsProbe(), /^PF[1-68][a-k] /)).to.deep.equal([
                "PF3a on page iv end",
                "PF3b ON PAGE IV end",
                "PF3c 4 end",
                "PF3e on page 1-2 end",
                "PF4a 4 end",
                "PF4b D end",
                "PF4c iv end",
                "PF4d ii end",
                "PF4e 2 end",
                "PF5a V end",
                "PF5b e end",
                "PF5c 5TH end",
                "PF5d 5th end",
                "PF5e 05 end",
                "PF5f 005 end",
                "PF5g 5 end",
                "PF5h 5 end",
                "PF5i 1,234 end",
                "PF5j 1234 end",
                "PF5k 5 end",
                "PF6a 11 end",
                "PF6b K end",
                "PF6c 011 end",
                "PF6d 1st end",
                "PF8a 1 end",
                "PF8b 5 end",
                "PF8c 1-2 end",
                "PF1b below end",
                "PF1a above end",
                "PF2a above end",
                "PF2b above end",
                "PF3d ABOVE end",
                "PF8d on page 1 end",
                "PF8e on page 1 end",
            ]);
        });

        it("should lay out PAGE and SECTION fields in formats, and in notes with the page and section of their reference, as Word writes them (word-page-fields.docx PF7)", () => {
            const { pages, stoppedAt } = layoutDocument(new Document(pageFieldsProbe()));
            expect(stoppedAt).to.equal(undefined);
            // As in Word's PDF, the rest of the long footnote is on page 10, and the endnote on page 11
            const lines = pages.flatMap((page, index) =>
                [...page.body, ...page.footnotes.flatMap(({ content }) => content), ...page.endnotes.flatMap(({ content }) => content)]
                    .flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : []))
                    .filter((text) => /PF7[a-i] /.test(text))
                    .map((text) => `${index + 1}: ${text}`),
            );
            expect(lines).to.deep.equal([
                "1: PF7a i end",
                "1: PF7b 01 end",
                "4: PF7c 4 end",
                "4: PF7d iv end",
                "4: PF7f iv end",
                "6: PF7e 1-2 end",
                "9: PF7g note page 1 section 8 end",
                "9: 3PF7h first part page 1 section 8 end",
                "10: PF7h rest page 1 section 8 end",
                "11: PF7i endnote page 5 section 6 end",
            ]);
        });

        it("should lay out PAGE and SECTION fields and page number blocks in the body with the numbers of the page and section they are on (word-watertight-pages.docx PG7)", () => {
            // As in the probe, page 10 is in the 17th section: 9 sections on pages of their own, 7 on the 9th page with them
            const sections = Array.from({ length: 16 }, (_, index) => ({
                ...(index >= 9 ? { properties: { type: SectionType.CONTINUOUS } } : {}),
                children: [new Paragraph(`section ${index + 1}`)],
            }));
            const { pages, stoppedAt } = layoutDocument(
                new Document({
                    styles: PROBE_STYLES,
                    sections: [
                        ...sections,
                        {
                            children: [
                                new Paragraph({ children: [new TextRun({ children: ["PG7c pgnum ", new PageNumberElement(), " end"] })] }),
                                new Paragraph({ children: [new TextRun({ children: ["PG7d page ", PageNumber.CURRENT, " end"] })] }),
                                new Paragraph({
                                    children: [new TextRun({ children: ["PG7e section ", PageNumber.CURRENT_SECTION, " end"] })],
                                }),
                            ],
                        },
                    ],
                }),
            );
            expect(stoppedAt).to.equal(undefined);
            expect(pages).to.have.length(10);
            expect(pages[9].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : []))).to.deep.equal(
                ["PG7c pgnum 10 end", "PG7d page 10 end", "PG7e section 17 end"],
            );
        });

        it("should stop at a date in the body, which Word writes when it opens the document, and lay out one in a header as it is written (word-watertight-pages.docx PG7a and PG7b)", () => {
            const date = new Paragraph({
                children: [new TextRun("PG7a date "), new SimpleField('DATE \\@ "d MMMM yyyy"', "1 January 2000"), new TextRun(" end")],
            });
            const blocks = new Paragraph({ children: [new TextRun({ children: ["PG7b blocks ", new DayLong(), " end"] })] });
            expect(layoutDocument(new Document({ sections: [{ children: [date] }] })).stoppedAt).to.equal(
                "a date or time, which Word writes when it opens the document",
            );
            expect(layoutDocument(new Document({ sections: [{ children: [blocks] }] })).stoppedAt).to.equal(
                "a date or time, which Word writes when it opens the document",
            );
            expect(
                layoutDocument(
                    new Document({
                        sections: [{ headers: { default: new Header({ children: [date, blocks] }) }, children: [new Paragraph("a")] }],
                    }),
                ).stoppedAt,
            ).to.equal(undefined);
        });
    });
});

describe("estimatePageNumbersWith", () => {
    // About 30 lines of italic text in Times New Roman at 10 points, docx's default, and a heading after them
    const DOCUMENT: IPropertiesOptions = {
        sections: [
            {
                children: [
                    heading("First", "first"),
                    new Paragraph({
                        children: [new TextRun({ text: "The harbour was rebuilt after the storm. ".repeat(80), italics: true })],
                    }),
                    heading("Second", "second"),
                ],
            },
        ],
    };

    it("should measure text as the options say, and break lines as Word breaks them", () => {
        expect(pageNumbersOf(DOCUMENT)).to.deep.include({ first: "1", second: "1" });
        // Text more than twice as wide as the width tables measure it takes more than twice as many lines, which go on to
        // the next page
        const measureWidth = vi.fn((text: string, font: FontToMeasure) => text.length * font.size);
        expect(pageNumbersOf(DOCUMENT, estimatePageNumbersWith({ measureWidth }))).to.deep.include({ first: "1", second: "2" });
        expect(measureWidth.mock.calls.map(([, font]) => font)).to.deep.include({
            name: "Times New Roman",
            size: 10,
            bold: false,
            italic: true,
        });
    });

    it("should stop at text in a font that isn't in the width tables, whose lines it doesn't know the height of", () => {
        const measureWidth = (text: string, font: FontToMeasure): number => text.length * font.size;
        const inFont = (font: string): IPropertiesOptions => ({
            sections: [
                {
                    children: [
                        heading("First", "first"),
                        new Paragraph({ children: [new TextRun({ text: "Text", font })] }),
                        heading("Last", "last"),
                    ],
                },
            ],
        });
        expect(pageNumbersOf(inFont("Roboto"), estimatePageNumbersWith({ measureWidth }))).to.deep.equal({ first: "1" });
        expect(pageNumbersOf(inFont("Arial"), estimatePageNumbersWith({ measureWidth }))).to.deep.equal({ first: "1", last: "1" });
    });

    it("should measure text with the width tables, as estimatePageNumbers does, without a way to measure it", () => {
        expect(estimateOf(DOCUMENT, estimatePageNumbersWith({}))).to.deep.equal(estimateOf(DOCUMENT));
    });

    it("should work out the page numbers of a template once patchDocument has patched it, as estimatePageNumbers does", async () => {
        expect(resultsOf(await patchedTemplateOf(estimatePageNumbersWith({})))).to.deep.equal(["3", "3"]);
    });

    describe("with font files", () => {
        // A font whose letters and spaces are an em wide, so 9 points of it fill a line of the page with 50 of them
        const WIDE = buildTestFont({
            name: "Probe Wide",
            advances: Object.fromEntries([..." abcdefghijklmnopqrstuvwxyz"].map((letter) => [letter, 1000])),
            windows: { ascent: 1000, descent: 1000 },
        });
        // A page of 9-point text in it: 100 words of 4 letters and a space, 500 ems, take 10 lines of 18 points
        const words = "abcd ".repeat(100).trim();
        const document = (font: string): IPropertiesOptions => ({
            sections: [
                {
                    children: [
                        heading("First", "first"),
                        ...Array.from({ length: 30 }, () => new Paragraph({ children: [new TextRun({ text: words, font, size: 18 })] })),
                        heading("Last", "last"),
                    ],
                },
            ],
        });

        it("should measure text in the fonts it is given from their files", () => {
            // Measured from the file, the 30 paragraphs take 300 lines of 18 points, 38 to a page
            const estimator = estimatePageNumbersWith({ fonts: [{ data: WIDE }] });
            expect(pageNumbersOf(document("Probe Wide"), estimator)).to.deep.include({ first: "1", last: "8" });
            // Without the file, Probe Wide isn't in the width tables, so the layout stops at it, and the page after is blank
            expect(pageNumbersOf(document("Probe Wide"))).to.deep.equal({ first: "1" });
            expect(pageNumbersOf(document("Probe Wide"), estimatePageNumbersWith({ fonts: [] }))).to.deep.equal({ first: "1" });
        });

        it("should give the fonts in a file the name the caller gives them", () => {
            const estimator = estimatePageNumbersWith({ fonts: [{ data: WIDE.slice().buffer, name: "Calibri" }] });
            expect(pageNumbersOf(document("Calibri"), estimator)).to.deep.include({ last: "8" });
            expect(pageNumbersOf(document("Probe Wide"), estimator)).to.deep.equal({ first: "1" });
        });

        it("should measure text in the fonts the document embeds from their files, as Word draws it in them", () => {
            // docx embeds the file as the font's regular face, by the name it is given
            const embedded = (font: string, data: Uint8Array): IPropertiesOptions => ({
                ...document(font),
                fonts: [{ name: font, data: Buffer.from(data) }],
            });
            expect(pageNumbersOf(embedded("Probe Wide", WIDE))).to.deep.include({ first: "1", last: "8" });
            expect(pageNumbersOf(embedded("Calibri", WIDE))).to.deep.include({ last: "8" });
            // A file that isn't a font, a collection of no fonts, or a damaged font, is left out, so the layout stops at text in
            // its font, rather than throwing when it is laid out
            expect(pageNumbersOf(embedded("Probe Wide", new Uint8Array(16)))).to.deep.equal({ first: "1" });
            expect(pageNumbersOf(embedded("Probe Wide", buildTestFontCollection([])))).to.deep.equal({ first: "1" });
            const damaged = WIDE.slice();
            const view = new DataView(damaged.buffer);
            const characterMap = tableOffset(damaged, "cmap") + view.getUint32(tableOffset(damaged, "cmap") + 8);
            // The glyph of "a", in the array of a map in format 4, past the end of the file
            view.setUint16(characterMap + 16 + (view.getUint16(characterMap + 6) / 2) * 6 + 2, 0xfffe);
            expect(pageNumbersOf(embedded("Probe Wide", damaged))).to.deep.equal({ first: "1" });
            // The fonts the caller gives are measured too, after those the document embeds
            const narrow = buildTestFont({ name: "Probe Wide", advances: { a: 1 }, windows: { ascent: 1000, descent: 1000 } });
            expect(pageNumbersOf(embedded("Probe Wide", WIDE), estimatePageNumbersWith({ fonts: [{ data: narrow }] }))).to.deep.include({
                last: "8",
            });
        });

        it("should stop at bold text in a font the document embeds only a regular face of", () => {
            const bold: IPropertiesOptions = {
                fonts: [{ name: "Probe Wide", data: Buffer.from(WIDE) }],
                sections: [
                    {
                        children: [
                            heading("First", "first"),
                            new Paragraph({ children: [new TextRun({ text: "abcd", font: "Probe Wide", bold: true })] }),
                            heading("Last", "last"),
                        ],
                    },
                ],
            };
            expect(pageNumbersOf(bold)).to.deep.equal({ first: "1" });
        });

        it("should measure the fonts a template embeds from their files, once patchDocument has patched it", async () => {
            // docx obfuscates the fonts it embeds, with a key of its own for each, as Word does
            const template = await Packer.toBuffer(
                new Document({ ...document("Probe Wide"), fonts: [{ name: "Probe Wide", data: Buffer.from(WIDE) }] }),
            );
            let estimate: EstimatedPageNumbers | undefined;
            await patchDocument({
                outputType: "nodebuffer",
                data: template,
                patches: {},
                pageNumbers: (patched) => {
                    estimate = estimatePageNumbers(patched);
                    return estimate;
                },
            });
            expect(Object.fromEntries(estimate!.bookmarks)).to.deep.include({ first: "1", last: "8" });
        });

        it("should measure text in other fonts as the options say", () => {
            // Calibri half an em to a character, with Probe Wide from its file
            const measureWidth = vi.fn((text: string, font: FontToMeasure) => (text.length * font.size) / 2);
            const estimator = estimatePageNumbersWith({ fonts: [{ data: WIDE }], measureWidth });
            expect(pageNumbersOf(document("Probe Wide"), estimator)).to.deep.include({ last: "8" });
            expect(measureWidth.mock.calls.map(([, font]) => font.name)).not.to.include("Probe Wide");
            pageNumbersOf(document("Calibri"), estimator);
            expect(measureWidth.mock.calls.map(([, font]) => font.name)).to.include("Calibri");
        });

        it("should throw for a file that isn't a font", () => {
            expect(() => estimatePageNumbersWith({ fonts: [{ data: new Uint8Array(16) }] })).to.throw("isn't a TrueType or OpenType font");
        });
    });

    describe("guessing", () => {
        const GUESS = estimatePageNumbersWith({ guess: true });
        /** A document of a heading, a paragraph of these runs, and a heading after them */
        const around = (...children: readonly (TextRun | SimpleField)[]): IPropertiesOptions => ({
            sections: [{ children: [heading("First", "first"), new Paragraph({ children }), heading("Last", "last")] }],
        });

        it("should give the page numbers past what it can't lay out as Word does, and say where it guessed", () => {
            const framed: IPropertiesOptions = {
                sections: [
                    {
                        children: [
                            heading("First", "first"),
                            new Paragraph({ frame: FRAME, border: FRAME_BORDER, text: "Framed" }),
                            heading("Last", "last"),
                        ],
                    },
                ],
            };
            expect(estimateOf(framed)).to.deep.include({ bookmarks: new Map([["first", "1"]]) });
            expect(estimateOf(framed, GUESS)).to.deep.include({
                bookmarks: new Map([
                    ["first", "1"],
                    ["last", "1"],
                ]),
                pageCount: 1,
                guesses: [{ reason: "a text frame with borders", page: 1 }],
            });
            // With nothing to guess at, it gives what estimatePageNumbers does, and says it guessed nowhere
            expect(estimateOf(DOCUMENT, GUESS)).to.deep.equal({ ...estimateOf(DOCUMENT), guesses: [] });
        });

        it("should measure text in a font not in the width tables as the most similar font that is (word-watertight-text.docx TX18)", () => {
            // Word drew the pangram 3616.5 twips wide in Segoe UI and 3457.5 in Garamond, and in Cambria, 3820.8, in a font
            // it doesn't have. The guess measures them as Calibri, Times New Roman and Arial, 1% narrower, 4% wider and 1%
            // wider than Word drew them, and each is a line, as it was in Word
            const pangrams = ["Segoe UI", "Garamond", "Watertight Missing Sans"].map(
                (font) => new Paragraph({ children: [new TextRun({ text: "Thequickbrownfoxjumpsoverthelazydog", font, size: 22 })] }),
            );
            const document = new Document({ sections: [{ children: pangrams }] });
            expect(layoutDocument(document).stoppedAt).to.equal("a font not in the width tables");
            const { pages, stoppedAt } = layoutDocument(document, { guess: true });
            expect(stoppedAt).to.equal(undefined);
            expect(pages[0].guesses).to.deep.equal(["a font not in the width tables"]);
            // In twips, 15 to a pixel
            const widths = pages[0].body.map((block) =>
                block.type === "paragraph" ? block.lines.map(({ textWidth }) => Math.round(textWidth * 15)) : [],
            );
            expect(widths).to.deep.equal([[3589], [3580], [3864]]);
            expect(pageNumbersOf(around(new TextRun({ text: "Text", font: "Roboto" })), GUESS)).to.deep.equal({ first: "1", last: "1" });
        });

        it("should measure a date as it is written, where Word writes the date it opens the document on (word-watertight-pages.docx PG7a)", () => {
            // Word wrote 1 October 2026 over the 1 January 2000 written
            const date = around(
                new TextRun("PG7a date "),
                new SimpleField('DATE \\@ "d MMMM yyyy"', "1 January 2000"),
                new TextRun(" end"),
            );
            expect(pageNumbersOf(date)).to.deep.equal({ first: "1" });
            expect(estimateOf(date, GUESS)).to.deep.include({
                bookmarks: new Map([
                    ["first", "1"],
                    ["last", "1"],
                ]),
                guesses: [{ reason: "a date or time, which Word writes when it opens the document", page: 1 }],
            });
            const { pages } = layoutDocument(new Document(date), { guess: true });
            expect(pages[0].body[1]).to.deep.include({ type: "paragraph" });
            expect(pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : []))).to.include(
                "PG7a date 1 January 2000 end",
            );
        });

        it("should lay out a document whose compatibility settings it doesn't follow as if it didn't have them", () => {
            // Word laid out 2010's compatibility mode, and suppressTopSpacing, differently: the first line of a page of exact
            // or at-least line spacing shorter (word-compat-settings2-suppressTopSpacing.docx), which a line of single spacing
            // here isn't
            const set = (compatibility: IPropertiesOptions["compatibility"]): IPropertiesOptions => ({
                ...around(new TextRun("Text")),
                compatibility,
            });
            for (const [compatibility, reason] of [
                [{ version: 14 }, "a document in compatibility mode"],
                [{ suppressTopSpacing: true }, "a compatibility setting not yet followed"],
            ] as const) {
                expect(pageNumbersOf(set(compatibility))).to.deep.equal({});
                expect(estimateOf(set(compatibility), GUESS)).to.deep.include({
                    bookmarks: new Map([
                        ["first", "1"],
                        ["last", "1"],
                    ]),
                    guesses: [{ reason, page: 1 }],
                });
            }
        });
    });
});
