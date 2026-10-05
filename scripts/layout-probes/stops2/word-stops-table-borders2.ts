/**
 * Probes of the table and paragraph borders `word-stops-table-borders.docx` (TB1 to TB7) and `word-stops-text.docx` PB4
 * left open, where docx/layout still stops:
 *
 * - "table cell borders of different styles that meet, wider than twice a cell's margin": TB1 and TB2 showed Word draws
 *   the heavier of two borders, by its weights, and makes room for the wider, but where the heavier is the narrower, and
 *   half the wider is more than the cell's margin, not which of them it keeps the text from (BT1a to BT1f); and "table cell
 *   borders of different styles that meet" where one is an art border, which Word doesn't weigh (BT1g, BT1h).
 * - "a table border in a style not yet followed" and "a paragraph border of a style not yet followed": art borders took
 *   their width, in points, at 12 (TB4w, TB4x, PB4a), but one width isn't enough to say they always do (BT2).
 * - "a paragraph border of a width or space not yet followed": a double border of no width took only its space (PB4d), and
 *   one 40 points from the text was 8 points away (PB4e), which 40 less 32 would explain (BT3).
 * - "the last row of a table with space between its cells across pages" and "a table with space between its cells,
 *   borders and header rows across pages" (BT4).
 * - "table rows with different space between their cells", "space between a table row's cells as a share of the table's
 *   width" and "space between table cells of a width that isn't in twips" (BT5).
 * - "a table row with borders of its own in a table with space between its cells" (BT6).
 *
 * Several probes share a page, each between a line above and a line below it, so the line below gives the height of
 * what is between them. Calibri 11 on A4 with inch margins. Widths are in eighths of a point, as `w:sz` has them, but
 * for art borders, whose `w:sz` is in points.
 *
 * BT1a to BT1h: a row of two cells, 4513 each, with no other borders, the first's right border A and the second's left
 *   border B, of which Word draws the heavier, A but in b, narrower than the other, with cell margins left and right of 0
 *   (a to d, g), 40 (e) and 60 twips (f, which docx/layout lays out, as half the wider is no more than the margin). Where
 *   the second cell's text starts says which border Word keeps it from, and the rule drawn which it draws
 *   a: dotDash 8 / single 48     b: single 48 / dotDash 8     c: thinThickSmallGap 4 / single 24
 *   d: dashDotStroked 6 / single 48     e: as a, margins of 40     f: as a, margins of 60
 *   g: single 4 / apples 12, an art border, which Word doesn't weigh     h: two rows of one cell, the first's bottom border
 *   apples 12 and the second's top border triangles 12
 * BT2a to BT2g: art borders at other widths than 12: one-row tables with top and bottom borders of apples at 6, 20 and 31
 *   points (a to c) and triangles at 6 and 31 (d, e), and paragraphs with borders all round of apples at 6 and 20 points
 *   (f, g), 4 points from the text
 * BT3a to BT3f: paragraphs with borders all round: single of no width 0 (a) and 12 points (b) from the text, double of no
 *   width 12 points from it (c), and single 4 at 32 (d), 50 (e) and 63 points (f) from it
 * BT4a to BT4c: tables of two columns with single borders and space between cells: (a) after 45 lines, 3 rows, the last of
 *   10 lines, space of 40, so the last row breaks across the page; (b) the same with space of 100, after 42 lines; (c) a
 *   header row and 30 rows of a line, space of 40, after 30 lines, so the table breaks across the page and Word repeats its
 *   header row
 * BT5a to BT5e: tables of 3 rows with single borders: (a) space between cells of 40, the middle row's own 100; (b) no space
 *   of the table's, the rows' own 40, 100 and 40; (c) space of 40, the middle row's own 2% of the table's width
 *   (`w:type="pct"`); (d) space of the table's of type `auto`, 100; (e) of type `auto`, 0
 * BT6a to BT6c: tables of 3 rows with single 4 borders and space between cells of 40 (a, b) and 100 (c), the middle row
 *   with borders of its own (`w:tblPrEx`): (a) all of single 24; (b) inside ones between its cells of double 6; (c) left and
 *   right of single 24
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-table-borders2.ts [folder]
 */
import { BorderStyle, Paragraph, Table, TableRow, WidthType } from "docx";

import { type Child, type Injection, PAGE, TEXT_WIDTH, cell, fill, group, line, newPage, write } from "./kit";

type Style = (typeof BorderStyle)[keyof typeof BorderStyle];
type Side = { readonly style: string; readonly size: number; readonly space?: number };
const s = (style: string, size: number, space?: number): Side => ({ style, size, ...(space === undefined ? {} : { space }) });
const side = ({ style, size, space }: Side): { style: Style; size: number; color: string; space?: number } => ({
    style: style as Style,
    size,
    color: "000000",
    ...(space === undefined ? {} : { space }),
});
const NIL = { style: BorderStyle.NIL, size: 0, color: "auto" };
const NO_BORDERS = { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL };
const SINGLE = side(s("single", 4));
const ALL = { top: SINGLE, bottom: SINGLE, left: SINGLE, right: SINGLE, insideHorizontal: SINGLE, insideVertical: SINGLE };
const HALF = TEXT_WIDTH / 2;

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghijklmnopqrstuvwxyz"[index]}`;

const BT1: readonly { readonly pair: readonly [Side, Side]; readonly margin: number }[] = [
    { pair: [s("dotDash", 8), s("single", 48)], margin: 0 },
    { pair: [s("single", 48), s("dotDash", 8)], margin: 0 },
    { pair: [s("thinThickSmallGap", 4), s("single", 24)], margin: 0 },
    { pair: [s("dashDotStroked", 6), s("single", 48)], margin: 0 },
    { pair: [s("dotDash", 8), s("single", 48)], margin: 40 },
    { pair: [s("dotDash", 8), s("single", 48)], margin: 60 },
    { pair: [s("single", 4), s("apples", 12)], margin: 0 },
];
const twoCells = (probe: string, [a, b]: readonly [Side, Side], margin: number): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [HALF, HALF],
        borders: NO_BORDERS,
        margins: { left: margin, right: margin },
        rows: [
            new TableRow({
                children: [
                    cell(`${probe} left`, { width: { size: HALF, type: WidthType.DXA }, borders: { right: side(a) } }),
                    cell(`${probe} right`, { width: { size: HALF, type: WidthType.DXA }, borders: { left: side(b) } }),
                ],
            }),
        ],
    });
const twoRows = (probe: string, [a, b]: readonly [Side, Side]): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: NO_BORDERS,
        rows: [
            new TableRow({
                children: [cell(`${probe} row 1`, { width: { size: TEXT_WIDTH, type: WidthType.DXA }, borders: { bottom: side(a) } })],
            }),
            new TableRow({
                children: [cell(`${probe} row 2`, { width: { size: TEXT_WIDTH, type: WidthType.DXA }, borders: { top: side(b) } })],
            }),
        ],
    });

const BT2_TABLES: readonly Side[] = [s("apples", 6), s("apples", 20), s("apples", 31), s("triangles", 6), s("triangles", 31)];
const oneRow = (probe: string, one: Side): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: { ...NO_BORDERS, top: side(one), bottom: side(one) },
        rows: [
            new TableRow({ children: [cell(`${probe} ${one.style} ${one.size}`, { width: { size: TEXT_WIDTH, type: WidthType.DXA } })] }),
        ],
    });
const boxed = (probe: string, one: Side): Paragraph =>
    line(`${probe} ${one.style} ${one.size} at ${one.space}`, {
        border: { top: side(one), bottom: side(one), left: side(one), right: side(one) },
    });
const BT2_PARAGRAPHS: readonly Side[] = [s("apples", 6, 4), s("apples", 20, 4)];
const BT3: readonly Side[] = [
    s("single", 0, 0),
    s("single", 0, 12),
    s("double", 0, 12),
    s("single", 4, 32),
    s("single", 4, 50),
    s("single", 4, 63),
];

/** A table of two columns of 4000 with single borders and space between cells, of rows of lines, the first a header */
const spaced = (
    probe: string,
    spacing: number | undefined,
    rows: readonly { readonly lines?: number; readonly spacing?: number; readonly header?: boolean }[],
): Table =>
    new Table({
        width: { size: 8000 + (spacing ?? 0) * 3, type: WidthType.DXA },
        columnWidths: [4000, 4000],
        ...(spacing === undefined ? {} : { cellSpacing: { value: spacing, type: WidthType.DXA } }),
        borders: ALL,
        rows: rows.map(
            ({ lines = 1, spacing: own, header }, row) =>
                new TableRow({
                    ...(own === undefined ? {} : { cellSpacing: { value: own, type: WidthType.DXA } }),
                    ...(header ? { tableHeader: true } : {}),
                    children: ["left", "right"].map((where) =>
                        cell(Array.from({ length: lines }, (_, index) => `${probe} r${row + 1} ${where} ${index + 1}`).join("\n"), {
                            width: { size: 4000, type: WidthType.DXA },
                        }),
                    ),
                }),
        ),
    });
const rows = (count: number, lines = 1): { readonly lines: number }[] => Array.from({ length: count }, () => ({ lines }));

/**
 * Changes the XML of the table whose text has a probe's first cell in it, or of its row whose text has `row` in it. A
 * probe left out with ONLY has no table, and nothing is changed for it
 */
const inTable =
    (probe: string, change: (xml: string) => string, row?: string): Injection =>
    (parts) => {
        const tables = parts.get("word/document.xml")!.split("<w:tbl>");
        const index = tables.findIndex((part) => part.includes(`${probe} r1 left`));
        if (index < 0) {
            if (process.env.ONLY) {
                return;
            }
            throw new Error(`No table for ${probe}`);
        }
        if (row === undefined) {
            tables[index] = change(tables[index]);
        } else {
            const rowParts = tables[index].split("<w:tr>");
            const at = rowParts.findIndex((part) => part.includes(row));
            rowParts[at] = change(rowParts[at]);
            tables[index] = rowParts.join("<w:tr>");
        }
        parts.set("word/document.xml", tables.join("<w:tbl>"));
    };
const replacing =
    (from: RegExp, to: string) =>
    (xml: string): string => {
        if (!from.test(xml)) {
            throw new Error(`Nothing to replace for ${String(from)}`);
        }
        return xml.replace(from, to);
    };
const SPACING = /<w:tblCellSpacing w:type="dxa" w:w="\d+"\/>/;
const border = (where: string, style: string, size: number): string =>
    `<w:${where} w:val="${style}" w:sz="${size}" w:space="0" w:color="000000"/>`;
// A row's own table properties (`w:tblPrEx`) go before its own row properties, first in the row
const exceptions = (bordersXml: string) => (xml: string) => `<w:tblPrEx><w:tblBorders>${bordersXml}</w:tblBorders></w:tblPrEx>${xml}`;

const children: Child[] = [
    ...BT1.flatMap(({ pair, margin }, index) => group(name("BT1", index), [twoCells(name("BT1", index), pair, margin)])),
    ...group("BT1h", [twoRows("BT1h", [s("apples", 12), s("triangles", 12)])]),
    newPage(),
    ...BT2_TABLES.flatMap((one, index) => group(name("BT2", index), [oneRow(name("BT2", index), one)])),
    ...BT2_PARAGRAPHS.flatMap((one, index) =>
        group(name("BT2", index + BT2_TABLES.length), [boxed(name("BT2", index + BT2_TABLES.length), one)]),
    ),
    newPage(),
    ...BT3.flatMap((one, index) => group(name("BT3", index), [boxed(name("BT3", index), one)])),
    newPage(),
    ...group("BT4a", [...fill("BT4a", 45), spaced("BT4a", 40, [...rows(2), { lines: 10 }])]),
    newPage(),
    ...group("BT4b", [...fill("BT4b", 42), spaced("BT4b", 100, [...rows(2), { lines: 10 }])]),
    newPage(),
    ...group("BT4c", [...fill("BT4c", 30), spaced("BT4c", 40, [{ lines: 1, header: true }, ...rows(30)])]),
    newPage(),
    ...group("BT5a", [spaced("BT5a", 40, [{}, { spacing: 100 }, {}])]),
    ...group("BT5b", [spaced("BT5b", undefined, [{ spacing: 40 }, { spacing: 100 }, { spacing: 40 }])]),
    ...group("BT5c", [spaced("BT5c", 40, [{}, { spacing: 100 }, {}])]),
    ...group("BT5d", [spaced("BT5d", 100, rows(3))]),
    ...group("BT5e", [spaced("BT5e", 100, rows(3))]),
    newPage(),
    ...group("BT6a", [spaced("BT6a", 40, rows(3))]),
    ...group("BT6b", [spaced("BT6b", 40, rows(3))]),
    ...group("BT6c", [spaced("BT6c", 100, rows(3))]),
];

await write({
    name: "word-stops-table-borders2",
    sections: [{ properties: PAGE, children }],
    injections: [
        // BT5c: the middle row's own space between cells is 2% of the table's width, in fiftieths of a percent
        inTable("BT5c", replacing(SPACING, '<w:tblCellSpacing w:type="pct" w:w="100"/>'), "BT5c r2 left"),
        // BT5d, BT5e: the table's space between cells of type auto
        inTable("BT5d", replacing(SPACING, '<w:tblCellSpacing w:type="auto" w:w="100"/>')),
        inTable("BT5e", replacing(SPACING, '<w:tblCellSpacing w:type="auto" w:w="0"/>')),
        // BT6a to BT6c: the middle row's own borders
        inTable(
            "BT6a",
            exceptions(["top", "left", "bottom", "right", "insideH", "insideV"].map((where) => border(where, "single", 24)).join("")),
            "BT6a r2 left",
        ),
        inTable("BT6b", exceptions(border("insideV", "double", 6)), "BT6b r2 left"),
        inTable("BT6c", exceptions(border("left", "single", 24) + border("right", "single", 24)), "BT6c r2 left"),
    ],
});
