import { describe, expect, it } from "vitest";

import type { ParagraphFormat, TextMeasurer } from "../text-layout";
import { paginate } from "./paginate";
import type { Block, DocumentContent, LayoutItem, ParagraphBlock, Section, TableBlock, TableCell, TableRow } from "./read-document";

// Every character is 10 points wide, and a line is as tall as its font's size, 10 points unless it says otherwise
const MEASURER: TextMeasurer = {
    measureWidth: (text) => [...text].length * 10,
    measureLineHeight: ({ size = 10 }) => size,
};

// Pages 100 points wide and 90 tall, with 10 point margins: 8 characters to a line, and 7 lines to a page
const SECTION: Section = {
    pageWidth: 100,
    pageHeight: 90,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    header: 5,
    footer: 5,
    gutter: 0,
    start: "nextPage",
    titlePage: false,
    columns: [80],
    numberFormat: "decimal",
    headers: {},
    footers: {},
};

/** A paragraph of lines of words that each fill a line, bookmarked with its name */
const paragraph = (name: string, lines: number, format: ParagraphFormat = {}, style?: string): ParagraphBlock => ({
    type: "paragraph",
    items: [
        { type: "marker", name },
        { type: "text", text: Array.from({ length: lines }, () => "abcdefgh").join(" "), font: {} },
    ],
    format,
    tabStops: [],
    markFont: {},
    ...(style ? { style } : {}),
});

const withItems = (block: ParagraphBlock, items: readonly LayoutItem[]): ParagraphBlock => ({
    ...block,
    items: [...block.items, ...items],
});

const document = (blocks: readonly (Block | readonly [Block, number])[], changes: Partial<DocumentContent> = {}): DocumentContent => ({
    blocks: blocks.map((block) => (Array.isArray(block) ? { block: block[0], section: block[1] } : { block: block as Block, section: 0 })),
    sections: [SECTION],
    defaultTabStop: 36,
    evenAndOddHeaders: false,
    addsParagraphSpacing: false,
    footnotes: new Map(),
    footnoteSeparator: [],
    footnoteContinuationSeparator: [],
    endnotes: [],
    ...changes,
});

/** The page each bookmark is on */
const pagesOf = (content: DocumentContent, pageNumbers?: ReadonlyMap<string, string>): Record<string, string> =>
    Object.fromEntries(paginate(content, { measurer: MEASURER, pageNumbers }).bookmarks);

const row = (cells: readonly (readonly Block[])[], changes: Partial<TableRow> = {}): TableRow => ({
    cells: cells.map((blocks, column) => ({ column, width: 80, blocks, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 })),
    header: false,
    cantSplit: false,
    borderTop: 0,
    borderBottom: 0,
    ...changes,
});

/** A cell merged down the rows, in the first column unless it says otherwise */
const merged = (verticalMerge: "restart" | "continue", blocks: readonly Block[] = [], column = 0): TableCell => ({
    column,
    width: 80,
    blocks,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    verticalMerge,
});

/** A row with a merged cell in its first column, and cells with these blocks after it */
const mergedRow = (first: TableCell, cells: readonly (readonly Block[])[] = [], changes: Partial<TableRow> = {}): TableRow => {
    const { cells: rest, ...properties } = row([[], ...cells], changes);
    return { ...properties, cells: [first, ...rest.slice(1)] };
};

const table = (rows: readonly TableRow[]): TableBlock => ({ type: "table", rows });

describe("paginate", () => {
    it("should fill each page with lines, and start the next where they don't fit", () => {
        const content = document([paragraph("a", 3), paragraph("b", 3), paragraph("c", 3)]);
        // a and b fill 6 of the 7 lines. c's first line fits, but not the two widow control needs on the next page
        expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        expect(paginate(content, { measurer: MEASURER }).pageCount).to.equal(2);
    });

    it("should keep lines as tall as Word has them, unrounded, so that a line that only just fits stays on the page", () => {
        const calibri = { font: "Calibri", size: 11 };
        const line = (name: string): ParagraphBlock => ({
            ...paragraph(name, 0),
            items: [
                { type: "marker", name },
                { type: "text", text: "Text", font: calibri },
            ],
            markFont: calibri,
        });
        // 10 lines of Calibri 11 are 134.28 points in Word, and would be 134.5 in LibreOffice's lines of whole twips
        const content = document(
            Array.from({ length: 10 }, (_, index) => line(`line${index + 1}`)),
            { sections: [{ ...SECTION, pageHeight: 134.3 + SECTION.marginTop + SECTION.marginBottom }] },
        );
        expect(paginate(content).bookmarks.get("line10")).to.equal("1");
    });

    it("should lay out a document without content on one page", () => {
        expect(paginate(document([]), { measurer: MEASURER })).to.deep.equal({
            bookmarks: new Map(),
            pageCount: 1,
            sectionPageCounts: [1],
        });
    });

    it("should put a bookmark on the line its text starts on", () => {
        const long = withItems(paragraph("a", 6), [
            { type: "marker", name: "late" },
            { type: "text", text: " abcdefgh abcdefgh", font: {} },
        ]);
        // The paragraph's 8 lines break after 6, as its last 2 go on the next page
        expect(pagesOf(document([long]))).to.deep.equal({ a: "1", late: "2" });
    });

    it("should keep a bookmark on the page it first starts on", () => {
        const twice = withItems(paragraph("a", 7), [{ type: "marker", name: "a" }]);
        expect(pagesOf(document([twice, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
    });

    describe("widow and orphan control", () => {
        it("should move a paragraph's first line to the next page rather than leave it alone at the bottom", () => {
            expect(pagesOf(document([paragraph("a", 6), paragraph("b", 4)]))).to.deep.equal({ a: "1", b: "2" });
        });

        it("should move a line back to the next page rather than leave the last one alone at the top", () => {
            const tail = withItems(paragraph("b", 4), [
                { type: "marker", name: "third" },
                { type: "text", text: " abcdefgh", font: {} },
            ]);
            // b's 5 lines: 2 fit after a, then 3 on the next page. Without widow control, 3 would fit
            expect(pagesOf(document([paragraph("a", 4), tail]))).to.deep.equal({ a: "1", b: "1", third: "2" });
            const two = document([paragraph("a", 5), paragraph("b", 3), paragraph("c", 1)]);
            expect(pagesOf(two)).to.deep.equal({ a: "1", b: "2", c: "2" });
        });

        it("should leave lines alone at the top or bottom of a page without widow control", () => {
            expect(pagesOf(document([paragraph("a", 6), paragraph("b", 4, { widowControl: false })]))).to.deep.equal({ a: "1", b: "1" });
        });

        it("should put a paragraph taller than a page on as many pages as it needs", () => {
            const content = document([paragraph("a", 16), paragraph("b", 1)]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "3" });
            expect(paginate(content, { measurer: MEASURER }).pageCount).to.equal(3);
        });
    });

    it("should keep a paragraph's lines on one page with keepLines, unless it is taller than a page", () => {
        expect(pagesOf(document([paragraph("a", 4), paragraph("b", 4, { keepLines: true })]))).to.deep.equal({ a: "1", b: "2" });
        expect(pagesOf(document([paragraph("a", 1), paragraph("b", 9, { keepLines: true }), paragraph("c", 1)]))).to.deep.equal({
            a: "1",
            b: "2",
            c: "3",
        });
    });

    describe("keepNext", () => {
        it("should move a paragraph to the next page with the start of the paragraph it is kept with", () => {
            const content = document([paragraph("a", 5), paragraph("heading", 1, { keepNext: true }), paragraph("b", 4)]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "2", b: "2" });
            // Without keepNext, the heading stays at the bottom of the page
            expect(pagesOf(document([paragraph("a", 5), paragraph("heading", 1), paragraph("b", 4)]))).to.deep.equal({
                a: "1",
                heading: "1",
                b: "2",
            });
        });

        it("should keep a chain of paragraphs together, and with all of a paragraph that keeps its lines together", () => {
            const chain = document([
                paragraph("a", 3),
                paragraph("one", 1, { keepNext: true }),
                paragraph("two", 1, { keepNext: true }),
                paragraph("b", 3, { keepLines: true }),
            ]);
            expect(pagesOf(chain)).to.deep.equal({ a: "1", one: "2", two: "2", b: "2" });
        });

        it("should keep a paragraph with one line of the next without widow control, and with the first row of a table", () => {
            const lines = document([
                paragraph("a", 5),
                paragraph("heading", 1, { keepNext: true }),
                paragraph("b", 4, { widowControl: false }),
            ]);
            expect(pagesOf(lines)).to.deep.equal({ a: "1", heading: "1", b: "1" });
            const rows = document([paragraph("a", 5), paragraph("heading", 1, { keepNext: true }), table([row([[paragraph("cell", 2)]])])]);
            expect(pagesOf(rows)).to.deep.equal({ a: "1", heading: "2", cell: "2" });
        });

        it("should keep a paragraph with a table without rows", () => {
            const content = document([paragraph("a", 6), paragraph("heading", 1, { keepNext: true }), table([]), paragraph("b", 1)]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "1", b: "2" });
        });

        it("should keep a paragraph with what it can of an unsupported table before stopping there", () => {
            const content = document([
                paragraph("a", 6),
                paragraph("heading", 1, { keepNext: true }),
                { ...table([]), unsupported: "a thing" },
            ]);
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["heading", "1"],
                ]),
                pageCount: 1,
                // The section the layout stopped in has no number of pages
                sectionPageCounts: [undefined],
                stoppedAt: "a thing",
            });
        });

        it("should break a chain taller than a page, at the top of a page, and at the end of its section", () => {
            const tall = document([paragraph("a", 1), paragraph("heading", 1, { keepNext: true }), paragraph("b", 12)]);
            expect(pagesOf(tall)).to.deep.equal({ a: "1", heading: "1", b: "1" });
            const top = document([paragraph("heading", 1, { keepNext: true }), paragraph("b", 12)]);
            expect(pagesOf(top)).to.deep.equal({ heading: "1", b: "1" });
            const last = document([paragraph("a", 6), paragraph("end", 1, { keepNext: true })]);
            expect(pagesOf(last)).to.deep.equal({ a: "1", end: "1" });
        });
    });

    describe("spacing", () => {
        it("should put the larger of the space after a paragraph and before the next between them", () => {
            // 10 after and 20 before make 20, so b's first line starts at 50, and its 3 lines fit on 7
            const content = document([paragraph("a", 2, { spaceAfter: 10 }), paragraph("b", 3, { spaceBefore: 20 }), paragraph("c", 1)]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should add the space after a paragraph and before the next with the compatibility setting that says to", () => {
            const content = document([paragraph("a", 2, { spaceAfter: 10 }), paragraph("b", 3, { spaceBefore: 20 })], {
                addsParagraphSpacing: true,
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
        });

        it("should leave out the space before a paragraph at the top of a page", () => {
            const content = document([paragraph("a", 7), paragraph("b", 7, { spaceBefore: 30 }), paragraph("c", 1)]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2", c: "3" });
        });

        it("should keep the space before the first paragraph of the document and of a section at the top of a page, as Word does", () => {
            // a's 10 points before and 6 lines fill the page
            expect(pagesOf(document([paragraph("a", 6, { spaceBefore: 10 }), paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            const newPage = (before: readonly Block[]): DocumentContent =>
                document(
                    [
                        [paragraph("a", 1), 0],
                        ...before.map((block): readonly [Block, number] => [block, 0]),
                        [paragraph("b", 6, { spaceBefore: 10 }), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [SECTION, SECTION] },
                );
            expect(pagesOf(newPage([]))).to.deep.equal({ a: "1", b: "2", c: "3" });
            // Only as much of it as is more than the space after the empty paragraph that ends the section before
            expect(pagesOf(newPage([{ ...sectionBreak, format: { spaceAfter: 10 } }]))).to.deep.equal({ a: "1", b: "2", c: "2" });
            // The first paragraph of a continuous section keeps it too on a new page, kept with the next or after a page
            // break before it
            const continuous = (first: ParagraphFormat): DocumentContent =>
                document(
                    [
                        [paragraph("a", 6), 0],
                        [sectionBreak, 0],
                        [paragraph("heading", 1, { spaceBefore: 20, ...first }), 1],
                        [paragraph("b", 4), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [SECTION, { ...SECTION, start: "continuous" }] },
                );
            expect(pagesOf(continuous({ keepNext: true }))).to.deep.equal({ a: "1", heading: "2", b: "2", c: "3" });
            expect(pagesOf(continuous({ pageBreakBefore: true }))).to.deep.equal({ a: "1", heading: "2", b: "2", c: "3" });
        });

        it("should keep the space before a continuous section's first paragraph with a page break before it, less the empty paragraph's space after, as Word does", () => {
            // As word-probes.docx's U7: below the empty paragraph that ends the section before, with 10 points after
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true, format: { spaceAfter: 10 } };
            const continuous = (before: ParagraphFormat, first: ParagraphFormat, lines: number): DocumentContent =>
                document(
                    [
                        [paragraph("a", 1, before), 0],
                        [sectionBreak, 0],
                        [paragraph("b", lines, { pageBreakBefore: true, ...first }), 1],
                        [paragraph("c", 1), 1],
                        [paragraph("d", 1), 1],
                    ],
                    { sections: [SECTION, { ...SECTION, start: "continuous" }] },
                );
            // U7a: 30 points before are 20 below the top of the page, so b's 4 lines and c fill it
            expect(pagesOf(continuous({}, { spaceBefore: 30 }, 4))).to.deep.equal({ a: "1", b: "2", c: "2", d: "3" });
            // U7b: 5 points before are none, so b's 5 lines, c and d fill it
            expect(pagesOf(continuous({}, { spaceBefore: 5 }, 5))).to.deep.equal({ a: "1", b: "2", c: "2", d: "2" });
            // U7c: it is the empty paragraph's space after that counts, not the 40 after the section's last paragraph
            expect(pagesOf(continuous({ spaceAfter: 40 }, { spaceBefore: 30 }, 4))).to.deep.equal({ a: "1", b: "2", c: "2", d: "3" });
            // Below the section's first paragraph, a page break leaves out the space before the next
            const later = document(
                [
                    [paragraph("a", 1), 0],
                    [sectionBreak, 0],
                    [paragraph("b", 1), 1],
                    [paragraph("c", 6, { pageBreakBefore: true, spaceBefore: 30 }), 1],
                    [paragraph("d", 1), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous" }] },
            );
            expect(pagesOf(later)).to.deep.equal({ a: "1", b: "1", c: "2", d: "2" });
        });

        it("should keep the space before a new-page section's first paragraph less the empty paragraph's space after, with a page break before it or not, as Word does", () => {
            // As word-rules2.docx's Q2: below the empty paragraph that ends the section before, with 10 points after
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true, format: { spaceAfter: 10 } };
            const newPage = (first: ParagraphFormat, lines: number): DocumentContent =>
                document(
                    [
                        [paragraph("a", 1), 0],
                        [sectionBreak, 0],
                        [paragraph("b", lines, first), 1],
                        [paragraph("c", 1), 1],
                        [paragraph("d", 1), 1],
                    ],
                    { sections: [SECTION, SECTION] },
                );
            // Q2a: 30 points before are 20 below the top of the page, so b's 4 lines and c fill it
            expect(pagesOf(newPage({ spaceBefore: 30 }, 4))).to.deep.equal({ a: "1", b: "2", c: "2", d: "3" });
            // Q2b: 5 points before are none, so b's 5 lines, c and d fill it
            expect(pagesOf(newPage({ spaceBefore: 5 }, 5))).to.deep.equal({ a: "1", b: "2", c: "2", d: "2" });
            // Q2c: the same with a page break before b, which the section's new page already is
            expect(pagesOf(newPage({ spaceBefore: 30, pageBreakBefore: true }, 4))).to.deep.equal({ a: "1", b: "2", c: "2", d: "3" });
            expect(pagesOf(newPage({ spaceBefore: 5, pageBreakBefore: true }, 5))).to.deep.equal({ a: "1", b: "2", c: "2", d: "2" });
        });

        it("should leave out the space between paragraphs of the same style with contextual spacing", () => {
            const spaced = { spaceBefore: 30, contextualSpacing: true };
            const content = document([
                paragraph("a", 1, spaced, "List"),
                paragraph("b", 5, spaced, "List"),
                paragraph("c", 1, spaced, "Other"),
            ]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        describe("contextual spacing on one of two paragraphs of the same style", () => {
            /** The space between two paragraphs of a line each, from how many lines of 10 points fit below them on the page */
            const spaceBetween = (first: ParagraphBlock, second: ParagraphBlock, changes: Partial<DocumentContent> = {}): number => {
                const lines = Array.from({ length: 5 }, (_, index) => paragraph(`line ${index}`, 1));
                const pages = pagesOf(document([first, second, ...lines], changes));
                return 50 - 10 * lines.filter((_, index) => pages[`line ${index}`] === "1").length;
            };
            const contextual = { contextualSpacing: true };

            it("should leave out the first's space after, and keep as much of the second's space before as is more, as Word does", () => {
                // Word's results scaled down from twips: 200 after a contextual paragraph and 400 before the next leave 200
                // (`word-rules2.docx` Q1a), 400 and 200 leave none (`word-rules.docx` P1d), and so do 400 and 400 (Q1c),
                // where LibreOffice leaves 400, 200 and 400
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 20, ...contextual }), paragraph("b", 1, { spaceBefore: 40 }))).to.equal(
                    20,
                );
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 40, ...contextual }), paragraph("b", 1, { spaceBefore: 20 }))).to.equal(
                    0,
                );
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 40, ...contextual }), paragraph("b", 1, { spaceBefore: 40 }))).to.equal(
                    0,
                );
            });

            it("should leave out the part of the second's space before that is more than the first's space after, as Word does", () => {
                // 200 after and 400 before a contextual paragraph leave 200 (Q1b), and 400 and 200 leave 400 (P1e), as do
                // 400 and 400 (Q1d)
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 20 }), paragraph("b", 1, { spaceBefore: 40, ...contextual }))).to.equal(
                    20,
                );
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 40 }), paragraph("b", 1, { spaceBefore: 20, ...contextual }))).to.equal(
                    40,
                );
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 40 }), paragraph("b", 1, { spaceBefore: 40, ...contextual }))).to.equal(
                    40,
                );
            });

            it("should leave out both shares with contextual spacing on both, and neither between paragraphs of different styles", () => {
                const both = (secondStyle?: string): number =>
                    spaceBetween(
                        paragraph("a", 1, { spaceAfter: 40, ...contextual }),
                        paragraph("b", 1, { spaceBefore: 20, ...contextual }, secondStyle),
                    );
                // `word-rules.docx` P1c and P1f
                expect(both()).to.equal(0);
                expect(both("Other")).to.equal(40);
            });

            it("should leave out only the contextual paragraph's own space with the space after and before added", () => {
                const adding = { addsParagraphSpacing: true };
                expect(spaceBetween(paragraph("a", 1, { spaceAfter: 20 }), paragraph("b", 1, { spaceBefore: 10 }), adding)).to.equal(30);
                expect(
                    spaceBetween(paragraph("a", 1, { spaceAfter: 20, ...contextual }), paragraph("b", 1, { spaceBefore: 10 }), adding),
                ).to.equal(10);
                expect(
                    spaceBetween(paragraph("a", 1, { spaceAfter: 20 }), paragraph("b", 1, { spaceBefore: 10, ...contextual }), adding),
                ).to.equal(20);
            });
        });
    });

    describe("breaks", () => {
        it("should start the text after a page or column break on a new page", () => {
            const broken = withItems(paragraph("a", 1), [
                { type: "break", kind: "page", font: {} },
                { type: "marker", name: "after" },
                { type: "text", text: "x", font: {} },
                { type: "break", kind: "column", font: {} },
            ]);
            expect(pagesOf(document([broken, paragraph("b", 1)]))).to.deep.equal({ a: "1", after: "2", b: "3" });
        });

        it("should start a paragraph with pageBreakBefore on a new page, unless it is at the top of one", () => {
            const content = document([paragraph("a", 1, { pageBreakBefore: true }), paragraph("b", 1, { pageBreakBefore: true })]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
        });
    });

    describe("tables", () => {
        it("should move a row kept whole that doesn't fit to the next page, and repeat the header rows there", () => {
            const content = document([
                paragraph("a", 3),
                table([
                    row([[paragraph("header", 1)]], { header: true }),
                    row([[paragraph("one", 2)], [paragraph("side", 1)]]),
                    row([[paragraph("two", 2)]], { cantSplit: true }),
                    row([[paragraph("three", 2)]]),
                ]),
                paragraph("b", 1),
            ]);
            // After the header row, rows take 2 lines. The header's line is repeated at the top of page 2
            expect(pagesOf(content)).to.deep.equal({ a: "1", header: "1", one: "1", side: "1", two: "2", three: "2", b: "2" });
            // A header row that doesn't fit below a full page goes to the next page, where it isn't repeated above itself,
            // so its line, the row's 5 and b's fill the page
            const headerMoves = document([
                paragraph("a", 7),
                table([row([[paragraph("header", 1)]], { header: true }), row([[paragraph("one", 5)]], { cantSplit: true })]),
                paragraph("b", 1),
            ]);
            expect(pagesOf(headerMoves)).to.deep.equal({ a: "1", header: "2", one: "2", b: "2" });
        });

        it("should size the columns of a table given no widths to their text, in the width it is in", () => {
            const words: ParagraphBlock = {
                type: "paragraph",
                items: [{ type: "text", text: "aa bb cc dd ee", font: {} }],
                format: {},
                tabStops: [],
                markFont: {},
            };
            const [cell] = row([[words]]).cells;
            const narrow = table([{ ...row([]), cells: [{ ...cell, width: 20 }] }]);
            // At the 20 points it is read with, its 5 lines break the row across the pages. Sized to its text, it is as wide
            // as the page's text, and its 2 lines leave room for b
            expect(pagesOf(document([paragraph("a", 4), narrow, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
            expect(pagesOf(document([paragraph("a", 4), { ...narrow, fit: {} }, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "1" });
            // In a cell of a table, in the cell's width
            const outer = table([{ ...row([]), cells: [{ ...cell, blocks: [{ ...narrow, fit: {} }] }] }]);
            expect(pagesOf(document([paragraph("a", 4), outer, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "1" });
            const halfWidth = table([{ ...row([]), cells: [{ ...cell, width: 40, blocks: [{ ...narrow, fit: {} }] }] }]);
            expect(pagesOf(document([paragraph("a", 4), halfWidth, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
        });

        it("should widen a column for a word longer than its cells give it, in a table whose cells all have widths", () => {
            const text = (value: string): ParagraphBlock => ({
                type: "paragraph",
                items: [{ type: "text", text: value, font: {} }],
                format: {},
                tabStops: [],
                markFont: {},
            });
            const [first, second] = row([[text("abcd")], [text("aa bb cc dd ee")]]).cells;
            const given = table([
                {
                    ...row([]),
                    cells: [
                        { ...first, width: 20, ownWidth: 20 },
                        { ...second, width: 60, ownWidth: 60 },
                    ],
                },
            ]);
            // At the widths read, the word is broken across 2 lines and the second cell has 3, so b fits below the row. The
            // first column widened to the word's 40 points leaves the second 40, and its 5 lines push b to the next page
            expect(pagesOf(document([paragraph("a", 2), given, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "1" });
            const widened = { ...given, widen: { acrossColumns: false } };
            expect(pagesOf(document([paragraph("a", 2), widened, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
            // Not yet with cells merged across columns, which stop the layout
            const acrossColumns = paginate(document([paragraph("a", 2), { ...given, widen: { acrossColumns: true } }]), {
                measurer: MEASURER,
            });
            expect(acrossColumns.stoppedAt).to.equal("a word longer than its cell in a table with cells merged across columns");
            // A paragraph kept with it is laid out before the layout stops there, as it is before any table it can't lay out
            const kept = paginate(
                document([paragraph("a", 2), paragraph("heading", 1, { keepNext: true }), { ...given, widen: { acrossColumns: true } }]),
                { measurer: MEASURER },
            );
            expect(kept.bookmarks).to.deep.equal(
                new Map([
                    ["a", "1"],
                    ["heading", "1"],
                ]),
            );
            expect(kept.stoppedAt).to.equal("a word longer than its cell in a table with cells merged across columns");
        });

        it("should make rows as tall as their tallest cell, their margins and borders, or their own height", () => {
            const cell = (name: string): readonly Block[] => [paragraph(name, 1)];
            const content = document([
                table([
                    row([cell("margins")], { borderTop: 5, borderBottom: 5 }),
                    { ...row([cell("atLeast")]), height: { value: 20, rule: "atLeast" } },
                    { ...row([cell("exact")]), height: { value: 5, rule: "exact" } },
                    row([cell("last")]),
                ]),
                paragraph("b", 1),
            ]);
            // 20 + 20 + 5 + 10 leaves 15 points: room for b
            expect(pagesOf(content)).to.deep.equal({ margins: "1", atLeast: "1", exact: "1", last: "1", b: "1" });
            const margined = document([
                {
                    type: "table",
                    rows: [
                        {
                            ...row([]),
                            cells: [
                                { column: 0, width: 80, blocks: cell("x"), marginTop: 30, marginBottom: 30, marginLeft: 0, marginRight: 0 },
                            ],
                        },
                    ],
                },
                paragraph("b", 1),
            ]);
            expect(pagesOf(margined)).to.deep.equal({ x: "1", b: "2" });
        });

        it("should make the last of rows a merged cell spans taller when its text needs the room", () => {
            const content = document([
                table([
                    mergedRow(merged("restart", [paragraph("merged", 5)]), [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ]),
                paragraph("b", 2),
                table([mergedRow(merged("restart", [paragraph("short", 1)]))]),
                paragraph("c", 1),
            ]);
            // The two rows are 5 lines tall, as the merged cell is, so b's 2 lines fill the page and c starts the next
            expect(pagesOf(content)).to.deep.equal({ merged: "1", r1: "1", r2: "1", b: "1", short: "2", c: "2" });
        });

        it("should give a cell without paragraphs only its margins, and a merge that ends before the last row the rows it spans", () => {
            const content = document([
                table([
                    mergedRow(merged("restart", [paragraph("merged", 3)]), [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue")),
                    row([[]], { height: { value: 15, rule: "atLeast" } }),
                    mergedRow(merged("restart", [paragraph("short", 1)]), [[paragraph("tall", 2)]]),
                    mergedRow(merged("restart", [paragraph("exact", 3)]), [], { height: { value: 5, rule: "exact" } }),
                ]),
                paragraph("b", 1),
                paragraph("c", 1),
            ]);
            // 30 for the first merge, 15 for the empty cell's row, 20 for the short merge beside 2 lines, and 5: 70
            expect(pagesOf(content)).to.deep.include({ merged: "1", short: "1", exact: "1", b: "2" });
        });

        it("should find the rest of a merged cell in its grid column, after a cell that spans several", () => {
            const content = document([
                table([
                    // The first cell spans the first two columns, so the merged cell is in the third, as in the next row
                    {
                        ...row([[paragraph("wide", 1)]]),
                        cells: [row([[paragraph("wide", 1)]]).cells[0], merged("restart", [paragraph("merged", 5)], 2)],
                    },
                    {
                        ...row([[paragraph("c", 1)], [paragraph("d", 1)]]),
                        cells: [...row([[paragraph("c", 1)], [paragraph("d", 1)]]).cells, merged("continue", [], 2)],
                    },
                ]),
                paragraph("e", 1),
                paragraph("f", 1),
            ]);
            // The two rows are 5 lines tall, as the merged cell is, so e and f fill the page
            expect(pagesOf(content)).to.deep.equal({ wide: "1", merged: "1", c: "1", d: "1", e: "1", f: "1" });
        });

        it("should break a row that doesn't fit across pages, between the lines of its cells, below the header rows", () => {
            const content = document([
                paragraph("a", 1),
                table([
                    row([[paragraph("head", 1)]], { header: true }),
                    row([
                        [withItems(paragraph("tall", 9), [{ type: "marker", name: "tallEnd" }])],
                        [paragraph("first", 4), paragraph("second", 3)],
                        // A cell without paragraphs
                        [],
                    ]),
                ]),
                paragraph("after", 3),
                paragraph("next", 1),
            ]);
            // 5 lines of the row fit below a and the header, but the first line of second would be alone there, so widow
            // control moves it to the next page. There, the header and the 4 lines left of tall leave room for 2 lines, so
            // after moves on, with the widow control of its 3 lines
            expect(pagesOf(content)).to.deep.equal({
                a: "1",
                head: "1",
                tall: "1",
                tallEnd: "2",
                first: "1",
                second: "2",
                after: "3",
                next: "3",
            });
        });

        it("should keep widows and orphans of a row that breaks across pages, as Word does", () => {
            // A cell of 4 lines, with a bookmark on the third
            const cell = (format: ParagraphFormat = {}): ParagraphBlock => ({
                ...paragraph("cell", 0, format),
                items: [
                    { type: "marker", name: "cell" },
                    { type: "text", text: "abcdefgh abcdefgh ", font: {} },
                    { type: "marker", name: "third" },
                    { type: "text", text: "abcdefgh abcdefgh", font: {} },
                ],
            });
            const after = (lines: number, format?: ParagraphFormat): Record<string, string> =>
                pagesOf(document([paragraph("a", lines), table([row([[cell(format)]])])]));
            // 3 lines fit below 4, but 2 go on to the next page, as Word splits them. LibreOffice splits them 3 and 1
            expect(after(4)).to.deep.equal({ a: "1", cell: "1", third: "2" });
            expect(after(4, { widowControl: false })).to.deep.equal({ a: "1", cell: "1", third: "1" });
            // 1 line fits below 6, so the row moves to the next page
            expect(after(6)).to.deep.equal({ a: "1", cell: "2", third: "2" });
            expect(after(6, { widowControl: false })).to.deep.equal({ a: "1", cell: "1", third: "2" });
            // Lines kept together move the row to the next page, with or without widow control
            expect(after(4, { keepLines: true })).to.deep.equal({ a: "1", cell: "2", third: "2" });
            expect(after(4, { keepLines: true, widowControl: false })).to.deep.equal({ a: "1", cell: "2", third: "2" });
        });

        it("should keep room in a row that breaks across pages for the space after a paragraph that ends there, as Word does", () => {
            // A paragraph of 4 lines with 15 points after it, and a bookmark on its third line
            const spaced: ParagraphBlock = {
                ...paragraph("spaced", 0, { spaceAfter: 15 }),
                items: [
                    { type: "marker", name: "spaced" },
                    { type: "text", text: "abcdefgh abcdefgh ", font: {} },
                    { type: "marker", name: "third" },
                    { type: "text", text: "abcdefgh abcdefgh", font: {} },
                ],
            };
            const content = document([paragraph("a", 2), table([row([[spaced, paragraph("next", 1)], [paragraph("tall", 9)]])])]);
            // Its 4 lines fit in the 50 points below a, but not with the space after them, so widow control leaves 2 there
            expect(pagesOf(content)).to.deep.equal({ a: "1", spaced: "1", third: "2", next: "2", tall: "1" });
        });

        it("should keep room for the table's bottom border below the last of it on a page, where it breaks, as Word does", () => {
            // A cell of 6 lines, with a bookmark on the fourth
            const cell: ParagraphBlock = {
                ...paragraph("cell", 0),
                items: [
                    { type: "marker", name: "cell" },
                    { type: "text", text: "abcdefgh abcdefgh abcdefgh ", font: {} },
                    { type: "marker", name: "fourth" },
                    { type: "text", text: "abcdefgh abcdefgh abcdefgh", font: {} },
                ],
            };
            // Borders of 1 point between rows, and 10 at the bottom
            const content = document([
                paragraph("a", 1),
                table([
                    row([[paragraph("first", 1)]], { borderTop: 1 }),
                    row([[cell]], { borderTop: 1 }),
                    row([[paragraph("last", 1)]], { borderTop: 1, borderBottom: 10 }),
                ]),
            ]);
            // 4 lines of the second row fit in the 48 points below the first row, but not with the bottom border drawn below
            // them where the row breaks (`word-line-heights.docx` T1)
            expect(pagesOf(content)).to.deep.equal({ a: "1", first: "1", cell: "1", fourth: "2", last: "2" });
            // 5 rows of a line and its border fit in the 60 points below a, but not with the bottom border below the fifth
            // (T4)
            const rows = Array.from({ length: 6 }, (_, index) =>
                row([[paragraph(`row${index + 1}`, 1)]], { borderTop: 1, borderBottom: index === 5 ? 10 : 0 }),
            );
            expect(pagesOf(document([paragraph("a", 1), table(rows)]))).to.deep.equal({
                a: "1",
                row1: "1",
                row2: "1",
                row3: "1",
                row4: "1",
                row5: "2",
                row6: "2",
            });
        });

        it("should move a row of an at-least height to the next page whole, unless the page has room for its height, as Word does", () => {
            const atLeast = (lines: number, room: number): Record<string, string> =>
                pagesOf(
                    document([
                        paragraph("a", 7 - room),
                        table([row([[paragraph("set", lines)], [paragraph("beside", 1)]], { height: { value: 45, rule: "atLeast" } })]),
                    ]),
                );
            // With room for 4 of its 6 lines, but not its 45 points, it moves (`word-line-heights.docx` T3a). With room for
            // 5 lines, it breaks, 4 and 2 with widow control (T3c)
            expect(atLeast(6, 4)).to.deep.equal({ a: "1", set: "2", beside: "2" });
            expect(atLeast(6, 5)).to.deep.equal({ a: "1", set: "1", beside: "1" });
            // Shorter than its height, it moves too (T3d)
            expect(atLeast(2, 4)).to.deep.equal({ a: "1", set: "2", beside: "2" });
        });

        it("should move a row to the next page whole when widow control holds back all of a cell's lines, as Word does", () => {
            const content = document([
                paragraph("a", 6),
                table([row([[paragraph("left", 4)], [paragraph("right1", 1), paragraph("right2", 1)], []])]),
            ]);
            // The first line of right fits below a, but left's first line would be alone on the page
            expect(pagesOf(content)).to.deep.equal({ a: "1", left: "2", right1: "2", right2: "2" });
        });

        it("should leave out the space before a paragraph at the top of a cell's part on the next page, and move a row none of whose lines fit", () => {
            const spaced = paragraph("spaced", 2, { spaceBefore: 30 });
            const content = document([
                paragraph("a", 5),
                table([row([[paragraph("cell", 1), spaced]], { borderTop: 1 })]),
                paragraph("b", 4),
                table([row([[paragraph("moved", 2, { spaceBefore: 5 })]])]),
            ]);
            // cell's line fits below a, and spaced moves to the next page without its space, so b fits below it. No line of
            // moved fits below its space before on that page, so its row moves to the next
            expect(pagesOf(content)).to.deep.equal({ a: "1", cell: "1", spaced: "2", b: "2", moved: "3" });
        });

        it("should move a row kept whole, of an exact height, or whose text fits but not its height, to the next page", () => {
            const content = document([
                paragraph("a", 5),
                table([row([[paragraph("kept", 3)]], { cantSplit: true })]),
                paragraph("b", 2),
                table([row([[paragraph("exact", 1)]], { height: { value: 40, rule: "exact" } })]),
                paragraph("c", 2),
                table([row([[paragraph("atLeast", 1)]], { height: { value: 40, rule: "atLeast" } })]),
                paragraph("d", 1),
            ]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", kept: "2", b: "2", exact: "3", c: "3", atLeast: "4", d: "4" });
            const tall = document([table([row([[paragraph("tall", 1)]], { height: { value: 80, rule: "atLeast" } })])]);
            expect(paginate(tall, { measurer: MEASURER }).stoppedAt).to.equal("a table row taller than a page");
        });

        it("should stop at a row kept whole that is taller than a page", () => {
            const result = paginate(document([paragraph("a", 1), table([row([[paragraph("tall", 9)]], { cantSplit: true })])]), {
                measurer: MEASURER,
            });
            expect(result).to.deep.equal({
                bookmarks: new Map([["a", "1"]]),
                pageCount: 2,
                sectionPageCounts: [undefined],
                stoppedAt: "a table row taller than a page",
            });
        });

        it("should stop at a row that breaks across pages with merged cells or a table in it", () => {
            const stoppedAt = (breaking: TableRow): string | undefined =>
                paginate(document([paragraph("a", 5), table([breaking])]), { measurer: MEASURER }).stoppedAt;
            expect(stoppedAt(mergedRow(merged("restart", [paragraph("merged", 4)])))).to.equal(
                "a table row with merged cells across pages",
            );
            expect(stoppedAt(row([[paragraph("beside", 4)], [table([row([[paragraph("inner", 1)]])])]]))).to.equal(
                "a table in a table row across pages",
            );
            // A table in a cell of a row that moves to the next page whole is laid out there
            expect(stoppedAt(row([[table([row([[paragraph("inner", 3)]])])]]))).to.equal(undefined);
        });

        it("should stop at a merge that doesn't fit on the page with its cell's text, which Word breaks across pages", () => {
            // As word-probes.docx's U4a: an 8-line cell merged down 2 rows, beside one-line cells, from line 47 of 51. Here
            // a 4-line cell from line 5 of 7
            const merge = (lines: number): TableBlock =>
                table([
                    mergedRow(merged("restart", [paragraph("merged", lines)]), [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ]);
            const laidOut = (lines: number): ReturnType<typeof paginate> =>
                paginate(document([paragraph("a", 4), merge(lines), paragraph("b", 1)]), { measurer: MEASURER });
            // It stops before the merge's first row, so none of the cell's lines are given the page before Word's
            expect(laidOut(4)).to.deep.include({
                bookmarks: new Map([["a", "1"]]),
                stoppedAt: "a table row with merged cells across pages",
            });
            // A merge that fits on the page is laid out
            expect(Object.fromEntries(laidOut(3).bookmarks)).to.deep.equal({ a: "1", merged: "1", r1: "1", r2: "1", b: "2" });
            // With the cell's text all in the rows on the page, the next row of the merge moves to the next page, as in Word
            // (U4b)
            const fitting = (first: number): DocumentContent =>
                document([
                    paragraph("a", 4),
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 2)]), [[paragraph("r1", first)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                        mergedRow(merged("continue"), [[paragraph("r3", 2)]], { cantSplit: true }),
                    ]),
                ]);
            expect(pagesOf(fitting(2))).to.deep.equal({ a: "1", merged: "1", r1: "1", r2: "1", r3: "2" });
            expect(pagesOf(fitting(1))).to.deep.equal({ a: "1", merged: "1", r1: "1", r2: "1", r3: "2" });
            // A merge whose first row is kept whole, and doesn't fit, moves to the next page with it, where it fits
            const kept = (changes: Partial<TableRow>): DocumentContent =>
                document([
                    paragraph("a", 6),
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 3)]), [[paragraph("r1", 2)]], changes),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                ]);
            expect(pagesOf(kept({ cantSplit: true }))).to.deep.equal({ a: "1", merged: "2", r1: "2", r2: "2" });
            expect(pagesOf(kept({ height: { value: 20, rule: "exact" } }))).to.deep.equal({ a: "1", merged: "2", r1: "2", r2: "2" });
        });

        it("should stop at a line in a table cell taller than a page", () => {
            const tall = paragraph("tall", 1, { lineSpacing: { rule: "exact", height: 100 } });
            expect(paginate(document([table([row([[tall]])])]), { measurer: MEASURER }).stoppedAt).to.equal(
                "a table row taller than a page",
            );
        });

        it("should lay out paragraphs and tables in cells, with the space around them", () => {
            const inner = table([row([[paragraph("deep", 2)]])]);
            const outer = table([row([[paragraph("inner", 1, { spaceBefore: 5, spaceAfter: 5 }), inner]])]);
            // The cell is 5 + 10 + 5 + 20 points tall, which leaves 30 points: not enough for b's 4 lines
            expect(pagesOf(document([outer, paragraph("b", 4, { keepLines: true })]))).to.deep.equal({ inner: "1", deep: "1", b: "2" });
        });
    });

    describe("sections", () => {
        it("should start a section on a new page, or on the same page when it is continuous", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1), 1],
                    [paragraph("c", 1), 2],
                ],
                {
                    sections: [SECTION, SECTION, { ...SECTION, start: "continuous" }],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2", c: "2" });
        });

        it("should start a continuous section of another page size on a new page", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1), 1],
                ],
                {
                    sections: [SECTION, { ...SECTION, start: "continuous", pageWidth: 200 }],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
        });

        it("should leave a blank page before a section that starts on an even or odd page, when it needs one", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("odd", 1), 1],
                    [paragraph("even", 1), 2],
                    [paragraph("next", 1), 3],
                ],
                {
                    sections: [
                        SECTION,
                        { ...SECTION, start: "oddPage" },
                        { ...SECTION, start: "evenPage" },
                        { ...SECTION, start: "oddPage" },
                    ],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", odd: "3", even: "4", next: "5" });
            expect(paginate(content, { measurer: MEASURER }).pageCount).to.equal(5);
        });

        it("should number a section's pages from its first number, in its format", () => {
            const content = document(
                [
                    [paragraph("preface", 7), 0],
                    [paragraph("more", 1), 0],
                    [paragraph("chapter", 1), 1],
                ],
                {
                    sections: [
                        { ...SECTION, numberFormat: "lowerRoman" },
                        { ...SECTION, firstNumber: 1 },
                    ],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ preface: "i", more: "ii", chapter: "1" });
        });

        it("should lay out each section's text in its own width", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("wide", 4), 1],
                    [paragraph("b", 4), 1],
                ],
                {
                    sections: [SECTION, { ...SECTION, pageWidth: 190, columns: [170] }],
                },
            );
            // Two words to a line: 2 lines each
            expect(pagesOf(content)).to.deep.equal({ a: "1", wide: "2", b: "2" });
        });

        it("should stop at a section it can't lay out", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1), 1],
                ],
                {
                    sections: [SECTION, { ...SECTION, unsupported: "columns" }],
                },
            );
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([["a", "1"]]),
                pageCount: 1,
                sectionPageCounts: [1, undefined],
                stoppedAt: "columns",
            });
            expect(paginate({ ...content, sections: [{ ...SECTION, unsupported: "columns" }] }, { measurer: MEASURER }).stoppedAt).to.equal(
                "columns",
            );
        });
    });

    describe("columns", () => {
        const COLUMNS: Section = { ...SECTION, columns: [80, 80] };
        const columnBreak: LayoutItem = { type: "break", kind: "column", font: {} };
        const pageBreak: LayoutItem = { type: "break", kind: "page", font: {} };

        it("should fill each column of a page before the next page", () => {
            const content = document([paragraph("a", 5), paragraph("b", 4), paragraph("c", 6), paragraph("d", 1)], { sections: [COLUMNS] });
            // b's last 2 lines and c's first 4 are in the second column
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
        });

        it("should start the next column at a column break, and a new page at a page break or a column break in the last column", () => {
            const content = document(
                [
                    withItems(paragraph("a", 1), [columnBreak]),
                    withItems(paragraph("b", 1), [pageBreak]),
                    withItems(paragraph("c", 1), [columnBreak]),
                    withItems(paragraph("d", 1), [columnBreak]),
                    paragraph("e", 1),
                ],
                { sections: [COLUMNS] },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2", d: "2", e: "3" });
            // In a section of one column, a column break starts a new page
            expect(pagesOf(document([withItems(paragraph("a", 1), [columnBreak]), paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
        });

        it("should start a page break before a paragraph at the top of a column after the first on a new page", () => {
            const content = document([withItems(paragraph("a", 1), [columnBreak]), paragraph("b", 1, { pageBreakBefore: true })], {
                sections: [COLUMNS],
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
        });

        it("should move a paragraph kept with the next to the next column", () => {
            const content = document([paragraph("a", 6), paragraph("heading", 1, { keepNext: true }), paragraph("b", 2)], {
                sections: [COLUMNS],
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "1", b: "1" });
        });

        it("should start a continuous section's columns below the text before it on the page", () => {
            const content = document(
                [
                    [paragraph("a", 3), 0],
                    [paragraph("b", 6), 1],
                    [paragraph("c", 3), 1],
                ],
                { sections: [SECTION, { ...COLUMNS, start: "continuous" }] },
            );
            // The second column starts below a too, so b's last 2 lines leave room for 2 of c's 3, which widow control moves on
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should keep a paragraph with the next on a new page when they fit there, below a continuous section that starts low", () => {
            const content = document(
                [
                    [paragraph("a", 4), 0],
                    [paragraph("heading", 1, { keepNext: true }), 1],
                    [paragraph("b", 3), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous" }] },
            );
            // The heading and b need 4 lines, more than are left below a, but not more than a new page has
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "2", b: "2" });
        });

        describe("balanced before a continuous section break", () => {
            const lines = (prefix: string, count: number): readonly ParagraphBlock[] =>
                Array.from({ length: count }, (_, index) => paragraph(`${prefix}${index + 1}`, 1));
            /** Blocks in columns, then b and c in a continuous section of one column, whose pages show where it starts */
            const balanced = (blocks: readonly Block[], section: Section = COLUMNS, after = 3): DocumentContent =>
                document(
                    [...blocks.map((block): readonly [Block, number] => [block, 0]), [paragraph("b", after), 1], [paragraph("c", 1), 1]],
                    { sections: [section, { ...SECTION, start: "continuous" }] },
                );

            it("should lay out the columns as short as they fit in, filled from the first, and the next section below the tallest", () => {
                // 4 lines and 3, so b's 3 lines fill the page
                expect(pagesOf(balanced(lines("a", 7)))).to.deep.equal({
                    a1: "1",
                    a2: "1",
                    a3: "1",
                    a4: "1",
                    a5: "1",
                    a6: "1",
                    a7: "1",
                    b: "1",
                    c: "2",
                });
                // 3 lines and 3, which leave room for c
                expect(pagesOf(balanced(lines("a", 6)))).to.include({ b: "1", c: "1" });
                // 2, 2 and 1 in 3 columns, and 1 line in 2
                expect(pagesOf(balanced(lines("a", 5), { ...SECTION, columns: [80, 80, 80] }, 5))).to.include({ b: "1", c: "2" });
                expect(pagesOf(balanced(lines("a", 1), COLUMNS, 5))).to.include({ b: "1", c: "1" });
            });

            it("should keep a paragraph's lines together as widow control and keepLines do", () => {
                // A paragraph of 3 lines stays in the first column with widow control, and goes 2 and 1 without
                expect(pagesOf(balanced([paragraph("a", 3)], COLUMNS, 4))).to.include({ b: "1", c: "2" });
                expect(pagesOf(balanced([paragraph("a", 3, { widowControl: false })], COLUMNS, 4))).to.include({ b: "1", c: "1" });
                // Lines kept together go in the second column, which is taller than the first, rather than 3 and 2
                expect(pagesOf(balanced([paragraph("a", 1), paragraph("kept", 4, { keepLines: true })]))).to.include({ b: "1", c: "2" });
                expect(pagesOf(balanced([paragraph("a", 1), paragraph("kept", 4)]))).to.include({ b: "1", c: "1" });
            });

            it("should keep a paragraph with the next in the same column", () => {
                // 6 lines and 4, rather than 5 and 5, which would leave the heading at the bottom of the first column
                const kept = [...lines("a", 4), paragraph("heading", 1, { keepNext: true }), ...lines("r", 5)];
                expect(pagesOf(balanced(kept, COLUMNS, 1))).to.include({ b: "1", c: "2" });
                expect(pagesOf(balanced([...lines("a", 5), ...lines("r", 5)], COLUMNS, 1))).to.include({ b: "1", c: "1" });
            });

            it("should break a table between its rows, and a row between its lines, across the columns", () => {
                const rows = table([row([[paragraph("row", 2)]], { cantSplit: true }), row([[paragraph("split", 4)]])]);
                // The table's 6 lines go 4 and 2, as 3 and 3 would leave one line of split on its own in the first column
                expect(pagesOf(balanced([rows], COLUMNS, 4))).to.include({ row: "1", split: "1", b: "1", c: "2" });
                // A row's 4 lines go 2 below a, and 2 in the second column, and the next section starts below the first, the
                // taller, so b's 4 lines fill the page
                expect(pagesOf(balanced([paragraph("a", 1), table([row([[paragraph("four", 4)]])])], COLUMNS, 4))).to.include({
                    four: "1",
                    b: "1",
                    c: "2",
                });
            });

            it("should balance the columns on the last page of a section that goes on from the page before", () => {
                // 7 and 7 lines on the first page, and 2 and 1 on the second
                expect(pagesOf(balanced(lines("a", 17), COLUMNS, 4))).to.include({ a15: "2", a17: "2", b: "2", c: "2" });
                // A paragraph that goes on to the second page, for 1 line and 2 there, as widow control leaves 2 at the end
                expect(pagesOf(balanced([paragraph("long", 17)], COLUMNS, 4))).to.include({ long: "1", b: "2", c: "2" });
            });

            it("should balance the columns of a continuous section below those balanced before it", () => {
                const content = document(
                    [
                        ...lines("a", 4).map((block): readonly [Block, number] => [block, 0]),
                        ...lines("d", 4).map((block): readonly [Block, number] => [block, 1]),
                        [paragraph("b", 3), 2],
                        [paragraph("c", 1), 2],
                    ],
                    { sections: [COLUMNS, { ...COLUMNS, start: "continuous" }, { ...SECTION, start: "continuous" }] },
                );
                // 2 and 2 lines twice, then b's 3 lines
                expect(pagesOf(content)).to.include({ d4: "1", b: "1", c: "2" });
            });

            it("should start the next section below each column's last paragraph and the space after it, as Word does", () => {
                // 3 lines and 2, with space after the last, in the shorter column: 10 points leave it as low as the first
                // column, and 20 put it lower
                expect(pagesOf(balanced([...lines("a", 4), paragraph("last", 1, { spaceAfter: 10 })]))).to.include({ b: "1", c: "1" });
                expect(pagesOf(balanced([...lines("a", 4), paragraph("last", 1, { spaceAfter: 20 })]))).to.include({ b: "1", c: "2" });
                // 3 lines and 2, with 10 points after the first column's last
                const firstSpaced = [...lines("a", 2), paragraph("mid", 1, { spaceAfter: 10 }), ...lines("r", 2)];
                expect(pagesOf(balanced(firstSpaced))).to.include({ b: "1", c: "2" });
            });

            it("should put only as much of the next section's space before as is more than the last paragraph's space after", () => {
                const content = document(
                    [
                        ...[...lines("a", 4), paragraph("last", 1, { spaceAfter: 10 })].map((block): readonly [Block, number] => [
                            block,
                            0,
                        ]),
                        [paragraph("b", 3, { spaceBefore: 20 }), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [COLUMNS, { ...SECTION, start: "continuous" }] },
                );
                // The columns end 30 points down, and b starts 10 points below them, to fill the page
                expect(pagesOf(content)).to.include({ b: "1", c: "2" });
            });

            it("should put all of the next section's space before below the columns when an empty paragraph ends them, as Word does", () => {
                const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
                const content = document(
                    [
                        ...[...lines("a", 4), paragraph("last", 1, { spaceAfter: 10 }), sectionBreak].map(
                            (block): readonly [Block, number] => [block, 0],
                        ),
                        [paragraph("b", 2, { spaceBefore: 20 }), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [COLUMNS, { ...SECTION, start: "continuous" }] },
                );
                // The columns end 30 points down, with the space after last in the second, and b starts 20 points below
                // them, rather than 10, so c doesn't fit below it
                expect(pagesOf(content)).to.include({ b: "1", c: "2" });
            });

            it("should not balance columns with nothing in them on the page", () => {
                const atTop = document(
                    [
                        [withItems(paragraph("a", 1), [pageBreak]), 0],
                        [paragraph("b", 1), 1],
                    ],
                    { sections: [COLUMNS, { ...SECTION, start: "continuous" }] },
                );
                expect(pagesOf(atTop)).to.deep.equal({ a: "1", b: "2" });
            });

            it("should repeat a table's header rows at the top of each column it balances", () => {
                const rows = lines("r", 3).map((block) => row([[block]]));
                const headed = balanced([table([row([[paragraph("header", 1)]], { header: true }), ...rows])], COLUMNS, 4);
                // The header and 2 rows, and the header and the last row, so the columns are 3 lines tall, rather than 2
                // and 2 without the header in the second, and c doesn't fit below b's 4 lines
                expect(pagesOf(headed)).to.include({ r2: "1", r3: "1", b: "1", c: "2" });
            });

            it("should stop at what it can't lay out in the columns it balances, though it can in a column as tall as the page", () => {
                // The row of a merged cell fits in the first column, but breaks across the columns as short as they fit in
                const headed = balanced([table([mergedRow(merged("restart", [paragraph("merged", 4)]))])]);
                expect(paginate(headed, { measurer: MEASURER }).stoppedAt).to.equal("a table row with merged cells across pages");
            });

            it("should put the line of the empty paragraph that ends the section after a table below the last column, as Word does", () => {
                const ended = (mark: number, after: number): DocumentContent => {
                    const sectionBreak: ParagraphBlock = {
                        ...paragraph("break", 0),
                        items: [],
                        markFont: { size: mark },
                        sectionBreak: true,
                    };
                    return document(
                        [
                            [table(lines("r", 4).map((block) => row([[block]]))), 0],
                            [sectionBreak, 0],
                            [paragraph("b", after), 1],
                            [paragraph("c", 1), 1],
                        ],
                        { sections: [COLUMNS, { ...SECTION, start: "continuous" }] },
                    );
                };
                // 2 rows and 2, and the empty paragraph's line below the second, so c doesn't fit below b's 4 lines
                expect(pagesOf(ended(10, 4))).to.include({ r3: "1", b: "1", c: "2" });
                // A mark 3 lines tall goes below the rows evened out, rather than with them, 4 lines and its 3
                expect(pagesOf(ended(30, 2))).to.include({ r3: "1", b: "1", c: "2" });
            });

            it("should leave columns with a column break in them as they are, as Word does, but not those of the next page", () => {
                // The second column has the column break's line and d's 4 lines, rather than 3 lines and 2 in the third
                const broken = balanced(
                    [withItems(paragraph("a", 1), [columnBreak]), ...lines("d", 4)],
                    { ...SECTION, columns: [80, 80, 80] },
                    2,
                );
                expect(pagesOf(broken)).to.include({ d4: "1", b: "1", c: "2" });
                // The column break in the last column starts the second page, whose columns are balanced
                const before = balanced([
                    withItems(paragraph("a", 1), [columnBreak]),
                    withItems(paragraph("d", 1), [columnBreak]),
                    ...lines("e", 2),
                ]);
                expect(pagesOf(before)).to.include({ e1: "2", b: "2", c: "2" });
            });
        });

        it("should keep a paragraph with the next on a new page, past columns that start too low on the page for them", () => {
            const content = document(
                [
                    [paragraph("a", 5), 0],
                    [paragraph("heading", 1, { keepNext: true }), 1],
                    [paragraph("b", 3), 1],
                ],
                { sections: [SECTION, { ...COLUMNS, start: "continuous" }] },
            );
            // The heading and b need 4 lines, and each column has 2 below a
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "2", b: "2" });
        });

        it("should give the empty paragraph that ends a section no room, and keep the paragraph before it with nothing", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            const content = (next: Section): DocumentContent =>
                document(
                    [
                        [paragraph("a", 7), 0],
                        [sectionBreak, 0],
                        [paragraph("b", 1), 1],
                    ],
                    { sections: [SECTION, next] },
                );
            // a fills the first page, and b starts the second, below the page, on the same page or on pages of another size
            expect(pagesOf(content({ ...SECTION, start: "continuous" }))).to.deep.equal({ a: "1", b: "2" });
            expect(pagesOf(content(SECTION))).to.deep.equal({ a: "1", b: "2" });
            expect(pagesOf(content({ ...SECTION, start: "continuous", pageHeight: 100 }))).to.deep.equal({ a: "1", b: "2" });
            // The heading kept with the next is the section's last line, on the first page
            const kept = document(
                [
                    [paragraph("a", 6), 0],
                    [paragraph("heading", 1, { keepNext: true }), 0],
                    [sectionBreak, 0],
                    [paragraph("b", 1), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous" }] },
            );
            expect(pagesOf(kept)).to.deep.equal({ a: "1", heading: "1", b: "2" });
        });

        it("should give the empty paragraph that ends a section a line of its own after a table, as Word does", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            const content = document(
                [
                    [table(Array.from({ length: 6 }, (_, index) => row([[paragraph(`r${index + 1}`, 1)]]))), 0],
                    [sectionBreak, 0],
                    [paragraph("b", 1), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous" }] },
            );
            // The 6 rows and the empty paragraph's line fill the page
            expect(pagesOf(content)).to.include({ r6: "1", b: "2" });
        });

        it("should put the space after the empty paragraph's line after a table below it, as for any line, as Word does", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], format: { spaceAfter: 10 }, sectionBreak: true };
            const content = document(
                [
                    [table(Array.from({ length: 5 }, (_, index) => row([[paragraph(`r${index + 1}`, 1)]]))), 0],
                    [sectionBreak, 0],
                    [paragraph("b", 1, { spaceBefore: 10 }), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous" }] },
            );
            // Its 10 after and b's 10 before are the larger of the two below its line, so b doesn't fit on the page. In
            // Word's `columns`, the heading after its table is a line and 12 points below it, the larger of the empty
            // paragraph's 5 after and the heading's 12 before
            expect(pagesOf(content)).to.include({ r5: "1", b: "2" });
        });

        describe("the space around the empty paragraph that ends a section", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            /**
             * The space between a paragraph of a line at the end of a section and the next section's first, on the same page,
             * from how many lines of 10 points fit below them
             */
            const spaceAcross = (last: ParagraphBlock, end: ParagraphBlock, first: ParagraphBlock): number => {
                const lines = Array.from({ length: 5 }, (_, index) => paragraph(`line ${index}`, 1));
                const pages = pagesOf(
                    document([[last, 0], [end, 0], [first, 1], ...lines.map((line): readonly [Block, number] => [line, 1])], {
                        sections: [SECTION, { ...SECTION, start: "continuous" }],
                    }),
                );
                return 50 - 10 * lines.filter((_, index) => pages[`line ${index}`] === "1").length;
            };
            const endAfter = (spaceAfter: number, style?: string): ParagraphBlock => ({ ...sectionBreak, format: { spaceAfter }, style });

            it("should collapse the space after the section's last paragraph and before the next's with the empty paragraph's, not each other, as Word does", () => {
                // 10 after and 20 before, with the empty paragraph's spacing at 0, are 30, where LibreOffice has 20
                expect(spaceAcross(paragraph("a", 1, { spaceAfter: 10 }), sectionBreak, paragraph("b", 1, { spaceBefore: 20 }))).to.equal(
                    30,
                );
            });

            it("should put the empty paragraph's space after only where the next section's space before is less, as Word does", () => {
                // 0 after the last line, 20 after the empty paragraph and 0 before leave none (`word-rules2.docx` Q6b and
                // Q7b), 40 after a paragraph of another style leaves 40 (`word-contextual.docx` X1c), and 40 before leaves 20
                expect(spaceAcross(paragraph("a", 1), endAfter(20), paragraph("b", 1))).to.equal(0);
                expect(spaceAcross(paragraph("a", 1, { spaceAfter: 40 }, "Other"), endAfter(20), paragraph("b", 1))).to.equal(40);
                expect(spaceAcross(paragraph("a", 1), endAfter(20), paragraph("b", 1, { spaceBefore: 40 }))).to.equal(20);
            });

            it("should leave out the space of a paragraph with contextual spacing next to it, as Word does", () => {
                const contextual = { contextualSpacing: true };
                // 40 after a contextual last paragraph of the empty paragraph's style leave none (X1a), and so does 40 before
                // a contextual first paragraph (X1b)
                expect(spaceAcross(paragraph("a", 1, { spaceAfter: 40, ...contextual }), endAfter(20), paragraph("b", 1))).to.equal(0);
                expect(spaceAcross(paragraph("a", 1), endAfter(20), paragraph("b", 1, { spaceBefore: 40, ...contextual }))).to.equal(0);
                // An empty paragraph with contextual spacing, from its style, takes its space after from the next
                // paragraph's space before only once
                const contextualEnd: ParagraphBlock = { ...sectionBreak, format: { spaceAfter: 20, ...contextual } };
                expect(spaceAcross(paragraph("a", 1), contextualEnd, paragraph("b", 1, { spaceBefore: 40 }))).to.equal(20);
            });

            it("should leave out the empty paragraph's space before at the top of a page, as any paragraph's", () => {
                // After a page break, b and c fill the page below it
                const atTop = document(
                    [
                        [withItems(paragraph("a", 1), [{ type: "break", kind: "page", font: {} }]), 0],
                        [{ ...sectionBreak, format: { spaceBefore: 30 } }, 0],
                        [paragraph("b", 6), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [SECTION, { ...SECTION, start: "continuous" }] },
                );
                expect(pagesOf(atTop)).to.deep.equal({ a: "1", b: "2", c: "2" });
            });
        });

        it("should start a section in the next column of the page after the same columns, as Word does", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            const content = document(
                [
                    [paragraph("a", 2), 0],
                    [sectionBreak, 0],
                    [paragraph("b", 7), 1],
                    [sectionBreak, 1],
                    [paragraph("c", 1), 2],
                ],
                { sections: [COLUMNS, { ...COLUMNS, start: "nextColumn" }, { ...COLUMNS, start: "nextColumn" }] },
            );
            // b fills the second column of the first page, below its top rather than below a, and c, in the last column
            // started, starts a new page
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                    ["c", "2"],
                ]),
                pageCount: 2,
                sectionPageCounts: [undefined, undefined, 1],
            });
            // In 3 columns, each starts in the next
            const three: Section = { ...SECTION, columns: [80, 80, 80] };
            const inThree = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1), 1],
                    [paragraph("c", 7), 2],
                    [paragraph("d", 1), 2],
                ],
                { sections: [three, { ...three, start: "nextColumn" }, { ...three, start: "nextColumn" }] },
            );
            expect(pagesOf(inThree)).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
        });

        it("should start a section in the next column on a new page after other columns, or after the last column started", () => {
            const after = (previous: Section, next: Section, lines = 1): Record<string, string> =>
                pagesOf(
                    document(
                        [
                            [paragraph("a", lines), 0],
                            [paragraph("b", 1), 1],
                        ],
                        { sections: [previous, { ...next, start: "nextColumn" }] },
                    ),
                );
            const three: Section = { ...SECTION, columns: [80, 80, 80] };
            // 2 columns into 3, 3 into 2, and 1 into 2 (`word-rules2.docx` Q5b and Q5c, `word-next-column.docx` N3)
            expect(after(COLUMNS, three)).to.deep.equal({ a: "1", b: "2" });
            expect(after(three, COLUMNS)).to.deep.equal({ a: "1", b: "2" });
            expect(after(SECTION, COLUMNS)).to.deep.equal({ a: "1", b: "2" });
            // After the second of 2 columns started (Q5d), and in sections of one column
            expect(after(COLUMNS, COLUMNS, 9)).to.deep.equal({ a: "1", b: "2" });
            expect(after(SECTION, SECTION)).to.deep.equal({ a: "1", b: "2" });
            // On pages of another size
            expect(after(COLUMNS, { ...COLUMNS, pageHeight: 100 })).to.deep.equal({ a: "1", b: "2" });
        });

        it("should keep the space before a section's first paragraph at the top of the next column, as Word does", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true, format: { spaceAfter: 20 } };
            const content = (spaceBefore: number): DocumentContent =>
                document(
                    [
                        [paragraph("a", 1), 0],
                        [sectionBreak, 0],
                        [paragraph("b", 5, { spaceBefore }), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [COLUMNS, { ...COLUMNS, start: "nextColumn" }] },
                );
            // Only as much of it as is more than the 20 after the empty paragraph that ends the section before: 10 of 30,
            // so c fits below b in the second column, and 20 of 40, so it doesn't (`word-next-column.docx` N1 and N2)
            expect(pagesOf(content(20))).to.deep.equal({ a: "1", b: "1", c: "1" });
            expect(pagesOf(content(30))).to.deep.equal({ a: "1", b: "1", c: "1" });
            expect(pagesOf(content(40))).to.deep.equal({ a: "1", b: "1", c: "2" });
            // A first paragraph kept with the next stays at the top of the column with its space before, as it does at the
            // top of a page, though its 60 before leave room for only its line, and the next goes on in the column after
            const kept = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1, { keepNext: true, spaceBefore: 60 }), 1],
                    [paragraph("c", 7), 1],
                ],
                {
                    sections: [
                        { ...COLUMNS, columns: [80, 80, 80] },
                        { ...COLUMNS, columns: [80, 80, 80], start: "nextColumn" },
                    ],
                },
            );
            expect(pagesOf(kept)).to.deep.equal({ a: "1", b: "1", c: "1" });
        });

        it("should start a section in the next column of columns below text, and the next section below the longest, as Word does", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true, format: { spaceAfter: 20 } };
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 4), 1],
                    [sectionBreak, 1],
                    [paragraph("c", 1), 2],
                    [paragraph("d", 2), 3],
                    [paragraph("e", 1), 3],
                ],
                {
                    sections: [
                        SECTION,
                        { ...COLUMNS, start: "continuous" },
                        { ...COLUMNS, start: "nextColumn" },
                        { ...SECTION, start: "continuous" },
                    ],
                },
            );
            // c is beside b, and d goes right below b, without the 20 after the empty paragraph that ends b's section, and
            // with the columns not evened out (`word-next-column.docx` N6), so e doesn't fit below it
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "1", e: "2" });
        });

        it("should stop where Word's way of starting a section in the next column isn't known", () => {
            const blocks: readonly (readonly [Block, number])[] = [
                [paragraph("a", 1), 0],
                [paragraph("b", 1), 1],
                [paragraph("c", 1), 2],
            ];
            const stoppedAt = (sections: readonly Section[]): string | undefined =>
                paginate(document(blocks, { sections }), { measurer: MEASURER }).stoppedAt;
            const three: Section = { ...SECTION, columns: [80, 80, 80] };
            // Columns of other widths, which Word starts it in the next column of (N4), but at which width isn't known
            expect(stoppedAt([COLUMNS, { ...COLUMNS, columns: [70, 70], start: "nextColumn" }, SECTION])).to.equal(
                "a section that starts in the next column of columns of other widths",
            );
            // Columns evened out before a continuous section break, when a section that started in the next column has
            // columns after it
            expect(stoppedAt([three, { ...three, start: "nextColumn" }, { ...SECTION, start: "continuous" }])).to.equal(
                "columns evened out after a section that starts in the next column",
            );
        });

        describe("a paragraph kept together that is taller than a column", () => {
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            /** A paragraph of 10 lines kept together, with a bookmark on its 8th line */
            const kept = withItems(paragraph("kept", 7, { keepLines: true }), [
                { type: "marker", name: "eighth" },
                { type: "text", text: " abcdefgh abcdefgh abcdefgh", font: {} },
            ]);

            it("should lay it out in only the first column of each page", () => {
                // Its first 7 lines fill the first column, and the rest go on the next page, rather than in the second column
                expect(pagesOf(document([kept], { sections: [COLUMNS] }))).to.deep.equal({ kept: "1", eighth: "2" });
                // A paragraph kept together that fits in a column breaks across the columns as any other does
                expect(pagesOf(document([paragraph("seven", 7, { keepLines: true })], { sections: [COLUMNS] }))).to.deep.equal({
                    seven: "1",
                });
            });

            it("should move it to a new page from columns that start below something on the page, as Word's W3 did", () => {
                const content = document(
                    [
                        [paragraph("top", 1), 0],
                        [sectionBreak, 0],
                        [kept, 1],
                        [sectionBreak, 1],
                        [paragraph("b", 4), 2],
                        [paragraph("c", 1), 2],
                    ],
                    { sections: [SECTION, { ...COLUMNS, start: "continuous" }, { ...SECTION, start: "continuous" }] },
                );
                // It goes 7 lines and 3 in the first columns of pages 2 and 3, rather than 6 and 4 in the columns of page 1
                // and 2 more on page 2. The columns of page 3 are evened out with its 3 lines together, so b's 4 lines fill the
                // page below them, and c goes on the next
                expect(pagesOf(content)).to.deep.equal({ top: "1", kept: "2", eighth: "3", b: "3", c: "4" });
            });

            it("should move it to a new page from anywhere but the top of the page's first column", () => {
                const below = (blocks: readonly Block[]): Record<string, string> =>
                    pagesOf(document([...blocks, kept], { sections: [COLUMNS] }));
                // Below a line in the first column, and at the top of the second, as in Word's K3 and K2b
                expect(below([paragraph("a", 1)])).to.deep.equal({ a: "1", kept: "2", eighth: "3" });
                expect(below([paragraph("a", 7)])).to.deep.equal({ a: "1", kept: "2", eighth: "3" });
            });

            it("should stop where it would move away from a paragraph kept with it, which Word hasn't shown", () => {
                const stopped = (blocks: readonly Block[]): string | undefined =>
                    paginate(document(blocks, { sections: [COLUMNS] }), { measurer: MEASURER }).stoppedAt;
                const reason = "a paragraph kept with the next before a paragraph kept together taller than a column";
                // Below a line, and at the top of a page, a heading kept with it would be left on its own
                expect(stopped([paragraph("a", 1), paragraph("heading", 1, { keepNext: true }), kept])).to.equal(reason);
                expect(stopped([paragraph("heading", 1, { keepNext: true }), kept])).to.equal(reason);
                // Kept with it at the top of a page of a section of its own, it doesn't move, and isn't kept with what is before
                const nextPage = document(
                    [
                        [paragraph("heading", 1, { keepNext: true }), 0],
                        [kept, 1],
                    ],
                    { sections: [SECTION, COLUMNS] },
                );
                expect(pagesOf(nextPage)).to.deep.equal({ heading: "1", kept: "2", eighth: "3" });
            });

            it("should lay out what follows it below it in the first column, and on into the next, as Word's K1 did", () => {
                // b's 11 lines go 4 below kept's last 3, and 7 in the second column of page 2, as the second column of page 1
                // is left empty
                expect(pagesOf(document([kept, paragraph("b", 11), paragraph("c", 1)], { sections: [COLUMNS] }))).to.deep.equal({
                    kept: "1",
                    eighth: "2",
                    b: "2",
                    c: "3",
                });
                // Evened out before a continuous section break, kept's last 3 lines and f1 go in the first column and f2 to f4
                // in the second, so b's 3 lines fit below them
                const content = document(
                    [
                        [paragraph("top", 1), 0],
                        [sectionBreak, 0],
                        [kept, 1],
                        ...["f1", "f2", "f3", "f4"].map((name): readonly [Block, number] => [paragraph(name, 1), 1]),
                        [sectionBreak, 1],
                        [paragraph("b", 3), 2],
                        [paragraph("c", 1), 2],
                    ],
                    { sections: [SECTION, { ...COLUMNS, start: "continuous" }, { ...SECTION, start: "continuous" }] },
                );
                expect(pagesOf(content)).to.include({ kept: "2", eighth: "3", f1: "3", f4: "3", b: "3", c: "4" });
                // A section on a new page after it starts on the next page
                const nextPage = document(
                    [
                        [kept, 0],
                        [paragraph("b", 1), 1],
                    ],
                    { sections: [COLUMNS, SECTION] },
                );
                expect(pagesOf(nextPage)).to.deep.equal({ kept: "1", eighth: "2", b: "3" });
            });
        });

        it("should repeat a table's header rows at the top of each column, as Word does", () => {
            const header = row([[paragraph("header", 1)]], { header: true });
            const rows = Array.from({ length: 9 }, (_, index) => row([[paragraph(`r${index + 1}`, 1)]]));
            const content = document([paragraph("a", 5), table([header, ...rows])], { sections: [COLUMNS] });
            // a, the header and r1 fill the first column, and the header and 6 rows the second, so r8 starts the next page
            expect(pagesOf(content)).to.include({ r1: "1", r2: "1", r7: "1", r8: "2" });
        });

        it("should repeat a table's header rows above the rest of a row that breaks across columns", () => {
            const tall = withItems(paragraph("tall", 8), [{ type: "marker", name: "end" }]);
            const content = document(
                [paragraph("a", 4), table([row([[paragraph("header", 1)]], { header: true }), row([[tall]])]), paragraph("b", 1)],
                {
                    sections: [COLUMNS],
                },
            );
            // 2 of tall's lines below a and the header, and its other 6 below the header in the second column, which leaves
            // no room for b
            expect(pagesOf(content)).to.include({ tall: "1", end: "1", b: "2" });
        });

        describe("of different widths", () => {
            // A word of "abc" on each line of a column 40 points wide, and 3 to a line of one 120 points wide
            const NARROW_FIRST: Section = { ...SECTION, columns: [40, 120] };
            const WIDE_FIRST: Section = { ...SECTION, columns: [120, 40] };
            /** A paragraph of words of 3 characters, bookmarked with its name, and some of its words with theirs */
            const words = (name: string, count: number, marked: Readonly<Record<number, string>> = {}, format: ParagraphFormat = {}) => ({
                ...paragraph(name, 0, format),
                items: [
                    { type: "marker", name } as const,
                    ...Array.from({ length: count }, (_, index): readonly LayoutItem[] => [
                        ...(marked[index] === undefined ? [] : [{ type: "marker", name: marked[index] } as const]),
                        { type: "text", text: index < count - 1 ? "abc " : "abc", font: {} },
                    ]).flat(),
                ],
            });
            const lines = (prefix: string, count: number): readonly ParagraphBlock[] =>
                Array.from({ length: count }, (_, index) => words(`${prefix}${index + 1}`, 1));
            const stoppedAt = (content: DocumentContent): string | undefined => paginate(content, { measurer: MEASURER }).stoppedAt;

            it("should break the lines of a paragraph again at the width of each column it goes on into, as Word does", () => {
                // 7 words on 7 lines in the first column of each page, and 21 on 7 lines in the second
                const long = words("long", 60, { 27: "w28", 28: "w29", 55: "w56", 56: "w57" });
                expect(pagesOf(document([long], { sections: [NARROW_FIRST] }))).to.deep.equal({
                    long: "1",
                    w28: "1",
                    w29: "2",
                    w56: "2",
                    w57: "3",
                });
            });

            it("should break the text after a column break at the width of the next column", () => {
                const broken = {
                    ...words("a", 1),
                    items: [
                        ...words("a", 1).items,
                        { type: "break", kind: "column", font: {} } as const,
                        ...words("rest", 22, { 14: "w15", 21: "w22" }).items,
                    ],
                };
                // The 22 words after the break go on 7 lines of 3 in the second column, less one for widow control, and 4
                // lines of 1 on the next page
                expect(pagesOf(document([broken], { sections: [NARROW_FIRST] }))).to.deep.equal({ a: "1", rest: "1", w15: "1", w22: "2" });
            });

            it("should move paragraphs kept with the next to the next column when they fit there at its width", () => {
                // The heading takes 6 lines in the first column, but 2 in the second, where b's line fits below it
                const content = document([...lines("a", 4), words("heading", 6, {}, { keepNext: true }), words("b", 3)], {
                    sections: [NARROW_FIRST],
                });
                expect(pagesOf(content)).to.include({ heading: "1", b: "1" });
                // Lines kept together that don't fit move to the next column, where they take 2 lines and leave room for
                // b's 5
                const kept = document([...lines("a", 4), words("kept", 6, {}, { keepLines: true }), words("b", 15)], {
                    sections: [NARROW_FIRST],
                });
                expect(pagesOf(kept)).to.include({ kept: "1", b: "1" });
            });

            it("should stop at a paragraph kept together that is taller than one of the columns, which Word lays out in a way not yet known", () => {
                // 9 lines in the narrow column, and 3 in the wide one. Word lays one taller than a column down only the first
                // column of each page, in columns of the same width
                const kept = words("kept", 9, {}, { keepLines: true });
                const reason = "a paragraph kept together taller than a column, in columns of different widths";
                expect(stoppedAt(document([kept], { sections: [NARROW_FIRST] }))).to.equal(reason);
                expect(stoppedAt(document([...lines("a", 7), kept], { sections: [NARROW_FIRST] }))).to.equal(reason);
            });

            it("should count the lines left for the next column as they are broken in this one, for widow control, as Word does", () => {
                // 5 words on 5 lines of the narrow second column, with room for 3. The 2 left would go on 1 line of the wide
                // column of the next page, alone at its top, as Word leaves them (word-column-widths.docx R1), where
                // LibreOffice moves the paragraph on
                const narrow = document([...lines("a", 7), ...lines("b", 4), words("p", 5, { 2: "w3", 3: "w4" })], {
                    sections: [WIDE_FIRST],
                });
                expect(pagesOf(narrow)).to.include({ p: "1", w3: "1", w4: "2" });
                // 12 words on 4 lines of the wide second column, with room for 3. The last line would be alone at the top of
                // the next page, where its 3 words go on 3 lines of the narrow column, so a line goes with it, as Word moves
                // it (R2 and R4), and its 6 words go on 6 lines there
                const wide = document([...lines("a", 7), ...lines("b", 4), words("p", 12, { 5: "w6", 6: "w7" })], {
                    sections: [NARROW_FIRST],
                });
                expect(pagesOf(wide)).to.include({ p: "1", w6: "1", w7: "2" });
            });

            it("should even out columns of different widths by their height, as Word does", () => {
                /** Blocks in columns, then b and c in a continuous section of one column, whose pages show where it starts */
                const balanced = (blocks: readonly Block[], after: number): DocumentContent =>
                    document(
                        [
                            ...blocks.map((block): readonly [Block, number] => [block, 0]),
                            [paragraph("b", after), 1],
                            [paragraph("c", 1), 1],
                        ],
                        { sections: [NARROW_FIRST, { ...SECTION, start: "continuous" }] },
                    );
                // 12 lines go 6 and 6, and b's 2 lines don't fit below them
                expect(pagesOf(balanced(lines("a", 12), 2))).to.include({ a6: "1", a7: "1", b: "2" });
                // 12 words go on 3 lines in the narrow column and 3 lines of 3 in the wide one, so b's 4 lines fill the page
                expect(pagesOf(balanced([words("p", 12)], 4))).to.include({ b: "1", c: "2" });
                // 14 words go 4 and 10, on 4 lines in each column, so b's 3 lines fill the page
                expect(pagesOf(balanced([words("p", 14)], 3))).to.include({ b: "1", c: "2" });
            });

            it("should break a table across columns of different widths, keeping the widths it is sized to in a wider column", () => {
                const rows = (text: string): TableBlock =>
                    table(
                        Array.from({ length: 10 }, (_, index) =>
                            row([
                                [
                                    {
                                        ...paragraph(`row${index + 1}`, 0),
                                        items: [
                                            { type: "marker", name: `row${index + 1}` },
                                            { type: "text", text, font: {} },
                                        ],
                                    },
                                ],
                            ]),
                        ),
                    );
                const fixed = rows("abc");
                // 7 rows in the first column, and 3 in the second
                expect(pagesOf(document([fixed, words("b", 1)], { sections: [NARROW_FIRST] }))).to.include({ row10: "1", b: "1" });
                // Sized to its text in the narrow column, each row takes 2 lines there and in the wide one, as in Word
                // (word-column-widths.docx R5 and R6), so 3 rows go in each column of the first page, and the rest on the next
                const fitted: TableBlock = { ...rows("abc abc"), fit: {} };
                expect(pagesOf(document([fitted], { sections: [NARROW_FIRST] }))).to.include({ row6: "1", row7: "2" });
                // Going on into a narrower column, which it might not fit in
                expect(stoppedAt(document([fitted], { sections: [WIDE_FIRST] }))).to.equal(
                    "a table sized to its text that goes on into a narrower column",
                );
                expect(pagesOf(document([{ ...fixed, fit: {} }], { sections: [WIDE_FIRST] }))).to.include({ row10: "1" });
            });
        });
    });

    describe("footnotes and endnotes", () => {
        // The separator above the footnotes: an empty paragraph, a line tall
        const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
        const noted = (block: ParagraphBlock, ...notes: readonly string[]): ParagraphBlock =>
            withItems(
                block,
                notes.map((note) => ({ type: "marker", name: note })),
            );
        /** A paragraph of lines that each fill a line, bookmarked with its name, with markers at the start of some of them */
        const markedLines = (
            name: string,
            lines: number,
            markers: Record<number, readonly string[]>,
            format: ParagraphFormat = {},
        ): ParagraphBlock => ({
            ...paragraph(name, lines, format),
            items: [
                { type: "marker", name },
                ...Array.from({ length: lines }, (_, line): readonly LayoutItem[] => [
                    ...(markers[line + 1] ?? []).map((marker): LayoutItem => ({ type: "marker", name: marker })),
                    { type: "text", text: line < lines - 1 ? "abcdefgh " : "abcdefgh", font: {} },
                ]).flat(),
            ],
        });
        const withNotes = (blocks: Parameters<typeof document>[0], notes: Record<string, readonly Block[]>): DocumentContent =>
            document(blocks, {
                footnotes: new Map(Object.entries(notes)),
                footnoteSeparator: [SEPARATOR],
                footnoteContinuationSeparator: [SEPARATOR],
            });

        it("should leave room at the bottom of a page for the footnotes of its lines, below their separator", () => {
            const content = withNotes([paragraph("a", 4), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], {
                "footnote 1": [paragraph("note", 1)],
            });
            // The separator and the footnote take 2 lines, so c goes on the next page. Bookmarks in footnotes aren't placed
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should move a line to the next page with its footnote when they don't both fit", () => {
            const content = withNotes([paragraph("a", 5), noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [paragraph("note", 1)],
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
        });

        it("should continue a footnote that doesn't fit below its reference at the bottom of the next page, and put what follows there", () => {
            const content = withNotes(
                [paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1), paragraph("d", 2), paragraph("e", 1)],
                { "footnote 1": [paragraph("note", 5)] },
            );
            // Below b, the separator and 2 of the footnote's lines fill the page. Its other 3 go below the continuation
            // separator on the next, which leaves room for 3 lines, as Word and LibreOffice lay it out
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2", d: "2", e: "3" });
            // The page's own footnotes go below it
            const both = withNotes(
                [
                    paragraph("a", 3),
                    noted(paragraph("b", 1), "footnote 1"),
                    noted(paragraph("c", 1), "footnote 2"),
                    paragraph("d", 1),
                    paragraph("e", 1),
                ],
                { "footnote 1": [paragraph("note", 5)], "footnote 2": [paragraph("two", 1)] },
            );
            expect(pagesOf(both)).to.deep.equal({ a: "1", b: "1", c: "2", d: "2", e: "3" });
            // The lines of the paragraph after the reference's go on the next page too
            const within: ParagraphBlock = {
                ...paragraph("b", 1),
                items: [
                    { type: "marker", name: "b" },
                    { type: "text", text: "abcdefgh ", font: {} },
                    { type: "marker", name: "footnote 1" },
                    { type: "text", text: "abcdefgh ", font: {} },
                    { type: "marker", name: "late" },
                    { type: "text", text: "abcdefgh abcdefgh", font: {} },
                ],
            };
            expect(pagesOf(withNotes([paragraph("a", 2), within], { "footnote 1": [paragraph("note", 5)] }))).to.deep.equal({
                a: "1",
                b: "1",
                late: "2",
            });
        });

        it("should put the rest of a footnote continued from the last page on a page of its own", () => {
            const content = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [paragraph("note", 5)],
            });
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                ]),
                pageCount: 2,
                sectionPageCounts: [2],
            });
        });

        it("should move a line to the next page with its footnote when none of the footnote fits", () => {
            const long = withNotes([paragraph("a", 5), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [paragraph("note", 5)] });
            expect(pagesOf(long)).to.deep.equal({ a: "1", b: "2" });
            const paragraphs = withNotes([paragraph("a", 5), noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [paragraph("one", 1), paragraph("two", 1)],
            });
            expect(pagesOf(paragraphs)).to.deep.equal({ a: "1", b: "2" });
            const tabled = withNotes([paragraph("a", 5), noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [table([row([[paragraph("cell", 1)]])])],
            });
            expect(pagesOf(tabled)).to.deep.equal({ a: "1", b: "2" });
            const empty = withNotes([paragraph("a", 6), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [] });
            expect(pagesOf(empty)).to.deep.equal({ a: "1", b: "2" });
            // b's second line, with no footnote of its own, doesn't leave room for the footnote of its first, so widow
            // control moves both
            const before = { ...paragraph("b", 2), items: [{ type: "marker" as const, name: "footnote 1" }, ...paragraph("b", 2).items] };
            expect(pagesOf(withNotes([paragraph("a", 4), before], { "footnote 1": [paragraph("note", 1)] }))).to.deep.equal({
                a: "1",
                b: "2",
            });
        });

        // Word's results in these are from word-probes.docx (scripts/layout-probes), on pages of 51 lines, made smaller

        it("should keep a continued footnote's widow and orphan control, and move its reference's line with it where none of it can stay, as Word does", () => {
            const reference = (above: number, ...following: readonly Block[]): readonly Block[] => [
                paragraph("a", above),
                noted(paragraph("b", 1), "footnote 1"),
                ...following,
            ];
            const note = (lines: number, format: ParagraphFormat = {}): Record<string, readonly Block[]> => ({
                "footnote 1": [paragraph("note", lines, format)],
            });
            // With room for 2 of its 3 lines, or 1 of 2, it can't have 2 on each page, so the reference's line moves (U2a, U2d)
            expect(pagesOf(withNotes(reference(3), note(3)))).to.deep.equal({ a: "1", b: "2" });
            expect(pagesOf(withNotes(reference(4), note(2)))).to.deep.equal({ a: "1", b: "2" });
            // With room for 4 of its 5 lines, it goes 3 and 2, rather than leave the last alone, so c fills the next page
            // above the 2 (U2b)
            const after = [paragraph("c", 4), paragraph("d", 1)];
            expect(pagesOf(withNotes(reference(1, ...after), note(5)))).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            // Without widow control, 4 and 1 (U2c)
            expect(pagesOf(withNotes(reference(1, ...after), note(5, { widowControl: false })))).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
                d: "2",
            });
            // With room for 1, the reference's line moves, and without widow control, it goes 1 and 4 (U2b, U2c)
            expect(pagesOf(withNotes(reference(4), note(5)))).to.deep.equal({ a: "1", b: "2" });
            const one = withNotes(reference(4, paragraph("c", 2), paragraph("d", 1)), note(5, { widowControl: false }));
            expect(pagesOf(one)).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            // With room for 3 of 4, 2 and 2 (U2e)
            expect(pagesOf(withNotes(reference(2, ...after), note(4)))).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
        });

        it("should break a continued footnote between its paragraphs and table rows, or in a paragraph as its widow control lets it, as Word does", () => {
            const reference = (above: number, ...following: readonly Block[]): readonly Block[] => [
                paragraph("a", above),
                noted(paragraph("b", 1), "footnote 1"),
                ...following,
            ];
            const after = [paragraph("c", 4), paragraph("d", 1)];
            // Paragraphs of 2 and 4 lines, with room for 4: the first and 2 lines of the second, and the other 2 (U2f)
            const two = { "footnote 1": [paragraph("one", 2), paragraph("two", 4)] };
            expect(pagesOf(withNotes(reference(1, ...after), two))).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            // With room for 3, only the first, rather than leave the second's first line alone. The reference's line ends
            // the page, so c goes on the next, though a line's room is left
            const lines = [paragraph("c", 1), paragraph("d", 1), paragraph("e", 1)];
            expect(pagesOf(withNotes(reference(2, ...lines), two))).to.deep.equal({ a: "1", b: "1", c: "2", d: "2", e: "3" });
            // 3 one-line paragraphs with room for 2 go 2 and 1, and with room for 1, 1 and 2 (U2g)
            const three = { "footnote 1": [paragraph("one", 1), paragraph("two", 1), paragraph("three", 1)] };
            expect(pagesOf(withNotes(reference(3, ...after), three))).to.deep.equal({ a: "1", b: "1", c: "2", d: "2" });
            expect(pagesOf(withNotes(reference(4, ...after), three))).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            // A line, a table of 4 one-line rows and a line, with room for 3: the line and 2 rows, then 2 rows and the line.
            // With room for 1, the line, then the table and the line (U2h)
            const rows = [1, 2, 3, 4].map((at) => row([[paragraph(`row ${at}`, 1)]]));
            const tabled = { "footnote 1": [paragraph("one", 1), table(rows), paragraph("end", 1)] };
            expect(pagesOf(withNotes(reference(2, paragraph("c", 3), paragraph("d", 1)), tabled))).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
                d: "3",
            });
            expect(pagesOf(withNotes(reference(4, paragraph("c", 1), paragraph("d", 1)), tabled))).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
                d: "3",
            });
            const whole = [
                row([[paragraph("one", 1)]]),
                row([[paragraph("kept", 3)]], { cantSplit: true }),
                row([[paragraph("set", 2)]], { height: { value: 20, rule: "exact" } }),
            ];
            // Rows kept whole or of a set height break between them as one-line rows do: the first row, then the other two
            // above c
            expect(pagesOf(withNotes(reference(2, paragraph("c", 1), paragraph("d", 1)), { "footnote 1": [table(whole)] }))).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
                d: "3",
            });
        });

        it("should put the lines widow control or keepLines leave on the page, and continue their footnote below them, as Word does", () => {
            // b's 4 lines from the page's second line, with a reference on the first: 3 fit with 2 lines of its footnote, and
            // widow control leaves 2, with 3 lines of the footnote below them and 2 on the next page (U2j)
            const note = { "footnote 1": [paragraph("note", 5)] };
            const first = markedLines("b", 4, { 1: ["footnote 1"], 3: ["third"] });
            expect(pagesOf(withNotes([paragraph("a", 1), first, paragraph("c", 2), paragraph("d", 1)], note))).to.deep.equal({
                a: "1",
                b: "1",
                third: "2",
                c: "2",
                d: "3",
            });
            // With the reference on its third line, widow control moves that line to the next page, and all of the footnote
            const third = markedLines("b", 4, { 3: ["third", "footnote 1"] });
            expect(
                pagesOf(withNotes([paragraph("a", 1), third, paragraph("c", 1)], { "footnote 1": [paragraph("note", 4)] })),
            ).to.deep.equal({
                a: "1",
                b: "1",
                third: "2",
                c: "3",
            });
            // Kept together, it doesn't fit with 2 lines of its footnote, so it moves to the next page with it (U2k)
            const kept = markedLines("b", 4, { 1: ["footnote 1"] }, { keepLines: true });
            expect(pagesOf(withNotes([paragraph("a", 2), kept, paragraph("c", 1)], note))).to.deep.equal({ a: "1", b: "2", c: "3" });
            // Without widow control, the 3 that fit stay, with 2 lines of the footnote below them
            const unkept = markedLines("b", 4, { 1: ["footnote 1"], 4: ["fourth"] }, { widowControl: false });
            expect(pagesOf(withNotes([paragraph("a", 1), unkept, paragraph("c", 1)], note))).to.deep.equal({
                a: "1",
                b: "1",
                fourth: "2",
                c: "2",
            });
        });

        it("should keep a line with the next one's lines, and continue its footnote below them, as Word does", () => {
            // The heading and the line it is kept with fit with 2 lines of its footnote, which goes below them (U2l)
            const note = { "footnote 1": [paragraph("note", 5)] };
            const heading = noted(paragraph("heading", 1, { keepNext: true }), "footnote 1");
            const content = withNotes([paragraph("a", 2), heading, paragraph("next", 1), paragraph("c", 3), paragraph("d", 1)], note);
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "1", next: "1", c: "2", d: "3" });
            // And below a paragraph kept with it too
            const second = paragraph("second", 1, { keepNext: true });
            const chain = withNotes([paragraph("a", 1), heading, second, paragraph("next", 1), paragraph("c", 3), paragraph("d", 1)], note);
            expect(pagesOf(chain)).to.deep.equal({ a: "1", heading: "1", second: "1", next: "1", c: "2", d: "3" });
            // They move to the next page together when they don't fit with as much of it as has to go with them
            const short = { "footnote 1": [paragraph("note", 3)] };
            expect(pagesOf(withNotes([paragraph("a", 4), heading, paragraph("next", 1)], short))).to.deep.equal({
                a: "1",
                heading: "2",
                next: "2",
            });
            // and there, its footnote goes below the next's line too
            const moved = withNotes([paragraph("a", 5), heading, paragraph("next", 1), paragraph("c", 2), paragraph("d", 1)], {
                "footnote 1": [paragraph("note", 8)],
            });
            expect(pagesOf(moved)).to.deep.equal({ a: "1", heading: "2", next: "2", c: "3", d: "4" });
            // How much of a longer paragraph Word puts above it isn't known
            expect(
                paginate(withNotes([paragraph("a", 1), heading, paragraph("next", 4)], note), { measurer: MEASURER }).stoppedAt,
            ).to.equal("a footnote continued below a paragraph kept with the next");
        });

        it("should move a line to the next page when one of its footnotes before the last would have to continue, as Word does", () => {
            // A footnote of 4 lines and then one of a line don't fit below b, so it moves with them (U2m)
            const long = { "footnote 1": [paragraph("long", 4)], "footnote 2": [paragraph("short", 1)] };
            const both = noted(paragraph("b", 1), "footnote 1", "footnote 2");
            expect(pagesOf(withNotes([paragraph("a", 2), both, paragraph("c", 1)], long))).to.deep.equal({ a: "1", b: "2", c: "3" });
            // In the other order, the long one continues below the short one
            const short = { "footnote 1": [paragraph("short", 1)], "footnote 2": [paragraph("long", 4)] };
            expect(pagesOf(withNotes([paragraph("a", 2), both, paragraph("c", 4), paragraph("d", 1)], short))).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
                d: "3",
            });
            // A reference on the line after one whose footnote continues goes on the next page (U2n)
            const after = withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1"), noted(paragraph("c", 1), "footnote 2")], {
                "footnote 1": [paragraph("long", 5)],
                "footnote 2": [paragraph("short", 1)],
            });
            expect(pagesOf(after)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should fill pages with the rest of a footnote longer than a page, and go on with the text on the page it ends on, as Word does", () => {
            // A footnote of 20 lines from the page's second line: 4 below b, 6 on each of the next 2 pages, which have no
            // text, and 4 on the fourth, below c (U2o, U2q)
            const long = withNotes([paragraph("a", 1), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 2), paragraph("d", 1)], {
                "footnote 1": [paragraph("note", 20)],
            });
            expect(paginate(long, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                    ["c", "4"],
                    ["d", "5"],
                ]),
                pageCount: 5,
                sectionPageCounts: [5],
            });
            // Its widow control holds back a line on a page of it alone too: 9 lines go 2, 5 and 2
            const widowed = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 4), paragraph("d", 1)], {
                "footnote 1": [paragraph("note", 9)],
            });
            expect(pagesOf(widowed)).to.deep.equal({ a: "1", b: "1", c: "3", d: "4" });
            // When its rest fills the next page, the text goes on the page after
            const filling = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], {
                "footnote 1": [paragraph("note", 8)],
            });
            expect(pagesOf(filling)).to.deep.equal({ a: "1", b: "1", c: "3" });
            // And so does a table row, whether it can break across pages or is kept whole
            for (const changes of [{}, { cantSplit: true }]) {
                const tabled = withNotes(
                    [paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), table([row([[paragraph("cell", 1)]], changes)])],
                    { "footnote 1": [paragraph("note", 8)] },
                );
                expect(paginate(tabled, { measurer: MEASURER })).to.deep.equal({
                    bookmarks: new Map([
                        ["a", "1"],
                        ["b", "1"],
                        ["cell", "3"],
                    ]),
                    pageCount: 3,
                    sectionPageCounts: [3],
                });
            }
            // At the end of the document, its rest goes on pages of its own
            const last = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [paragraph("note", 12)] });
            expect(paginate(last, { measurer: MEASURER }).pageCount).to.equal(3);
            // Which section Word puts the pages of its rest in after a section break isn't known
            const sections = withNotes(
                [
                    [paragraph("a", 3), 0],
                    [noted(paragraph("b", 1), "footnote 1"), 0],
                    [paragraph("c", 1), 1],
                ],
                { "footnote 1": [paragraph("note", 12)] },
            );
            expect(paginate({ ...sections, sections: [SECTION, SECTION] }, { measurer: MEASURER }).stoppedAt).to.equal(
                "a footnote continued across a section break onto a page of its own",
            );
        });

        it("should stop where a footnote would break in a paragraph kept together or with the next, or a table row of more than a line or with header rows, as Word's breaks there aren't known", () => {
            const stoppedAt = (notes: Record<string, readonly Block[]>): string | undefined =>
                paginate(withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1")], notes), { measurer: MEASURER }).stoppedAt;
            const kept = "a paragraph kept together or with the next in a footnote across pages";
            // 3 of its 5 lines fit below b
            expect(stoppedAt({ "footnote 1": [paragraph("note", 5, { keepLines: true })] })).to.equal(kept);
            // Its first paragraph fits, and is kept with the next, of which 1 line fits, which widow control holds back
            expect(stoppedAt({ "footnote 1": [paragraph("one", 2, { keepNext: true }), paragraph("two", 4)] })).to.equal(kept);
            // A paragraph kept together none of which fits goes on the next page, as it would without it
            const later = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 2), paragraph("d", 1)], {
                "footnote 1": [paragraph("one", 1), paragraph("two", 4, { keepLines: true })],
            });
            expect(pagesOf(later)).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            expect(stoppedAt({ "footnote 1": [table([row([[paragraph("cell", 4)]])])] })).to.equal(
                "a table row of more than one line in a footnote across pages",
            );
            expect(
                stoppedAt({ "footnote 1": [table([row([[paragraph("one", 1), paragraph("two", 1)]]), row([[paragraph("next", 3)]])])] }),
            ).to.equal("a table row of more than one line in a footnote across pages");
            const nested = table([row([[paragraph("one", 1)]]), row([[table([row([[paragraph("cell", 3)]])])]])]);
            expect(stoppedAt({ "footnote 1": [nested] })).to.equal("a table row of more than one line in a footnote across pages");
            const headed = table([
                row([[paragraph("head", 1)]], { header: true }),
                ...[1, 2, 3].map((at) => row([[paragraph(`row ${at}`, 1)]])),
            ]);
            expect(stoppedAt({ "footnote 1": [headed] })).to.equal("a table's header rows in a footnote across pages");
        });

        it("should stop at a footnote that is taller than a page, or continued on a page in columns", () => {
            const exact = { lineSpacing: { rule: "exact" as const, height: 70 } };
            const tall = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [paragraph("note", 1, exact)] });
            expect(paginate(tall, { measurer: MEASURER }).stoppedAt).to.equal("a line and its footnote taller than a page");
            const later = withNotes([noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [paragraph("note", 5), paragraph("tall", 1, exact)],
            });
            expect(paginate(later, { measurer: MEASURER }).stoppedAt).to.equal("a footnote line taller than a page");
            const columns = withNotes(
                [
                    [paragraph("a", 3), 0],
                    [noted(paragraph("b", 1), "footnote 1"), 0],
                    [paragraph("c", 1), 1],
                ],
                { "footnote 1": [paragraph("note", 5)] },
            );
            const inColumns = { ...columns, sections: [SECTION, { ...SECTION, start: "continuous" as const, columns: [35, 35] }] };
            expect(paginate(inColumns, { measurer: MEASURER }).stoppedAt).to.equal("a footnote across pages in columns");
        });

        it("should stop at a footnote that can't be laid out", () => {
            const unsupported = { ...paragraph("note", 1), unsupported: "an equation" };
            const content = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [unsupported] });
            expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("an equation");
            // Nor a table in it whose columns can't be sized, as in the text
            const [cell] = row([[paragraph("cell", 1)]]).cells;
            const unsized = { ...table([{ ...row([]), cells: [{ ...cell, width: 20, ownWidth: 20 }] }]), widen: { acrossColumns: true } };
            const tabled = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [unsized] });
            expect(paginate(tabled, { measurer: MEASURER }).stoppedAt).to.equal(
                "a word longer than its cell in a table with cells merged across columns",
            );
        });

        it("should put the space between footnotes, but not before the separator or after the last footnote", () => {
            const content = document([noted(paragraph("a", 1), "footnote 1", "footnote 2"), paragraph("b", 2), paragraph("c", 1)], {
                footnotes: new Map([
                    ["footnote 1", [paragraph("one", 1, { spaceAfter: 10 })]],
                    ["footnote 2", [paragraph("two", 1, { spaceBefore: 5, spaceAfter: 30 })]],
                ]),
                footnoteSeparator: [{ ...SEPARATOR, format: { spaceBefore: 20 } }],
            });
            // The separator, the footnotes and the 10 points between them take 4 lines, leaving 3 for a and b
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should leave room for the footnotes of table rows, and stop at a row with footnotes that would break", () => {
            const note = { "footnote 1": [paragraph("note", 1)] };
            const fits = withNotes(
                [paragraph("a", 3), table([row([[noted(paragraph("cell", 2), "footnote 1")]])]), paragraph("b", 1)],
                note,
            );
            expect(pagesOf(fits)).to.deep.equal({ a: "1", cell: "1", b: "2" });
            const kept = withNotes(
                [paragraph("a", 4), table([row([[noted(paragraph("cell", 2), "footnote 1")]], { cantSplit: true })])],
                note,
            );
            expect(pagesOf(kept)).to.deep.equal({ a: "1", cell: "2" });
            const breaking = withNotes([paragraph("a", 4), table([row([[noted(paragraph("cell", 2), "footnote 1")]])])], note);
            expect(paginate(breaking, { measurer: MEASURER }).stoppedAt).to.equal("a footnote in a table row across pages");
            const tall = withNotes([table([row([[noted(paragraph("cell", 6), "footnote 1")]], { cantSplit: true })])], note);
            expect(paginate(tall, { measurer: MEASURER }).stoppedAt).to.equal("a footnote across pages");
            // A row that fits, but whose footnote of more than a line doesn't
            const long = withNotes([paragraph("a", 3), table([row([[noted(paragraph("cell", 2), "footnote 1")]], { cantSplit: true })])], {
                "footnote 1": [paragraph("note", 2)],
            });
            expect(paginate(long, { measurer: MEASURER }).stoppedAt).to.equal("a footnote in a table row across pages");
        });

        it("should keep a paragraph with the next on the page only when their footnotes fit too", () => {
            const note = { "footnote 1": [paragraph("note", 1)] };
            const heading = paragraph("heading", 1, { keepNext: true });
            const content = withNotes(
                [
                    paragraph("a", 3),
                    heading,
                    { ...paragraph("b", 3), items: [{ type: "marker", name: "footnote 1" }, ...paragraph("b", 3).items] },
                ],
                note,
            );
            // Without its footnote, b's 3 lines would fit below the heading
            expect(pagesOf(content)).to.deep.equal({ a: "1", heading: "2", b: "2" });
            const beforeTable = withNotes([paragraph("a", 4), heading, table([row([[noted(paragraph("cell", 1), "footnote 1")]])])], note);
            expect(pagesOf(beforeTable)).to.deep.equal({ a: "1", heading: "2", cell: "2" });
            const kept = withNotes(
                [paragraph("a", 2), noted(paragraph("kept", 1, { keepNext: true }), "footnote 1"), paragraph("b", 3)],
                note,
            );
            expect(pagesOf(kept)).to.deep.equal({ a: "1", kept: "2", b: "2" });
        });

        it("should lay the endnotes out after the body", () => {
            const content = document([paragraph("a", 6)], { endnotes: [SEPARATOR, paragraph("end", 2)] });
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["end", "2"],
                ]),
                pageCount: 2,
                sectionPageCounts: [2],
            });
        });

        describe("in columns", () => {
            const COLUMNS: Section = { ...SECTION, columns: [80, 80] };
            const ONE_LINE = { "footnote 1": [paragraph("one", 1)], "footnote 2": [paragraph("two", 1)] };
            const inSections = (
                blocks: Parameters<typeof document>[0],
                notes: Record<string, readonly Block[]>,
                sections: readonly Section[] = [COLUMNS],
            ): DocumentContent => ({ ...withNotes(blocks, notes), sections });
            /** Paragraphs of a line, named from a prefix and their number */
            const lines = (prefix: string, count: number): readonly ParagraphBlock[] =>
                Array.from({ length: count }, (_, index) => paragraph(`${prefix}${index + 1}`, 1));

            it("should end each column above the footnotes of the page, as Word does", () => {
                // Each column's footnote and the separator take 2 of its 7 lines (`word-rules2.docx` Q6a), so d ends the
                // second column and e goes on the next page
                const content = inSections(
                    [
                        noted(paragraph("a", 1), "footnote 1"),
                        paragraph("b", 4),
                        noted(paragraph("c", 1), "footnote 2"),
                        paragraph("d", 4),
                        paragraph("e", 1),
                    ],
                    ONE_LINE,
                );
                expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "1", e: "2" });
            });

            it("should end every column above the footnotes, whichever column they are referred to from", () => {
                // The second column ends above the first's footnote (`word-footnotes-in-columns.docx` N1)
                const first = inSections([noted(paragraph("a", 1), "footnote 1"), ...lines("b", 10)], ONE_LINE);
                expect(pagesOf(first)).to.include({ b9: "1", b10: "2" });
                // The first column is laid out again above the second's footnote, so 2 of its lines go in the second (N3)
                const second = inSections([...lines("a", 9), noted(paragraph("b", 1), "footnote 1"), ...lines("c", 2)], ONE_LINE);
                expect(pagesOf(second)).to.include({ a9: "1", b: "1", c1: "2" });
                // The same where the first column starts with a paragraph from the page before, which is laid out again
                const fromBefore = inSections([paragraph("a", 21), noted(paragraph("b", 1), "footnote 1"), ...lines("c", 3)], ONE_LINE);
                expect(pagesOf(fromBefore)).to.include({ a: "1", b: "2", c2: "2", c3: "3" });
            });

            it("should lay the footnotes out in the columns, one after the other from the first, evened out, as Word does", () => {
                // Two referred to from the first column go one in each, so each column ends 2 lines up (N4)
                const two = inSections(
                    [noted(paragraph("a", 1), "footnote 1"), noted(paragraph("b", 1), "footnote 2"), ...lines("c", 9)],
                    ONE_LINE,
                );
                expect(pagesOf(two)).to.include({ c8: "1", c9: "2" });
                // One of 4 lines goes 2 and 2 (N9)
                const long = inSections([noted(paragraph("a", 1), "footnote 1"), ...lines("b", 8)], {
                    "footnote 1": [paragraph("note", 4)],
                });
                expect(pagesOf(long)).to.include({ b7: "1", b8: "2" });
                // One of 3 lines isn't split 2 and 1, as widow control holds its lines, so the other goes beside it (N2)
                const widowed = inSections(
                    [noted(paragraph("a", 1), "footnote 1"), ...lines("b", 2), noted(paragraph("c", 1), "footnote 2"), ...lines("d", 3)],
                    { "footnote 1": [paragraph("three", 3)], "footnote 2": [paragraph("one", 1)] },
                );
                expect(pagesOf(widowed)).to.include({ d2: "1", d3: "2" });
            });

            it("should lay out a table in a footnote in columns as a line that doesn't break, without a separator", () => {
                const content = {
                    ...document([noted(paragraph("a", 1), "footnote 1"), ...lines("b", 10)], {
                        footnotes: new Map([["footnote 1", [table([row([[paragraph("cell", 2)]])])]]]),
                    }),
                    sections: [COLUMNS],
                };
                expect(pagesOf(content)).to.include({ b9: "1", b10: "2" });
            });

            it("should move a line to the next column with its footnote when they don't both fit", () => {
                const content = inSections(
                    [paragraph("a", 5), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 4), paragraph("d", 1)],
                    ONE_LINE,
                );
                // b and its footnote start the second column, so c's 4 lines fill it, above the footnote
                expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
            });

            it("should move a paragraph kept with the next to the next column, with the footnote of the next", () => {
                const content = inSections(
                    [
                        noted(paragraph("a", 1), "footnote 1"),
                        paragraph("b", 3),
                        paragraph("heading", 1, { keepNext: true }),
                        noted(paragraph("c", 1), "footnote 2"),
                        paragraph("d", 3),
                        paragraph("e", 1),
                    ],
                    ONE_LINE,
                );
                // c doesn't fit below the heading in the first column, so the heading and c start the second
                expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", heading: "1", c: "1", d: "1", e: "2" });
            });

            it("should even out columns before a continuous section break with their footnotes at the bottom of the page", () => {
                // 6 lines go 3 and 3, whatever the footnote of the first (`word-rules2.docx` Q6b), and b and c go below
                // them, above the footnote
                const content = (after: number): DocumentContent =>
                    inSections(
                        [
                            [noted(paragraph("a1", 1), "footnote 1"), 0],
                            ...["a2", "a3", "a4", "a5", "a6"].map((name): readonly [Block, number] => [paragraph(name, 1), 0]),
                            [paragraph("b", after), 1],
                            [paragraph("c", 1), 1],
                        ],
                        ONE_LINE,
                        [COLUMNS, { ...SECTION, start: "continuous" }],
                    );
                expect(pagesOf(content(1))).to.include({ a6: "1", b: "1", c: "1" });
                // The footnote and its separator take the last 2 lines of the page
                expect(pagesOf(content(2))).to.include({ b: "1", c: "2" });
            });

            it("should lay out columns below the footnotes of the text across the page above them", () => {
                const content = inSections(
                    [
                        [noted(paragraph("a", 1), "footnote 1"), 0],
                        [paragraph("b", 4), 1],
                        [paragraph("c", 4), 1],
                        [paragraph("d", 1), 1],
                    ],
                    ONE_LINE,
                    [SECTION, { ...COLUMNS, start: "continuous" }],
                );
                // Both columns end above a's footnote, so d goes on the next page
                expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
            });

            it("should lay out the footnotes of columns one below the other across the page, after one referred to from text across it", () => {
                // As Word does (N8): both columns end 3 lines up, rather than 2 below footnotes side by side
                const content = inSections(
                    [
                        [noted(paragraph("a", 1), "footnote 1"), 0],
                        [noted(paragraph("b", 1), "footnote 2"), 1],
                        ...lines("c", 6).map((block): readonly [Block, number] => [block, 1]),
                    ],
                    ONE_LINE,
                    [SECTION, { ...COLUMNS, start: "continuous" }],
                );
                expect(pagesOf(content)).to.include({ b: "1", c5: "1", c6: "2" });
            });

            it("should stop at a footnote on a page whose footnotes are in another section's columns", () => {
                const notes = (sections: readonly Section[]): DocumentContent =>
                    inSections(
                        [
                            [noted(paragraph("a", 1), "footnote 1"), 0],
                            [noted(paragraph("b", 1), "footnote 2"), 1],
                        ],
                        ONE_LINE,
                        sections,
                    );
                const reason = "a footnote on a page whose footnotes are in another section's columns";
                expect(paginate(notes([COLUMNS, { ...SECTION, start: "continuous" }]), { measurer: MEASURER }).stoppedAt).to.equal(reason);
                expect(paginate(notes([COLUMNS, { ...COLUMNS, start: "continuous" }]), { measurer: MEASURER }).stoppedAt).to.equal(reason);
                // Those of sections of one column are one below the other, as on any page
                expect(pagesOf(notes([SECTION, { ...SECTION, start: "continuous" }]))).to.deep.equal({ a: "1", b: "1" });
            });

            it("should stop at a footnote in columns that doesn't fit below its reference, which Word hasn't been seen to continue", () => {
                const reason = "a footnote across pages in columns";
                // One of 8 lines, 4 in each column, which would continue on the next page in a page of one column
                const long = inSections([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], {
                    "footnote 1": [paragraph("note", 8)],
                });
                expect(paginate(long, { measurer: MEASURER }).stoppedAt).to.equal(reason);
                // One of 2 lines, of which only the first fits below its reference
                const short = inSections([paragraph("a", 4), noted(paragraph("b", 1), "footnote 1")], {
                    "footnote 1": [paragraph("note", 2)],
                });
                expect(paginate(short, { measurer: MEASURER }).stoppedAt).to.equal(reason);
                // None of an empty one fits, but its separator, so the line goes on in the next column with it
                const empty = inSections([paragraph("a", 6), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [] });
                expect(paginate(empty, { measurer: MEASURER })).to.deep.equal({
                    bookmarks: new Map([
                        ["a", "1"],
                        ["b", "1"],
                    ]),
                    pageCount: 1,
                    sectionPageCounts: [1],
                });
            });

            it("should stop at footnotes in columns of different widths, which Word hasn't been seen to lay out", () => {
                const content = inSections([noted(paragraph("a", 1), "footnote 1")], ONE_LINE, [{ ...SECTION, columns: [80, 40] }]);
                expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("footnotes in columns of different widths");
            });

            it("should stop at a footnote in a section that starts in the next column, below a longer column of the section before", () => {
                const content = (before: number): DocumentContent =>
                    inSections(
                        [
                            [paragraph("a", before), 0],
                            [noted(paragraph("b", 1), "footnote 1"), 1],
                        ],
                        ONE_LINE,
                        [COLUMNS, { ...COLUMNS, start: "nextColumn" }],
                    );
                // a's 7 lines go below the top of b's footnote, and the section before isn't laid out again
                expect(paginate(content(7), { measurer: MEASURER }).stoppedAt).to.equal(
                    "a footnote in a section that starts in the next column, below a longer column",
                );
                // a's 3 lines end above it
                expect(pagesOf(content(3))).to.deep.equal({ a: "1", b: "1" });
            });

            it("should stop at a footnote that moves its reference to the next page when the columns are laid out again for it", () => {
                // Above c's footnote, a's last 2 lines go in the second column, and c no longer fits there
                const content = inSections(
                    [...lines("x", 14), ...lines("a", 7), ...lines("b", 3), noted(paragraph("c", 1), "footnote 1")],
                    ONE_LINE,
                );
                const { bookmarks, stoppedAt } = paginate(content, { measurer: MEASURER });
                expect(stoppedAt).to.equal("a footnote in columns that moves its reference to the next page");
                // Word might lay out the page differently, so its bookmarks are left out
                expect(bookmarks.get("x14")).to.equal("1");
                expect(bookmarks.has("a1")).to.equal(false);
                expect(bookmarks.has("b3")).to.equal(false);
            });
        });
    });

    describe("numbers of pages", () => {
        /** A paragraph of 7 letters and a number of pages, which wraps when the number is 2 digits */
        const counted = (name: string, scope: "document" | "section"): ParagraphBlock => ({
            ...paragraph(name, 1),
            items: [
                { type: "marker", name },
                { type: "text", text: "abcdefg", font: {} },
                { type: "pageCount", scope, font: {} },
            ],
        });

        it("should write the number of pages given into the fields that show it, which can change how lines wrap", () => {
            const blocks = [counted("a", "document"), paragraph("b", 5), paragraph("c", 1)];
            // Blank, and one digit, a is a line; two digits, it wraps, and c moves on
            expect(pagesOf(document(blocks))).to.deep.equal({ a: "1", b: "1", c: "1" });
            expect(Object.fromEntries(paginate(document(blocks), { measurer: MEASURER, pageCount: 3 }).bookmarks)).to.deep.equal({
                a: "1",
                b: "1",
                c: "1",
            });
            expect(Object.fromEntries(paginate(document(blocks), { measurer: MEASURER, pageCount: 12 }).bookmarks)).to.deep.equal({
                a: "1",
                b: "1",
                c: "2",
            });
        });

        it("should lay out a header with the number of pages of the section whose page it is on", () => {
            const header = [counted("header", "section")];
            const content = document(
                [
                    [paragraph("a", 5), 0],
                    [paragraph("b", 1), 0],
                    [paragraph("c", 5), 1],
                    [paragraph("d", 1), 1],
                ],
                {
                    sections: [
                        { ...SECTION, headers: { default: header } },
                        { ...SECTION, headers: { default: header } },
                    ],
                },
            );
            // The header of 2 lines leaves room for 5, and of 1 line, for 6
            const { bookmarks } = paginate(content, { measurer: MEASURER, sectionPageCounts: [12, 3] });
            expect(Object.fromEntries(bookmarks)).to.deep.equal({ a: "1", b: "2", c: "3", d: "3" });
        });

        it("should count the pages of each section, but not of those that share a page, have a blank page, or have no paragraphs", () => {
            const countsOf = (blocks: Parameters<typeof document>[0], sections: readonly Section[]): readonly (number | undefined)[] =>
                paginate(document(blocks, { sections }), { measurer: MEASURER }).sectionPageCounts;
            expect(
                countsOf(
                    [
                        [paragraph("a", 8), 0],
                        [paragraph("b", 1), 1],
                    ],
                    [SECTION, SECTION],
                ),
            ).to.deep.equal([2, 1]);
            expect(
                countsOf(
                    [
                        [paragraph("a", 1), 0],
                        [paragraph("b", 1), 1],
                        [paragraph("c", 1), 2],
                    ],
                    [SECTION, { ...SECTION, start: "continuous" }, SECTION],
                ),
            ).to.deep.equal([undefined, undefined, 1]);
            expect(
                countsOf(
                    [
                        [paragraph("a", 1), 0],
                        [paragraph("b", 1), 1],
                    ],
                    [SECTION, { ...SECTION, start: "oddPage" }],
                ),
            ).to.deep.equal([undefined, undefined]);
            expect(
                countsOf(
                    [
                        [paragraph("a", 1), 0],
                        [paragraph("b", 1), 2],
                    ],
                    [SECTION, SECTION, SECTION],
                ),
            ).to.deep.equal([1, undefined, 1]);
        });
    });

    describe("headers and footers", () => {
        const lines = (count: number): readonly Block[] => [paragraph(`header${count}`, count)];

        it("should push the text down from a header taller than the top margin, and up from a tall footer", () => {
            // A header of 2 lines from 5 ends at 25, 15 below the margin: the page has 5 lines
            const content = document([paragraph("a", 5), paragraph("b", 2)], {
                sections: [{ ...SECTION, headers: { default: lines(2) } }],
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
            const footed = document([paragraph("a", 5), paragraph("b", 2)], { sections: [{ ...SECTION, footers: { default: lines(2) } }] });
            expect(pagesOf(footed)).to.deep.equal({ a: "1", b: "2" });
            // A header that fits above the margin changes nothing
            const short = document([paragraph("a", 5), paragraph("b", 2)], {
                sections: [{ ...SECTION, header: 0, headers: { default: [paragraph("h", 1)] } }],
            });
            expect(pagesOf(short)).to.deep.equal({ a: "1", b: "1" });
        });

        it("should give the first page and even pages their own headers when the document says to", () => {
            const section = { ...SECTION, titlePage: true, headers: { first: lines(4), even: lines(2) } };
            // The first page has 3 lines, the second 5, the third 7
            const content = document([paragraph("a", 3), paragraph("b", 5), paragraph("c", 7), paragraph("d", 1)], {
                sections: [section],
                evenAndOddHeaders: true,
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2", c: "3", d: "4" });
        });

        it("should keep the text where the margins put it when they are negative", () => {
            const content = document([paragraph("a", 7)], {
                sections: [
                    { ...SECTION, marginTop: -10, marginBottom: -10, headers: { default: lines(4) }, footers: { default: lines(4) } },
                ],
            });
            expect(pagesOf(content)).to.deep.equal({ a: "1" });
        });

        it("should stop at a page with a header it can't lay out", () => {
            const header = [{ ...paragraph("h", 1), unsupported: "an equation" }];
            const content = document([paragraph("a", 1)], { sections: [{ ...SECTION, headers: { default: header } }] });
            expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
                bookmarks: new Map(),
                pageCount: 0,
                sectionPageCounts: [undefined],
                stoppedAt: "an equation",
            });
        });
    });

    it("should stop at a block it can't lay out, with the bookmarks before it placed", () => {
        const content = document([paragraph("a", 1), { ...paragraph("b", 1), unsupported: "a footnote" }, paragraph("c", 1)]);
        expect(paginate(content, { measurer: MEASURER })).to.deep.equal({
            bookmarks: new Map([["a", "1"]]),
            pageCount: 1,
            sectionPageCounts: [undefined],
            stoppedAt: "a footnote",
        });
        expect(paginate(document([paragraph("a", 1)], { unsupported: "hyphenation" }), { measurer: MEASURER }).stoppedAt).to.equal(
            "hyphenation",
        );
    });

    it("should lay out a page reference with the text it is given for its bookmark", () => {
        const reference = withItems(paragraph("a", 0), [{ type: "pageReference", bookmark: "target", font: {} }]);
        const content = document([paragraph("before", 6), reference]);
        // The reference's text is a word too long for the line, which takes 2 lines
        expect(pagesOf(content)).to.deep.equal({ before: "1", a: "1" });
        expect(pagesOf(content, new Map([["target", "abcdefghij"]]))).to.deep.equal({ before: "1", a: "2" });
    });

    it("should lay out the same paragraphs the same each time", () => {
        const content = document([paragraph("a", 3), paragraph("b", 5)]);
        expect(pagesOf(content)).to.deep.equal(pagesOf(content));
    });

    it("should rethrow errors other than stopping", () => {
        const broken = { ...document([paragraph("a", 1)]), sections: [] } as unknown as DocumentContent;
        expect(() => paginate(broken, { measurer: MEASURER })).to.throw(TypeError);
    });

    it("should measure with the widths of the fonts by default", () => {
        expect(Object.fromEntries(paginate(document([paragraph("a", 1)])).bookmarks)).to.deep.equal({ a: "1" });
    });
});
