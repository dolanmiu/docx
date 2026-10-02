/**
 * Probes of how Word lays out the table formatting that `word-watertight-tables.ts` left open. Each line's text names
 * its probe, so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-table-formats.py
 * reads. Calibri 11 on A4 with 1440 margins. The document's defaults have no space before or after and single lines,
 * and Normal has no size of its own, so a table style's sizes apply (`word-watertight-stops.docx` SP19).
 *
 * BS: the room each style of border takes, as a table's top, inside and bottom borders, at 1.5 points, and some at 0.5
 *     and 3 points, and one with space (`w:space`)
 * BC: borders that disagree: a cell's top border beside a cell without, a cell's top and the cell above's bottom, a
 *     cell's border against the table's, `nil` and `none`, a table that gives only some of its borders beside its style's,
 *     and left and right borders of cells and tables beside text
 * CS: space between cells (`w:tblCellSpacing`) with borders, with a row's own, in tables sized to their text, and the
 *     width of the text in tables of one and three columns
 * BB: a table whose cells have borders, and the table none, that breaks across pages: whether the cells' bottom border
 *     takes room below the last row on the page, as the table's does (word-line-heights.docx T1 and T4)
 * KR: rows kept with the next: a cell whose first paragraph only is kept, or whose last only is, the last row kept, rows
 *     kept that are taller than a page, a paragraph kept with the next before kept rows, and a kept row before a row that
 *     breaks across pages
 * VT: text that runs up a cell: a row with no other cell, a cell with margins above and below, in a table sized to its
 *     text, and in a cell merged down three rows
 * HM: `w:hideMark` in a cell with margins, with space after its mark, with text before an empty paragraph, and in every
 *     cell of a row
 * CF: a table style's conditional formatting (`w:tblStylePr`): which of its parts applies to each cell, with `w:tblLook`
 *     on, off, Word's default, not given, and given only as `w:val`, with bands of two, and its paragraph spacing, cell
 *     borders and cell margins
 * TI: a table sized to its text with a negative indent, a table of 100% with an indent, a column widened for a long word
 *     in an indented table, and an indent from the table's style
 *
 * docx can't write some of these, so it writes a marker that this script replaces in the XML: see `INJECTIONS`.
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import JSZip from "jszip";

import {
    BorderStyle,
    Document,
    type IBorderOptions,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextDirection,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type TableOptions = Partial<ConstructorParameters<typeof Table>[0]>;
type CellOptions = Partial<ConstructorParameters<typeof TableCell>[0]>;

// Calibri 11's lines in Word, in twips
const LINE = (2500 / 2048) * 220;
const TOP = 1440;
const BOTTOM = 16838 - 1440;
const WIDTH = 9026;

const SINGLE = { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } as const;
const line = (text: string, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { ...SINGLE, ...options.spacing }, children: [new TextRun(text)] });

/** The first lines of a probe, which put what follows them `at` twips down the page, as word-line-heights.ts has them */
const lead = (probe: string, at: number): Paragraph[] => {
    const count = Math.floor((at - TOP) / LINE);
    const after = Math.round(at - TOP - count * LINE);
    return Array.from({ length: count }, (_, i) =>
        line(i === 0 ? `${probe} top` : `${probe} fill ${i}`, i === count - 1 ? { spacing: { after } } : {}),
    );
};

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

const NO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };
const border = (style: IBorderOptions["style"], size: number, space?: number): IBorderOptions => ({
    style,
    size,
    color: "000000",
    ...(space === undefined ? {} : { space }),
});
const NONE = border(BorderStyle.NONE, 0);

/** A table of rows of cells of these paragraphs, the width of the page, without borders or cell margins unless given */
const table = (
    rows: readonly (readonly Paragraph[][])[],
    options: TableOptions = {},
    cell: (row: number, column: number) => CellOptions = () => ({}),
): Table => {
    const width = Math.floor(WIDTH / rows[0].length);
    return new Table({
        width: { size: width * rows[0].length, type: WidthType.DXA },
        columnWidths: rows[0].map(() => width),
        borders: TableBorders.NONE,
        margins: NO_MARGINS,
        rows: rows.map(
            (cells, row) =>
                new TableRow({
                    children: cells.map(
                        (children, column) =>
                            new TableCell({ width: { size: width, type: WidthType.DXA }, ...cell(row, column), children }),
                    ),
                }),
        ),
        ...options,
    });
};

/** `count` rows of one line each, `probe row n` */
const oneLineRows = (probe: string, count: number): Paragraph[][][] =>
    Array.from({ length: count }, (_, i) => [[line(`${probe} row ${i + 1}`)]]);

/** A table probe marked off by a line above it and one below it */
const around = (probe: string, ...children: (Table | Paragraph)[]): (Table | Paragraph)[] => [
    line(`${probe} above`),
    ...children,
    line(`${probe} below`),
];

/** Probes on a page of their own, a few to a page */
const pages = (probes: readonly (Table | Paragraph)[][], perPage: number): ISectionOptions[] =>
    Array.from({ length: Math.ceil(probes.length / perPage) }, (_, page) => ({
        children: probes.slice(page * perPage, (page + 1) * perPage).flat(),
    }));

// BS: each style of border as a table's top, inside and bottom borders, 5 one-line rows
const STYLES = [
    "single",
    "thick",
    "double",
    "dotted",
    "dashed",
    "dotDash",
    "dotDotDash",
    "triple",
    "thinThickSmallGap",
    "thickThinSmallGap",
    "thinThickThinSmallGap",
    "thinThickMediumGap",
    "thickThinMediumGap",
    "thinThickThinMediumGap",
    "thinThickLargeGap",
    "thickThinLargeGap",
    "thinThickThinLargeGap",
    "wave",
    "doubleWave",
    "dashSmallGap",
    "dashDotStroked",
    "threeDEmboss",
    "threeDEngrave",
    "outset",
    "inset",
] as const;
/** [probe, style, size in eighths of a point, space in points] */
const BORDER_PROBES: readonly (readonly [string, IBorderOptions["style"], number, number?])[] = [
    ...STYLES.map((style, i) => [`BS${i + 1}`, style, 12] as const),
    ["BS26", "double", 4],
    ["BS27", "double", 24],
    ["BS28", "thinThickSmallGap", 4],
    ["BS29", "thinThickSmallGap", 24],
    ["BS30", "triple", 4],
    ["BS31", "single", 12, 10],
];
const borderProbe = ([probe, style, size, space]: (typeof BORDER_PROBES)[number]): (Table | Paragraph)[] => {
    const shown = border(style, size, space);
    return around(
        probe,
        table(oneLineRows(probe, 5), {
            borders: { top: shown, bottom: shown, insideHorizontal: shown, left: NONE, right: NONE, insideVertical: NONE },
        }),
    );
};

const THREE_POINTS = border(BorderStyle.SINGLE, 24);
const TABLE_THREE_POINTS = {
    top: THREE_POINTS,
    bottom: THREE_POINTS,
    insideHorizontal: THREE_POINTS,
    left: NONE,
    right: NONE,
    insideVertical: NONE,
};

/** `count` rows of two one-line cells, `probe row n` and `probe right n` */
const twoCellRows = (probe: string, count: number): Paragraph[][][] =>
    Array.from({ length: count }, (_, i) => [[line(`${probe} row ${i + 1}`)], [line(`${probe} right ${i + 1}`)]]);

const conflictProbes: (Table | Paragraph)[][] = [
    // BC1: rows 2 to 5 have a 3-point top border on their left cell only, in a table without borders
    around(
        "BC1",
        table(twoCellRows("BC1", 5), {}, (row, column) => (row > 0 && column === 0 ? { borders: { top: THREE_POINTS } } : {})),
    ),
    // BC2: each cell has a 1.5-point top border and a 3-point bottom border
    around(
        "BC2",
        table(oneLineRows("BC2", 5), {}, () => ({ borders: { top: border(BorderStyle.SINGLE, 12), bottom: THREE_POINTS } })),
    ),
    // BC3: a table with 3-point borders, whose rows 2 to 5 have a half-point top border of their cells' own
    around(
        "BC3",
        table(oneLineRows("BC3", 5), { borders: TABLE_THREE_POINTS }, (row) =>
            row > 0 ? { borders: { top: border(BorderStyle.SINGLE, 4) } } : {},
        ),
    ),
    // BC4: the same, with the cells' top border nil; BC5: none
    around(
        "BC4",
        table(oneLineRows("BC4", 5), { borders: TABLE_THREE_POINTS }, (row) =>
            row > 0 ? { borders: { top: border(BorderStyle.NIL, 0) } } : {},
        ),
    ),
    around(
        "BC5",
        table(oneLineRows("BC5", 5), { borders: TABLE_THREE_POINTS }, (row) => (row > 0 ? { borders: { top: NONE } } : {})),
    ),
    // BC6: a table that gives only its top border, 3 points, whose style has 1-point borders on every side
    around("BC6", table(oneLineRows("BC6", 5), { style: "ProbeBordered", borders: TABLE_THREE_POINTS })),
    // BC7: a cell with 6-point left and right borders and no margins, of prose; BC8: the table's left and right borders,
    // 6 points; BC9: a cell with 6-point left and right borders and Word's margins of 108
    around(
        "BC7",
        table([[[line(`BC7 ${prose(150)}`)]]], {}, () => ({
            borders: { left: border(BorderStyle.SINGLE, 48), right: border(BorderStyle.SINGLE, 48) },
        })),
    ),
    around(
        "BC8",
        table([[[line(`BC8 ${prose(150)}`)]]], {
            borders: { ...TableBorders.NONE, left: border(BorderStyle.SINGLE, 48), right: border(BorderStyle.SINGLE, 48) },
        }),
    ),
    around(
        "BC9",
        table([[[line(`BC9 ${prose(150)}`)]]], { margins: { top: 0, bottom: 0, left: 108, right: 108 } }, () => ({
            borders: { left: border(BorderStyle.SINGLE, 48), right: border(BorderStyle.SINGLE, 48) },
        })),
    ),
];

const ALL_BORDERS = (size: number) => {
    const shown = border(BorderStyle.SINGLE, size);
    return { top: shown, bottom: shown, left: shown, right: shown, insideHorizontal: shown, insideVertical: shown };
};
const SPACING = { value: 100, type: WidthType.DXA };
/** A table sized to its text: no widths of its own or its cells' */
const fitted = (
    rows: readonly (readonly Paragraph[][])[],
    options: TableOptions = {},
    cell: (row: number, column: number) => CellOptions = () => ({}),
): Table =>
    new Table({
        borders: TableBorders.NONE,
        margins: NO_MARGINS,
        rows: rows.map(
            (cells, row) => new TableRow({ children: cells.map((children, column) => new TableCell({ ...cell(row, column), children })) }),
        ),
        ...options,
    });

const spacingProbes: (Table | Paragraph)[][] = [
    // CS1: 100 twips between cells, with docx's half-point borders on every side; CS2: with 3-point borders
    around("CS1", table(oneLineRows("CS1", 5), { cellSpacing: SPACING, borders: ALL_BORDERS(4) })),
    around("CS2", table(oneLineRows("CS2", 5), { cellSpacing: SPACING, borders: ALL_BORDERS(24) })),
    // CS3: 100 between cells, with cells' own 3-point top and bottom borders
    around(
        "CS3",
        table(oneLineRows("CS3", 5), { cellSpacing: SPACING }, () => ({ borders: { top: THREE_POINTS, bottom: THREE_POINTS } })),
    ),
    // CS4: 100 between cells, and 300 in row 3, its own
    around(
        "CS4",
        new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [WIDTH],
            borders: TableBorders.NONE,
            margins: NO_MARGINS,
            cellSpacing: SPACING,
            rows: Array.from(
                { length: 5 },
                (_, i) =>
                    new TableRow({
                        ...(i === 2 ? { cellSpacing: { value: 300, type: WidthType.DXA } } : {}),
                        children: [new TableCell({ width: { size: WIDTH, type: WidthType.DXA }, children: [line(`CS4 row ${i + 1}`)] })],
                    }),
            ),
        }),
    ),
    // CS5: a table sized to its text with 200 between cells, of two cells of prose; CS6: of two cells of a few words
    around(
        "CS5",
        fitted([[[line(`CS5 ${prose(60)}`)], [line(`CS5 right ${prose(60)}`)]]], { cellSpacing: { value: 200, type: WidthType.DXA } }),
    ),
    around(
        "CS6",
        fitted([[[line("CS6 short")], [line("CS6 right a little longer")]]], { cellSpacing: { value: 200, type: WidthType.DXA } }),
    ),
    // CS7: a table of one column with 100 between cells, of prose; CS8: of three columns
    around("CS7", table([[[line(`CS7 ${prose(150)}`)]]], { cellSpacing: SPACING })),
    around(
        "CS8",
        table([[[line(`CS8 ${prose(50)}`)], [line(`CS8 middle ${prose(50)}`)], [line(`CS8 right ${prose(50)}`)]]], {
            cellSpacing: SPACING,
        }),
    ),
];

/** KR: 10 rows (or `count`) of one cell, of what `cell` gives, after lines that put the table `at` down the page */
const keptRows = (
    probe: string,
    at: number,
    cell: (row: number) => Paragraph[],
    count = 10,
    before: Paragraph[] = [],
): ISectionOptions => ({
    children: [
        ...lead(probe, at),
        ...before,
        table(Array.from({ length: count }, (_, i) => [cell(i + 1)])),
        line(`${probe} after`),
        line(`${probe} after 2`),
    ],
});

/** BB: one-line rows whose cells have 3-point top and bottom borders, in a table without, the 5th of which ends `slack` above the bottom */
const cellBorderBreak = (probe: string, slack: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - slack - 5 * (LINE + 60)),
        table(oneLineRows(probe, 8), {}, () => ({ borders: { top: THREE_POINTS, bottom: THREE_POINTS } })),
        line(`${probe} after`),
    ],
});

const keptProbes: ISectionOptions[] = [
    // KR1: cells of 2 paragraphs, the first kept with the next, in rows 1 to 9; rows 1 and 2 fit on the page
    keptRows("KR1", BOTTOM - 4.5 * LINE, (row) => [line(`KR1 row ${row}`, { keepNext: row < 10 }), line(`KR1 row ${row} second`)]),
    // KR2: the same with the second paragraph kept, and not the first
    keptRows("KR2", BOTTOM - 4.5 * LINE, (row) => [line(`KR2 row ${row}`), line(`KR2 row ${row} second`, { keepNext: row < 10 })]),
    // KR3: the last row kept with the next, and the table ends at the bottom of the page; KR4: every row kept
    keptRows("KR3", BOTTOM - 10.5 * LINE, (row) => [line(`KR3 row ${row}`, { keepNext: row === 10 })]),
    keptRows("KR4", BOTTOM - 10.5 * LINE, (row) => [line(`KR4 row ${row}`, { keepNext: true })]),
    // KR5: 60 rows, 1 to 59 kept, after 20 lines
    keptRows("KR5", TOP + 20 * LINE, (row) => [line(`KR5 row ${row}`, { keepNext: row < 60 })], 60),
    // KR6: a paragraph kept with the next before a table whose rows 1 to 3 are kept; it and rows 1 and 2 fit
    keptRows("KR6", BOTTOM - 3.5 * LINE, (row) => [line(`KR6 row ${row}`, { keepNext: row < 4 })], 10, [
        line("KR6 kept", { keepNext: true }),
    ]),
    // KR7: row 5 kept, before a row of 10 one-line paragraphs; rows 1 to 5 and 4 of row 6's lines fit
    keptRows("KR7", BOTTOM - 9.5 * LINE, (row) =>
        row === 6
            ? Array.from({ length: 10 }, (_, i) => line(`KR7 row 6 line ${i + 1}`))
            : [line(`KR7 row ${row}`, { keepNext: row === 5 })],
    ),
];

const VERTICAL = "vertical text of ten words in one cell";
/** A table of a cell of text running up (btLr), 2000 wide, beside a cell of a line unless `alone` */
const verticalTable = (probe: string, cell: CellOptions, alone = false): Table =>
    new Table({
        width: { size: alone ? 2000 : WIDTH, type: WidthType.DXA },
        columnWidths: alone ? [2000] : [2000, WIDTH - 2000],
        borders: TableBorders.NONE,
        margins: NO_MARGINS,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 2000, type: WidthType.DXA },
                        textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                        ...cell,
                        children: [line(`${probe} ${VERTICAL}`)],
                    }),
                    ...(alone
                        ? []
                        : [new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, children: [line(`${probe} right`)] })]),
                ],
            }),
        ],
    });

const verticalProbes: (Table | Paragraph)[][] = [
    // VT1: a row of only a cell of text running up
    around("VT1", verticalTable("VT1", {}, true)),
    // VT2: a cell of text running up with 200 above and below it, beside a line
    around("VT2", verticalTable("VT2", { margins: { top: 200, bottom: 200, left: 0, right: 0 } })),
    // VT3: a table sized to its text, of a cell of text running up and a cell of prose
    around(
        "VT3",
        fitted([[[line(`VT3 ${VERTICAL}`)], [line(`VT3 right ${prose(60)}`)]]], {}, (_, column) =>
            column === 0 ? { textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT } : {},
        ),
    ),
    // VT4: a cell of text running up merged down 3 rows, beside rows of a line
    around(
        "VT4",
        new Table({
            width: { size: WIDTH, type: WidthType.DXA },
            columnWidths: [2000, WIDTH - 2000],
            borders: TableBorders.NONE,
            margins: NO_MARGINS,
            rows: Array.from(
                { length: 3 },
                (_, i) =>
                    new TableRow({
                        children: [
                            ...(i === 0
                                ? [
                                      new TableCell({
                                          width: { size: 2000, type: WidthType.DXA },
                                          rowSpan: 3,
                                          textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                          children: [line(`VT4 ${VERTICAL} ${prose(20)}`)],
                                      }),
                                  ]
                                : []),
                            new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, children: [line(`VT4 row ${i + 1}`)] }),
                        ],
                    }),
            ),
        }),
    ),
];

// HM: an empty cell with hideMark, written as a cell shaded with a fill of HIDE_MARK, beside a cell of a line
const HIDE_MARK = "123456";
const empty = (options: Options = {}): Paragraph =>
    new Paragraph({ ...options, spacing: { ...SINGLE, ...options.spacing }, run: { size: 56 } });
const hideMarkTable = (probe: string, left: Paragraph[], right: Paragraph[], cell: CellOptions = {}, rightCell: CellOptions = {}): Table =>
    new Table({
        width: { size: WIDTH, type: WidthType.DXA },
        columnWidths: [2000, WIDTH - 2000],
        borders: TableBorders.NONE,
        margins: NO_MARGINS,
        rows: [
            new TableRow({
                children: [
                    new TableCell({ width: { size: 2000, type: WidthType.DXA }, shading: { fill: HIDE_MARK }, ...cell, children: left }),
                    new TableCell({ width: { size: WIDTH - 2000, type: WidthType.DXA }, ...rightCell, children: right }),
                ],
            }),
        ],
    });

const hideMarkProbes: (Table | Paragraph)[][] = [
    // HM1: with 100 above and below the cell's text
    around("HM1", hideMarkTable("HM1", [empty()], [line("HM1 right")], { margins: { top: 100, bottom: 100, left: 0, right: 0 } })),
    // HM2: with 400 after the empty paragraph
    around("HM2", hideMarkTable("HM2", [empty({ spacing: { after: 400 } })], [line("HM2 right")])),
    // HM3: a line of text, then an empty 28-point paragraph
    around("HM3", hideMarkTable("HM3", [line("HM3 text"), empty()], [line("HM3 right")])),
    // HM4: both cells empty, with 28-point marks, and both with hideMark
    around("HM4", hideMarkTable("HM4", [empty()], [empty()], {}, { shading: { fill: HIDE_MARK } })),
];

/** CF: a table of 5 rows of 5 cells, `probe rNcM`, in a table style with conditional formatting */
const grid = (probe: string, rows = 5, columns = 5): Paragraph[][][] =>
    Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => [new Paragraph({ children: [new TextRun(`${probe} r${r + 1}c${c + 1}`)] })]),
    );

const conditionalProbes: (Table | Paragraph)[][] = [
    // CF1: tblLook with every part on; CF2: not given; CF3: Word's default, the first row and column and the rows' bands;
    // CF4: every part off; CF5: Word's default given only as w:val (04A0), as Word 2007 writes it; CF6: every part on,
    // in bands of 2 rows and 2 columns
    around(
        "CF1",
        table(grid("CF1"), {
            style: "ProbeBands",
            tableLook: { firstRow: true, lastRow: true, firstColumn: true, lastColumn: true, noHBand: false, noVBand: false },
        }),
    ),
    around("CF2", table(grid("CF2"), { style: "ProbeBands" })),
    around(
        "CF3",
        table(grid("CF3"), {
            style: "ProbeBands",
            tableLook: { firstRow: true, lastRow: false, firstColumn: true, lastColumn: false, noHBand: false, noVBand: true },
        }),
    ),
    around(
        "CF4",
        table(grid("CF4"), {
            style: "ProbeBands",
            tableLook: { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, noHBand: true, noVBand: true },
        }),
    ),
    around("CF5", table(grid("CF5"), { style: "ProbeBandsVal" })),
    around(
        "CF6",
        table(grid("CF6", 6), {
            style: "ProbeBandsTwo",
            tableLook: { firstRow: true, lastRow: true, firstColumn: true, lastColumn: true, noHBand: false, noVBand: false },
        }),
    ),
    // CF7: a first row with 400 after its paragraphs; CF8: with a 3-point bottom border; CF9: with 200 above and below
    around("CF7", table(grid("CF7", 5, 1), { style: "ProbeFirstSpacing", tableLook: { firstRow: true } })),
    around("CF8", table(oneLineRows("CF8", 5), { style: "ProbeFirstBorder", tableLook: { firstRow: true } })),
    around("CF9", table(oneLineRows("CF9", 5), { style: "ProbeFirstMargins", tableLook: { firstRow: true } })),
];

const indentProbes: (Table | Paragraph)[][] = [
    // TI1: a table sized to its text, of prose, indented -500
    around("TI1", fitted([[[line(`TI1 ${prose(150)}`)]]], { indent: { size: -500, type: WidthType.DXA } })),
    // TI2: a table of 100% of the width, indented 2000
    around(
        "TI2",
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            indent: { size: 2000, type: WidthType.DXA },
            borders: TableBorders.NONE,
            margins: NO_MARGINS,
            rows: [new TableRow({ children: [new TableCell({ children: [line(`TI2 ${prose(150)}`)] })] })],
        }),
    ),
    // TI3: cells of 2000 and 2500, the first with a word 2894 wide, indented 4000: whether the table grows to 5394 in the
    // 5026 the indent leaves, narrowing the second column, or in the page's 9026
    around(
        "TI3",
        new Table({
            columnWidths: [2000, 2500],
            indent: { size: 4000, type: WidthType.DXA },
            borders: TableBorders.NONE,
            margins: NO_MARGINS,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 2000, type: WidthType.DXA },
                            children: [line("TI3 Supercalifragilisticexpialidocious")],
                        }),
                        new TableCell({ width: { size: 2500, type: WidthType.DXA }, children: [line(`TI3 right ${prose(40)}`)] }),
                    ],
                }),
            ],
        }),
    ),
    // TI4: a table sized to its text, of prose, whose style is indented 2000
    around("TI4", fitted([[[line(`TI4 ${prose(150)}`)]]], { style: "ProbeIndented" })),
];

const CELL_MARGINS =
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>';
const size = (type: string, halfPoints: number): string =>
    `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${halfPoints}"/></w:rPr></w:tblStylePr>`;
// Each part of the table style in a size of its own, in points: the part a cell's text is in shows which applied
const BAND_SIZES = [
    ["wholeTable", 10],
    ["band1Vert", 12],
    ["band2Vert", 13],
    ["band1Horz", 14],
    ["band2Horz", 15],
    ["firstCol", 16],
    ["lastCol", 17],
    ["firstRow", 18],
    ["lastRow", 19],
    ["neCell", 20],
    ["nwCell", 21],
    ["seCell", 22],
    ["swCell", 23],
] as const;
const tableStyle = (id: string, tblPr: string, parts: string): string =>
    `<w:style w:type="table" w:styleId="${id}"><w:name w:val="${id}"/><w:basedOn w:val="TableNormal"/><w:tblPr>${tblPr}${CELL_MARGINS}</w:tblPr>${parts}</w:style>`;
const BANDS = BAND_SIZES.map(([type, points]) => size(type, points * 2)).join("");
const SIDES = ["top", "left", "bottom", "right", "insideH", "insideV"]
    .map((side) => `<w:${side} w:val="single" w:sz="8" w:space="0" w:color="000000"/>`)
    .join("");

/** Table styles docx can't write, added to styles.xml */
const TABLE_STYLES = [
    tableStyle("ProbeBands", "", BANDS),
    tableStyle("ProbeBandsVal", "", BANDS),
    tableStyle("ProbeBandsTwo", '<w:tblStyleRowBandSize w:val="2"/><w:tblStyleColBandSize w:val="2"/>', BANDS),
    tableStyle("ProbeFirstSpacing", "", '<w:tblStylePr w:type="firstRow"><w:pPr><w:spacing w:after="400"/></w:pPr></w:tblStylePr>'),
    tableStyle(
        "ProbeFirstBorder",
        "",
        '<w:tblStylePr w:type="firstRow"><w:tcPr><w:tcBorders><w:bottom w:val="single" w:sz="24" w:space="0" w:color="000000"/></w:tcBorders></w:tcPr></w:tblStylePr>',
    ),
    tableStyle(
        "ProbeFirstMargins",
        "",
        '<w:tblStylePr w:type="firstRow"><w:tcPr><w:tcMar><w:top w:w="200" w:type="dxa"/><w:bottom w:w="200" w:type="dxa"/></w:tcMar></w:tcPr></w:tblStylePr>',
    ),
    tableStyle("ProbeBordered", `<w:tblBorders>${SIDES}</w:tblBorders>`, ""),
    tableStyle("ProbeIndented", '<w:tblInd w:w="2000" w:type="dxa"/>', ""),
].join("");

/** [what docx writes, what replaces it], in document.xml */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    // HM: hideMark, written as a cell shaded 123456, at the end of the cell's properties as its schema has it
    [new RegExp(`<w:shd [^>]*w:fill="${HIDE_MARK}"[^>]*/>((?:(?!</w:tcPr>).)*)</w:tcPr>`, "g"), "$1<w:hideMark/></w:tcPr>"],
    // BC6: only a top border of the table's own, beside its style's on every side
    [
        /(<w:tblStyle w:val="ProbeBordered"\/>(?:(?!<w:tblBorders>).)*)<w:tblBorders>.*?<\/w:tblBorders>/g,
        '$1<w:tblBorders><w:top w:val="single" w:sz="24" w:space="0" w:color="000000"/></w:tblBorders>',
    ],
    // CF5: tblLook given only as w:val, Word's default
    [/(<w:tblStyle w:val="ProbeBandsVal"\/>(?:(?!<\/w:tblPr>).)*)<\/w:tblPr>/g, '$1<w:tblLook w:val="04A0"/></w:tblPr>'],
];

const sections: ISectionOptions[] = [
    ...pages(BORDER_PROBES.map(borderProbe), 4),
    ...pages(conflictProbes, 3),
    ...pages(spacingProbes, 3),
    // BB1: 30 twips to spare below the 5th row, less than its cells' bottom border; BB2: 90, more
    cellBorderBreak("BB1", 30),
    cellBorderBreak("BB2", 90),
    ...keptProbes,
    ...pages(verticalProbes, 4),
    ...pages(hideMarkProbes, 4),
    ...pages(conditionalProbes, 3),
    ...pages(indentProbes, 2),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

const main = async (): Promise<void> => {
    const zip = await JSZip.loadAsync(await Packer.toBuffer(doc));
    const xml = INJECTIONS.reduce(
        (text, [marker, replacement]) => text.replace(marker, replacement),
        await zip.file("word/document.xml")!.async("string"),
    );
    zip.file("word/document.xml", xml);
    const styles = await zip.file("word/styles.xml")!.async("string");
    zip.file("word/styles.xml", styles.replace("</w:styles>", `${TABLE_STYLES}</w:styles>`));
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-table-formats.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
