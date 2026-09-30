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

    it("should leave a table whose columns aren't sized to their text as it is", () => {
        const fixed: TableBlock = { ...table([[cell(0, "a")]]), fit: undefined };
        expect(fitColumns(fixed, 200, measure)).to.equal(fixed);
    });
});
