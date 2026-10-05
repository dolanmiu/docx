/**
 * Probes of table borders docx/layout stops at:
 *
 * - "table cell borders of different styles that meet" (table-formats.ts): which border Word draws, and how much room it
 *   takes, where two cells' borders of different styles meet, or a cell's and the table's. `word-table-formats.docx`
 *   BC2 to BC5 showed the wider of two of the same style. The standard (ECMA-376 Part 1, 17.4.66) gives a rule for
 *   others: the heavier, weighing each border's width by a number for its style, then the darker colour. Four docx demos
 *   stop here (tables/merge-and-shade-cells, tables/table-borders, tables/table-cell-borders, templates/table-rows),
 *   with dashSmallGap and dashDotStroked cell borders beside docx's single table borders, or double ones.
 * - "a table border in a style not yet followed": wave, threeDEmboss and threeDEngrave at widths not yet seen, and art.
 * - "space between table cells beside borders left or right of them" (`word-table-formats2.docx` CS11 fitted no simple
 *   rule), "space between table cells as a share of the table's width", "a table row with space between its cells of
 *   its own", "a table with space between its cells and borders across pages", "a table row with space between its
 *   cells across pages".
 *
 * Several probes share a page, each between a line above and a line below it, so the line below gives the height of
 * what is between them. Calibri 11 on A4 with inch margins. Widths are in eighths of a point, as `w:sz` has them.
 *
 * TB1a to TB1x: two rows of one cell, 9026 wide, the first's bottom border A and the second's top border B, with no
 *   other borders: the room between the rows is the border Word draws there. The pairs are the demos' (a to d), then
 *   pairs to weigh styles against each other:
 *   a: single 4 / dashSmallGap 4       b: single 4 / dashDotStroked 24     c: double 4 / dashDotStroked 24
 *   d: single 4 / dashSmallGap 12      e: double 4 / single 4              f: double 4 / single 8
 *   g: double 4 / single 12            h: double 4 / single 18             i: double 4 / single 24
 *   j: single 12 / double 4, red / black     k: dotted 8 / single 8      l: dashed 8 / single 8
 *   m: dotted 8 / dashed 8             n: thick 8 / single 8               o: triple 4 / double 6
 *   p: thinThickSmallGap 12 / single 18     q: thickThinSmallGap 12 / thinThickSmallGap 12
 *   r: dotDash 8 / dotDotDash 8        s: inset 12 / outset 12             t: wave 6 / single 4
 *   u: threeDEmboss 12 / single 12     v: single 4 / nil (control)         w: none / single 12 (control)
 *   x: single 24 black / single 24 white
 * TB2a to TB2h: the same, left and right: a row of two cells, 4513 each, with no other borders, the first's right
 *   border A and the second's left border B. Where the second cell's text starts, and the rule drawn, say which wins
 *   a: single 4 / dashSmallGap 4   b: double 4 / single 12   c: double 4 / single 24   d: dotted 8 / single 8
 *   e: thick 12 / double 6         f: dashDotStroked 24 / single 4   g: single 4 / nil   h: single 24 / single 4
 * TB3a to TB3f: a cell's border against the table's: a table with single 4 borders all round and inside, its middle
 *   row's cells with top and bottom borders of a: dashSmallGap 4, b: dashSmallGap 12, c: double 4, d: dotted 12,
 *   e: dashDotStroked 24, f: single 12; as docx's demos write them
 * TB4: one-row tables with top and bottom borders of each style and width Word allows that the layout doesn't know:
 *   wave, threeDEmboss and threeDEngrave at 2, 6, 8, 18, 36 and 48 (TB4a to TB4r), doubleWave at 6 and 24 (TB4s, TB4t),
 *   dashDotStroked at 6 and 48 (TB4u, TB4v), and the art borders apples and triangles at 12 (TB4w, TB4x)
 * TB5a to TB5l: tables of two cells of 4000, space between cells (w:tblCellSpacing) of 40, 100 and 200, and left and
 *   right borders of the cells of 4, 12, 24 and 48, single: where each cell's text starts, and the table's edges
 * TB6a, TB6b: space between cells as a share of the table's width (`w:type="pct"`, 2% and 5% of a table of 9026)
 * TB6c, TB6d: a row with space between its cells of its own (100), in a table with none (c) and with 40 (d)
 * TB7a to TB7c: 40 rows of two cells, single borders, space between cells of 40 (a) and 100 (b), after 30 lines, so the
 *   table breaks across pages; and (c) the same with rows of 3 lines that break across the page
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-table-borders.ts [folder]
 */
import { BorderStyle, type ITableCellBorders, Table, TableRow, WidthType } from "docx";

import { type Child, PAGE, TEXT_WIDTH, cell, fill, group, line, newPage, replaceText, write } from "./kit";

type Side = { readonly style: string; readonly size: number; readonly color?: string };
const side = ({
    style,
    size,
    color = "000000",
}: Side): { style: (typeof BorderStyle)[keyof typeof BorderStyle]; size: number; color: string } => ({
    style: style as (typeof BorderStyle)[keyof typeof BorderStyle],
    size,
    color,
});
const NIL = { style: BorderStyle.NIL, size: 0, color: "auto" };
const NO_BORDERS = { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL };

const s = (style: string, size: number, color?: string): Side => ({ style, size, color });

const TB1: readonly (readonly [Side, Side])[] = [
    [s("single", 4), s("dashSmallGap", 4)],
    [s("single", 4), s("dashDotStroked", 24)],
    [s("double", 4), s("dashDotStroked", 24)],
    [s("single", 4), s("dashSmallGap", 12)],
    [s("double", 4), s("single", 4)],
    [s("double", 4), s("single", 8)],
    [s("double", 4), s("single", 12)],
    [s("double", 4), s("single", 18)],
    [s("double", 4), s("single", 24)],
    [s("single", 12, "FF0000"), s("double", 4)],
    [s("dotted", 8), s("single", 8)],
    [s("dashed", 8), s("single", 8)],
    [s("dotted", 8), s("dashed", 8)],
    [s("thick", 8), s("single", 8)],
    [s("triple", 4), s("double", 6)],
    [s("thinThickSmallGap", 12), s("single", 18)],
    [s("thickThinSmallGap", 12), s("thinThickSmallGap", 12)],
    [s("dotDash", 8), s("dotDotDash", 8)],
    [s("inset", 12), s("outset", 12)],
    [s("wave", 6), s("single", 4)],
    [s("threeDEmboss", 12), s("single", 12)],
    [s("single", 4), s("nil", 0)],
    [s("none", 0), s("single", 12)],
    [s("single", 24), s("single", 24, "FFFFFF")],
];

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnopqrstuvwxyz"[index]}`;
const border = (one: Side) => (one.style === "nil" || one.style === "none" ? NIL : side(one));

const twoRows = (probe: string, [a, b]: readonly [Side, Side]): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: NO_BORDERS,
        rows: [
            new TableRow({
                children: [cell(`${probe} row 1`, { width: { size: TEXT_WIDTH, type: WidthType.DXA }, borders: { bottom: border(a) } })],
            }),
            new TableRow({
                children: [cell(`${probe} row 2`, { width: { size: TEXT_WIDTH, type: WidthType.DXA }, borders: { top: border(b) } })],
            }),
        ],
    });

const TB2: readonly (readonly [Side, Side])[] = [
    [s("single", 4), s("dashSmallGap", 4)],
    [s("double", 4), s("single", 12)],
    [s("double", 4), s("single", 24)],
    [s("dotted", 8), s("single", 8)],
    [s("thick", 12), s("double", 6)],
    [s("dashDotStroked", 24), s("single", 4)],
    [s("single", 4), s("nil", 0)],
    [s("single", 24), s("single", 4)],
];
const HALF = TEXT_WIDTH / 2;
const twoCells = (probe: string, [a, b]: readonly [Side, Side]): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [HALF, HALF],
        borders: NO_BORDERS,
        rows: [
            new TableRow({
                children: [
                    cell(`${probe} left`, { width: { size: HALF, type: WidthType.DXA }, borders: { right: border(a) } }),
                    cell(`${probe} right`, { width: { size: HALF, type: WidthType.DXA }, borders: { left: border(b) } }),
                ],
            }),
        ],
    });

const SINGLE = side(s("single", 4));
const ALL = { top: SINGLE, bottom: SINGLE, left: SINGLE, right: SINGLE, insideHorizontal: SINGLE, insideVertical: SINGLE };
const TB3: readonly Side[] = [
    s("dashSmallGap", 4),
    s("dashSmallGap", 12),
    s("double", 4),
    s("dotted", 12),
    s("dashDotStroked", 24),
    s("single", 12),
];
const third = TEXT_WIDTH / 3;
const middleRow = (probe: string, own: Side): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [third, third, third],
        borders: ALL,
        rows: [1, 2, 3].map(
            (row) =>
                new TableRow({
                    children: [1, 2, 3].map((column) => {
                        const borders: ITableCellBorders = row === 2 ? { top: side(own), bottom: side(own) } : {};
                        return cell(`${probe} r${row}c${column}`, { width: { size: third, type: WidthType.DXA }, borders });
                    }),
                }),
        ),
    });

const TB4: readonly Side[] = [
    ...["wave", "threeDEmboss", "threeDEngrave"].flatMap((style) => [2, 6, 8, 18, 36, 48].map((size) => s(style, size))),
    s("doubleWave", 6),
    s("doubleWave", 24),
    s("dashDotStroked", 6),
    s("dashDotStroked", 48),
    s("apples", 12),
    s("triangles", 12),
];
const oneRow = (probe: string, one: Side): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: { ...NO_BORDERS, top: side(one), bottom: side(one) },
        rows: [
            new TableRow({ children: [cell(`${probe} ${one.style} ${one.size}`, { width: { size: TEXT_WIDTH, type: WidthType.DXA } })] }),
        ],
    });

const TB5 = [40, 100, 200].flatMap((spacing) => [4, 12, 24, 48].map((size) => ({ spacing, size })));
const spaced = (probe: string, spacing: number | undefined, size: number, rows = 1, lines = 1, rowSpacing?: number): Table => {
    const one = side(s("single", size));
    return new Table({
        width: { size: 8000 + (spacing ?? 0) * 3, type: WidthType.DXA },
        columnWidths: [4000, 4000],
        ...(spacing === undefined ? {} : { cellSpacing: { value: spacing, type: WidthType.DXA } }),
        borders: { top: one, bottom: one, left: one, right: one, insideHorizontal: one, insideVertical: one },
        rows: Array.from(
            { length: rows },
            (_, row) =>
                new TableRow({
                    ...(rowSpacing === undefined ? {} : { cellSpacing: { value: rowSpacing, type: WidthType.DXA } }),
                    children: ["left", "right"].map((where) =>
                        cell(Array.from({ length: lines }, (_, index) => `${probe} r${row + 1} ${where} ${index + 1}`).join("\n"), {
                            width: { size: 4000, type: WidthType.DXA },
                        }),
                    ),
                }),
        ),
    });
};

const children: Child[] = [
    ...TB1.flatMap((pair, index) => [
        ...(index > 0 && index % 6 === 0 ? [newPage()] : []),
        ...group(name("TB1", index), [twoRows(name("TB1", index), pair)]),
    ]),
    newPage(),
    ...TB2.flatMap((pair, index) => group(name("TB2", index), [twoCells(name("TB2", index), pair)])),
    newPage(),
    ...TB3.flatMap((own, index) => group(name("TB3", index), [middleRow(name("TB3", index), own)])),
    newPage(),
    ...TB4.flatMap((one, index) => [
        ...(index > 0 && index % 8 === 0 ? [newPage()] : []),
        ...group(name("TB4", index), [oneRow(name("TB4", index), one)]),
    ]),
    newPage(),
    ...TB5.flatMap(({ spacing, size }, index) => [
        ...(index > 0 && index % 6 === 0 ? [newPage()] : []),
        ...group(name("TB5", index), [spaced(name("TB5", index), spacing, size)]),
    ]),
    newPage(),
    ...group("TB6a", [spaced("TB6a", 1, 4)]),
    ...group("TB6b", [spaced("TB6b", 2, 4)]),
    ...group("TB6c", [spaced("TB6c", undefined, 4, 2, 1, 100)]),
    ...group("TB6d", [spaced("TB6d", 40, 4, 2, 1, 100)]),
    ...(["TB7a", "TB7b", "TB7c"] as const).flatMap((probe, index) => [
        newPage(),
        ...group(probe, [...fill(probe, 30), spaced(probe, index === 1 ? 100 : 40, 4, index === 2 ? 12 : 40, index === 2 ? 3 : 1)]),
    ]),
];

await write({
    name: "word-stops-table-borders",
    sections: [{ properties: PAGE, children }],
    injections: [
        // TB6a and TB6b's space between cells is a share of the table's width: 2% and 5%, in fiftieths of a percent
        (parts) => {
            const tables = parts.get("word/document.xml")!.split("<w:tbl>");
            const fix = (probe: string, fiftieths: number): void => {
                const index = tables.findIndex((part) => part.includes(`${probe} r1 left`));
                // A probe left out with ONLY has no table, and the other's still is changed
                if (index < 0) {
                    if (process.env.ONLY) {
                        return;
                    }
                    throw new Error(`No table for ${probe}`);
                }
                tables[index] = tables[index].replace(
                    /<w:tblCellSpacing w:type="dxa" w:w="\d+"\/>/,
                    `<w:tblCellSpacing w:type="pct" w:w="${fiftieths}"/>`,
                );
            };
            fix("TB6a", 100);
            fix("TB6b", 250);
            parts.set("word/document.xml", tables.join("<w:tbl>"));
        },
        // Check the art borders went in as written
        replaceText('w:val="apples"', 'w:val="apples"'),
    ],
});
export { line };
