/**
 * Probes of long words in tables, where docx/layout stops:
 *
 * - "a word longer than its table can make room for" (column-widths.ts): a word wider than what the table has left once
 *   its other columns have their widest words. `word-long-words.docx` L7 and `word-table-widths.docx` TW12, TW13 showed
 *   Word narrows the other columns past their widest words, by no rule found. Two docx demos stop here
 *   (charts/charts, tables/side-by-side-tables), and every `word-compat-settings` probe.
 * - "a long word in cells merged across columns": U1e, U1m and TW20 to TW22 fit no one way of sharing a merged cell's
 *   word between its columns.
 * - "space between the cells of a table wider than its cells", "a long word in a table with space between its cells",
 *   "a table whose rows give a column different widths" with a width as a share, space between cells, or `w:gridBefore`.
 *
 * Each probe is a table between a line above and a line below; the column edges are where Word draws the borders
 * (single, half a point), and each cell's lines where its text breaks. "W<n>" stands for a word of letters that is n
 * twips wide in Calibri 11, as docx/layout's width tables measure it; "S<n>" for a short word of n twips. Calibri 11 on
 * A4 with inch margins, the text 9026 wide.
 *
 * LW1a to LW1l: tables given no widths (sized to their text), each cell one word, whose words together are wider than
 *   the page:
 *   a: W10000                      b: S1000 | W9000              c: S1000 | W12000             d: S2000 | S2000 | W7000
 *   e: S3000 | W8000               f: S1000 | S1000 | W8000      g: two lines "S800 S800" | W8800
 *   h: S1000 | W9000, the table 100% wide (w:tblW pct 5000)
 *   i: as h, 50% wide              j: S1000 | W9000 with the other cell's 3 words of 600
 *   k: four columns S1500 each | W5000      l: W5000 | W5000
 * LW2a to LW2j: a merged cell (gridSpan 2, or 3 in i) in a table given no widths of three columns, above a row of
 *   three cells. "n x S<w>" is n words of w twips on one line, so its column's widest line is long and its widest word
 *   short; "prose" is 20 or 30 words, which narrows the table to the page:
 *   a: W4000 with two S500 beside it in the merged cell, over S800 | S800 | S800
 *   b: W6000 with an S900 beside it, over S1600 | S800 | S800
 *   c: W3500 over 4 x S300 | S2000 | S800 (shares by the columns' words and lines that the layout follows)
 *   d: W5000 over the same (the same)
 *   e: W4000 over 6 x S250 | S1200 | S800 (a share narrower than the first column's widest line)
 *   f: W3000 over prose | prose | S800 (narrowed)     g: W5000 over the same
 *   h: W3000 over the second and third columns: S800 | prose | prose
 *   i: W6000 across all three, over prose | prose | prose
 *   j: W4000 over S800 | S800 | S800, which the layout shares by the columns' widths (a control)
 * LW3a to LW3f: a table with no borders and space between its cells of 60, whose two cells give 3000 each, in a table of
 *   9000 with a word in the first cell of a: 1000, b: 2900, c: 3500, d: 6000; and of 7000 with e: 1000, f: 3500
 * LW4a to LW4d: a table with no borders and space between its cells of 100, cells given 3000 and 4000, a word in the
 *   first of a: 2900, b: 3500, c: 5000; d: given no widths, S1000 | W8000
 * LW5a to LW5f: rows that give the first column different widths (3000 + 6026, and 4000 + 5026), in a table of
 *   a: 100% (pct)   b: 80% (pct)   c: space between cells of 60   d: the second row starting past a first column of
 *   4000 (w:gridBefore 1, w:wBefore 4000) with a cell of 5026   e: as d, fixed layout   f: rows of three cells of
 *   1000 + 3000 + 5026 and 3000 + 1000 + 5026 in a table of 90% (pct)
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-long-words.ts [folder]
 */
import { BorderStyle, Table, TableLayoutType, TableRow, WidthType } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { type Child, PAGE, TEXT_WIDTH, cell, group, newPage, prose, write } from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
const twips = (text: string): number => measureTextWidth(text, CALIBRI) * 20;

/** A word of letters about `width` twips wide, starting with its probe's name so it names it */
const word = (probe: string, width: number): string => {
    let text = `${probe}x`;
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let index = 0;
    while (twips(text) < width) {
        text += letters[index % letters.length];
        index++;
    }
    return text;
};

type Cell = string | { readonly text: string; readonly span?: number; readonly width?: number };
const row = (cells: readonly Cell[], options: { readonly before?: number } = {}): TableRow =>
    new TableRow({
        ...(options.before ? { gridBefore: 1, widthBefore: { size: options.before, type: WidthType.DXA } } : {}),
        children: cells.map((one) =>
            typeof one === "string"
                ? cell(one)
                : cell(one.text, {
                      ...(one.span ? { columnSpan: one.span } : {}),
                      ...(one.width ? { width: { size: one.width, type: WidthType.DXA } } : {}),
                  }),
        ),
    });

/** A table given no widths: no table width, no grid widths written, no cell widths */
const sized = (rows: readonly TableRow[], options: object = {}): Table => new Table({ rows: [...rows], ...options });

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnopqrstuvwxyz"[index]}`;

const LW1 = (probe: string): readonly (readonly Cell[])[] => {
    const short = (n: number, i = 1): string => word(`${probe}s${i}`, n);
    const long = (n: number): string => word(probe, n);
    return [
        [long(10000)],
        [short(1000), long(9000)],
        [short(1000), long(12000)],
        [short(2000), short(2000, 2), long(7000)],
        [short(3000), long(8000)],
        [short(1000), short(1000, 2), long(8000)],
        [`${short(800)}\n${short(800, 2)}`, long(8800)],
        [short(1000), long(9000)],
        [short(1000), long(9000)],
        [`${short(600)} ${short(600, 2)} ${short(600, 3)}`, long(9000)],
        [short(1500), short(1500, 2), short(1500, 3), short(1500, 4), long(5000)],
        [long(5000), word(`${probe}b`, 5000)],
    ][["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].indexOf(probe.slice(-1))];
};

// Each: the merged cell's text, the cells below it, the columns it spans from (at) and how many (span). "words(n, w)"
// is n words of w twips on one line, which makes a column's widest line long and its widest word short
type Merge = {
    readonly top: (probe: string) => string;
    readonly below: readonly ((probe: string, column: number) => string)[];
    readonly at?: number;
    readonly span?: number;
};
const words =
    (count: number, width: number) =>
    (probe: string, column: number): string =>
        Array.from({ length: count }, (_, index) => word(`${probe}c${column}w${index}`, width)).join(" ");
const one =
    (width: number) =>
    (probe: string, column: number): string =>
        word(`${probe}c${column}`, width);
const lots =
    (count: number) =>
    (probe: string, column: number): string =>
        `${probe}c${column} ${prose(count)}`;
const LW2: readonly Merge[] = [
    // a, b: a word with more text beside it in the merged cell
    { top: (probe) => `${word(probe, 4000)} ${word(`${probe}m`, 500)} ${word(`${probe}n`, 500)}`, below: [one(800), one(800), one(800)] },
    { top: (probe) => `${word(probe, 6000)} ${word(`${probe}m`, 900)}`, below: [one(1600), one(800), one(800)] },
    // c to e: a word whose shares by the columns' widest words and lines would leave one narrower than its widest line
    { top: (probe) => word(probe, 3500), below: [words(4, 300), one(2000), one(800)] },
    { top: (probe) => word(probe, 5000), below: [words(4, 300), one(2000), one(800)] },
    { top: (probe) => word(probe, 4000), below: [words(6, 250), one(1200), one(800)] },
    // f to h: a word wider than the columns' widest words but not their lines, in a table narrowed to the page
    { top: (probe) => word(probe, 3000), below: [lots(30), lots(30), one(800)] },
    { top: (probe) => word(probe, 5000), below: [lots(30), lots(30), one(800)] },
    { top: (probe) => word(probe, 3000), below: [one(800), lots(30), lots(30)], at: 1 },
    // i: across all three, narrowed; j: a control the rule settles (the word shared by the columns' widths)
    { top: (probe) => word(probe, 6000), below: [lots(20), lots(20), lots(20)], span: 3 },
    { top: (probe) => word(probe, 4000), below: [one(800), one(800), one(800)] },
];
const merged = (probe: string, { top: topText, below, at = 0, span = 2 }: Merge): Table => {
    const top: Cell[] = [
        ...Array.from({ length: at }, (_, index) => `${probe}t${index}`),
        { text: topText(probe), span },
        ...Array.from({ length: 3 - at - span }, (_, index) => `${probe}u${index}`),
    ];
    return sized([row(top), row(below.map((make, column) => make(probe, column)))]);
};

const LW3 = [
    { table: 9000, word: 1000 },
    { table: 9000, word: 2900 },
    { table: 9000, word: 3500 },
    { table: 9000, word: 6000 },
    { table: 7000, word: 1000 },
    { table: 7000, word: 3500 },
];
const NONE = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
// Space between cells of 60, in a table wider than its cells, with no borders, so the space between cells beside borders
// doesn't stop the layout first
const wider = (probe: string, { table: total, word: width }: (typeof LW3)[number]): Table =>
    new Table({
        width: { size: total, type: WidthType.DXA },
        columnWidths: [3000, 3000],
        cellSpacing: { value: 60, type: WidthType.DXA },
        borders: NO_BORDERS,
        rows: [
            row([
                { text: word(probe, width), width: 3000 },
                { text: `${probe} second`, width: 3000 },
            ]),
        ],
    });

const LW4 = [2900, 3500, 5000];
const spacedLong = (probe: string, width: number): Table =>
    new Table({
        width: { size: 7300, type: WidthType.DXA },
        columnWidths: [3000, 4000],
        cellSpacing: { value: 100, type: WidthType.DXA },
        borders: NO_BORDERS,
        rows: [
            row([
                { text: word(probe, width), width: 3000 },
                { text: `${probe} second`, width: 4000 },
            ]),
        ],
    });

const disagree = (probe: string, index: number): Table => {
    const rows = [
        row([
            { text: `${probe} r1 3000`, width: 3000 },
            { text: `${probe} r1 6026`, width: 6026 },
        ]),
    ];
    const second = (before?: number): TableRow =>
        before
            ? row([{ text: `${probe} r2 5026`, width: 5026 }], { before })
            : row([
                  { text: `${probe} r2 4000`, width: 4000 },
                  { text: `${probe} r2 5026`, width: 5026 },
              ]);
    switch (index) {
        case 0:
            return new Table({ width: { size: 5000, type: WidthType.PERCENTAGE }, rows: [...rows, second()] });
        case 1:
            return new Table({ width: { size: 4000, type: WidthType.PERCENTAGE }, rows: [...rows, second()] });
        case 2:
            return new Table({
                width: { size: TEXT_WIDTH, type: WidthType.DXA },
                cellSpacing: { value: 60, type: WidthType.DXA },
                rows: [...rows, second()],
            });
        case 3:
            return new Table({
                width: { size: TEXT_WIDTH, type: WidthType.DXA },
                columnWidths: [3000, 1000, 5026],
                rows: [...rows, second(4000)],
            });
        case 4:
            return new Table({
                width: { size: TEXT_WIDTH, type: WidthType.DXA },
                columnWidths: [3000, 1000, 5026],
                layout: TableLayoutType.FIXED,
                rows: [...rows, second(4000)],
            });
        default:
            return new Table({
                width: { size: 4500, type: WidthType.PERCENTAGE },
                rows: [
                    row([1000, 3000, 5026].map((width, column) => ({ text: `${probe} r1 c${column + 1}`, width }))),
                    row([3000, 1000, 5026].map((width, column) => ({ text: `${probe} r2 c${column + 1}`, width }))),
                ],
            });
    }
};

const children: Child[] = [
    ...Array.from({ length: 12 }, (_, index) => {
        const probe = name("LW1", index);
        const cells = LW1(probe);
        const options =
            index === 7
                ? { width: { size: 5000, type: WidthType.PERCENTAGE } }
                : index === 8
                  ? { width: { size: 2500, type: WidthType.PERCENTAGE } }
                  : {};
        return [...(index > 0 && index % 4 === 0 ? [newPage()] : []), ...group(probe, [sized([row(cells)], options)])];
    }).flat(),
    newPage(),
    ...LW2.flatMap((one, index) => [
        ...(index > 0 && index % 4 === 0 ? [newPage()] : []),
        ...group(name("LW2", index), [merged(name("LW2", index), one)]),
    ]),
    newPage(),
    ...LW3.flatMap((one, index) => group(name("LW3", index), [wider(name("LW3", index), one)])),
    newPage(),
    ...LW4.flatMap((width, index) => group(name("LW4", index), [spacedLong(name("LW4", index), width)])),
    ...group("LW4d", [
        sized([row([word("LW4ds", 1000), word("LW4d", 8000)])], { cellSpacing: { value: 100, type: WidthType.DXA }, borders: NO_BORDERS }),
    ]),
    newPage(),
    ...Array.from({ length: 6 }, (_, index) => group(name("LW5", index), [disagree(name("LW5", index), index)])).flat(),
];

await write({ name: "word-stops-long-words", sections: [{ properties: PAGE, children }] });
