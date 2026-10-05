import { describe, expect, it } from "vitest";

import { BorderStyle, Document, Paragraph, Table, TableBorders, TableCell, TableRow, TextDirection, TextRun, WidthType } from "docx";

import { layoutDocument } from "./layout-document";
import {
    type BorderedCell,
    type PlacedCell,
    borderBetween,
    conditionalTypesOf,
    readBorderSet,
    readCellSpacing,
    readTableLook,
    roomOf,
    rowBorders,
    sideBorders,
    tableGeometry,
} from "./table-formats";

const border = (style: string, size?: number, space?: number): object => ({
    _attr: { "w:val": style, ...(size === undefined ? {} : { "w:sz": size }), ...(space === undefined ? {} : { "w:space": space }) },
});
const single = (width: number): { readonly style: string; readonly width: number } => ({ style: "single", width });
const NONE = { style: "none", width: 0 };
const of = (style: string, width: number): { readonly style: string; readonly width: number } => ({ style, width });

describe("readBorderSet", () => {
    it("should read each side a table or cell gives, with its width and space in points, and none for nil, none or no width", () => {
        const borders = readBorderSet([
            { "w:top": border("single", 24, 4) },
            { "w:start": border("double", 8) },
            { "w:end": border("nil", 8) },
            { "w:insideH": border("single") },
            { "w:insideV": border("none", 4) },
        ]);
        expect(borders).to.deep.equal({
            top: { style: "single", width: 3, space: 4 },
            left: { style: "double", width: 1 },
            right: NONE,
            insideH: NONE,
            insideV: NONE,
        });
        // A border without a style is none
        expect(readBorderSet([{ "w:bottom": { _attr: { "w:sz": 8 } } }, { "w:left": border("single", 4) }])).to.deep.equal({
            bottom: NONE,
            left: single(0.5),
        });
        expect(readBorderSet(undefined)).to.deep.equal({});
    });
});

describe("roomOf", () => {
    it("should give the room each style of border takes, as Word's PDFs showed it", () => {
        const rooms = (style: string): readonly (number | undefined)[] => [0.5, 1.5, 3].map((width) => roomOf({ style, width }));
        // word-table-formats.docx and word-table-formats2.docx BS
        expect(rooms("single")).to.deep.equal([0.5, 1.5, 3]);
        expect(rooms("dotted")).to.deep.equal([0.5, 1.5, 3]);
        expect(rooms("double")).to.deep.equal([1.5, 4.5, 9]);
        expect(rooms("triple")).to.deep.equal([2.5, 7.5, 15]);
        expect(rooms("thinThickSmallGap")).to.deep.equal([2, 3, 4.5]);
        expect(rooms("thickThinSmallGap")).to.deep.equal([2, 3, 4.5]);
        expect(rooms("thinThickThinSmallGap")).to.deep.equal([3.5, 4.5, 6]);
        expect(rooms("thinThickMediumGap")).to.deep.equal([1, 3, 6]);
        expect(rooms("thinThickLargeGap")).to.deep.equal([2.75, 3.75, 5.25]);
        expect(rooms("thickThinMediumGap")).to.deep.equal([1, 3, 6]);
        expect(rooms("thinThickThinMediumGap")).to.deep.equal([1.5, 4.5, 9]);
        expect(rooms("thickThinLargeGap")).to.deep.equal([2.75, 3.75, 5.25]);
        expect(rooms("thinThickThinLargeGap")).to.deep.equal([4, 6, 9]);
        expect(rooms("doubleWave")).to.deep.equal([5.25, 5.25, 5.25]);
        expect(rooms("dashDotStroked")).to.deep.equal([3, 3, 3]);
        expect(rooms("wave")).to.deep.equal([3, 3.75, 3]);
        expect(rooms("threeDEngrave")).to.deep.equal([2, 3, 6]);
        // word-stops-table-borders.docx TB4: the other widths Word offers
        const offered = (style: string): readonly (number | undefined)[] =>
            [0.25, 0.75, 1, 2.25, 4.5, 6].map((width) => roomOf({ style, width }));
        expect(offered("wave")).to.deep.equal([3, 3, 3, 3, 3, 3]);
        expect(offered("threeDEmboss")).to.deep.equal([1.75, 2.25, 2.5, 3.75, 7.5, 9]);
        expect(offered("threeDEngrave")).to.deep.equal([1.75, 2.25, 2.5, 3.75, 7.5, 9]);
        expect(offered("doubleWave")).to.deep.equal([5.25, 5.25, 5.25, 5.25, 5.25, 5.25]);
        // The space between a border and the text adds to it (BS31)
        expect(roomOf({ style: "single", width: 1.5, space: 10 })).to.equal(11.5);
        expect(roomOf(NONE)).to.equal(0);
        expect(roomOf(undefined)).to.equal(0);
    });

    it("should give nothing for a style or width whose room Word's PDFs haven't shown", () => {
        expect(roomOf({ style: "wave", width: 1.25 })).to.equal(undefined);
        expect(roomOf({ style: "apples", width: 1.5 })).to.equal(undefined);
    });
});

describe("borderBetween", () => {
    it("should draw the border there is where the other is none, and the wider of two of the same style", () => {
        expect(borderBetween(single(1), NONE)).to.deep.equal(single(1));
        expect(borderBetween(NONE, single(1))).to.deep.equal(single(1));
        expect(borderBetween(single(1), single(3))).to.deep.equal(single(3));
        expect(borderBetween(single(3), single(1))).to.deep.equal(single(3));
    });

    it("should draw the heavier of two of different styles, by Word's weights, and of two as heavy the later style", () => {
        // word-stops-table-borders.docx TB1b: a stroked dash-dot line of 3 points over a single line of half a point
        expect(borderBetween(single(0.5), of("dashDotStroked", 3))).to.deep.equal(of("dashDotStroked", 3));
        // TB1h, TB1e: a single line of 2.25 points over a double one of half a point, which is over one of half a point
        expect(borderBetween(of("double", 0.5), single(2.25))).to.deep.equal(single(2.25));
        expect(borderBetween(of("double", 0.5), single(0.5))).to.deep.equal(of("double", 0.5));
        // TB1g, TB1j: as heavy, the double line, which is later in Word's list
        expect(borderBetween(of("double", 0.5), single(1.5))).to.deep.equal(of("double", 0.5));
        expect(borderBetween(single(1.5), of("double", 0.5))).to.deep.equal(of("double", 0.5));
        // TB1k, TB1m, TB3d: dotted and dashed lines weigh 1 whatever their width
        expect(borderBetween(of("dotted", 1.5), single(0.5))).to.deep.equal(single(0.5));
        expect(borderBetween(of("dotted", 1), of("dashed", 1))).to.deep.equal(of("dashed", 1));
    });

    it("should give nothing where a border of a style Word doesn't weigh meets another, but the wider of two the same", () => {
        expect(borderBetween(of("apples", 1), single(1))).to.equal(undefined);
        expect(borderBetween(of("apples", 1), of("apples", 2))).to.deep.equal(of("apples", 2));
        expect(borderBetween(of("apples", 2), of("apples", 1))).to.deep.equal(of("apples", 2));
    });
});

describe("rowBorders", () => {
    const cell = (column: number, borders: BorderedCell["borders"] = {}, changes: Partial<BorderedCell> = {}): BorderedCell => ({
        column,
        borders,
        ...changes,
    });

    it("should make each row taller by the widest border above its cells, a cell's own or the table's, and the wider where they meet", () => {
        const borders = rowBorders(
            [
                [cell(0), cell(1, { top: single(3) })],
                [cell(0, { top: single(0.5) }), cell(1)],
                [cell(0, { bottom: single(3) }, { span: 2 })],
            ],
            { top: single(0.5), insideH: single(1), bottom: NONE },
        );
        // word-table-formats.docx BC1, BC3: a cell's own half point beside the table's 1 point between rows gives the table's
        expect(borders).to.deep.equal({ tops: [3, 1, 1], bottom: 3, breaks: [0, 0, 3] });
    });

    it("should put no border between a cell merged down and its row above, and give a cell with none below it its bottom", () => {
        const borders = rowBorders(
            [[cell(0, {}, { verticalMerge: "restart" }), cell(1, { bottom: single(3) })], [cell(0, {}, { verticalMerge: "continue" })]],
            { insideH: single(1), bottom: single(0.5) },
        );
        expect(borders).to.deep.equal({ tops: [0, 3], bottom: 0.5, breaks: [3, 0.5] });
    });

    it("should make room for the wider of two borders of different styles that meet, though Word draws the narrower", () => {
        // word-stops-table-borders.docx TB3d: a single border of half a point, which Word draws, and a dotted one of 1.5
        // points take 1.5 points
        expect(rowBorders([[cell(0, { bottom: single(0.5) })], [cell(0, { top: of("dotted", 1.5) })]], {})).to.deep.equal({
            tops: [0, 1.5],
            bottom: 0,
            breaks: [0.5, 0],
        });
    });

    it("should say why where it can't tell the room the borders take", () => {
        expect(rowBorders([[cell(0)]], { top: of("wave", 1.25) })).to.equal("a table border in a style not yet followed");
        expect(rowBorders([[cell(0, { top: of("wave", 1.25) }), cell(1)]], {})).to.equal("a table border in a style not yet followed");
        expect(rowBorders([[cell(0, { bottom: of("wave", 1.25) })], [cell(0)]], {})).to.equal("a table border in a style not yet followed");
    });
});

describe("sideBorders", () => {
    it("should give the border left and right of each cell, its own or the table's, and the wider where cells meet", () => {
        const cells: readonly BorderedCell[] = [
            { column: 0, borders: {} },
            { column: 1, borders: { left: single(3) } },
            { column: 2, borders: { right: NONE } },
        ];
        const side = (room: number, drawn = room): object => ({ room, drawn });
        expect(sideBorders(cells, { left: single(1), insideV: single(0.5), right: single(2) })).to.deep.equal([
            { left: side(1), right: side(3) },
            { left: side(3), right: side(0.5) },
            { left: side(0.5), right: side(0) },
        ]);
        // Where Word draws the narrower of two borders, the room of each (word-stops-table-borders.docx TB2d)
        expect(sideBorders([cells[0], { column: 1, borders: { left: of("dotted", 3) } }], { insideV: single(0.5) })).to.deep.equal([
            { left: side(0), right: side(3, 0.5) },
            { left: side(3, 0.5), right: side(0) },
        ]);
        expect(sideBorders([], {})).to.deep.equal([]);
        expect(sideBorders([{ column: 0, borders: { left: of("wave", 1.25) } }], {})).to.equal(
            "a table border in a style not yet followed",
        );
        expect(sideBorders([cells[0], { column: 1, borders: { left: of("wave", 1.25) } }], {})).to.equal(
            "a table border in a style not yet followed",
        );
    });
});

describe("tableGeometry", () => {
    const placed = (borders: PlacedCell["borders"] = {}, margins = { top: 0, bottom: 0, left: 0, right: 0 }): PlacedCell => ({
        column: 0,
        borders,
        margins,
        gridWidth: 100,
    });
    const rounded = (geometry: ReturnType<typeof tableGeometry>): unknown =>
        typeof geometry === "string"
            ? geometry
            : geometry.map(({ cells, ...row }) => ({
                  ...row,
                  cells: cells.map(({ left, right, width }) => [left, right, width].map((length) => Math.round(length * 10) / 10)),
              }));

    it("should keep a cell's text its margin, or half the border beside it when that is more, from its edges", () => {
        // word-table-formats.docx BC7 to BC9: 6-point borders beside text with no margins, and with 5.4 points
        const geometry = tableGeometry(
            [
                {
                    cells: [
                        placed({ left: single(6), right: single(6) }),
                        { ...placed({}, { top: 0, bottom: 0, left: 5.4, right: 5.4 }), column: 1 },
                    ],
                    spacing: 0,
                },
            ],
            { borders: {}, spacing: 0 },
        );
        expect(rounded(geometry)).to.deep.equal([
            {
                borderTop: 0,
                borderBottom: 0,
                breakBorder: 0,
                cells: [
                    [3, 3, 94],
                    [5.4, 5.4, 89.2],
                ],
            },
        ]);
    });

    it("should put space between cells around each row's cells and their borders, and inside the table's borders", () => {
        // word-table-formats.docx CS1 to CS3, word-table-formats2.docx CS13: the table's top border above its first row,
        // and its bottom below its last, the cells' own between, and the space around each
        const rows = [0, 1].map(() => ({ cells: [placed(), { ...placed({ top: single(2) }), column: 1 }], spacing: 5 }));
        const geometry = tableGeometry(rows, { borders: { top: single(3), insideH: single(0.5), bottom: single(1) }, spacing: 5 });
        expect(rounded(geometry)).to.deep.equal([
            {
                borderTop: 3 + 5 + 5 + 3,
                borderBottom: 0.5 + 5,
                breakBorder: 1,
                breakTop: 3,
                cells: [
                    [10, 5, 85],
                    [5, 10, 85],
                ],
            },
            {
                borderTop: 2 + 5,
                borderBottom: 1 + 5 + 5 + 1,
                breakBorder: 1,
                breakTop: 3,
                cells: [
                    [10, 5, 85],
                    [5, 10, 85],
                ],
            },
        ]);
        // Where the table breaks across pages, the row on the page has the table's bottom border below the space below it,
        // and the next page's the table's top border above the space above it (word-stops-table-borders.docx TB7a to TB7c)
        // Without borders, only the space below it (CS12)
        const withoutBorders = tableGeometry([{ cells: [placed()], spacing: 5 }], { borders: {}, spacing: 5 });
        expect(
            typeof withoutBorders === "string" ? withoutBorders : [withoutBorders[0].breakBorder, withoutBorders[0].breakTop],
        ).to.deep.equal([0, undefined]);
    });

    it("should keep a cell's text in from the whole of its borders left and right, with space between cells", () => {
        // word-stops-table-borders.docx TB5a to TB5l: each cell's own borders, or the table's at its edges and between its
        // cells, take their width from the cell's text, and the table's borders none
        const cells = [placed(), { ...placed({ right: single(3) }), column: 1 }];
        const geometry = tableGeometry([{ cells, spacing: 2 }], {
            borders: { left: single(1), insideV: single(0.5), right: single(2) },
            spacing: 2,
        });
        expect(rounded(geometry)).to.deep.equal([
            {
                borderTop: 4,
                borderBottom: 4,
                breakBorder: 0,
                cells: [
                    [2 + 2 + 1, 2 + 0.5, 92.5],
                    [2 + 0.5, 2 + 2 + 3, 90.5],
                ],
            },
        ]);
    });

    it("should stop where borders of different styles meet beside text nearer than half the wider, and Word draws the narrower", () => {
        const meeting = (left: { readonly style: string; readonly width: number }, margin: number): ReturnType<typeof tableGeometry> =>
            tableGeometry(
                [
                    {
                        cells: [
                            placed({ right: single(0.5) }, { top: 0, bottom: 0, left: margin, right: margin }),
                            { ...placed({ left }, { top: 0, bottom: 0, left: margin, right: margin }), column: 1 },
                        ],
                        spacing: 0,
                    },
                ],
                { borders: {}, spacing: 0 },
            );
        // Word draws the single line, and the dotted one is wider
        expect(meeting(of("dotted", 3), 1)).to.equal("table cell borders of different styles that meet, wider than twice a cell's margin");
        // Not where the margin is wider than half of it, nor where Word draws the wider
        expect(rounded(meeting(of("dotted", 3), 2))).to.deep.equal([
            {
                borderTop: 0,
                borderBottom: 0,
                breakBorder: 0,
                cells: [
                    [2, 2, 96],
                    [2, 2, 96],
                ],
            },
        ]);
        expect(typeof meeting(of("double", 3), 1)).to.equal("object");
    });

    it("should stop at borders whose room isn't known", () => {
        expect(tableGeometry([{ cells: [placed()], spacing: 5 }], { borders: { top: of("wave", 1.25) }, spacing: 5 })).to.equal(
            "a table border in a style not yet followed",
        );
        expect(tableGeometry([{ cells: [placed({ top: of("wave", 1.25) })], spacing: 5 }], { borders: {}, spacing: 5 })).to.equal(
            "a table border in a style not yet followed",
        );
        expect(tableGeometry([{ cells: [placed({ left: of("wave", 1.25) })], spacing: 5 }], { borders: {}, spacing: 5 })).to.equal(
            "a table border in a style not yet followed",
        );
        expect(tableGeometry([{ cells: [placed()], spacing: 0 }], { borders: { left: of("wave", 1.25) }, spacing: 0 })).to.equal(
            "a table border in a style not yet followed",
        );
        expect(tableGeometry([{ cells: [placed()], spacing: 0 }], { borders: { top: of("wave", 1.25) }, spacing: 0 })).to.equal(
            "a table border in a style not yet followed",
        );
    });
});

describe("readCellSpacing", () => {
    it("should read the space between cells in points, none when it isn't given or is nil, a share, and nothing for another type", () => {
        expect(readCellSpacing({ _attr: { "w:w": 100, "w:type": "dxa" } })).to.equal(5);
        expect(readCellSpacing({ _attr: { "w:w": "0.1in" } })).to.equal(7.2);
        expect(readCellSpacing({ _attr: { "w:w": -100 } })).to.equal(0);
        expect(readCellSpacing({ _attr: {} })).to.equal(0);
        expect(readCellSpacing({ _attr: { "w:w": 100, "w:type": "nil" } })).to.equal(0);
        expect(readCellSpacing(undefined)).to.equal(0);
        expect(readCellSpacing({ _attr: { "w:w": 100, "w:type": "pct" } })).to.equal("share");
        expect(readCellSpacing({ _attr: { "w:w": 100, "w:type": "auto" } })).to.equal(undefined);
    });
});

describe("readTableLook", () => {
    it("should read the parts a table turns on from its attributes, or from w:val, and nothing when it doesn't say", () => {
        expect(
            readTableLook({ _attr: { "w:firstRow": 1, "w:lastRow": "false", "w:firstColumn": true, "w:noHBand": 0, "w:noVBand": 1 } }),
        ).to.deep.equal({
            firstRow: true,
            lastRow: false,
            firstColumn: true,
            lastColumn: false,
            rowBands: true,
            columnBands: false,
        });
        // Word's default, as Word 2007 writes it
        expect(readTableLook({ _attr: { "w:val": "04A0" } })).to.deep.equal({
            firstRow: true,
            lastRow: false,
            firstColumn: true,
            lastColumn: false,
            rowBands: true,
            columnBands: false,
        });
        // The attributes over w:val, which Word 2010 writes both of
        expect(readTableLook({ _attr: { "w:val": "04A0", "w:firstRow": 0 } })?.firstRow).to.equal(false);
        expect(readTableLook({ _attr: { "w:val": "nonsense" } })?.rowBands).to.equal(true);
        expect(readTableLook(undefined)).to.equal(undefined);
    });
});

describe("conditionalTypesOf", () => {
    const all = { firstRow: true, lastRow: true, firstColumn: true, lastColumn: true, rowBands: true, columnBands: true };
    const bands = { rows: 1, columns: 1 };

    it("should give the parts of a table style that apply to a cell, in the order Word applies them", () => {
        // word-table-formats.docx CF1 and CF6, word-table-formats2.docx CF10 and CF13: columns' bands over rows', the first
        // and last columns over them, the first and last rows over those, and the corners over all
        expect(conditionalTypesOf({ row: 0, rows: 3, cell: 0, cells: 3 }, all, bands)).to.deep.equal(["firstCol", "firstRow", "nwCell"]);
        expect(conditionalTypesOf({ row: 1, rows: 3, cell: 1, cells: 3 }, all, bands)).to.deep.equal(["band1Horz", "band1Vert"]);
        expect(conditionalTypesOf({ row: 2, rows: 3, cell: 2, cells: 3 }, all, bands)).to.deep.equal(["lastCol", "lastRow", "seCell"]);
        expect(conditionalTypesOf({ row: 0, rows: 3, cell: 2, cells: 3 }, all, bands)).to.deep.equal(["lastCol", "firstRow", "neCell"]);
        expect(conditionalTypesOf({ row: 2, rows: 3, cell: 0, cells: 3 }, all, bands)).to.deep.equal(["firstCol", "lastRow", "swCell"]);
        expect(conditionalTypesOf({ row: 1, rows: 3, cell: 1, cells: 4 }, { ...all, firstColumn: false }, bands)).to.deep.equal([
            "band1Horz",
            "band2Vert",
        ]);
        // Without the sizes of its bands, a style has none (CF1)
        expect(conditionalTypesOf({ row: 1, rows: 3, cell: 1, cells: 3 }, all, {})).to.deep.equal([]);
    });

    it("should count bands from the first row and column that aren't the table's first, in bands of their size", () => {
        const none = { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, rowBands: true, columnBands: false };
        const rowsOf = (look: typeof none, size: number): readonly string[] =>
            [0, 1, 2, 3].map((row) => conditionalTypesOf({ row, rows: 4, cell: 0, cells: 1 }, look, { rows: size, columns: 1 })[0]);
        // word-table-formats2.docx CF11, CF12
        expect(rowsOf(none, 1)).to.deep.equal(["band1Horz", "band2Horz", "band1Horz", "band2Horz"]);
        expect(rowsOf(none, 2)).to.deep.equal(["band1Horz", "band1Horz", "band2Horz", "band2Horz"]);
        expect(rowsOf({ ...none, firstRow: true }, 1)).to.deep.equal(["firstRow", "band1Horz", "band2Horz", "band1Horz"]);
        // Bands of no rows are none
        expect(rowsOf(none, 0)).to.deep.equal([undefined, undefined, undefined, undefined]);
    });

    it("should make all of a header of several rows the first row, and start the bands of rows below it", () => {
        const none = { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, rowBands: true, columnBands: false };
        const rowsOf = (look: typeof none, headerRows: number): readonly string[] =>
            [0, 1, 2, 3, 4].map((row) => conditionalTypesOf({ row, rows: 5, cell: 0, cells: 1, headerRows }, look, bands)[0]);
        // word-compat-off.docx CS2a, CS2b: the first row turned on, with 2 and 3 header rows
        expect(rowsOf({ ...none, firstRow: true }, 2)).to.deep.equal(["firstRow", "firstRow", "band1Horz", "band2Horz", "band1Horz"]);
        expect(rowsOf({ ...none, firstRow: true }, 3)).to.deep.equal(["firstRow", "firstRow", "firstRow", "band1Horz", "band2Horz"]);
        // CS2f: turned off, the header is in the second band
        expect(rowsOf(none, 2)).to.deep.equal(["band2Horz", "band2Horz", "band1Horz", "band2Horz", "band1Horz"]);
        // CS2c: a header of one row is a row like the others
        expect(rowsOf({ ...none, firstRow: true }, 1)).to.deep.equal(rowsOf({ ...none, firstRow: true }, 0));
        expect(rowsOf(none, 1)).to.deep.equal(["band1Horz", "band2Horz", "band1Horz", "band2Horz", "band1Horz"]);
    });
});

describe("tables laid out as Word lays them out", () => {
    // Calibri 11's lines in Word, in twips, and the twips in a pixel, which layoutDocument gives lengths in
    const LINE = (2500 / 2048) * 220;
    const TWIPS = 15;
    const WIDTH = 9026;
    const DEFAULTS = `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`;
    const NORMAL = `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>`;
    const NORMAL_TABLE = `<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/></w:style>`;

    /**
     * Lays out tables as word-watertight-tables.docx has them: in Calibri 11 on A4 with inch margins, with the document's
     * defaults giving no space between paragraphs and single lines, and Normal no size of its own, between a line above
     * and a line below
     */
    const layOut = (tables: readonly (Paragraph | Table)[], tableStyles = ""): ReturnType<typeof layoutDocument> =>
        layoutDocument(
            new Document({
                externalStyles: `<w:styles xmlns:w="main">${DEFAULTS}${NORMAL}${NORMAL_TABLE}${tableStyles}</w:styles>`,
                sections: [{ children: [new Paragraph("above"), ...tables, new Paragraph("below")] }],
            }),
        );
    /** The height of each row of the first table, in twips */
    const rowHeights = (laidOut: ReturnType<typeof layoutDocument>): readonly number[] =>
        laidOut.pages[0].body.flatMap((block) =>
            block.type === "table" ? block.rows.map(({ height }) => Math.round(height * TWIPS * 10) / 10) : [],
        );
    /** A table of rows of one-line cells, the width of the page, without borders or margins unless given */
    const tableOf = (
        rows: number,
        options: Partial<ConstructorParameters<typeof Table>[0]> = {},
        cell: Partial<ConstructorParameters<typeof TableCell>[0]> = {},
    ): Table =>
        new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [WIDTH],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: Array.from(
                { length: rows },
                (_, index) => new TableRow({ children: [new TableCell({ ...cell, children: [new Paragraph(`row ${index + 1}`)] })] }),
            ),
            ...options,
        });
    const THREE_POINTS = { style: BorderStyle.SINGLE, size: 24, color: "000000" };

    it("should make rows taller by the borders of their cells, once between two rows (TB3)", () => {
        // TB3: 10 rows, 268.55 + 60 twips apart, and 60 more below the last, of which there are 3 here
        const heights = rowHeights(layOut([tableOf(3, {}, { borders: { top: THREE_POINTS, bottom: THREE_POINTS } })]));
        expect(heights).to.deep.equal([328.6, 328.6, 388.6]);
    });

    it("should put space between cells around each cell and inside the table's edges, and narrow their text (TB4)", () => {
        // TB4a: rows 100 twips apart with no borders, 468.55 twips apart, and 200 from the table's edges to its text. Each
        // row has 100 above and below its text, and the first and last the table's 100 more
        const heights = rowHeights(layOut([tableOf(3, { cellSpacing: { value: 100, type: WidthType.DXA } })]));
        expect(heights).to.deep.equal([568.6, 468.6, 568.6]);
    });

    describe("rows kept with the next", () => {
        /** `count` rows of one cell each, of the paragraphs `cell` gives, after `before` lines below the line above */
        const laidOut = (before: number, count: number, cell: (row: number) => readonly Paragraph[]): readonly number[] =>
            layOut([
                ...Array.from({ length: before }, (_, index) => new Paragraph(`fill ${index + 1}`)),
                new Table({
                    width: { size: WIDTH, type: WidthType.DXA },
                    columnWidths: [WIDTH],
                    borders: TableBorders.NONE,
                    margins: { top: 0, bottom: 0, left: 0, right: 0 },
                    rows: Array.from(
                        { length: count },
                        (_, index) => new TableRow({ children: [new TableCell({ children: [...cell(index + 1)] })] }),
                    ),
                }),
            ]).pages.map(({ body }) => body.flatMap((block) => (block.type === "table" ? block.rows : [])).length);
        const line = (text: string, keepNext = false): Paragraph => new Paragraph({ keepNext, children: [new TextRun(text)] });

        it("should keep a row whose first cell's first paragraph is kept with the next with the next row (TB5, KR1, KR2)", () => {
            // After 46 lines, rows 1 to 5 of 10 fit on the page (TB5d). TB5c: row 5 kept with the next moves to the next
            // page with row 6. TB5a: rows 1 to 9 kept move the table to the next page
            expect(laidOut(45, 10, (row) => [line(`row ${row}`)])[0]).to.equal(5);
            expect(laidOut(45, 10, (row) => [line(`row ${row}`, row === 5)])[0]).to.equal(4);
            expect(laidOut(45, 10, (row) => [line(`row ${row}`, row < 10)])[0]).to.equal(0);
            // KR1: rows of 2 lines whose first paragraph is kept move the table; KR2: whose second is, don't
            expect(laidOut(46, 10, (row) => [line(`row ${row}`, row < 10), line("second")])[0]).to.equal(0);
            expect(laidOut(46, 10, (row) => [line(`row ${row}`), line("second", row < 10)])[0]).to.equal(2);
        });

        it("should keep the last row kept with the next with the paragraph after the table (KR3, KR4)", () => {
            // 10 rows end the page, and the line below the table goes on the next
            expect(laidOut(40, 10, (row) => [line(`row ${row}`)])).to.deep.equal([10, 0]);
            expect(laidOut(40, 10, (row) => [line(`row ${row}`, row === 10)])).to.deep.equal([9, 1]);
            expect(laidOut(40, 10, (row) => [line(`row ${row}`, true)])).to.deep.equal([0, 10]);
        });

        it("should move rows kept with the next that don't fit on a page of their own to a new page, and break them there (KR5)", () => {
            expect(laidOut(20, 60, (row) => [line(`row ${row}`, row < 60)])).to.deep.equal([0, 51, 9]);
        });

        it("should keep a row kept with the next on the page with the first lines of a row that breaks across pages (KR7)", () => {
            // Rows 1 to 5 and 4 lines of row 6's 10 fit on the page
            const tall = (row: number): readonly Paragraph[] =>
                row === 6 ? Array.from({ length: 10 }, (_, index) => line(`line ${index + 1}`)) : [line(`row ${row}`, row === 5)];
            expect(laidOut(41, 10, tall)).to.deep.equal([6, 5]);
        });
    });

    it("should make a row with text running up a cell as tall as its other cells (TB6)", () => {
        // TB6a: a cell 2000 wide of ten words running up, beside a cell of a line: the row is a line tall
        const table = new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [2000, WIDTH - 2000],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 2000, type: WidthType.DXA },
                            textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                            children: [new Paragraph("TB6a vertical text of ten words in one cell 1")],
                        }),
                        new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, children: [new Paragraph("TB6a right")] }),
                    ],
                }),
            ],
        });
        expect(rowHeights(layOut([table]))).to.deep.equal([Math.round(LINE * 10) / 10]);
    });

    it("should size a table to its text in the room its indent leaves (TB9)", () => {
        // TB9: a cell of 150 words of prose, indented 2000 twips, took 10 lines, and 8 without
        const words = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = Array.from({ length: 150 }, (_, index) => words[(index * 7) % words.length]).join(" ");
        const table = (indent?: number): Table =>
            new Table({
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                ...(indent === undefined ? {} : { indent: { size: indent, type: WidthType.DXA } }),
                rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph(`TB9 ${prose}`)] })] })],
            });
        expect(rowHeights(layOut([table(2000)])).map((height) => Math.round(height / LINE))).to.deep.equal([10]);
        expect(rowHeights(layOut([table()])).map((height) => Math.round(height / LINE))).to.deep.equal([8]);
    });

    it("should make a row as tall as its tallest text and the largest margins above and below of its cells (MG1 to MG4)", () => {
        // word-table-formats2.docx MG1: 300 above a line, beside 2 lines without margins, is 300 more than the 2 lines
        const table = (left: Partial<ConstructorParameters<typeof TableCell>[0]>, children: readonly Paragraph[]): Table =>
            new Table({
                width: { size: WIDTH, type: WidthType.DXA },
                columnWidths: [2000, WIDTH - 2000],
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 2000, type: WidthType.DXA }, ...left, children: [...children] }),
                            new TableCell({
                                width: { size: WIDTH - 2000, type: WidthType.DXA },
                                children: [new Paragraph("one"), new Paragraph("two")],
                            }),
                        ],
                    }),
                ],
            });
        const margins = (top: number, bottom: number): Partial<ConstructorParameters<typeof TableCell>[0]> => ({
            margins: { top, bottom, left: 0, right: 0 },
        });
        expect(rowHeights(layOut([table(margins(300, 0), [new Paragraph("left")])]))).to.deep.equal([837.1]);
        expect(rowHeights(layOut([table(margins(200, 200), [new Paragraph("left")])]))).to.deep.equal([937.1]);
    });

    it("should make rows taller by the room of each style of border (BS)", () => {
        // word-table-formats.docx BS3: a double border of 1.5 points takes 90 twips
        const double = { style: BorderStyle.DOUBLE, size: 12, color: "000000" };
        const heights = rowHeights(
            layOut([tableOf(3, { borders: { ...TableBorders.NONE, top: double, insideHorizontal: double, bottom: double } })]),
        );
        expect(heights).to.deep.equal([358.6, 358.6, 448.6]);
    });

    it("should keep room for the bottom borders of the cells of the last row on a page where the table breaks (BB1, BB2)", () => {
        // word-table-formats.docx BB: one-line rows with 3-point borders above and below their cells, the 5th ending 30
        // twips above the bottom: its cells' bottom border doesn't fit below it, and it moves to the next page
        const rowsOnFirstPage = (slack: number): number => {
            const before = (16838 - 2880 - slack - 5 * (LINE + 60)) / LINE - 1;
            const lines = Math.floor(before);
            const fill = [
                ...Array.from({ length: lines - 1 }, (_, index) => new Paragraph(`fill ${index + 1}`)),
                new Paragraph({ spacing: { after: Math.round((before - lines) * LINE) }, children: [new TextRun("last fill")] }),
            ];
            return layOut([...fill, tableOf(8, {}, { borders: { top: THREE_POINTS, bottom: THREE_POINTS } })]).pages[0].body.flatMap(
                (block) => (block.type === "table" ? block.rows : []),
            ).length;
        };
        expect(rowsOnFirstPage(30)).to.equal(4);
        expect(rowsOnFirstPage(90)).to.equal(5);
    });

    it("should narrow the columns of a table with space between its cells to keep its width, as Word narrows them (CS9)", () => {
        // word-table-formats2.docx CS9: columns of 2000 and 7026 twips with 100 between cells: the first's 40 words took 12
        // lines, in 1896 to 1914 twips
        const words = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = (count: number): string => Array.from({ length: count }, (_, index) => words[(index * 7) % words.length]).join(" ");
        const table = new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [2000, WIDTH - 2000],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            cellSpacing: { value: 100, type: WidthType.DXA },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph(`CS9 ${prose(40)}`)] }),
                        new TableCell({
                            width: { size: WIDTH - 2000, type: WidthType.DXA },
                            children: [new Paragraph(`CS9 right ${prose(120)}`)],
                        }),
                    ],
                }),
            ],
        });
        // 12 lines, and 200 twips above and below them
        expect(rowHeights(layOut([table]))).to.deep.equal([Math.round((12 * LINE + 400) * 10) / 10]);
    });

    it("should make a row of only text running up a cell as tall as a line of its mark, whatever the text's size (VT1, VT5)", () => {
        const table = new Table({
            width: { size: 2000, type: WidthType.DXA },
            columnWidths: [2000],
            borders: TableBorders.NONE,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 2000, type: WidthType.DXA },
                            textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                            children: [
                                new Paragraph({
                                    spacing: { after: 400 },
                                    children: [new TextRun({ text: "VT5 vertical text in sixteen points", size: 32 })],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });
        expect(rowHeights(layOut([table]))).to.deep.equal([Math.round(LINE * 10) / 10]);
    });

    it("should apply the parts of a table style for its first row and its bands of rows, as Word applies them (CF11, CF14)", () => {
        // word-table-formats2.docx CF11: a first row of 18 points, then bands of rows of 14 and 15 points, with the table
        // turning on its first row and bands of rows, or not saying (CF14). Without the bands' size, there are none (CF1)
        const size = (type: string, points: number): string =>
            `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${points * 2}"/></w:rPr></w:tblStylePr>`;
        const style = (bands: string): string =>
            `<w:style w:type="table" w:styleId="Bands"><w:name w:val="Bands"/><w:tblPr>${bands}</w:tblPr>${size("wholeTable", 10)}${size("firstRow", 18)}${size("band1Horz", 14)}${size("band2Horz", 15)}${size("band1Vert", 12)}</w:style>`;
        const BAND_SIZES = '<w:tblStyleRowBandSize w:val="1"/><w:tblStyleColBandSize w:val="1"/>';
        const lineOf = (points: number): number => Math.round((2500 / 2048) * points * 20 * 10) / 10;
        const heights = (look: ConstructorParameters<typeof Table>[0]["tableLook"], bands: string): readonly number[] =>
            rowHeights(layOut([tableOf(4, { style: "Bands", ...(look === undefined ? {} : { tableLook: look }) })], style(bands)));
        const firstAndRows = { firstRow: true, lastRow: false, firstColumn: false, lastColumn: false, noHBand: false, noVBand: true };
        expect(heights(firstAndRows, BAND_SIZES)).to.deep.equal([18, 14, 15, 14].map(lineOf));
        expect(heights(undefined, BAND_SIZES)).to.deep.equal([18, 14, 15, 14].map(lineOf));
        expect(heights(firstAndRows, "")).to.deep.equal([18, 11, 11, 11].map(lineOf));
    });

    describe("a header of several rows", () => {
        // word-compat.ts's CompatHeaders: a first row of 16 points, and bands of rows of 14 and 10
        const size = (type: string, points: number): string =>
            `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${points * 2}"/></w:rPr></w:tblStylePr>`;
        const corners = `${size("nwCell", 20)}${size("neCell", 20)}`;
        const headersStyle = (more = ""): string =>
            `<w:style w:type="table" w:styleId="Headers"><w:name w:val="Headers"/><w:tblPr><w:tblStyleRowBandSize w:val="1"/></w:tblPr>${size("firstRow", 16)}${size("band1Horz", 14)}${size("band2Horz", 10)}${more}</w:style>`;
        const lineOf = (points: number): number => Math.round((2500 / 2048) * points * 20 * 10) / 10;
        /** 6 rows of one-line cells, the first `headers` of them header rows, in the style, with its first row on or off */
        const headed = (headers: number, firstRow: boolean, cells = 1): Table =>
            new Table({
                width: { size: WIDTH, type: WidthType.DXA },
                columnWidths: Array.from({ length: cells }, () => Math.floor(WIDTH / cells)),
                borders: TableBorders.NONE,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                style: "Headers",
                tableLook: { firstRow, lastRow: false, firstColumn: true, lastColumn: true, noHBand: false, noVBand: true },
                rows: Array.from(
                    { length: 6 },
                    (_, index) =>
                        new TableRow({
                            tableHeader: index < headers,
                            children: Array.from({ length: cells }, () => new TableCell({ children: [new Paragraph(`row ${index + 1}`)] })),
                        }),
                ),
            });

        it("should apply the first row's part to all of it, and bands of rows below it, as Word applies them (CS2)", () => {
            // word-compat-off.docx CS2a, CS2b, CS2c and CS2f, which word-compat-on.docx, with Word's own compatibility
            // settings, has the same
            const heights = (headers: number, firstRow: boolean): readonly number[] =>
                rowHeights(layOut([headed(headers, firstRow)], headersStyle()));
            expect(heights(2, true)).to.deep.equal([16, 16, 14, 10, 14, 10].map(lineOf));
            expect(heights(3, true)).to.deep.equal([16, 16, 16, 14, 10, 14].map(lineOf));
            expect(heights(1, true)).to.deep.equal([16, 14, 10, 14, 10, 14].map(lineOf));
            expect(heights(2, false)).to.deep.equal([10, 10, 14, 10, 14, 10].map(lineOf));
        });

        it("should apply a style's corner cells to each row of a header, and band one of three rows from its first with its first row off", () => {
            // word-stops-tables.docx TS2: the corner cells' 20 points in both rows of a header of two
            expect(rowHeights(layOut([headed(2, true, 2)], headersStyle(corners)))).to.deep.equal([20, 20, 14, 10, 14, 10].map(lineOf));
            expect(rowHeights(layOut([headed(1, true, 2)], headersStyle(corners)))).to.deep.equal([20, 14, 10, 14, 10, 14].map(lineOf));
            // TS3: a header of three rows with its first row off is banded from its first row, as though it weren't a header
            expect(rowHeights(layOut([headed(3, false)], headersStyle()))).to.deep.equal([14, 10, 14, 10, 14, 10].map(lineOf));
        });

        it("should stop at the bands of rows of a header of four rows or more with its first row off", () => {
            const stoppedAt = (table: Table): string | undefined => layOut([table], headersStyle()).stoppedAt;
            expect(stoppedAt(headed(4, false))).to.equal("a table style's bands of rows in a header of four rows or more");
            expect(stoppedAt(headed(4, true))).to.equal(undefined);
        });
    });

    it("should apply a table style's first row's size where the table turns it on, and Normal has no size of its own (SP19)", () => {
        // word-watertight-stops.docx SP19a: a 16-point first row, 403.2 twips from the second's text to the first's
        const firstRow = `<w:style w:type="table" w:styleId="FirstRow"><w:name w:val="First Row"/><w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:tblStylePr></w:style>`;
        const heights = (on: boolean): readonly number[] =>
            rowHeights(layOut([tableOf(2, { style: "FirstRow", tableLook: { firstRow: on } })], firstRow));
        expect(heights(true)).to.deep.equal([390.6, 268.6]);
        expect(heights(false)).to.deep.equal([268.6, 268.6]);
    });
});
