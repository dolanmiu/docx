/**
 * Probes of text that runs up or down a table cell, for what `word-stops-vertical-cells.docx` left open:
 *
 * - "text that runs up or down a cell of a table sized to its text, narrowed or fitted to its width": how wide Word makes
 *   the column of such a cell. TV1 showed it about a line of each paragraph, its lines 1.25 times their text's size apart
 *   in Calibri, and about 7 twips more, with borders of half a point; which, in Calibri, is also 1.025 times its line
 *   height. Other fonts, other borders, empty paragraphs, space around paragraphs and line spacing say which. Four of
 *   docx's demos stop here, in Times New Roman 10 with an empty paragraph after the text
 *   (tables/cell-alignment-and-text-direction, tables/table-borders, tables/table-from-data-source).
 * - "text running up or down a table cell with marks of different sizes, or larger than its text": how tall Word makes a
 *   row of only such a cell. VT1 and VT5 showed it as tall as a line of the paragraph's mark, both of Normal's size, and
 *   TV5b a mark of 20 points with text of 11 no taller than 11: whether it is a line of Normal's size, of the smaller of the
 *   mark and the text, or of something else.
 *
 * Each probe is a table between a line above and a line below, several to a page. Calibri 11 on A4 with inch margins. The
 * column widths come from the borders Word draws (single, half a point), or without borders, from where the text of the
 * cell beside starts; the row's height from the line below.
 *
 * VC1a to VC1h: a table given no widths of a cell of "<probe> up" running up and "<probe> beside", in a: Calibri 11
 *   (control, TV1a), b: Times New Roman 10, c: Times New Roman 12, d: Arial 11, e: Cambria 11, f: Courier New 10,
 *   g: Times New Roman 20, h: Calibri 20
 * VC2a to VC2d: VC1a with a: no borders, b: single borders of 3 points, c: double borders of half a point, d: no borders,
 *   and the cells' margins 0
 * VC3a to VC3h: the cell running up of a: "up" and an empty paragraph, in Calibri 11; b: "bottom to top" and an empty
 *   paragraph in Times New Roman 10, as the demos have it; c: two paragraphs, each with 10 points after; d: one with 6
 *   points before; e: line spacing of 1.5 lines; f: exact line spacing of 20 points; g: at least 20 points; h: as b,
 *   running down (tbRl)
 * VC4a, VC4b: VC3b beside a paragraph of 80 words of Times New Roman 10, which narrows the table to the page (a), and in
 *   a table 6000 wide (b), its columns widened to fill it
 * VC5a to VC5h: a row of only a cell running up, of text of a: 20 points and a mark of 20; b: 16 and a mark of 20; c: 8
 *   and a mark of 8; d: an empty paragraph whose mark is 20; e: two paragraphs, of 11 and 20 points, with marks of 11 and
 *   20; f: the same, 20 first; g: Times New Roman 11 and a mark of Times New Roman 11; h: 11 in a paragraph style of 20
 *   points
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-vertical-cells2.ts [folder]
 */
import { BorderStyle, HeadingLevel, HeightRule, LineRuleType, TableRow, TextDirection, WidthType } from "docx";

import {
    ALL_BORDERS,
    type Child,
    PAGE,
    Paragraph,
    Table,
    TableCell,
    TextRun,
    cell,
    group,
    line,
    newPage,
    prose,
    table,
    write,
} from "./kit";

const UP = TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT;
const DOWN = TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT;

const NONE = { style: BorderStyle.NONE, size: 0, color: "auto" };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const borders = (style: (typeof BorderStyle)[keyof typeof BorderStyle], size: number) => {
    const one = { style, size, color: "000000" };
    return { top: one, bottom: one, left: one, right: one, insideHorizontal: one, insideVertical: one };
};

type Run = { readonly font?: string; readonly size?: number };
/** A paragraph of text in a font and size, with a mark of the size given, or the text's */
const text = (words: string, run: Run = {}, mark: Run = run, options: object = {}): Paragraph =>
    new Paragraph({
        ...options,
        run: { ...(mark.font ? { font: mark.font } : {}), ...(mark.size ? { size: mark.size } : {}) },
        children: [new TextRun({ ...run, text: words })],
    });
const empty = (mark: Run = {}): Paragraph =>
    new Paragraph({ run: { ...(mark.font ? { font: mark.font } : {}), ...(mark.size ? { size: mark.size } : {}) }, children: [] });

const up = (children: readonly Child[], direction: (typeof TextDirection)[keyof typeof TextDirection] = UP): TableCell =>
    cell([...children], { textDirection: direction });

const name = (prefix: string, index: number): string => `${prefix}${"abcdefghij"[index]}`;

const VC1: readonly Run[] = [
    { font: "Calibri", size: 22 },
    { font: "Times New Roman", size: 20 },
    { font: "Times New Roman", size: 24 },
    { font: "Arial", size: 22 },
    { font: "Cambria", size: 22 },
    { font: "Courier New", size: 20 },
    { font: "Times New Roman", size: 40 },
    { font: "Calibri", size: 40 },
];

const TNR10 = { font: "Times New Roman", size: 20 };

const VC3 = (probe: string, index: number): readonly Child[] =>
    [
        [text(`${probe} up`), empty()],
        [text(`${probe} bottom to top`, TNR10), empty(TNR10)],
        [text(`${probe} up 1`, {}, {}, { spacing: { after: 200 } }), text(`${probe} up 2`, {}, {}, { spacing: { after: 200 } })],
        [text(`${probe} up`, {}, {}, { spacing: { before: 120 } })],
        [text(`${probe} up`, {}, {}, { spacing: { line: 360, lineRule: LineRuleType.AUTO } })],
        [text(`${probe} up`, {}, {}, { spacing: { line: 400, lineRule: LineRuleType.EXACT } })],
        [text(`${probe} up`, {}, {}, { spacing: { line: 400, lineRule: LineRuleType.AT_LEAST } })],
        [text(`${probe} top to bottom`, TNR10), empty(TNR10)],
    ][index];

const VC5 = (probe: string, index: number): readonly Child[] =>
    [
        [text(`${probe} up`, { size: 40 })],
        [text(`${probe} up`, { size: 32 }, { size: 40 })],
        [text(`${probe} up`, { size: 16 })],
        [empty({ size: 40 })],
        [text(`${probe} up 1`), text(`${probe} up 2`, { size: 40 })],
        [text(`${probe} up 1`, { size: 40 }), text(`${probe} up 2`)],
        [text(`${probe} up`, { font: "Times New Roman", size: 22 })],
        [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `${probe} up`, size: 22 })] })],
    ][index];

const children: Child[] = [
    ...VC1.flatMap((run, index) =>
        group(name("VC1", index), [table([[up([text(`${name("VC1", index)} up`, run)]), `${name("VC1", index)} beside`]])]),
    ),
    newPage(),
    ...group("VC2a", [table([[up([text("VC2a up")]), "VC2a beside"]], { borders: NO_BORDERS })]),
    ...group("VC2b", [table([[up([text("VC2b up")]), "VC2b beside"]], { borders: borders(BorderStyle.SINGLE, 24) })]),
    ...group("VC2c", [table([[up([text("VC2c up")]), "VC2c beside"]], { borders: borders(BorderStyle.DOUBLE, 4) })]),
    ...group("VC2d", [table([[up([text("VC2d up")]), "VC2d beside"]], { borders: NO_BORDERS, margins: { left: 0, right: 0 } })]),
    newPage(),
    ...Array.from({ length: 8 }, (_, index) => {
        const probe = name("VC3", index);
        return group(probe, [table([[up(VC3(probe, index), index === 7 ? DOWN : UP), `${probe} beside`]])]);
    }).flat(),
    newPage(),
    ...group("VC4a", [table([[up(VC3("VC4a", 1)), cell([line(`VC4a ${prose(80)}`, {}, TNR10)])]])]),
    ...group("VC4b", [
        table([[up(VC3("VC4b", 1)), cell([line("VC4b beside", {}, TNR10)])]], { width: { size: 6000, type: WidthType.DXA } }),
    ]),
    newPage(),
    ...Array.from({ length: 8 }, (_, index) => {
        const probe = name("VC5", index);
        return group(probe, [
            new Table({
                borders: ALL_BORDERS,
                rows: [new TableRow({ height: { value: 0, rule: HeightRule.AUTO }, children: [up(VC5(probe, index))] })],
            }),
        ]);
    }).flat(),
];

await write({
    name: "word-stops-vertical-cells2",
    sections: [{ properties: PAGE, children }],
    options: {
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    run: { size: 40 },
                    paragraph: { spacing: { before: 0, after: 0 } },
                },
            ],
        },
    },
});
