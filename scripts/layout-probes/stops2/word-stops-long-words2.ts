/**
 * Probes of long words and table widths, for what `word-stops-long-words.docx` left open. Its LW1h, LW1i, LW5a, LW5b and
 * LW5f gave their tables shares of the width 50 times too large (docx's `WidthType.PERCENTAGE` takes a percent, and they
 * gave fiftieths of one), and its LW5d and LW5e no `w:gridBefore` (docx doesn't write it), so these ask again:
 *
 * - "a word longer than its table can make room for", in a table of a share of the width (LW6a to LW6c): LW1 showed Word
 *   shares the room among the columns in proportion to their widest words without a width, and TW12 with all of it.
 * - "a table whose rows give a column different widths", in a table of a share of the width (LW6d to LW6f), and with a row
 *   that starts past the first column (LW7a, LW7b).
 * - "a long word in cells merged across columns", in a table narrowed to the page (LW8a to LW8d): LW2f to LW2i showed the
 *   first column the word is across widened more than the next, by no rule found yet.
 *
 * Each probe is a table between a line above and a line below; the column edges are where Word draws the borders (single,
 * half a point). "W<n>" stands for a word of letters n twips wide in Calibri 11, as docx/layout's width tables measure it,
 * and "S<n>" for a short one. Calibri 11 on A4 with inch margins, the text 9026 wide.
 *
 * LW6a: S1000 | W9000 in a table of 100%; b: S1000 | W5000 in a table of 50%, whose words fit the page but not 50%; c:
 *   S1000 | W9000 in a table of 50%
 * LW6d: rows of cells of 3000 and 6026, and of 4000 and 5026, in a table of 100%; e: the same in 80%; f: rows of cells of
 *   1000, 3000 and 5026, and of 3000, 1000 and 5026, in 90%
 * LW7a: a row of cells of 3000 and 6026, and one that starts past a first column of 4000 (`w:gridBefore` 1, `w:wBefore`
 *   4000) with a cell of 5026, in a table 9026 wide; b: the same, laid out fixed
 * LW8a: W3000 across the first two of three columns, over 30 words of prose | 30 words | S800 (LW2f again); b: W4500
 *   across them; c: W3000 over 30 words | 10 words | S800; d: W3000 across the last two, over S800 | 30 words | 10 words
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-long-words2.ts [folder]
 */
import { Table, TableLayoutType, TableRow, WidthType } from "docx";

import { measureTextWidth } from "../../../src/text-layout/text-width";

import { ALL_BORDERS, type Child, PAGE, TEXT_WIDTH, cell, group, newPage, prose, write } from "./kit";

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

const percent = (size: number) => ({ size, type: WidthType.PERCENTAGE });
const dxa = (size: number) => ({ size, type: WidthType.DXA });

/** A table of rows of cells, each with its width in twips when given, in a table of the width given */
const rowsTable = (rows: readonly (readonly (readonly [string, number?])[])[], width?: object, options: object = {}): Table =>
    new Table({
        borders: ALL_BORDERS,
        ...(width ? { width } : {}),
        ...options,
        rows: rows.map(
            (cells) => new TableRow({ children: cells.map(([text, size]) => cell(text, size === undefined ? {} : { width: dxa(size) })) }),
        ),
    });

const LW6 = [
    rowsTable([[[word("LW6as", 1000)], [word("LW6a", 9000)]]], percent(100)),
    rowsTable([[[word("LW6bs", 1000)], [word("LW6b", 5000)]]], percent(50)),
    rowsTable([[[word("LW6cs", 1000)], [word("LW6c", 9000)]]], percent(50)),
    rowsTable(
        [
            [
                ["LW6d r1 3000", 3000],
                ["LW6d r1 6026", 6026],
            ],
            [
                ["LW6d r2 4000", 4000],
                ["LW6d r2 5026", 5026],
            ],
        ],
        percent(100),
    ),
    rowsTable(
        [
            [
                ["LW6e r1 3000", 3000],
                ["LW6e r1 6026", 6026],
            ],
            [
                ["LW6e r2 4000", 4000],
                ["LW6e r2 5026", 5026],
            ],
        ],
        percent(80),
    ),
    rowsTable(
        [
            [
                ["LW6f r1 1000", 1000],
                ["LW6f r1 3000", 3000],
                ["LW6f r1 5026", 5026],
            ],
            [
                ["LW6f r2 3000", 3000],
                ["LW6f r2 1000", 1000],
                ["LW6f r2 5026", 5026],
            ],
        ],
        percent(90),
    ),
];

const LW7 = [false, true].map((fixed, index) => {
    const probe = `LW7${"ab"[index]}`;
    return rowsTable(
        [
            [
                [`${probe} r1 3000`, 3000],
                [`${probe} r1 6026`, 6026],
            ],
            [[`${probe} r2 5026 @@BEFORE@@`, 5026]],
        ],
        dxa(TEXT_WIDTH),
        { columnWidths: [3000, 1000, 5026], ...(fixed ? { layout: TableLayoutType.FIXED } : {}) },
    );
});

const merged = (probe: string, width: number, below: readonly string[], at: number): Table =>
    new Table({
        borders: ALL_BORDERS,
        rows: [
            new TableRow({
                children: [
                    ...(at === 1 ? [cell(`${probe}t`)] : []),
                    cell(word(probe, width), { columnSpan: 2 }),
                    ...(at === 0 ? [cell(`${probe}u`)] : []),
                ],
            }),
            new TableRow({ children: below.map((text) => cell(text)) }),
        ],
    });
const LW8 = [
    merged("LW8a", 3000, [`LW8ac0 ${prose(30)}`, `LW8ac1 ${prose(30)}`, word("LW8ac2", 800)], 0),
    merged("LW8b", 4500, [`LW8bc0 ${prose(30)}`, `LW8bc1 ${prose(30)}`, word("LW8bc2", 800)], 0),
    merged("LW8c", 3000, [`LW8cc0 ${prose(30)}`, `LW8cc1 ${prose(10)}`, word("LW8cc2", 800)], 0),
    merged("LW8d", 3000, [word("LW8dc0", 800), `LW8dc1 ${prose(30)}`, `LW8dc2 ${prose(10)}`], 1),
];

const name = (prefix: string, index: number): string => `${prefix}${"abcdef"[index]}`;
const children: Child[] = [
    ...LW6.flatMap((one, index) => [...(index === 3 ? [newPage()] : []), ...group(name("LW6", index), [one])]),
    newPage(),
    ...LW7.flatMap((one, index) => group(name("LW7", index), [one])),
    newPage(),
    ...LW8.flatMap((one, index) => [...(index === 2 ? [newPage()] : []), ...group(name("LW8", index), [one])]),
];

await write({
    name: "word-stops-long-words2",
    sections: [{ properties: PAGE, children }],
    injections: [
        // LW7a and LW7b's second rows start past the first column, 4000 wide
        (parts) => {
            let text = parts.get("word/document.xml")!;
            for (let at = text.indexOf(" @@BEFORE@@"); at >= 0; at = text.indexOf(" @@BEFORE@@")) {
                const row = text.lastIndexOf("<w:tr>", at) + "<w:tr>".length;
                text =
                    text.slice(0, row) +
                    '<w:trPr><w:gridBefore w:val="1"/><w:wBefore w:w="4000" w:type="dxa"/></w:trPr>' +
                    text.slice(row).replace(" @@BEFORE@@", "");
            }
            parts.set("word/document.xml", text);
        },
    ],
});
