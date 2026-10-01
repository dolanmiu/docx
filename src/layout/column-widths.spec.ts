import { describe, expect, it } from "vitest";

import { type InlineItem, type TextMeasurer, measureContentWidths } from "../text-layout";
import { fitColumns } from "./column-widths";
import type { Block, TableBlock, TableCell } from "./read-document";

// Every character is 10 points wide
const MEASURER: TextMeasurer = {
    measureWidth: (text) => [...text].length * 10,
    measureLineHeight: () => 10,
};

/** How narrow and how wide the paragraphs of a cell can be, 10 points a character */
const measure = (blocks: readonly Block[]): { readonly min: number; readonly max: number } =>
    blocks.reduce(
        (widths, block) => {
            if (block.type !== "paragraph") {
                return widths;
            }
            const { min, max } = measureContentWidths(block.items as readonly InlineItem[], { measurer: MEASURER });
            return { min: Math.max(widths.min, min), max: Math.max(widths.max, max) };
        },
        { min: 0, max: 0 },
    );

/** A cell of text, with 5 points either side of it, and the width it gives itself, if any */
const cell = (column: number, text: string, ownWidth?: number): TableCell => ({
    column,
    width: 0,
    ...(ownWidth === undefined ? {} : { ownWidth }),
    blocks: [{ type: "paragraph", items: [{ type: "text", text, font: {} }], format: {}, tabStops: [], markFont: {} }],
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 5,
    marginRight: 5,
});

/** A table of rows of cells, sized to its text, with its own width when given */
const table = (rows: readonly (readonly TableCell[])[], fit: TableBlock["fit"] = {}): TableBlock => ({
    type: "table",
    rows: rows.map((cells) => ({ cells, header: false, cantSplit: false, borderTop: 0, borderBottom: 0 })),
    fit,
});

/** The width of the text of each cell of the first row, rounded to a tenth of a point */
const widthsOf = (sized: TableBlock): readonly number[] => sized.rows[0].cells.map(({ width }) => Math.round(width * 10) / 10);

const LONG = "aaaa bbbb cccc dddd eeee ffff";

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

    it("should widen the columns in proportion to fill the table's own width", () => {
        const cells = [[cell(0, "aa"), cell(1, "bbbb bbb")]];
        // Columns of 30 and 90 points with their margins, whose widest words are 30 and 50
        expect(widthsOf(fitColumns(table(cells, { width: 180 }), 400, measure))).to.deep.equal([35, 125]);
        expect(widthsOf(fitColumns(table(cells, { share: 0.5 }), 480, measure))).to.deep.equal([50, 170]);
        // A table's width narrower than its columns narrows them, as the room does
        expect(widthsOf(fitColumns(table(cells, { width: 100 }), 400, measure))).to.deep.equal([20, 60]);
    });

    describe("in a table whose cells all have widths", () => {
        /** A table of rows of cells that all have widths */
        const given = (
            rows: readonly (readonly TableCell[])[],
            acrossColumns = false,
            width: { readonly width?: number; readonly share?: number } = {},
        ): TableBlock => ({
            ...table(rows),
            fit: undefined,
            widen: { ...width, acrossColumns },
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
            expect(widthsOf(fitColumns(given(cells, false, { width: 130 }), 300, measure))).to.deep.equal([60, 50]);
            expect(widthsOf(fitColumns(given(cells, false, { share: 0.5 }), 260, measure))).to.deep.equal([60, 50]);
        });

        it("should stop at a word longer than its table can make room for, or a long word in a table wider than its cells", () => {
            const cells = [[cell(0, "aaaaaa", 30), cell(1, LONG, 100)]];
            // Word's L7: a word longer than the page's text was broken across lines, and the other column narrowed past its
            // widest word, to a width its words don't explain
            expect(fitColumns(given(cells), 100, measure).unsupported).to.equal("a word longer than its table can make room for");
            expect(fitColumns(given(cells, false, { width: 400 }), 500, measure).unsupported).to.equal(
                "a long word in a table wider than its cells",
            );
        });

        it("should stop at a word longer than its cell in a table with cells merged across columns", () => {
            const merged = given([[cell(0, "aaaaaa", 30), cell(1, LONG, 270)]], true);
            expect(fitColumns(merged, 300, measure).unsupported).to.equal(
                "a word longer than its cell in a table with cells merged across columns",
            );
            // Unless the words fit
            const fitting = given([[cell(0, "aa", 30), cell(1, LONG, 270)]], true);
            expect(fitColumns(fitting, 300, measure)).to.equal(fitting);
        });
    });

    it("should leave a table whose columns aren't sized to their text as it is", () => {
        const fixed: TableBlock = { ...table([[cell(0, "a")]]), fit: undefined };
        expect(fitColumns(fixed, 200, measure)).to.equal(fixed);
    });
});
