import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import {
    AlignmentType,
    BorderStyle,
    Document,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    FrameAnchorType,
    Header,
    HeadingLevel,
    type IContext,
    type IPropertiesOptions,
    LevelFormat,
    LevelSuffix,
    Paragraph,
    Table,
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
                                },
                                text: "In a frame",
                            }),
                            new Paragraph("After the frame"),
                        ],
                    },
                ],
            }),
        );
        expect(stoppedAt).to.equal("a text frame");
        expect(pages.map(({ body }) => textsOf(body))).to.deep.equal([["Before the frame"]]);
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
});
