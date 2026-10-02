/**
 * Probes of the table widths `word-watertight-stops.docx` left open (SP14, SP15 and SP17), in the same setting: Calibri 11
 * on A4 with 1440 margins, so tables are in 9026 twips, with docx's Normal Table style, so cells have margins of 108, and
 * borders of half a point on every cell, which show where each column starts and ends. Each table has a line above it
 * naming its probe, and word-table-widths.py reads the edges of each of its rows from Word's PDF.
 *
 * TW1 to TW6: rows that give a column different widths, 3000 and 6026 in one row and 4000 and 5026 in the next, as SP14,
 *     in a table with no width of its own (TW1, TW2), with a width wider than the widest each row gives each column (TW3,
 *     TW4), and with a word of 4400 twips in the second column, so that narrowing it toward its widest word and in
 *     proportion differ (TW5, TW6). The even ones are laid out fixed
 * TW7 to TW10: a table whose cells all agree, with a width of its own narrower than its cells, with a word of 4400 in the
 *     second (TW7, TW8), and wider, with a word of 1700 in the first (TW9, TW10). The even ones are laid out fixed
 * TW11 to TW15: a word longer than the room: in the second of cells of 3000 and 6026 in a table 9026 wide, as SP15a had it
 *     in the first (TW11), in a table of 100% (TW12), in a table given no widths (TW13), and given no widths but a table
 *     width of 9026 (TW14); and a word longer than the table's own width, but not the page's (TW15)
 * TW16 to TW19: a long word in a cell across 2 columns, in a table whose cells all have widths: across columns of 1000 and
 *     2000 (TW16), across columns of 2000, one with a word of 1700 (TW17), across columns of 1000 and 3000 beside one that
 *     makes room for it, as SP15c (TW18); and a cell across 2 columns of 2000 whose own width is 5000 (TW19)
 * TW20 to TW23: a long word in a cell across columns of a table given no widths, which the table is narrowed around, as
 *     U1m of `word-probes.docx`: across "one" and a long line (TW20), across a half line and a long one, of 6000 and 3000
 *     (TW21, TW22), and wider than its columns' widest lines, beside a long line (TW23)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-table-widths.ts   (writes build/word-probes/word-table-widths.docx)
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, WidthType } from "docx";

type TableOptions = Partial<ConstructorParameters<typeof Table>[0]>;
/** A cell's text, and the width it gives itself and the columns it is across */
type Spec = { readonly text: string; readonly width?: number; readonly span?: number };

const LONG = "each entry of the log says what was found on the survey where it was found and what should be done about it";
const HALF = "each entry of the log says what was found on the survey";

// A word of m's about this many twips wide in Calibri 11, whose m is 175.8 twips
const word = (twips: number): string => "m".repeat(Math.round(twips / 175.78));

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

/** A table of rows of cells, each given a width, or none */
const table = (rows: readonly (readonly Spec[])[], options: TableOptions = {}): Table =>
    new Table({
        borders,
        ...options,
        rows: rows.map(
            (cells) =>
                new TableRow({
                    children: cells.map(
                        ({ text, width, span }) =>
                            new TableCell({
                                ...(width === undefined ? {} : { width: { size: width, type: WidthType.DXA } }),
                                ...(span === undefined ? {} : { columnSpan: span }),
                                children: [new Paragraph(text)],
                            }),
                    ),
                }),
        ),
    });

const probe = (name: string, note: string, written: Table): (Paragraph | Table)[] => [new Paragraph(`${name}: ${note}`), written];

const dxa = (size: number): TableOptions["width"] => ({ size, type: WidthType.DXA });
const FIXED = { layout: TableLayoutType.FIXED } as const;

/** Rows of 3000 and 6026, then 4000 and 5026, with this text in the second column */
const disagreeing = (name: string, second = "two words"): Spec[][] => [
    [
        { text: `${name} one`, width: 3000 },
        { text: `${name} ${second}`, width: 6026 },
    ],
    [
        { text: `${name} one`, width: 4000 },
        { text: `${name} ${second}`, width: 5026 },
    ],
];
/** Rows of 2000 and 5026, then 3000 and 4026 */
const narrower = (name: string): Spec[][] => [
    [
        { text: `${name} one`, width: 2000 },
        { text: `${name} two words`, width: 5026 },
    ],
    [
        { text: `${name} one`, width: 3000 },
        { text: `${name} two words`, width: 4026 },
    ],
];
/** Two rows of the same cells */
const agreeing = (name: string, widths: readonly number[], texts: readonly string[]): Spec[][] =>
    [1, 2].map(() => widths.map((width, index) => ({ text: `${name} ${texts[index]}`, width })));

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections: [
        {
            children: [
                ...probe("TW1", "rows disagree, no width", table(disagreeing("TW1"), { columnWidths: [3000, 6026] })),
                ...probe("TW2", "rows disagree, no width, fixed", table(disagreeing("TW2"), { columnWidths: [3000, 6026], ...FIXED })),
                ...probe("TW3", "rows disagree, 9026 wide", table(narrower("TW3"), { width: dxa(9026), columnWidths: [2000, 5026] })),
                ...probe(
                    "TW4",
                    "rows disagree, 9026 wide, fixed",
                    table(narrower("TW4"), { width: dxa(9026), columnWidths: [2000, 5026], ...FIXED }),
                ),
                ...probe(
                    "TW5",
                    "rows disagree, 9026 wide, a word of 4400 in the second",
                    table(disagreeing("TW5", word(4400)), { width: dxa(9026), columnWidths: [3000, 6026] }),
                ),
                ...probe(
                    "TW6",
                    "rows disagree, 9026 wide, a word of 4400 in the second, fixed",
                    table(disagreeing("TW6", word(4400)), { width: dxa(9026), columnWidths: [3000, 6026], ...FIXED }),
                ),
                ...probe(
                    "TW7",
                    "4000 6026 in 9026, a word of 4400 in the second",
                    table(agreeing("TW7", [4000, 6026], ["one", word(4400)]), { width: dxa(9026), columnWidths: [4000, 6026] }),
                ),
                ...probe(
                    "TW8",
                    "4000 6026 in 9026, a word of 4400 in the second, fixed",
                    table(agreeing("TW8", [4000, 6026], ["one", word(4400)]), { width: dxa(9026), columnWidths: [4000, 6026], ...FIXED }),
                ),
                ...probe(
                    "TW9",
                    "2000 4000 in 9000, a word of 1700 in the first",
                    table(agreeing("TW9", [2000, 4000], [word(1700), "two words"]), { width: dxa(9000), columnWidths: [2000, 4000] }),
                ),
                ...probe(
                    "TW10",
                    "2000 4000 in 9000, a word of 1700 in the first, fixed",
                    table(agreeing("TW10", [2000, 4000], [word(1700), "two words"]), {
                        width: dxa(9000),
                        columnWidths: [2000, 4000],
                        ...FIXED,
                    }),
                ),
                ...probe(
                    "TW11",
                    "3000 6026 in 9026, a word of 12000 in the second",
                    table(agreeing("TW11", [3000, 6026], ["left two words", word(12000)]).slice(0, 1), {
                        width: dxa(9026),
                        columnWidths: [3000, 6026],
                    }),
                ),
                ...probe(
                    "TW12",
                    "3000 6026 in 100%, a word of 12000 in the second",
                    table(agreeing("TW12", [3000, 6026], ["left two words", word(12000)]).slice(0, 1), {
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        columnWidths: [3000, 6026],
                    }),
                ),
                ...probe("TW13", "no widths, a word of 12000 in the second", table([[{ text: "TW13 left two words" }, { text: `TW13 ${word(12000)}` }]])),
                ...probe(
                    "TW14",
                    "no cell widths, 9026 wide, a word of 12000 in the second",
                    table([[{ text: "TW14 left two words" }, { text: `TW14 ${word(12000)}` }]], { width: dxa(9026) }),
                ),
                ...probe(
                    "TW15",
                    "1000 2000 in 3000, a word of 2500 in the first",
                    table(agreeing("TW15", [1000, 2000], [word(2500), "right two words"]).slice(0, 1), {
                        width: dxa(3000),
                        columnWidths: [1000, 2000],
                    }),
                ),
                ...probe(
                    "TW16",
                    "a word of 5000 across 1000 and 2000, no width",
                    table(
                        [
                            [
                                { text: word(5000), width: 3000, span: 2 },
                                { text: "TW16", width: 1000 },
                            ],
                            [
                                { text: "TW16 a", width: 1000 },
                                { text: "TW16 b", width: 2000 },
                                { text: "TW16", width: 1000 },
                            ],
                        ],
                        { columnWidths: [1000, 2000, 1000] },
                    ),
                ),
                ...probe(
                    "TW17",
                    "a word of 5000 across 2000 and 2000, the first with a word of 1700, no width",
                    table(
                        [
                            [
                                { text: word(5000), width: 4000, span: 2 },
                                { text: "TW17", width: 1000 },
                            ],
                            [
                                { text: `TW17 ${word(1700)}`, width: 2000 },
                                { text: "TW17 b", width: 2000 },
                                { text: "TW17", width: 1000 },
                            ],
                        ],
                        { columnWidths: [2000, 2000, 1000] },
                    ),
                ),
                ...probe(
                    "TW18",
                    "a word of 6000 across 1000 and 3000, beside 5026, in 9026",
                    table(
                        [
                            [
                                { text: word(6000), width: 4000, span: 2 },
                                { text: "TW18 right", width: 5026 },
                            ],
                            [
                                { text: "TW18 a", width: 1000 },
                                { text: "TW18 b", width: 3000 },
                                { text: "TW18 c", width: 5026 },
                            ],
                        ],
                        { width: dxa(9026), columnWidths: [1000, 3000, 5026] },
                    ),
                ),
                ...probe(
                    "TW19",
                    "a cell of 5000 across 2000 and 2000, beside 4026, above 5026, in 9026",
                    table(
                        [
                            [
                                { text: "TW19 across", width: 5000, span: 2 },
                                { text: "TW19 right", width: 4026 },
                            ],
                            [
                                { text: "TW19 a", width: 2000 },
                                { text: "TW19 b", width: 2000 },
                                { text: "TW19 c", width: 5026 },
                            ],
                        ],
                        { width: dxa(9026), columnWidths: [2000, 2000, 5026] },
                    ),
                ),
                ...probe("TW20", "a word of 4000 across one and long", table([[{ text: word(4000), span: 2 }], [{ text: "one" }, { text: LONG }]])),
                ...probe("TW21", "a word of 6000 across half and long", table([[{ text: word(6000), span: 2 }], [{ text: HALF }, { text: LONG }]])),
                ...probe("TW22", "a word of 3000 across half and long", table([[{ text: word(3000), span: 2 }], [{ text: HALF }, { text: LONG }]])),
                ...probe(
                    "TW23",
                    "a word of 4000 across one and two words, beside long",
                    table([
                        [{ text: word(4000), span: 2 }, { text: LONG }],
                        [{ text: "one" }, { text: "two words" }, { text: "x" }],
                    ]),
                ),
                new Paragraph("TW end"),
            ],
        },
    ],
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-table-widths.docx", buffer));
