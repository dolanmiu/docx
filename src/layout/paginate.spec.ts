// cspell:ignore Aptos
import { describe, expect, it } from "vitest";

import { type ParagraphFormat, SIMILAR_FONT_MEASURER, type TextFont, type TextMeasurer } from "../text-layout";
import type { BlockLayout, PageLayout, ParagraphLayout } from "./layout-document";
import type { FieldFormat } from "./number-format";
import { type Pagination, paginate } from "./paginate";
import type {
    Block,
    DocumentContent,
    FloatingDrawing,
    LayoutItem,
    ParagraphBlock,
    Section,
    TableBlock,
    TableCell,
    TableFloat,
    TableRow,
} from "./read-document";

// Every character is 10 points wide, and a line is as tall as its font's size, 10 points unless it says otherwise, all of it
// above the baseline
const MEASURER: TextMeasurer = {
    measureWidth: (text) => [...text].length * 10,
    measureLineHeight: ({ size = 10 }) => size,
    measureDescent: () => 0,
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
    topGutter: 0,
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
    endnoteContinuationSeparator: [],
    // Each footnote is numbered with the name of its marker, and each endnote's blocks with their index
    footnoteNumbers: new Map([...(changes.footnotes?.keys() ?? [])].map((name) => [name, name])),
    endnoteNumbers: new Map((changes.endnotes ?? []).map((block, index) => [block, String(index)])),
    relativeReferences: new Map(),
    endnoteReferences: new Map(),
    ...changes,
});

/** The names of the markers in a block, and in its table's cells */
const markersIn = (block: Block): readonly string[] =>
    block.type === "paragraph"
        ? block.items.flatMap((item) => (item.type === "marker" ? [item.name] : []))
        : block.rows.flatMap(({ cells }) => cells.flatMap((cell) => cell.blocks.flatMap(markersIn)));

/**
 * The bookmarks of the body, without those of the footnotes, whose pages the tests of where footnotes' lines go don't look
 * at: "bookmarks in footnotes" does
 */
const inBody = (content: DocumentContent, bookmarks: ReadonlyMap<string, string>): ReadonlyMap<string, string> => {
    const inNotes = new Set([...content.footnotes.values()].flat().flatMap(markersIn));
    return new Map([...bookmarks].filter(([name]) => !inNotes.has(name)));
};

/** The numbers the pages were laid out with: where they broke, without what is on each */
const numbersOf = (
    content: DocumentContent,
    measurer: TextMeasurer = MEASURER,
): Pick<Pagination, "bookmarks" | "pageCount" | "sectionPageCounts" | "stoppedAt"> => {
    const { bookmarks, pageCount, sectionPageCounts, stoppedAt } = paginate(content, { measurer });
    return { bookmarks: inBody(content, bookmarks), pageCount, sectionPageCounts, ...(stoppedAt === undefined ? {} : { stoppedAt }) };
};

/** The page each bookmark of the body is on */
const pagesOf = (content: DocumentContent, pageNumbers?: ReadonlyMap<string, string>): Record<string, string> =>
    Object.fromEntries(inBody(content, paginate(content, { measurer: MEASURER, pageNumbers }).bookmarks));

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

/** A paragraph as `paragraph` makes it, with a bookmark at the end of its last line too, named with its name and "End" */
const endMarked = (name: string, lines: number): ParagraphBlock =>
    withItems(paragraph(name, lines), [{ type: "marker", name: `${name}End` }]);

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
        expect(numbersOf(document([]))).to.deep.equal({
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

    it("should break lines by the document's own lists of the characters that can't start a line", () => {
        // cspell:disable
        const japanese = (text: string): LayoutItem => ({ type: "text", text, font: {}, language: "ja-JP" });
        // Each document's own paragraphs, as their lines are kept with them
        const blocks = (): readonly Block[] => [
            paragraph("before", 6),
            {
                type: "paragraph",
                items: [japanese("永".repeat(7)), { type: "marker", name: "eighth" }, japanese("永、")],
                format: { widowControl: false },
                tabStops: [],
                markFont: {},
            },
        ];
        // cspell:enable
        // The full stop can't start a line, so the character before it starts the next line, on the next page
        expect(pagesOf(document(blocks()))).to.deep.include({ eighth: "2" });
        expect(pagesOf(document(blocks(), { breakRules: { lists: { japanese: { noLineStart: "" } } } }))).to.deep.include({ eighth: "1" });
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
            expect(numbersOf(content)).to.deep.equal({
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

        it("should leave out the space at a table cell's edges that Word leaves out for contextual spacing with what is outside it", () => {
            // word-stops-text.docx PB6a: the reader marks the first paragraph's space before and the last's space after as
            // left out, as the paragraph before the table and the end of the row are of their style
            const spaced = { spaceBefore: 10, spaceAfter: 10, contextualSpacing: true };
            const cellOf = (leftOut?: ParagraphBlock["leftOut"]): DocumentContent => {
                const first = { ...paragraph("first", 2, spaced), ...(leftOut ? { leftOut } : {}) };
                const last = { ...paragraph("last", 2, spaced), ...(leftOut ? { leftOut } : {}) };
                return document([paragraph("a", 1), table([row([[first, last]])]), paragraph("b", 1), paragraph("c", 1)]);
            };
            // 1 line, 10 before, 4 lines and 10 after are 7 lines: b goes on the next page
            expect(pagesOf(cellOf())).to.deep.include({ b: "2" });
            expect(pagesOf(cellOf({ before: true }))).to.deep.include({ b: "1", c: "2" });
            expect(pagesOf(cellOf({ before: true, after: true }))).to.deep.include({ b: "1", c: "1" });
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

            it("should go by the style of a paragraph all of which is hidden between them, which takes no room, as Word does", () => {
                // `word-hidden-paragraphs.docx` HP6c and HP6d: 240 twips after and before paragraphs of a style with contextual
                // spacing leave 240 around a hidden one of another style, and none around one of theirs. Here, 20 points
                const around = (hiddenStyle: string): number => {
                    const hidden: ParagraphBlock = { ...paragraph("hidden", 1, {}, hiddenStyle), hidden: true };
                    return spaceBetween(
                        { ...paragraph("a", 1, { spaceAfter: 20, ...contextual }, "Spaced"), hiddenAfter: hidden },
                        { ...paragraph("b", 1, { spaceBefore: 20, ...contextual }, "Spaced"), hiddenBefore: hidden },
                    );
                };
                expect(around("Normal")).to.equal(20);
                expect(around("Spaced")).to.equal(0);
            });
        });
    });

    describe("paragraph borders", () => {
        const BORDERS = { top: 5, bottom: 3, between: 0, betweenSpace: 0, box: "box", outline: "box" };
        const bordered = (name: string, lines: number, format: ParagraphFormat = {}, borders = BORDERS): ParagraphBlock => ({
            ...paragraph(name, lines, format),
            borders,
        });
        /** Each page's lines, as where each starts down the page */
        const topsOf = (content: DocumentContent): readonly (readonly number[])[] =>
            paginate(content, { measurer: MEASURER }).pages.map(({ body }) =>
                body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ y }) => y) : [])),
            );

        it("should put a paragraph's lines below its top border and the next paragraph below its bottom border", () => {
            expect(topsOf(document([paragraph("a", 1), bordered("b", 2), paragraph("c", 1)]))).to.deep.equal([[10, 25, 35, 48]]);
            // A paragraph in one box with the next has no border below it, and the next none above it, without a between
            // border, and the room a between border takes and its space with one
            const between = { ...BORDERS, between: 4, betweenSpace: 1 };
            expect(topsOf(document([bordered("a", 1), bordered("b", 1), paragraph("c", 1)]))).to.deep.equal([[15, 25, 38]]);
            expect(topsOf(document([bordered("a", 1, {}, between), bordered("b", 1, {}, between)]))).to.deep.equal([[15, 30]]);
        });

        it("should keep the border above a paragraph at the top of a page, but not above the rest of one that goes on to it", () => {
            // 6 lines fill the first page, so b's border goes at the top of the next
            expect(topsOf(document([paragraph("a", 6), bordered("b", 1)]))).to.deep.equal([[10, 20, 30, 40, 50, 60], [15]]);
            expect(topsOf(document([paragraph("a", 3), bordered("b", 5)]))).to.deep.equal([
                [10, 20, 30, 45, 55, 65],
                [10, 20],
            ]);
        });

        it("should move a paragraph's last line to the next page when it fits at the foot of a page but not with its border below it", () => {
            // b's line would end at 80, the foot of the page, and its border 3 below that, as the space a between border
            // leaves below it would (`word-paragraph-formats.docx` B4a, B4b)
            expect(pagesOf(document([paragraph("a", 6), bordered("b", 1, {}, { ...BORDERS, top: 0 })]))).to.deep.equal({ a: "1", b: "2" });
            const between = { ...BORDERS, top: 0, bottom: 0, between: 4, betweenSpace: 3 };
            expect(pagesOf(document([paragraph("a", 6), bordered("b", 1, {}, between), bordered("c", 1, {}, between)]))).to.deep.equal({
                a: "1",
                b: "2",
                c: "2",
            });
            expect(pagesOf(document([paragraph("a", 5), bordered("b", 1, {}, { ...BORDERS, top: 0 })]))).to.deep.equal({ a: "1", b: "1" });
        });

        it("should join paragraphs whose borders differ only by a between border in one box, with the first's between border", () => {
            // word-stops-text.ts PB1a to PB1c: the first's between border and its space below it, and the second's space
            // above it: 1 between them when only the second has one, 4 when only the first has one
            const between = { ...BORDERS, between: 4, betweenSpace: 1, box: "between" };
            expect(topsOf(document([bordered("a", 1), bordered("b", 1, {}, between)]))).to.deep.equal([[15, 26]]);
            expect(topsOf(document([bordered("a", 1, {}, between), bordered("b", 1)]))).to.deep.equal([[15, 29]]);
            // Which of them Word draws above the second at the top of a page hasn't been seen
            expect(numbersOf(document([paragraph("x", 5), bordered("a", 1), bordered("b", 1, {}, between)])).stoppedAt).to.equal(
                "a paragraph at the top of a page in one box with the one before, whose between border is another",
            );
            const inRow = document([table([row([[paragraph("x", 5), bordered("a", 1), bordered("b", 1, {}, between)]])])]);
            expect(numbersOf(inRow).stoppedAt).to.equal(
                "a paragraph at the top of a page in one box with the one before, whose between border is another",
            );
        });

        it("should give the borders of the paragraphs in a table cell room in its row, and in a row that breaks across pages", () => {
            const rowsOf = (content: DocumentContent): readonly (readonly number[])[] =>
                paginate(content, { measurer: MEASURER }).pages.map(({ body }) =>
                    body.flatMap((block) => (block.type === "table" ? block.rows.map(({ height }) => height) : [])),
                );
            expect(rowsOf(document([table([row([[bordered("a", 2)]])])]))).to.deep.equal([[28]]);
            // The part of the row on the first page has the border above, and the part on the next the border below
            expect(rowsOf(document([paragraph("x", 1), table([row([[bordered("a", 9)]])])]))).to.deep.equal([[55], [43]]);
        });

        it("should keep a paragraph with the next one's borders", () => {
            // a and the top border and lines of b don't fit below c, though their lines would, nor a and b's lines with its
            // border below them
            const above = document([
                paragraph("c", 3),
                paragraph("a", 2, { keepNext: true }),
                bordered("b", 2, {}, { ...BORDERS, bottom: 0 }),
            ]);
            expect(pagesOf(above)).to.deep.equal({ c: "1", a: "2", b: "2" });
            const below = document([
                paragraph("c", 3),
                paragraph("a", 2, { keepNext: true }),
                bordered("b", 2, {}, { ...BORDERS, top: 0 }),
            ]);
            expect(pagesOf(below)).to.deep.equal({ c: "1", a: "2", b: "2" });
        });

        it("should end a box of borders before a page break, and stop at one across a section break, as Word does", () => {
            // word-stops-text.ts PB3b: the second paragraph has a box of its own, with its top border, on the next page
            expect(topsOf(document([bordered("a", 1), bordered("b", 1, { pageBreakBefore: true })]))).to.deep.equal([[15], [15]]);
            const SECOND = { sections: [SECTION, SECTION] };
            expect(numbersOf(document([bordered("a", 1), [bordered("b", 1), 1]], SECOND)).stoppedAt).to.equal(
                "paragraphs with the same borders either side of a section break",
            );
            // Paragraphs with other borders are boxes of their own
            expect(
                numbersOf(document([bordered("a", 1), [bordered("b", 1, {}, { ...BORDERS, box: "other", outline: "other" }), 1]], SECOND))
                    .stoppedAt,
            ).to.equal(undefined);
        });

        it("should give the empty paragraph that ends a section no room for its borders or automatic spacing, and stop where a box could go on through it, as Word does", () => {
            // word-stops-text.ts PB2a, PB2b
            const SECOND = { sections: [SECTION, { ...SECTION, start: "continuous" as const }] };
            const ending: ParagraphBlock = { ...bordered("end", 0), items: [], sectionBreak: true };
            expect(topsOf(document([paragraph("a", 1), ending, [paragraph("b", 1), 1]], SECOND))).to.deep.equal([[10, 20]]);
            // word-stops-text.ts PB3a: paragraphs with the same borders either side of one without them are boxes of their
            // own, each with its top and bottom borders
            const plainEnding: ParagraphBlock = { ...paragraph("end", 0), items: [], sectionBreak: true };
            expect(topsOf(document([bordered("a", 1), plainEnding, [bordered("b", 1), 1]], SECOND))).to.deep.equal([[15, 33]]);
            // Whether a box of its borders before or after it goes on through it hasn't been seen
            const through = "the empty paragraph that ends a section with the same borders as the paragraph before or after it";
            expect(numbersOf(document([bordered("a", 1), ending, [paragraph("b", 1), 1]], SECOND)).stoppedAt).to.equal(through);
            expect(numbersOf(document([paragraph("a", 1), ending, [bordered("b", 1), 1]], SECOND)).stoppedAt).to.equal(through);
            const automatic: ParagraphBlock = {
                ...paragraph("end", 0, { autoSpaceBefore: true, autoSpaceAfter: true }),
                items: [],
                sectionBreak: true,
            };
            expect(topsOf(document([paragraph("a", 1), automatic, [paragraph("b", 1), 1]], SECOND))).to.deep.equal([[10, 20]]);
            // Whether its automatic space after leaves out some of the next paragraph's space before hasn't been seen
            expect(
                numbersOf(document([paragraph("a", 1), automatic, [paragraph("b", 1, { spaceBefore: 5 }), 1]], SECOND)).stoppedAt,
            ).to.equal("automatic spacing after the empty paragraph that ends a section, before space of the next section's");
        });

        it("should give borders and automatic spacing room in a footnote, as in the text", () => {
            // word-stops-notes.ts NT13a to NT13c: a box's borders, 14 points of automatic spacing below the separator and
            // between paragraphs, and the last's automatic space after at the foot of the page
            const noted = withItems(paragraph("a", 1), [{ type: "marker", name: "n" }]);
            const notesOf = (...blocks: readonly ParagraphBlock[]): Partial<DocumentContent> => ({
                footnotes: new Map([["n", [...blocks]]]),
            });
            const noteTops = (content: DocumentContent): readonly number[] =>
                paginate(content, { measurer: MEASURER }).pages[0].footnotes.flatMap(({ content: blocks }) =>
                    blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ y }) => y) : [])),
                );
            const plain = noteTops(document([noted], notesOf(paragraph("note", 1), paragraph("more", 1))));
            expect(noteTops(document([noted], notesOf(bordered("note", 1), bordered("more", 1))))).to.deep.equal([
                plain[0] - 3,
                plain[1] - 3,
            ]);
            const automatic = { autoSpaceBefore: true, autoSpaceAfter: true };
            expect(noteTops(document([noted], notesOf(paragraph("note", 1, automatic), paragraph("more", 1, automatic))))).to.deep.equal([
                plain[0] - 14 - 14,
                plain[1] - 14,
            ]);
            // Across pages, in columns, and in one box across two footnotes, Word's way with them hasn't been seen
            const long = document([paragraph("x", 5), noted], notesOf(bordered("note", 6)));
            expect(numbersOf(long).stoppedAt).to.equal("a paragraph border or automatic spacing in a footnote across pages or in columns");
            // One taller than a page kept together, which starts on the page after its reference's and goes on across pages
            const tall = document([noted], notesOf(bordered("note", 8, { keepLines: true })));
            expect(numbersOf(tall).stoppedAt).to.equal("a paragraph border or automatic spacing in a footnote across pages or in columns");
            const twoNotes = withItems(paragraph("a", 1), [
                { type: "marker", name: "n" },
                { type: "marker", name: "m" },
            ]);
            const both = document([twoNotes], {
                footnotes: new Map([
                    ["n", [bordered("note", 1)]],
                    ["m", [bordered("more", 1)]],
                ]),
            });
            expect(numbersOf(both).stoppedAt).to.equal("footnotes next to each other with the same borders");
        });
    });

    describe("automatic spacing", () => {
        it("should put Word's 14 points before and after a paragraph, but none at the top or bottom of a table cell", () => {
            const automatic = { autoSpaceBefore: true, autoSpaceAfter: true, spaceBefore: 30, spaceAfter: 0 };
            /** Where the lines of paragraphs start down the first page */
            const topsOf = (blocks: readonly Block[]): readonly number[] =>
                paginate(document(blocks), { measurer: MEASURER }).pages[0].body.flatMap((block) =>
                    block.type === "paragraph" ? block.lines.map(({ y }) => y) : [],
                );
            // In place of the space given, and the larger of it and the space of the paragraph next to it
            expect(topsOf([paragraph("x", 1), paragraph("a", 1, automatic), paragraph("b", 1, automatic)])).to.deep.equal([10, 34, 58]);
            expect(topsOf([paragraph("x", 1), paragraph("a", 1, automatic), paragraph("b", 1, { spaceBefore: 20 })])).to.deep.equal([
                10, 34, 64,
            ]);
            const heightOf = (blocks: readonly Block[]): number =>
                paginate(document([table([row([blocks])])]), { measurer: MEASURER }).pages[0].body.flatMap((block) =>
                    block.type === "table" ? block.rows.map(({ height }) => height) : [],
                )[0];
            expect(heightOf([paragraph("a", 1, automatic), paragraph("b", 1, automatic)])).to.equal(34);
            // And between a paragraph and a table (`word-paragraph-formats.docx` A4)
            const [, , rows] = paginate(document([paragraph("x", 1), paragraph("a", 1, automatic), table([row([[paragraph("b", 1)]])])]), {
                measurer: MEASURER,
            }).pages[0].body;
            expect(rows.type === "table" && rows.rows[0].y).to.equal(58);
        });

        it("should put none above the first paragraph of the document or of a header, and keep it below a header's last", () => {
            const automatic = { autoSpaceBefore: true, autoSpaceAfter: true };
            // `word-paragraph-formats.docx` A0 and A3: the header is 5 down, with no space above its line and 14 below it,
            // so the text starts 29 down, with no space above it either
            const header = { ...SECTION, marginTop: 5, headers: { default: [paragraph("h", 1, automatic)] } };
            const [first] = paginate(document([paragraph("a", 1, automatic)], { sections: [header] }), { measurer: MEASURER }).pages;
            expect(first.body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ y }) => y) : []))).to.deep.equal([29]);
        });

        it("should put none between paragraphs of the same list, and stop between those of other levels or lists made alike", () => {
            const automatic = { autoSpaceBefore: true, autoSpaceAfter: true };
            const definition = {};
            const listed = (name: string, id: string, level = 0, made = definition): ParagraphBlock => ({
                ...paragraph(name, 1, automatic),
                list: { id, level, definition: made },
            });
            const topsOf = (blocks: readonly Block[]): readonly number[] =>
                paginate(document(blocks), { measurer: MEASURER }).pages[0].body.flatMap((block) =>
                    block.type === "paragraph" ? block.lines.map(({ y }) => y) : [],
                );
            // `word-paragraph-formats.docx` A1 and A1b: 14 above and below the list, none between its items, and 14
            // between a bulleted list and a numbered one
            expect(topsOf([paragraph("x", 1), listed("a", "1"), listed("b", "1"), paragraph("y", 1)])).to.deep.equal([10, 34, 44, 68]);
            expect(topsOf([listed("a", "1"), listed("b", "2", 0, {})])).to.deep.equal([10, 34]);
            const STOP = "automatic spacing between paragraphs of other levels of a list, or of lists made alike";
            expect(numbersOf(document([listed("a", "1"), listed("b", "1", 1)])).stoppedAt).to.equal(STOP);
            expect(numbersOf(document([listed("a", "1"), listed("b", "2")])).stoppedAt).to.equal(STOP);
        });
    });

    describe("characters", () => {
        const STOP = "a character whose width in its font isn't known";
        // Knows every character's width but Ж's
        const CHOOSY: TextMeasurer = { ...MEASURER, unknownCharacter: (text) => [...text].find((character) => character === "Ж") };
        const withText = (name: string, text: string, font = {}): ParagraphBlock =>
            withItems(paragraph(name, 1), [{ type: "text", text: ` ${text}`, font }]);

        it("should stop at a character whose width the measurer doesn't know", () => {
            const content = document([paragraph("a", 1), withText("b", "abcЖ"), paragraph("c", 1)]);
            expect(numbersOf(content, CHOOSY)).to.deep.equal({
                bookmarks: new Map([["a", "1"]]),
                pageCount: 1,
                sectionPageCounts: [undefined],
                stoppedAt: STOP,
            });
            // A measurer that measures with the fonts themselves knows every character
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1" });
        });

        it("should stop at a character whose width the measurer doesn't know in a table sized to its text", () => {
            const fitted: TableBlock = { ...table([row([[withText("cell", "Ж")]])]), fit: {} };
            expect(paginate(document([paragraph("a", 1), fitted]), { measurer: CHOOSY }).stoppedAt).to.equal(STOP);
        });

        it("should stop at kerning and ligatures the measurer doesn't know, with its reason", () => {
            // Knows how text is kerned but where it has a Ж
            const kerning: TextMeasurer = {
                ...MEASURER,
                unknownShaping: (text) => (text.includes("Ж") ? "kerned text with a Ж" : undefined),
            };
            expect(numbersOf(document([paragraph("a", 1), withText("b", "abc"), withText("c", "abcЖ")]), kerning).stoppedAt).to.equal(
                "kerned text with a Ж",
            );
            // Measuring with the width tables, which don't have Carlito's own kerning, though it is as wide as Calibri
            const kerned = (font: string): DocumentContent =>
                document([withText("a", "To", { font, size: 11, kerning: 1 }), paragraph("b", 1)]);
            expect(paginate(kerned("Carlito")).stoppedAt).to.equal("kerned text in a font whose kerning isn't known");
        });

        it("should stop at kerning and ligatures the measurer doesn't know across runs, which are measured together", () => {
            // Cambria Bold's kerning before a hyphen, where Word moves it, which isn't known, in runs of their own
            const cambria = { font: "Cambria", bold: true, size: 11, kerning: 1 };
            const split = (between: readonly LayoutItem[], after: TextFont = cambria): DocumentContent =>
                document([
                    withItems(paragraph("a", 1), [
                        { type: "text", text: " AT", font: cambria },
                        ...between,
                        { type: "text", text: "-B", font: after },
                    ]),
                    paragraph("b", 1),
                ]);
            const UNKNOWN = "kerning of a pair of characters not yet followed";
            expect(paginate(split([])).stoppedAt).to.equal(UNKNOWN);
            // With a bookmark between them, which they are measured across
            expect(paginate(split([{ type: "marker", name: "m" }])).stoppedAt).to.equal(UNKNOWN);
            // But not in another font, or with a tab between them, as they are measured apart
            expect(paginate(split([], { ...cambria, italic: true })).stoppedAt).to.equal(undefined);
            expect(paginate(split([{ type: "tab", font: cambria }])).stoppedAt).to.equal(undefined);
            // Calibri's ligatures beside a Greek letter, which aren't known, in runs of their own
            const calibri = { font: "Calibri", size: 11, ligatures: "standardContextual" } as const;
            const greek = withItems(paragraph("a", 1), [
                { type: "text", text: " of", font: calibri },
                { type: "text", text: "\u03a9", font: calibri },
            ]);
            expect(paginate(document([greek, paragraph("b", 1)])).stoppedAt).to.equal("ligatures beside a character not yet followed");
        });

        it("should stop at text kerned or with ligatures beside a soft hyphen, which Word hasn't been seen with", () => {
            const hyphenated = (
                font: TextFont,
                before: readonly LayoutItem[] = [{ type: "text", text: " ef", font }],
                { hyphen = font, after = font }: { readonly hyphen?: TextFont; readonly after?: TextFont } = {},
            ): DocumentContent =>
                document([
                    withItems(paragraph("a", 1), [
                        ...before,
                        { type: "softHyphen", font: hyphen },
                        { type: "text", text: "fort", font: after },
                    ]),
                    paragraph("b", 1),
                ]);
            const BESIDE = "kerning or ligatures beside a soft hyphen";
            expect(paginate(hyphenated({ font: "Calibri", size: 11, kerning: 1 })).stoppedAt).to.equal(BESIDE);
            expect(paginate(hyphenated({ font: "Calibri", size: 11, ligatures: "standardContextual" })).stoppedAt).to.equal(BESIDE);
            // Text neither kerned nor with ligatures, or with nothing before the soft hyphen to kern or join with, is laid out
            expect(paginate(hyphenated({ font: "Calibri", size: 11 })).stoppedAt).to.equal(undefined);
            const kerned = { font: "Calibri", size: 11, kerning: 1 };
            expect(paginate(hyphenated(kerned, [{ type: "tab", font: kerned }])).stoppedAt).to.equal(undefined);
            // The hyphen at the end of a line in the font of the kerned text before it, which it may be kerned with, though
            // the text after it is in another font, but not one in another font
            const plain = { font: "Calibri", size: 11 };
            expect(paginate(hyphenated(kerned, undefined, { after: plain })).stoppedAt).to.equal(BESIDE);
            expect(paginate(hyphenated(kerned, undefined, { hyphen: plain, after: plain })).stoppedAt).to.equal(undefined);
            // Nor after empty text, such as a field's result not yet worked out, with no letter to kern the hyphen with
            const empty: readonly LayoutItem[] = [
                { type: "tab", font: kerned },
                { type: "text", text: "", font: kerned },
            ];
            expect(paginate(hyphenated(kerned, empty, { after: plain })).stoppedAt).to.equal(undefined);
        });

        it("should stop at a character Word draws in another font, measuring with the width tables", () => {
            // Word draws the symbol for all in Calibri in Cambria Math, and in Cambria in Cambria
            const symbol = (font: string): DocumentContent => document([withText("a", "\u2200x", { font, size: 11 }), paragraph("b", 1)]);
            expect(paginate(symbol("Calibri")).stoppedAt).to.equal(STOP);
            expect(paginate(symbol("Cambria")).stoppedAt).to.equal(undefined);
        });
    });

    describe("the space above a page's first line, left out with suppressTopSpacing (scripts/layout-probes/stops2/word-stops-thai-and-compat.ts)", () => {
        const exact = (height: number): ParagraphFormat => ({ lineSpacing: { rule: "exact", height } });
        const atLeast = (height: number): ParagraphFormat => ({ lineSpacing: { rule: "atLeast", height } });
        const suppressed = (blocks: readonly Block[]): DocumentContent => document(blocks, { suppressesTopSpacing: true });
        /** How far down the page each line of each page is */
        const topsOf = (content: DocumentContent): readonly (readonly number[])[] =>
            paginate(content, { measurer: MEASURER }).pages.map(({ body }) =>
                body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ y }) => Math.round(y * 10) / 10) : [])),
            );
        const stoppedAt = (content: DocumentContent): string | undefined => paginate(content, { measurer: MEASURER }).stoppedAt;
        const reason =
            "the first line of a page or column, at line spacing Word hasn't shown, in a document that suppresses the space above it";

        it("should leave out the space above the text of a page's first line of exact or at-least spacing, as Word does", () => {
            // word-stops-top-spacing.docx ST1: at exactly 40 points, its baseline 9.6 points down rather than 32, so it goes
            // from -12.4 to 27.6, and 2 lines fit where 1 does without
            expect(topsOf(document([paragraph("a", 2, exact(40))]))).to.deep.equal([[10], [10]]);
            expect(topsOf(suppressed([paragraph("a", 2, exact(40))]))).to.deep.equal([[-12.4, 27.6]]);
            // ST2c to ST2f: at least a height taller than its text, it ends 9.6 points down
            expect(topsOf(suppressed([paragraph("a", 2, atLeast(30))]))).to.deep.equal([[-10.4, 19.6]]);
            // ST1a, ST1b: at exactly 12 points or less, it is as it is, as at single spacing (ST4b), and so are the lines below
            // the first
            expect(topsOf(suppressed([paragraph("a", 1, exact(10)), paragraph("b", 1), paragraph("c", 1, exact(40))]))).to.deep.equal([
                [10, 20, 30],
            ]);
            expect(topsOf(suppressed([paragraph("a", 1, { lineSpacing: { rule: "multiple", multiple: 1 } })]))).to.deep.equal([[10]]);
            // At the top of each page, after a page break too (ST1)
            expect(topsOf(suppressed([paragraph("a", 1), paragraph("b", 1, { ...exact(40), pageBreakBefore: true })]))).to.deep.equal([
                [10],
                [-12.4],
            ]);
        });

        it("should stop at the first line of a page at spacing Word hasn't shown with suppressTopSpacing", () => {
            // Multiple spacing, and at least a height less than its text's (ST2a)
            expect(stoppedAt(suppressed([paragraph("a", 1, { lineSpacing: { rule: "multiple", multiple: 1.5 } })]))).to.equal(reason);
            expect(stoppedAt(suppressed([paragraph("a", 1, atLeast(5))]))).to.equal(reason);
            // A paragraph's third line at the top of the next page, the space before a section's first paragraph, and a line on
            // a document grid
            expect(stoppedAt(suppressed([paragraph("a", 3, exact(40))]))).to.equal(reason);
            expect(stoppedAt(suppressed([paragraph("a", 1, { ...exact(40), spaceBefore: 5 })]))).to.equal(reason);
            expect(stoppedAt(suppressed([{ ...paragraph("a", 1, exact(40)), grid: { linePitch: 15 } }]))).to.equal(reason);
            // Below the top of the page, a line of any spacing is as it is
            expect(stoppedAt(suppressed([paragraph("a", 1), paragraph("b", 1, atLeast(5))]))).to.equal(undefined);
        });

        it("should stop at a table at the top of a page with lines of other than single spacing in its cells", () => {
            const spacedRow = row([[paragraph("cell", 1, exact(40))]]);
            expect(stoppedAt(suppressed([table([spacedRow])]))).to.equal(reason);
            // Below the top, as Word lays it out (ST4c), but not at the top of the next page it goes on to
            expect(stoppedAt(suppressed([paragraph("a", 1), table([spacedRow])]))).to.equal(undefined);
            expect(stoppedAt(suppressed([paragraph("a", 1), table([spacedRow, spacedRow])]))).to.equal(reason);
            // One of single spacing, in a table in a cell too, is as it is
            const nested = row([[paragraph("cell", 1), table([row([[paragraph("in", 1)]])])]]);
            expect(stoppedAt(suppressed([table([nested])]))).to.equal(undefined);
        });
    });

    describe("multiple line spacing at the bottom of a page", () => {
        // Lines of 15 points at 1.5 lines, 5 of which are the spacing below their text
        const spaced: ParagraphFormat = { lineSpacing: { rule: "multiple", multiple: 1.5 } };
        const lines = (names: string): readonly ParagraphBlock[] => [...names].map((name) => paragraph(name, 1, spaced));

        it("should put a line on a page when only the spacing below its text goes past the bottom, as Word does", () => {
            // e ends at 75 points, 5 past the 70 of the page: Word puts 26 lines of 544.09 twips on a page of 13958, the last
            // without its 268.55 (`word-mixed-heights.docx` MH1c), and 20 of 699.37, a picture beside text, without 40.28
            // (`word-watertight-text.docx` TX8c)
            expect(pagesOf(document(lines("abcdef")))).to.deep.equal({ a: "1", b: "1", c: "1", d: "1", e: "1", f: "2" });
            // In a paragraph, the fifth of its 8 lines goes on the page that way, and the other 3 on the next, with next, and
            // after, which goes below the bottom that way too
            const long = document([paragraph("long", 8, spaced), ...lines("na"), paragraph("last", 1)]);
            expect(pagesOf(long)).to.deep.equal({ long: "1", n: "2", a: "2", last: "3" });
            // A line whose text goes past the bottom too goes on the next page: d's ends at 75 below 2 lines of 10
            expect(pagesOf(document([paragraph("z", 2), ...lines("abcde")]))).to.include({ c: "1", d: "2" });
            // What is kept with the next fits when it does that way
            const kept = document([...lines("abc"), paragraph("d", 1, { ...spaced, keepNext: true }), ...lines("ef")]);
            expect(pagesOf(kept)).to.include({ d: "1", e: "1", f: "2" });
            // And at the end of a section, kept with nothing
            const atEnd: ParagraphBlock = { ...paragraph("end", 0), sectionBreak: true };
            const keptAtEnd = document(
                [
                    ...lines("abcd").map((block): readonly [Block, number] => [block, 0]),
                    [{ ...paragraph("e", 1, { ...spaced, keepNext: true }) }, 0],
                    [atEnd, 0],
                    [paragraph("f", 1), 1],
                ],
                { sections: [SECTION, SECTION] },
            );
            expect(pagesOf(keptAtEnd)).to.include({ e: "1", f: "2" });
        });

        it("should stop where Word hasn't shown whether the spacing below a line goes past the bottom", () => {
            // In a table row across pages, at 40 points down, where the third line of the cell ends at 85
            const rowAcross = document([paragraph("a", 3), table([row([[paragraph("cell", 6, spaced)]])]), paragraph("b", 1)]);
            expect(paginate(rowAcross, { measurer: MEASURER }).stoppedAt).to.equal(
                "a table row across pages whose line's multiple spacing goes below the page",
            );
            // Above a paragraph's border below: e's line ends at 70, and its border at 73, but at 68 without the spacing
            const borders = { top: 0, bottom: 3, between: 0, betweenSpace: 0, box: "box", outline: "box" };
            const bordered = document([paragraph("a", 3), ...lines("b"), paragraph("c", 1), { ...paragraph("e", 1, spaced), borders }]);
            expect(paginate(bordered, { measurer: MEASURER }).stoppedAt).to.equal(
                "a line whose room below its text goes below the page, above its paragraph's border",
            );
        });

        it("should stop at a line whose height Word hasn't shown, with or without fields", () => {
            // A picture alone in its line, in a paragraph at multiple spacing whose mark is larger than its run's font
            const picture: ParagraphBlock = {
                ...paragraph("picture", 0, { lineSpacing: { rule: "multiple", multiple: 1.5 } }),
                items: [{ type: "box", width: 10, height: 5, font: { size: 4 } }],
            };
            const reason = "a picture alone in a line of a paragraph whose mark is larger, with multiple line spacing";
            expect(paginate(document([paragraph("a", 1), picture]), { measurer: MEASURER }).stoppedAt).to.equal(reason);
            const withField = withItems(picture, [{ type: "pageCount", scope: "document", font: {} }]);
            expect(paginate(document([paragraph("a", 1), withField]), { measurer: MEASURER }).stoppedAt).to.equal(reason);
        });
    });

    describe("fonts", () => {
        const STOP = "a font not in the width tables";
        // Knows every font but Unknown
        const CHOOSY: TextMeasurer = { ...MEASURER, unknownFont: ({ font }) => font === "Unknown" };
        const UNKNOWN = { font: "Unknown" };
        const withText = (name: string, text: string, font = {}): ParagraphBlock =>
            withItems(paragraph(name, 1), [{ type: "text", text: ` ${text}`, font }]);

        it("should stop at text in a font the measurer doesn't know, rather than measure it as another font", () => {
            const content = document([paragraph("a", 1), withText("b", "x", UNKNOWN), paragraph("c", 1)]);
            expect(numbersOf(content, CHOOSY)).to.deep.equal({
                bookmarks: new Map([["a", "1"]]),
                pageCount: 1,
                sectionPageCounts: [undefined],
                stoppedAt: STOP,
            });
            // A measurer that measures every font as best it can lays it all out
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1" });
        });

        it("should stop at a tab or break in such a font, and an empty paragraph whose mark is, as their lines are as tall as it", () => {
            for (const item of [
                { type: "tab", font: UNKNOWN },
                { type: "break", kind: "line", font: UNKNOWN },
            ] as const) {
                expect(numbersOf(document([withItems(paragraph("a", 1), [item])]), CHOOSY).stoppedAt).to.equal(STOP);
            }
            const empty: ParagraphBlock = { ...paragraph("a", 1), items: [{ type: "marker", name: "a" }], markFont: UNKNOWN };
            expect(numbersOf(document([empty]), CHOOSY).stoppedAt).to.equal(STOP);
            // A paragraph with text on each of its lines isn't as tall as its mark anywhere
            expect(numbersOf(document([{ ...paragraph("a", 2), markFont: UNKNOWN }]), CHOOSY).stoppedAt).to.equal(undefined);
        });

        it("should stop at text in a font the measurer doesn't know in a table sized to its text", () => {
            const fitted: TableBlock = { ...table([row([[withText("cell", "x", UNKNOWN)]])]), fit: {} };
            expect(paginate(document([paragraph("a", 1), fitted]), { measurer: CHOOSY }).stoppedAt).to.equal(STOP);
        });

        it("should stop at a font not in the width tables, measuring with them, unless asked to measure it as the most similar", () => {
            const inFont = (font: string): DocumentContent => document([withText("a", "x", { font, size: 11 }), paragraph("b", 1)]);
            expect(paginate(inFont("Roboto")).stoppedAt).to.equal(STOP);
            expect(paginate(inFont("Roboto"), { measurer: SIMILAR_FONT_MEASURER }).stoppedAt).to.equal(undefined);
            // Carlito is made as wide as Calibri, so is measured as it
            expect(paginate(inFont("Carlito")).stoppedAt).to.equal(undefined);
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

        it("should move a table's header rows to the next page with the first row when none of it fits below them, as Word does", () => {
            const headed = (first: TableRow, before: readonly Block[] = [paragraph("a", 5)]): DocumentContent =>
                document([...before, table([row([[paragraph("header", 1)]], { header: true }), first, row([[paragraph("next", 1)]])])]);
            // word-stops-floats.docx HR1b: a row that can't break, of 2 lines, beside the header row on the last line
            expect(pagesOf(headed(row([[paragraph("first", 2)]], { cantSplit: true })))).to.deep.equal({
                a: "1",
                header: "2",
                first: "2",
                next: "2",
            });
            // HR1d: the first row kept with the next, so the header row and both rows go on the next page
            const kept = row([[paragraph("first", 1, { keepNext: true })]]);
            expect(pagesOf(headed(kept, [paragraph("a", 6)]))).to.deep.equal({ a: "1", header: "2", first: "2", next: "2" });
            // HR1c, HR1f: a row that breaks, with lines of it below the header row, leaves it there
            expect(pagesOf(headed(row([[paragraph("first", 4)]]), [paragraph("a", 4)]))).to.deep.equal({
                a: "1",
                header: "1",
                first: "1",
                next: "2",
            });
            // At the top of a page, they stay, as the next page has no more room for the row, which can't break, and goes on
            // to the next page, where it breaks as it is taller than a page
            expect(pagesOf(headed(row([[paragraph("first", 9)]], { cantSplit: true }), []))).to.deep.equal({
                header: "1",
                first: "2",
                next: "3",
            });
            // Below a paragraph kept with the next, which Word may move with them
            const heading = paragraph("heading", 1, { keepNext: true });
            const afterHeading = headed(row([[paragraph("first", 2)]], { cantSplit: true }), [paragraph("a", 4), heading]);
            expect(paginate(afterHeading, { measurer: MEASURER }).stoppedAt).to.equal(
                "a paragraph kept with the next before a table whose header rows go on to the next page",
            );
            const guessed = paginate(afterHeading, { measurer: MEASURER, guess: true });
            expect(Object.fromEntries(inBody(afterHeading, guessed.bookmarks))).to.deep.include({ heading: "1", header: "2", first: "2" });
            // It says what it guessed at, though the table is laid out again from the next page
            expect(guessed.pages[0].guesses).to.deep.equal([
                "a paragraph kept with the next before a table whose header rows go on to the next page",
            ]);
            // With space between its cells and borders, the table doesn't break where its header rows go on to the next page
            // with the row, so nothing is guessed at in laying it out here
            const spacedRows = (first: TableRow): TableBlock => ({
                ...table([row([[paragraph("header", 1)]], { header: true }), first, row([[paragraph("next", 1)]])]),
                cellSpacing: 1,
            });
            const spaced = document([paragraph("a", 5), spacedRows(row([[paragraph("first", 2)]], { cantSplit: true }))]);
            expect(pagesOf(spaced)).to.deep.equal({ a: "1", header: "2", first: "2", next: "2" });
            expect(paginate(spaced, { measurer: MEASURER, guess: true }).pages.flatMap(({ guesses = [] }) => guesses)).to.deep.equal([]);
            const broken = document([paragraph("a", 5), spacedRows(row([[paragraph("first", 4)]]))]);
            expect(paginate(broken, { measurer: MEASURER, guess: true }).pages.flatMap(({ guesses = [] }) => guesses)).to.deep.equal([]);
            // At the foot of a column, which Word may do otherwise
            const narrow = (one: TableRow): TableRow => ({ ...one, cells: one.cells.map((cell) => ({ ...cell, width: 35 })) });
            const inColumns = document(
                [
                    paragraph("a", 5),
                    table(
                        [row([[paragraph("header", 1)]], { header: true }), row([[paragraph("first", 2)]], { cantSplit: true })].map(
                            narrow,
                        ),
                    ),
                ],
                { sections: [{ ...SECTION, columns: [35, 35] }] },
            );
            expect(paginate(inColumns, { measurer: MEASURER }).stoppedAt).to.equal("a table's header rows alone at the foot of a column");
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
            const widened = { ...given, widen: {} };
            expect(pagesOf(document([paragraph("a", 2), widened, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
            // Not yet in a table of a share of the width that the word is longer than, which stops the layout
            const share = { ...given, widen: { share: 0.25 } };
            const unknown = paginate(document([paragraph("a", 2), share]), { measurer: MEASURER });
            expect(unknown.stoppedAt).to.equal("a word longer than its table can make room for");
            // A paragraph kept with it is laid out before the layout stops there, as it is before any table it can't lay out
            const kept = paginate(document([paragraph("a", 2), paragraph("heading", 1, { keepNext: true }), share]), {
                measurer: MEASURER,
            });
            expect(kept.bookmarks).to.deep.equal(
                new Map([
                    ["a", "1"],
                    ["heading", "1"],
                ]),
            );
            expect(kept.stoppedAt).to.equal("a word longer than its table can make room for");
        });

        it("should size the columns of a table given no widths around a cell across them, and to a table in a cell", () => {
            const words = (text: string): ParagraphBlock => ({
                type: "paragraph",
                items: [{ type: "text", text, font: {} }],
                format: {},
                tabStops: [],
                markFont: {},
            });
            /** A cell of text, read 20 points wide, across columns when given */
            const textCell = (column: number, blocks: readonly Block[], span?: number): TableCell => ({
                ...row([blocks]).cells[0],
                column,
                width: 20,
                ...(span === undefined ? {} : { span }),
            });
            const across = table([
                { ...row([]), cells: [textCell(0, [words("aaa bbb ccc")], 2)] },
                { ...row([]), cells: [textCell(0, [words("aaa")]), textCell(1, [words("bbb")])] },
            ]);
            // At the 20 points it is read with, the cell across both columns takes 3 lines, and b doesn't fit. Sized to its
            // text, its columns are each 40 wide, so its text takes 2 lines across them, and leaves room for b
            expect(pagesOf(document([paragraph("a", 3), across, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
            expect(pagesOf(document([paragraph("a", 3), { ...across, fit: {} }, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "1" });
            // A table in a cell is as narrow and as wide as its columns: 40 and 140 here, beside 20 and 110. Its column is
            // narrowed to 50.5, and the other to 29.5, so the row takes 4 lines, which push b to the next page
            const inner: TableBlock = { ...table([{ ...row([]), cells: [textCell(0, [words("aaaa bbbb cccc")])] }]), fit: {} };
            const outer: TableBlock = {
                ...table([{ ...row([]), cells: [textCell(0, [inner]), textCell(1, [words("ab cd ef gh")])] }]),
                fit: {},
            };
            expect(pagesOf(document([paragraph("a", 3), outer, paragraph("b", 1)]))).to.deep.equal({ a: "1", b: "2" });
        });

        it("should share a long word in a cell across columns as Word does, and stop where they are narrowed around it", () => {
            const words = (text: string): ParagraphBlock => ({
                type: "paragraph",
                items: [{ type: "text", text, font: {} }],
                format: {},
                tabStops: [],
                markFont: {},
            });
            const [first, second] = row([[words("a")], [words("b c")]]).cells;
            // A word of 70 points across columns of 10 and 30 at their widest lines, which share it 20 to 40 (SP17): "b c"
            // stays on a line, and b fits below the table
            const longWord: TableBlock = {
                ...table([
                    { ...row([]), cells: [{ ...first, span: 2, blocks: [words("abcdefg")] }] },
                    { ...row([]), cells: [first, second] },
                ]),
                fit: {},
            };
            const shared = paginate(document([paragraph("a", 4), longWord, paragraph("b", 1)]), { measurer: MEASURER });
            expect(shared.stoppedAt).to.equal(undefined);
            expect(Object.fromEntries(shared.bookmarks)).to.deep.equal({ a: "1", b: "1" });
            // Across columns whose lines are longer than it, narrowed, how Word shares it isn't known (U1m)
            const narrowed: TableBlock = {
                ...table([
                    { ...row([]), cells: [{ ...first, span: 2, blocks: [words("abcdef")] }] },
                    {
                        ...row([]),
                        cells: [
                            { ...first, blocks: [words("a bb cc")] },
                            { ...second, blocks: [words("a bb cc dd")] },
                        ],
                    },
                ]),
                fit: {},
            };
            const { bookmarks, stoppedAt } = paginate(document([paragraph("a", 1), narrowed, paragraph("b", 1)]), { measurer: MEASURER });
            expect(stoppedAt).to.equal("a long word in cells merged across columns");
            expect(Object.fromEntries(bookmarks)).to.deep.equal({ a: "1" });
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
            const atLeast = (lines: number, room: number, height = 45): Record<string, string> =>
                pagesOf(
                    document([
                        paragraph("a", 7 - room),
                        table([row([[paragraph("set", lines)], [paragraph("beside", 1)]], { height: { value: height, rule: "atLeast" } })]),
                    ]),
                );
            // With room for 4 of its 6 lines, but not its 45 points, it moves (`word-line-heights.docx` T3a). With room for
            // 5 lines, it breaks, 4 and 2 with widow control (T3c)
            expect(atLeast(6, 4)).to.deep.equal({ a: "1", set: "2", beside: "2" });
            expect(atLeast(6, 5)).to.deep.equal({ a: "1", set: "1", beside: "1" });
            // Shorter than its height, it moves too (T3d), and so it does when its text doesn't fit either: 8 lines at least
            // 2700 twips high, with room for 6, move whole (`word-probes.docx` U4f), where LibreOffice breaks them 6 and 2
            expect(atLeast(2, 4)).to.deep.equal({ a: "1", set: "2", beside: "2" });
            expect(atLeast(5, 4, 60)).to.deep.equal({ a: "1", set: "2", beside: "2" });
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
        });

        describe("rows kept with the next", () => {
            const rows = (count: number, kept: (index: number) => boolean, cells = 1): TableBlock =>
                table(
                    Array.from({ length: count }, (_, index) =>
                        row(
                            Array.from({ length: cells }, (__, cell) => [
                                paragraph(cell === 0 ? `r${index + 1}` : `r${index + 1}right`, 1, { keepNext: cell === 0 && kept(index) }),
                            ]),
                        ),
                    ),
                );
            const pagesOfRows = (before: number, block: TableBlock): Record<string, string> =>
                pagesOf(document([paragraph("a", before), block, paragraph("after", 1)]));

            it("should keep a row any of whose paragraphs is kept with the next with the next row, as Word does", () => {
                // As word-watertight-tables.docx TB5: 10 one-line rows, the first 5 of which fit on the page. Here 3 of 5 fit
                // TB5d: none kept
                expect(
                    pagesOfRows(
                        4,
                        rows(5, () => false),
                    ),
                ).to.deep.include({ r1: "1", r2: "1", r3: "1", r4: "2" });
                // TB5c: the third row kept moves to the next page with the fourth
                expect(
                    pagesOfRows(
                        4,
                        rows(5, (index) => index === 2),
                    ),
                ).to.deep.include({ r1: "1", r2: "1", r3: "2", r4: "2" });
                // TB5a: every row but the last kept moves the table to the next page, where it fits
                expect(
                    pagesOfRows(
                        4,
                        rows(5, (index) => index < 4),
                    ),
                ).to.deep.include({ r1: "2", r5: "2", after: "2" });
                // TB5b: the same with only one of each row's two cells kept
                expect(
                    pagesOfRows(
                        4,
                        rows(5, (index) => index < 4, 2),
                    ),
                ).to.deep.include({ r1: "2", r1right: "2", r5: "2" });
            });

            it("should break rows kept with the next that don't fit on a page of their own where it ends, after moving them to one", () => {
                // As word-table-formats.docx KR5
                expect(
                    pagesOfRows(
                        4,
                        rows(8, (index) => index < 7),
                    ),
                ).to.deep.include({ r1: "2", r7: "2", r8: "3", after: "3" });
                // At the top of a page, they stay there
                expect(pagesOf(document([rows(8, (index) => index < 7), paragraph("after", 1)]))).to.deep.include({
                    r1: "1",
                    r7: "1",
                    r8: "2",
                });
            });

            it("should keep a row kept with the next on the page with the first lines of the next, when it breaks across pages", () => {
                // As word-table-formats.docx KR7: the kept row stays, and the next breaks after its first 2 lines
                const beforeTall = table([row([[paragraph("kept", 1, { keepNext: true })]]), row([[paragraph("tall", 4)]])]);
                expect(pagesOf(document([paragraph("a", 4), beforeTall]))).to.deep.include({ kept: "1", tall: "1" });
                // Without room for 2 of its lines, as widow control keeps them, the kept row moves with it
                expect(pagesOf(document([paragraph("a", 5), beforeTall]))).to.deep.include({ kept: "2", tall: "2" });
                // As many of the next row's lines as keepLines keeps together, or one without widow control
                const beforeKept = (format: ParagraphFormat): TableBlock =>
                    table([row([[paragraph("kept", 1, { keepNext: true })]]), row([[paragraph("tall", 4, format)]])]);
                expect(pagesOf(document([paragraph("a", 4), beforeKept({ keepLines: true })]))).to.deep.include({ kept: "2", tall: "2" });
                expect(pagesOf(document([paragraph("a", 5), beforeKept({ widowControl: false })]))).to.deep.include({
                    kept: "1",
                    tall: "1",
                });
                // A row without cells isn't kept with the next
                expect(pagesOf(document([paragraph("a", 6), table([row([]), row([[paragraph("r", 1)]])])]))).to.deep.include({
                    a: "1",
                    r: "1",
                });
                // A row kept with the next before a row kept whole moves with it when it doesn't fit
                const beforeWhole = table([
                    row([[paragraph("kept", 1, { keepNext: true })]]),
                    row([[paragraph("whole", 3)]], { cantSplit: true }),
                ]);
                expect(pagesOf(document([paragraph("a", 4), beforeWhole]))).to.deep.include({ kept: "2", whole: "2" });
            });

            it("should count an empty cell, and a table in a cell's first row, among the first lines of a row kept with", () => {
                const kept = row([[paragraph("kept", 1, { keepNext: true })]]);
                const emptyBeside = (lines: number): TableRow => {
                    const laid = row([[{ ...paragraph("empty", 0), items: [] }], [paragraph("tall", lines)]]);
                    return { ...laid, cells: [{ ...laid.cells[0], hideMark: true }, laid.cells[1]] };
                };
                expect(pagesOf(document([paragraph("a", 4), table([kept, emptyBeside(4)])]))).to.deep.include({ kept: "1", tall: "1" });
                // A table in a cell breaks as its rows do, so the least of it is its first row's first lines: a row of a line
                // that can't break, or the first 2 of 4 lines
                const nested = row([[table([row([[paragraph("inner", 1)]])])], [paragraph("tall", 4)]]);
                expect(pagesOf(document([paragraph("a", 4), table([kept, nested])]))).to.deep.include({ kept: "1", inner: "1", tall: "1" });
                const breaking = row([[table([row([[endMarked("inner", 4)]]), row([[paragraph("next", 1)]])])]]);
                expect(pagesOf(document([paragraph("a", 4), table([kept, breaking])]))).to.deep.include({
                    kept: "1",
                    inner: "1",
                    innerEnd: "2",
                    next: "2",
                });
                // A table without rows has none
                const empty = row([[table([]), paragraph("tall", 4, { widowControl: false })]]);
                expect(pagesOf(document([paragraph("a", 5), table([kept, empty])]))).to.deep.include({ kept: "1", tall: "1" });
            });

            it("should count the largest margins of the next row's cells among its first lines, as the row has them", () => {
                // A cell of a line 5 points below the top, beside one of 4 lines: the row's first part is 5 points and 2
                // lines tall, which doesn't fit in the 2 lines left, so the kept row moves with it
                const kept = row([[paragraph("kept", 1, { keepNext: true })]]);
                const laid = row([[paragraph("left", 1)], [paragraph("tall", 4)]]);
                const next: TableRow = { ...laid, cells: [{ ...laid.cells[0], marginTop: 5 }, laid.cells[1]] };
                const content = document([paragraph("a", 4), table([kept, next])]);
                expect(numbersOf(content).stoppedAt).to.equal(undefined);
                expect(pagesOf(content)).to.deep.include({ a: "1", kept: "2", tall: "2" });
            });

            it("should stop at a row kept with the next before a row whose first lines then move to the next page", () => {
                // The next row has room for its first 2 lines, but not for the height it is set to, so it moves whole
                const next = row([[paragraph("left", 4)]], { height: { value: 50, rule: "atLeast" } });
                const content = document([paragraph("a", 4), table([row([[paragraph("kept", 1, { keepNext: true })]]), next])]);
                expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal(
                    "a table row kept with the next before a row that moves to the next page",
                );
            });

            it("should keep the last row kept with the next with the paragraph after the table, as Word does", () => {
                // As word-table-formats.docx KR3: the table ends the page, and its last row moves with the paragraph after it
                const last = (kept: boolean): Record<string, string> =>
                    pagesOf(document([paragraph("a", 4), rows(3, (index) => kept && index === 2), paragraph("b", 1)]));
                expect(last(false)).to.deep.include({ r2: "1", r3: "1", b: "2" });
                expect(last(true)).to.deep.include({ r2: "1", r3: "2", b: "2" });
                // Kept with nothing at the end of the document
                expect(pagesOf(document([paragraph("a", 4), rows(3, (index) => index === 2)]))).to.deep.include({ r3: "1" });
            });

            it("should keep a paragraph kept with the next with a table's first row and the rows kept with it", () => {
                // The heading and the first 3 rows are 4 lines, which don't fit below a's 4
                const content = document([paragraph("a", 4), paragraph("heading", 1, { keepNext: true }), rows(4, (index) => index < 2)]);
                expect(pagesOf(content)).to.deep.include({ a: "1", heading: "2", r1: "2", r3: "2" });
            });
        });

        it("should give text that runs up or down a cell, and an empty paragraph whose mark takes no room, no height, as Word does", () => {
            const cellOf = (blocks: readonly Block[], changes: Partial<TableCell>): TableCell => ({
                ...merged("restart", blocks),
                verticalMerge: undefined,
                ...changes,
            });
            const tallMark: ParagraphBlock = { ...paragraph("mark", 0), items: [{ type: "marker", name: "mark" }], markFont: { size: 30 } };
            const rowOf = (first: TableCell): TableRow => {
                const { cells, ...properties } = row([[], [paragraph("beside", 1)]]);
                return { ...properties, cells: [first, cells[1]] };
            };
            // 4 lines, the row, then b, on pages of 7 lines
            const laidOut = (first: TableCell): Record<string, string> =>
                pagesOf(document([paragraph("a", 4), table([rowOf(first)]), paragraph("b", 2)]));
            // word-watertight-tables.docx TB6: a cell of text running up beside a cell of a line is as tall as the line
            expect(laidOut(cellOf([paragraph("vertical", 5)], { vertical: true }))).to.deep.include({ beside: "1", vertical: "1", b: "1" });
            // TB7: an empty cell with a 28-point mark and hideMark beside a line is as tall as the line, and 28 points without
            expect(laidOut(cellOf([tallMark], { hideMark: true }))).to.deep.include({ beside: "1", mark: "1", b: "1" });
            expect(laidOut(cellOf([tallMark], {}))).to.deep.include({ beside: "1", mark: "1", b: "2" });
            // Its lines still count when it isn't empty
            expect(laidOut(cellOf([paragraph("lines", 2)], { hideMark: true }))).to.deep.include({ beside: "1", lines: "1", b: "2" });
            expect(laidOut(cellOf([paragraph("lines", 2), tallMark], { hideMark: true }))).to.deep.include({
                beside: "1",
                lines: "1",
                b: "2",
            });
            // A cell merged down the rows with text running up or down needs no room in them
            const content = document([
                paragraph("a", 4),
                table([
                    mergedRow({ ...merged("restart", [paragraph("long", 6)]), vertical: true }, [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ]),
                paragraph("b", 1),
            ]);
            expect(pagesOf(content)).to.deep.include({ long: "1", r1: "1", r2: "1", b: "1" });
            // One with a table before its paragraph, which the reader stops at without a guess, is as tall as a line of the
            // paragraph's mark, rather than failing to measure the table as a paragraph (`word-stops-vertical-cells.docx`
            // TV5d)
            const nested = table([row([[paragraph("nested", 3)]])]);
            expect(laidOut(cellOf([nested, paragraph("after", 1)], { vertical: true }))).to.deep.include({
                beside: "1",
                nested: "1",
                b: "1",
            });
        });

        it("should lay out each paragraph of text fitted to its cell on one line, as Word squeezes it there", () => {
            // word-stops-tables.docx TS8: text longer than its cell of 2000 twips on one line, and the row a line tall
            const fitted = (fitText: boolean): TableBlock => {
                const laid = row([[paragraph("fitted", 3), paragraph("second", 1)], [paragraph("beside", 1)]]);
                return table([{ ...laid, cells: [{ ...laid.cells[0], ...(fitText ? { fitText } : {}) }, laid.cells[1]] }]);
            };
            const heightOf = (fitText: boolean): unknown => paginate(document([fitted(fitText)]), { measurer: MEASURER }).pages[0].body[0];
            expect(heightOf(true)).to.deep.include({ rows: [{ index: 0, y: 10, height: 20 }] });
            expect(heightOf(false)).to.deep.include({ rows: [{ index: 0, y: 10, height: 40 }] });
            // It breaks across pages between its paragraphs
            expect(pagesOf(document([paragraph("a", 6), fitted(true)]))).to.deep.include({ fitted: "1", second: "2" });
        });

        it("should move rows with text running up or down, or an empty paragraph whose mark takes no room, whole, or break them as other rows", () => {
            const vertical = (lines: number): TableRow => {
                const laid = row([[paragraph("up", 3)], [paragraph("beside", lines)]]);
                return { ...laid, cells: [{ ...laid.cells[0], vertical: true }, laid.cells[1]] };
            };
            // A row that moves to the next page whole has its bookmarks there, those in text running up or down too
            expect(pagesOf(document([paragraph("a", 6), table([vertical(2)])]))).to.deep.equal({ a: "1", up: "2", beside: "2" });
            // word-stops-vertical-cells.docx TV3a, TV3b: a row that breaks across pages breaks by its other cells, and its text
            // running up or down is on the page of its first part
            const broken = document([paragraph("a", 5), table([vertical(4)])]);
            expect(paginate(broken, { measurer: MEASURER }).stoppedAt).to.equal(undefined);
            expect(pagesOf(broken)).to.deep.equal({ a: "1", up: "1", beside: "1" });
            expect(numbersOf(broken).pageCount).to.equal(2);
            // A table in it, which stops the layout as it is read, makes it, guessing, as tall as a line of its paragraph's
            // mark (word-stops-vertical-cells.docx TV5d)
            const withTable = row([[table([row([[paragraph("inner", 3)]])]), paragraph("up", 1)], [paragraph("beside", 1)]]);
            const nested = table([{ ...withTable, cells: [{ ...withTable.cells[0], vertical: true }, withTable.cells[1]] }]);
            expect(paginate(document([nested]), { measurer: MEASURER }).pages[0].body[0]).to.deep.include({
                rows: [{ index: 0, y: 10, height: 10 }],
            });
            const { cells, ...properties } = row([
                [{ ...paragraph("hidden", 0), items: [{ type: "marker", name: "hidden" }] }],
                [paragraph("beside", 4)],
            ]);
            const hidden: TableRow = { ...properties, cells: [{ ...cells[0], hideMark: true }, cells[1]] };
            expect(pagesOf(document([paragraph("a", 5), table([hidden])]))).to.deep.equal({ a: "1", beside: "1", hidden: "1" });
            // A footnote in text that runs up or down
            const noted = {
                ...vertical(4),
                cells: [
                    { ...vertical(4).cells[0], blocks: [withItems(paragraph("up", 1), [{ type: "marker", name: "note" }])] },
                    vertical(4).cells[1],
                ],
            };
            const withNote = document([paragraph("a", 5), table([noted])], { footnotes: new Map([["note", [paragraph("n", 1)]]]) });
            expect(paginate(withNote, { measurer: MEASURER }).stoppedAt).to.equal("a footnote in text that runs up or down a table cell");
        });

        it("should break a table with space between its cells between rows and in them, with its borders at the break", () => {
            const spaced = (count: number, borders: Partial<TableRow>, lines = 1, headers = 0): TableBlock => ({
                ...table(
                    Array.from({ length: count }, (_, index) =>
                        row([[paragraph(`r${index}`, lines)]], { ...borders, ...(index < headers ? { header: true } : {}) }),
                    ),
                ),
                cellSpacing: 1,
            });
            // word-table-formats2.docx CS12: the table breaks between rows, each with the space below it
            const plain = document([paragraph("a", 5), spaced(3, { breakBorder: 0 })]);
            expect(numbersOf(plain).stoppedAt).to.equal(undefined);
            expect(pagesOf(plain)).to.deep.include({ r0: "1", r1: "1", r2: "2" });
            // word-stops-table-borders.docx TB7a: with borders, the table's bottom border below the last row on the page, and
            // its top border above the first on the next
            const rowsOf = (content: DocumentContent): readonly (readonly (readonly [number, number])[])[] =>
                paginate(content, { measurer: MEASURER }).pages.map(({ body }) =>
                    body.flatMap((block) => (block.type === "table" ? block.rows.map(({ index, y }) => [index, y] as const) : [])),
                );
            const bordered = document([paragraph("a", 5), spaced(3, { breakBorder: 5, breakTop: 5 })]);
            expect(rowsOf(bordered)).to.deep.equal([
                [[0, 60]],
                [
                    [1, 15],
                    [2, 25],
                ],
            ]);
            // TB7c: a row that breaks across the page, its lines on the page above the table's bottom border, and the rest
            // below its top border on the next: two lines of four, for widow control
            const broken = document([paragraph("a", 3), spaced(2, { breakBorder: 5, breakTop: 5 }, 4)]);
            expect(numbersOf(broken).stoppedAt).to.equal(undefined);
            expect(rowsOf(broken)).to.deep.equal([
                [[0, 40]],
                [
                    [0, 15],
                    [1, 35],
                ],
            ]);
            // Its last row, which has the table's space below it too, hasn't been seen breaking
            expect(numbersOf(document([paragraph("a", 4), spaced(1, { breakBorder: 5, breakTop: 5 }, 4)])).stoppedAt).to.equal(
                "the last row of a table with space between its cells across pages",
            );
            // With header rows repeated above them, what Word draws hasn't been seen
            expect(numbersOf(document([paragraph("a", 3), spaced(6, { breakBorder: 5, breakTop: 5 }, 1, 1)])).stoppedAt).to.equal(
                "a table with space between its cells, borders and header rows across pages",
            );
        });

        describe("rows taller than a page", () => {
            /** The rows on each page, and the lines of the paragraphs after the table */
            const laidOut = (content: DocumentContent): readonly (readonly BlockLayout[])[] =>
                paginate(content, { measurer: MEASURER }).pages.map(({ body }) => body.filter(({ index }) => index > 0));
            /** A table of a row of these cells, after a paragraph of lines, 7 of which fill a page, and a line after it */
            const tall = (before: number, cells: readonly (readonly Block[])[], changes: Partial<TableRow> = {}): DocumentContent =>
                document([paragraph("a", before), table([row(cells, changes)]), paragraph("below", 1)]);
            const kept = (name: string, lines: number): ParagraphBlock => ({ ...endMarked(name, lines), format: { keepLines: true } });

            it("should move a row that can't break, taller than a page, to a new page, and break it there, as Word does", () => {
                // As word-probes.docx's U5a: a row of 60 lines that can't break, from line 11 of 51, goes on the next page,
                // 51 lines and then 9, and the line below it follows them. Here 9 lines from line 3 of 7
                const cantSplit = tall(2, [[endMarked("tall", 9)]], { cantSplit: true });
                expect(pagesOf(cantSplit)).to.deep.equal({ a: "1", tall: "2", tallEnd: "3", below: "3" });
                expect(laidOut(cantSplit)).to.deep.equal([
                    [],
                    [{ type: "table", index: 1, rows: [{ index: 0, y: 10, height: 70 }] }],
                    [
                        { type: "table", index: 1, rows: [{ index: 0, y: 10, height: 20 }] },
                        { type: "paragraph", index: 2, lines: [{ text: "abcdefgh", x: 10, y: 30, width: 80, height: 10, textWidth: 80 }] },
                    ],
                ]);
                // At the top of a page, it breaks there, 51 and 9 (U5b)
                expect(pagesOf(tall(7, [[endMarked("tall", 9)]], { cantSplit: true }))).to.deep.equal({
                    a: "1",
                    tall: "2",
                    tallEnd: "3",
                    below: "3",
                });
            });

            it("should move a row of a paragraph kept together, taller than a page, to a new page, and break it there, as Word does", () => {
                // As word-probes.docx's U8c1: a row of a 60-line paragraph kept together, from line 11 of 51, goes on the next
                // page, 51 lines and then 9, where LibreOffice breaks it where it is, 41 and 19
                const content = tall(2, [[kept("tall", 9)]]);
                expect(pagesOf(content)).to.deep.equal({ a: "1", tall: "2", tallEnd: "3", below: "3" });
                expect(laidOut(content)).to.deep.equal(laidOut(tall(2, [[endMarked("tall", 9)]], { cantSplit: true })));
                // At the top of a page, it breaks there (U8c2), and beside a cell of a line, the line goes with the first 51
                // (U8c3)
                expect(pagesOf(tall(7, [[kept("tall", 9)]]))).to.deep.equal({ a: "1", tall: "2", tallEnd: "3", below: "3" });
                expect(pagesOf(tall(2, [[kept("tall", 9)], [paragraph("right", 1)]]))).to.deep.equal({
                    a: "1",
                    tall: "2",
                    tallEnd: "3",
                    right: "2",
                    below: "3",
                });
                // What follows it in its cell goes on below it
                expect(pagesOf(tall(2, [[kept("tall", 9), paragraph("after", 1)]]))).to.deep.equal({
                    a: "1",
                    tall: "2",
                    tallEnd: "3",
                    after: "3",
                    below: "3",
                });
                // After other lines in its cell, the row breaks above it, and it breaks at the top of the next page
                expect(pagesOf(tall(2, [[paragraph("first", 2), kept("tall", 9)]]))).to.deep.equal({
                    a: "1",
                    first: "1",
                    tall: "2",
                    tallEnd: "3",
                    below: "3",
                });
            });

            it("should give a row of a set height taller than a page a page of its own, cut off at its bottom, as Word does", () => {
                // As word-probes.docx's U5c and U5d: a row of 3 lines set to exactly or at least 15000 twips high, from line
                // 11 of a page with 13958 twips of room, takes all of the next page, and the line below it starts the page
                // after. Here 80 points, from line 3 of a page with 70
                for (const rule of ["exact", "atLeast"] as const) {
                    const content = tall(2, [[endMarked("set", 3)]], { height: { value: 80, rule } });
                    expect(pagesOf(content)).to.deep.equal({ a: "1", set: "2", setEnd: "2", below: "3" });
                    expect(laidOut(content)).to.deep.equal([
                        [],
                        [{ type: "table", index: 1, rows: [{ index: 0, y: 10, height: 70 }] }],
                        [
                            {
                                type: "paragraph",
                                index: 2,
                                lines: [{ text: "abcdefgh", x: 10, y: 10, width: 80, height: 10, textWidth: 80 }],
                            },
                        ],
                    ]);
                }
                // At the top of a page, it takes that page, and the table's next row goes on the next
                const rows = document([
                    table([row([[paragraph("set", 1)]], { height: { value: 80, rule: "exact" } }), row([[paragraph("next", 1)]])]),
                ]);
                expect(pagesOf(rows)).to.deep.equal({ set: "1", next: "2" });
            });

            it("should lay out rows taller than a page with merged cells, a footnote or more text than a page as Word does", () => {
                const set = { height: { value: 80, rule: "exact" as const } };
                const numbers = (content: DocumentContent): ReturnType<typeof numbersOf> => numbersOf(content);
                // word-stops-tables.docx RW5a: a cell merged down from it has its text in it, and the next row is on the next
                // page
                const mergedDown = document([
                    paragraph("a", 1),
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 1)]), [[paragraph("r1", 1)]], set),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                ]);
                expect(numbers(mergedDown).stoppedAt).to.equal(undefined);
                expect(pagesOf(mergedDown)).to.deep.include({ a: "1", merged: "2", r1: "2", r2: "3" });
                // RW5c: its footnote at the bottom of the next page
                const noted = withItems(paragraph("set", 1), [{ type: "marker", name: "note" }]);
                const withNote = { ...tall(2, [[noted]], set), footnotes: new Map([["note", [paragraph("n", 1)]]]) };
                expect(numbers(withNote).stoppedAt).to.equal(undefined);
                expect(paginate(withNote, { measurer: MEASURER }).pages.map(({ footnotes }) => footnotes.length)).to.deep.equal([0, 0, 1]);
                // RW6: a row at least as tall as more than a page, whose text is taller than one too, fills each page it is on
                const filling = tall(2, [[endMarked("set", 9)]], { height: { value: 80, rule: "atLeast" } });
                expect(numbers(filling).stoppedAt).to.equal(undefined);
                expect(pagesOf(filling)).to.deep.equal({ a: "1", set: "2", setEnd: "3", below: "4" });
                // RW11: in columns, one kept whole that is taller than a column goes down the first column of each page
                const inColumns = {
                    ...tall(2, [[endMarked("tall", 9)]], { cantSplit: true }),
                    sections: [{ ...SECTION, columns: [80, 80] }],
                };
                expect(numbers(inColumns).stoppedAt).to.equal(undefined);
                expect(pagesOf(inColumns)).to.deep.equal({ a: "1", tall: "2", tallEnd: "3", below: "3" });
            });

            it("should stop at a row taller than a page that Word hasn't been seen laying out", () => {
                const stoppedAt = (content: DocumentContent): string | undefined => paginate(content, { measurer: MEASURER }).stoppedAt;
                const KEPT = "a table row kept together taller than a column";
                // In columns, where Word lays a paragraph kept together that is taller than a column down the first column
                // of each page
                const inColumns = (cells: readonly (readonly Block[])[], changes: Partial<TableRow> = {}): DocumentContent => ({
                    ...tall(2, cells, changes),
                    sections: [{ ...SECTION, columns: [80, 80] }],
                });
                expect(stoppedAt(inColumns([[kept("tall", 9)]]))).to.equal(KEPT);
                expect(stoppedAt(inColumns([[paragraph("set", 1)]], { height: { value: 80, rule: "exact" } }))).to.equal(KEPT);
                const set = { height: { value: 80, rule: "exact" as const } };
                // A header row, which Word didn't repeat, but put what came after its table a page further on (RW5b)
                expect(stoppedAt(tall(2, [[paragraph("set", 1)]], { ...set, header: true }))).to.equal(
                    "a header row of a set height taller than a page",
                );
                // Two footnotes, and one with another on the page
                const noted = (name: string): ParagraphBlock => withItems(paragraph(name, 1), [{ type: "marker", name }]);
                const notes = new Map([
                    ["n1", [paragraph("x1", 1)]],
                    ["n2", [paragraph("x2", 1)]],
                ]);
                expect(stoppedAt({ ...tall(2, [[noted("n1"), noted("n2")]], set), footnotes: notes })).to.equal(
                    "footnotes in a table row of a set height taller than a page",
                );
                // A footnote in one set to at least a height taller than a page, whose text is taller than a page too
                const atLeast = { height: { value: 80, rule: "atLeast" as const } };
                expect(stoppedAt({ ...tall(2, [[noted("n1"), paragraph("set", 8)]], atLeast), footnotes: notes })).to.equal(
                    "a table row whose text and set height are both taller than a page",
                );
                // A cell merged down out of it with more text than it holds
                const outOf = document([
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 9)]), [[paragraph("r1", 1)]], set),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                ]);
                expect(stoppedAt(outOf)).to.equal(
                    "a cell merged down into a table row of a set height taller than a page, or out of it past it",
                );
                // A line taller than a page
                expect(
                    stoppedAt(
                        tall(0, [
                            [{ ...paragraph("big", 1), markFont: { size: 90 }, items: [{ type: "text", text: "x", font: { size: 90 } }] }],
                        ]),
                    ),
                ).to.equal("a line in a table cell taller than a page");
            });
        });

        describe("a table in a cell", () => {
            /** A table of one-line rows, each bookmarked with its name and number */
            const oneLineRows = (name: string, count: number, changes: Partial<TableRow> = {}): TableBlock =>
                table(Array.from({ length: count }, (_, index) => row([[paragraph(`${name}${index + 1}`, 1)]], changes)));
            /** The table, in the cell of a row with a line above it and a line below, after lines of a paragraph */
            const inCell = (before: number, inner: TableBlock, beside: readonly Block[] = []): DocumentContent =>
                document([
                    paragraph("a", before),
                    table([row([[paragraph("before", 1), inner, paragraph("after", 1)], ...(beside.length > 0 ? [beside] : [])])]),
                    paragraph("b", 1),
                ]);
            const stoppedAt = (content: DocumentContent): string | undefined => paginate(content, { measurer: MEASURER }).stoppedAt;

            it("should break between its rows, as Word does", () => {
                // As word-probes.docx's U4c: a line and a table of 6 one-line rows, from line 47 of 51, with 4 of them on the
                // page, and the other 2 and the line after the table on the next. Here 3 from line 4 of 7
                const content = inCell(3, oneLineRows("r", 6));
                expect(stoppedAt(content)).to.equal(undefined);
                expect(pagesOf(content)).to.deep.equal({
                    a: "1",
                    before: "1",
                    r1: "1",
                    r2: "1",
                    r3: "1",
                    r4: "2",
                    r5: "2",
                    r6: "2",
                    after: "2",
                    b: "2",
                });
                expect(
                    paginate(content, { measurer: MEASURER }).pages.map(({ body }) => body.filter(({ type }) => type === "table")),
                ).to.deep.equal([
                    [{ type: "table", index: 1, rows: [{ index: 0, y: 40, height: 40 }] }],
                    [{ type: "table", index: 1, rows: [{ index: 0, y: 10, height: 40 }] }],
                ]);
                // Beside a cell of 10 lines, which breaks after its 4th
                const beside = inCell(3, oneLineRows("r", 6), [endMarked("beside", 10)]);
                expect(pagesOf(beside)).to.deep.include({ r3: "1", r4: "2", beside: "1", besideEnd: "2", b: "2" });
            });

            it("should break in its rows between their lines, keeping to widow control, as Word does", () => {
                // As word-probes.docx's U4d: a line and a table of a row of 4 lines, from line 49 of 51, with 2 of them on the
                // page and 2 on the next. Here from line 5 of 7
                const inner = (format: ParagraphFormat = {}): TableBlock =>
                    table([row([[withItems(paragraph("inner", 4, format), [{ type: "marker", name: "innerEnd" }])]])]);
                expect(pagesOf(inCell(4, inner()))).to.deep.equal({ a: "1", before: "1", inner: "1", innerEnd: "2", after: "2", b: "2" });
                // From line 6, where widow control holds back the row's first line, the table goes to the next page whole
                expect(pagesOf(inCell(5, inner()))).to.deep.include({ before: "1", inner: "2", innerEnd: "2" });
                expect(pagesOf(inCell(5, inner({ widowControl: false })))).to.deep.include({ before: "1", inner: "1", innerEnd: "2" });
                // A row whose cell of 3 lines can't keep 2 of them on the page, beside one of 4 that can, moves to the next
                // page whole, as a row of the body does (word-rules2.docx Q3c)
                const beside = table([row([[paragraph("left", 4)], [paragraph("right", 3)]])]);
                expect(pagesOf(inCell(4, beside))).to.deep.include({ before: "1", left: "2", right: "2" });
                expect(pagesOf(inCell(4, table([row([[paragraph("left", 4)], [paragraph("right", 4)]])])))).to.deep.include({
                    before: "1",
                    left: "1",
                    right: "1",
                });
            });

            it("should move a row of it kept whole, or whose set height doesn't fit, to the next page whole, as a row of the body", () => {
                // 2 lines of room below its first row
                const second = (changes: Partial<TableRow>, lines = 4): TableBlock =>
                    table([row([[paragraph("first", 1)]]), row([[paragraph("second", lines)]], changes)]);
                expect(pagesOf(inCell(3, second({})))).to.deep.include({ first: "1", second: "1" });
                expect(pagesOf(inCell(3, second({ cantSplit: true })))).to.deep.include({ first: "1", second: "2" });
                expect(pagesOf(inCell(3, second({ height: { value: 40, rule: "exact" } })))).to.deep.include({ first: "1", second: "2" });
                expect(pagesOf(inCell(3, second({ height: { value: 40, rule: "atLeast" } }, 2)))).to.deep.include({
                    first: "1",
                    second: "2",
                });
                expect(pagesOf(inCell(3, second({ height: { value: 15, rule: "atLeast" } })))).to.deep.include({ first: "1", second: "1" });
            });

            it("should break a table in a cell of a table in a cell, and a table after the cell's first lines", () => {
                const content = inCell(3, table([row([[oneLineRows("r", 6)]])]));
                expect(stoppedAt(content)).to.equal(undefined);
                expect(pagesOf(content)).to.deep.include({ before: "1", r3: "1", r4: "2", after: "2" });
                // The space after the paragraph above the table is kept above it
                const withSpace = document([
                    paragraph("a", 2),
                    table([row([[paragraph("before", 1, { spaceAfter: 10 }), oneLineRows("r", 6)]])]),
                ]);
                expect(pagesOf(withSpace)).to.deep.include({ before: "1", r3: "1", r4: "2" });
                // A table with no rows takes no room
                expect(pagesOf(inCell(3, table([]), [paragraph("beside", 6)]))).to.deep.include({ before: "1", after: "1", beside: "1" });
            });

            it("should break it with its borders and its cells' margins as Word does", () => {
                /** The table after a line and a line with this much space after it, which leaves `50 - after` points for it */
                const after = (space: number, inner: TableBlock): DocumentContent =>
                    document([
                        paragraph("a", 1),
                        table([row([[paragraph("before", 1, { spaceAfter: space }), inner, paragraph("after", 1)]])]),
                        paragraph("b", 1),
                    ]);
                /** Rows with a border of 1 point above the first, between them and below the last, and below the last on a page */
                const bordered = (rows: readonly TableRow[], [top, between, bottom, breakBorder]: readonly number[]): TableBlock =>
                    table(
                        rows.map((laid, index) => ({
                            ...laid,
                            borderTop: index === 0 ? top : between,
                            borderBottom: index === rows.length - 1 ? bottom : 0,
                            breakBorder,
                        })),
                    );
                const ones = oneLineRows("r", 6).rows;
                // As word-nested-tables.docx N1a: the border below the last row on the page takes room there, so with room for 3
                // rows and their borders above them, 2 go on it
                expect(pagesOf(after(17, bordered(ones, [1, 1, 1, 1])))).to.deep.include({ r2: "1", r3: "2" });
                // N1b: the border below them is the table's bottom border, here none
                expect(pagesOf(after(17, bordered(ones, [1, 1, 0, 0])))).to.deep.include({ r3: "1", r4: "2" });
                // N1c: without borders between the rows, 3 fit, and the rest go on below the table's top border
                const noneBetween = after(17, bordered(ones, [1, 0, 1, 1]));
                expect(pagesOf(noneBetween)).to.deep.include({ r3: "1", r4: "2" });
                const [, second] = paginate(noneBetween, { measurer: MEASURER }).pages;
                // The top border, 3 rows, the bottom border and the line after the table
                expect(second.body[0]).to.deep.equal({ type: "table", index: 1, rows: [{ index: 0, y: 10, height: 42 }] });
                // N2: a row of one-line paragraphs breaks with the border below it on the page, where 3 of them fit without
                const lined = (count: number): readonly ParagraphBlock[] =>
                    Array.from({ length: count }, (_, index) => paragraph(`m${index + 1}`, 1));
                const middle = [row([[paragraph("r1", 1)]]), row([lined(6)]), row([[paragraph("r3", 1)]])];
                expect(pagesOf(after(8, bordered(middle, [1, 1, 1, 1])))).to.deep.include({ r1: "1", m2: "1", m3: "2", r3: "2" });
                expect(pagesOf(after(8, bordered(middle, [0, 0, 0, 0])))).to.deep.include({ m3: "1", m4: "2" });
                // N3: a row breaks with its cells' margins above and below its lines on each page, where 3 fit without the one
                // below
                const margined = row([lined(6)]);
                const withMargins = table([{ ...margined, cells: [{ ...margined.cells[0], marginTop: 1, marginBottom: 1 }] }]);
                expect(pagesOf(after(19, withMargins))).to.deep.include({ m2: "1", m3: "2" });
            });

            it("should break one with header rows without repeating them, and stop where Word's breaking of it isn't known", () => {
                // word-stops-tables.docx RW1: its header rows aren't repeated on the next page
                const headed = table([row([[paragraph("h", 1)]], { header: true }), ...oneLineRows("r", 6).rows]);
                expect(stoppedAt(inCell(3, headed))).to.equal(undefined);
                expect(pagesOf(inCell(3, headed))).to.deep.include({ before: "1", h: "1", r2: "1", r3: "2" });
                expect(stoppedAt(inCell(6, headed))).to.equal(undefined);
                expect(pagesOf(inCell(6, headed))).to.deep.include({ before: "1", h: "2", r6: "2" });
                // RW2: cells merged down its rows whose text is all in their first rows
                const mergedDown = (lines: number): TableBlock =>
                    table([
                        mergedRow(merged("restart", [paragraph("m", lines)]), [[paragraph("r1", 1)]]),
                        ...Array.from({ length: 5 }, (_, index) => mergedRow(merged("continue"), [[paragraph(`r${index + 2}`, 1)]])),
                    ]);
                expect(stoppedAt(inCell(3, mergedDown(1)))).to.equal(undefined);
                expect(pagesOf(inCell(3, mergedDown(1)))).to.deep.include({ m: "1", r3: "1", r4: "2" });
                expect(stoppedAt(inCell(3, mergedDown(2)))).to.equal(
                    "a cell merged down the rows of a table in a table cell, whose text goes on past its first row, across pages",
                );
                expect(stoppedAt(inCell(3, { ...oneLineRows("r", 6), cellSpacing: 1 }))).to.equal(
                    "a table with space between its cells in a table cell across pages",
                );
                // Text that runs up or down a cell of it breaks as in the text (word-stops-vertical-cells.docx TV3a)
                const vertical = row([[paragraph("up", 2)], [paragraph("inner", 4)]]);
                const nestedVertical = inCell(
                    4,
                    table([{ ...vertical, cells: [{ ...vertical.cells[0], vertical: true }, vertical.cells[1]] }]),
                );
                expect(stoppedAt(nestedVertical)).to.equal(undefined);
                expect(pagesOf(nestedVertical)).to.deep.include({ up: "1", inner: "1" });
            });

            it("should break a row with a table in a cell beside a footnote, and a table in a cell merged down rows, as Word does", () => {
                // word-stops-notes.docx NT11: a table of rows taller than a line, by their borders, beside a line with a footnote
                // that would continue below 3 of them, breaks where the footnote fits whole below it, rather than after the line,
                // beside which none of its rows would fit
                const besideNote = (lines: number): DocumentContent => ({
                    ...document([
                        paragraph("a", 1),
                        table([
                            row([
                                [oneLineRows("r", 8, { borderTop: 1 })],
                                [withItems(paragraph("beside", 1), [{ type: "marker", name: "note" }])],
                            ]),
                        ]),
                        paragraph("b", 1),
                    ]),
                    footnotes: new Map([["note", [paragraph("n", lines)]]]),
                });
                const notesOnPages = (content: DocumentContent): readonly number[] =>
                    paginate(content, { measurer: MEASURER }).pages.map(({ footnotes }) => footnotes.length);
                expect(stoppedAt(besideNote(4))).to.equal(undefined);
                expect(pagesOf(besideNote(4))).to.deep.include({ r1: "1", beside: "1", r2: "2" });
                expect(notesOnPages(besideNote(4))).to.deep.equal([1, 0, 0]);
                expect(pagesOf(besideNote(1))).to.deep.include({ r4: "1", r5: "2" });
                // The cell's text goes down to the second row, which breaks across pages
                const inMerge = [
                    mergedRow(merged("restart", [paragraph("merged", 3), table([row([[paragraph("inner", 1)]])])]), [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ];
                // word-stops-tables.docx RW12: as the rest of the cell's text
                expect(stoppedAt(document([paragraph("a", 4), table(inMerge)]))).to.equal(undefined);
                expect(pagesOf(document([paragraph("a", 4), table(inMerge)]))).to.deep.include({ merged: "1", inner: "2" });
                // A table in a cell of a row that moves to the next page whole is laid out there
                expect(stoppedAt(document([paragraph("a", 5), table([row([[table([row([[paragraph("inner", 3)]])])]])])]))).to.equal(
                    undefined,
                );
                // And one in a cell merged down rows that end on the page, with its bookmarks
                const ending = [
                    mergedRow(merged("restart", [table([row([[paragraph("inner", 1)]])])]), [[paragraph("r1", 1)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ];
                expect(pagesOf(document([paragraph("a", 4), table(ending)]))).to.deep.include({ inner: "1", r2: "1" });
            });
        });

        it("should break the text of a cell merged down rows with the row of them that breaks across pages, as Word does", () => {
            // As word-probes.docx's U4a: an 8-line cell merged down 2 rows, beside one-line cells, from line 47 of 51. Its
            // text goes down from the top of the first row, so the second row breaks across pages with it, after its 5th line
            // at the bottom of the page, and the text after the table follows its last 3 at the top of the next. Here a 5-line
            // cell from line 5 of 7
            const merge = (lines: number): DocumentContent =>
                document([
                    paragraph("a", 4),
                    table([
                        mergedRow(merged("restart", [endMarked("merged", lines)]), [[paragraph("r1", 1)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                    paragraph("b", 1),
                ]);
            expect(pagesOf(merge(5))).to.deep.equal({ a: "1", merged: "1", mergedEnd: "2", r1: "1", r2: "1", b: "2" });
            /** The rows on each page, and the line of the paragraph after the table */
            const laidOut = (lines: number): readonly (readonly BlockLayout[])[] =>
                paginate(merge(lines), { measurer: MEASURER }).pages.map(({ body }) => body.filter(({ index }) => index > 0));
            expect(laidOut(5)).to.deep.equal([
                [
                    {
                        type: "table",
                        index: 1,
                        rows: [
                            { index: 0, y: 50, height: 10 },
                            { index: 1, y: 60, height: 20 },
                        ],
                    },
                ],
                [
                    { type: "table", index: 1, rows: [{ index: 1, y: 10, height: 20 }] },
                    { type: "paragraph", index: 2, lines: [{ text: "abcdefgh", x: 10, y: 30, width: 80, height: 10, textWidth: 80 }] },
                ],
            ]);
            // With widow control, 2 of 4 lines are on the page, so the row's part on it is only a line tall
            expect(pagesOf(merge(4))).to.deep.include({ merged: "1", mergedEnd: "2", b: "2" });
            expect(laidOut(4)[0][0]).to.deep.equal({
                type: "table",
                index: 1,
                rows: [
                    { index: 0, y: 50, height: 10 },
                    { index: 1, y: 60, height: 10 },
                ],
            });
            // A merge that fits on the page is laid out on it
            expect(pagesOf(merge(3))).to.deep.equal({ a: "1", merged: "1", mergedEnd: "1", r1: "1", r2: "1", b: "2" });
        });

        it("should put the text of a cell merged down from a row that breaks across pages beside it, and its next rows below the rest of it", () => {
            // As word-probes.docx's U4b: a 3-line cell merged down the first 2 of 3 rows, beside 6 lines in the first, from
            // line 48 of 51. All 3 are on the page beside the first 4, and the second row goes below the other 2 on the next
            // page. Here 2 lines beside 4 from line 6 of 7
            const content = document([
                paragraph("a", 5),
                table([
                    mergedRow(merged("restart", [endMarked("merged", 2)]), [[endMarked("r1", 4)]]),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    row([[paragraph("left3", 1)], [paragraph("r3", 1)]]),
                ]),
            ]);
            expect(pagesOf(content)).to.deep.equal({
                a: "1",
                merged: "1",
                mergedEnd: "1",
                r1: "1",
                r1End: "2",
                r2: "2",
                left3: "2",
                r3: "2",
            });
            expect(paginate(content, { measurer: MEASURER }).pages[1].body).to.deep.equal([
                {
                    type: "table",
                    index: 1,
                    rows: [
                        { index: 0, y: 10, height: 20 },
                        { index: 1, y: 30, height: 10 },
                        { index: 2, y: 40, height: 10 },
                    ],
                },
            ]);
        });

        it("should go on with the text of a cell merged down rows across the rows after the one that breaks across pages", () => {
            // 3 of the cell's 6 lines go on the page, beside 2 of the first row's 4, which widow control keeps from leaving
            // one alone. The other 3 go on from the top of its rows on the next page, so the second row is a line tall there,
            // below the first row's last 2, rather than the 2 lines it would be on one page
            const content = (last: Partial<TableRow> = {}): DocumentContent =>
                document([
                    paragraph("a", 4),
                    table([
                        mergedRow(merged("restart", [endMarked("merged", 6)]), [[endMarked("r1", 4)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]], last),
                    ]),
                    paragraph("b", 1),
                ]);
            expect(pagesOf(content())).to.deep.equal({ a: "1", merged: "1", mergedEnd: "2", r1: "1", r1End: "2", r2: "2", b: "2" });
            const pages = paginate(content(), { measurer: MEASURER }).pages;
            expect(pages[0].body[1]).to.deep.equal({ type: "table", index: 1, rows: [{ index: 0, y: 50, height: 30 }] });
            expect(pages[1].body[0]).to.deep.equal({
                type: "table",
                index: 1,
                rows: [
                    { index: 0, y: 10, height: 20 },
                    { index: 1, y: 30, height: 10 },
                ],
            });
            // A row of an exact height is as tall as it is set to
            const exact = paginate(content({ height: { value: 5, rule: "exact" } }), { measurer: MEASURER }).pages[1].body;
            expect(exact[0]).to.deep.equal({
                type: "table",
                index: 1,
                rows: [
                    { index: 0, y: 10, height: 20 },
                    { index: 1, y: 30, height: 5 },
                ],
            });
        });

        it("should stop where a page breaks between rows of a cell merged down them, with its text going on across the break", () => {
            // The page breaks below the first row, as the second is kept whole, or as widow control keeps the cell's lines
            // beside it together. Which rows Word puts the rest of the cell's text in then isn't known
            const content = (changes: Partial<TableRow>): DocumentContent =>
                document([
                    paragraph("a", 5),
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 3)]), [[paragraph("r1", 1)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]], changes),
                    ]),
                ]);
            for (const changes of [{ cantSplit: true }, {}]) {
                expect(numbersOf(content(changes))).to.deep.include({
                    bookmarks: new Map([
                        ["a", "1"],
                        ["r1", "1"],
                    ]),
                    stoppedAt: "a cell merged down table rows whose text goes on across a page break between them",
                });
            }
            // With all of its text in the rows on the page, the rest of its rows go on the next page (U4b)
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

        it("should lay out the text of a cell merged down rows across pages in its last row, and stop at it otherwise across more than two pages, or from a table's header rows", () => {
            const stoppedAt = (rows: readonly TableRow[]): string | undefined =>
                paginate(document([paragraph("a", 5), table(rows)]), { measurer: MEASURER }).stoppedAt;
            // word-stops-tables.docx RW4a: in the last of its rows, which breaks across 3 pages, it goes on page by page
            const across = [
                mergedRow(merged("restart", [endMarked("merged", 12)]), [[paragraph("r1", 1)]]),
                mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
            ];
            expect(pagesOf(document([paragraph("a", 5), table(across)]))).to.deep.equal({
                a: "1",
                merged: "1",
                mergedEnd: "3",
                r1: "1",
                r2: "1",
            });
            // Beside a row before the last that breaks across 3 pages, where 6 lines of it would fit on the second, Word has
            // been seen to break it across one page break only
            const beside = (lines: number): readonly TableRow[] => [
                mergedRow(merged("restart", [endMarked("merged", lines)]), [[endMarked("r1", 12)]]),
                mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
            ];
            expect(stoppedAt(beside(12))).to.equal("a cell merged down table rows whose text goes on across more than two pages");
            expect(pagesOf(document([paragraph("a", 5), table(beside(8))]))).to.deep.equal({
                a: "1",
                merged: "1",
                mergedEnd: "2",
                r1: "1",
                r1End: "3",
                r2: "3",
            });
            // Whether Word repeats the part of it in the header rows above the rest of it isn't known
            expect(
                stoppedAt([
                    mergedRow(merged("restart", [paragraph("merged", 5)]), [[paragraph("head", 1)]], { header: true }),
                    mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                ]),
            ).to.equal("a cell merged down from a table's header rows whose text goes on across pages");
        });

        it("should stop at a line in a table cell taller than a page", () => {
            const tall = paragraph("tall", 1, { lineSpacing: { rule: "exact", height: 100 } });
            expect(paginate(document([table([row([[tall]])])]), { measurer: MEASURER }).stoppedAt).to.equal(
                "a line in a table cell taller than a page",
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

        it("should number the page after a continuous section numbered afresh on from its first number, the page it starts on keeping its own, as Word does", () => {
            /** a, then b and c in a continuous section numbered from 7 in a format: b ends the first page, and c starts the next */
            const restarted = (numberFormat: string): DocumentContent =>
                document(
                    [
                        [paragraph("a", 3), 0],
                        [paragraph("b", 4), 1],
                        [paragraph("c", 1), 1],
                    ],
                    { sections: [SECTION, { ...SECTION, start: "continuous", firstNumber: 7, numberFormat }] },
                );
            // The first page is still the first, which a bookmark in the new section gives in its format, and the next is 8
            // (`word-watertight-pages.docx` PG2a and PG2b)
            expect(pagesOf(restarted("decimal"))).to.deep.equal({ a: "1", b: "1", c: "8" });
            expect(pagesOf(restarted("upperRoman"))).to.deep.equal({ a: "1", b: "I", c: "VIII" });
            const { pages } = paginate(restarted("upperRoman"), { measurer: MEASURER });
            expect(pages.map(({ pageNumber }) => pageNumber)).to.deep.equal(["1", "VIII"]);
        });

        it("should number the page a continuous section starts at the top of from its first number, when none of it fits on the page before, as Word does", () => {
            // a fills the first page, so b starts the next, which is 7 and the next 8 (`word-watertight-sections.docx` SC2a, SC2c)
            const content = document(
                [
                    [paragraph("a", 7), 0],
                    [paragraph("b", 7), 1],
                    [paragraph("c", 1), 1],
                ],
                {
                    sections: [
                        SECTION,
                        { ...SECTION, start: "continuous", firstNumber: 7, titlePage: true, headers: { first: [paragraph("first", 1)] } },
                    ],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "7", c: "8" });
            // It is the section's first page, which has its first page's header
            const { pages } = paginate(content, { measurer: MEASURER });
            expect(pages.map(({ pageNumber, header }) => ({ pageNumber, header }))).to.deep.equal([
                { pageNumber: "1", header: undefined },
                { pageNumber: "7", header: "first" },
                { pageNumber: "8", header: undefined },
            ]);
        });

        it("should number the page after two continuous sections numbered afresh on one page on from the last, as Word does", () => {
            // b numbered from 7 and c from 20 start on the first page, so the second is 21 (`word-watertight-sections.docx` SC2d)
            const content = document(
                [
                    [paragraph("a", 2), 0],
                    [paragraph("b", 2), 1],
                    [paragraph("c", 3), 2],
                    [paragraph("d", 1), 2],
                    [paragraph("e", 1), 3],
                ],
                {
                    sections: [
                        SECTION,
                        { ...SECTION, start: "continuous", firstNumber: 7 },
                        { ...SECTION, start: "continuous", firstNumber: 20 },
                        { ...SECTION, start: "continuous" },
                    ],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "1", d: "21", e: "21" });
        });

        it("should number on through a section numbered afresh that starts in the next column of the page, as Word does", () => {
            // b starts in the second column of the first page, and the next page is the second (`word-watertight-sections.docx` SC1)
            const content = document(
                [
                    [paragraph("a", 2), 0],
                    [paragraph("b", 7), 1],
                    [paragraph("c", 1), 1],
                ],
                {
                    sections: [
                        { ...SECTION, columns: [80, 80] },
                        { ...SECTION, columns: [80, 80], start: "nextColumn", firstNumber: 7 },
                    ],
                },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should leave a blank page before a section on an odd page by the number after a continuous section numbered afresh", () => {
            // The page after the first is 8, which is even, so a section on an odd page starts on the page after it, 9
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [paragraph("b", 1), 1],
                    [paragraph("c", 1), 2],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous", firstNumber: 7 }, { ...SECTION, start: "oddPage" }] },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "9" });
            expect(paginate(content, { measurer: MEASURER }).pages.map(({ pageNumber }) => pageNumber)).to.deep.equal(["1", "8", "9"]);
        });

        it("should take a gutter at the top from the page's height, below the top margin or a header taller than both, as Word does", () => {
            /** The top of each page's first line, and how many lines each page has */
            const linesOnPages = (section: Section): readonly (readonly [number, number])[] =>
                paginate(document([paragraph("a", 12)], { sections: [section] }), { measurer: MEASURER }).pages.map(({ body }) => {
                    const lines = body.flatMap((block) => (block.type === "paragraph" ? block.lines : []));
                    return [lines[0].y, lines.length] as const;
                });
            // Below the margin of 10, 6 lines to a page in the full width (`word-watertight-settings.docx` ST3), with a header
            // that ends above the gutter too (`word-watertight-sections.docx` SC3a)
            const gutter = { ...SECTION, topGutter: 10 };
            expect(linesOnPages(gutter)).to.deep.equal([
                [20, 6],
                [20, 6],
            ]);
            expect(linesOnPages({ ...gutter, headers: { default: [paragraph("h", 1)] } })).to.deep.equal([
                [20, 6],
                [20, 6],
            ]);
            // A header that ends below the gutter pushes the body below it, where it would without the gutter (SC3b)
            expect(linesOnPages({ ...gutter, headers: { default: [paragraph("h", 2)] } })[0]).to.deep.equal([25, 5]);
            // Below a negative top margin, which a header doesn't push the body below, it is below the margin's size
            // (`word-stops-pages.docx` GT1b)
            expect(linesOnPages({ ...gutter, marginTop: -10, headers: { default: [paragraph("h", 4)] } })[0]).to.deep.equal([20, 6]);
        });

        it("should write page numbers in each format as Word does, and stop at those it doesn't write", () => {
            const numbered = (numberFormat: string, firstNumber: number): ReturnType<typeof paginate> =>
                paginate(document([paragraph("a", 1)], { sections: [{ ...SECTION, numberFormat, firstNumber }] }), { measurer: MEASURER });
            expect(Object.fromEntries(numbered("cardinalText", 21).bookmarks)).to.deep.equal({ a: "twenty-one" });
            expect(Object.fromEntries(numbered("hebrew1", 15).bookmarks)).to.deep.equal({ a: "טו" });
            // Word writes an error for page 0 in Hebrew numerals, and for 781 in letters
            expect(numbered("hebrew1", 0).stoppedAt).to.equal("a page number its format isn't written for yet");
            expect(numbered("lowerLetter", 781).stoppedAt).to.equal("a page number its format isn't written for yet");
        });

        describe("chapter numbers", () => {
            const heading = (name: string, level: number, chapter?: string): ParagraphBlock => ({
                ...paragraph(name, 1),
                heading: { level, ...(chapter === undefined ? {} : { chapter }) },
            });
            const chapters = { level: 1, separator: "." };
            const pagesWith = (blocks: readonly Block[], section: Partial<Section> = { chapters }): Record<string, string> =>
                pagesOf(document(blocks, { sections: [{ ...SECTION, ...section }] }));

            it("should put the number of the last numbered heading of the section's level before each page number", () => {
                expect(
                    pagesWith([
                        paragraph("before", 1),
                        heading("one", 1, "1"),
                        paragraph("a", 1),
                        heading("part", 2, "1.1"),
                        // Word passes over headings that aren't numbered, and keeps the chapter number
                        heading("unnumbered", 1),
                        paragraph("b", 1),
                        heading("two", 1, "2"),
                        paragraph("c", 1),
                    ]),
                    // Before the first heading, the page number is written alone. As in Word, the chapter is the one where
                    // the bookmark is, so bookmarks on the same page have different chapter numbers. c is on page 2
                ).to.deep.equal({ before: "1", one: "1.1", a: "1.1", part: "1.1", unnumbered: "1.1", b: "1.1", two: "2.1", c: "2.2" });
            });

            it("should write chapter numbers from headings of other levels, and none in sections without them", () => {
                expect(
                    pagesWith([heading("one", 1, "1"), heading("part", 2, "1.1"), paragraph("a", 1)], {
                        chapters: { level: 2, separator: "-" },
                    }),
                ).to.deep.equal({
                    one: "1",
                    part: "1.1-1",
                    a: "1.1-1",
                });
                expect(pagesWith([heading("one", 1, "1"), paragraph("a", 1)], {})).to.deep.equal({ one: "1", a: "1" });
            });

            it("should stop at a chapter number when a heading of its level is in a table", () => {
                const content = document([table([row([[heading("inTable", 1, "1")]])]), paragraph("a", 1)], {
                    sections: [{ ...SECTION, chapters }],
                });
                expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("a chapter heading in a table");
                // Not when the heading is of another level
                expect(pagesWith([table([row([[heading("inTable", 2, "1")]])]), paragraph("a", 1)])).to.deep.equal({
                    inTable: "1",
                    a: "1",
                });
            });

            it("should stop at a chapter number when a heading of its level is in a text frame", () => {
                const framed: LayoutItem = {
                    type: "drawing",
                    drawing: {
                        wrap: "square",
                        side: "bothSides",
                        width: 20,
                        height: 10,
                        effects: { top: 0, bottom: 0, left: 0, right: 0 },
                        distances: { top: 0, bottom: 0, left: 0, right: 0 },
                        horizontal: { from: "margin", offset: 0 },
                        vertical: { from: "paragraph", offset: 0 },
                        mayOverlap: false,
                        frame: { blocks: [heading("inFrame", 1, "1")], heightRule: "exact", fitsWidth: false },
                    },
                };
                const content = document([withItems(paragraph("a", 1), [framed])], { sections: [{ ...SECTION, chapters }] });
                expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("a chapter heading in a text frame");
            });
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
            expect(numbersOf(content)).to.deep.equal({
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

            it("should let the room multiple spacing leaves below the last line of a column go below the columns, as Word does", () => {
                // word-stops-text.ts PB7b: the columns are as short as their lines without the room below the last
                const spaced = lines("a", 5).map((block) => ({
                    ...block,
                    format: { lineSpacing: { rule: "multiple" as const, multiple: 1.5 } },
                }));
                const laid = paginate(balanced(spaced), { measurer: MEASURER });
                expect(laid.stoppedAt).to.equal(undefined);
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
                // The rows of a merged cell fit in the first column, but in the columns as short as they fit in, the second
                // goes in the second column, and the cell's text would go on across the break between them
                const merge = balanced([
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 4)]), [[paragraph("r1", 1)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]], { cantSplit: true }),
                    ]),
                ]);
                expect(paginate(merge, { measurer: MEASURER }).stoppedAt).to.equal(
                    "a cell merged down table rows whose text goes on across a page break between them",
                );
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
            expect(numbersOf(content)).to.deep.equal({
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

        it("should leave a section that started in the next column as it is before a continuous section break, as Word does", () => {
            const three: Section = { ...SECTION, columns: [80, 80, 80] };
            const content = (first: number, last: number): DocumentContent =>
                document(
                    [
                        [paragraph("a", first), 0],
                        [paragraph("b", 4), 1],
                        [paragraph("c", 1), 2],
                        [paragraph("d", last), 2],
                    ],
                    { sections: [three, { ...three, start: "nextColumn" }, { ...SECTION, start: "continuous" }] },
                );
            // b's 4 lines stay in the second of 3 columns, rather than going 2 and 2 into the third, and c and d go below
            // them, so d's 3 lines don't fit (`word-watertight-stops.docx` SP11)
            expect(pagesOf(content(1, 3))).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
            // Below the longest column, which is the first when it goes further down, so d's 2 lines don't fit either
            expect(pagesOf(content(6, 2))).to.deep.equal({ a: "1", b: "1", c: "1", d: "2" });
        });

        describe("a section that starts in the next column of columns of other widths", () => {
            // Pages 200 points wide, with 2 columns of 80 points, 20 apart, and 2 of 40 and 120
            const WIDE: Section = { ...SECTION, pageWidth: 200 };
            const EQUAL: Section = { ...WIDE, columns: [80, 80] };
            const NARROW_FIRST: Section = { ...WIDE, columns: [40, 120], start: "nextColumn" };
            /** A paragraph of words of 3 letters: 2 to a line in a column of 80 points, and 3 in one of 120 */
            const words = (name: string, count: number): ParagraphBlock => ({
                ...paragraph(name, 0),
                items: [
                    { type: "marker", name },
                    { type: "text", text: Array.from({ length: count }, () => "abc").join(" "), font: {} },
                ],
            });
            /** Each line of the body of a page, as its text and where it is: [text, x, y, width] */
            const linesOn = (content: DocumentContent, page = 0): readonly (readonly [string, number, number, number])[] =>
                paginate(content, { measurer: MEASURER }).pages[page].body.flatMap((block) =>
                    block.type === "paragraph" ? block.lines.map(({ text, x, y, width }) => [text, x, y, width] as const) : [],
                );

            it("should lay it out in the page's next column, as wide as that is, as Word does", () => {
                const content = document(
                    [
                        [paragraph("a", 1), 0],
                        [words("b", 6), 1],
                    ],
                    { sections: [EQUAL, NARROW_FIRST] },
                );
                // At 110, 80 wide, with 2 words to a line, where its own second column is at 70, 120 wide
                // (`word-watertight-stops.docx` SP10)
                expect(linesOn(content)).to.deep.equal([
                    ["abcdefgh", 10, 10, 80],
                    ["abc abc ", 110, 10, 80],
                    ["abc abc ", 110, 20, 80],
                    ["abc abc", 110, 30, 80],
                ]);
                // Columns as wide, but further apart, which Word starts it in the next column of (`word-next-column.docx` N4)
                const apart = document(
                    [
                        [paragraph("a", 1), 0],
                        [words("b", 2), 1],
                    ],
                    { sections: [EQUAL, { ...EQUAL, marginRight: 0, start: "nextColumn" }] },
                );
                expect(linesOn(apart)[1]).to.deep.equal(["abc abc", 110, 10, 80]);
            });

            it("should lay out a section after it in the next column in the page's columns too, and one below them in its own", () => {
                const three: Section = { ...WIDE, columns: [40, 40, 40] };
                const content = document(
                    [
                        [words("a", 1), 0],
                        [words("b", 1), 1],
                        [words("c", 1), 2],
                        [words("d", 2), 3],
                    ],
                    {
                        sections: [
                            three,
                            { ...three, columns: [20, 60, 60], start: "nextColumn" },
                            { ...three, columns: [20, 60, 60], start: "nextColumn" },
                            { ...EQUAL, start: "continuous" },
                        ],
                    },
                );
                // b and c in the second and third of the first section's columns, 40 wide and 30 apart, where their own are
                // 60 wide, and d below them in a column of its own, 80 wide
                expect(linesOn(content).map(([text, x, , width]) => [text.trim(), x, width])).to.deep.equal([
                    ["abc", 10, 40],
                    ["abc", 80, 40],
                    ["abc", 150, 40],
                    ["abc abc", 10, 80],
                ]);
            });

            it("should lay it out in its own columns on the next page, as Word does", () => {
                // 18 words on 9 lines of 2: 7 in the page's second column, and the last 4 words on 4 lines of its own first
                // column on the next page, 40 wide (`word-column-stops.docx` CS1)
                const blocks: readonly (readonly [Block, number])[] = [
                    [paragraph("a", 1), 0],
                    [words("b", 18), 1],
                ];
                const content = document(blocks, { sections: [EQUAL, NARROW_FIRST] });
                expect(linesOn(content).map(([, x, , width]) => [x, width])).to.deep.equal([
                    [10, 80],
                    ...Array.from({ length: 7 }, () => [110, 80]),
                ]);
                expect(linesOn(content, 1).map(([, x, y, width]) => [x, y, width])).to.deep.equal([
                    [10, 10, 40],
                    [10, 20, 40],
                    [10, 30, 40],
                    [10, 40, 40],
                ]);
                // Its columns on the next page evened out before a continuous section break, which lays it out again from
                // where it started on the page before, in the page's columns there
                const evened = document([...blocks, [paragraph("c", 1), 2]], {
                    sections: [EQUAL, NARROW_FIRST, { ...WIDE, start: "continuous" }],
                });
                expect(linesOn(evened).map(([, x, , width]) => [x, width])).to.deep.equal([
                    [10, 80],
                    ...Array.from({ length: 7 }, () => [110, 80]),
                ]);
            });

            it("should lay out its footnotes in its own columns, as Word does", () => {
                // Its text in the page's second column, at 110, and its footnote's 8 words in its own columns, at 10 and 70,
                // 40 and 120 wide, evened out 2 lines and 2 (`word-column-stops.docx` CS2)
                const content = document(
                    [
                        [paragraph("a", 1), 0],
                        [withItems(words("b", 1), [{ type: "marker", name: "note" }]), 1],
                    ],
                    { footnotes: new Map([["note", [words("text", 8)]]]), sections: [EQUAL, NARROW_FIRST] },
                );
                const { pages } = paginate(content, { measurer: MEASURER });
                expect(linesOn(content).map(([, x]) => x)).to.deep.equal([10, 110]);
                expect(
                    pages[0].footnotes.flatMap(({ content: blocks }) =>
                        blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x, width }) => [x, width]) : [])),
                    ),
                ).to.deep.equal([
                    [10, 40],
                    [10, 40],
                    [70, 120],
                    [70, 120],
                ]);
            });
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

            it("should move the paragraphs kept with it to a new page, and it on to the next, as Word does", () => {
                const below = (blocks: readonly Block[]): Record<string, string> =>
                    pagesOf(document([...blocks, kept], { sections: [COLUMNS] }));
                const heading = (name: string): ParagraphBlock => paragraph(name, 1, { keepNext: true });
                // A heading kept with it below a line goes to a new page with it, where it is alone, as it isn't at the top
                // of that page (`word-watertight-stops.docx` SP13)
                expect(below([paragraph("a", 1), heading("heading")])).to.deep.equal({ a: "1", heading: "2", kept: "3", eighth: "4" });
                // Two headings go together, and one at the top of the second column goes too
                expect(below([paragraph("a", 1), heading("one"), heading("two")])).to.deep.equal({
                    a: "1",
                    one: "2",
                    two: "2",
                    kept: "3",
                    eighth: "4",
                });
                expect(below([paragraph("a", 7), heading("heading")])).to.deep.equal({ a: "1", heading: "2", kept: "3", eighth: "4" });
                // One at the top of a page stays there
                expect(below([heading("heading")])).to.deep.equal({ heading: "1", kept: "2", eighth: "3" });
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

            it("should lay a paragraph kept together that is taller than each column down the first column of each page, as Word does", () => {
                // 30 lines in the narrow column, and 10 in the wide one: 7 in the first column of each page, at its width, from
                // a new page below a line (`word-watertight-stops.docx` SP12), where 21 words would fit in the wide column
                const kept = words("kept", 30, { 7: "w8", 28: "w29" }, { keepLines: true });
                expect(pagesOf(document([kept], { sections: [NARROW_FIRST] }))).to.deep.equal({ kept: "1", w8: "2", w29: "5" });
                expect(pagesOf(document([words("a", 1), kept], { sections: [NARROW_FIRST] }))).to.deep.equal({
                    a: "1",
                    kept: "2",
                    w8: "3",
                    w29: "6",
                });
            });

            it("should move a paragraph kept together that is taller than some of the columns but not others to the first it fits in, as Word does", () => {
                // 9 lines in the narrow column, and 3 in the wide one
                const kept = words("kept", 9, {}, { keepLines: true });
                /** Where the lines of the first page start across it, on a page 200 points wide, with its columns 20 apart */
                const lefts = (blocks: readonly Block[], columns: readonly number[]): readonly number[] =>
                    paginate(document(blocks, { sections: [{ ...SECTION, pageWidth: 200, columns }] }), {
                        measurer: MEASURER,
                    }).pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : []));
                // From the top of the narrow first column, and below a line in it, to the wide second, at 70
                // (`word-column-stops.docx` CS3 and CS4)
                expect(lefts([kept], [40, 120])).to.deep.equal([70, 70, 70]);
                expect(lefts([words("a", 1), kept], [40, 120])).to.deep.equal([10, 70, 70, 70]);
                // In a wide first column below 5 lines, where it doesn't fit, past the narrow second column to a new page, and
                // below 3, where it fits, where it is (CS5 and CS6)
                expect(pagesOf(document([...lines("a", 5), kept], { sections: [WIDE_FIRST] }))).to.include({ a5: "1", kept: "2" });
                expect(pagesOf(document([...lines("a", 3), kept], { sections: [WIDE_FIRST] }))).to.include({ a3: "1", kept: "1" });
            });

            it("should move a paragraph kept together that is taller than some of 3 columns, and one kept with it, as in 2, as Word does", () => {
                // 9 lines in the narrow column, and 3 in the wide ones
                const kept = words("kept", 9, {}, { keepLines: true });
                /** Where the lines of the first page start across it, on a page so wide, with its columns 20 apart */
                const lefts = (blocks: readonly Block[], pageWidth: number, columns: readonly number[]): readonly number[] =>
                    paginate(document(blocks, { sections: [{ ...SECTION, pageWidth, columns }] }), {
                        measurer: MEASURER,
                    }).pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : []));
                // From the narrow first column of 3 to the second (`word-stops-pages.docx` CO1a, CO1b)
                expect(lefts([kept], 340, [40, 120, 120])).to.deep.equal([70, 70, 70]);
                // And a line kept with it below a line with it, to the top of the wide column (CO2a, CO2b)
                const heading = words("heading", 1, {}, { keepNext: true });
                expect(lefts([words("a", 1), heading, kept], 200, [40, 120])).to.deep.equal([10, 70, 70, 70, 70]);
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

            it("should break a table across columns of different widths, keeping the widths it is sized to in each column", () => {
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
                // Sized in the wide column, each row takes a line there and in the narrow one, which it goes past the edge of,
                // as in Word (`word-watertight-stops.docx` SP16), so the 3 rows in the narrow column leave room for b's 4 lines,
                // where 2 lines a row would leave room for 1
                const after = words("b", 4, { 3: "w4" });
                expect(pagesOf(document([fitted, after], { sections: [WIDE_FIRST] }))).to.include({ row10: "1", b: "1", w4: "1" });
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

        it("should number footnotes afresh on each page from where the pass before placed their references, as Word does", () => {
            // Two footnotes on the first page and one on the second, numbered i and ii, and i (`word-stops-notes.docx` NT14a)
            const short = (name: string, note?: string, format: ParagraphFormat = {}): ParagraphBlock => ({
                ...paragraph(name, 1, format),
                items: [
                    { type: "marker", name },
                    { type: "text", text: "word ", font: {} },
                    ...(note === undefined
                        ? []
                        : [{ type: "marker", name: note } as const, { type: "noteNumber", note, font: {} } as const]),
                ],
            });
            const onPage = (format: string): DocumentContent => ({
                ...withNotes([short("a", "footnote 1"), short("b", "footnote 2"), short("c", "footnote 3", { pageBreakBefore: true })], {
                    "footnote 1": [paragraph("one", 1)],
                    "footnote 2": [paragraph("two", 1)],
                    "footnote 3": [paragraph("three", 1)],
                }),
                footnotesOnEachPage: new Map(["footnote 1", "footnote 2", "footnote 3"].map((note) => [note, { start: 1, format }])),
            });
            const content = onPage("lowerRoman");
            // The first pass doesn't know their pages, and the next numbers them from where it placed them
            const first = paginate(content, { measurer: MEASURER });
            expect(first.pages.map(({ footnotes }) => footnotes.map(({ noteNumber }) => noteNumber))).to.deep.equal([["", ""], [""]]);
            const second = paginate(content, { measurer: MEASURER, places: first.places });
            expect(second.pages.map(({ footnotes }) => footnotes.map(({ noteNumber }) => noteNumber))).to.deep.equal([["i", "ii"], ["i"]]);
            expect(
                second.pages.map(({ body }) => body.map((block) => (block.type === "paragraph" ? block.lines[0].text : ""))),
            ).to.deep.equal([["word i", "word ii"], ["word i"]]);
            // Their markers are placed, but they aren't bookmarks
            expect([second.places.has("footnote 1"), second.bookmarks.has("footnote 1")]).to.deep.equal([true, false]);
            // In a format not yet written, the layout stops
            const unwritten = onPage("bogus");
            expect(paginate(unwritten, { measurer: MEASURER, places: first.places }).stoppedAt).to.equal(
                "notes numbered in a format not yet written",
            );
            // Footnotes of another section on the page, which stops the layout where it is read, aren't counted
            const shared: DocumentContent = {
                ...content,
                blocks: content.blocks.map((entry, index) => (index === 1 ? { ...entry, section: 1 } : entry)).slice(0, 2),
                sections: [SECTION, { ...SECTION, start: "continuous" }],
            };
            const sharedFirst = paginate(shared, { measurer: MEASURER });
            const sharedSecond = paginate(shared, { measurer: MEASURER, places: sharedFirst.places });
            expect(sharedSecond.pages.map(({ footnotes }) => footnotes.map(({ noteNumber }) => noteNumber))).to.deep.equal([["i", "i"]]);
            // Guessing, it is in figures
            const guessed = paginate(unwritten, { measurer: MEASURER, places: first.places, guess: true });
            expect(guessed.pages.map(({ footnotes }) => footnotes.map(({ noteNumber }) => noteNumber))).to.deep.equal([["1", "2"], ["1"]]);
        });

        it("should put the footnotes of a section that says so just below the text of their page, as Word does", () => {
            // The separator and the footnote below the second line, rather than at the bottom of the page
            // (`word-stops-notes.docx` NT14c)
            const content = (format: ParagraphFormat = {}, noteLines = 1): DocumentContent => ({
                ...withNotes([paragraph("a", 1), noted(paragraph("b", 1, format), "footnote 1")], {
                    "footnote 1": [paragraph("note", noteLines)],
                }),
                sections: [{ ...SECTION, footnotesBeneathText: true }],
            });
            const below = paginate(content(), { measurer: MEASURER });
            const note = below.pages[0].footnotes[0].content[0];
            expect(note.type === "paragraph" ? note.lines.map(({ y }) => y) : []).to.deep.equal([40]);
            // Below the space after the page's last paragraph, and continued on the next page, they haven't been seen
            expect(paginate(content({ spaceAfter: 5 }), { measurer: MEASURER }).stoppedAt).to.equal(
                "footnotes below the text after space below its last paragraph",
            );
            expect(paginate(content({}, 8), { measurer: MEASURER }).stoppedAt).to.equal(
                "a footnote below the text that goes on across pages",
            );
            // And so does the space around the empty paragraph that ends a section
            const end: ParagraphBlock = { ...paragraph("end", 1), items: [], sectionBreak: true };
            const ended = withNotes(
                [
                    [paragraph("a", 1), 0],
                    [noted(paragraph("b", 1, { spaceAfter: 5 }), "footnote 1"), 0],
                    [end, 0],
                    [paragraph("c", 1), 1],
                ],
                { "footnote 1": [paragraph("note", 1)] },
            );
            expect(
                paginate({ ...ended, sections: [{ ...SECTION, footnotesBeneathText: true }, SECTION] }, { measurer: MEASURER }).stoppedAt,
            ).to.equal("footnotes below the text after space below its last paragraph");
            // A full page's are at its bottom
            const full = paginate(
                {
                    ...content(),
                    blocks: [
                        { block: paragraph("a", 4), section: 0 },
                        { block: noted(paragraph("b", 1), "footnote 1"), section: 0 },
                    ],
                },
                { measurer: MEASURER },
            );
            const last = full.pages[0].footnotes[0].content[0];
            expect(last.type === "paragraph" ? last.lines.map(({ y }) => y) : []).to.deep.equal([80 - 10]);
        });

        it("should leave room at the bottom of a page for the footnotes of its lines, below their separator", () => {
            const content = withNotes([paragraph("a", 4), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], {
                "footnote 1": [paragraph("note", 1)],
            });
            // The separator and the footnote take 2 lines, so c goes on the next page
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should stop at a line whose multiple spacing would go below its page's text into the footnotes", () => {
            // c ends at 55, 5 past the footnotes' separator, which only the spacing below its text does
            const spaced: ParagraphFormat = { lineSpacing: { rule: "multiple", multiple: 1.5 } };
            const content = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1, spaced)], {
                "footnote 1": [paragraph("note", 1)],
            });
            expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal(
                "a line whose room below its text goes below it into the footnotes",
            );
            // So does what is kept with the next: c and d end at 55
            const kept = withNotes(
                [
                    paragraph("a", 1, spaced),
                    noted(paragraph("b", 1), "footnote 1"),
                    paragraph("c", 1, { ...spaced, keepNext: true }),
                    paragraph("d", 1, spaced),
                ],
                { "footnote 1": [paragraph("note", 1)] },
            );
            expect(paginate(kept, { measurer: MEASURER }).stoppedAt).to.equal(
                "a line whose room below its text goes below it into the footnotes",
            );
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
            expect(numbersOf(content)).to.deep.equal({
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
        });

        it("should continue the footnote of a line kept with a longer paragraph below the first lines it is kept with, as Word does", () => {
            // The heading and next's first 2 lines, which widow control keeps together, then the separator and 3 of the
            // footnote's 6 lines, though 3 of next's lines would fit with 2 of them (`word-watertight-stops.docx` SP4). On
            // the next page, next's third and fourth lines fit above the rest of the footnote
            const heading = noted(paragraph("heading", 1, { keepNext: true }), "footnote 1");
            const next = markedLines("next", 6, { 3: ["third"], 5: ["fifth"] });
            const content = withNotes([heading, next], { "footnote 1": [paragraph("note", 6)] });
            expect(pagesOf(content)).to.deep.equal({ heading: "1", next: "1", third: "2", fifth: "3" });
            // Kept with a table, it goes below the table's first row, and the second goes on the next page, as Word puts
            // one below its first row (`word-watertight-notes.docx` FN13)
            const tabled = withNotes([heading, table([row([[paragraph("cell", 1)]]), row([[paragraph("second", 1)]])])], {
                "footnote 1": [paragraph("note", 6)],
            });
            expect(pagesOf(tabled)).to.deep.equal({ heading: "1", cell: "1", second: "2" });
        });

        it("should put the rest of a footnote on a page of its own before a paragraph with a page break before it, as Word does", () => {
            // Kept with the next or not, the paragraph keeps as much of the footnote below it as fits, 4 of its 6 lines as
            // widow control leaves 2, and the rest goes on a page of its own before the next paragraph's
            // (`word-stops-notes.docx` NT10b)
            for (const keepNext of [true, false]) {
                const heading = noted(paragraph("heading", 1, { keepNext }), "footnote 1");
                const broken = withNotes([heading, paragraph("next", 1, { pageBreakBefore: true })], {
                    "footnote 1": [paragraph("note", 6)],
                });
                const { bookmarks, pages } = paginate(broken, { measurer: MEASURER });
                expect(Object.fromEntries(inBody(broken, bookmarks))).to.deep.equal({ heading: "1", next: "3" });
                expect(
                    pages.map(({ body, footnotes }) => [
                        body.length,
                        footnotes.flatMap(({ content }) => content.flatMap((block) => (block.type === "paragraph" ? block.lines : [])))
                            .length,
                    ]),
                ).to.deep.equal([
                    [1, 4],
                    [0, 2],
                    [1, 0],
                ]);
            }
            // In columns, the next paragraph goes on the next page, above the rest, as before
            const columns = withNotes([noted(paragraph("heading", 1), "footnote 1"), paragraph("next", 1, { pageBreakBefore: true })], {
                "footnote 1": [paragraph("note", 6)],
            });
            const inColumns = paginate({ ...columns, sections: [{ ...SECTION, columns: [80, 80] }] }, { measurer: MEASURER });
            expect(Object.fromEntries(inBody(columns, inColumns.bookmarks))).to.deep.equal({ heading: "1", next: "2" });
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
            expect(numbersOf(long)).to.deep.equal({
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
                expect(numbersOf(tabled)).to.deep.equal({
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
        });

        it("should put the rest of a footnote on pages of their own before a section on a new page, as Word does", () => {
            // 2 of its 12 lines below b, 6 on the next page and 4 on the one after, which are the first section's, and c on
            // the page after them, the first of its section (`word-watertight-stops.docx` SP2). Word puts a rest shorter than
            // a page on a page of its own too (`word-watertight-notes.docx` FN4)
            const content = (lines: number, second: Section = SECTION): DocumentContent => ({
                ...withNotes(
                    [
                        [paragraph("a", 3), 0],
                        [noted(paragraph("b", 1), "footnote 1"), 0],
                        [paragraph("c", 1), 1],
                    ],
                    { "footnote 1": [paragraph("note", lines)] },
                ),
                sections: [SECTION, second],
            });
            expect(numbersOf(content(12))).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                    ["c", "4"],
                ]),
                pageCount: 4,
                sectionPageCounts: [3, 1],
            });
            // And so does a rest shorter than a page, which Word's last page of the rest showed, as it had room for text
            expect(numbersOf(content(5))).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                    ["c", "3"],
                ]),
                pageCount: 3,
                sectionPageCounts: [2, 1],
            });
            // Before a section on an odd page, after them
            expect(pagesOf(content(5, { ...SECTION, start: "oddPage" }))).to.deep.equal({ a: "1", b: "1", c: "3" });
            // Before a continuous section in columns, after it too
            expect(pagesOf(content(5, { ...SECTION, start: "continuous", columns: [35, 35] }))).to.deep.equal({ a: "1", b: "1", c: "3" });
            // And before a continuous section, which starts on a new page after them, as its own (FN5). Word numbered each of
            // the pages with the section's first number, and each section's number of pages 1 (`word-stops-notes.docx`
            // NT2b). The next section's is its own pages, as in FN5, but the first section's isn't followed, so it isn't known
            expect(numbersOf(content(12, { ...SECTION, start: "continuous" }))).to.deep.equal({
                bookmarks: new Map([
                    ["a", "1"],
                    ["b", "1"],
                    ["c", "4"],
                ]),
                pageCount: 4,
                sectionPageCounts: [undefined, 1],
            });
            const afresh = paginate(content(12, { ...SECTION, start: "continuous", firstNumber: 1 }), { measurer: MEASURER });
            expect(afresh.pages.map(({ pageNumber }) => pageNumber)).to.deep.equal(["1", "1", "1", "1"]);
            expect(afresh.sectionPageCounts).to.deep.equal([undefined, 1]);
            // Where the sections' headers or footers differ, how much of the footnote Word puts on the pages isn't known
            const footer = { default: [paragraph("footer", 1)] };
            expect(paginate(content(12, { ...SECTION, start: "continuous", footers: footer }), { measurer: MEASURER }).stoppedAt).to.equal(
                "a footnote continued across a continuous section break onto a page of its own",
            );
            // Guessing, the guess is on the first of the pages of the footnote, rather than the page of its reference
            const guessedFooters = paginate(content(12, { ...SECTION, start: "continuous", footers: footer }), {
                measurer: MEASURER,
                guess: true,
            });
            expect(guessedFooters.pages.map(({ guesses = [] }) => guesses)).to.deep.equal([
                [],
                ["a footnote continued across a continuous section break onto a page of its own"],
                [],
                [],
            ]);
            const same = {
                ...withNotes(
                    [
                        [paragraph("a", 3), 0],
                        [noted(paragraph("b", 1), "footnote 1"), 0],
                        [paragraph("c", 1), 1],
                    ],
                    { "footnote 1": [paragraph("note", 12)] },
                ),
            };
            const sameFooters = paginate(
                {
                    ...same,
                    sections: [
                        { ...SECTION, footers: { default: [paragraph("footer", 1)] } },
                        { ...SECTION, start: "continuous", footers: { default: [paragraph("footer", 1)] } },
                    ],
                },
                { measurer: MEASURER },
            );
            expect(sameFooters.stoppedAt).to.equal(undefined);
        });

        it("should move a reference to the next page with its footnote when the paragraph it starts with is kept together or with the next and doesn't fit, as Word does", () => {
            const reference = (notes: Record<string, readonly Block[]>): DocumentContent =>
                withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], notes);
            // 3 of its 5 lines kept together fit below b, and none go there (`word-watertight-stops.docx` SP3a)
            expect(pagesOf(reference({ "footnote 1": [paragraph("note", 5, { keepLines: true })] }))).to.deep.equal({
                a: "1",
                b: "2",
                c: "3",
            });
            // Its first paragraph of 2 lines fits, but not with the 2 lines of the next that it is kept with (SP3b)
            const keptWithNext = { "footnote 1": [paragraph("one", 2, { keepNext: true }), paragraph("two", 4)] };
            expect(pagesOf(reference(keptWithNext))).to.include({ a: "1", b: "2" });
            // With room for them, its reference stays, and it breaks after them
            const roomy = withNotes([paragraph("a", 1), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], keptWithNext);
            expect(pagesOf(roomy)).to.deep.equal({ a: "1", b: "1", c: "2" });
        });

        it("should break a footnote before a table row widow control keeps whole and after a table's header rows, without repeating them, as Word does", () => {
            const stoppedAt = (notes: Record<string, readonly Block[]>, above = 2): string | undefined =>
                paginate(withNotes([paragraph("a", above), noted(paragraph("b", 1), "footnote 1")], notes), { measurer: MEASURER })
                    .stoppedAt;
            // A row of 3 lines doesn't fit below the footnote's first line, and goes on the next page (SP3c)
            const threeLines = withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)], {
                "footnote 1": [paragraph("one", 1), table([row([[paragraph("cell", 3)]])])],
            });
            const { bookmarks, pages } = paginate(threeLines, { measurer: MEASURER });
            expect(Object.fromEntries(inBody(threeLines, bookmarks))).to.deep.equal({ a: "1", b: "1", c: "2" });
            expect(pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => content.map(({ type }) => type)))).to.deep.equal([
                ["paragraph"],
                ["table"],
            ]);
            // So does one kept together, or beside a cell of a line
            for (const cells of [[[paragraph("cell", 4, { keepLines: true })]], [[paragraph("cell", 3)], [paragraph("other", 1)], []]]) {
                expect(stoppedAt({ "footnote 1": [paragraph("one", 1), table([row(cells)])] })).to.equal(undefined);
            }
            // Rows 1 and 2 go below the header row, and the rest of the table on the next page without it (SP3d)
            const headed = table([
                row([[paragraph("head", 1)]], { header: true }),
                ...[1, 2, 3].map((at) => row([[paragraph(`row ${at}`, 1)]])),
            ]);
            const continued = paginate(withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [headed] }), {
                measurer: MEASURER,
            });
            expect(continued.stoppedAt).to.equal(undefined);
            expect(
                continued.pages.map(({ footnotes }) =>
                    footnotes.flatMap(({ content }) =>
                        content.flatMap((block) => (block.type === "table" ? block.rows.map(({ index }) => index) : [])),
                    ),
                ),
            ).to.deep.equal([[0, 1, 2], [3]]);
            // Nor leaves its header row alone at the bottom of a page: the table goes on the next page whole (FN12)
            const alone = paginate(
                withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [paragraph("one", 1), headed] }),
                { measurer: MEASURER },
            );
            expect(alone.pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => content.map(({ type }) => type)))).to.deep.equal([
                ["paragraph"],
                ["table"],
            ]);
            // And a table it starts with goes with its reference, which moves to the next page when its header row and first
            // row don't fit
            expect(stoppedAt({ "footnote 1": [headed] }, 4)).to.equal(undefined);
            expect(
                pagesOf(withNotes([paragraph("a", 4), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [headed] })),
            ).to.deep.equal({
                a: "1",
                b: "2",
            });
        });

        it("should break a footnote before a paragraph kept together, and before those kept with the next with what follows them, as Word does", () => {
            /** The indexes of the footnote's paragraphs and tables on each page */
            const notePieces = (notes: readonly Block[], above = 2): readonly (readonly number[])[] =>
                paginate(withNotes([paragraph("a", above), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": notes }), {
                    measurer: MEASURER,
                }).pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => content.map(({ index }) => index)));
            // 2 of its second paragraph's 4 lines kept together fit below its first, and all 4 go on the next page
            // (`word-watertight-notes.docx` FN9)
            expect(notePieces([paragraph("one", 1), paragraph("two", 4, { keepLines: true }), paragraph("three", 1)])).to.deep.equal([
                [0],
                [1, 2],
            ]);
            // Its second paragraph fits, and is kept with the next, none of which fits, so both go on the next page (FN10)
            expect(notePieces([paragraph("one", 1), paragraph("two", 1, { keepNext: true }), paragraph("three", 4)])).to.deep.equal([
                [0],
                [1, 2],
            ]);
            // A paragraph kept together none of which fits goes on the next page, as it would without it
            const later = withNotes([paragraph("a", 3), noted(paragraph("b", 1), "footnote 1"), paragraph("c", 2), paragraph("d", 1)], {
                "footnote 1": [paragraph("one", 1), paragraph("two", 4, { keepLines: true })],
            });
            expect(pagesOf(later)).to.deep.equal({ a: "1", b: "1", c: "2", d: "3" });
            // Where those kept with the next start the part on a page, which would leave none of it, it breaks as without them,
            // as the text does at the top of a page
            const chain = [paragraph("one", 2), paragraph("two", 5, { keepLines: true, keepNext: true }), paragraph("three", 4)];
            const broken = paginate(withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": chain }), { measurer: MEASURER });
            expect(broken.stoppedAt).to.equal(undefined);
            expect(
                broken.pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => content.map(({ index }) => index))),
            ).to.deep.equal([[0], [1], [2]]);
        });

        it("should break a table row in a footnote between its cells' lines, as Word breaks a row of the text", () => {
            /** The rows of the footnote's table on each page, with their heights */
            const noteRows = (notes: readonly Block[], above = 2): readonly (readonly (readonly [number, number])[])[] =>
                paginate(withNotes([paragraph("a", above), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": notes }), {
                    measurer: MEASURER,
                }).pages.map(({ footnotes }) =>
                    footnotes.flatMap(({ content }) =>
                        content.flatMap((block) =>
                            block.type === "table" ? block.rows.map(({ index, height }) => [index, height] as const) : [],
                        ),
                    ),
                );
            // A row of 6 lines in room for 4 goes 3 and 3 (`word-watertight-notes.docx` FN11): here a line of the footnote,
            // then 2 of its row's 4 lines in the 3 the separator leaves, as widow control keeps 2 for the next page, with the
            // other cell's line, and the rest on the next page above the next row
            expect(
                noteRows(
                    [paragraph("one", 1), table([row([[paragraph("cell", 4)], [paragraph("side", 1)]]), row([[paragraph("next", 1)]])])],
                    1,
                ),
            ).to.deep.equal([
                [[0, 20]],
                [
                    [0, 20],
                    [1, 10],
                ],
            ]);
            // As in the text, a cell can have none of its lines on the page, as widow control keeps its 3 together, and the
            // row goes on the next page whole where none of them would
            const held = table([row([[paragraph("cell", 4)], [paragraph("side", 3)]])]);
            expect(noteRows([paragraph("one", 2), held], 1)).to.deep.equal([[[0, 20]], [[0, 30]]]);
            expect(noteRows([paragraph("one", 3), held], 1)).to.deep.equal([[], [[0, 40]]]);
        });

        it("should stop where a table row in a footnote would break across pages, where Word's breaking of it isn't known", () => {
            const stoppedAt = (notes: Record<string, readonly Block[]>, above = 2): string | undefined =>
                paginate(withNotes([paragraph("a", above), noted(paragraph("b", 1), "footnote 1")], notes), { measurer: MEASURER })
                    .stoppedAt;
            const unknown =
                "a table row in a footnote across pages with cells merged down rows, a table in a cell, text running up or down or a height";
            const nested = table([row([[paragraph("one", 1)]]), row([[table([row([[paragraph("cell", 3)]])])]])]);
            expect(stoppedAt({ "footnote 1": [nested] })).to.equal(unknown);
            expect(
                stoppedAt({ "footnote 1": [table([row([[paragraph("cell", 4)]], { height: { value: 5, rule: "atLeast" } })])] }),
            ).to.equal(unknown);
            // A footnote that starts with a row that can break, none of which fits below its reference
            expect(stoppedAt({ "footnote 1": [table([row([[paragraph("cell", 4)]])])] }, 5)).to.equal(
                "a footnote that starts with a table row that breaks across pages, none of which fits below its reference",
            );
            // The rest of a row that would break again on the page after
            expect(stoppedAt({ "footnote 1": [paragraph("one", 1), table([row([[paragraph("cell", 20)]])])] }, 1)).to.equal(
                "a table row in a footnote across more than two pages",
            );
        });

        it("should start a footnote that can't go on a page with its reference on the next page, and those after it after it, as Word does", () => {
            // b is at the top of the page, and its footnote is 8 lines kept together, which with the separator is taller
            // than a page: b and c stay, and the footnote is on the next 2 pages, 6 lines and 2, which are the section's
            // (`word-watertight-stops.docx` SP5)
            const note = { "footnote 1": [paragraph("note", 8, { keepLines: true })] };
            const content = withNotes([noted(paragraph("b", 1), "footnote 1"), paragraph("c", 2)], note);
            const { bookmarks, pageCount, pages } = paginate(content, { measurer: MEASURER });
            expect(Object.fromEntries(inBody(content, bookmarks))).to.deep.equal({ b: "1", c: "1" });
            expect(pageCount).to.equal(3);
            const noteLines = pages.map(
                ({ footnotes }) =>
                    footnotes.flatMap(({ content: blocks }) => blocks.flatMap((block) => (block.type === "paragraph" ? block.lines : [])))
                        .length,
            );
            expect(noteLines).to.deep.equal([0, 6, 2]);
            // Before a section on a new page, which starts after them
            const sections = {
                ...withNotes(
                    [
                        [noted(paragraph("b", 1), "footnote 1"), 0],
                        [paragraph("d", 1), 1],
                    ],
                    note,
                ),
                sections: [SECTION, SECTION],
            };
            expect(numbersOf(sections)).to.deep.equal({
                bookmarks: new Map([
                    ["b", "1"],
                    ["d", "4"],
                ]),
                pageCount: 4,
                sectionPageCounts: [3, 1],
            });
            const notes = { ...note, "footnote 2": [paragraph("two", 1)] };
            // Text that goes on to the next page goes on the page after it, above its end, as Word puts it (FN6)
            const after = withNotes([noted(paragraph("b", 1), "footnote 1"), markedLines("c", 7, { 6: ["sixth"] })], notes);
            expect(pagesOf(after)).to.deep.equal({ b: "1", c: "1", sixth: "3" });
            // A footnote referred to below it goes after it, on the page it ends on, though it would fit on its own (FN8)
            const second = paginate(withNotes([noted(paragraph("b", 1), "footnote 1"), noted(paragraph("c", 1), "footnote 2")], notes), {
                measurer: MEASURER,
            });
            expect(second.pages.map(({ footnotes }) => footnotes.map(({ noteNumber }) => noteNumber))).to.deep.equal([
                [],
                ["footnote 1"],
                ["footnote 1", "footnote 2"],
            ]);
            // A line below the top of a page moves to the next, and its footnote starts on the page after (FN7)
            const lower = paginate(withNotes([paragraph("a", 2), noted(paragraph("b", 1), "footnote 1")], notes), { measurer: MEASURER });
            expect(Object.fromEntries(lower.bookmarks)).to.include({ a: "1", b: "2" });
            expect(lower.pageCount).to.equal(4);
            // Whether Word puts a continuous section that doesn't fit on its reference's page on the next, before it, isn't known
            const continuous = {
                ...withNotes(
                    [
                        [noted(paragraph("b", 1), "footnote 1"), 0],
                        [paragraph("c", 6), 0],
                        [paragraph("d", 1), 1],
                    ],
                    notes,
                ),
                sections: [SECTION, { ...SECTION, start: "continuous" as const }],
            };
            expect(paginate(continuous, { measurer: MEASURER }).stoppedAt).to.equal(
                "a footnote continued across a continuous section break onto a page of its own",
            );
            // Whether Word continues those referred to below it when they don't fit below its end isn't known
            const long = withNotes([noted(paragraph("b", 1), "footnote 1"), noted(paragraph("c", 1), "footnote 2")], {
                ...note,
                "footnote 2": [paragraph("two", 5)],
            });
            expect(paginate(long, { measurer: MEASURER }).stoppedAt).to.equal(
                "footnotes after one that starts on the next page that don't fit below its end",
            );
        });

        it("should stop at a footnote, or a line and its footnote, taller than a page", () => {
            const exact = { lineSpacing: { rule: "exact" as const, height: 70 } };
            // A line of 50 points, whose footnote of 2 lines fits on a page, but not with it
            const tallLine = withNotes([noted(paragraph("b", 1, { lineSpacing: { rule: "exact", height: 50 } }), "footnote 1")], {
                "footnote 1": [paragraph("note", 2)],
            });
            expect(paginate(tallLine, { measurer: MEASURER }).stoppedAt).to.equal("a line and its footnote taller than a page");
            // And one taller than a page itself
            const taller = withNotes([noted(paragraph("b", 1, { lineSpacing: { rule: "exact", height: 80 } }), "footnote 1")], {
                "footnote 1": [paragraph("note", 1)],
            });
            expect(paginate(taller, { measurer: MEASURER }).stoppedAt).to.equal("a line and its footnote taller than a page");
            // A footnote of a line taller than a page starts on the next page, where it doesn't fit
            const tall = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [paragraph("note", 1, exact)] });
            expect(paginate(tall, { measurer: MEASURER }).stoppedAt).to.equal("a footnote line taller than a page");
            const later = withNotes([noted(paragraph("b", 1), "footnote 1")], {
                "footnote 1": [paragraph("note", 5), paragraph("tall", 1, exact)],
            });
            expect(paginate(later, { measurer: MEASURER }).stoppedAt).to.equal("a footnote line taller than a page");
        });

        it("should stop at a footnote that can't be laid out", () => {
            const unsupported = { ...paragraph("note", 1), unsupported: "an equation" };
            const content = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [unsupported] });
            expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("an equation");
            // Nor a table in it whose columns can't be sized, as in the text
            const [cell] = row([[paragraph("cell", 1)]]).cells;
            const unsized = { ...table([{ ...row([]), cells: [{ ...cell, width: 20, ownWidth: 20 }] }]), widen: { share: 0.25 } };
            const tabled = withNotes([noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [unsized] });
            expect(paginate(tabled, { measurer: MEASURER }).stoppedAt).to.equal("a word longer than its table can make room for");
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

        // Word's results in these are from word-probes.docx's U3 (scripts/layout-probes), on pages of 51 lines, made smaller

        it("should leave room for the footnotes of table rows, and move a row to the next page with a footnote that doesn't fit below it, as Word does", () => {
            const note = { "footnote 1": [paragraph("note", 1)] };
            const fits = withNotes(
                [paragraph("a", 3), table([row([[noted(paragraph("cell", 2), "footnote 1")]])]), paragraph("b", 1)],
                note,
            );
            expect(pagesOf(fits)).to.deep.equal({ a: "1", cell: "1", b: "2" });
            // A row of a line on the page's 5th line fits with its footnote below it. On the 6th or 7th it moves to the next
            // page with it, where LibreOffice leaves the row and moves only the footnote (U3a)
            const oneLine = (above: number): DocumentContent =>
                withNotes(
                    [paragraph("a", above), table([row([[noted(paragraph("cell", 1), "footnote 1")]]), row([[paragraph("next", 1)]])])],
                    note,
                );
            expect(pagesOf(oneLine(4))).to.deep.equal({ a: "1", cell: "1", next: "2" });
            expect(pagesOf(oneLine(5))).to.deep.equal({ a: "1", cell: "2", next: "2" });
            expect(pagesOf(oneLine(6))).to.deep.equal({ a: "1", cell: "2", next: "2" });
            // So does a row whose cell's 2 lines widow control keeps together, one kept whole, and one whose footnote of 2
            // lines its widow control keeps together
            const breaking = withNotes([paragraph("a", 4), table([row([[noted(paragraph("cell", 2), "footnote 1")]])])], note);
            expect(pagesOf(breaking)).to.deep.equal({ a: "1", cell: "2" });
            const kept = withNotes(
                [paragraph("a", 4), table([row([[noted(paragraph("cell", 2), "footnote 1")]], { cantSplit: true })])],
                note,
            );
            expect(pagesOf(kept)).to.deep.equal({ a: "1", cell: "2" });
            const long = withNotes([paragraph("a", 3), table([row([[noted(paragraph("cell", 2), "footnote 1")]], { cantSplit: true })])], {
                "footnote 1": [paragraph("note", 2)],
            });
            expect(pagesOf(long)).to.deep.equal({ a: "1", cell: "2" });
            // And a row whose text fits with its footnote, but not its height
            const high = withNotes(
                [
                    paragraph("a", 3),
                    table([row([[noted(paragraph("cell", 1), "footnote 1")]], { height: { value: 30, rule: "atLeast" } })]),
                ],
                note,
            );
            expect(pagesOf(high)).to.deep.equal({ a: "1", cell: "2" });
            // And one beside an empty cell whose margins make it taller than the row's text
            const [cell, empty] = row([[noted(paragraph("cell", 1), "footnote 1")], []]).cells;
            const margined = withNotes(
                [paragraph("a", 2), table([{ ...row([]), cells: [cell, { ...empty, marginTop: 20, marginBottom: 20 }] }])],
                note,
            );
            expect(pagesOf(margined)).to.deep.equal({ a: "1", cell: "2" });
        });

        it("should keep a row on the page whose footnote can continue, and continue it below the row, as Word does", () => {
            // A row of a line on the page's 3rd line, with a footnote of 5 lines: 3 fit below it, and the other 2 go on the next
            // page, above which c's 4 lines go (U3b)
            const note = { "footnote 1": [paragraph("note", 5)] };
            const content = withNotes(
                [paragraph("a", 2), table([row([[noted(paragraph("cell", 1), "footnote 1")]])]), paragraph("c", 4), paragraph("d", 1)],
                note,
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", cell: "1", c: "2", d: "3" });
            // A row kept whole, or of an exact height, stays too, and the footnote takes the rest of the page, so the next row
            // goes on the next
            for (const changes of [{ cantSplit: true }, { height: { value: 20, rule: "exact" as const } }]) {
                const kept = withNotes(
                    [
                        paragraph("a", 1),
                        table([row([[noted(paragraph("cell", 2), "footnote 1")]], changes), row([[paragraph("next", 1)]])]),
                        paragraph("c", 1),
                    ],
                    note,
                );
                expect(pagesOf(kept)).to.deep.equal({ a: "1", cell: "1", next: "2", c: "2" });
            }
            // Where the table breaks after the row, its bottom border is below the row, so 2 of the footnote's lines fit below
            // it, not 3, and c doesn't fit on the next page
            for (const changes of [{}, { cantSplit: true }]) {
                const bordered = withNotes(
                    [
                        paragraph("a", 2),
                        table([
                            row([[noted(paragraph("cell", 1), "footnote 1")]], changes),
                            row([[paragraph("next", 1)]], { borderBottom: 10 }),
                        ]),
                        paragraph("c", 2),
                    ],
                    note,
                );
                expect(pagesOf(bordered)).to.deep.equal({ a: "1", cell: "1", next: "2", c: "3" });
            }
        });

        it("should end a row whose footnote continues beside a cell merged down to the next row, whose text goes on in that one", () => {
            // The row stays on the page with the first 3 lines of its footnote, as one alone does (U3b), and the merged cell's
            // line goes in it, so the next row goes on the next page, below the rest of the footnote
            const content = withNotes(
                [
                    paragraph("a", 2),
                    table([
                        mergedRow(merged("restart", [paragraph("merged", 1)]), [[noted(paragraph("cell", 1), "footnote 1")]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                ],
                { "footnote 1": [paragraph("note", 5)] },
            );
            expect(pagesOf(content)).to.deep.equal({ a: "1", merged: "1", cell: "1", r2: "2" });
        });

        it("should put the footnote of a cell merged down rows on the page of its first row, and stop where its text goes on across pages", () => {
            const note = { "footnote 1": [paragraph("note", 1)] };
            // The cell's 2 lines are on the page beside the first row's first 2, as in U4b, with its footnote below them
            const fitting = withNotes(
                [
                    paragraph("a", 3),
                    table([
                        mergedRow(merged("restart", [noted(paragraph("merged", 2), "footnote 1")]), [[paragraph("r1", 4)]]),
                        mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                    ]),
                ],
                note,
            );
            expect(pagesOf(fitting)).to.deep.equal({ a: "1", merged: "1", r1: "1", r2: "2" });
            expect(paginate(fitting, { measurer: MEASURER }).pages[0].footnotes).to.have.length(1);
            // Its footnote went with its first row, and the page Word puts it on when the line that refers to it goes on the
            // next page isn't known
            const merge = (lines: number): DocumentContent =>
                withNotes(
                    [
                        paragraph("a", 2),
                        table([
                            mergedRow(merged("restart", [noted(paragraph("merged", lines), "footnote 1")]), [[paragraph("r1", 1)]]),
                            mergedRow(merged("continue"), [[paragraph("r2", 1)]]),
                        ]),
                    ],
                    note,
                );
            expect(numbersOf(merge(4)).stoppedAt).to.equal("a footnote in a cell merged down table rows whose text goes on across pages");
            expect(pagesOf(merge(3))).to.deep.equal({ a: "1", merged: "1", r1: "1", r2: "1" });
        });

        it("should break a row across pages with the footnote of each of its lines on the page the line is on, as Word does", () => {
            // A cell of 6 lines from the page's 4th line, with footnotes of a line from its 1st and 5th. 2 of its lines fit with
            // the first footnote, where 4 would without it, and the second goes below the other 4 on the next page (U3c)
            const cell = markedLines("cell", 6, { 1: ["footnote 1"], 3: ["third"], 5: ["fifth", "footnote 2"] });
            const notes = { "footnote 1": [paragraph("one", 1)], "footnote 2": [paragraph("two", 1)] };
            const content = withNotes([paragraph("a", 3), table([row([[cell]])]), paragraph("c", 1), paragraph("d", 1)], notes);
            expect(pagesOf(content)).to.deep.equal({ a: "1", cell: "1", third: "2", fifth: "2", c: "2", d: "3" });
            // In a row of 2 cells of 4 lines with room for 3, widow control leaves 2 of each, and the footnote of the right
            // one's 3rd line goes on the next page with it (U3e)
            const right = markedLines("right", 4, { 3: ["third", "footnote 1"] });
            const beside = withNotes(
                [paragraph("a", 4), table([row([[paragraph("left", 4)], [right]])]), paragraph("c", 3), paragraph("d", 1)],
                notes,
            );
            expect(pagesOf(beside)).to.deep.equal({ a: "1", left: "1", right: "1", third: "2", c: "2", d: "3" });
        });

        it("should break a row after the line whose footnote continues, as Word does", () => {
            // A cell of 6 lines below a, with a footnote of 5 lines from its 2nd. 3 of its lines would fit with 2 of the
            // footnote's, but the row breaks after the 2nd, with 3 of the footnote's below it, as in Word and LibreOffice
            // (U3d)
            const note = { "footnote 1": [paragraph("note", 5)] };
            const second = markedLines("cell", 6, { 2: ["footnote 1"], 3: ["third"] });
            expect(pagesOf(withNotes([paragraph("a", 1), table([row([[second]])]), paragraph("c", 1)], note))).to.deep.equal({
                a: "1",
                cell: "1",
                third: "2",
                c: "3",
            });
            // The cells beside it break there too
            const besides = withNotes([paragraph("a", 1), table([row([[paragraph("left", 2)], [second]])]), paragraph("c", 1)], note);
            expect(pagesOf(besides)).to.deep.equal({ a: "1", left: "1", cell: "1", third: "2", c: "3" });
            // With the reference on its first line, widow control keeps 2 lines on the page, with less of the footnote below
            // them, as in the text (U2j)
            const first = markedLines("cell", 5, { 1: ["footnote 1"], 3: ["third"] });
            expect(pagesOf(withNotes([paragraph("a", 1), table([row([[first]])]), paragraph("c", 1)], note))).to.deep.equal({
                a: "1",
                cell: "1",
                third: "2",
                c: "2",
            });
            // With the reference at the end of a paragraph, the next paragraph of the cell goes on the next page
            const paragraphs = withNotes(
                [paragraph("a", 1), table([row([[noted(paragraph("one", 2), "footnote 1"), paragraph("two", 3)]])]), paragraph("c", 1)],
                note,
            );
            expect(pagesOf(paragraphs)).to.deep.equal({ a: "1", one: "1", two: "2", c: "2" });
        });

        it("should stop at a footnote in a table row beside a cell whose lines it holds back, as what Word keeps there isn't known", () => {
            const reason = "a footnote in a table row beside a cell whose lines it holds back";
            const one = { "footnote 1": [paragraph("one", 1)] };
            const stoppedAt = (
                left: Block,
                right: Block,
                above: number,
                notes: Record<string, readonly Block[]> = one,
            ): string | undefined =>
                paginate(withNotes([paragraph("a", above), table([row([[left], [right]])])], notes), { measurer: MEASURER }).stoppedAt;
            // With room for 3 lines above the right cell's footnote, widow control leaves 2 of the left's 4 lines there
            const referring = markedLines("right", 2, { 1: ["footnote 1"] });
            expect(stoppedAt(paragraph("left", 4), referring, 2)).to.equal(reason);
            // With room for 2, keepLines holds back all of the left's 3
            expect(stoppedAt(paragraph("left", 3, { keepLines: true }), referring, 3)).to.equal(reason);
            // The row breaks above the right cell's 5th line, which doesn't fit with its footnote, where all 5 of the left's
            // fit, without widow control
            const fifth = markedLines("right", 5, { 5: ["footnote 1"] }, { widowControl: false });
            const loose = paragraph("left", 5, { widowControl: false });
            expect(stoppedAt(loose, fifth, 1, { "footnote 1": [paragraph("note", 3)] })).to.equal(reason);
            // It breaks after the right cell's 2nd line, whose footnote continues, where widow control leaves none of the
            // left's 3
            const continuing = markedLines("right", 6, { 2: ["footnote 1"] });
            expect(stoppedAt(paragraph("left", 3), continuing, 1, { "footnote 1": [paragraph("note", 5)] })).to.equal(reason);
            // A cell kept together that doesn't fit beside the row's other lines without the footnote either keeps its lines as
            // the row is cut: Word moved a row whose second cell of 6 lines kept together didn't fit in the 4 lines left to
            // the next page (`word-stops-notes.docx` NT7)
            const third = markedLines("right", 4, { 3: ["footnote 1"] });
            expect(stoppedAt(paragraph("left", 5, { keepLines: true }), third, 3)).to.equal(undefined);
            expect(
                pagesOf(withNotes([paragraph("a", 3), table([row([[paragraph("left", 5, { keepLines: true })], [third]])])], one)),
            ).to.deep.equal({
                a: "1",
                left: "2",
                right: "2",
            });
            // A cell that its own footnote holds back is laid out, as in the text
            const own = markedLines("right", 4, { 1: ["footnote 1"], 3: ["third"] });
            expect(pagesOf(withNotes([paragraph("a", 2), table([row([[paragraph("left", 1)], [own]])])], one))).to.deep.equal({
                a: "1",
                left: "1",
                right: "1",
                third: "2",
            });
        });

        it("should stop at a row that fits on an empty page, but not with its footnote", () => {
            const exact = { lineSpacing: { rule: "exact" as const, height: 70 } };
            const note = { "footnote 1": [paragraph("note", 1, exact)] };
            const content = withNotes([table([row([[noted(paragraph("cell", 1), "footnote 1")]])])], note);
            expect(paginate(content, { measurer: MEASURER }).stoppedAt).to.equal("a table row and its footnote taller than a page");
            // And one kept whole, unless it is taller than a page itself, when it breaks across pages as other rows do
            const kept = (lines: number): DocumentContent =>
                withNotes([table([row([[noted(paragraph("cell", lines), "footnote 1")]], { cantSplit: true })])], {
                    "footnote 1": [paragraph("note", 1)],
                });
            expect(paginate(kept(6), { measurer: MEASURER }).stoppedAt).to.equal("a table row and its footnote taller than a page");
            const { pageCount, stoppedAt } = paginate(kept(8), { measurer: MEASURER });
            expect([pageCount, stoppedAt]).to.deep.equal([2, undefined]);
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
            expect(numbersOf(content)).to.deep.equal({
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

            it("should stop at a footnote with borders or automatic spacing laid out in the columns, which Word hasn't been seen with", () => {
                const borders = { top: 1, bottom: 1, between: 0, betweenSpace: 0, box: "box", outline: "box" };
                const boxed = inSections([noted(paragraph("a", 1), "footnote 1"), ...lines("b", 2)], {
                    "footnote 1": [{ ...paragraph("note", 1), borders }],
                });
                expect(numbersOf(boxed).stoppedAt).to.equal(
                    "a paragraph border or automatic spacing in a footnote across pages or in columns",
                );
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

            it("should move a table row to the next column with a footnote that doesn't fit below it, even where part of it would, as a line", () => {
                // As a line does: the row and its footnote start the second column, so c's 4 lines fill it, above the footnote
                for (const changes of [{}, { cantSplit: true }]) {
                    const content = inSections(
                        [
                            paragraph("a", 5),
                            table([row([[noted(paragraph("cell", 1), "footnote 1")]], changes)]),
                            paragraph("c", 4),
                            paragraph("d", 1),
                        ],
                        ONE_LINE,
                    );
                    expect(pagesOf(content)).to.deep.equal({ a: "1", cell: "1", c: "1", d: "2" });
                }
                // Only the first of a footnote's 2 lines fits below the row, and Word moves a reference in columns with all of
                // its footnote (`word-watertight-stops.docx` SP1a)
                for (const changes of [{}, { cantSplit: true }]) {
                    const short = inSections([paragraph("a", 4), table([row([[noted(paragraph("cell", 1), "footnote 1")]], changes)])], {
                        "footnote 1": [paragraph("note", 2)],
                    });
                    const { bookmarks, pages } = paginate(short, { measurer: MEASURER });
                    expect(Object.fromEntries(inBody(short, bookmarks))).to.deep.equal({ a: "1", cell: "1" });
                    expect(pages[0].body.map((block) => (block.type === "table" ? block.rows[0].y : undefined))).to.deep.equal([
                        undefined,
                        10,
                    ]);
                }
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

            it("should lay out the footnotes of another section on a page in the columns of the first footnote's, as Word does", () => {
                const notes = (sections: readonly Section[]): DocumentContent =>
                    inSections(
                        [
                            [noted(paragraph("a", 1), "footnote 1"), 0],
                            [noted(paragraph("b", 1), "footnote 2"), 1],
                        ],
                        ONE_LINE,
                        sections,
                    );
                // Those of a section of the same columns go one after the other from the first column, so each is in one, the
                // second's in the second column, 10 points from the first (`word-watertight-stops.docx` SP6). So do those of
                // a section of one column, of other columns, or of the same columns elsewhere across the page, as Word lays
                // out those of one of 3 columns, or of one, in the first's 2 (`word-watertight-notes.docx` FN14, FN15)
                const wide: Section = { ...COLUMNS, pageWidth: 190 };
                for (const other of [wide, { ...wide, columns: [170] }, { ...wide, columns: [70, 70] }, { ...wide, marginLeft: 0 }]) {
                    const { pages, stoppedAt } = paginate(notes([wide, { ...other, start: "continuous" }]), { measurer: MEASURER });
                    expect(stoppedAt).to.equal(undefined);
                    expect(
                        pages[0].footnotes.map(({ content: [block] }) =>
                            block.type === "paragraph" ? [block.lines[0].x, block.lines[0].y] : [],
                        ),
                    ).to.deep.equal([
                        [10, 70],
                        [100, 70],
                    ]);
                }
                // Those of sections of one column are one below the other, as on any page
                expect(pagesOf(notes([SECTION, { ...SECTION, start: "continuous" }]))).to.deep.equal({ a: "1", b: "1" });
            });

            it("should move a line to the next column or page with all of its footnote, rather than continue it, as Word does", () => {
                // Pages of 18 lines, with the second column 10 points from the first
                const tall: Section = { ...COLUMNS, pageWidth: 190, pageHeight: 200 };
                const note = { "footnote 1": [paragraph("note", 8)] };
                /** Where each line is on each page: the left of its column, and its top */
                const placesOf = (content: DocumentContent): readonly (readonly (readonly number[])[])[] =>
                    paginate(content, { measurer: MEASURER }).pages.map(({ body }) =>
                        body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x, y }) => [x, y]) : [])),
                    );
                // b fits on line 15 of the first column with 2 of its footnote's 8 lines, but not with all of them, which take 4
                // lines of each column and the separator. It goes in the second with them, and the first is laid out again
                // above them, so x14 goes in the second too (`word-watertight-stops.docx` SP1a)
                const first = inSections([...lines("x", 14), noted(paragraph("b", 1), "footnote 1"), ...lines("y", 3)], note, [tall]);
                expect(pagesOf(first)).to.include({ x13: "1", x14: "1", b: "1", y3: "1" });
                const [page] = placesOf(first);
                expect(page.slice(12, 15)).to.deep.equal([
                    [10, 130],
                    [100, 10],
                    [100, 20],
                ]);
                // From line 15 of the second column, it goes on the next page with them, and nothing of it is on this one, whose
                // columns are as they are without it (SP1b, SP9)
                const second = inSections(
                    [...lines("x", 18), ...lines("y", 14), noted(paragraph("b", 1), "footnote 1"), ...lines("z", 2)],
                    note,
                    [tall],
                );
                const { bookmarks, pages } = paginate(second, { measurer: MEASURER });
                expect(Object.fromEntries(inBody(second, bookmarks))).to.include({ y14: "1", b: "2", z2: "2" });
                expect(
                    pages.map(({ footnotes }) =>
                        footnotes.flatMap(({ content }) =>
                            content.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : [])),
                        ),
                    ),
                ).to.deep.equal([[], [10, 10, 10, 10, 100, 100, 100, 100]]);
                // None of an empty one fits, but its separator, so the line goes on in the next column with it
                const empty = inSections([paragraph("a", 6), noted(paragraph("b", 1), "footnote 1")], { "footnote 1": [] });
                expect(numbersOf(empty)).to.deep.equal({
                    bookmarks: new Map([
                        ["a", "1"],
                        ["b", "1"],
                    ]),
                    pageCount: 1,
                    sectionPageCounts: [1],
                });
            });

            it("should continue a footnote too long for the columns of a page from a line at their top, as Word does", () => {
                const wide: Section = { ...COLUMNS, pageWidth: 190 };
                /** The left of each line of the footnotes on each page */
                const noteLefts = (laidOut: readonly PageLayout[]): readonly (readonly number[])[] =>
                    laidOut.map(({ footnotes }) =>
                        footnotes.flatMap(({ content }) =>
                            content.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : [])),
                        ),
                    );
                // b is at the top of the page: as much of its 20 lines as leaves it there goes below it, 5 at the foot of
                // each column, and the text goes on above them, c in the second column. The other 10 go on the next page, as
                // Word gives a footnote as much of a page's columns as leaves its reference on it (`word-watertight-notes.docx`
                // FN3)
                const top = inSections(
                    [noted(paragraph("b", 1), "footnote 1"), paragraph("c", 1)],
                    { "footnote 1": [paragraph("note", 20)] },
                    [wide],
                );
                const { bookmarks, pages } = paginate(top, { measurer: MEASURER });
                expect(Object.fromEntries(inBody(top, bookmarks))).to.deep.equal({ b: "1", c: "1" });
                expect(
                    pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x, y }) => [x, y]) : [])),
                ).to.deep.equal([
                    [10, 10],
                    [100, 10],
                ]);
                expect(noteLefts(pages)).to.deep.equal([
                    [10, 10, 10, 10, 10, 100, 100, 100, 100, 100],
                    [10, 10, 10, 10, 10, 100, 100, 100, 100, 100],
                ]);
            });

            it("should lay the columns out again above as much of a footnote too long for them as leaves its reference on the page, as Word does", () => {
                // b moves from below a to the top of the second column, where Word lays out the first column again above as
                // much of its footnote as leaves it on the page (`word-watertight-notes.docx` FN3): a's 7 lines and b go 4 and
                // 4, below each 2 lines of the footnote after the separator, and the rest goes on the next pages
                const later = inSections(
                    [paragraph("a", 7), noted(paragraph("b", 1), "footnote 1")],
                    { "footnote 1": [paragraph("note", 20)] },
                    [{ ...COLUMNS, pageWidth: 190 }],
                );
                const laid = paginate(later, { measurer: MEASURER });
                expect(laid.stoppedAt).to.equal(undefined);
                expect(Object.fromEntries(inBody(later, laid.bookmarks))).to.deep.equal({ a: "1", b: "1" });
                expect(
                    laid.pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x, y }) => [x, y]) : [])),
                ).to.deep.equal([
                    [10, 10],
                    [10, 20],
                    [10, 30],
                    [10, 40],
                    [100, 10],
                    [100, 20],
                    [100, 30],
                    [100, 40],
                ]);
                const noteLefts = laid.pages[0].footnotes.flatMap(({ content }) =>
                    content.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : [])),
                );
                expect(noteLefts).to.deep.equal([10, 10, 100, 100]);
            });

            it("should stop at a footnote too long for the columns of a page where no room for it leaves its reference on the page", () => {
                // b's footnote is kept together, and taller than the page, so none of it fits with b, which with any room
                // below the columns goes on the next page
                const kept = inSections(
                    [...lines("x", 7), noted(paragraph("b", 1), "footnote 1")],
                    { "footnote 1": [paragraph("note", 8, { keepLines: true })] },
                    [{ ...COLUMNS, pageWidth: 190 }],
                );
                expect(paginate(kept, { measurer: MEASURER }).stoppedAt).to.equal("a footnote across pages in columns");
            });

            it("should stop at a footnote too long for the columns of a page from below their top, below footnotes across the page", () => {
                const reason = "a footnote across pages in columns";
                // Below text across the page with a footnote, the footnotes are across it, and only part of b's fits there
                const across = inSections(
                    [
                        [noted(paragraph("a", 1), "footnote 1"), 0],
                        [noted(paragraph("b", 1), "footnote 2"), 1],
                    ],
                    { "footnote 1": [paragraph("one", 1)], "footnote 2": [paragraph("two", 8)] },
                    [SECTION, { ...COLUMNS, start: "continuous" }],
                );
                expect(paginate(across, { measurer: MEASURER }).stoppedAt).to.equal(reason);
            });

            it("should stop where a footnote that continues from columns would have text or a section after it on the page, or in columns of different widths", () => {
                const wide: Section = { ...COLUMNS, pageWidth: 190 };
                const note = { "footnote 1": [paragraph("note", 20)], "footnote 2": [paragraph("two", 1)] };
                const stoppedAt = (blocks: Parameters<typeof document>[0], sections: readonly Section[]): string | undefined =>
                    paginate(inSections(blocks, note, sections), { measurer: MEASURER }).stoppedAt;
                // A footnote referred to below one that continues, in the text that goes on above it
                expect(stoppedAt([noted(paragraph("b", 1), "footnote 1"), noted(paragraph("c", 1), "footnote 2")], [wide])).to.equal(
                    "a footnote below one that continues on the next page in columns",
                );
                // A section below the columns, or in the next column
                const section = "a footnote continued from columns before a section on the same page";
                for (const next of [
                    { ...wide, start: "continuous" as const },
                    { ...wide, start: "nextColumn" as const },
                ]) {
                    expect(
                        stoppedAt(
                            [
                                [noted(paragraph("b", 1), "footnote 1"), 0],
                                [paragraph("c", 1), 1],
                            ],
                            [wide, next],
                        ),
                    ).to.equal(section);
                }
                // Columns of different widths
                expect(stoppedAt([noted(paragraph("b", 1), "footnote 1")], [{ ...wide, columns: [80, 70] }])).to.equal(
                    "a footnote across pages in columns",
                );
            });

            it("should lay out footnotes in columns of different widths from the first, broken again in the next at its width, as Word does", () => {
                // Words of 20 points: one to a line of the first column, 30 points wide, and two to a line of the second, 50
                // points wide and 90 from it
                const words = (name: string, count: number): ParagraphBlock => ({
                    ...paragraph(name, 1),
                    items: [
                        { type: "marker", name },
                        { type: "text", text: Array.from({ length: count }, () => "ab").join(" "), font: {} },
                    ],
                });
                const content = inSections(
                    [withItems(words("a", 1), [{ type: "marker", name: "footnote 1" }])],
                    { "footnote 1": [words("note", 6)] },
                    [{ ...SECTION, pageWidth: 190, columns: [30, 50] }],
                );
                const { pages, stoppedAt } = paginate(content, { measurer: MEASURER });
                expect(stoppedAt).to.equal(undefined);
                // Its 6 words are 6 lines in the first column, and 3 in the second: 2 lines of the first and 2 of the second
                // is the shortest they fit in, as Word evens out a footnote of 7 lines in a column of 2000 twips into 4 lines
                // there and 1 of the next, of 6306 (`word-watertight-stops.docx` SP7)
                const [footnote] = pages[0].footnotes;
                expect(
                    footnote.content.flatMap((block) =>
                        block.type === "paragraph" ? block.lines.map(({ x, y, width }) => [x, y, width]) : [],
                    ),
                ).to.deep.equal([
                    [10, 60, 30],
                    [10, 70, 30],
                    [130, 60, 50],
                    [130, 70, 50],
                ]);
            });

            it("should continue a footnote in a section that starts in the next column, below a longer column of the section before, as Word does", () => {
                const wide: Section = { ...COLUMNS, pageWidth: 190 };
                const content = (before: number, noteLines: number): DocumentContent =>
                    inSections(
                        [
                            [paragraph("a", before), 0],
                            [noted(paragraph("b", 1), "footnote 1"), 1],
                        ],
                        { "footnote 1": [paragraph("note", noteLines)] },
                        [wide, { ...wide, start: "nextColumn" }],
                    );
                /** The left of each line of the footnotes on each page */
                const noteLefts = (laidOut: DocumentContent): readonly (readonly number[])[] =>
                    paginate(laidOut, { measurer: MEASURER }).pages.map(({ footnotes }) =>
                        footnotes.flatMap(({ content: blocks }) =>
                            blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x }) => x) : [])),
                        ),
                    );
                // a's 3 lines end above it, and the footnote goes in both columns, as Word lays out one of 10 lines 5 and 5
                // beside 45 lines (`word-watertight-stops.docx` SP8)
                expect(noteLefts(content(3, 6))).to.deep.equal([[10, 10, 10, 100, 100, 100]]);
                // Below a's 4, as much of it as fits goes on the page, 2 lines in each column, and the rest on the next, as
                // Word continues one of 10 lines beside 48 (`word-watertight-notes.docx` FN2)
                expect(noteLefts(content(4, 6))).to.deep.equal([
                    [10, 10, 100, 100],
                    [10, 10],
                ]);
                // 4 of 5 lines would fit, but would leave 1 on the next page, and 3, which widow control keeps in one column,
                // don't, so 2 go on the page
                expect(noteLefts(content(4, 5))).to.deep.equal([
                    [10, 10],
                    [10, 10, 10],
                ]);
                // One too long for the column b starts too goes on the page as far as it fits below a's 4, and fills the
                // next page's columns, and goes on on the page after
                expect(noteLefts(content(4, 20))).to.deep.equal([
                    [10, 10, 100, 100],
                    [10, 10, 10, 10, 10, 10, 100, 100, 100, 100, 100, 100],
                    [10, 10, 100, 100],
                ]);
                // Where none of it fits below a's 7, it stops
                expect(paginate(content(7, 6), { measurer: MEASURER }).stoppedAt).to.equal("a footnote across pages in columns");
            });

            it("should leave a page as it is without a footnote whose reference moves on when its columns are laid out again for it, as Word does", () => {
                // Above c's footnote, a's last 2 lines go in the second column, and c no longer fits there. Word moves the
                // reference on and leaves the page as it was without the footnote (`word-watertight-notes.docx` FN1)
                const content = inSections(
                    [...lines("x", 14), ...lines("a", 7), ...lines("b", 3), noted(paragraph("c", 1), "footnote 1")],
                    ONE_LINE,
                );
                const { bookmarks, pages, stoppedAt } = paginate(content, { measurer: MEASURER });
                expect(stoppedAt).to.equal(undefined);
                expect(Object.fromEntries(bookmarks)).to.include({ x14: "1", a7: "2", b1: "2", b3: "2", c: "3" });
                expect(pages[1].footnotes).to.deep.equal([]);
                // With a table row on the page, whose rows might not be the same without the room, it stops
                const tabled = inSections(
                    [
                        ...lines("x", 14),
                        ...lines("a", 7),
                        table([row([[paragraph("row", 1)]])]),
                        ...lines("b", 2),
                        noted(paragraph("c", 1), "footnote 1"),
                    ],
                    ONE_LINE,
                );
                expect(paginate(tabled, { measurer: MEASURER }).stoppedAt).to.equal(
                    "a footnote in columns that moves its reference to the next page",
                );
                // a's last line, with widow control the one before, goes in the second column with its footnote, and the first
                // column is laid out again above it, which moves the reference on. Laid out again without the room, the line
                // is at the top of the second column, where it would stay, and the page would be laid out again for the
                // footnote. Guessing, it moves on
                const reason = "a footnote in columns whose reference moves on to the next page from the top of a column";
                const top = inSections(
                    [noted(paragraph("a", 6), "footnote 1"), paragraph("b", 1)],
                    { "footnote 1": [paragraph("note", 8)] },
                    [{ ...COLUMNS, pageWidth: 190 }],
                );
                expect(paginate(top, { measurer: MEASURER }).stoppedAt).to.equal(reason);
                const guessed = paginate(top, { measurer: MEASURER, guess: true });
                expect(
                    guessed.pages.map(({ body }) => body.flatMap((block) => (block.type === "paragraph" ? block.lines.length : 0))),
                ).to.deep.equal([[4], [2, 1]]);
                expect(guessed.pages[0].guesses).to.deep.equal([reason]);
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

    describe("fields whose results depend on the pages", () => {
        /** The text of each line of the body of a page */
        const linesOn = (pagination: Pagination, page: number): readonly string[] =>
            pagination.pages[page - 1].body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : []));
        /** A paragraph of a field's result, at the marker before it when it has one */
        const fielded = (name: string, item: LayoutItem, marker?: string): ParagraphBlock =>
            withItems(paragraph(name, 0), [...(marker === undefined ? [] : [{ type: "marker" as const, name: marker }]), item]);
        /** Lays out the pages, and again with where the bookmarks and fields were placed, as the passes do */
        const twice = (content: DocumentContent, options: Parameters<typeof paginate>[1] = {}): Pagination => {
            const first = paginate(content, { measurer: MEASURER, ...options });
            return paginate(content, { measurer: MEASURER, ...options, pageNumbers: first.bookmarks, places: first.places });
        };
        const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
        /** A document whose blocks refer to footnotes and endnotes, by the markers at their references */
        const withNotes = (
            blocks: Parameters<typeof document>[0],
            footnotes: Record<string, readonly Block[]>,
            endnotes: Record<string, readonly Block[]> = {},
            sections = [SECTION],
        ): DocumentContent =>
            document(blocks, {
                sections,
                footnotes: new Map(Object.entries(footnotes)),
                footnoteSeparator: [SEPARATOR],
                footnoteContinuationSeparator: [SEPARATOR],
                endnotes: Object.values(endnotes).flat(),
                endnoteReferences: new Map(Object.entries(endnotes)),
            });
        const referring = (name: string, lines: number, ...notes: readonly string[]): ParagraphBlock =>
            withItems(
                paragraph(name, lines),
                notes.map((note) => ({ type: "marker", name: note })),
            );

        it("should write the number of the page a PAGE field is on, from where it was placed before, as the page shows it", () => {
            const page: LayoutItem = { type: "pageNumber", field: "field 1", font: {} };
            const content = document([paragraph("a", 7), fielded("b", page, "field 1")], {
                sections: [{ ...SECTION, firstNumber: 4, numberFormat: "lowerRoman" }],
            });
            const first = paginate(content, { measurer: MEASURER });
            // Where it is isn't known the first time, so it is blank. It is placed as a bookmark is, but isn't one
            expect(linesOn(first, 2)).to.deep.equal([""]);
            expect(first.places.get("field 1")).to.deep.equal({ page: 2, pageNumber: 5, text: "v", section: 0, order: 2 });
            expect(first.bookmarks.has("field 1")).to.equal(false);
            expect(linesOn(paginate(content, { measurer: MEASURER, places: first.places }), 2)).to.deep.equal(["v"]);
            // In a format of its own, of the page's number, on a page numbered in figures or not (word-page-fields.docx PF7)
            const formatted = (format: FieldFormat, section: Partial<Section> = {}): readonly string[] =>
                linesOn(
                    twice(
                        document([paragraph("a", 7), fielded("b", { ...page, format }, "field 1")], {
                            sections: [{ ...SECTION, ...section }],
                        }),
                    ),
                    2,
                );
            expect(formatted({ numberFormat: "roman" })).to.deep.equal(["ii"]);
            expect(formatted({ numberFormat: "Arabic" }, { firstNumber: 4, numberFormat: "lowerRoman" })).to.deep.equal(["5"]);
            expect(formatted({ picture: "00" })).to.deep.equal(["02"]);
            expect(formatted({ numberFormat: "roman", capitals: "upper" })).to.deep.equal(["II"]);
            expect(formatted({ capitals: "upper" }, { numberFormat: "lowerRoman" })).to.deep.equal(["II"]);
            // Word's ordinal of 0 is an error
            const zero = document([fielded("b", { ...page, format: { numberFormat: "Ordinal" } }, "field 1")], {
                sections: [{ ...SECTION, firstNumber: 0 }],
            });
            expect(twice(zero).stoppedAt).to.equal("a page number its format isn't written for yet");
        });

        it("should write the number of the section a SECTION field is in, counted from 1, in a format of its own too", () => {
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [fielded("b", { type: "sectionNumber", font: {} }), 1],
                    [fielded("c", { type: "sectionNumber", font: {}, format: { numberFormat: "ALPHABETIC" } }), 1],
                ],
                { sections: [SECTION, SECTION] },
            );
            expect(linesOn(paginate(content, { measurer: MEASURER }), 2)).to.deep.equal(["2", "B"]);
        });

        it("should write the number of pages in a format of its own, and nothing until it is known", () => {
            const content = document([fielded("a", { type: "pageCount", scope: "document", font: {}, format: { numberFormat: "roman" } })]);
            expect(linesOn(paginate(content, { measurer: MEASURER, pageCount: 12 }), 1)).to.deep.equal(["xii"]);
            expect(linesOn(paginate(content, { measurer: MEASURER }), 1)).to.deep.equal([""]);
        });

        it("should write a page reference in a format of its own from the number of its bookmark's page, without its chapter number, and give each bookmark's", () => {
            const reference = (format: FieldFormat): ParagraphBlock =>
                fielded("reference", { type: "pageReference", bookmark: "target", font: {}, format });
            const content = (format: FieldFormat, section: Partial<Section> = {}): DocumentContent =>
                document([reference(format), paragraph("fill", 6), paragraph("target", 1)], {
                    sections: [{ ...SECTION, ...section }],
                });
            expect(linesOn(paginate(content({ numberFormat: "roman" }), { measurer: MEASURER }), 1)[0]).to.equal("");
            expect(linesOn(twice(content({ numberFormat: "roman" })), 1)[0]).to.equal("ii");
            // word-page-fields.docx PF4: page iv in Arabic is 4, and page 1-2 in roman numerals is ii
            expect(linesOn(twice(content({ numberFormat: "Arabic" }, { firstNumber: 3, numberFormat: "lowerRoman" })), 1)[0]).to.equal("4");
            const chapter = (name: string): ParagraphBlock => ({ ...paragraph(name, 1), heading: { level: 1, chapter: "1" } });
            const chapters = document(
                [chapter("heading"), reference({ numberFormat: "roman" }), paragraph("fill", 5), paragraph("target", 1)],
                {
                    sections: [{ ...SECTION, chapters: { level: 1, separator: "-" } }],
                },
            );
            expect(linesOn(twice(chapters), 1)[1]).to.equal("ii");
            expect(Object.fromEntries(paginate(chapters, { measurer: MEASURER }).bookmarkNumbers)).to.deep.equal({
                heading: 1,
                reference: 1,
                fill: 1,
                target: 2,
            });
            // In capitals alone, the page's number as the page shows it
            expect(linesOn(twice(content({ capitals: "upper" }, { numberFormat: "lowerRoman" })), 1)[0]).to.equal("II");
        });

        it("should write where a bookmark is from a page reference with \\p: above or below it on its page, by the order of the text, and the bookmark's page otherwise", () => {
            const relative = (field: string, format?: FieldFormat): ParagraphBlock =>
                fielded(
                    field,
                    { type: "pageReference", bookmark: "target", font: {}, relative: field, ...(format ? { format } : {}) },
                    field,
                );
            const content = document(
                [
                    relative("field 1"),
                    paragraph("target", 1),
                    relative("field 2", { capitals: "upper" }),
                    paragraph("fill", 5),
                    relative("field 3"),
                ],
                { relativeReferences: new Map([["target", ["field 1", "field 2", "field 3", "field 9"]]]) },
            );
            const first = paginate(content, { measurer: MEASURER });
            // A reference that wasn't placed has nothing
            expect(first.relativePositions.get("target")).to.deep.equal(["below", "above", "on page 1", undefined]);
            const second = paginate(content, { measurer: MEASURER, places: first.places });
            expect([...linesOn(second, 1), ...linesOn(second, 2)].filter((text) => !text.startsWith("abc"))).to.deep.equal([
                "below",
                "ABOVE",
                "on page ",
                "1",
            ]);
            // In a footnote or endnote, "on page" and the bookmark's page, on its page too (word-page-fields.docx PF8f, PF8g)
            const inNote = (format?: FieldFormat): LayoutItem => ({
                type: "pageReference",
                bookmark: "target",
                font: {},
                inNote: true,
                ...(format ? { format } : {}),
            });
            const noted = document([withItems(paragraph("a", 1), [{ type: "marker", name: "note" }]), paragraph("target", 1)], {
                footnotes: new Map([["note", [{ ...paragraph("n", 0), items: [inNote(), inNote({ capitals: "upper" })] }]]]),
            });
            const notedAgain = paginate(noted, { measurer: MEASURER, places: paginate(noted, { measurer: MEASURER }).places });
            expect(
                notedAgain.pages[0].footnotes.flatMap(({ content: blocks }) =>
                    blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : [])),
                ),
            ).to.deep.equal(["on page ", "1ON PAGE ", "1"]);
            // Before it is placed, nothing
            expect(paginate(noted, { measurer: MEASURER }).pages[0].footnotes[0].content).to.have.length(1);
            // Across columns, by the order of the text too: the bookmark is beside the reference, in the second column
            // (word-page-fields.docx PF1)
            const columns = document([relative("field 1"), paragraph("fill", 7), paragraph("target", 1)], {
                sections: [{ ...SECTION, pageWidth: 190, columns: [80, 80] }],
            });
            expect(linesOn(twice(columns), 1)[0]).to.equal("below");
            // To a bookmark that isn't anywhere, nothing
            const nowhere = document([relative("field 1")], { relativeReferences: new Map([["elsewhere", ["field 1"]]]) });
            expect(paginate(nowhere, { measurer: MEASURER }).relativePositions.get("elsewhere")).to.deep.equal([undefined]);
            expect(linesOn(paginate(nowhere, { measurer: MEASURER, places: first.places }), 1)).to.deep.equal(["below"]);
        });

        it("should place the bookmarks and fields of footnotes and endnotes where their references are, as Word does (word-page-fields.docx PF7g to PF8c)", () => {
            const content = withNotes(
                [paragraph("a", 3), referring("b", 1, "footnote 1", "endnote 1"), paragraph("c", 1), paragraph("d", 2)],
                {
                    "footnote 1": [
                        paragraph("note", 2),
                        table([row([[paragraph("cell", 1)]])]),
                        fielded("rest", { type: "pageNumber", field: "field 1", font: {} }, "field 1"),
                        fielded("section", { type: "sectionNumber", field: "field 2", font: {} }, "field 2"),
                    ],
                },
                { "endnote 1": [paragraph("end", 1)] },
                [{ ...SECTION, numberFormat: "lowerRoman" }],
            );
            const first = paginate(content, { measurer: MEASURER });
            // The footnote's rest goes on to page ii, and the endnote is on the last page, but they are where b is
            expect(Object.fromEntries(first.bookmarks)).to.deep.include({ b: "i", note: "i", cell: "i", rest: "i", end: "i" });
            expect(first.pageCount).to.equal(3);
            const second = paginate(content, { measurer: MEASURER, places: first.places });
            expect(
                second.pages.flatMap((page) =>
                    page.footnotes.flatMap(({ content: blocks }) =>
                        blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : [])),
                    ),
                ),
            ).to.include.members(["i", "1"]);
            // Not yet placed, a SECTION field in a note is blank
            expect(
                paginate(content, { measurer: MEASURER }).pages.flatMap((page) =>
                    page.footnotes.flatMap(({ content: blocks }) =>
                        blocks.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ text }) => text) : [])),
                    ),
                ),
            ).not.to.include("1");
            // A page reference with \p to one is "on page" its reference's page, even on that page (PF8d and PF8e)
            const reference = fielded("field 3", { type: "pageReference", bookmark: "note", font: {}, relative: "field 3" }, "field 3");
            const relative = withNotes([reference, referring("b", 1, "footnote 1")], { "footnote 1": [paragraph("note", 1)] });
            expect(linesOn(twice(relative), 1).slice(0, 2)).to.deep.equal(["on page ", "1"]);
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
            expect(numbersOf(content)).to.deep.equal({
                bookmarks: new Map(),
                pageCount: 0,
                sectionPageCounts: [undefined],
                stoppedAt: "an equation",
            });
        });
    });

    it("should stop at a block it can't lay out, with the bookmarks before it placed", () => {
        const content = document([paragraph("a", 1), { ...paragraph("b", 1), unsupported: "a footnote" }, paragraph("c", 1)]);
        expect(numbersOf(content)).to.deep.equal({
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

    describe("what is on each page", () => {
        const pagesLaidOut = (content: DocumentContent): readonly PageLayout[] => paginate(content, { measurer: MEASURER }).pages;
        /** Each line of the blocks, as its text and where it is: [text, x, y, width] */
        const linesOf = (blocks: readonly BlockLayout[]): readonly (readonly [string, number, number, number])[] =>
            blocks.flatMap((block) =>
                block.type === "paragraph" ? block.lines.map(({ text, x, y, width }) => [text, x, y, width] as const) : [],
            );
        /** A paragraph of words of 3 letters, one to a line in a column of 35 points */
        const short = (name: string, words: number, format: ParagraphFormat = {}): ParagraphBlock => ({
            ...paragraph(name, 0, format),
            items: [
                { type: "marker", name },
                { type: "text", text: Array.from({ length: words }, () => "aaa").join(" "), font: {} },
            ],
        });
        const TWO_COLUMNS: Section = { ...SECTION, columns: [35, 35] };

        it("should give each page its number, size and section, and the lines of its paragraphs, with their text and where they are", () => {
            // b's last 2 lines go on the second page, so its last line isn't alone there
            const pages = pagesLaidOut(document([paragraph("a", 2), paragraph("b", 6)]));
            expect(pages).to.have.length(2);
            expect(pages[0]).to.deep.include({ pageNumber: "1", section: 0, width: 100, height: 90, footnotes: [], endnotes: [] });
            expect(pages[0].body[0]).to.deep.equal({
                type: "paragraph",
                index: 0,
                lines: [
                    { text: "abcdefgh ", x: 10, y: 10, width: 80, height: 10, textWidth: 80 },
                    { text: "abcdefgh", x: 10, y: 20, width: 80, height: 10, textWidth: 80 },
                ],
            });
            expect(pages[0].body.map(({ index }) => index)).to.deep.equal([0, 1]);
            expect(linesOf(pages[0].body).map(([, , y]) => y)).to.deep.equal([10, 20, 30, 40, 50, 60]);
            // The paragraph has the same index on the page it goes on to
            expect(pages[1].body).to.have.length(1);
            expect(pages[1].body[0].index).to.equal(1);
            expect(linesOf(pages[1].body).map(([, , y]) => y)).to.deep.equal([10, 20]);
        });

        it("should put lines between their paragraph's indents, in their column, after the gutter", () => {
            const indented = short("a", 2, { indentLeft: 5, indentRight: 5, firstLineIndent: 5 });
            const [page] = pagesLaidOut(document([indented]));
            expect(linesOf(page.body)).to.deep.equal([
                ["aaa ", 20, 10, 65],
                ["aaa", 15, 20, 70],
            ]);
            // 8 lines in 2 columns of 35 points, 10 apart: 6 and 2, with widow control
            const [columns] = pagesLaidOut(document([short("b", 8)], { sections: [TWO_COLUMNS] }));
            expect(linesOf(columns.body).map(([, x, y]) => [x, y])).to.deep.equal([
                [10, 10],
                [10, 20],
                [10, 30],
                [10, 40],
                [10, 50],
                [10, 60],
                [55, 10],
                [55, 20],
            ]);
            expect(columns.body).to.have.length(1);
            const [guttered] = pagesLaidOut(document([short("c", 1)], { sections: [{ ...SECTION, gutter: 5, columns: [75] }] }));
            expect(linesOf(guttered.body)).to.deep.equal([["aaa", 15, 10, 75]]);
        });

        it("should give the lines where columns evened out before a continuous section break end up", () => {
            const [page] = pagesLaidOut(
                document(
                    [
                        [short("a", 1), 0],
                        [short("b", 1), 0],
                        [short("c", 1), 0],
                        [short("d", 1), 0],
                        [short("e", 1), 1],
                    ],
                    { sections: [TWO_COLUMNS, { ...SECTION, start: "continuous" }] },
                ),
            );
            expect(linesOf(page.body).map(([, x, y]) => [x, y])).to.deep.equal([
                [10, 10],
                [10, 20],
                [55, 10],
                [55, 20],
                [10, 30],
            ]);
            expect(page.body.map(({ index }) => index)).to.deep.equal([0, 1, 2, 3, 4]);
        });

        it("should give the rows of tables, and the parts of those broken across pages, with header rows repeated on each page", () => {
            const rows = Array.from({ length: 7 }, (_, index) => row([[paragraph(`row${index}`, 1)]]));
            const pages = pagesLaidOut(
                document([table([row([[paragraph("header", 1)]], { header: true }), ...rows]), paragraph("after", 1)]),
            );
            expect(pages[0].body).to.deep.equal([
                {
                    type: "table",
                    index: 0,
                    rows: [0, 1, 2, 3, 4, 5, 6].map((index) => ({ index, y: 10 + index * 10, height: 10 })),
                },
            ]);
            expect(pages[1].body).to.deep.equal([
                {
                    type: "table",
                    index: 0,
                    rows: [
                        { index: 0, y: 10, height: 10 },
                        { index: 7, y: 20, height: 10 },
                    ],
                },
                { type: "paragraph", index: 1, lines: [{ text: "abcdefgh", x: 10, y: 30, width: 80, height: 10, textWidth: 80 }] },
            ]);
            // A row of 4 lines after 5 goes 2 and 2
            const split = pagesLaidOut(document([paragraph("a", 5), table([row([[paragraph("cell", 4)]])])]));
            expect(split.map(({ body }) => body[body.length - 1])).to.deep.equal([
                { type: "table", index: 1, rows: [{ index: 0, y: 60, height: 20 }] },
                { type: "table", index: 1, rows: [{ index: 0, y: 10, height: 20 }] },
            ]);
            // A row that moves to the next page whole
            const moved = pagesLaidOut(document([paragraph("a", 6), table([row([[paragraph("cell", 2)]], { cantSplit: true })])]));
            expect(moved[1].body).to.deep.equal([{ type: "table", index: 1, rows: [{ index: 0, y: 10, height: 20 }] }]);
        });

        it("should give the footnotes at the bottom of each page, with their numbers, and the rest of one continued from the page before first", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            const content = document(
                [
                    paragraph("a", 3),
                    withItems(paragraph("b", 1), [{ type: "marker", name: "footnote 1" }]),
                    withItems(paragraph("c", 1), [{ type: "marker", name: "footnote 2" }]),
                    paragraph("d", 1),
                ],
                {
                    footnotes: new Map<string, readonly Block[]>([
                        ["footnote 1", [paragraph("note", 5)]],
                        ["footnote 2", [table([row([[paragraph("cell", 1)]])])]],
                    ]),
                    footnoteSeparator: [SEPARATOR],
                    footnoteContinuationSeparator: [SEPARATOR],
                    footnoteNumbers: new Map([
                        ["footnote 1", "1"],
                        ["footnote 2", "2"],
                    ]),
                },
            );
            const pages = pagesLaidOut(content);
            // Below b, the separator and 2 of the footnote's lines fill the page, from 50 to 80
            expect(pages[0].footnotes).to.deep.equal([
                {
                    noteNumber: "1",
                    content: [
                        {
                            type: "paragraph",
                            index: 0,
                            lines: [
                                { text: "abcdefgh ", x: 10, y: 60, width: 80, height: 10, textWidth: 80 },
                                { text: "abcdefgh ", x: 10, y: 70, width: 80, height: 10, textWidth: 80 },
                            ],
                        },
                    ],
                },
            ]);
            // The rest of it, below the continuation separator from 30, then c's footnote, a table
            expect(pages[1].footnotes).to.deep.equal([
                {
                    noteNumber: "1",
                    content: [
                        {
                            type: "paragraph",
                            index: 0,
                            lines: [40, 50, 60].map((y, line) => ({
                                text: line === 2 ? "abcdefgh" : "abcdefgh ",
                                x: 10,
                                y,
                                width: 80,
                                height: 10,
                                textWidth: 80,
                            })),
                        },
                    ],
                },
                {
                    noteNumber: "2",
                    content: [{ type: "table", index: 0, rows: [{ index: 0, y: 70, height: 10 }] }],
                },
            ]);
            // c and d fill the room above them
            expect(pages[1].body.map(({ index }) => index)).to.deep.equal([2, 3]);
            expect(pages).to.have.length(2);
        });

        it("should give the endnotes after the body, with their numbers, without their separator", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            const first = paragraph("first", 2);
            const second = paragraph("second", 1);
            const third = table([row([[paragraph("cell", 1)]])]);
            const pages = pagesLaidOut(
                document([paragraph("a", 5)], {
                    endnotes: [SEPARATOR, first, second, third],
                    endnoteNumbers: new Map<Block, string>([
                        [first, "i"],
                        [second, "i"],
                        [third, "ii"],
                    ]),
                }),
            );
            // The separator would be the last line of the first page, with no line of an endnote below it, so it goes to the
            // next with them, where it is their first line
            expect(pages[0].endnotes).to.deep.equal([]);
            expect(pages[1].body).to.deep.equal([]);
            expect(pages[1].endnotes).to.deep.equal([
                {
                    noteNumber: "i",
                    content: [
                        {
                            type: "paragraph",
                            index: 0,
                            lines: [
                                { text: "abcdefgh ", x: 10, y: 20, width: 80, height: 10, textWidth: 80 },
                                { text: "abcdefgh", x: 10, y: 30, width: 80, height: 10, textWidth: 80 },
                            ],
                        },
                        { type: "paragraph", index: 1, lines: [{ text: "abcdefgh", x: 10, y: 40, width: 80, height: 10, textWidth: 80 }] },
                    ],
                },
                { noteNumber: "ii", content: [{ type: "table", index: 0, rows: [{ index: 0, y: 50, height: 10 }] }] },
            ]);
        });

        it("should put the continuation separator above the endnotes on each page after the first, and fill the page below it, as Word does", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            // A line tall, as it is read (`readEndnoteSeparator`)
            const CONTINUATION = SEPARATOR;
            /** The endnotes' lines' tops on each page, after a line of text, with endnotes of these numbers of lines */
            const endnoteTops = (
                lengths: readonly number[],
                continuation: readonly Block[] = [CONTINUATION],
            ): ReturnType<typeof paginate> & {
                readonly tops: readonly (readonly number[])[];
            } => {
                const notes = lengths.map((length, index) => paragraph(`note${index}`, length));
                const laidOut = paginate(
                    document([paragraph("a", 1)], {
                        endnotes: [SEPARATOR, ...notes],
                        endnoteContinuationSeparator: continuation,
                        endnoteNumbers: new Map<Block, string>(notes.map((note, index) => [note, String(index)])),
                    }),
                    { measurer: MEASURER },
                );
                const tops = laidOut.pages.map((page) => page.endnotes.flatMap(({ content }) => linesOf(content).map(([, , y]) => y)));
                return { ...laidOut, tops };
            };
            // An endnote that goes on to the next page goes on below the continuation separator, and so does the one after
            // it (`word-watertight-pages.docx` PG8)
            expect(endnoteTops([7, 4]).tops).to.deep.equal([
                [30, 40, 50, 60, 70],
                [20, 30, 40, 50, 60, 70],
            ]);
            // And one that starts the next page, after one that ends this one (SC4)
            expect(endnoteTops([5, 4]).tops).to.deep.equal([
                [30, 40, 50, 60, 70],
                [20, 30, 40, 50],
            ]);
            // A taller one, in larger text, pushes them down
            expect(endnoteTops([5, 3], [{ ...CONTINUATION, markFont: { size: 20 } }]).tops[1]).to.deep.equal([30, 40, 50]);
            // One Word hasn't been seen laying out stops the layout where it would go
            const unknown = endnoteTops(
                [5, 3],
                [{ ...CONTINUATION, unsupported: "an endnote separator with text in it, or of more than a paragraph" }],
            );
            expect(unknown.stoppedAt).to.equal("an endnote separator with text in it, or of more than a paragraph");
            expect(unknown.tops[1]).to.deep.equal([]);
            // Below it, as many lines as fit on a page without it, the last going past the margin by as much as it takes
            // (`word-watertight-endnotes1.docx` to `3`)
            const filled = endnoteTops([5, 16]);
            expect(filled.stoppedAt).to.equal(undefined);
            expect(filled.tops.slice(1)).to.deep.equal([
                [20, 30, 40, 50, 60, 70, 80],
                [20, 30, 40, 50, 60, 70, 80],
                [20, 30],
            ]);
        });

        it("should keep endnote paragraphs with the next on a page below the continuation separator", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            const blocks = [paragraph("p", 3), paragraph("kept", 1, { keepNext: true }), paragraph("m", 3)];
            const pages = pagesLaidOut(
                document([paragraph("a", 1)], {
                    endnotes: [SEPARATOR, ...blocks],
                    endnoteContinuationSeparator: [SEPARATOR],
                    endnoteNumbers: new Map<Block, string>(blocks.map((block) => [block, "i"])),
                }),
            );
            // kept and m don't fit below p, so they go on the next page, below the continuation separator
            expect(pages[1].endnotes[0].content.map((block) => [block.index, linesOf([block])[0][2]])).to.deep.equal([
                [1, 20],
                [2, 30],
            ]);
            // With a paragraph kept together after them as tall as a page with kept, they still go there, as the
            // continuation separator takes no room from the endnotes below it
            const together = [paragraph("p", 3), paragraph("kept", 1, { keepNext: true }), paragraph("m", 6, { keepLines: true })];
            const moved = pagesLaidOut(
                document([paragraph("a", 1)], {
                    endnotes: [SEPARATOR, ...together],
                    endnoteContinuationSeparator: [SEPARATOR],
                    endnoteNumbers: new Map<Block, string>(together.map((block) => [block, "i"])),
                }),
            );
            expect(moved[1].endnotes[0].content.map((block) => linesOf([block]).map(([, , y]) => y))).to.deep.equal([
                [20],
                [30, 40, 50, 60, 70, 80],
            ]);
        });

        it("should stop at endnotes after text in columns, which Word evens out above them", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            const note = paragraph("note", 10);
            const columns = (body: number): ReturnType<typeof paginate> =>
                paginate(
                    document([paragraph("a", body)], {
                        sections: [{ ...SECTION, columns: [80, 80] }],
                        endnotes: [SEPARATOR, note],
                        endnoteContinuationSeparator: [SEPARATOR],
                        endnoteNumbers: new Map<Block, string>([[note, "i"]]),
                    }),
                    { measurer: MEASURER },
                );
            // Word evens out the columns before them, which isn't followed (`word-stops-endnotes.docx` NE1), when they fit too
            expect(columns(1).stoppedAt).to.equal("endnotes after text in columns");
            expect(columns(7).stoppedAt).to.equal("endnotes after text in columns");
            const fitting = paginate(
                document([paragraph("a", 1)], {
                    sections: [{ ...SECTION, columns: [80, 80] }],
                    endnotes: [SEPARATOR, paragraph("short", 1)],
                    endnoteNumbers: new Map<Block, string>([[note, "i"]]),
                }),
                { measurer: MEASURER },
            );
            expect(fitting.stoppedAt).to.equal("endnotes after text in columns");
        });

        it("should say which header and footer each page shows, and give the blank page before an odd page section neither, as Word does", () => {
            const pages = pagesLaidOut(
                document(
                    [
                        [paragraph("a", 1), 0],
                        [paragraph("b", 8), 1],
                    ],
                    {
                        sections: [
                            { ...SECTION, headers: { default: [paragraph("header", 1)] }, footers: { default: [paragraph("footer", 1)] } },
                            {
                                ...SECTION,
                                start: "oddPage",
                                titlePage: true,
                                numberFormat: "lowerRoman",
                                headers: { first: [paragraph("first", 1)], even: [paragraph("even", 1)] },
                            },
                        ],
                        evenAndOddHeaders: true,
                    },
                ),
            );
            expect(pages.map(({ pageNumber, section, header, footer }) => ({ pageNumber, section, header, footer }))).to.deep.equal([
                { pageNumber: "1", section: 0, header: "default", footer: "default" },
                { pageNumber: "2", section: 0, header: undefined, footer: undefined },
                { pageNumber: "iii", section: 1, header: "first", footer: undefined },
                { pageNumber: "iv", section: 1, header: "even", footer: undefined },
            ]);
            expect(pages[1]).to.not.have.any.keys("header", "footer");
            expect(pages[1].body).to.deep.equal([]);
        });

        it("should leave a blank page before a section on an even page by the number the page would have without its own, as Word does", () => {
            // After 2 pages, the third is odd, so a section that starts on an even page numbered from 2 starts on the fourth
            const content = document(
                [
                    [paragraph("a", 8), 0],
                    [paragraph("b", 1), 1],
                ],
                { sections: [SECTION, { ...SECTION, start: "evenPage", firstNumber: 2 }] },
            );
            expect(pagesLaidOut(content).map(({ pageNumber }) => pageNumber)).to.deep.equal(["1", "2", "3", "2"]);
            expect(pagesOf(content)).to.deep.equal({ a: "1", b: "2" });
            expect(numbersOf(content).pageCount).to.equal(4);
        });

        it("should give the pages laid out before it stopped, with what was laid out on the last", () => {
            const { pages, stoppedAt } = paginate(document([paragraph("a", 8), { ...paragraph("b", 1), unsupported: "an equation" }]), {
                measurer: MEASURER,
            });
            expect(stoppedAt).to.equal("an equation");
            expect(pages.map(({ body }) => linesOf(body).length)).to.deep.equal([6, 2]);
            // Nothing is laid out when it stops at the first page
            expect(paginate(document([paragraph("a", 1)], { unsupported: "hyphenation" }), { measurer: MEASURER }).pages).to.deep.equal([]);
        });

        it("should leave out what is in columns being evened out when it stops there", () => {
            // A row of 4 lines beside a table with space between its cells, which goes in the first of the columns until they are
            // evened out to 2 lines, when it breaks across them and stops at the table in its first cell
            const spaced: TableBlock = {
                ...table([row([[paragraph("inner", 1)]]), row([[paragraph("r2", 1)]]), row([[paragraph("r3", 1)]])]),
                cellSpacing: 1,
            };
            const content = document(
                [
                    [paragraph("a", 1), 0],
                    [table([row([[spaced], [short("cell", 8)]])]), 1],
                    [paragraph("b", 1), 2],
                ],
                { sections: [SECTION, { ...SECTION, start: "continuous", columns: [35, 35] }, { ...SECTION, start: "continuous" }] },
            );
            const { pages, stoppedAt } = paginate(content, { measurer: MEASURER });
            expect(stoppedAt).to.equal("a table with space between its cells in a table cell across pages");
            expect(pages).to.have.length(1);
            expect(pages[0].body.map(({ type, index }) => [type, index])).to.deep.equal([["paragraph", 0]]);
        });

        it("should give footnotes in columns where Word lays them out, one after the other from the first column", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            const referring = withItems(short("a", 1), [
                { type: "marker", name: "footnote 1" },
                { type: "marker", name: "footnote 2" },
            ]);
            const [page] = pagesLaidOut(
                document([referring], {
                    sections: [TWO_COLUMNS],
                    footnotes: new Map<string, readonly Block[]>([
                        ["footnote 1", [short("one", 1)]],
                        ["footnote 2", [table([row([[short("two", 1)]])])]],
                    ]),
                    footnoteSeparator: [SEPARATOR],
                    footnoteContinuationSeparator: [SEPARATOR],
                    footnoteNumbers: new Map([
                        ["footnote 1", "1"],
                        ["footnote 2", "2"],
                    ]),
                }),
            );
            // Evened out, each column has the separator and one footnote, from 60 to the bottom of the page at 80
            expect(page.footnotes).to.deep.equal([
                {
                    noteNumber: "1",
                    content: [
                        { type: "paragraph", index: 0, lines: [{ text: "aaa", x: 10, y: 70, width: 35, height: 10, textWidth: 30 }] },
                    ],
                },
                { noteNumber: "2", content: [{ type: "table", index: 0, rows: [{ index: 0, y: 70, height: 10 }] }] },
            ]);
        });

        it("should give the footnotes of a page in the width they were laid out in, that of the section referring to them", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            // A continuous section with a wider left margin below the first, on the same page, whose text is 70 points wide
            const [page] = pagesLaidOut(
                document(
                    [
                        [paragraph("a", 1), 0],
                        [withItems(short("b", 1), [{ type: "marker", name: "footnote 1" }]), 1],
                    ],
                    {
                        sections: [SECTION, { ...SECTION, start: "continuous", marginLeft: 20 }],
                        footnotes: new Map([["footnote 1", [short("note", 3)]]]),
                        footnoteSeparator: [SEPARATOR],
                        footnoteContinuationSeparator: [SEPARATOR],
                        footnoteNumbers: new Map([["footnote 1", "1"]]),
                    },
                ),
            );
            // "aaa aaa aaa" is 110 points, so it wraps once in 70 points as in 80: the lines are the second section's
            expect(linesOf(page.footnotes[0].content)).to.deep.equal([
                ["aaa aaa ", 20, 60, 70],
                ["aaa", 20, 70, 70],
            ]);
        });

        it("should give no number for a page whose number starts with a chapter number, which isn't known for the page", () => {
            const [page] = pagesLaidOut(
                document([paragraph("a", 1)], { sections: [{ ...SECTION, chapters: { level: 1, separator: "-" } }] }),
            );
            expect(page).to.not.have.any.keys("pageNumber");
            expect(page.body).to.have.length(1);
        });

        it("should give the page it stops on because Word might lay it out differently with nothing on it", () => {
            // A footnote in a section that starts in the next column, none of which fits below the first column
            const { pages, stoppedAt } = paginate(
                document(
                    [
                        [short("a", 7), 0],
                        [withItems(short("b", 1), [{ type: "marker", name: "footnote 1" }]), 1],
                    ],
                    {
                        sections: [
                            { ...SECTION, columns: [35, 35] },
                            { ...SECTION, columns: [35, 35], start: "nextColumn" },
                        ],
                        footnotes: new Map([["footnote 1", [short("one", 1)]]]),
                    },
                ),
                { measurer: MEASURER },
            );
            expect(stoppedAt).to.equal("a footnote across pages in columns");
            expect(pages.map(({ body, footnotes }) => [body.length, footnotes.length])).to.deep.equal([[0, 0]]);
        });

        it("should give the part of a footnote longer than a page on each page it fills", () => {
            const SEPARATOR: ParagraphBlock = { type: "paragraph", items: [], format: {}, tabStops: [], markFont: {} };
            // A footnote of 20 lines from the page's second line: 4 below b, 6 on each of the next 2 pages, below the
            // continuation separator, and 4 on the fourth, below c
            const pages = pagesLaidOut(
                document(
                    [
                        paragraph("a", 1),
                        withItems(paragraph("b", 1), [{ type: "marker", name: "footnote 1" }]),
                        paragraph("c", 2),
                        paragraph("d", 1),
                    ],
                    {
                        footnotes: new Map([["footnote 1", [paragraph("note", 20)]]]),
                        footnoteSeparator: [SEPARATOR],
                        footnoteContinuationSeparator: [SEPARATOR],
                        footnoteNumbers: new Map([["footnote 1", "1"]]),
                    },
                ),
            );
            expect(pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => linesOf(content)).length)).to.deep.equal([
                4, 6, 6, 4, 0,
            ]);
            expect(pages.map(({ body }) => body.length)).to.deep.equal([2, 0, 0, 1, 1]);
            // The pages of footnote alone have it from the line below the separator to the bottom
            expect(linesOf(pages[1].footnotes[0].content).map(([, , y]) => y)).to.deep.equal([20, 30, 40, 50, 60, 70]);
            expect(pages[1].footnotes[0].noteNumber).to.equal("1");
        });
    });

    describe("drawings that text flows around", () => {
        // Pages 200 points square, with 10-point margins: 18 characters to a line, and 18 lines to a page
        const PAGE: Section = { ...SECTION, pageWidth: 200, pageHeight: 200, columns: [180] };
        const NONE = { top: 0, bottom: 0, left: 0, right: 0 };
        /** A drawing 50 points wide and 30 tall, at the right of the margins and the top of its paragraph, unless it says otherwise */
        const floating = (drawing: Partial<FloatingDrawing> = {}): LayoutItem => ({
            type: "drawing",
            drawing: {
                wrap: "square",
                side: "bothSides",
                width: 50,
                height: 30,
                effects: NONE,
                distances: NONE,
                horizontal: { from: "margin", align: "right" },
                vertical: { from: "paragraph", offset: 0 },
                mayOverlap: true,
                ...drawing,
            },
        });
        /** A paragraph of words of 4 letters, 3 to a line of the page, with what is given before them */
        const prose = (name: string, words: number, before: readonly LayoutItem[] = [], format: ParagraphFormat = {}): ParagraphBlock => ({
            ...paragraph(name, 0, format),
            items: [
                { type: "marker", name },
                ...before,
                { type: "text", text: Array.from({ length: words }, () => "abcd").join(" "), font: {} },
            ],
        });
        const laidOut = (blocks: readonly (Block | readonly [Block, number])[], changes: Partial<DocumentContent> = {}): Pagination =>
            paginate(document(blocks, { sections: [PAGE], ...changes }), { measurer: MEASURER });
        /** Each page's lines: where each starts across the page and is down it, and how wide its room is */
        const roomsOf = (
            blocks: readonly (Block | readonly [Block, number])[],
            changes: Partial<DocumentContent> = {},
        ): readonly (readonly (readonly [number, number, number])[])[] =>
            laidOut(blocks, changes).pages.map(({ body }) =>
                body.flatMap((block) => (block.type === "paragraph" ? block.lines.map(({ x, y, width }) => [x, y, width] as const) : [])),
            );
        const stopOf = (
            blocks: readonly (Block | readonly [Block, number])[],
            changes: Partial<DocumentContent> = {},
        ): string | undefined => laidOut(blocks, changes).stoppedAt;

        it("should stop at a line beside a drawing in a gap narrower than 135 points in compatibility mode, as Word 2010 leaves one empty", () => {
            // word-stops-compat-14.docx CM14: a gap of 1000 twips beside a frame Word 2013 puts text in and 2010 doesn't, and
            // CM9: one of 2700 beside a picture both do. Here a gap of 130 points, and on a page 400 wide, gaps of 150 and 180
            const older = { compatibilityMode: 14 };
            expect(stopOf([prose("a", 12, [floating()])], older)).to.equal(
                "a line beside a drawing or frame in a gap narrower than 135 points, in a document in compatibility mode",
            );
            expect(stopOf([prose("a", 12, [floating()])])).to.equal(undefined);
            const wide = { ...older, sections: [{ ...PAGE, pageWidth: 400, columns: [380] }] };
            expect(stopOf([prose("a", 12, [floating({ horizontal: { from: "margin", offset: 150 } })])], wide)).to.equal(undefined);
        });

        it("should narrow the lines beside a drawing, with its distances from the text, as Word does (F1, F3)", () => {
            // From 140 to 190 across and 10 to 40 down: 3 lines beside it, 2 words to each
            expect(roomsOf([prose("a", 12, [floating()])])).to.deep.equal([
                [
                    [10, 10, 130],
                    [10, 20, 130],
                    [10, 30, 130],
                    [10, 40, 180],
                    [10, 50, 180],
                ],
            ]);
            // 15 down from the paragraph's top, 5 from the text around it: from 20 to 60 down, beside the lines from 20 to 50
            const distant = floating({ vertical: { from: "paragraph", offset: 15 }, distances: { top: 5, bottom: 5, left: 5, right: 5 } });
            expect(roomsOf([prose("a", 15, [distant])])[0].map(([, y, width]) => [y, width])).to.deep.equal([
                [10, 180],
                [20, 125],
                [30, 125],
                [40, 125],
                [50, 125],
                [60, 180],
                [70, 180],
            ]);
            // On its left, the lines start beside it
            expect(roomsOf([prose("a", 9, [floating({ horizontal: { from: "margin", align: "left" } })])])[0][0]).to.deep.equal([
                60, 10, 130,
            ]);
        });

        it("should put text on both sides of a drawing, the left first, and leave a side the next word doesn't fit on empty (F9, F13)", () => {
            const both = laidOut([prose("a", 9, [floating({ width: 60, horizontal: { from: "margin", align: "center" } })])]);
            expect(
                both.pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines : [])).slice(0, 4),
            ).to.deep.include.members([
                { text: "abcd ", x: 10, y: 10, width: 60, height: 10, textWidth: 40 },
                { text: "abcd ", x: 130, y: 10, width: 60, height: 10, textWidth: 40 },
            ]);
            // 35 points left of it, where a word of 40 doesn't fit
            const gap = laidOut([prose("a", 6, [floating({ horizontal: { from: "margin", offset: 35 } })])]);
            expect(
                gap.pages[0].body.flatMap((block) => (block.type === "paragraph" ? block.lines : [])).map(({ text, x }) => [text, x]),
            ).to.deep.equal([
                ["", 10],
                ["abcd abcd ", 95],
                ["", 10],
                ["abcd abcd ", 95],
                ["", 10],
                ["abcd abcd", 95],
            ]);
            // Or on one side only
            const right = floating({ width: 60, side: "right", horizontal: { from: "margin", align: "center" } });
            expect(roomsOf([prose("a", 3, [right])])[0]).to.deep.equal([
                [130, 10, 60],
                [130, 20, 60],
                [130, 30, 60],
            ]);
        });

        it("should make a row of lines either side of a drawing as tall as the tallest of them", () => {
            const block: ParagraphBlock = {
                ...paragraph("a", 0),
                items: [
                    floating({ width: 60, horizontal: { from: "margin", align: "center" } }),
                    { type: "text", text: "abcd ", font: {} },
                    { type: "text", text: "abcd", font: { size: 20 } },
                    { type: "text", text: " abcd", font: {} },
                ],
            };
            // The second line, on the right of the drawing, is 20 tall, and the third goes below the row
            expect(
                laidOut([block])
                    .pages[0].body.flatMap((one) => (one.type === "paragraph" ? one.lines : []))
                    .map(({ y, height }) => [y, height]),
            ).to.deep.equal([
                [10, 10],
                [10, 20],
                [30, 10],
            ]);
        });

        it("should go on with a paragraph beside a drawing on the next page, its lines there as wide as the page's text", () => {
            const pages = roomsOf([prose("a", 60, [floating()])]);
            expect(pages[0].slice(0, 4).map(([, , width]) => width)).to.deep.equal([130, 130, 130, 180]);
            expect(pages[1].every(([, , width]) => width === 180)).to.equal(true);
            // A page laid out again for a drawing beside text before it, from a paragraph that goes on from the page before
            const byPage = floating({ vertical: { from: "page", offset: 20 } });
            const again = roomsOf([prose("x", 57), prose("a", 9), prose("b", 3, [byPage])]);
            // The paragraph before goes on to the page with its last 2 lines, as widow control keeps them together, and the page
            // is laid out again from its start, on the page before
            expect(again[1].map(([, y, width]) => [y, width])).to.deep.equal([
                [10, 180],
                [20, 130],
                [30, 130],
                [40, 130],
                [50, 180],
                [60, 180],
                [70, 180],
                [80, 180],
            ]);
        });

        it("should move lines below a drawing with text above and below it, with the paragraph's space before below it (F5, F37)", () => {
            const above = floating({ wrap: "topAndBottom", horizontal: { from: "margin", align: "left" } });
            // The paragraph's top is 20 down, with the drawing from there to 50, and its first line 15 below that
            expect(roomsOf([prose("x", 1), prose("a", 6, [above], { spaceBefore: 15 })])[0]).to.deep.equal([
                [10, 10, 180],
                [10, 65, 180],
                [10, 75, 180],
            ]);
            // The lines further down a paragraph than its top go down below it, without the space
            const lower = floating({ wrap: "topAndBottom", vertical: { from: "paragraph", offset: 15 } });
            expect(roomsOf([prose("a", 9, [lower])])[0].map(([, y]) => y)).to.deep.equal([10, 55, 65]);
            // One as wide as the text with square wrapping too (F33)
            expect(roomsOf([prose("a", 3, [floating({ width: 180 })])])[0]).to.deep.equal([[10, 40, 180]]);
            // One in the margin leaves the lines as they are, with text above and below it or not (F7, F8)
            const margin = floating({ wrap: "topAndBottom", width: 5, horizontal: { from: "page", offset: 192 } });
            expect(roomsOf([prose("a", 3, [margin])])[0]).to.deep.equal([[10, 10, 180]]);
        });

        it("should start the lines beside a drawing at its edge or the left indent, whichever is further in, and indent the first line from there (F30)", () => {
            const left = floating({ width: 40, horizontal: { from: "margin", align: "left" } });
            expect(roomsOf([prose("a", 12, [left], { indentLeft: 20 })])[0]).to.deep.equal([
                [50, 10, 140],
                [50, 20, 140],
                [50, 30, 140],
                [30, 40, 160],
            ]);
            expect(roomsOf([prose("a", 6, [left], { firstLineIndent: 20 })])[0].slice(0, 2)).to.deep.equal([
                [70, 10, 120],
                [50, 20, 140],
            ]);
            // A line whose only room beside a drawing its indents leave none of goes below the drawing
            const wide = floating({ width: 140, horizontal: { from: "margin", align: "left" } });
            expect(roomsOf([prose("a", 3, [wide], { indentRight: 50 })])[0]).to.deep.equal([
                [10, 40, 130],
                [10, 50, 130],
            ]);
            // Lines the indents leave no room are as they are without the drawing
            expect(roomsOf([prose("a", 1, [floating()], { indentLeft: 100, indentRight: 100 })])[0]).to.deep.equal([[110, 10, -20]]);
        });

        it("should place a drawing against its anchor's line as it is laid out before it, though the text then moves the anchor on (F16)", () => {
            const block: ParagraphBlock = {
                ...paragraph("a", 0),
                items: [
                    { type: "text", text: "abcd abcd abcd abcd abcd abcd", font: {} },
                    floating({ vertical: { from: "line", offset: 0 } }),
                    { type: "text", text: " abcd abcd abcd abcd abcd abcd", font: {} },
                ],
            };
            // The anchor is after the 6th word, at the end of the second line, which the drawing narrows so that the word goes
            // on to the third
            expect(roomsOf([block])[0].slice(0, 5)).to.deep.equal([
                [10, 10, 180],
                [10, 20, 130],
                [10, 30, 130],
                [10, 40, 130],
                [10, 50, 180],
            ]);
        });

        it("should keep a drawing placed against its paragraph from going above the page's text (F38b, F38c)", () => {
            const effects = { top: 15, bottom: 15, left: 0, right: 0 };
            // Its effects would go 15 above the top of the page's text, so it goes 15 down, to 25: beside the lines from 10 to 70
            expect(roomsOf([prose("a", 18, [floating({ effects })])])[0].map(([, , width]) => width)).to.deep.equal([
                130, 130, 130, 130, 130, 130, 180, 180,
            ]);
            expect(stopOf([prose("a", 18, [floating({ effects, distances: { ...NONE, top: 1 } })])])).to.equal(
                "a drawing that would go above the page's text, with a distance from the text above it",
            );
        });

        it("should lay the page out again when a drawing is beside text before its paragraph, which goes round it too (F18, F35)", () => {
            const byPage = floating({ vertical: { from: "page", offset: 20 } });
            // 20 to 50 down the page, beside the second to fourth lines of the paragraph before
            const pagination = laidOut([prose("a", 9), prose("b", 3, [byPage])]);
            expect(roomsOf([prose("a", 9), prose("b", 3, [byPage])])[0]).to.deep.equal([
                [10, 10, 180],
                [10, 20, 130],
                [10, 30, 130],
                [10, 40, 130],
                [10, 50, 180],
            ]);
            expect(pagination.bookmarks).to.deep.equal(
                new Map([
                    ["a", "1"],
                    ["b", "1"],
                ]),
            );
            // Placed against its paragraph, it stays where it was first placed, from 20 to 50, though its paragraph moves down to
            // 50 as the lines before it go round it (G4)
            const aboveIt = floating({ vertical: { from: "paragraph", offset: -20 } });
            expect(roomsOf([prose("a", 9), prose("b", 3, [aboveIt])])[0].map(([, y, width]) => [y, width])).to.deep.equal([
                [10, 180],
                [20, 130],
                [30, 130],
                [40, 130],
                [50, 180],
            ]);
            // And with text above and below it, the lines before it that its distance above it reaches go below it (G4)
            const distant = floating({
                wrap: "topAndBottom",
                distances: { ...NONE, top: 5 },
                horizontal: { from: "margin", align: "left" },
            });
            expect(roomsOf([prose("a", 6), prose("b", 3, [distant])])[0].map(([, y]) => y)).to.deep.equal([10, 60, 70]);
        });

        it("should move a paragraph to the next page with a drawing that would go past the bottom of the page's text (F20, F36)", () => {
            const fill = Array.from({ length: 15 }, (_, index) => prose(`f${index}`, 3));
            // From 160 down, it would go to 210, past the bottom at 190
            const pages = roomsOf([...fill, prose("a", 6, [floating({ height: 50 })])]);
            expect(pages[1]).to.deep.equal([
                [10, 10, 130],
                [10, 20, 130],
                [10, 30, 130],
            ]);
            // Text above and below it, its first line below it doesn't fit on the page
            const below = floating({ wrap: "topAndBottom", height: 25 });
            expect(roomsOf([...fill, prose("a", 3, [below])])[1]).to.deep.equal([[10, 35, 180]]);
            // Where it goes at the top of a page, above footnotes, or past only by its distance, isn't known
            const past = "a drawing that moves with its paragraph past the bottom of the page's text";
            expect(stopOf([prose("a", 3, [floating({ height: 200 })])])).to.equal(past);
            expect(stopOf([...fill, prose("a", 3, [floating({ height: 25, distances: { ...NONE, bottom: 10 } })])])).to.equal(past);
            // In columns, to the top of the next column (G17)
            const lines = Array.from({ length: 15 }, (_, index) => prose(`l${index}`, 1));
            const sections = [{ ...PAGE, columns: [85, 85] }];
            expect(roomsOf([...lines, prose("a", 1, [floating({ width: 20, height: 50 })])], { sections })[0].at(-1)).to.deep.equal([
                105, 10, 65,
            ]);
            const noted = withItems(prose("n", 3), [{ type: "marker", name: "note" }]);
            expect(
                stopOf([noted, ...fill.slice(0, 12), prose("a", 3, [floating({ height: 50 })])], {
                    footnotes: new Map([["note", [prose("note", 1)]]]),
                }),
            ).to.equal(past);
        });

        it("should move a table that doesn't fit beside a drawing below it, and stop where it fits beside it (F40)", () => {
            const tall = floating({ height: 60 });
            const wide = table(
                [row([[prose("cell", 1)]]), row([[prose("cell", 1)]])].map((one) => ({
                    ...one,
                    cells: one.cells.map((cell) => ({ ...cell, width: 180 })),
                })),
            );
            const pagination = laidOut([prose("a", 2, [tall]), wide, prose("b", 3)]);
            expect(pagination.pages[0].body.flatMap((block) => (block.type === "table" ? block.rows.map(({ y }) => y) : []))).to.deep.equal(
                [70, 80],
            );
            const narrow = table(
                [row([[prose("cell", 1)]])].map((one) => ({ ...one, cells: one.cells.map((cell) => ({ ...cell, width: 100 })) })),
            );
            const rowsBelow = (blocks: readonly Block[]): readonly number[] =>
                laidOut(blocks).pages[0].body.flatMap((block) => (block.type === "table" ? block.rows.map(({ y }) => y) : []));
            // One that fits beside a drawing goes beside it, on the left or past one on the left (G14, G15)
            const left = floating({ height: 60, horizontal: { from: "margin", align: "left" } });
            expect(rowsBelow([prose("a", 2, [left]), narrow])).to.deep.equal([20]);
            expect(rowsBelow([prose("a", 2, [tall]), narrow])).to.deep.equal([20]);
            // At its indent, it must be beside the drawing: 40 in, it would go under the drawing on the right, so it goes
            // below it, and 5 out, it fits beside it
            expect(rowsBelow([prose("a", 2, [tall]), { ...narrow, indent: 40 }])).to.deep.equal([70]);
            expect(rowsBelow([prose("a", 2, [tall]), { ...narrow, indent: -5 }])).to.deep.equal([20]);
            // Indented past one on its left, it is beside it where it is, and where an indent puts one moved past it isn't known
            expect(rowsBelow([prose("a", 2, [left]), { ...narrow, indent: 60 }])).to.deep.equal([20]);
            expect(stopOf([prose("a", 2, [left]), { ...narrow, indent: 20 }])).to.equal(
                "an indented table moved past a drawing on its left",
            );
            // Whether Word sizes one sized to its text in the room beside it isn't known
            expect(stopOf([prose("a", 2, [left]), { ...narrow, fit: {} }])).to.equal(
                "a table sized to its text beside a drawing that text flows around",
            );
            // One that a drawing further down is beside goes below it
            const lower = floating({ vertical: { from: "page", offset: 30 } });
            expect(rowsBelow([prose("a", 1, [lower]), wide])).to.deep.equal([60, 70]);
            // With text above and below a drawing, one beside it goes below it, however narrow
            const across = floating({ wrap: "topAndBottom", vertical: { from: "page", offset: 25 } });
            expect(rowsBelow([prose("a", 1, [across]), narrow])).to.deep.equal([55]);
            // One before a drawing that is beside it is laid out again below it, with the drawing on the page from its top
            expect(rowsBelow([wide, prose("a", 2, [floating({ vertical: { from: "page", offset: 10 } })])])).to.deep.equal([40, 50]);
        });

        describe("tables that text flows around", () => {
            /**
             * A table of rows of a line, 80 wide with its borders of 2 points unless it says otherwise, at the left of the margins
             * and the top of the paragraph after it, 10 from the text right of it
             */
            const floatingTable = (float: Partial<TableFloat> = {}, width = 80): TableBlock => ({
                ...table(
                    Array.from({ length: 3 }, () => row([[prose("cell", 1)]])).map((one) => ({
                        ...one,
                        cells: one.cells.map((cell) => ({ ...cell, width: width - 2 })),
                    })),
                ),
                borderLeft: 2,
                borderRight: 2,
                float: {
                    horizontal: { from: "margin", align: "left" },
                    vertical: { from: "paragraph", offset: 0 },
                    distances: { ...NONE, right: 10 },
                    mayOverlap: true,
                    ...float,
                },
            });
            /** Each table row on the pages: its table's index, its own, and where it is down the page */
            const tableRowsOf = (pagination: Pagination): readonly (readonly [number, number, number])[] =>
                pagination.pages.flatMap(({ body }) =>
                    body.flatMap((block) =>
                        block.type === "table" ? block.rows.map(({ index, y }) => [block.index, index, y] as const) : [],
                    ),
                );

            it("should put the text after one beside it, placed against the top of the paragraph after it, as Word does (G24 to G29)", () => {
                // From 10 to 90 across and 10 to 40 down, before the paragraph after it, whose first 3 lines are beside it
                const beside = laidOut([floatingTable(), prose("a", 12)]);
                expect(beside.pages[0].body.map(({ type }) => type)).to.deep.equal(["table", "paragraph"]);
                expect(tableRowsOf(beside)).to.deep.equal([
                    [0, 0, 10],
                    [0, 1, 20],
                    [0, 2, 30],
                ]);
                expect(roomsOf([floatingTable(), prose("a", 12)])).to.deep.equal([
                    [
                        [100, 10, 90],
                        [100, 20, 90],
                        [100, 30, 90],
                        [10, 40, 180],
                        [10, 50, 180],
                    ],
                ]);
                // 10 below the top of the paragraph after it, after a line (G27)
                const lower = [prose("x", 1), floatingTable({ vertical: { from: "paragraph", offset: 10 } }), prose("a", 12)];
                expect(tableRowsOf(laidOut(lower)).map(([, , y]) => y)).to.deep.equal([30, 40, 50]);
                expect(roomsOf(lower)[0].map(([x, y]) => [x, y])).to.deep.equal([
                    [10, 10],
                    [10, 20],
                    [100, 30],
                    [100, 40],
                    [100, 50],
                    [10, 60],
                ]);
                // Placed against the page (G24)
                const byPage = [floatingTable({ vertical: { from: "page", offset: 100 } }), prose("a", 40)];
                expect(tableRowsOf(laidOut(byPage)).map(([, , y]) => y)).to.deep.equal([100, 110, 120]);
                expect(
                    roomsOf(byPage)[0]
                        .filter(([x]) => x === 100)
                        .map(([, y]) => y),
                ).to.deep.equal([100, 110, 120]);
                // Two before a paragraph, at the left and the right, with the text between them (G29)
                const two = [
                    floatingTable({ distances: { ...NONE, right: 5 } }, 50),
                    floatingTable({ horizontal: { from: "column", align: "right" }, distances: { ...NONE, left: 5 } }, 50),
                    prose("a", 6),
                ];
                expect(tableRowsOf(laidOut(two)).map(([index, , y]) => [index, y])).to.deep.equal([
                    [0, 10],
                    [0, 20],
                    [0, 30],
                    [1, 10],
                    [1, 20],
                    [1, 30],
                ]);
                expect(roomsOf(two)[0]).to.deep.equal([
                    [65, 10, 70],
                    [65, 20, 70],
                    [65, 30, 70],
                    [10, 40, 180],
                ]);
            });

            it("should make the room of one without borders left and right 0.75 points wider than its rows (H1, H8)", () => {
                const borderless = { ...floatingTable(), borderLeft: 0, borderRight: 0 };
                expect(roomsOf([borderless, prose("a", 6)])[0][0]).to.deep.equal([98.75, 10, 91.25]);
                // At the right, it starts 0.75 further left
                const right = {
                    ...borderless,
                    float: { ...borderless.float!, horizontal: { from: "margin", align: "right" }, distances: { ...NONE, left: 10 } },
                };
                expect(roomsOf([right, prose("a", 6)])[0][0]).to.deep.equal([10, 10, 91.25]);
                // How much room Word gives one with a border on one side only isn't known
                expect(stopOf([{ ...floatingTable(), borderRight: 0 }, prose("a", 3)])).to.equal(
                    "a table that text flows around with a border on one side only",
                );
            });

            it("should place one below the space after the paragraph before, and lay out the text before it again beside it", () => {
                // It is below the space after the paragraph before, and the paragraph after it has all of its space before below
                // that, as after a table, where the larger of the two would be between the paragraphs: 5 after and 10 before put
                // its first line 15 below the paragraph before (`word-floats3.docx` H9)
                const spaced = [prose("x", 1, [], { spaceAfter: 5 }), floatingTable(), prose("a", 6, [], { spaceBefore: 10 })];
                expect(tableRowsOf(laidOut(spaced)).map(([, , y]) => y)).to.deep.equal([25, 35, 45]);
                expect(roomsOf(spaced)[0]).to.deep.equal([
                    [10, 10, 180],
                    [100, 35, 90],
                    [100, 45, 90],
                    [10, 55, 180],
                ]);
                // Placed against the page beside the lines before it, they go round it too, as the page is laid out again
                const above = [prose("x", 6), floatingTable({ vertical: { from: "page", offset: 10 } }), prose("a", 12)];
                expect(tableRowsOf(laidOut(above)).map(([, , y]) => y)).to.deep.equal([10, 20, 30]);
                expect(roomsOf(above)[0].slice(0, 4)).to.deep.equal([
                    [100, 10, 90],
                    [100, 20, 90],
                    [100, 30, 90],
                    [10, 40, 180],
                ]);
            });

            it("should stop where Word's way with one hasn't been seen", () => {
                // Without a paragraph after it to place it against
                const without = "a table that text flows around without a paragraph after it";
                expect(stopOf([prose("x", 1), floatingTable()])).to.equal(without);
                expect(stopOf([floatingTable(), table([row([[prose("c", 1)]])])])).to.equal(without);
                const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
                expect(stopOf([floatingTable(), sectionBreak])).to.equal(without);
                expect(
                    stopOf(
                        [
                            [floatingTable(), 0],
                            [prose("a", 1), 1],
                        ],
                        { sections: [PAGE, PAGE] },
                    ),
                ).to.equal(without);
                // Going past the bottom of the page, which Word breaks across pages (G28)
                const fill = Array.from({ length: 16 }, (_, index) => prose(`f${index}`, 3));
                expect(stopOf([...fill, floatingTable(), prose("a", 3)])).to.equal(
                    "a table that text flows around going past the bottom of the page",
                );
                // Kept with the next, or before one kept with the next
                const kept = "a paragraph kept with the next with a table that text flows around";
                expect(stopOf([prose("h", 1, [], { keepNext: true }), floatingTable(), prose("a", 3)])).to.equal(kept);
                expect(stopOf([floatingTable(), prose("h", 1, [], { keepNext: true }), prose("a", 3)])).to.equal(kept);
                // With a footnote in it
                const noted = withItems(prose("n", 1), [{ type: "marker", name: "note" }]);
                expect(
                    stopOf([{ ...floatingTable(), rows: [row([[noted]])] }, prose("a", 3)], {
                        footnotes: new Map([["note", [prose("note", 1)]]]),
                    }),
                ).to.equal("a footnote in a table that text flows around");
                // Overlapping another that may not overlap it, which Word moves out of the way (G3)
                expect(stopOf([floatingTable({ mayOverlap: false }), floatingTable(), prose("a", 3)])).to.equal(
                    "drawings that text flows around that may not overlap, overlapping",
                );
            });

            it("should lay one out in the text where Word's way with it hasn't been seen, guessing", () => {
                /** The pages' tables' rows and lines, down the page, and what was guessed at */
                const guessed = (
                    blocks: readonly Block[],
                    changes: Partial<DocumentContent> = {},
                ): {
                    readonly placed: readonly (readonly (number | string)[])[];
                    readonly guesses: readonly string[];
                    readonly stoppedAt?: string;
                } => {
                    const { pages, stoppedAt } = paginate(document(blocks, { sections: [PAGE], ...changes }), {
                        measurer: MEASURER,
                        guess: true,
                    });
                    return {
                        placed: pages.flatMap(({ body }, page) =>
                            body.flatMap((block) =>
                                block.type === "table"
                                    ? block.rows.map(({ y }) => [page, "row", y])
                                    : block.lines.map(({ x, y }) => [page, "line", x, y]),
                            ),
                        ),
                        guesses: pages.flatMap((page) => page.guesses ?? []),
                        ...(stoppedAt === undefined ? {} : { stoppedAt }),
                    };
                };
                // Without a paragraph after it, it is laid out in the text
                expect(guessed([prose("x", 1), floatingTable()])).to.deep.equal({
                    placed: [
                        [0, "line", 10, 10],
                        [0, "row", 20],
                        [0, "row", 30],
                        [0, "row", 40],
                    ],
                    guesses: ["a table that text flows around without a paragraph after it"],
                });
                // Before a paragraph kept with the next, or as what a paragraph is kept with
                const kept = "a paragraph kept with the next with a table that text flows around";
                expect(guessed([floatingTable(), prose("h", 1, [], { keepNext: true }), prose("a", 1)])).to.deep.include({
                    placed: [
                        [0, "row", 10],
                        [0, "row", 20],
                        [0, "row", 30],
                        [0, "line", 10, 40],
                        [0, "line", 10, 50],
                    ],
                    guesses: [kept],
                });
                expect(guessed([prose("h", 1, [], { keepNext: true }), floatingTable(), prose("a", 1)]).guesses).to.deep.equal([kept]);
                // With a footnote in it
                const noted = withItems(prose("n", 1), [{ type: "marker", name: "note" }]);
                expect(
                    guessed([{ ...floatingTable(), rows: [row([[noted]])] }, prose("a", 1)], {
                        footnotes: new Map([["note", [prose("note", 1)]]]),
                    }).guesses,
                ).to.deep.equal(["a footnote in a table that text flows around"]);
                // Going past the bottom of the page, it is laid out in the text where the paragraph after it would start,
                // across the pages, and the paragraph after it
                const fill = Array.from({ length: 16 }, (_, index) => prose(`f${index}`, 3));
                const past = guessed([...fill, floatingTable(), prose("a", 1)]);
                expect(past.placed.slice(-4)).to.deep.equal([
                    [0, "row", 170],
                    [0, "row", 180],
                    [1, "row", 10],
                    [1, "line", 10, 20],
                ]);
                expect(past.guesses).to.deep.equal(["a table that text flows around going past the bottom of the page"]);
            });
        });

        it("should keep the text out of the room of drawings that overlap, and stop at those that may not overlap (G1 to G3)", () => {
            // The second from 20 to 50 down and 100 to 150 across: lines beside both go left of both, and those beside the
            // second only on both sides of it, after one beside the first only
            const second = floating({ vertical: { from: "paragraph", offset: 10 }, horizontal: { from: "margin", offset: 90 } });
            expect(roomsOf([prose("a", 15, [floating(), second])])[0].slice(0, 5)).to.deep.equal([
                [10, 10, 130],
                [10, 20, 90],
                [10, 30, 90],
                [10, 40, 90],
                [150, 40, 40],
            ]);
            const mayNot = floating({ vertical: { from: "paragraph", offset: 10 }, mayOverlap: false });
            expect(stopOf([prose("a", 3, [floating(), mayNot])])).to.equal(
                "drawings that text flows around that may not overlap, overlapping",
            );
        });

        it("should keep a paragraph kept with the next with the lines of the next beside drawings, and move it with a drawing that moves (G11 to G13)", () => {
            const fill = Array.from({ length: 15 }, (_, index) => prose(`f${index}`, 3));
            const heading = prose("h", 1, [], { keepNext: true });
            // The next paragraph's drawing would go past the bottom of the page, so it moves to the next page, and the
            // heading with it
            expect(roomsOf([...fill, heading, prose("a", 3, [floating({ height: 50 })])])[1].slice(0, 2)).to.deep.equal([
                [10, 10, 180],
                [10, 20, 130],
            ]);
            // Beside a drawing, the heading goes with the first 2 of the next paragraph's 4 lines beside it, where 3 lines
            // across the page wouldn't fit
            const besideIt = floating({ vertical: { from: "page", offset: 150 }, width: 90, height: 40 });
            const pages = roomsOf([...fill.slice(0, 14), prose("p", 1, [besideIt]), heading, prose("a", 8)]);
            expect(pages[0].slice(-3).map(([, y, width]) => [y, width])).to.deep.equal([
                [160, 90],
                [170, 90],
                [180, 90],
            ]);
            // A drawing anchored in a line after those it is kept with, which goes on to the next page with its anchor, doesn't
            // move it: the heading stays with the next paragraph's first 2 lines
            const later: ParagraphBlock = {
                ...paragraph("a", 0),
                items: [
                    { type: "text", text: Array.from({ length: 18 }, () => "abcd").join(" "), font: {} },
                    floating(),
                    { type: "text", text: " abcd abcd abcd", font: {} },
                ],
            };
            expect(roomsOf([...fill, heading, later])[0].slice(-3)).to.deep.equal([
                [10, 160, 180],
                [10, 170, 180],
                [10, 180, 180],
            ]);
            // Kept at the end of its section, it is kept with nothing
            const sectionBreak: ParagraphBlock = { ...paragraph("break", 0), items: [], sectionBreak: true };
            expect(
                stopOf(
                    [
                        [prose("a", 1, [floating({ height: 60 })]), 0],
                        [heading, 0],
                        [sectionBreak, 0],
                        [prose("b", 1), 1],
                    ],
                    { sections: [PAGE, { ...PAGE, start: "continuous" }] },
                ),
            ).to.equal(undefined);
            // Where those kept with the next have drawings of their own, or are kept with a table, how Word lays them out
            // hasn't been seen
            const kept = "a paragraph kept with the next beside a drawing, with a drawing of its own or before a table";
            expect(stopOf([prose("x", 1, [floating()], { keepNext: true }), prose("a", 3)])).to.equal(kept);
            expect(stopOf([prose("a", 1, [floating({ height: 60 })]), heading, table([row([[prose("cell", 1)]])])])).to.equal(kept);
        });

        it("should measure what is kept with the next beside drawings as it is laid out there", () => {
            // A heading 160 down, beside a drawing from 150 to 190, before paragraphs of 8 words, 2 to a line beside it: those
            // that need more than its 3 lines' room take it to the next page
            const fill = Array.from({ length: 14 }, (_, index) => prose(`f${index}`, 3));
            const besideIt = floating({ vertical: { from: "page", offset: 150 }, width: 90, height: 40 });
            const pageOf = (next: ParagraphBlock): string | undefined =>
                laidOut([...fill, prose("p", 1, [besideIt]), prose("h", 1, [], { keepNext: true }), next]).bookmarks.get("h");
            // Kept together, all 4 of its lines go with it, and without widow control only its first
            expect(pageOf(prose("a", 8, [], { keepLines: true }))).to.equal("2");
            expect(pageOf(prose("a", 8, [], { widowControl: false }))).to.equal("1");
            // A paragraph of one line with a border below it, all of it with the heading
            const bordered: ParagraphBlock = {
                ...prose("a", 1),
                borders: { top: 0, bottom: 5, between: 0, betweenSpace: 0, box: "box", outline: "box" },
            };
            expect(pageOf(bordered)).to.equal("1");
            // With a page break before it, which starts it on the next page whatever is kept with it
            expect(pageOf(prose("a", 8, [], { pageBreakBefore: true }))).to.equal("1");
            // A drawing of its own placed against the page, which doesn't move with it
            expect(
                laidOut([prose("h", 1, [], { keepNext: true }), prose("a", 3, [floating({ vertical: { from: "page", offset: 100 } })])])
                    .stoppedAt,
            ).to.equal(undefined);
            // Kept at the end of its section, with no paragraph after it, it is kept with nothing
            expect(
                stopOf(
                    [
                        [prose("a", 1, [floating({ height: 60 })]), 0],
                        [prose("h", 1, [], { keepNext: true }), 0],
                        [prose("b", 1), 1],
                    ],
                    { sections: [PAGE, { ...PAGE, start: "continuous" }] },
                ),
            ).to.equal(undefined);
        });

        it("should place a drawing at the top of its paragraph below the space after the paragraph before (G7 to G10)", () => {
            // 5 after the paragraph before and 10 before this one: its top is 25 down, and its first line 30 down, beside the
            // drawing from 25 to 55
            const after = prose("x", 1, [], { spaceAfter: 5 });
            expect(roomsOf([after, prose("a", 12, [floating()], { spaceBefore: 10 })])[0].map(([, y, width]) => [y, width])).to.deep.equal([
                [10, 180],
                [30, 130],
                [40, 130],
                [50, 130],
                [60, 180],
                [70, 180],
            ]);
            // With text above and below it, the paragraph's first line goes 5 below it, the part of the space before that is
            // its own
            const above = floating({ wrap: "topAndBottom", horizontal: { from: "margin", align: "left" } });
            expect(roomsOf([after, prose("a", 3, [above], { spaceBefore: 10 })])[0].map(([, y]) => y)).to.deep.equal([10, 60]);
        });

        it("should stop where Word's way with drawings hasn't been seen", () => {
            // A drawing placed against where it is along its line
            expect(stopOf([prose("a", 3, [floating({ horizontal: { from: "character", offset: 0 } })])])).to.equal(
                "a drawing placed against where it is anchored along its line",
            );
            // Placed where Word doesn't place drawings
            expect(stopOf([prose("a", 3, [floating({ horizontal: { from: "bogus", offset: 0 } })])])).to.equal(
                "a drawing placed against what isn't followed yet",
            );
        });

        it("should place a drawing anchored in a line that goes on to the next page at the top of its paragraph there (G20)", () => {
            const fill = Array.from({ length: 16 }, (_, index) => prose(`f${index}`, 3));
            // Anchored in the third of 4 lines, 2 of which fit on the page, it goes on the next with them, beside them
            const block = (drawing: LayoutItem): ParagraphBlock => ({
                ...paragraph("a", 0),
                items: [
                    { type: "text", text: "abcd abcd abcd abcd abcd abcd abcd", font: {} },
                    drawing,
                    { type: "text", text: " abcd abcd abcd abcd", font: {} },
                ],
            });
            const pages = roomsOf([...fill, block(floating())]);
            expect(pages[0].slice(-2)).to.deep.equal([
                [10, 170, 180],
                [10, 180, 180],
            ]);
            expect(pages[1]).to.deep.equal([
                [10, 10, 130],
                [10, 20, 130],
                [10, 30, 130],
            ]);
            // Placed against its line, it goes with it to the next page, at the top of the line
            expect(roomsOf([...fill, block(floating({ vertical: { from: "line", offset: 0 } }))])[1][0]).to.deep.equal([10, 10, 130]);
            // Where the lines laid out again without it bring its anchor back to the page, Word's way isn't known: beside a
            // drawing 90 wide, the 6th word ends the third line, and without it the second
            const narrowing = floating({ width: 90, height: 20, vertical: { from: "page", offset: 170 } });
            const back: ParagraphBlock = {
                ...paragraph("a", 0),
                items: [
                    { type: "text", text: "abcd abcd abcd abcd abcd abcd", font: {} },
                    narrowing,
                    { type: "text", text: " abcd abcd abcd abcd abcd abcd", font: {} },
                ],
            };
            expect(stopOf([...fill, back])).to.equal("a drawing whose anchor's page changes as the text goes round it");
        });

        it("should even columns out with drawings in them, and stop at a drawing beside a page's footnotes (G18, G21)", () => {
            const beside = "a drawing that text flows around beside the footnotes at the bottom of its page";
            const noted = withItems(prose("n", 3), [{ type: "marker", name: "note" }]);
            const low = floating({ vertical: { from: "page", offset: 170 } });
            const footnotes = new Map([["note", [prose("note", 1)]]]);
            expect(stopOf([noted, prose("a", 3, [low])], { footnotes })).to.equal(beside);
            expect(stopOf([prose("a", 3, [low]), noted], { footnotes })).to.equal(beside);
            // 6 lines evened out 3 and 3, the first column's beside the drawing at the right of it
            const columns = {
                sections: [
                    { ...PAGE, columns: [85, 85] },
                    { ...PAGE, start: "continuous" as const },
                ],
            };
            const atColumnRight = floating({ width: 20, horizontal: { from: "column", align: "right" } });
            expect(
                roomsOf(
                    [
                        [prose("a", 6, [atColumnRight]), 0],
                        [prose("b", 1), 1],
                    ],
                    columns,
                )[0],
            ).to.deep.equal([
                [10, 10, 65],
                [10, 20, 65],
                [10, 30, 65],
                [105, 10, 85],
                [105, 20, 85],
                [105, 30, 85],
                [10, 40, 180],
            ]);
            // With a drawing laid out from the top of the page, beside text before it, how Word evens them out isn't known
            const byPage = floating({ width: 20, horizontal: { from: "column", align: "right" }, vertical: { from: "page", offset: 10 } });
            expect(
                stopOf(
                    [
                        [prose("x", 3), 0],
                        [prose("a", 6, [byPage]), 0],
                        [prose("b", 1), 1],
                    ],
                    columns,
                ),
            ).to.equal("columns evened out beside a drawing placed beside text before it");
        });

        it("should stop where the page laid out again doesn't settle", () => {
            // Its paragraph goes on to the next page, as the text before it goes round it: on its own page, it would be beside
            // all of the text before it
            const tallest = floating({ width: 130, height: 180, vertical: { from: "page", offset: 10 } });
            expect(stopOf([prose("a", 48), prose("b", 1, [tallest])])).to.equal(
                "a drawing whose paragraph goes on to the next page as the text before it goes round it",
            );
            // Beside the text of a section before it on the page, which isn't laid out again
            const continuous: Section = { ...PAGE, start: "continuous" };
            expect(
                stopOf(
                    [
                        [prose("a", 6), 0],
                        [prose("b", 1, [floating({ vertical: { from: "page", offset: 10 } })]), 1],
                    ],
                    {
                        sections: [PAGE, continuous],
                    },
                ),
            ).to.equal("a drawing beside text of a section before on its page");
            // Laid out again for more drawings than Word's way has been followed for
            const drawingsAbove = Array.from({ length: 6 }, (_, index) =>
                prose(`b${index}`, 1, [
                    floating({
                        width: 10,
                        height: 5,
                        horizontal: { from: "margin", offset: index * 20 },
                        vertical: { from: "page", offset: 10 },
                    }),
                ]),
            );
            expect(stopOf([prose("a", 6), ...drawingsAbove])).to.equal(
                "drawings whose places on the page don't settle as the text goes round them",
            );
            // Lines whose rooms don't settle: a picture 20 tall that goes beside the drawing on the first line, and so doesn't
            // fit there, but fits where it isn't beside it
            const block: ParagraphBlock = {
                ...paragraph("a", 0),
                items: [
                    floating({ width: 60, vertical: { from: "page", offset: 25 } }),
                    { type: "text", text: "abcd abcd ", font: {} },
                    { type: "box", width: 40, height: 20 },
                ],
            };
            expect(stopOf([block])).to.equal("lines beside a drawing that don't settle");
        });

        describe("text frames", () => {
            /** A text frame of paragraphs, sized as given, placed and wrapped as `floating` places a drawing */
            const frame = (
                blocks: readonly ParagraphBlock[],
                sized: Partial<FloatingDrawing> & Partial<NonNullable<FloatingDrawing["frame"]>>,
            ): LayoutItem => {
                const { heightRule = "exact", fitsWidth = false, ...drawing } = sized;
                return floating({ ...drawing, frame: { blocks, heightRule, fitsWidth } });
            };
            const text = (value: string, format: ParagraphFormat = {}): ParagraphBlock => ({
                ...paragraph("in", 0, format),
                items: [{ type: "text", text: value, font: {} }],
            });

            it("should size a frame by its height rule: its height exactly, at least its height, or its text's (FM1 to FM5)", () => {
                // 4 lines of 10 in a frame 50 wide
                const lines = [text("abcd abcd abcd abcd")];
                const besideOf = (sized: Parameters<typeof frame>[1]): number =>
                    roomsOf([prose("a", 30, [frame(lines, sized)])])[0].filter(([, , width]) => width < 180).length;
                expect(besideOf({ height: 30, heightRule: "exact" })).to.equal(3);
                expect(besideOf({ height: 30, heightRule: "atLeast" })).to.equal(4);
                expect(besideOf({ height: 60, heightRule: "atLeast" })).to.equal(6);
                expect(besideOf({ height: 60, heightRule: "auto" })).to.equal(4);
                // With its paragraphs' space before the first and after the last, and between them: 10, 10, 5, 10 and 10 are
                // 45, beside 5 lines (FM12)
                const spaced = [text("abcd", { spaceBefore: 10 }), text("abcd", { spaceBefore: 5, spaceAfter: 10 })];
                expect(besideOf({ height: 0, heightRule: "auto" })).to.equal(4);
                expect(
                    roomsOf([prose("a", 30, [frame(spaced, { height: 0, heightRule: "auto" })])])[0].filter(([, , width]) => width < 180),
                ).to.have.length(5);
            });

            it("should make a frame with no width as wide as its text (FM14, FM17)", () => {
                expect(
                    roomsOf([prose("a", 9, [frame([text("ab")], { width: 0, fitsWidth: true, height: 10 })])])[0].slice(0, 2),
                ).to.deep.equal([
                    [10, 10, 160],
                    [10, 20, 180],
                ]);
            });
        });

        describe("text boxes in the line", () => {
            /** A text box 60 wide in the line, its paragraphs in 50 of it, with 6 above and below them */
            const textBox = (value: string): LayoutItem => ({
                type: "textBox",
                width: 60,
                textWidth: 50,
                room: 6,
                blocks: [{ ...paragraph("in", 0), items: [{ type: "text", text: value, font: {} }] }],
                font: {},
            });
            const boxed = (value: string): ParagraphBlock => ({
                ...paragraph("a", 0),
                items: [{ type: "text", text: "ab ", font: {} }, textBox(value)],
            });

            it("should make a text box as tall as its paragraphs, broken in the room for its text, and the room around them", () => {
                // 2 lines of 10, and 6: the line is 26 tall
                expect(
                    laidOut([boxed("abcd abcd"), paragraph("b", 1)]).pages[0].body.map((block) =>
                        block.type === "paragraph" ? block.lines.map(({ y, height }) => [y, height]) : [],
                    ),
                ).to.deep.equal([[[10, 26]], [[36, 10]]]);
            });

            it("should stop at a line in a text box that breaks differently in a little more or less room (VM1, VM5)", () => {
                // "ab abc" is 60 wide: in 50 it is two lines, and in 50.72 one, as "ab ab" is 50 wide
                expect(stopOf([boxed("ab abcd")])).to.equal(undefined);
                expect(stopOf([boxed("ab ab")])).to.equal("a line in a text box that only just fits");
                // Guessing, its lines are broken in the room its insets leave: one line of 10, and 6
                const guessed = paginate(document([boxed("ab ab")], { sections: [PAGE] }), { measurer: MEASURER, guess: true });
                expect(guessed.stoppedAt).to.equal(undefined);
                expect(guessed.pages[0]).to.deep.include({ guesses: ["a line in a text box that only just fits"] });
                expect((guessed.pages[0].body[0] as ParagraphLayout).lines[0].height).to.equal(16);
            });
        });

        describe("in headers and footers", () => {
            // 30 by 30 points, 80 across the page and 40 down it
            const onPage = floating({ width: 30, horizontal: { from: "page", offset: 80 }, vertical: { from: "page", offset: 40 } });
            const withPart = (item: LayoutItem): readonly Block[] => [{ ...paragraph("part", 0), items: [item] }];
            // Headers and footers of a line, at the edges of the page, which leave the margins as they are
            const PARTS: Section = { ...PAGE, header: 0, footer: 0 };

            it("should put a header's or footer's drawing on each page that shows it, with the body's text going round it, as Word does", () => {
                // word-stops-drawings.docx DH1a: lines from 40 to 60 down are either side of it, from 10 to 80 across and 110 to 190
                const header = { ...PARTS, headers: { default: withPart(onPage) } };
                const rooms = roomsOf([prose("a", 60)], { sections: [header] });
                expect(rooms[0].slice(2, 6)).to.deep.equal([
                    [10, 30, 180],
                    [10, 40, 70],
                    [110, 40, 80],
                    [10, 50, 70],
                ]);
                // On every page it shows on, and in a footer too
                const footer = { ...PARTS, footers: { default: withPart(onPage) } };
                const twice = roomsOf([prose("a", 30), { ...prose("b", 30), format: { pageBreakBefore: true } }], { sections: [footer] });
                expect(twice.map((page) => page.filter(([, y]) => y === 40).length)).to.deep.equal([2, 2]);
                // DH1d: the first page's header, of a section whose first page has one
                const first = { ...PARTS, titlePage: true, headers: { first: withPart(onPage) } };
                const firstOnly = roomsOf([prose("a", 30), { ...prose("b", 30), format: { pageBreakBefore: true } }], {
                    sections: [first],
                });
                expect(firstOnly.map((page) => page.filter(([, y]) => y === 40).length)).to.deep.equal([2, 1]);
                // Placed against the column, it is against the text across the page: 70 from its left at 10, where the line
                // beside it goes either side
                const column = floating({ width: 30, horizontal: { from: "column", offset: 70 }, vertical: { from: "page", offset: 40 } });
                const besideColumn = roomsOf([prose("a", 30)], { sections: [{ ...PARTS, headers: { default: withPart(column) } }] });
                expect(besideColumn[0].filter(([, y]) => y === 40)).to.deep.equal([
                    [10, 40, 70],
                    [110, 40, 80],
                ]);
            });

            it("should stop where Word's way with them isn't known, and guessing, leave them out", () => {
                // A table in a header has none of them
                expect(
                    stopOf([prose("a", 9)], { sections: [{ ...PARTS, headers: { default: [table([row([[paragraph("cell", 1)]])])] } }] }),
                ).to.equal(undefined);
                const stopsAt = (
                    section: Section,
                    blocks: readonly Block[] = [prose("a", 9)],
                    changes: Partial<DocumentContent> = {},
                ): string | undefined => stopOf(blocks, { sections: [section], ...changes });
                const header = (item: LayoutItem): Section => ({ ...PARTS, headers: { default: withPart(item) } });
                expect(
                    stopsAt(header(floating({ horizontal: { from: "bogus", offset: 0 }, vertical: { from: "page", offset: 0 } }))),
                ).to.equal("a drawing placed against what isn't followed yet");
                expect(stopsAt({ ...header(onPage), textRunsDown: "fromRight" })).to.equal(
                    "a drawing that text flows around in a header or footer of text that runs down the page",
                );
                const column = floating({ horizontal: { from: "column", offset: 0 }, vertical: { from: "page", offset: 40 } });
                expect(stopsAt({ ...header(column), columns: [85, 85] })).to.equal(
                    "a drawing that text flows around in a header or footer, placed against a column of several",
                );
                // Beside the header's own line, which may go round it
                const high = floating({ width: 30, horizontal: { from: "page", offset: 80 }, vertical: { from: "page", offset: 5 } });
                expect(stopsAt(header(high))).to.equal("a drawing that text flows around in a header or footer, beside its text");
                // Beside the rest of a footnote continued from the page before, at the bottom of the page after the first
                const low = floating({ width: 30, horizontal: { from: "page", offset: 80 }, vertical: { from: "page", offset: 160 } });
                const noted = withItems(prose("a", 30), [{ type: "marker", name: "note" }]);
                expect(
                    stopsAt({ ...PARTS, titlePage: true, footers: { default: withPart(low) } }, [noted, prose("b", 3)], {
                        footnotes: new Map([["note", [paragraph("n", 30)]]]),
                    }),
                ).to.equal("a drawing that text flows around beside the footnotes at the bottom of its page");
                const guessed = paginate(document([prose("a", 9)], { sections: [{ ...header(onPage), columns: [85, 85] }] }), {
                    measurer: MEASURER,
                    guess: true,
                });
                expect(guessed.stoppedAt).to.equal(undefined);
            });
        });
    });
});

describe("paginate with automatic hyphenation", () => {
    // cspell:ignore efgh efghijkl
    const HYPHENATED = "a word Word may hyphenate, whose parts the layout can't know";
    const TABLE = "a table sized to its text whose columns' widths depend on words Word may hyphenate";
    /** A paragraph of text, bookmarked with its name */
    const text = (name: string, value: string, format: ParagraphFormat = {}): ParagraphBlock => ({
        ...paragraph(name, 0, format),
        items: [
            { type: "marker", name },
            { type: "text", text: value, font: {} },
        ],
    });

    it("should stop at a line Word may end with part of the next word, and lay out the paragraphs that suppress hyphenation", () => {
        // 30 points are left after "abcd ", room for "ef-"
        const content = (format: ParagraphFormat): DocumentContent =>
            document([paragraph("a", 1), text("b", "abcd efghijkl", format), paragraph("c", 1)], { hyphenation: {} });
        expect(paginate(content({}), { measurer: MEASURER }).stoppedAt).to.equal(HYPHENATED);
        expect(pagesOf(content({ suppressAutoHyphens: true }))).to.deep.equal({ a: "1", b: "1", c: "1" });
        // Words Word leaves whole
        expect(pagesOf(document([text("a", "abcd efgh 12345678")], { hyphenation: {} }))).to.deep.equal({ a: "1" });
    });

    it("should stop at a table sized to its text whose columns are narrowed past words Word may hyphenate", () => {
        // Two columns whose widest words are 60 and 20 points, and widest lines wider, narrowed into 80
        const sized = (first: readonly Block[]): TableBlock => ({
            ...table([row([first, [text("y", "ab ab ab ab ab ab ab ab")]])]),
            fit: {},
        });
        const content = (first: readonly Block[]): DocumentContent => document([paragraph("a", 1), sized(first)], { hyphenation: {} });
        expect(paginate(content([text("x", "abcdef")]), { measurer: MEASURER }).stoppedAt).to.equal(TABLE);
        // The widest word of a cell is one Word may hyphenate when one of its paragraphs is as wide or wider
        expect(paginate(content([text("x", "12"), text("w", "abcdef")]), { measurer: MEASURER }).stoppedAt).to.equal(TABLE);
        expect(paginate(content([text("x", "123456"), text("w", "abcdef")]), { measurer: MEASURER }).stoppedAt).to.equal(TABLE);
        // and not when one Word leaves whole is wider
        expect(paginate(content([text("x", "123456"), text("w", "abcde")]), { measurer: MEASURER }).stoppedAt).to.equal(undefined);
        expect(paginate(content([text("x", "123456")]), { measurer: MEASURER }).stoppedAt).to.equal(undefined);
    });

    describe("guessing past what can't be laid out as Word does", () => {
        /** The pages laid out with a guess, as the guesses noted on each, and where it stopped, if it did */
        const guessed = (
            content: DocumentContent,
            measurer: TextMeasurer = MEASURER,
        ): {
            readonly guesses: readonly (readonly string[])[];
            readonly stoppedAt?: string;
            readonly bookmarks: Record<string, string>;
        } => {
            const { pages, stoppedAt, bookmarks } = paginate(content, { measurer, guess: true });
            return {
                guesses: pages.map((page) => page.guesses ?? []),
                bookmarks: Object.fromEntries(inBody(content, bookmarks)),
                ...(stoppedAt === undefined ? {} : { stoppedAt }),
            };
        };

        it("should lay out a block it would stop at as it was read, and note the guess on the page it was laying out then", () => {
            const content = document([
                paragraph("a", 6),
                { ...paragraph("b", 3), unsupported: "a text frame" },
                { ...paragraph("c", 1), unsupported: "a text frame" },
                paragraph("d", 1),
            ]);
            expect(numbersOf(content)).to.deep.include({ stoppedAt: "a text frame", bookmarks: new Map([["a", "1"]]) });
            // b's first line would fit below a's 6, but widow control moves it to page 2, which it is laid out on when the
            // layout meets it: its page, and those after, may not be Word's from there on. c's guess is the same, on page 2
            expect(guessed(content)).to.deep.equal({
                guesses: [["a text frame"], ["a text frame"]],
                bookmarks: { a: "1", b: "2", c: "2", d: "2" },
            });
        });

        it("should still stop at what the reader had nothing to lay out in place of, as it has no guess for it", () => {
            const content = document([paragraph("a", 1), { ...paragraph("b", 0), unsupported: "an imported document", noGuess: true }]);
            expect(guessed(content)).to.deep.equal({ guesses: [[]], bookmarks: { a: "1" }, stoppedAt: "an imported document" });
        });

        it("should measure text in a font the measurer doesn't know as it measures it, each time the pages are laid out", () => {
            const CHOOSY: TextMeasurer = { ...MEASURER, unknownFont: ({ font }) => font === "Unknown" };
            const content = document([
                paragraph("a", 6),
                withItems(paragraph("b", 1), [{ type: "text", text: " x", font: { font: "Unknown" } }]),
                paragraph("c", 1),
            ]);
            expect(numbersOf(content, CHOOSY).stoppedAt).to.equal("a font not in the width tables");
            // b's two lines don't fit below a's 6 with widow control, so they are measured on page 1 and placed on page 2
            const expected = {
                guesses: [["a font not in the width tables"], ["a font not in the width tables"]],
                bookmarks: { a: "1", b: "2", c: "2" },
            };
            expect(guessed(content, CHOOSY)).to.deep.equal(expected);
            // The lines laid out the first time are laid out again as they were, and still say they are a guess
            expect(guessed(content, CHOOSY)).to.deep.equal(expected);
            // As is an empty paragraph whose mark is in it, and a line whose breaking Word hasn't shown keeps its own reason
            const mark: ParagraphBlock = { ...paragraph("mark", 0), markFont: { font: "Unknown" } };
            const picture: ParagraphBlock = {
                ...paragraph("picture", 0, { lineSpacing: { rule: "multiple", multiple: 1.5 } }),
                items: [
                    { type: "text", text: "x", font: { font: "Unknown" } },
                    { type: "break", kind: "line", font: { size: 4 } },
                    { type: "box", width: 10, height: 5, font: { size: 4 } },
                ],
            };
            expect(guessed(document([mark, picture]), CHOOSY).guesses).to.deep.equal([
                [
                    "a font not in the width tables",
                    "a picture alone in a line of a paragraph whose mark is larger, with multiple line spacing",
                ],
            ]);
        });

        it("should measure a character whose width the measurer doesn't know as it measures it", () => {
            const CHARACTERS: TextMeasurer = { ...MEASURER, unknownCharacter: (value) => (value.includes("∑") ? "∑" : undefined) };
            const content = document([withItems(paragraph("a", 1), [{ type: "text", text: " ∑", font: {} }]), paragraph("b", 1)]);
            expect(numbersOf(content, CHARACTERS).stoppedAt).to.equal("a character whose width in its font isn't known");
            expect(guessed(content, CHARACTERS)).to.deep.equal({
                guesses: [["a character whose width in its font isn't known"]],
                bookmarks: { a: "1", b: "1" },
            });
        });

        it("should measure text whose kerning or ligatures the measurer doesn't know as it measures it", () => {
            const SHAPING: TextMeasurer = {
                ...MEASURER,
                unknownShaping: (value) => (value.includes("Ж") ? "kerned text with a Ж" : undefined),
            };
            const content = document([withItems(paragraph("a", 1), [{ type: "text", text: " Ж", font: {} }]), paragraph("b", 1)]);
            expect(numbersOf(content, SHAPING).stoppedAt).to.equal("kerned text with a Ж");
            expect(guessed(content, SHAPING)).to.deep.equal({ guesses: [["kerned text with a Ж"]], bookmarks: { a: "1", b: "1" } });
        });

        it("should lay out the document, a section and a header as they were read, noting the guess on the page each is on", () => {
            expect(guessed(document([paragraph("a", 1)], { unsupported: "hyphenation" })).guesses).to.deep.equal([["hyphenation"]]);
            const sections = (start: Section["start"]): DocumentContent =>
                document(
                    [
                        [paragraph("a", 1), 0],
                        [paragraph("b", 1), 1],
                    ],
                    { sections: [SECTION, { ...SECTION, start, unsupported: "a document grid" }] },
                );
            expect(guessed(sections("nextPage")).guesses).to.deep.equal([[], ["a document grid"]]);
            expect(guessed(sections("continuous")).guesses).to.deep.equal([["a document grid"]]);
            // A header is laid out with the guess on each page it is on
            const header = document([paragraph("a", 9)], {
                sections: [{ ...SECTION, headers: { default: [{ ...paragraph("h", 1), unsupported: "an equation" }] } }],
            });
            expect(guessed(header).guesses).to.deep.equal([["an equation"], ["an equation"]]);
        });

        it("should write a page number in a format it can't write in figures", () => {
            const numbered = document([paragraph("a", 1)], { sections: [{ ...SECTION, numberFormat: "lowerLetter", firstNumber: 781 }] });
            expect(guessed(numbered)).to.deep.equal({
                guesses: [["a page number its format isn't written for yet"]],
                bookmarks: { a: "781" },
            });
            const counted = withItems(paragraph("b", 0), [
                { type: "pageCount", scope: "document", font: {}, format: { numberFormat: "nonsense" } },
            ]);
            const passes = paginate(document([paragraph("a", 1), counted]), { measurer: MEASURER, guess: true, pageCount: 1 });
            expect(passes.pages[0].guesses).to.deep.equal(["a page number its format isn't written for yet"]);
            expect(passes.pages[0].body[1]).to.deep.include({ lines: [{ text: "1", x: 10, y: 20, width: 80, height: 10, textWidth: 10 }] });
        });

        it("should keep what is kept with a table it lays out with a guess with the table, but not with one it has no guess for", () => {
            const keptBefore = (anchor: TableBlock): Record<string, string> =>
                guessed(document([paragraph("a", 5), paragraph("b", 1, { keepNext: true }), anchor, paragraph("c", 1)])).bookmarks;
            const rows = table([row([[paragraph("one", 2)]], { cantSplit: true })]);
            // b goes on to page 2 with the table's first row, which doesn't fit below it
            expect(keptBefore({ ...rows, unsupported: "a table that text flows around" })).to.deep.equal({
                a: "1",
                b: "2",
                one: "2",
                c: "2",
            });
            expect(keptBefore({ ...rows, unsupported: "an imported document", noGuess: true })).to.deep.equal({ a: "1", b: "1" });
        });

        it("should still stop where it has no guess, such as at the multiple spacing of a line in a table row across pages", () => {
            // Letting it go below the page, as in the text, would leave the row's lines below the page as it is cut for them
            const spaced = { lineSpacing: { rule: "multiple", multiple: 1.5 } } as const;
            const rowAcross = document([paragraph("a", 3), table([row([[paragraph("cell", 6, spaced)]])]), paragraph("b", 1)]);
            expect(guessed(rowAcross)).to.deep.include({
                stoppedAt: "a table row across pages whose line's multiple spacing goes below the page",
                bookmarks: { a: "1" },
            });
        });
    });
});
