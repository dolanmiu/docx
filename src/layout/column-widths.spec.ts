import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Paragraph } from "@file/paragraph";
import { Table, TableCell, TableRow, WidthType } from "@file/table";
import { TableLayoutType } from "@file/table/table-properties/table-layout";
import type { IContext } from "docx";

import { type ContentWidths, DEFAULT_MEASURER, type InlineItem, type TextMeasurer, measureContentWidths } from "../text-layout";
import { fitColumns, tableWidths } from "./column-widths";
import { type Block, type TableBlock, readDocument } from "./read-document";

// Every character is 10 points wide
const MEASURER: TextMeasurer = {
    measureWidth: (text) => [...text].length * 10,
    measureLineHeight: () => 10,
    measureDescent: () => 0,
};

/** How narrow and how wide the paragraphs and tables of a cell can be, as the layout measures them */
const measureWith =
    (measurer: TextMeasurer) =>
    (blocks: readonly Block[]): ContentWidths =>
        blocks.reduce(
            (widths, block) => {
                const { min, max } =
                    block.type === "table"
                        ? tableWidths(block, measureWith(measurer))
                        : measureContentWidths(block.items as readonly InlineItem[], { measurer });
                return { min: Math.max(widths.min, min), max: Math.max(widths.max, max) };
            },
            { min: 0, max: 0 },
        );

/** 10 points a character */
const measure = measureWith(MEASURER);

type Cell = TableBlock["rows"][number]["cells"][number];

/** A cell of text, with 5 points either side of it, and the width it gives itself, if any */
const cell = (column: number, text: string, ownWidth?: number): Cell => ({
    column,
    width: 0,
    ...(ownWidth === undefined ? {} : { ownWidth }),
    blocks: [{ type: "paragraph", items: [{ type: "text", text, font: {} }], format: {}, tabStops: [], markFont: {} }],
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 5,
    marginRight: 5,
});

/** A cell of text across columns */
const across = (column: number, span: number, text: string, ownWidth?: number): Cell => ({ ...cell(column, text, ownWidth), span });

/** A table of rows of cells, sized to its text, with its own width when given */
const table = (rows: readonly (readonly Cell[])[], fit: TableBlock["fit"] = {}): TableBlock => ({
    type: "table",
    rows: rows.map((cells) => ({ cells, header: false, cantSplit: false, borderTop: 0, borderBottom: 0 })),
    fit,
});

/** The width of the text of each cell of a row, the first unless given, rounded to a tenth of a point */
const widthsOf = (sized: TableBlock, row = 0): readonly number[] => sized.rows[row].cells.map(({ width }) => Math.round(width * 10) / 10);

const LONG = "aaaa bbbb cccc dddd eeee ffff";

/** A row of cells, deleted in a tracked change */
const deleted = (cells: readonly Cell[]): TableBlock["rows"][number] => ({
    cells,
    header: false,
    cantSplit: false,
    borderTop: 0,
    borderBottom: 0,
});

/** A paragraph of text, as a cell is sized by it */
const sizingOf = (text: string): readonly Block[] => [
    { type: "paragraph", items: [{ type: "text", text, font: {} }], format: {}, tabStops: [], markFont: {} },
];

describe("fitColumns", () => {
    it("should make each column as wide as its widest line when they all fit, leaving the table narrower than the room", () => {
        const sized = fitColumns(
            table([
                [cell(0, "aa"), cell(1, "bbbb cc")],
                [cell(0, "a"), cell(1, "ddd")],
            ]),
            200,
            measure,
        );
        expect(widthsOf(sized)).to.deep.equal([20, 70]);
        expect(sized.rows[1].cells.map(({ width }) => width)).to.deep.equal([20, 70]);
    });

    it("should narrow columns too wide for the room toward their widest words, each by how much more text it has", () => {
        // Widest lines of 20, 300 and 600 points with the margins, and widest words of 20, 50 and 50: the 80 points past the
        // widest words take each column a tenth of the way to its widest line
        const sized = fitColumns(table([[cell(0, "a"), cell(1, LONG), cell(2, `${LONG} ${LONG}`)]]), 200, measure);
        expect(widthsOf(sized)).to.deep.equal([10, 65, 95]);
        // Columns can't be narrower than their widest words, and the table then goes past the room
        expect(widthsOf(fitColumns(table([[cell(0, "aaaa"), cell(1, LONG)]]), 50, measure))).to.deep.equal([40, 40]);
    });

    it("should keep the widths cells give their columns when the room is short, and narrow the other columns", () => {
        // 150 points given to the first column, as Word keeps it, and the 175 left over taking the others halfway from their
        // widest words to their widest lines
        const sized = fitColumns(table([[cell(0, "a", 150), cell(1, "aaaa bbbb"), cell(2, "cccc dddd eeee")]]), 325, measure);
        expect(widthsOf(sized)).to.deep.equal([140, 65, 90]);
        // Narrowed when the others are as narrow as their widest words and still don't leave room, as far as they need
        expect(widthsOf(fitColumns(table([[cell(0, "aaaaaa bb", 150), cell(1, "aaaa bbbb")]]), 150, measure))).to.deep.equal([90, 40]);
        expect(widthsOf(fitColumns(table([[cell(0, "aaaaaa bb", 150), cell(1, "aaaa bbbb")]]), 100, measure))).to.deep.equal([60, 40]);
    });

    it("should keep the widths the cells give their columns, but no narrower than their widest words", () => {
        const sized = fitColumns(table([[cell(0, "a", 30), cell(1, "aaaaaa", 20), cell(2, "bb")], [cell(0, "b", 50)]]), 200, measure);
        // The widest the column's cells give it, less the margins, and the width of the word
        expect(widthsOf(sized)).to.deep.equal([40, 60, 20]);
    });

    it("should size columns by the rows deleted in a tracked change, and by deleted text, as Word does", () => {
        // word-tracked-changes.docx MK11h and MK11j: a deleted row's text, and deleted text in a cell, widen a column of a
        // table sized to its text, though neither is laid out. Here, a deleted row of 12 letters, and a cell's 9
        const sized = fitColumns(
            { ...table([[cell(0, "a"), cell(1, "b")]]), deletedRows: [deleted([cell(0, "aaaa bbbb cc"), cell(1, "b")])] },
            300,
            measure,
        );
        expect(widthsOf(sized)).to.deep.equal([120, 10]);
        expect(sized.rows).to.have.length(1);
        expect(
            widthsOf(fitColumns(table([[{ ...cell(0, "a"), sizing: sizingOf("a deleted") }, cell(1, "b")]]), 300, measure)),
        ).to.deep.equal([90, 10]);
    });

    it("should widen the columns in proportion to fill the table's own width", () => {
        const cells = [[cell(0, "aa"), cell(1, "bbbb bbb")]];
        // Columns of 30 and 90 points with their margins, whose widest words are 30 and 50
        expect(widthsOf(fitColumns(table(cells, { width: 180 }), 400, measure))).to.deep.equal([35, 125]);
        expect(widthsOf(fitColumns(table(cells, { share: 0.5 }), 480, measure))).to.deep.equal([50, 170]);
        // A table's width narrower than its columns narrows them, as the room does
        expect(widthsOf(fitColumns(table(cells, { width: 100 }), 400, measure))).to.deep.equal([20, 60]);
    });

    it("should size a table to its text in the room its indent leaves, as Word does", () => {
        // word-watertight-tables.docx TB9: a table of one cell of prose, indented 2000 twips in 9026, wrapped its text in
        // 7026, in 10 lines where it took 8 without
        const prose = [[cell(0, `${LONG} ${LONG} ${LONG}`)]];
        expect(widthsOf(fitColumns({ ...table(prose), indent: 100 }, 300, measure))).to.deep.equal([190]);
        expect(widthsOf(fitColumns(table(prose), 300, measure))).to.deep.equal([290]);
        // A table with a width of its own keeps it
        expect(widthsOf(fitColumns({ ...table(prose, { width: 250 }), indent: 100 }, 300, measure))).to.deep.equal([240]);
    });

    it("should take a negative indent from the room too, and leave a table of a share of the width its width", () => {
        // word-table-formats.docx TI1: indented -500 twips, a table sized to its text has 9526 twips; TI2: one of 100% keeps
        // the 9026 of the page's text, past its right edge
        const prose = [[cell(0, `${LONG} ${LONG} ${LONG}`)]];
        expect(widthsOf(fitColumns({ ...table(prose), indent: -20 }, 300, measure))).to.deep.equal([310]);
        expect(widthsOf(fitColumns({ ...table(prose, { share: 1 }), indent: 100 }, 300, measure))).to.deep.equal([290]);
    });

    it("should widen a column for a long word in an indented table in the room the indent leaves", () => {
        // word-table-formats.docx TI3: columns of 2000 and 2500 twips and a word 2894 wide, indented 4000 in 9026, came out
        // 2894 and 2132, narrowing the second to fit in 5026
        const long = (indent: number): TableBlock => ({
            ...table([[cell(0, "aaaaaa", 30), cell(1, LONG, 150)]]),
            fit: undefined,
            widen: {},
            indent,
        });
        expect(widthsOf(fitColumns(long(100), 300, measure))).to.deep.equal([60, 120]);
        expect(widthsOf(fitColumns(long(0), 300, measure))).to.deep.equal([60, 140]);
    });

    it("should narrow the columns of a table with space between its cells to keep its width, and stop at a long word in one", () => {
        // word-table-formats2.docx CS9: each column's room for the space around it, as margins, is taken from the columns
        // toward their widest words, each by its share of what they give up
        const spaced = (first: string): TableBlock => ({
            ...table([
                [
                    { ...cell(0, first, 110), marginLeft: 15 },
                    { ...cell(1, LONG, 190), marginLeft: 10 },
                ],
            ]),
            fit: undefined,
            widen: { width: 280 },
            cellSpacing: 5,
        });
        expect(widthsOf(fitColumns(spaced("aaaa bb"), 300, measure))).to.deep.equal([84.6, 160.4]);
        expect(fitColumns(spaced("aaaaaaaaaa"), 300, measure).unsupported).to.equal("a long word in a table with space between its cells");
        const wider: TableBlock = { ...spaced("aaaa"), widen: { width: 400 } };
        expect(fitColumns(wider, 500, measure).unsupported).to.equal("space between the cells of a table wider than its cells");
    });

    it("should stop at text that runs up or down a cell, in a table sized to its text, or with a word longer than its cell", () => {
        expect(fitColumns(table([[{ ...cell(0, "a"), vertical: true }]]), 300, measure).unsupported).to.equal(
            "text that runs up or down a cell of a table sized to its text",
        );
        const given = { ...table([[{ ...cell(0, "aaaaaa", 30), vertical: true }]]), fit: undefined, widen: {} };
        expect(fitColumns(given, 300, measure).unsupported).to.equal("a long word in text that runs up or down a table cell");
    });

    describe("in a table whose cells all have widths", () => {
        /** A table of rows of cells that all have widths */
        const given = (rows: readonly (readonly Cell[])[], widen: TableBlock["widen"] = {}): TableBlock => ({
            ...table(rows),
            fit: undefined,
            widen,
        });

        it("should keep the widths the cells give their columns when their words fit, however long their lines", () => {
            const fitting = given([[cell(0, "aaaa", 50), cell(1, LONG, 100)]]);
            expect(fitColumns(fitting, 100, measure)).to.equal(fitting);
        });

        it("should widen a column for a word longer than its cells give it, and take the width from the other, as Word does", () => {
            // Word's T7 in word-tables.docx: a column of 900 twips with a 1319-twip word, and one of 8126, in 9026. Word made
            // the first as wide as the word and its margins, and the second the rest, keeping the table's width. Here, a
            // column of 30 points with a word of 60 and margins of 10, and one of 270, in 300
            const sized = fitColumns(
                given([
                    [cell(0, "aaaaaa", 30), cell(1, LONG, 270)],
                    [cell(0, "a", 30), cell(1, "b", 270)],
                ]),
                300,
                measure,
            );
            expect(widthsOf(sized)).to.deep.equal([60, 220]);
            expect(sized.rows[1].cells.map(({ width }) => width)).to.deep.equal([60, 220]);
        });

        it("should widen a column for a long word in a row deleted in a tracked change, as Word does", () => {
            // word-tracked-changes.docx MK11i: a 1500-twip column widened for a 3000-twip word in a deleted row
            const sized = fitColumns(
                { ...given([[cell(0, "a", 30), cell(1, LONG, 270)]]), deletedRows: [deleted([cell(0, "aaaaaa", 30), cell(1, "b", 270)])] },
                300,
                measure,
            );
            expect(widthsOf(sized)).to.deep.equal([60, 220]);
        });

        it("should narrow the other columns toward their widest words, each by its share of the width they give up", () => {
            // Word's L1 in word-long-words.docx: columns of 900, 6126 and 2000 twips, whose widest words with their margins
            // are 1534, 815 and 1558, came out 1534, 5522 and 1946, which the third's 442 twips to give up, against the
            // second's 5311, explain. In proportion to their widths, the third would have been 1844. Here, columns of 30, 200
            // and 70 points whose widest words with their margins are 70, 50 and 60: the 40 points over the 300 are taken
            // three quarters of the way to the second's and third's widest words
            const sized = fitColumns(given([[cell(0, "aaaaaa", 30), cell(1, LONG, 200), cell(2, "bbbbb", 70)]]), 300, measure);
            expect(widthsOf(sized)).to.deep.equal([60, 152.5, 57.5]);
        });

        it("should widen a table with no width of its own, up to the room, and keep the width of one with its own", () => {
            const cells = [[cell(0, "aaaaaa", 30), cell(1, LONG, 100)]];
            // Word's L3: columns of 900 and 3000 twips came out 1534 and 2996, the table 634 twips wider
            expect(widthsOf(fitColumns(given(cells), 300, measure))).to.deep.equal([60, 90]);
            // Word's L4: the same with a width of 3900 twips came out 1534 and 2363, keeping the table's width
            expect(widthsOf(fitColumns(given(cells, { width: 130 }), 300, measure))).to.deep.equal([60, 50]);
            expect(widthsOf(fitColumns(given(cells, { share: 0.5 }), 260, measure))).to.deep.equal([60, 50]);
        });

        it("should keep columns as wide as their widest words past a table's own width and the room, and stop without one", () => {
            // Word's SP15a in word-watertight-stops.docx: in a table 9026 twips wide of cells of 3000 and 6026, a word of
            // 11950 kept the first column as wide as it, and the table went past the page. Here, a word of 70 points with its
            // margins, beside a column whose widest word is 30, in a table and a room of 90
            const cells = [[cell(0, "aaaaaa", 30), cell(1, "bb cc", 100)]];
            expect(widthsOf(fitColumns(given(cells, { width: 90 }), 90, measure))).to.deep.equal([60, 20]);
            // Word's L7 in word-long-words.docx: without a width of its own, a word longer than the page's text was broken
            // across lines, and the other column narrowed past its widest word, to a width its words don't explain
            expect(fitColumns(given(cells), 90, measure).unsupported).to.equal("a word longer than its table can make room for");
            // Nor is it known for a table of a share of the width
            expect(fitColumns(given(cells, { share: 1 }), 90, measure).unsupported).to.equal(
                "a word longer than its table can make room for",
            );
        });

        it("should widen the columns in proportion to fill a table wider than its cells, after widening one for a long word", () => {
            // Word's SP15b: in a table 9000 twips wide of cells of 2000 and 4000, a word of 3204 with its margins came out
            // 4003 and 4997: 3204 and 4000 widened in proportion to 9000. Here, 70 and 60 widened to 260
            const sized = fitColumns(given([[cell(0, "aaaaaa", 30), cell(1, LONG, 60)]], { width: 260 }), 400, measure);
            expect(widthsOf(sized)).to.deep.equal([130, 110]);
        });

        it("should make each column as wide as the widest a row gives it, then fit them to the table's width, as Word does", () => {
            // Word's SP14a and SP14b: rows of 3000 and 6026, and 4000 and 5026, in a table 9026 wide, came out 3604 and 5422
            // in both rows, laid out fixed or not: 4000 and 6026 narrowed toward their widest words, 812 and 1152. In
            // proportion, the first would have been 3601. Here, rows of 100 and 200, and 150 and 150, in 300, whose widest
            // words with their margins are 20 and 30: 150 and 200 taken five sixths of the way to them
            const rows = [
                [cell(0, "a", 100), cell(1, "bb", 200)],
                [cell(0, "a", 150), cell(1, "bb", 150)],
            ];
            const sized = fitColumns(given(rows, { width: 300, uneven: true }), 400, measure);
            expect(widthsOf(sized)).to.deep.equal([118.3, 161.7]);
            expect(widthsOf(sized, 1)).to.deep.equal([118.3, 161.7]);
            expect(widthsOf(fitColumns(given(rows, { width: 300, uneven: true, fixed: true }), 400, measure))).to.deep.equal([
                118.3, 161.7,
            ]);
            // Narrower than the table's width, widened in proportion to it, as for a long word (SP15b)
            const narrower = [
                [cell(0, "a", 100), cell(1, "bb", 100)],
                [cell(0, "a", 150), cell(1, "bb", 50)],
            ];
            expect(widthsOf(fitColumns(given(narrower, { width: 300, uneven: true }), 400, measure))).to.deep.equal([170, 110]);
        });

        it("should stop at what isn't known of evening out the rows of a table laid out fixed", () => {
            const narrower = [
                [cell(0, "a", 100), cell(1, "bb", 100)],
                [cell(0, "a", 150), cell(1, "bb", 50)],
            ];
            expect(fitColumns(given(narrower, { width: 300, uneven: true, fixed: true }), 400, measure).unsupported).to.equal(
                "a table laid out fixed whose rows give a column different widths, narrower than the table",
            );
            // Word widens no column of a table laid out fixed for a long word (word-long-words.docx L8)
            const long = [
                [cell(0, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 100), cell(1, "bb", 200)],
                [cell(0, "a", 150), cell(1, "bb", 150)],
            ];
            expect(fitColumns(given(long, { width: 300, uneven: true, fixed: true }), 400, measure).unsupported).to.equal(
                "a long word in a table laid out fixed whose rows give a column different widths",
            );
            // Nor whether its columns can be wider than the table for their widest words
            const words = [
                [cell(0, "aaaaaaaaaaaaaaaaaa", 200), cell(1, "bbbbbbbbbbbbbbbbbb", 200)],
                [cell(0, "a", 250), cell(1, "b", 150)],
            ];
            expect(fitColumns(given(words, { width: 300, uneven: true, fixed: true }), 400, measure).unsupported).to.equal(
                "a word longer than its table can make room for",
            );
        });

        it("should share a long word across columns among them, and narrow the others to keep the table's width, as Word does", () => {
            // Word's SP15c: a word of 6191 twips with its margins, in a cell of 4000 across columns of 2000 and 2000, beside
            // one of 5026 in a table 9026 wide, came out 3096, 3096 and 2832: the word shared equally, and the third column
            // narrowed toward its widest word to keep the table's width. Here, a word of 130 points across columns of 50,
            // beside 200, in 300
            const rows = (second: number): readonly (readonly Cell[])[] => [
                [across(0, 2, "aaaaaaaaaaaa", 50 + second), cell(2, "b", 200)],
                [cell(0, "a", 50), cell(1, "a", second), cell(2, "b", 200)],
            ];
            const sized = fitColumns(given(rows(50), { width: 300 }), 300, measure);
            expect(widthsOf(sized)).to.deep.equal([120, 160]);
            expect(widthsOf(sized, 1)).to.deep.equal([55, 55, 160]);
            // Across columns of different widths, how Word shares it hasn't been seen
            expect(fitColumns(given(rows(70), { width: 300 }), 300, measure).unsupported).to.equal(
                "a long word in cells merged across columns",
            );
        });
    });

    it("should size a table of more cells than a function takes arguments", () => {
        // 40,000 rows of 3 cells, each column's widest the same in every row
        const tall = table(Array.from({ length: 40000 }, () => [cell(0, "a", 30), cell(1, "bb"), cell(2, "ccc")]));
        expect(widthsOf(fitColumns(tall, 200, measure), 39999)).to.deep.equal([20, 20, 30]);
    });

    it("should leave a table whose columns aren't sized to their text as it is", () => {
        const fixed: TableBlock = { ...table([[cell(0, "a")]]), fit: undefined };
        expect(fitColumns(fixed, 200, measure)).to.equal(fixed);
    });

    describe("cells across columns", () => {
        it("should share what a cell across columns needs beyond their widest lines among them, in proportion to those", () => {
            // Columns of 20 and 40 points with their margins, under a widest line of 150: the 90 more is shared 1 to 2
            const sized = fitColumns(table([[across(0, 2, "aaaa bbbb cccc")], [cell(0, "a"), cell(1, "bbb")]]), 200, measure);
            expect(widthsOf(sized)).to.deep.equal([140]);
            expect(widthsOf(sized, 1)).to.deep.equal([40, 90]);
            // The width a cell across columns gives itself counts as its widest line
            const own = fitColumns(table([[across(0, 2, "a", 150)], [cell(0, "a"), cell(1, "bbb")]]), 200, measure);
            expect(widthsOf(own, 1)).to.deep.equal([40, 90]);
            // A cell across columns that are wide enough for it leaves them as they are
            const narrow = fitColumns(table([[across(0, 2, "a")], [cell(0, "a"), cell(1, "bbb")]]), 200, measure);
            expect(widthsOf(narrow)).to.deep.equal([50]);
            expect(widthsOf(narrow, 1)).to.deep.equal([10, 30]);
        });

        it("should count a column given a width as that wide, and widen it with the rest", () => {
            // 60 given, beside 40: the 50 more is shared 3 to 2, so the column given 60 is 90 wide
            const sized = fitColumns(table([[across(0, 2, "aaaa bbbb cccc")], [cell(0, "a", 60), cell(1, "bbb")]]), 200, measure);
            expect(widthsOf(sized, 1)).to.deep.equal([80, 50]);
        });

        it("should leave a column without a cell of its own 0 wide, and share among columns all 0 wide equally", () => {
            // The second column has no cell of its own, so each cell across it widens the other column it is across, and the
            // cell across the first two is as wide as the first
            const staggered = table([
                [across(0, 2, "aaaa bbbb"), cell(2, "a")],
                [cell(0, "a"), across(1, 2, "aaaa bbbb cccc")],
            ]);
            const sized = fitColumns(staggered, 300, measure);
            expect(widthsOf(sized)).to.deep.equal([90, 140]);
            expect(widthsOf(sized, 1)).to.deep.equal([90, 140]);
            // Two columns with no cells of their own share 100 equally. The second's 50 then goes toward the 150 of the cell
            // across it and the third
            const shared = fitColumns(table([[across(0, 2, "aaaa bbbb")], [across(1, 2, "aaaa bbbb cccc")]]), 400, measure);
            expect(widthsOf(shared)).to.deep.equal([190]);
            expect(widthsOf(shared, 1)).to.deep.equal([140]);
        });

        it("should share the cells across columns in the rows' order", () => {
            // The cell across 3 columns doubles them to 40, 80 and 160, then the one across 2 doubles the first 2 again. Had
            // the narrower been shared first, the third column would have been 80
            const sized = fitColumns(
                table([
                    [across(0, 3, "aaaa bbbb cccc dddd eeee ff")],
                    [across(0, 2, "aaaa bbbb cccc dddd eee"), cell(2, "x")],
                    [cell(0, "a"), cell(1, "aaa"), cell(2, "aaaaaaa")],
                ]),
                400,
                measure,
            );
            expect(widthsOf(sized, 2)).to.deep.equal([70, 150, 150]);
        });

        it("should share a word across columns wider than their widest lines by their widest words and lines added up", () => {
            // Word's SP17 in word-watertight-stops.docx and U1e in word-probes.docx. Here, a word of 110 points with its
            // margins across columns whose widest words and lines are 20 and 20, and 30 and 60: shared 40 to 90
            const sized = fitColumns(table([[across(0, 2, "aaaaaaaaaa")], [cell(0, "a"), cell(1, "aa bb")]]), 300, measure);
            expect(widthsOf(sized)).to.deep.equal([100]);
            expect(widthsOf(sized, 1)).to.deep.equal([23.8, 66.2]);
            // A table in the cell of a table sized to its text counts as wide as the word
            expect(tableWidths(table([[across(0, 2, "aaaaaaaaaa")], [cell(0, "a"), cell(1, "aa bb")]]), measure)).to.deep.equal({
                min: 110,
                max: 110,
            });
        });

        it("should stop at a word across columns wider than their widest words, where Word's sharing isn't known", () => {
            const unsupported = "a long word in cells merged across columns";
            // A word of 70 wider than their widest words, 30 and 30, but not their lines: only when they are narrowed (U1m)
            const longWord = table([[across(0, 2, "aaaaaa")], [cell(0, "a bb cc"), cell(1, "a bb cc dd")]]);
            expect(widthsOf(fitColumns(longWord, 300, measure), 1)).to.deep.equal([70, 100]);
            expect(fitColumns(longWord, 150, measure).unsupported).to.equal(unsupported);
            // One wider than their widest lines too, when they are narrowed around it
            const beside = table([
                [across(0, 2, "aaaaaaaaaa"), cell(2, LONG)],
                [cell(0, "a"), cell(1, "aa bb"), cell(2, "x")],
            ]);
            expect(fitColumns(beside, 200, measure).unsupported).to.equal(unsupported);
            // A share narrower than a column's widest line, which Word hasn't been seen to give
            expect(
                fitColumns(table([[across(0, 2, "a".repeat(22))], [cell(0, "aaaa"), cell(1, "a a a a a a a a")]]), 400, measure)
                    .unsupported,
            ).to.equal(unsupported);
            // A word with more text beside it
            expect(
                fitColumns(table([[across(0, 2, "aaaaaaaaaa b")], [cell(0, "a"), cell(1, "aa bb")]]), 300, measure).unsupported,
            ).to.equal(unsupported);
        });
    });
});

describe("tableWidths", () => {
    // 1 and 2 points of borders either side, half of each outside the columns
    const borders = { borderLeft: 1, borderRight: 2 };

    it("should count a table sized to its text as its columns' widest words and widest lines added up", () => {
        const inner = { ...table([[cell(0, "a"), cell(1, "aa bb")], [across(0, 2, "aaaa bbbb cccc")]]), ...borders };
        // Columns of 20 and 30 at their widest words, and of 20 and 60 at their widest lines, which the cell across them
        // widens to 150
        expect(tableWidths(inner, measure)).to.deep.equal({ min: 51.5, max: 151.5 });
        // A share of the width it is in counts as its text
        expect(tableWidths({ ...inner, fit: { share: 1 } }, measure)).to.deep.equal({ min: 51.5, max: 151.5 });
        expect(tableWidths({ ...inner, borderLeft: undefined, borderRight: undefined }, measure)).to.deep.equal({ min: 50, max: 150 });
    });

    it("should count the rows of a table deleted in a tracked change, as Word sizes its columns by them", () => {
        const inner = { ...table([[cell(0, "a")]]), deletedRows: [deleted([cell(0, "aaaa bbbb")])] };
        expect(tableWidths(inner, measure)).to.deep.equal({ min: 50, max: 100 });
        expect(tableWidths({ ...inner, fit: undefined, deletedRows: [deleted([{ ...cell(0, "b"), width: 80 }])] }, measure)).to.deep.equal({
            min: 90,
            max: 90,
        });
    });

    it("should count a table with a width of its own as that wide, and one not sized to its text as its cells", () => {
        expect(tableWidths({ ...table([[cell(0, "a")]], { width: 100 }), ...borders }, measure)).to.deep.equal({ min: 101.5, max: 101.5 });
        const fixed: TableBlock = {
            ...table([
                [
                    { ...cell(0, "a"), width: 40 },
                    { ...cell(1, "b"), width: 50 },
                ],
                [{ ...cell(0, "c"), width: 20 }],
            ]),
            fit: undefined,
            ...borders,
        };
        expect(tableWidths(fixed, measure)).to.deep.equal({ min: 111.5, max: 111.5 });
    });
});

describe("the widths Word gave the columns of its probes' tables", () => {
    // From word-autofit.docx's D1 and word-probes.docx's U1 (scripts/layout-probes), in Calibri 11 on A4, with 1440 twips
    // of margins, so a table is in 9026 twips. Word's tables are up to 24 twips narrower than that, as #3595 found, so
    // the widths are to within 25 twips
    const ROOM = 9026 / 20;
    const TOLERANCE = 25;

    const TEXT = {
        long: "each entry of the log says what was found on the survey where it was found and what should be done about it",
        half: "each entry of the log says what was found on the survey",
        medium: "each entry of the log says what was found",
        longer: "each entry of the log says what was found on the survey where it was found",
        shorter: "the log of the survey",
        word: "Pneumonoultramicroscopicsilicovolcanoconiosis",
    };
    const SHORT = ["one", "two words", "three short words"];

    /** A cell's text, or a table in it below its text, and the columns it is across or the width it gives itself */
    type Spec = string | { readonly text?: string; readonly span?: number; readonly width?: number; readonly table?: Table };

    /** A table of rows of cells without widths, unless a cell gives one, as the probes write them */
    const autoTable = (rows: readonly (readonly Spec[])[], width?: ConstructorParameters<typeof Table>[0]["width"]): Table =>
        new Table({
            ...(width ? { width } : {}),
            rows: rows.map(
                (row) =>
                    new TableRow({
                        children: row.map((spec) => {
                            const { text = "", span, width: own, table: inner } = typeof spec === "string" ? { text: spec } : spec;
                            return new TableCell({
                                ...(span === undefined ? {} : { columnSpan: span }),
                                ...(own === undefined ? {} : { width: { size: own, type: WidthType.DXA } }),
                                children: inner
                                    ? [...(text ? [new Paragraph(text)] : []), inner, new Paragraph("")]
                                    : [new Paragraph(text)],
                            });
                        }),
                    }),
            ),
        });

    /** A table as the layout reads it from a document of Calibri 11 */
    const read = (written: Table): TableBlock => {
        let blocks: readonly Block[] = [];
        const file = new File({
            styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
            sections: [{ children: [written] }],
            pageNumbers: (body, context) => {
                blocks = readDocument(body, context).blocks.map(({ block }) => block);
                return { bookmarks: new Map() };
            },
        });
        new Formatter().format(file.Document.View, { file, viewWrapper: file.Document, stack: [] } as unknown as IContext);
        return blocks[0] as TableBlock;
    };

    const calibri = measureWith(DEFAULT_MEASURER);

    /** The widths of a table's columns in twips, between where its rows' cells end */
    const columnsOf = (sized: TableBlock): readonly number[] => {
        const ends = sized.rows.flatMap(({ cells }) =>
            cells.map((_, index) =>
                cells.slice(0, index + 1).reduce((end, { width, marginLeft, marginRight }) => end + width + marginLeft + marginRight, 0),
            ),
        );
        const edges = [0, ...[...ends].sort((a, b) => a - b)].filter((edge, index, all) => index === 0 || edge - all[index - 1] > 0.1);
        return edges.slice(1).map((edge, index) => Math.round((edge - edges[index]) * 20));
    };

    const expectWidths = (actual: readonly number[], word: readonly number[]): void => {
        expect(actual).to.have.length(word.length);
        actual.forEach((width, index) => expect(width).to.be.closeTo(word[index], TOLERANCE));
    };

    it("should share what cells across columns need among them as Word did", () => {
        const probes: readonly (readonly [Table, readonly number[]])[] = [
            // D1: Word's split of a title across two columns, which the columns' widest lines and words didn't explain
            [
                autoTable([
                    ["D1c1", "D1c2", "D1c3"],
                    [{ text: TEXT.long, span: 2 }, "one"],
                    ["one", "two words", "three"],
                ]),
                [3053, 5249, 700],
            ],
            // U1a: as D1, with other texts
            [
                autoTable([
                    [{ text: TEXT.long, span: 2 }, "two"],
                    ["one", "three short words", "two"],
                ]),
                [2028, 6413, 561],
            ],
            // U1b to U1d: wider than its columns, across 2 and 3, and narrower than them
            [autoTable([[{ text: TEXT.medium, span: 2 }], ["one", "two words"]]), [1285, 2684]],
            [autoTable([[{ text: TEXT.medium, span: 3 }], SHORT]), [623, 1304, 2042]],
            [autoTable([[{ text: "one", span: 2 }], ["two words", "three short words"]]), [1165, 1816]],
            // U1e: a long word across them, shared by their widest words and lines added up, as SP17
            [autoTable([[{ text: TEXT.word, span: 2 }], ["one", "two words"]]), [1658, 2872]],
            // U1f: staggered, so the middle column has no cell of its own and is 0 wide
            [
                autoTable([
                    [{ text: TEXT.shorter, span: 2 }, "one"],
                    ["one", { text: TEXT.medium, span: 2 }],
                ]),
                [2051, 3965],
            ],
            // U1g: over a column given 1500, which takes its share. U1h: given 6000 itself
            [autoTable([[{ text: TEXT.medium, span: 2 }], [{ text: "one", width: 1500 }, "two words"]]), [2234, 1735]],
            [autoTable([[{ text: "one", span: 2, width: 6000 }], ["one", "two words"]]), [1941, 4051]],
            // U1i: two over a shared column. U1u: across 3 columns, then across 2 of them, in the rows' order
            [autoTable([[{ text: TEXT.shorter, span: 2 }, "x"], ["x", { text: TEXT.medium, span: 2 }], SHORT]), [666, 1716, 2248]],
            [autoTable([[{ text: TEXT.longer, span: 3 }], [{ text: TEXT.half, span: 2 }, "x"], SHORT]), [1697, 3537, 3596]],
            // U1j: in a table of 100%. U1k and U1l: narrowed to the page
            [
                autoTable(
                    [
                        [{ text: TEXT.shorter, span: 2 }, "three short words"],
                        ["one", "two words", "x"],
                    ],
                    { size: 100, type: WidthType.PERCENTAGE },
                ),
                [1548, 3221, 4233],
            ],
            [autoTable([[{ text: TEXT.long, span: 3 }], ["1.1", "two words", "three short words"]]), [1309, 3024, 4669]],
            [
                autoTable([
                    [{ text: TEXT.long, span: 2 }, TEXT.long],
                    ["one", "two words", "x"],
                ]),
                [1591, 3068, 4343],
            ],
        ];
        probes.forEach(([written, word]) => expectWidths(columnsOf(fitColumns(read(written), ROOM, calibri)), word));
    });

    it("should size a column to a table in its cell, and the table in the cell, as Word did", () => {
        const nested = (...rows: readonly (readonly Spec[])[]): Table => autoTable(rows);
        const probes: readonly (readonly [Table, readonly number[], readonly number[]])[] = [
            // U1n and U1o: sized to its text, beside short text and beside long
            [autoTable([[{ table: nested(["one", "two words"]) }, "one"]]), [1946, 556], [556, 1165]],
            [autoTable([[{ table: nested(["one", TEXT.long]) }, TEXT.long]]), [4894, 4108], [556, 4113]],
            // U1p and U1q: 3000 wide, and 100%
            [
                autoTable([[{ table: autoTable([["one", "two words"]], { size: 3000, type: WidthType.DXA }) }, "two words"]]),
                [3221, 1165],
                [973, 2023],
            ],
            [
                autoTable([[{ table: autoTable([["one", "two words"]], { size: 100, type: WidthType.PERCENTAGE }) }, "two words"]]),
                [1946, 1165],
                [556, 1165],
            ],
            // U1r: below a paragraph wider than it
            [autoTable([[{ text: "three short words", table: nested(["one"]) }, "two words"]]), [1817, 1164], [556]],
            // U1s: of cells given 1500 and 1500. U1t: of long text, narrowed to the page
            [
                autoTable([
                    [
                        {
                            table: nested([
                                { text: "one", width: 1500 },
                                { text: "two", width: 1500 },
                            ]),
                        },
                        "two words",
                    ],
                ]),
                [3221, 1165],
                [1500, 1496],
            ],
            [autoTable([[{ table: nested([TEXT.long]) }, TEXT.half]]), [5882, 3120], [5656]],
        ];
        probes.forEach(([written, word, wordInner]) => {
            const sized = fitColumns(read(written), ROOM, calibri);
            expectWidths(columnsOf(sized), word);
            // The table in the cell is sized in the cell's width, as any table is
            const [outer] = sized.rows[0].cells;
            const inner = outer.blocks.find((block): block is TableBlock => block.type === "table")!;
            expectWidths(columnsOf(fitColumns(inner, outer.width, calibri)), wordInner);
        });
    });

    it("should size the tables of word-watertight-stops.docx as Word did", () => {
        // Word's widths are read from where it drew the tables' borders, which it draws a little in from the columns' edges:
        // a border is 2.9 + 0.99877 times its edge, as SP15b's and SP15c's show, whose edges are known. They are good to 2
        // twips, against the 25 of the probes above
        const given = (rows: readonly (readonly Spec[])[], options: Partial<ConstructorParameters<typeof Table>[0]>): Table =>
            new Table({
                ...options,
                rows: rows.map(
                    (row) =>
                        new TableRow({
                            children: row.map((spec) => {
                                const { text = "", span, width } = typeof spec === "string" ? { text: spec } : spec;
                                return new TableCell({
                                    ...(span === undefined ? {} : { columnSpan: span }),
                                    ...(width === undefined ? {} : { width: { size: width, type: WidthType.DXA } }),
                                    children: [new Paragraph(text)],
                                });
                            }),
                        }),
                ),
            });
        const dxa = (size: number): ConstructorParameters<typeof Table>[0]["width"] => ({ size, type: WidthType.DXA });
        // A word of m's about this many twips wide in Calibri 11, as the probe writes it
        const word = (twips: number): string => "m".repeat(Math.round(twips / 175.78));
        const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");
        const sp14 = (fixed: boolean): Table =>
            given(
                [
                    [
                        { text: `SP14 row 1 left ${prose(12)}`, width: 3000 },
                        { text: `SP14 row 1 right ${prose(20)}`, width: 6026 },
                    ],
                    [
                        { text: `SP14 row 2 left ${prose(12)}`, width: 4000 },
                        { text: `SP14 row 2 right ${prose(20)}`, width: 5026 },
                    ],
                ],
                { width: dxa(9026), columnWidths: [3000, 6026], ...(fixed ? { layout: TableLayoutType.FIXED } : {}) },
            );
        const probes: readonly (readonly [Table, readonly number[]])[] = [
            // SP14a and SP14b: rows of 3000 and 6026, and 4000 and 5026, laid out fixed or not
            [sp14(false), [3604, 5419]],
            [sp14(true), [3604, 5419]],
            // SP15b: a word of 2988 in a cell of 2000, beside 4000, in a table 9000 wide
            [
                given(
                    [
                        [
                            { text: `SP15b ${word(3000)}`, width: 2000 },
                            { text: "SP15b right two words", width: 4000 },
                        ],
                    ],
                    { width: dxa(9000), columnWidths: [2000, 4000] },
                ),
                [4003, 4996],
            ],
            // SP15c: a word of 5976 across columns of 2000, beside 5026, in 9026
            [
                given(
                    [
                        [
                            { text: `SP15c ${word(6000)}`, width: 4000, span: 2 },
                            { text: "SP15c right", width: 5026 },
                        ],
                        [
                            { text: "SP15c one", width: 2000 },
                            { text: "SP15c two", width: 2000 },
                            { text: "SP15c three", width: 5026 },
                        ],
                    ],
                    { width: dxa(9026), columnWidths: [2000, 2000, 5026] },
                ),
                [3096, 3096, 2832],
            ],
            // SP17: words of 2988 to 5976 across "one" and "two words", and across those and "three short words", in tables
            // given no widths
            ...(
                [
                    [3000, [1171, 2035]],
                    [4000, [1560, 2697]],
                    [5000, [1881, 3254]],
                    [6000, [2265, 3926]],
                ] as const
            ).map(([twips, widths]): readonly [Table, readonly number[]] => [
                autoTable([[{ text: word(twips), span: 2 }], ["one", "two words"]]),
                widths,
            ]),
            ...(
                [
                    [4000, [845, 1459, 1953]],
                    [6000, [1224, 2126, 2841]],
                ] as const
            ).map(([twips, widths]): readonly [Table, readonly number[]] => [autoTable([[{ text: word(twips), span: 3 }], SHORT]), widths]),
        ];
        probes.forEach(([written, widths]) => {
            const sized = fitColumns(read(written), ROOM, calibri);
            expect(sized.unsupported).to.equal(undefined);
            const actual = columnsOf(sized);
            expect(actual).to.have.length(widths.length);
            actual.forEach((width, index) => expect(width).to.be.closeTo(widths[index], 5));
        });
        // SP15a: a word of 11950 in a cell of 3000, beside 6026, in a table 9026 wide, kept the first column as wide as it
        // and its margins, 12167, and the table went past the page, so the second was off it. The second cell's 4 words
        // took a line each, so it was narrower than 1033 twips, at which "right two" would have fitted on a line
        const sp15a = fitColumns(
            read(
                given(
                    [
                        [
                            { text: `SP15a ${word(12000)}`, width: 3000 },
                            { text: "SP15a right two words", width: 6026 },
                        ],
                    ],
                    { width: dxa(9026), columnWidths: [3000, 6026] },
                ),
            ),
            ROOM,
            calibri,
        );
        const [first, second] = columnsOf(sp15a);
        expect(first).to.be.closeTo(12167, 5);
        expect(second).to.be.below(1033);
    });

    it("should stop at the long words across columns Word's probes didn't settle", () => {
        // U1m: a word wider than the widest words of the columns it is across, narrowed
        expect(fitColumns(read(autoTable([[{ text: TEXT.word, span: 2 }], [TEXT.half, TEXT.long]])), ROOM, calibri).unsupported).to.equal(
            "a long word in cells merged across columns",
        );
    });
});
