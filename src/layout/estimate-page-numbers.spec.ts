import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Table, TableCell, TableRow, WidthType } from "@file/table";
import {
    AlignmentType,
    Bookmark,
    Document,
    type EstimatedPageNumbers,
    FrameAnchorType,
    HeadingLevel,
    type IContext,
    type IFrameOptions,
    type IPropertiesOptions,
    type IXmlableObject,
    ImageRun,
    LineRuleType,
    Packer,
    PageBreak,
    PageNumber,
    type PageNumberEstimator,
    PageReference,
    Paragraph,
    PatchType,
    TabStopType,
    TableOfContents,
    type TemplatePageNumberEstimator,
    TextRun,
    patchDocument,
} from "docx";
import { buildTestFont } from "tests/font-file";

import { estimatePageNumbers, estimatePageNumbersWith } from "./estimate-page-numbers";
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
        expect(estimateOf({ sections: [] })).to.deep.equal({ bookmarks: new Map(), pageCount: 1, sectionPageCounts: [1] });
        const written = await Packer.toBuffer(new Document({ pageNumbers: estimatePageNumbers, sections: [] }));
        expect((await JSZip.loadAsync(written)).file("word/document.xml")).not.to.equal(null);
    });

    it("should leave the bookmarks after a table that text flows around without page numbers, as Word puts the text after it beside it", () => {
        // word-watertight-tables.docx TB11: the lines after the table start beside it, 3220 twips in, where docx/layout would
        // lay them out below it
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
        expect(pages).to.deep.equal({ before: "1" });
    });

    it("should leave the bookmarks after something it can't lay out without page numbers", () => {
        const pages = pageNumbersOf({
            sections: [
                {
                    children: [
                        heading("Before", "before"),
                        new Paragraph({ frame: FRAME, children: [new TextRun("In a text frame")] }),
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

    it("should place nothing without a document to lay out", () => {
        expect(estimatePageNumbers({ "w:body": [] } as IXmlableObject, { stack: [] } as unknown as IContext)).to.deep.equal({
            bookmarks: new Map(),
        });
        expect((estimatePageNumbers as (body: IXmlableObject) => EstimatedPageNumbers)({ "w:body": [] })).to.deep.equal({
            bookmarks: new Map(),
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
        expect(pageNumbersOf(inFont("Aptos"), estimatePageNumbersWith({ measureWidth }))).to.deep.equal({ first: "1" });
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
            // A file that isn't a font is left out, so the layout stops at text in its font
            expect(pageNumbersOf(embedded("Probe Wide", new Uint8Array(16)))).to.deep.equal({ first: "1" });
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
});
