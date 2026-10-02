import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import {
    Bookmark,
    Document,
    type EstimatedPageNumbers,
    FrameAnchorType,
    HeadingLevel,
    type IContext,
    type IFrameOptions,
    type IPropertiesOptions,
    type IXmlableObject,
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

    it("should measure text with the width tables, as estimatePageNumbers does, without a way to measure it", () => {
        expect(estimateOf(DOCUMENT, estimatePageNumbersWith({}))).to.deep.equal(estimateOf(DOCUMENT));
    });

    it("should work out the page numbers of a template once patchDocument has patched it, as estimatePageNumbers does", async () => {
        expect(resultsOf(await patchedTemplateOf(estimatePageNumbersWith({})))).to.deep.equal(["3", "3"]);
    });
});
