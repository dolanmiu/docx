import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import {
    AlignmentType,
    BorderStyle,
    Document,
    DocumentGridType,
    EndnoteReferenceRun,
    Footer,
    FootnoteReferenceRun,
    FrameAnchorType,
    Header,
    HeadingLevel,
    type IContext,
    type IPropertiesOptions,
    type ISectionOptions,
    LevelFormat,
    LevelSuffix,
    LineRuleType,
    PageTextDirectionType,
    Paragraph,
    Table,
    TableAnchorType,
    TableBorders,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

import { estimatePageNumbers } from "./estimate-page-numbers";
import { type BlockLayout, type LineLayout, layoutDocument } from "./layout-document";

// docx's pages are A4 with inch margins: 11906 by 16838 twips, 96 pixels to the inch
const PAGE_WIDTH = (11906 / 1440) * 96;
const PAGE_HEIGHT = (16838 / 1440) * 96;
const TEXT_WIDTH = PAGE_WIDTH - 2 * 96;

const linesOf = (blocks: readonly BlockLayout[]): readonly LineLayout[] =>
    blocks.flatMap((block) => (block.type === "paragraph" ? block.lines : []));

const textsOf = (blocks: readonly BlockLayout[]): readonly string[] => linesOf(blocks).map(({ text }) => text);

describe("layoutDocument", () => {
    it("should give each page and what is on it, with lengths in pixels", () => {
        const { pages, stoppedAt } = layoutDocument(
            new Document({ sections: [{ children: [new Paragraph("The harbour was rebuilt.")] }] }),
        );
        expect(stoppedAt).to.equal(undefined);
        expect(pages).to.have.length(1);
        const [page] = pages;
        expect(page).to.deep.include({ pageNumber: "1", section: 0, footnotes: [], endnotes: [] });
        expect(page.width).to.be.closeTo(PAGE_WIDTH, 0.001);
        expect(page.height).to.be.closeTo(PAGE_HEIGHT, 0.001);
        expect(page).to.not.have.any.keys("header", "footer");
        const [line] = linesOf(page.body);
        expect(line.text).to.equal("The harbour was rebuilt.");
        expect(line.x).to.be.closeTo(96, 0.001);
        expect(line.y).to.be.closeTo(96, 0.001);
        expect(line.width).to.be.closeTo(TEXT_WIDTH, 0.001);
        // Times New Roman at 10 points, docx's default, is about 11.5 points tall
        expect(line.height).to.be.closeTo(15.33, 0.01);
        expect(line.textWidth).to.be.within(100, 160);
    });

    it("should give the lines of paragraphs across pages, tables' rows, footnotes, endnotes, and each page's header", () => {
        const text = "The harbour was rebuilt after the storm, and this report sets out what it cost and what is left to do. ".repeat(80);
        const { pages } = layoutDocument(
            new Document({
                footnotes: { 1: { children: [new Paragraph("A footnote.")] } },
                endnotes: { 1: { children: [new Paragraph("An endnote.")] } },
                sections: [
                    {
                        properties: { titlePage: true },
                        headers: { default: new Header({ children: [new Paragraph("Report")] }) },
                        children: [
                            new Paragraph({ children: [new TextRun("Costs"), new FootnoteReferenceRun(1), new EndnoteReferenceRun(1)] }),
                            new Table({
                                rows: [
                                    new TableRow({ children: [new TableCell({ children: [new Paragraph("Quay")] })] }),
                                    new TableRow({ children: [new TableCell({ children: [new Paragraph("Wall")] })] }),
                                ],
                            }),
                            new Paragraph(text),
                        ],
                    },
                ],
            }),
        );
        expect(pages).to.have.length(2);
        // The first page has no header of its own, so it shows none
        expect(pages.map(({ header }) => header)).to.deep.equal([undefined, "default"]);
        expect(pages[0].body.map(({ type, index }) => [type, index])).to.deep.equal([
            ["paragraph", 0],
            ["table", 1],
            ["paragraph", 2],
        ]);
        expect(textsOf(pages[0].body)[0]).to.equal("Costs1i");
        const table = pages[0].body[1];
        expect(table.type === "table" && table.rows.map(({ index }) => index)).to.deep.equal([0, 1]);
        // The paragraph goes on to the second page, where the endnote follows it
        expect(pages[1].body.map(({ index }) => index)).to.deep.equal([2]);
        expect(pages[0].footnotes.map(({ noteNumber, content }) => [noteNumber, textsOf(content)])).to.deep.equal([
            ["1", ["1A footnote."]],
        ]);
        expect(pages[1].endnotes.map(({ noteNumber, content }) => [noteNumber, textsOf(content)])).to.deep.equal([["i", ["iAn endnote."]]]);
        // The footnote is at the bottom of the page, above the inch of margin
        const [noteLine] = linesOf(pages[0].footnotes[0].content);
        expect(noteLine.y + noteLine.height).to.be.closeTo(PAGE_HEIGHT - 96, 0.001);
    });

    it("should lay out tables of contents with the page numbers it works out for them", () => {
        const options = (): IPropertiesOptions => ({
            sections: [
                {
                    children: [
                        new TableOfContents("Contents", { headingStyleRange: "1-1" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, text: "First" }),
                        new Paragraph({ heading: HeadingLevel.HEADING_1, text: "Second", pageBreakBefore: true }),
                    ],
                },
            ],
        });
        const entries = (document: Document): readonly string[] =>
            textsOf(layoutDocument(document).pages[0].body).filter((text) => text.startsWith("First") || text.startsWith("Second"));
        expect(entries(new Document(options()))).to.deep.equal(["First\t1", "Second\t2", "First"]);
        expect(entries(new Document({ ...options(), pageNumbers: estimatePageNumbers }))).to.deep.equal(["First\t1", "Second\t2", "First"]);
    });

    it("should give the pages up to where it stopped, and why it stopped", () => {
        const { pages, stoppedAt } = layoutDocument(
            new Document({
                sections: [
                    {
                        children: [
                            new Paragraph("Before the frame"),
                            new Paragraph({
                                frame: {
                                    type: "absolute",
                                    position: { x: 1000, y: 1000 },
                                    width: 2000,
                                    height: 1000,
                                    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
                                    space: { horizontal: 100, vertical: 0 },
                                },
                                // With a border beside it, where the frame's next paragraph has another, which take room in a way
                                // not yet followed
                                border: { left: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "auto" } },
                                text: "In a frame",
                            }),
                            new Paragraph({
                                frame: {
                                    type: "absolute",
                                    position: { x: 1000, y: 1000 },
                                    width: 2000,
                                    height: 1000,
                                    anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
                                    space: { horizontal: 100, vertical: 0 },
                                },
                                border: { right: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "auto" } },
                                text: "Also in the frame",
                            }),
                            new Paragraph("After the frame"),
                        ],
                    },
                ],
            }),
        );
        expect(stoppedAt).to.equal("a text frame of paragraphs with other borders at their sides");
        expect(pages.map(({ body }) => textsOf(body))).to.deep.equal([["Before the frame"]]);
    });

    it("should lay out lines beside two tables that text flows around, leaving room narrower than 18 points empty, as Word does", () => {
        // `word-stops-floats.docx` FT1d: tables 3000 wide at 2000 and 5500 from the margin, 180 from the text either side,
        // which leave 130 and 336 twips between and right of them, where Word puts no text
        const prose = "the in foot mouth made on river was and the coast boat to the by lighthouse of summer the survey the from".split(
            " ",
        );
        const words = (count: number): string => Array.from({ length: count }, (_, index) => prose[index % prose.length]).join(" ");
        const floating = (name: string, x: number): Table =>
            new Table({
                width: { size: 3000, type: WidthType.DXA },
                columnWidths: [3000],
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    absoluteHorizontalPosition: x,
                    verticalAnchor: TableAnchorType.TEXT,
                    absoluteVerticalPosition: 1500,
                    leftFromText: 180,
                    rightFromText: 180,
                },
                rows: [1, 2, 3].map(
                    (row) =>
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 3000, type: WidthType.DXA },
                                    children: [new Paragraph(`${name} row ${row}`)],
                                }),
                            ],
                        }),
                ),
            });
        const { pages, stoppedAt } = layoutDocument(
            new Document({
                styles: {
                    default: {
                        document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
                    },
                },
                sections: [
                    {
                        children: [
                            new Paragraph({ alignment: AlignmentType.JUSTIFIED, text: `FT1d ${words(30)}` }),
                            floating("FT1d", 2000),
                            floating("FT1d second", 5500),
                            new Paragraph({ alignment: AlignmentType.JUSTIFIED, text: `FT1d after ${words(120)}` }),
                        ],
                    },
                ],
            }),
        );
        expect(stoppedAt).to.equal(undefined);
        const beside = linesOf(pages[0].body).filter(({ width, text }) => width < TEXT_WIDTH - 1 && text.trim() !== "");
        expect(beside.map(({ text }) => text.trim())).to.deep.equal([
            "boat to the by",
            "lighthouse of",
            "summer the survey",
            "the from the in foot",
        ]);
    });

    it("should keep lines half a point from a table that text flows around with no distance from the text, as Word does", () => {
        // `word-stops-compat2-15.docx` CN9: a table 3000 wide with borders of half a point, 2000 from the margin and 500
        // below the paragraph before it, in prose aligned left, whose text beside it Word starts at 5019 twips, not 5010,
        // and breaks so: "the in foot mouth made on river was and" without "the", which fits in 9 more twips. The layout
        // puts it at 5020, half a point from the table's room, as Word puts the text 1 twip left of the layout beside a
        // table placed 2000 from the margin with a distance of 180 too (`word-stops-floats.docx` FT1b)
        const prose = "the in foot mouth made on river was and the coast boat to the by lighthouse of summer the survey the from".split(
            " ",
        );
        const words = (count: number): string => Array.from({ length: count }, (_, index) => prose[index % prose.length]).join(" ");
        const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
        const { pages, stoppedAt } = layoutDocument(
            new Document({
                styles: {
                    default: {
                        document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
                    },
                },
                sections: [
                    {
                        children: [
                            new Paragraph(`CN9 ${words(30)}`),
                            new Table({
                                width: { size: 3000, type: WidthType.DXA },
                                columnWidths: [3000],
                                borders: {
                                    top: border,
                                    bottom: border,
                                    left: border,
                                    right: border,
                                    insideHorizontal: border,
                                    insideVertical: border,
                                },
                                float: {
                                    horizontalAnchor: TableAnchorType.MARGIN,
                                    absoluteHorizontalPosition: 2000,
                                    verticalAnchor: TableAnchorType.TEXT,
                                    absoluteVerticalPosition: 500,
                                },
                                rows: [1, 2, 3].map(
                                    (row) =>
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    width: { size: 3000, type: WidthType.DXA },
                                                    children: [new Paragraph(`CN9 row ${row}`)],
                                                }),
                                            ],
                                        }),
                                ),
                            }),
                            new Paragraph(`CN9 after ${words(150)}`),
                        ],
                    },
                ],
            }),
        );
        expect(stoppedAt).to.equal(undefined);
        const beside = linesOf(pages[0].body).filter(({ width, text }) => width < TEXT_WIDTH - 1 && text.trim() !== "");
        // Lines are in pixels, 15 twips each, from the page's edge
        expect(beside.map(({ x, text }) => [Math.round(x * 15 - 1440), text.trim()])).to.deep.equal([
            [0, "the survey the from"],
            [5020, "the in foot mouth made on river was and"],
            [0, "the coast boat to the"],
            [5020, "by lighthouse of summer the survey the"],
            [0, "from the in foot"],
            [5020, "mouth made on river was and the coast"],
            [0, "boat to the by"],
            [5020, "lighthouse of summer the survey the from"],
            [0, "the in foot mouth"],
            [5020, "made on river was and the coast boat to the"],
        ]);
    });

    it("should leave the document as it is written", () => {
        const options = (): IPropertiesOptions => ({
            footnotes: { 1: { children: [new Paragraph("A footnote.")] } },
            sections: [
                {
                    headers: { default: new Header({ children: [new Paragraph("Report")] }) },
                    children: [new Paragraph({ children: [new TextRun("Costs"), new FootnoteReferenceRun(1)] }), new Paragraph("More")],
                },
                { children: [new Paragraph("Next")] },
            ],
        });
        const written = (document: Document): unknown =>
            new Formatter().format(document.Document.View, {
                file: document,
                viewWrapper: document.Document,
                stack: [],
            } as unknown as IContext);
        const laidOut = new Document(options());
        layoutDocument(laidOut);
        expect(written(laidOut)).to.deep.equal(written(new Document(options())));
    });

    describe("paragraph borders, automatic spacing and indents in characters, as Word lays them out", () => {
        // As word-watertight-text.ts writes its probes: Calibri 11, single spaced, with no space before or after, so Word's
        // lines are 268.55 twips, and a page has room for 13958 twips of them
        const styles = {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        };
        const TWIPS_PER_PIXEL = 15;
        const MARGIN = 1440;
        const thin = { style: BorderStyle.SINGLE, size: 6, space: 1, color: "auto" } as const;

        /**
         * Each page's lines, as how far below the top margin each is, in twips. Those of a section after another, as each
         * probe of Word's starts one on a new page, when it says
         */
        const topsOf = (children: readonly (Paragraph | Table)[], afterAnother = false): readonly (readonly number[])[] => {
            const sections = [...(afterAnother ? [{ children: [new Paragraph("Before")] }] : []), { children: [...children] }];
            const { pages, stoppedAt } = layoutDocument(new Document({ styles, sections }));
            expect(stoppedAt).to.equal(undefined);
            return pages.slice(afterAnother ? 1 : 0).map(({ body }) => linesOf(body).map(({ y }) => y * TWIPS_PER_PIXEL - MARGIN));
        };
        /** A probe of 80 one-line paragraphs, as Word's probes are */
        const fill = (make: (text: string, index: number) => Paragraph): readonly Paragraph[] =>
            Array.from({ length: 80 }, (_, index) => make(`Line ${index + 1}`, index));

        it("should give a paragraph's top and bottom borders their width and space, even at the top of a page (TX5a, TX5c, TX5d, TX5e)", () => {
            // A bottom border of 15 twips, 20 from the text, on every other paragraph: 48 lines on the page, every two 572.1
            // twips apart, as thematicBreak writes it too
            for (const make of [
                (text: string, index: number) => new Paragraph({ ...(index % 2 === 0 ? { border: { bottom: thin } } : {}), text }),
                (text: string, index: number) => new Paragraph({ thematicBreak: index % 2 === 0, text }),
            ]) {
                const [first] = topsOf(fill(make));
                expect(first).to.have.length(48);
                expect(first[2] - first[0]).to.be.closeTo(572.1, 0.1);
            }
            // Top and bottom borders: 45 lines, every two 607.1 apart, the first below its top border
            const both = topsOf(
                fill((text, index) => new Paragraph({ ...(index % 2 === 0 ? { border: { top: thin, bottom: thin } } : {}), text })),
            );
            expect(both[0]).to.have.length(45);
            expect(both[0][0]).to.be.closeTo(35, 0.01);
            expect(both[0][2] - both[0][0]).to.be.closeTo(607.1, 0.1);
            // 3-point borders 4 points from the text: 34 lines, every two 817.1 apart, and the next page starts below the
            // top border of its first paragraph, as Word draws it (Word: 139.2 on its grid of 4.8 twips)
            const thick = { ...thin, size: 24, space: 4 };
            const wide = topsOf(
                fill((text, index) => new Paragraph({ ...(index % 2 === 0 ? { border: { top: thick, bottom: thick } } : {}), text })),
            );
            expect(wide.map((page) => page.length)).to.deep.equal([34, 34, 12]);
            expect(wide[0][2] - wide[0][0]).to.be.closeTo(817.1, 0.1);
            expect(wide[1][0]).to.be.closeTo(140, 0.01);
        });

        it("should put paragraphs with the same borders in one box, with a between border between them, and none where a page breaks it (TX5b, TX5h)", () => {
            // The top border above the first, and none above the first line of the next page
            const box = topsOf(fill((text) => new Paragraph({ border: { top: thin, bottom: thin }, text })));
            expect(box.map((page) => page.length)).to.deep.equal([51, 29]);
            expect(box[0][0]).to.be.closeTo(35, 0.01);
            expect(box[0][1] - box[0][0]).to.be.closeTo(268.55, 0.01);
            expect(box[1][0]).to.be.closeTo(0, 0.01);
            // A between border takes its width and its space twice between two paragraphs, and stays above a paragraph at
            // the top of a page
            const between = topsOf(fill((text) => new Paragraph({ border: { top: thin, bottom: thin, between: thin }, text })));
            expect(between.map((page) => page.length)).to.deep.equal([43, 37]);
            expect(between[0][0]).to.be.closeTo(35, 0.01);
            expect(between[0][42] - between[0][0]).to.be.closeTo(42 * 323.55, 0.5);
            expect(between[1][0]).to.be.closeTo(35, 0.01);
        });

        it("should leave lines as wide as they are without borders at their sides (TX5f)", () => {
            const text = `TX5f ${"the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth ".repeat(6)}`;
            const lines = (paragraph: Paragraph): readonly string[] =>
                textsOf(layoutDocument(new Document({ styles, sections: [{ children: [paragraph] }] })).pages[0].body);
            const space = { ...thin, space: 20 };
            expect(lines(new Paragraph({ border: { left: space, right: space }, text }))).to.deep.equal(lines(new Paragraph({ text })));
        });

        it("should give Word's automatic space before and after a paragraph, the larger of two between them (TX6a, TX6b, TX6d)", () => {
            // 280 twips before and after each, so 280 between each two: 25 lines on the page, the first 280 down, as the
            // first of a section after another, and the first of the next page at the top
            const both = topsOf(
                fill((text) => new Paragraph({ spacing: { beforeAutoSpacing: true, afterAutoSpacing: true }, text })),
                true,
            );
            expect(both[0]).to.have.length(25);
            expect(both[0][0]).to.be.closeTo(280, 0.01);
            expect(both[0][1] - both[0][0]).to.be.closeTo(548.55, 0.01);
            expect(both[1][0]).to.be.closeTo(0, 0.01);
            // In place of the space after given
            const after = topsOf(fill((text) => new Paragraph({ spacing: { after: 0, afterAutoSpacing: true }, text })));
            expect(after[0]).to.have.length(25);
            expect(after[0][1] - after[0][0]).to.be.closeTo(548.55, 0.01);
        });

        it("should leave out automatic space above the first paragraph of a table cell and below its last (TX6c)", () => {
            const cell = (n: number): Paragraph =>
                new Paragraph({ spacing: { beforeAutoSpacing: true, afterAutoSpacing: true }, text: `TX6c cell ${n}` });
            const { pages } = layoutDocument(
                new Document({
                    styles,
                    sections: [
                        {
                            children: [
                                new Paragraph("TX6c above"),
                                new Table({
                                    width: { size: 9026, type: WidthType.DXA },
                                    columnWidths: [9026],
                                    borders: TableBorders.NONE,
                                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                                    rows: [
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    width: { size: 9026, type: WidthType.DXA },
                                                    children: [1, 2, 3].map(cell),
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                new Paragraph("TX6c below"),
                            ],
                        },
                    ],
                }),
            );
            const [above, table, below] = pages[0].body;
            const rows = table.type === "table" ? table.rows : [];
            const [aboveLine] = linesOf([above]);
            const [belowLine] = linesOf([below]);
            // Word: 268.8, 547.2, 547.2 and 268.8 between the lines, on its grid
            expect((rows[0].y - aboveLine.y) * TWIPS_PER_PIXEL).to.be.closeTo(268.55, 0.01);
            expect(rows[0].height * TWIPS_PER_PIXEL).to.be.closeTo(3 * 268.55 + 2 * 280, 0.05);
            expect(belowLine.y).to.be.closeTo(rows[0].y + rows[0].height, 0.001);
        });

        it("should move a line to the next page when its border below doesn't fit at the foot of the page (B4a)", () => {
            // 50 lines leave room for a line, but not with 460 twips of border below it
            const tops = topsOf([
                ...Array.from({ length: 50 }, (_, index) => new Paragraph(`Line ${index + 1}`)),
                new Paragraph({ border: { bottom: { ...thin, size: 24, space: 20 } }, text: "B4a bordered" }),
                new Paragraph("B4a after"),
            ]);
            expect(tops.map((page) => page.length)).to.deep.equal([50, 2]);
            expect(tops[1][1]).to.be.closeTo(268.55 + 460, 0.05);
        });

        it("should give paragraphs of other left indents boxes of their own, but not those of other first line indents (B5)", () => {
            const gapOf = (second: object): number => {
                const [tops] = topsOf([
                    new Paragraph({ border: { top: thin, bottom: thin }, text: "B5 1" }),
                    new Paragraph({ border: { top: thin, bottom: thin }, text: "B5 2", ...second }),
                ]);
                return tops[1] - tops[0];
            };
            expect(gapOf({ indent: { left: 720 } })).to.be.closeTo(268.55 + 70, 0.05);
            expect(gapOf({ indent: { firstLine: 720 } })).to.be.closeTo(268.55, 0.05);
            expect(gapOf({ alignment: AlignmentType.CENTER })).to.be.closeTo(268.55, 0.05);
        });

        it("should give each style of border the room Word gives it (B6)", () => {
            const roomOf = (style: (typeof BorderStyle)[keyof typeof BorderStyle]): number => {
                const edge = { style, size: 6, space: 0, color: "auto" };
                const [tops] = topsOf([
                    new Paragraph("B6 plain"),
                    new Paragraph({ border: { top: edge, bottom: edge }, text: "B6 box" }),
                    new Paragraph("B6 after"),
                ]);
                return tops[2] - tops[0] - 2 * 268.55;
            };
            // 15, 45 and 60 twips above and below: Word's 14.7, 48.2 and 62.7 above on its grid
            expect(roomOf(BorderStyle.SINGLE)).to.be.closeTo(30, 0.05);
            expect(roomOf(BorderStyle.DOUBLE)).to.be.closeTo(90, 0.05);
            expect(roomOf(BorderStyle.WAVE)).to.be.closeTo(120, 0.05);
        });

        it("should put no automatic space above the document's first paragraph, nor between the items of a list (A0, A1)", () => {
            const automatic = { beforeAutoSpacing: true, afterAutoSpacing: true };
            const [tops] = topsOf([
                new Paragraph({ spacing: automatic, text: "A0 first" }),
                ...[1, 2].map((n) => new Paragraph({ bullet: { level: 0 }, spacing: automatic, text: `A1 item ${n}` })),
                new Paragraph("A1 below"),
            ]);
            expect(tops[0]).to.be.closeTo(0, 0.01);
            expect(tops.slice(1).map((top, index) => top - tops[index])).to.satisfy((gaps: readonly number[]) =>
                gaps.every((gap, index) => Math.abs(gap - (index === 1 ? 268.55 : 548.55)) < 0.05),
            );
        });

        it("should make a character of an indent as wide as the paragraph's text is tall (TX7a, TX7b)", () => {
            const text =
                "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth ".repeat(3);
            const indents = (paragraph: Paragraph): readonly number[] =>
                linesOf(layoutDocument(new Document({ styles, sections: [{ children: [paragraph] }] })).pages[0].body)
                    .slice(0, 2)
                    .map(({ x }) => x * TWIPS_PER_PIXEL - MARGIN);
            const [first, next] = indents(new Paragraph({ indent: { firstLineChars: 200 }, text }));
            expect(first).to.be.closeTo(440, 0.01);
            expect(next).to.be.closeTo(0, 0.01);
            // At 20 points, though the paragraph's mark is 11, and in the size of its first character (C5, C6)
            const [big] = indents(new Paragraph({ indent: { firstLineChars: 200 }, children: [new TextRun({ text, size: 40 })] }));
            expect(big).to.be.closeTo(800, 0.01);
            const [firstBig] = indents(
                new Paragraph({ indent: { firstLineChars: 200 }, children: [new TextRun({ text: "C5", size: 40 }), new TextRun(text)] }),
            );
            expect(firstBig).to.be.closeTo(800, 0.01);
            const [firstSmall] = indents(
                new Paragraph({ indent: { firstLineChars: 200 }, children: [new TextRun("C6 "), new TextRun({ text, size: 40 })] }),
            );
            expect(firstSmall).to.be.closeTo(440, 0.01);
            // From a left indent in twips (C4)
            const [fromLeft, rest] = indents(new Paragraph({ indent: { left: 720, firstLineChars: 200 }, text }));
            expect(fromLeft).to.be.closeTo(1160, 0.01);
            expect(rest).to.be.closeTo(720, 0.01);
        });
    });

    describe("lists, as Word lays them out (scripts/layout-probes/word-lists.ts)", () => {
        const TWIPS = 1440 / 96;
        const styles: IPropertiesOptions["styles"] = {
            default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        };
        const words = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = Array.from({ length: 40 }, (_, index) => words[(index * 7) % words.length]).join(" ");
        const wide = (
            reference: string,
            alignment: (typeof AlignmentType)[keyof typeof AlignmentType],
            indent: { readonly left: number; readonly hanging?: number },
            suffix?: (typeof LevelSuffix)[keyof typeof LevelSuffix],
        ): NonNullable<IPropertiesOptions["numbering"]>["config"][number] => ({
            reference,
            levels: [
                {
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: "Paragraph%1.",
                    alignment,
                    ...(suffix ? { suffix } : {}),
                    style: { paragraph: { indent } },
                },
            ],
        });

        it("should put the text after a number aligned right or centred where Word puts it, which breaks its first line there (LJ1 to LJ6)", () => {
            const hanging = { left: 1800, hanging: 360 };
            const { pages, stoppedAt } = layoutDocument(
                new Document({
                    styles,
                    numbering: {
                        config: [
                            wide("lj1", AlignmentType.END, hanging),
                            wide("lj2", AlignmentType.CENTER, hanging),
                            wide("lj3", AlignmentType.START, hanging),
                            wide("lj4", AlignmentType.END, hanging, LevelSuffix.SPACE),
                            wide("lj6", AlignmentType.END, { left: 1440 }),
                        ],
                    },
                    sections: [
                        {
                            children: ["lj1", "lj2", "lj3", "lj4", "lj6"].map(
                                (reference) =>
                                    new Paragraph({
                                        numbering: { reference, level: 0 },
                                        children: [new TextRun(`${reference.toUpperCase()} ${prose}`)],
                                    }),
                            ),
                        },
                    ],
                }),
            );
            expect(stoppedAt).to.equal(undefined);
            const lines = linesOf(pages[0].body);
            const endings = (probe: string): readonly string[] => {
                const first = lines.findIndex(({ text }) => text.includes(probe));
                return lines.slice(first, first + 3).map(({ text }) => text.trim().split(" ").slice(-1)[0]);
            };
            // Word's lines end at these words, and those of LJ1, LJ2, LJ4 and LJ6 elsewhere with the number aligned left
            expect(endings("LJ1")).to.deep.equal(["lighthouse", "the", "summer"]);
            expect(endings("LJ2")).to.deep.equal(["by", "was", "summer"]);
            expect(endings("LJ3")).to.deep.equal(["the", "river", "summer"]);
            expect(endings("LJ4")).to.deep.equal(["of", "coast", "summer"]);
            expect(endings("LJ6")).to.deep.equal(["of", "coast", "summer"]);
            // LJ6's text starts at the left indent, right after the number
            const lj6 = lines.find(({ text }) => text.includes("LJ6"))!;
            expect(lj6.x * TWIPS).to.be.closeTo(2880, 0.01);
        });

        it("should number lists made from one definition on from one another, as docx writes each instance of a list (LO3)", () => {
            const { pages } = layoutDocument(
                new Document({
                    styles,
                    numbering: { config: [{ reference: "lo3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1." }] }] },
                    sections: [
                        {
                            children: ["A", "A", "B", "B", "B", "A", "A"].map(
                                (list) =>
                                    new Paragraph({
                                        numbering: { reference: "lo3", level: 0, instance: list === "A" ? 0 : 1 },
                                        text: list,
                                    }),
                            ),
                        },
                    ],
                }),
            );
            expect(textsOf(pages[0].body)).to.deep.equal(["1.\tA", "2.\tA", "1.\tB", "2.\tB", "3.\tB", "4.\tA", "5.\tA"]);
        });

        it("should make a line as tall as its number above the baseline and its text below it (LF1)", () => {
            const { pages } = layoutDocument(
                new Document({
                    styles,
                    numbering: {
                        config: [{ reference: "lf", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", start: 10 }] }],
                    },
                    sections: [
                        {
                            children: [
                                new Paragraph({ numbering: { reference: "lf", level: 0 }, run: { size: 40 }, text: "LF1 mark 20" }),
                                new Paragraph("LF1 next"),
                            ],
                        },
                    ],
                }),
            );
            const [numbered, next] = linesOf(pages[0].body);
            // Word's is 443.6, to its PDF's 4.8 twips: Calibri 20's ascent and Calibri 11's descent
            expect(numbered.height * TWIPS).to.be.closeTo(439.94, 0.01);
            expect(next.y - numbered.y).to.be.closeTo(numbered.height, 1e-9);
        });
    });

    describe("a document grid, as Word lays it out (scripts/layout-probes/word-grid.ts)", () => {
        const TWIPS = 15;
        const MARGIN = 1440;
        // The document's Normal is MS Mincho 10.5 for East Asian text and Times New Roman 10.5 for Latin, as Japanese
        // documents have it, single spaced with no space before or after
        const styles: IPropertiesOptions["styles"] = {
            default: {
                document: {
                    run: { font: { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "MS Mincho" }, size: 21 },
                    paragraph: { spacing: { before: 0, after: 0, line: 240 } },
                },
            },
        };
        const LINES = { type: DocumentGridType.LINES, linePitch: 360 };
        const inFont = (text: string, font: string, points: number): TextRun =>
            new TextRun({ text, font: { ascii: font, hAnsi: font, eastAsia: font, cs: font }, size: points * 2 });
        const tnr = (text: string, points = 12): TextRun => inFont(text, "Times New Roman", points);
        const IDEOGRAPHS = "永".repeat(100);
        /** A paragraph of lines of Times New Roman broken by line breaks */
        const broken = (
            name: string,
            count: number,
            points = 12,
            options: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {},
        ): Paragraph =>
            new Paragraph({
                ...options,
                children: Array.from({ length: count }, (_, i) => [
                    ...(i > 0 ? [new TextRun({ break: 1 })] : []),
                    tnr(`${name} ${i + 1}`, points),
                ]).flat(),
            });
        const laidOut = (sections: readonly ISectionOptions[], more: Partial<IPropertiesOptions> = {}) =>
            layoutDocument(new Document({ styles, ...more, sections: [...sections] }));
        /** The tops of the lines of a page's text, in twips from the top margin */
        const topsOf = (body: readonly BlockLayout[]): readonly number[] => linesOf(body).map(({ y }) => y * TWIPS - MARGIN);
        /** How many characters each line of a page's text has, leaving out spaces */
        const countsOf = (body: readonly BlockLayout[]): readonly number[] =>
            linesOf(body).map(({ text }) => [...text.replace(/ /g, "")].length);

        it("should put lines on the grid's lines, with the space before and after between them where it falls (G5)", () => {
            const { pages, stoppedAt } = laidOut([
                {
                    properties: { grid: LINES },
                    children: [
                        broken("a", 3),
                        broken("b", 3, 12, { spacing: { before: 120 } }),
                        broken("c", 3, 12, { spacing: { after: 180 } }),
                        broken("d", 3, 12, { spacing: { before: 260 } }),
                        broken("e", 3, 12, { spacing: { before: 360 } }),
                        broken("f", 3, 12, { spacing: { after: 120 } }),
                        broken("g", 3, 12, { spacing: { before: 540 } }),
                    ],
                },
            ]);
            expect(stoppedAt).to.equal(undefined);
            // The tops of Word's lines' text, 55 twips below the tops of their lines
            const word = [
                55, 415, 775, 1255, 1615, 1975, 2335, 2695, 3055, 3674, 4034, 4394, 5114, 5474, 5834, 6194, 6554, 6914, 7812, 8177, 8537,
            ];
            topsOf(pages[0].body).forEach((top, index) => expect(top + 55).to.be.closeTo(word[index], 5));
        });

        it("should fill a page with as many lines as fit, with the room below the last one's text below the page (G1, G14)", () => {
            const firstPage = (...paragraphs: readonly Paragraph[]): number =>
                linesOf(laidOut([{ properties: { grid: LINES }, children: [...paragraphs] }]).pages[0].body).length;
            // 38 lines of Times New Roman 12, of 360 twips, on a page of 13958, and 26 of 540 at 1.5 lines, the last 82
            // below it. 39 paragraphs of Times New Roman 8, whose text ends 6 above it
            expect(firstPage(broken("G14a", 45))).to.equal(38);
            expect(firstPage(broken("G14b", 30, 12, { spacing: { line: 360, lineRule: LineRuleType.AUTO } }))).to.equal(26);
            expect(firstPage(...Array.from({ length: 45 }, (_, i) => new Paragraph({ children: [tnr(`r${i + 1}`, 8)] })))).to.equal(39);
        });

        it("should lay out table cells and headers off the grid, and footnotes on it, below a separator off it (G8, G9)", () => {
            const { pages, stoppedAt } = laidOut(
                [
                    {
                        properties: { grid: LINES, page: { margin: { top: 1440, header: 720, footer: 720 } } },
                        headers: { default: new Header({ children: [broken("G9 head", 3, 10)] }) },
                        footers: { default: new Footer({ children: [broken("G9 foot", 2, 10)] }) },
                        children: [
                            new Paragraph({ children: [tnr("G9 body 1"), new FootnoteReferenceRun(1)] }),
                            new Table({
                                columnWidths: [4000],
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                width: { size: 4000, type: WidthType.DXA },
                                                children: [new Paragraph({ children: [tnr("G8 row")] })],
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new Paragraph({ children: [tnr("G8 after")] }),
                        ],
                    },
                ],
                { footnotes: { 1: { children: [broken("G9 note", 4, 10)] } } },
            );
            expect(stoppedAt).to.equal(undefined);
            const [body, after] = linesOf(pages[0].body);
            // The header's 3 lines of 230 twips end above the margin, so the text starts there, on the grid
            expect(body.y * TWIPS - MARGIN).to.be.closeTo(0, 0.01);
            expect(body.height * TWIPS).to.be.closeTo(360, 0.01);
            // A row of a line of Times New Roman 12 is its own 276 twips and its borders of 10 above and below, and the text
            // after it goes on below it on the grid (G8)
            const [table] = pages[0].body.filter((block) => block.type === "table");
            const [row] = table.type === "table" ? table.rows : [];
            expect(row.height * TWIPS).to.be.closeTo(296, 0.1);
            expect(after.y).to.be.closeTo(row.y + row.height, 0.01);
            expect(after.height * TWIPS).to.be.closeTo(360, 0.01);
            // The footnote's lines are 360 apart, and the last ends at the bottom of the page: Word's text of them is 75 below
            const notes = pages[0].footnotes.flatMap(({ content }) => linesOf(content));
            expect(notes.map(({ y }) => Math.round(y * TWIPS - MARGIN))).to.deep.equal([12518, 12878, 13238, 13598]);
        });

        it("should space characters on a grid of lines and characters, and put them in cells on one that snaps to them (CA1, CA4, CC1, CC2)", () => {
            const mixed = Array.from({ length: 10 }, () => `${"永".repeat(5)}abc de`).join("");
            const counts = (type: (typeof DocumentGridType)[keyof typeof DocumentGridType], ...paragraphs: readonly string[]) => {
                const { pages, stoppedAt } = laidOut([
                    {
                        properties: { grid: { type, linePitch: 360, charSpace: 4096 } },
                        children: paragraphs.map(
                            (text) => new Paragraph({ children: [inFont(text, "MS Mincho", text === `${IDEOGRAPHS} ` ? 12 : 10.5)] }),
                        ),
                    },
                ]);
                expect(stoppedAt).to.equal(undefined);
                return countsOf(pages[0].body);
            };
            expect(counts(DocumentGridType.LINES_AND_CHARS, IDEOGRAPHS, mixed)).to.deep.equal([39, 39, 22, 44, 44, 12]);
            expect(counts(DocumentGridType.SNAP_TO_CHARS, IDEOGRAPHS, mixed)).to.deep.equal([39, 39, 22, 48, 47, 5]);
        });

        it("should put characters in cells of the Normal style's size, over the document's default (word-grid2.docx E1)", () => {
            const { pages } = laidOut(
                [
                    {
                        properties: { grid: { type: DocumentGridType.SNAP_TO_CHARS, linePitch: 360 } },
                        children: [new Paragraph({ children: [inFont(IDEOGRAPHS, "MS Mincho", 10.5)] })],
                    },
                ],
                { styles: { ...styles, paragraphStyles: [{ id: "Normal", name: "Normal", run: { size: 24 } }] } },
            );
            expect(countsOf(pages[0].body)).to.deep.equal([37, 37, 26]);
        });

        it("should lay out headers and footers off a grid of characters, and its footnotes on it (word-grid3.ts H4, H5)", () => {
            const { pages, stoppedAt } = laidOut(
                [
                    {
                        properties: { grid: { type: DocumentGridType.LINES_AND_CHARS, linePitch: 360, charSpace: 4096 } },
                        headers: {
                            default: new Header({
                                children: [new Paragraph({ children: [inFont(`H4 ${"永".repeat(40)}`, "MS Mincho", 10.5)] })],
                            }),
                        },
                        children: [
                            new Paragraph({
                                children: [inFont(`H5 body ${"永".repeat(10)}`, "MS Mincho", 10.5), new FootnoteReferenceRun(1)],
                            }),
                        ],
                    },
                ],
                { footnotes: { 1: { children: [new Paragraph({ children: [inFont(`H5 ${"永".repeat(38)}`, "MS Mincho", 10.5)] })] } } },
            );
            expect(stoppedAt).to.equal(undefined);
            // The header's 40 ideographs are on one line, as they are without the grid, so it ends above the margin
            expect(linesOf(pages[0].body)[0].y * TWIPS).to.be.closeTo(MARGIN, 0.01);
            // The footnote's 38 aren't, with a point after each, and its lines are 360 apart
            const notes = pages[0].footnotes.flatMap(({ content }) => linesOf(content));
            expect(notes.map(({ text }) => [...text].filter((character) => character === "永").length)).to.deep.equal([37, 1]);
            expect((notes[1].y - notes[0].y) * TWIPS).to.be.closeTo(360, 0.01);
        });

        it("should lay out a footnote on a grid that goes on to the next page below the continuation separator, off the grid (word-grid3.ts H2)", () => {
            const { pages, stoppedAt } = laidOut(
                [
                    {
                        properties: { grid: LINES },
                        children: [
                            broken("H2 body", 29),
                            new Paragraph({ children: [tnr("H2 body 30"), new FootnoteReferenceRun(1)] }),
                            broken("H2 more", 14),
                        ],
                    },
                ],
                { footnotes: { 1: { children: [broken("H2 note", 14, 10)] } } },
            );
            expect(stoppedAt).to.equal(undefined);
            // As in Word: 30 lines and 8 of the footnote's on the first page, and the other 14 and 6 on the next
            expect(pages.map(({ body }) => linesOf(body).length)).to.deep.equal([30, 14]);
            expect(pages.map(({ footnotes }) => footnotes.flatMap(({ content }) => linesOf(content)).length)).to.deep.equal([8, 6]);
        });
    });

    describe("text that runs down the page, as Word lays it out (scripts/layout-probes/word-vertical.ts)", () => {
        const TWIPS = 15;
        const styles: IPropertiesOptions["styles"] = {
            default: {
                document: {
                    run: { font: { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "MS Mincho" }, size: 21 },
                    paragraph: { spacing: { before: 0, after: 0, line: 240 } },
                },
            },
        };
        const mincho = (text: string): TextRun =>
            new TextRun({ text, font: { ascii: "MS Mincho", hAnsi: "MS Mincho", eastAsia: "MS Mincho" }, size: 21 });
        const paragraphs = (name: string): readonly Paragraph[] => [
            ...[1, 2, 3].map((i) => new Paragraph({ children: [mincho(`${name} long ${i} ${"永".repeat(100)}`)] })),
            ...Array.from({ length: 60 }, (_, i) => new Paragraph({ children: [mincho(`${name} short ${i + 1} 永永永`)] })),
        ];
        const laidOut = (
            textDirection: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType],
            more: Partial<ISectionOptions> = {},
            name = "V1",
        ) =>
            layoutDocument(
                new Document({
                    styles,
                    sections: [{ ...more, properties: { ...more.properties, page: { textDirection } }, children: [...paragraphs(name)] }],
                }),
            );
        const ideographs = (line: LineLayout): number => [...line.text].filter((character) => character === "永").length;

        it("should lay out lines down the page from its top margin, across it from the right, as many as fit (V1, V2)", () => {
            const { pages, stoppedAt } = laidOut(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT);
            expect(stoppedAt).to.equal(undefined);
            const [first] = pages;
            expect(first.textRunsDown).to.equal("fromRight");
            // The page as it is, A4 upright
            expect(first.width).to.be.closeTo(PAGE_WIDTH, 0.001);
            expect(first.height).to.be.closeTo(PAGE_HEIGHT, 0.001);
            // 33 lines of MS Mincho 10.5, 272.4 twips each, across the 9026 of the page's text, as in Word, the first beside
            // the right margin, each from the top margin down the 13958 of it
            const lines = linesOf(first.body);
            expect(lines).to.have.length(33);
            expect(lines.slice(0, 6).map(ideographs)).to.deep.equal([61, 39, 61, 39, 61, 39]);
            expect((lines[0].x + lines[0].width) * TWIPS).to.be.closeTo(11906 - 1440, 0.01);
            expect(lines[0].width * TWIPS).to.be.closeTo(272.37, 0.01);
            expect((lines[0].x - lines[1].x) * TWIPS).to.be.closeTo(272.37, 0.01);
            expect(lines[0].y * TWIPS).to.be.closeTo(1440, 0.01);
            expect(lines[0].height * TWIPS).to.be.closeTo(16838 - 2880, 0.01);
            expect(pages.map(({ body }) => linesOf(body).length)).to.deep.equal([33, 33]);
            // On a grid of 360, 25 lines (V2)
            const { pages: gridded } = laidOut(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT, {
                properties: { grid: { type: DocumentGridType.LINES, linePitch: 360 } },
            });
            expect(gridded.map(({ body }) => linesOf(body).length)).to.deep.equal([25, 25, 16]);
        });

        it("should lay out lines across from the left for tbRlV and tbLrV (V10, V11)", () => {
            const { pages, stoppedAt } = laidOut("tbRlV" as (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType], {}, "V10");
            expect(stoppedAt).to.equal(undefined);
            expect(pages[0].textRunsDown).to.equal("fromLeft");
            const lines = linesOf(pages[0].body);
            expect(lines.slice(0, 2).map(ideographs)).to.deep.equal([60, 40]);
            expect(lines[0].x * TWIPS).to.be.closeTo(1440, 0.01);
            expect((lines[1].x - lines[0].x) * TWIPS).to.be.closeTo(272.37, 0.01);
        });

        it("should keep a header from pushing the lines down, and stop at a footer that goes above the bottom margin (VH1)", () => {
            const lines = (count: number): readonly Paragraph[] => Array.from({ length: count }, (_, i) => new Paragraph(`Line ${i + 1}`));
            const { pages, stoppedAt } = laidOut(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT, {
                headers: { default: new Header({ children: [...lines(6)] }) },
            });
            expect(stoppedAt).to.equal(undefined);
            expect(linesOf(pages[0].body)[0].y * TWIPS).to.be.closeTo(1440, 0.01);
            expect(
                laidOut(PageTextDirectionType.TOP_TO_BOTTOM_RIGHT_TO_LEFT, {
                    footers: { default: new Footer({ children: [...lines(6)] }) },
                }).stoppedAt,
            ).to.equal("a footer that goes above the bottom margin of text that runs down the page");
        });
    });
});
