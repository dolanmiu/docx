import { describe, expect, it } from "vitest";

import { Paragraph } from "@file/paragraph";
import {
    DEFAULT_AVAILABLE_WIDTH,
    countGridColumns,
    resolveColumnWidths,
    resolvePreferredWidth,
    resolveTableWidth,
} from "@file/table/column-widths";
import { TableCell } from "@file/table/table-cell";
import { TableRow } from "@file/table/table-row";
import { type ITableWidthProperties, WidthType } from "@file/table/table-width";

const pct = (size: number | `${number}%`): ITableWidthProperties => ({ size, type: WidthType.PERCENTAGE });
const dxa = (size: number | `${number}in`): ITableWidthProperties => ({ size, type: WidthType.DXA });

const cell = (width?: ITableWidthProperties, columnSpan?: number): TableCell =>
    new TableCell({ children: [new Paragraph("x")], width, columnSpan });

const row = (...cells: readonly TableCell[]): TableRow => new TableRow({ children: cells });

describe("column-widths", () => {
    describe("DEFAULT_AVAILABLE_WIDTH", () => {
        it("is the text width of the default A4 page with 1 inch margins", () => {
            expect(DEFAULT_AVAILABLE_WIDTH).to.equal(11906 - 1440 - 1440);
        });
    });

    describe("resolvePreferredWidth", () => {
        it("returns undefined when no width is given", () => {
            expect(resolvePreferredWidth(undefined, 1000)).to.be.undefined;
        });

        it("returns undefined for auto and nil widths, which express no preference", () => {
            expect(resolvePreferredWidth({ size: 100, type: WidthType.AUTO }, 1000)).to.be.undefined;
            expect(resolvePreferredWidth({ size: 100, type: WidthType.NIL }, 1000)).to.be.undefined;
            expect(resolvePreferredWidth({ size: 100 }, 1000)).to.be.undefined;
        });

        it("resolves numeric percentages relative to the reference width", () => {
            expect(resolvePreferredWidth(pct(50), 1000)).to.equal(500);
            expect(resolvePreferredWidth(pct(33.5), 1000)).to.equal(335);
        });

        it("resolves percentage strings relative to the reference width", () => {
            expect(resolvePreferredWidth(pct("25%"), 1000)).to.equal(250);
        });

        it("takes dxa widths as twips", () => {
            expect(resolvePreferredWidth(dxa(1234), 1000)).to.equal(1234);
        });

        it("converts universal measures to twips", () => {
            expect(resolvePreferredWidth(dxa("1in"), 1000)).to.equal(1440);
            expect(resolvePreferredWidth({ size: "0.5in", type: WidthType.PERCENTAGE }, 1000)).to.equal(720);
        });

        it("ignores zero and negative widths, which would produce unusable grid columns", () => {
            expect(resolvePreferredWidth(dxa(0), 1000)).to.be.undefined;
            expect(resolvePreferredWidth(pct(0), 1000)).to.be.undefined;
            expect(resolvePreferredWidth(pct("-10%"), 1000)).to.be.undefined;
        });
    });

    describe("resolveTableWidth", () => {
        it("fills the available width when the table has no usable preferred width", () => {
            expect(resolveTableWidth(undefined, 9026)).to.equal(9026);
            expect(resolveTableWidth({ size: 100 }, 9026)).to.equal(9026);
            expect(resolveTableWidth({ size: 0, type: WidthType.DXA }, 9026)).to.equal(9026);
        });

        it("resolves percentages against the available width", () => {
            expect(resolveTableWidth(pct(50), 9026)).to.equal(4513);
            expect(resolveTableWidth(pct("100%"), 9026)).to.equal(9026);
        });

        it("uses dxa widths directly", () => {
            expect(resolveTableWidth(dxa(3000), 9026)).to.equal(3000);
        });
    });

    describe("countGridColumns", () => {
        it("returns 0 for a table without rows", () => {
            expect(countGridColumns([])).to.equal(0);
        });

        it("counts the widest row", () => {
            expect(countGridColumns([row(cell(), cell()), row(cell(), cell(), cell()), row(cell())])).to.equal(3);
        });

        it("counts spanned columns", () => {
            expect(countGridColumns([row(cell(undefined, 2), cell()), row(cell(), cell())])).to.equal(3);
        });
    });

    describe("resolveColumnWidths", () => {
        it("returns an empty grid for a table without rows", () => {
            expect(resolveColumnWidths({ rows: [], availableWidth: 9026 })).to.deep.equal([]);
        });

        it("splits the available width equally when no widths are given at all", () => {
            expect(resolveColumnWidths({ rows: [row(cell(), cell())], availableWidth: 9026 })).to.deep.equal([4513, 4513]);
        });

        it("rounds shares to whole twips", () => {
            expect(resolveColumnWidths({ rows: [row(cell(), cell(), cell())], availableWidth: 9026 })).to.deep.equal([3009, 3009, 3009]);
        });

        it("resolves a percentage table with percentage cells against the available width (#1457)", () => {
            const rows = [row(cell(pct(90)), cell(pct(10))), row(cell(pct(90)), cell(pct(10)))];

            expect(resolveColumnWidths({ rows, width: pct(100), availableWidth: 9026 })).to.deep.equal([8123, 903]);
        });

        it("resolves percentage strings on the table and the cells", () => {
            const rows = [row(cell(pct("50%")), cell(pct("50%")))];

            expect(resolveColumnWidths({ rows, width: pct("50%"), availableWidth: 10000 })).to.deep.equal([2500, 2500]);
        });

        it("resolves cell percentages relative to the table width, not the available width", () => {
            const rows = [row(cell(pct(50)), cell(pct(50)))];

            expect(resolveColumnWidths({ rows, width: dxa(5000), availableWidth: 10000 })).to.deep.equal([2500, 2500]);
        });

        it("splits a percentage table equally when the cells have no widths", () => {
            const rows = [row(cell(), cell(), cell(), cell())];

            expect(resolveColumnWidths({ rows, width: pct(50), availableWidth: 10000 })).to.deep.equal([1250, 1250, 1250, 1250]);
        });

        it("uses dxa cell widths as they are, regardless of the table width", () => {
            const rows = [row(cell(dxa(3505)), cell(dxa(5505)))];

            expect(resolveColumnWidths({ rows, availableWidth: 10000 })).to.deep.equal([3505, 5505]);
            expect(resolveColumnWidths({ rows, width: pct(100), availableWidth: 10000 })).to.deep.equal([3505, 5505]);
        });

        it("converts universal measure cell widths to twips", () => {
            const rows = [row(cell(dxa("1in")), cell(dxa("2in")))];

            expect(resolveColumnWidths({ rows, availableWidth: 10000 })).to.deep.equal([1440, 2880]);
        });

        it("takes the first cell that occupies a column when rows disagree", () => {
            const rows = [row(cell(pct(20)), cell()), row(cell(pct(40)), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(10000), availableWidth: 10000 })).to.deep.equal([2000, 8000]);
        });

        it("takes the width for a column from a later row when the first row has no preference", () => {
            const rows = [row(cell(), cell()), row(cell(dxa(1000)), cell(dxa(2000)))];

            expect(resolveColumnWidths({ rows, availableWidth: 10000 })).to.deep.equal([1000, 2000]);
        });

        it("shares what is left of the table width among the columns without a width", () => {
            const rows = [row(cell(dxa(4000)), cell(), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(10000), availableWidth: 10000 })).to.deep.equal([4000, 3000, 3000]);
        });

        it("gives columns without a width an equal share of the table width when the other cells already exceed it", () => {
            const rows = [row(cell(dxa(8000)), cell(dxa(8000)), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(9000), availableWidth: 10000 })).to.deep.equal([8000, 8000, 3000]);
        });

        it("ignores auto, nil and zero cell widths", () => {
            const rows = [row(cell({ size: 100, type: WidthType.AUTO }), cell({ size: 0, type: WidthType.NIL }), cell(dxa(0)))];

            expect(resolveColumnWidths({ rows, width: dxa(9000), availableWidth: 10000 })).to.deep.equal([3000, 3000, 3000]);
        });

        it("shares a spanning cell's width among the columns it spans", () => {
            const rows = [row(cell(dxa(6000), 2)), row(cell(), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(6000), availableWidth: 10000 })).to.deep.equal([3000, 3000]);
        });

        it("gives the rest of a spanning cell's width to the spanned columns that are still unresolved", () => {
            const rows = [row(cell(dxa(6000), 2)), row(cell(dxa(2000)), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(6000), availableWidth: 10000 })).to.deep.equal([2000, 4000]);
        });

        it("does not let a spanning cell override columns that single cells already resolved", () => {
            const rows = [row(cell(dxa(6000), 2), cell(dxa(4000))), row(cell(dxa(1000)), cell(dxa(5000)), cell(dxa(4000)))];

            expect(resolveColumnWidths({ rows, width: dxa(10000), availableWidth: 10000 })).to.deep.equal([1000, 5000, 4000]);
        });

        it("ignores a spanning cell whose width is already used up by the resolved columns", () => {
            const rows = [row(cell(dxa(3000), 2)), row(cell(dxa(3000)), cell())];

            expect(resolveColumnWidths({ rows, width: dxa(8000), availableWidth: 10000 })).to.deep.equal([3000, 5000]);
        });

        it("fills a column that only exists because of a span in another row", () => {
            const rows = [row(cell(dxa(2000)), cell(dxa(3000), 2)), row(cell(dxa(2000)), cell(dxa(1000)))];

            expect(resolveColumnWidths({ rows, width: dxa(6000), availableWidth: 10000 })).to.deep.equal([2000, 1000, 2000]);
        });
    });
});
