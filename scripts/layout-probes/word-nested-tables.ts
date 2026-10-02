/**
 * Probes of how Word breaks a table in a table cell across pages, where `word-probes.docx` U4c and U4d didn't show it, for
 * docx/layout. Each probe starts a page, with lines that put a one-cell table, without borders or margins, at a place on
 * the page. Its cell has a line, a table in it, and a line after the table. Each line's text names its probe, so the
 * lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-nested-tables.py reads. Calibri 11,
 * single spaced, no space before or after, on A4 with 1440 margins, so the text is 1440 to 15398 twips down the page and
 * Word's lines are 268.55 twips.
 *
 * N1: a table of one-line rows with 3-point borders, whose 4th row ends 30 twips above the bottom of the page: whether
 *     the border below the last row on the page takes room there, and which border it is (as `word-line-heights.docx` T1
 *     and T4 for a table in the body), and whether a border is drawn above the rest on the next page
 * N2: a row of 6 lines between one-line rows, in a table with 3-point borders, whose 4th line ends 30 twips above the bottom:
 *     the same, where the row breaks across pages
 * N3: a row of 6 lines in a table whose cells have 144 twips of margin above and below: whether the margin below takes
 *     room on the first page, and the margin above on the next
 * N4: a row that can't break (`cantSplit`) of 4 lines after a one-line row, with room for 3: whether it moves to the next
 *     page whole, against the same row that can
 * N5: a row of 2 lines at least 2700 twips high, or exactly 2700, after a one-line row, with room for 6 lines
 * N6: a table in a cell of a table in a cell, of one-line rows, with room for 4 and a half
 * N7: a row of a 6-line cell beside a 3-line cell, with room for 2 lines: whether the row moves to the next page whole,
 *     as the 3-line cell's widow control holds back all its lines, as a row in the body does (`word-rules2.docx` Q3c)
 * N8: the table of one-line rows beside a cell of 10 lines, with room for 4 and a half lines below the first line
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    BorderStyle,
    Document,
    HeightRule,
    type ISectionOptions,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type RowOptions = Partial<ConstructorParameters<typeof TableRow>[0]>;

// Calibri 11's lines in Word, in twips
const LINE = (2500 / 2048) * 220;
const TOP = 1440;
const BOTTOM = 16838 - 1440;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

/**
 * The first lines of a probe, which put what follows them `at` twips down the page: a line naming the probe, and lines
 * after it, the last of them with the space after that makes up the rest
 */
const lead = (probe: string, at: number): Paragraph[] => {
    const count = Math.floor((at - TOP) / LINE);
    const after = Math.round(at - TOP - count * LINE);
    return Array.from({ length: count }, (_, i) =>
        line(i === 0 ? `${probe} top` : `${probe} fill ${i}`, i === count - 1 ? { spacing: { after } } : {}),
    );
};

/** Borders of these widths, in eighths of a point */
const borders = (top: number, between: number, bottom: number) => {
    const border = (size: number) =>
        size === 0 ? { style: BorderStyle.NONE, size: 0, color: "auto" } : { style: BorderStyle.SINGLE, size, color: "000000" };
    return {
        top: border(top),
        bottom: border(bottom),
        left: border(4),
        right: border(4),
        insideHorizontal: border(between),
        insideVertical: border(4),
    };
};
const EIGHTHS_IN_TWIPS = 20 / 8;

/** A table of this width of rows of cells of these blocks, without borders or cell margins unless it says */
const table = (
    width: number,
    rows: readonly (readonly (readonly (Paragraph | Table)[])[])[],
    options: { readonly borders?: ReturnType<typeof borders>; readonly margin?: number; readonly rows?: readonly RowOptions[] } = {},
): Table => {
    const cellWidth = Math.floor(width / rows[0].length);
    return new Table({
        width: { size: cellWidth * rows[0].length, type: WidthType.DXA },
        columnWidths: rows[0].map(() => cellWidth),
        borders: options.borders ?? TableBorders.NONE,
        margins: { top: options.margin ?? 0, bottom: options.margin ?? 0, left: 0, right: 0 },
        rows: rows.map(
            (cells, index) =>
                new TableRow({
                    ...options.rows?.[index],
                    children: cells.map(
                        (children) => new TableCell({ width: { size: cellWidth, type: WidthType.DXA }, children: [...children] }),
                    ),
                }),
        ),
    });
};

/** One-line rows, each naming its probe and number */
const oneLineRows = (probe: string, count: number): Paragraph[][][] =>
    Array.from({ length: count }, (_, i) => [[line(`${probe} row ${i + 1}`)]]);

/**
 * A probe: the outer table `at` twips down the page, its cell a line, the table in it and a line after it, and a line after
 * the outer table. The cell's line is above the table, so `at + LINE` is where the table in it starts
 */
const probe = (name: string, at: number, inner: Table, beside?: Paragraph): ISectionOptions => ({
    children: [
        ...lead(name, at),
        table(9026, [[[line(`${name} before`), inner, line(`${name} after table`)], ...(beside ? [[beside]] : [])]]),
        line(`${name} below`),
    ],
});

const N1 = (name: string, top: number, between: number, bottom: number, slack: number): ISectionOptions =>
    probe(
        name,
        BOTTOM - slack - 4 * LINE - (top + 3 * between) * EIGHTHS_IN_TWIPS - LINE,
        table(9026, oneLineRows(name, 8), { borders: borders(top, between, bottom) }),
    );

const sections: ISectionOptions[] = [
    // N1: a: 3-point borders and 30 twips to spare below the 4th row, b: 3 points between the rows and none at the bottom,
    // c: none between and 3 points at the bottom (spare counted without borders between)
    N1("N1a", 24, 24, 24, 30),
    N1("N1b", 24, 24, 0, 30),
    N1("N1c", 24, 0, 24, 30),

    // N2: 3-point borders, and 30 twips to spare below the 4th line of the second row
    probe(
        "N2",
        BOTTOM - 30 - 5 * LINE - 2 * 24 * EIGHTHS_IN_TWIPS - LINE,
        table(9026, [[[line("N2 row 1")]], [[lines("N2", 6)]], [[line("N2 row 3")]]], { borders: borders(24, 24, 24) }),
    ),

    // N3: 144 twips of margin above and below each cell, and 70 twips to spare below the 4th line of a row of 6 with its margin
    // above
    probe("N3", BOTTOM - 70 - 4 * LINE - 144 - LINE, table(9026, [[[lines("N3", 6)]], [[line("N3 row 2")]]], { margin: 144 })),

    // N4: a: a row of 4 lines that can't break after a one-line row, with room for 3 of its lines and 30 twips, b: the same
    // row that can
    ...[
        ["N4a", true],
        ["N4b", false],
    ].map(([name, cantSplit]) =>
        probe(
            name as string,
            BOTTOM - 30 - 3 * LINE - LINE - LINE,
            table(9026, [[[line(`${name} row 1`)]], [[lines(name as string, 4)]], [[line(`${name} row 3`)]]], {
                rows: [{}, { cantSplit: cantSplit as boolean }],
            }),
        ),
    ),

    // N5: a row of 2 lines a: at least 2700 twips high, b: exactly, after a one-line row, with room for 6 lines and 30
    // twips
    ...[
        ["N5a", HeightRule.ATLEAST],
        ["N5b", HeightRule.EXACT],
    ].map(([name, rule]) =>
        probe(
            name,
            BOTTOM - 30 - 6 * LINE - LINE - LINE,
            table(9026, [[[line(`${name} row 1`)]], [[lines(name, 2)]], [[line(`${name} row 3`)]]], {
                rows: [{}, { height: { value: 2700, rule: rule as (typeof HeightRule)[keyof typeof HeightRule] } }],
            }),
        ),
    ),

    // N6: a table of one-line rows in a cell of a table in the outer table's cell, with room for 4 and a half of them
    probe("N6", BOTTOM - 4.5 * LINE - LINE, table(9026, [[[table(9026, oneLineRows("N6", 8))]]])),

    // N7: a row of a 6-line cell beside a 3-line cell, with room for 2 lines and 30 twips
    probe(
        "N7",
        BOTTOM - 30 - 2 * LINE - LINE,
        table(9026, [
            [[lines("N7 left", 6)], [lines("N7 right", 3)]],
            [[line("N7 row 2 left")], [line("N7 row 2 right")]],
        ]),
    ),

    // N8: the table of one-line rows in a cell beside a cell of 10 lines, with room for 4 and a half of them below the line
    // above the table
    probe("N8", BOTTOM - 4.5 * LINE - LINE, table(4513, oneLineRows("N8", 8)), lines("N8 beside", 10)),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-nested-tables.docx", buffer));
