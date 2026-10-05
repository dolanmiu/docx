/**
 * Probes of what `word-stops-long-words2.docx`, `word-stops-table-borders2.docx`, `word-stops-tables2.docx` and
 * `word-stops-rows2.docx` left open, where docx/layout still stops or follows a rule Word's PDFs have shown only in part:
 *
 * - "a long word in cells merged across columns", in a table narrowed to the page (LW9). In LW2f to LW2h and LW8a to
 *   LW8d, the columns came out as though the word's width past their widest words were added to their widest words, five
 *   eighths to the first column it is across and three to the second, weighted by their widest lines, but LW2i, across
 *   three columns, doesn't fit that.
 * - A cell's text kept from its own border where two of different styles meet: BT1 showed the cell after the meeting, and
 *   the layout takes the cell before it to be kept from its own the same way (BT7).
 * - Half of each of a table's outer borders inside the room a table sized to its text fills, seen with borders of half a
 *   point only (BT8).
 * - The border above a row of an exact height inside it, seen in TS15, without space between the cells, and with a border
 *   of half a point only (TS16).
 * - The text of a cell merged down rows where the page breaks between them and more than a line of it fits before the
 *   break: RW14a and RW14b had a line, which widow control kept off the page (RW21).
 *
 * Calibri 11 on A4 with inch margins; each probe between a line above and a line below.
 *
 * LW9a to LW9f: a table given no widths of 3 columns, a word across the first two (a to d) or all three (e, f) over prose,
 *   narrowed to the page: a: W3000 over 30 words | 20 words | S800; b: W3000 over 30 | 5 | S800; c: W3000 over 10 | 30 |
 *   S800; d: W5000 over 30 | 10 | S800; e: W6000 over 30 | 20 | 10; f: W6000 over 10 | 20 | 30
 * BT7a to BT7c: a row of two cells of 4513 with no margins and no other borders, the first's text 30 words right-aligned
 *   so its lines end at its text's right edge, the first's right border A and the second's left border B:
 *   a: dotDash 8 / single 48     b: single 48 / dotDash 8     c: thinThickSmallGap 4 / single 24
 * BT8a, BT8b: a table given no widths of S1000 | W9000, with left and right borders of single 24 (a) and 48 (b), narrowed
 *   to the page
 * TS16a: a row of exactly 600 twips and a row of a line, single 4 borders and space between cells of 40; TS16b: the same
 *   without the space, the border above the first row single 24
 * RW21: after 40 lines, two rows: a cell of 10 lines merged down both, beside 6 lines in the first and 8 in the second,
 *   which can't split, so the page breaks between them with 6 lines of the merged cell's room on the page
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-tables3.ts [folder]
 */
import { AlignmentType, BorderStyle, HeightRule, Table, TableRow, VerticalMergeType, WidthType } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, type Child, PAGE, TEXT_WIDTH, cell, fill, group, line, lines, newPage, probe, prose, write } from "./kit";

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

/** A word across the first two of three columns, or all three, over cells of prose or a short word */
const merged = (probe: string, width: number, below: readonly string[], span: number): Table =>
    new Table({
        borders: ALL_BORDERS,
        rows: [
            new TableRow({
                children: [
                    cell(word(probe, width), { columnSpan: span }),
                    ...Array.from({ length: 3 - span }, (_, index) => cell(`${probe}u${index}`)),
                ],
            }),
            new TableRow({ children: below.map((text) => cell(text)) }),
        ],
    });
const lots = (probe: string, column: number, count: number): string => `${probe}c${column} ${prose(count)}`;

const LW9 = [
    merged("LW9a", 3000, [lots("LW9a", 0, 30), lots("LW9a", 1, 20), word("LW9ac2", 800)], 2),
    merged("LW9b", 3000, [lots("LW9b", 0, 30), lots("LW9b", 1, 5), word("LW9bc2", 800)], 2),
    merged("LW9c", 3000, [lots("LW9c", 0, 10), lots("LW9c", 1, 30), word("LW9cc2", 800)], 2),
    merged("LW9d", 5000, [lots("LW9d", 0, 30), lots("LW9d", 1, 10), word("LW9dc2", 800)], 2),
    merged("LW9e", 6000, [lots("LW9e", 0, 30), lots("LW9e", 1, 20), lots("LW9e", 2, 10)], 3),
    merged("LW9f", 6000, [lots("LW9f", 0, 10), lots("LW9f", 1, 20), lots("LW9f", 2, 30)], 3),
];

const BT7 = [
    ["dotDash", 8, "single", 48],
    ["single", 48, "dotDash", 8],
    ["thinThickSmallGap", 4, "single", 24],
] as const;
const meeting = (probe: string, [a, sizeA, b, sizeB]: (typeof BT7)[number]): Table =>
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
                        borders: { right: side(a, sizeA) },
                    }),
                    cell(`${probe} right`, { width: { size: HALF, type: WidthType.DXA }, borders: { left: side(b, sizeB) } }),
                ],
            }),
        ],
    });

const outer = (probe: string, size: number): Table =>
    new Table({
        borders: { ...ALL_BORDERS, left: side("single", size), right: side("single", size) },
        rows: [new TableRow({ children: [cell(word(`${probe}s`, 1000)), cell(word(probe, 9000))] })],
    });

const exact = (probe: string, spacing: boolean): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: spacing ? ALL_BORDERS : { ...ALL_BORDERS, top: side("single", 24) },
        ...(spacing ? { cellSpacing: { value: 40, type: WidthType.DXA } } : {}),
        rows: [
            new TableRow({ height: { value: 600, rule: HeightRule.EXACT }, children: [cell(`${probe} r1`)] }),
            new TableRow({ children: [cell(`${probe} r2`)] }),
        ],
    });

const RW21 = new Table({
    width: { size: TEXT_WIDTH, type: WidthType.DXA },
    columnWidths: [HALF, HALF],
    borders: ALL_BORDERS,
    rows: [
        new TableRow({
            children: [cell([lines("RW21 merged", 10)], { verticalMerge: VerticalMergeType.RESTART }), cell([lines("RW21 row 1", 6)])],
        }),
        new TableRow({
            cantSplit: true,
            children: [cell("", { verticalMerge: VerticalMergeType.CONTINUE }), cell([lines("RW21 row 2", 8)])],
        }),
    ],
});

const name = (prefix: string, index: number): string => `${prefix}${"abcdefgh"[index]}`;
const children: Child[] = [
    ...LW9.flatMap((one, index) => [...(index === 3 ? [newPage()] : []), ...group(name("LW9", index), [one])]),
    newPage(),
    ...BT7.flatMap((pair, index) => group(name("BT7", index), [meeting(name("BT7", index), pair)])),
    ...[24, 48].flatMap((size, index) => group(name("BT8", index), [outer(name("BT8", index), size)])),
    ...[true, false].flatMap((spacing, index) => group(name("TS16", index), [exact(name("TS16", index), spacing)])),
    ...probe("RW21", [...fill("RW21", 40), RW21]),
];

await write({ name: "word-stops-tables3", sections: [{ properties: PAGE, children }] });
