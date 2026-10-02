/**
 * Probes of the table formatting `word-table-formats.docx` left open, in the same setting: Calibri 11 on A4 with 1440
 * margins, with no space before or after and single lines, and Normal no size of its own. Each line's text names its
 * probe, and word-table-formats.py reads Word's PDF of it.
 *
 * MG: cells of a row with different margins above and below (HM1 of word-table-formats.docx made a row as tall as the
 *     largest margin above, the tallest text and the largest margin below, from different cells)
 * BS: the room borders of the styles shown only at 1.5 points take at 0.5 and 3 points
 * BC: left and right borders of cells beside text: a margin between half the border and the border, and borders between
 *     cells
 * VT: text running up a cell in a row of no other cell, in 16 points, of two sizes, and with space after
 * CF: a table style's first or last row and column at a corner without a part of its own, bands of rows, bands of rows
 *     and columns together, and bands where the table doesn't say which parts it turns on
 * KR: a row kept with the next by its second cell only
 * CS: space between cells of different widths, in a table with no width of its own, beside left and right borders, with
 *     a table's top and bottom borders unlike the borders between its rows, in a table laid out fixed, and across pages
 *
 * docx can't write the table styles, so this script adds them to styles.xml: see `TABLE_STYLES`.
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
    TableLayoutType,
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
const border = (style: IBorderOptions["style"], size: number): IBorderOptions => ({ style, size, color: "000000" });
const NONE = border(BorderStyle.NONE, 0);
const SPACING = { value: 100, type: WidthType.DXA };

/** A table of rows of cells of these paragraphs, of these widths, without borders or cell margins unless given */
const table = (
    rows: readonly (readonly Paragraph[][])[],
    options: TableOptions = {},
    cell: (row: number, column: number) => CellOptions = () => ({}),
    widths: readonly number[] = rows[0].map(() => Math.floor(WIDTH / rows[0].length)),
): Table =>
    new Table({
        width: { size: widths.reduce((total, width) => total + width, 0), type: WidthType.DXA },
        columnWidths: widths,
        borders: TableBorders.NONE,
        margins: NO_MARGINS,
        rows: rows.map(
            (cells, row) =>
                new TableRow({
                    children: cells.map(
                        (children, column) =>
                            new TableCell({ width: { size: widths[column], type: WidthType.DXA }, ...cell(row, column), children }),
                    ),
                }),
        ),
        ...options,
    });

const oneLineRows = (probe: string, count: number): Paragraph[][][] =>
    Array.from({ length: count }, (_, i) => [[line(`${probe} row ${i + 1}`)]]);
const around = (probe: string, ...children: (Table | Paragraph)[]): (Table | Paragraph)[] => [
    line(`${probe} above`),
    ...children,
    line(`${probe} below`),
];
const pages = (probes: readonly (Table | Paragraph)[][], perPage: number): ISectionOptions[] =>
    Array.from({ length: Math.ceil(probes.length / perPage) }, (_, page) => ({
        children: probes.slice(page * perPage, (page + 1) * perPage).flat(),
    }));

/** A row of two cells: the left of a line with these margins, the right of `lines` one-line paragraphs */
const margined = (probe: string, margins: CellOptions["margins"], lines: number, left: CellOptions = {}): Table =>
    table(
        [[[line(`${probe} left`)], Array.from({ length: lines }, (_, i) => line(`${probe} right ${i + 1}`))]],
        {},
        (_, column) => (column === 0 ? { margins: { left: 0, right: 0, top: 0, bottom: 0, ...margins }, ...left } : {}),
        [2000, WIDTH - 2000],
    );

const marginProbes: (Table | Paragraph)[][] = [
    // MG1: 300 above the left cell's line, beside 2 lines; MG2: 300 below; MG3: 200 above and below
    around("MG1", margined("MG1", { top: 300 }, 2)),
    around("MG2", margined("MG2", { bottom: 300 }, 2)),
    around("MG3", margined("MG3", { top: 200, bottom: 200 }, 2)),
    // MG4: an empty cell with hideMark and 100 above and below, beside 2 lines
    around(
        "MG4",
        table(
            [[[new Paragraph({ spacing: SINGLE, run: { size: 56 } })], [line("MG4 right 1"), line("MG4 right 2")]]],
            {},
            (_, column) => (column === 0 ? { margins: { top: 100, bottom: 100, left: 0, right: 0 }, shading: { fill: "123456" } } : {}),
            [2000, WIDTH - 2000],
        ),
    ),
];

const STYLES = [
    "thick",
    "dotted",
    "dashed",
    "dotDash",
    "dotDotDash",
    "dashSmallGap",
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
    "dashDotStroked",
    "threeDEmboss",
    "threeDEngrave",
    "outset",
    "inset",
] as const;
// BS: each at half a point, then at 3 points
const BORDER_PROBES = [4, 24].flatMap((size, half) =>
    STYLES.map((style, i) => [`BS${half * STYLES.length + i + 1}`, style, size] as const),
);
const borderProbe = ([probe, style, size]: (typeof BORDER_PROBES)[number]): (Table | Paragraph)[] => {
    const shown = border(style, size);
    return around(
        probe,
        table(oneLineRows(probe, 5), {
            borders: { top: shown, bottom: shown, insideHorizontal: shown, left: NONE, right: NONE, insideVertical: NONE },
        }),
    );
};

const SIX_POINTS = border(BorderStyle.SINGLE, 48);
const sideProbes: (Table | Paragraph)[][] = [
    // BC10: a cell with 6-point left and right borders and margins of 30, of prose
    around(
        "BC10",
        table([[[line(`BC10 ${prose(150)}`)]]], { margins: { top: 0, bottom: 0, left: 30, right: 30 } }, () => ({
            borders: { left: SIX_POINTS, right: SIX_POINTS },
        })),
    ),
    // BC11: a 6-point border between two cells of prose, without margins
    around(
        "BC11",
        table([[[line(`BC11 ${prose(60)}`)], [line(`BC11 right ${prose(60)}`)]]], {
            borders: { ...TableBorders.NONE, insideVertical: SIX_POINTS },
        }),
    ),
];

const VERTICAL = { textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT };
const verticalProbes: (Table | Paragraph)[][] = [
    // VT5: a row of only a cell of text running up, in 16 points
    around(
        "VT5",
        table(
            [[[new Paragraph({ spacing: SINGLE, children: [new TextRun({ text: "VT5 vertical text in sixteen points", size: 32 })] })]]],
            {},
            () => VERTICAL,
            [2000],
        ),
    ),
    // VT6: a cell of text running up of an 11-point paragraph and a 20-point one, beside a line
    around(
        "VT6",
        table(
            [
                [
                    [
                        line("VT6 vertical eleven"),
                        new Paragraph({ spacing: SINGLE, children: [new TextRun({ text: "VT6 vertical twenty", size: 40 })] }),
                    ],
                    [line("VT6 right")],
                ],
            ],
            {},
            (_, column) => (column === 0 ? VERTICAL : {}),
            [2000, WIDTH - 2000],
        ),
    ),
    // VT7: a cell of text running up with 400 after its paragraph, beside a line
    around(
        "VT7",
        table(
            [[[line("VT7 vertical text with space after", { spacing: { after: 400 } })], [line("VT7 right")]]],
            {},
            (_, column) => (column === 0 ? VERTICAL : {}),
            [2000, WIDTH - 2000],
        ),
    ),
];

/**
 * CF: a table of 5 rows of 5 cells, `rNcM`, in paragraphs of no formatting of their own. The cells don't name the probe,
 * so that they fit on a line in 23 points: the reader finds them between the probe's lines above and below the table
 */
const grid = (): Paragraph[][][] =>
    Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => [new Paragraph({ children: [new TextRun(`r${r + 1}c${c + 1}`)] })]),
    );
const ALL = { firstRow: true, lastRow: true, firstColumn: true, lastColumn: true, noHBand: false, noVBand: false };
const conditionalProbes: (Table | Paragraph)[][] = [
    // CF10: first and last rows and columns, without parts for the corners, every part on
    around("CF10", table(grid(), { style: "ProbeEdges", tableLook: ALL })),
    // CF11: bands of rows, with the first row on; CF12: the same with the first row off
    around(
        "CF11",
        table(grid(), {
            style: "ProbeRowBands",
            tableLook: { firstRow: true, lastRow: false, firstColumn: false, lastColumn: false, noHBand: false, noVBand: true },
        }),
    ),
    around(
        "CF12",
        table(grid(), {
            style: "ProbeRowBands",
            tableLook: { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, noHBand: false, noVBand: true },
        }),
    ),
    // CF13: bands of rows and of columns, both on; CF14: the same table without tblLook
    around(
        "CF13",
        table(grid(), {
            style: "ProbeBothBands",
            tableLook: { firstRow: false, lastRow: false, firstColumn: false, lastColumn: false, noHBand: false, noVBand: false },
        }),
    ),
    around("CF14", table(grid(), { style: "ProbeBothBands" })),
];

const spacingProbes: (Table | Paragraph)[][] = [
    // CS9: columns of 2000 and 7026 with 100 between cells, of prose
    around(
        "CS9",
        table([[[line(`CS9 ${prose(40)}`)], [line(`CS9 right ${prose(120)}`)]]], { cellSpacing: SPACING }, () => ({}), [
            2000,
            WIDTH - 2000,
        ]),
    ),
    // CS10: columns of 4513 with 100 between cells, in a table with no width of its own
    around(
        "CS10",
        table([[[line(`CS10 ${prose(60)}`)], [line(`CS10 right ${prose(60)}`)]]], {
            cellSpacing: SPACING,
            width: { size: 0, type: WidthType.AUTO },
        }),
    ),
    // CS11: 100 between cells with 3-point left, right and inside borders, of prose
    around(
        "CS11",
        table([[[line(`CS11 ${prose(60)}`)], [line(`CS11 right ${prose(60)}`)]]], {
            cellSpacing: SPACING,
            borders: {
                ...TableBorders.NONE,
                left: border(BorderStyle.SINGLE, 24),
                right: border(BorderStyle.SINGLE, 24),
                insideVertical: border(BorderStyle.SINGLE, 24),
            },
        }),
    ),
    // CS13: 100 between cells, the table's top and bottom borders 3 points and those between its rows half a point
    around(
        "CS13",
        table(oneLineRows("CS13", 5), {
            cellSpacing: SPACING,
            borders: {
                ...TableBorders.NONE,
                top: border(BorderStyle.SINGLE, 24),
                bottom: border(BorderStyle.SINGLE, 24),
                insideHorizontal: border(BorderStyle.SINGLE, 4),
            },
        }),
    ),
    // CS14: 100 between cells in a table laid out fixed, of prose
    around(
        "CS14",
        table([[[line(`CS14 ${prose(60)}`)], [line(`CS14 right ${prose(60)}`)]]], { cellSpacing: SPACING, layout: TableLayoutType.FIXED }),
    ),
];

/** CS12: one-line rows 100 apart, the text of the 6th of which ends `slack` above the bottom of the page */
const spacedBreak = (probe: string, slack: number): ISectionOptions => ({
    children: [
        ...lead(probe, BOTTOM - slack - 6 * (LINE + 200)),
        table(oneLineRows(probe, 10), { cellSpacing: SPACING }),
        line(`${probe} after`),
    ],
});

/** KR8: 10 rows of two one-line cells, whose second cell only is kept with the next in rows 1 to 9; rows 1 to 4 fit */
const keptBySecond: ISectionOptions = {
    children: [
        ...lead("KR8", BOTTOM - 4.5 * LINE),
        table(Array.from({ length: 10 }, (_, i) => [[line(`KR8 row ${i + 1}`)], [line(`KR8 right ${i + 1}`, { keepNext: i < 9 })]])),
        line("KR8 after"),
    ],
};

const CELL_MARGINS =
    '<w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>';
const size = (type: string, points: number): string =>
    `<w:tblStylePr w:type="${type}"><w:rPr><w:sz w:val="${points * 2}"/></w:rPr></w:tblStylePr>`;
const tableStyle = (id: string, tblPr: string, parts: string): string =>
    `<w:style w:type="table" w:styleId="${id}"><w:name w:val="${id}"/><w:basedOn w:val="TableNormal"/><w:tblPr>${tblPr}${CELL_MARGINS}</w:tblPr>${parts}</w:style>`;
const BANDS_OF_ONE = '<w:tblStyleRowBandSize w:val="1"/><w:tblStyleColBandSize w:val="1"/>';

/** Table styles docx can't write, added to styles.xml. Sizes as word-table-formats.ts has them */
const TABLE_STYLES = [
    tableStyle("ProbeEdges", "", [size("firstCol", 16), size("lastCol", 17), size("firstRow", 18), size("lastRow", 19)].join("")),
    tableStyle("ProbeRowBands", BANDS_OF_ONE, [size("band1Horz", 14), size("band2Horz", 15), size("firstRow", 18)].join("")),
    tableStyle(
        "ProbeBothBands",
        BANDS_OF_ONE,
        [size("band1Vert", 12), size("band2Vert", 13), size("band1Horz", 14), size("band2Horz", 15)].join(""),
    ),
].join("");

/** [what docx writes, what replaces it], in document.xml */
const INJECTIONS: readonly (readonly [RegExp, string])[] = [
    // MG4: hideMark, written as a cell shaded 123456, at the end of the cell's properties as its schema has it
    [/<w:shd [^>]*w:fill="123456"[^>]*\/>((?:(?!<\/w:tcPr>).)*)<\/w:tcPr>/g, "$1<w:hideMark/></w:tcPr>"],
];

const sections: ISectionOptions[] = [
    ...pages(marginProbes, 4),
    ...pages(BORDER_PROBES.map(borderProbe), 4),
    ...pages(sideProbes, 2),
    ...pages(verticalProbes, 3),
    ...pages(conditionalProbes, 3),
    ...pages(spacingProbes, 3),
    // CS12a: 50 twips to spare below the 6th row's text, less than the space between cells; CS12b: 150, more
    spacedBreak("CS12a", 50),
    spacedBreak("CS12b", 150),
    keptBySecond,
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
    writeFileSync("build/word-probes/word-table-formats2.docx", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
};

void main();
