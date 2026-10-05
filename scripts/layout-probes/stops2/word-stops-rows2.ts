/**
 * Probes of table rows across pages, for what `word-stops-tables.docx` (RW1 to RW12) and `word-stops-notes.docx` (NT11,
 * NT12) left open:
 *
 * - "a cell merged down table rows whose text goes on across more than two pages": RW4a showed it going on page by page in
 *   the last of its rows, but not beside a row before the last that breaks across three pages (RW13).
 * - "a cell merged down table rows whose text goes on across a page break between them": the page breaking below its first
 *   row, as the next is kept whole (RW14a) or its paragraph kept together (RW14b), with its text going on.
 * - "footnotes in a table row of a set height taller than a page": RW5c had one alone; two (RW15a), and one before lines
 *   with footnotes of their own on the next page, where its footnote goes (RW15b), which docx/layout lays out as RW5c's.
 * - "a cell merged down table rows whose text goes on across a page break between them", as a row set taller than a page
 *   goes on the next page (RW16a); and "a cell merged down into a table row of a set height taller than a page, or out of it
 *   past it": RW5a had one whose text fits in it, out of one with more text than it holds (RW16b).
 * - "a table row whose text and set height are both taller than a page": RW6 had none, with a footnote on its first line
 *   (RW17).
 * - "a header row of a set height taller than a page": RW5b put what came after its table a page further on; with five body
 *   rows after it (RW18).
 * - "a table row kept together taller than a column": RW11 had a row that can't split; one whose paragraph is kept together
 *   (RW19a) and one set exactly taller than a page (RW19b), in 2 columns.
 * - "a cell merged down the rows of a table in a table cell, whose text goes on past its first row, across pages" (RW20).
 *
 * Calibri 11 on A4 with inch margins; each probe on a page of its own between a line above and a line below, after enough
 * lines that it breaks across the page. RW19a and RW19b are in a section of 2 columns at the end.
 *
 * RW13: after 10 lines, two rows: a cell of 110 lines merged down both, beside 120 lines in the first and a line in the
 *   second
 * RW14a: after 40 lines, two rows: a cell of 15 lines merged down both, beside a line in the first and 15 lines in the
 *   second, which can't split; RW14b: the second's 15 lines a paragraph kept together
 * RW15a: a row exactly 16000 tall with two footnotes of 2 lines; RW15b: a row exactly 16000 tall with a footnote of 2
 *   lines, then two lines with a footnote of 2 lines each
 * RW16a: a row of a line, then a row exactly 16000 tall, which goes on the next page, a cell of 3 lines merged down both;
 *   RW16b: a row exactly 16000 tall and a row of a line, a cell of 60 lines merged down both
 * RW17: a row of at least 15000, of 70 lines, the first with a footnote of 2 lines
 * RW18: a header row exactly 16000 tall, then five rows of a line
 * RW19a: 2 columns, after 20 lines, a row whose paragraph of 60 lines is kept together; RW19b: after 20 lines, a row
 *   exactly 16000 tall
 * RW20: after 35 lines, a table in a cell, of 30 rows, a cell of 10 lines merged down its first 3 rows
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-rows2.ts [folder]
 */
import { HeightRule, type ISectionOptions, Paragraph, SectionType, Table, TableRow, TextRun, VerticalMergeType, WidthType } from "docx";

import { ALL_BORDERS, type Child, PAGE, cell, fill, footnote, line, lines, probe, write } from "./kit";

const EXACT = { value: 16000, rule: HeightRule.EXACT };
/** A table across the page, of rows of two cells */
const twoColumns = (rows: readonly TableRow[]): Table =>
    new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: [4513, 4513], borders: ALL_BORDERS, rows: [...rows] });
const oneColumn = (rows: readonly TableRow[], width = 9026): Table =>
    new Table({ width: { size: width, type: WidthType.DXA }, columnWidths: [width], borders: ALL_BORDERS, rows: [...rows] });
/** Rows with a cell merged down them, from the first, of what is given, beside the other cells */
const mergedDown = (
    content: readonly Child[],
    beside: readonly (readonly Child[])[],
    rowOptions: readonly { readonly height?: typeof EXACT; readonly cantSplit?: boolean }[] = [],
): TableRow[] =>
    beside.map(
        (other, row) =>
            new TableRow({
                ...rowOptions[row],
                children: [
                    row === 0
                        ? cell([...content], { verticalMerge: VerticalMergeType.RESTART })
                        : cell("", { verticalMerge: VerticalMergeType.CONTINUE }),
                    cell([...other]),
                ],
            }),
    );
const noted = (text: string, note: string): Paragraph => new Paragraph({ children: [new TextRun(text), footnote(lines(note, 2))] });

const children: Child[] = [
    ...probe("RW13", [
        ...fill("RW13", 10),
        twoColumns(mergedDown([lines("RW13 merged", 110)], [[lines("RW13 row 1", 120)], [line("RW13 row 2")]])),
    ]),
    ...probe("RW14a", [
        ...fill("RW14a", 40),
        twoColumns(mergedDown([lines("RW14a merged", 15)], [[line("RW14a row 1")], [lines("RW14a row 2", 15)]], [{}, { cantSplit: true }])),
    ]),
    ...probe("RW14b", [
        ...fill("RW14b", 40),
        twoColumns(mergedDown([lines("RW14b merged", 15)], [[line("RW14b row 1")], [lines("RW14b row 2", 15, { keepLines: true })]])),
    ]),
    ...probe("RW15a", [
        oneColumn([
            new TableRow({
                height: EXACT,
                children: [cell([noted("RW15a first", "RW15a note one"), noted("RW15a second", "RW15a note two")])],
            }),
        ]),
    ]),
    ...probe("RW15b", [
        oneColumn([new TableRow({ height: EXACT, children: [cell([noted("RW15b row", "RW15b note row")])] })]),
        noted("RW15b after 1", "RW15b note after 1"),
        noted("RW15b after 2", "RW15b note after 2"),
    ]),
    ...probe("RW16a", [
        twoColumns(mergedDown([lines("RW16a merged", 3)], [[line("RW16a row 1")], [line("RW16a row 2")]], [{}, { height: EXACT }])),
    ]),
    ...probe("RW16b", [
        twoColumns(mergedDown([lines("RW16b merged", 60)], [[line("RW16b row 1")], [line("RW16b row 2")]], [{ height: EXACT }])),
    ]),
    ...probe("RW17", [
        oneColumn([
            new TableRow({
                height: { value: 15000, rule: HeightRule.ATLEAST },
                children: [cell([noted("RW17 first", "RW17 note"), lines("RW17 row", 69)])],
            }),
        ]),
    ]),
    ...probe("RW18", [
        oneColumn([
            new TableRow({ tableHeader: true, height: EXACT, children: [cell("RW18 header")] }),
            ...[1, 2, 3, 4, 5].map((row) => new TableRow({ children: [cell(`RW18 body ${row}`)] })),
        ]),
    ]),
    ...probe("RW20", [
        ...fill("RW20", 35),
        oneColumn([
            new TableRow({
                children: [
                    cell([
                        new Table({
                            borders: ALL_BORDERS,
                            rows: Array.from(
                                { length: 30 },
                                (_, row) =>
                                    new TableRow({
                                        children: [
                                            row === 0
                                                ? cell([lines("RW20 merged", 10)], { verticalMerge: VerticalMergeType.RESTART })
                                                : cell("", { verticalMerge: row < 3 ? VerticalMergeType.CONTINUE : undefined }),
                                            cell(`RW20 inner ${row + 1}`),
                                        ],
                                    }),
                            ),
                        }),
                    ]),
                ],
            }),
        ]),
    ]),
];

const sections: ISectionOptions[] = [
    { properties: PAGE, children },
    {
        properties: { ...PAGE, type: SectionType.NEXT_PAGE, column: { count: 2, space: 720 } },
        children: [
            ...probe("RW19a", [
                ...fill("RW19a", 20),
                oneColumn([new TableRow({ children: [cell([lines("RW19a row", 60, { keepLines: true })])] })], 4000),
            ]),
            ...probe("RW19b", [...fill("RW19b", 20), oneColumn([new TableRow({ height: EXACT, children: [cell("RW19b row")] })], 4000)]),
        ],
    },
];

await write({ name: "word-stops-rows2", sections });
