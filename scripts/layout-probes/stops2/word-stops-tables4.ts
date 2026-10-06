/**
 * Probes of what `word-stops-tables3.docx` left open, where docx/layout still stops or follows a rule Word's PDFs have
 * shown only in part:
 *
 * - A long word in cells merged across columns of a table narrowed to the page (LW9, and LW2f to LW2i and LW8a to LW8d
 *   before it). Word's columns showed the word's width past the spanned columns' widest words handed to those columns one
 *   by one, each taking a share of what is left, which fits columns alike, but not the shares of columns that differ. In
 *   every case the columns beside them were a word wide, so how far Word narrowed the columns, which the raise of each
 *   column's widest word follows from, couldn't be read. Here a column of prose beside the merged cell's, which none is
 *   across, gives it (LW10).
 * - The text of the cell before two borders that meet, which Word keeps from the border it draws when that is the
 *   narrower (BT7): where it draws the wider, or the next cell's over none of the cell's own, and the text of the cell
 *   after it, kept from its own border where that is the wider (BT1), when the drawn one is wider than its own (BT9).
 * - A row of an exact height with space between cells, whose own space and its cells' borders are inside its height, and
 *   the table's edge outside (TS16a): with a border of 3 points above it, and as the last row (TS16c, TS16d).
 *
 * Calibri 11 on A4 with inch margins; each probe between a line above and a line below.
 *
 * LW10a to LW10h: a table given no widths of 4 columns, a word across the first two (a to f) or three (g, h) over prose,
 *   with a column of 10 words of prose beside them that none is across, narrowed to the page: a: W3000 over 20 words | 20;
 *   b: W3000 over 30 | 10; c: W3000 over 20 with a word of 1500 | 20; d: W5000 over 20 | 20; e: W5000 over 30 | 10;
 *   f: W3000 over 10 | 30; g: W6000 over 30 | 20 | 10; h: W6000 over 10 | 20 | 30. The top row's other cells are short words
 * BT9a to BT9d: a row of two cells of 4513 with no margins and no other borders, each of 30 words, the first's text
 *   right-aligned so its lines end at its text's right edge, the first's right border A and the second's left border B:
 *   a: single 48 / single 8     b: single 8 / single 48     c: none / single 48     d: single 48 / none
 * TS16c: a row of exactly 600 twips and a row of a line, single 4 borders but single 24 above the table, and space
 *   between cells of 40; TS16d: a row of a line and then a row of exactly 600, single 4 borders and space of 40
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-tables4.ts [folder]
 */
import { AlignmentType, BorderStyle, HeightRule, Table, TableRow, WidthType } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, type Child, PAGE, TEXT_WIDTH, cell, group, line, newPage, prose, write } from "./kit";

const CALIBRI = { font: "Calibri", size: 11 };
const twips = (text: string): number => measureTextWidth(text, CALIBRI) * 20;

/** A word of letters about `width` twips wide, starting with its probe's name so it names it */
const word = (name: string, width: number): string => {
    let text = `${name}x`;
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let index = 0;
    while (twips(text) < width) {
        text += letters[index % letters.length];
        index++;
    }
    return text;
};

type Style = (typeof BorderStyle)[keyof typeof BorderStyle];
const side = (style: string, size: number): { style: Style; size: number; color: string } => ({
    style: style as Style,
    size,
    color: "000000",
});
const NIL = { style: BorderStyle.NIL, size: 0, color: "auto" };
const NO_BORDERS = { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL };
const HALF = TEXT_WIDTH / 2;

/** A word across the first two of four columns, or three, over cells of prose, beside a column of prose none is across */
const merged = (probe: string, width: number, below: readonly string[], span: number): Table =>
    new Table({
        borders: ALL_BORDERS,
        rows: [
            new TableRow({
                children: [
                    cell(word(probe, width), { columnSpan: span }),
                    ...Array.from({ length: 4 - span }, (_, index) => cell(`${probe}u${index}`)),
                ],
            }),
            new TableRow({ children: below.map((text) => cell(text)) }),
        ],
    });
const lots = (probe: string, column: number, count: number): string => `${probe}c${column} ${prose(count)}`;
const beside = (probe: string): string => lots(probe, 3, 10);

const LW10 = [
    merged("LW10a", 3000, [lots("LW10a", 0, 20), lots("LW10a", 1, 20), word("LW10ac2", 800), beside("LW10a")], 2),
    merged("LW10b", 3000, [lots("LW10b", 0, 30), lots("LW10b", 1, 10), word("LW10bc2", 800), beside("LW10b")], 2),
    merged("LW10c", 3000, [`LW10cc0 ${word("LW10cw", 1500)} ${prose(20)}`, lots("LW10c", 1, 20), word("LW10cc2", 800), beside("LW10c")], 2),
    merged("LW10d", 5000, [lots("LW10d", 0, 20), lots("LW10d", 1, 20), word("LW10dc2", 800), beside("LW10d")], 2),
    merged("LW10e", 5000, [lots("LW10e", 0, 30), lots("LW10e", 1, 10), word("LW10ec2", 800), beside("LW10e")], 2),
    merged("LW10f", 3000, [lots("LW10f", 0, 10), lots("LW10f", 1, 30), word("LW10fc2", 800), beside("LW10f")], 2),
    merged("LW10g", 6000, [lots("LW10g", 0, 30), lots("LW10g", 1, 20), lots("LW10g", 2, 10), beside("LW10g")], 3),
    merged("LW10h", 6000, [lots("LW10h", 0, 10), lots("LW10h", 1, 20), lots("LW10h", 2, 30), beside("LW10h")], 3),
];

const BT9 = [
    [side("single", 48), side("single", 8)],
    [side("single", 8), side("single", 48)],
    [NIL, side("single", 48)],
    [side("single", 48), NIL],
] as const;
const meeting = (probe: string, [a, b]: (typeof BT9)[number]): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [HALF, HALF],
        borders: NO_BORDERS,
        margins: { left: 0, right: 0 },
        rows: [
            new TableRow({
                children: [
                    cell([line(`${probe} left ${prose(30)}`, { alignment: AlignmentType.RIGHT })], {
                        width: { size: HALF, type: WidthType.DXA },
                        borders: { right: a },
                    }),
                    cell(`${probe} right ${prose(30)}`, { width: { size: HALF, type: WidthType.DXA }, borders: { left: b } }),
                ],
            }),
        ],
    });

const exact = (probe: string, [thick, last]: readonly [boolean, boolean]): Table => {
    const set = new TableRow({ height: { value: 600, rule: HeightRule.EXACT }, children: [cell(`${probe} ${last ? "r2" : "r1"}`)] });
    const free = new TableRow({ children: [cell(`${probe} ${last ? "r1" : "r2"}`)] });
    return new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: thick ? { ...ALL_BORDERS, top: side("single", 24) } : ALL_BORDERS,
        cellSpacing: { value: 40, type: WidthType.DXA },
        rows: last ? [free, set] : [set, free],
    });
};

const name = (prefix: string, index: number): string => `${prefix}${"abcdefgh"[index]}`;
const children: Child[] = [
    ...LW10.flatMap((one, index) => [...(index === 4 ? [newPage()] : []), ...group(name("LW10", index), [one])]),
    newPage(),
    ...BT9.flatMap((pair, index) => group(name("BT9", index), [meeting(name("BT9", index), pair)])),
    ...group("TS16c", [exact("TS16c", [true, false])]),
    ...group("TS16d", [exact("TS16d", [false, true])]),
];

await write({ name: "word-stops-tables4", sections: [{ properties: PAGE, children }] });
