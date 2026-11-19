/**
 * Probes of two stops docx/layout met in reports laid out from Word templates (#3912):
 *
 * - "a table row across pages whose line's multiple spacing goes below the page": whether a cell's line at 1.15 lines that
 *   fits at the foot of its row's part on the page only without the space its multiple spacing adds below its text goes
 *   on that page, as in the body (`word-mixed-heights.docx` MH1c), or on to the next (SR1 to SR3)
 * - "a text box whose text is taller than it": a text box in the line, of its own height, with more text than fits in it
 *   (OB1)
 *
 * Calibri 11 on A4 with inch margins, so the text is 13958 twips tall; each probe on a page of its own.
 *
 * SR1a to SR1w: below its line above, a paragraph exactly 11299 twips tall, less 5 for each probe after the first, so
 *   the row below it starts 5 twips further up the page each time, then a table of one row and one cell, 9026 wide, with
 *   no borders and no margins above or below, of 10 paragraphs at 1.15 lines (`w:line="276"`, auto), each a line
 * SR2a to SR2w: as SR1, with single borders of half a point all round
 * SR3a to SR3w: as SR1, its cell with a margin of 300 below
 * OB1a: a text box in the line, `width:150pt;height:30pt`, with no insets and no outline, not sized to its text, of 5
 *   lines; OB1b: the same with 1 line; OB1c: as OB1a, with Word's insets and an outline of 0.75 points; OB1d: as OB1c with
 *   1 line. Each box is in a paragraph of its own, after a line of text and before another
 *
 * Opened in Word 16 for Mac on 2026-11-19 and read with `word-split-rows-and-boxes.applescript`, which writes each
 * paragraph's page and how far down it it starts. Word put 7 of SR1's lines on the probe's first page up to SR1q and 8
 * from SR1r, 7 of SR2's up to SR2u and 8 from SR2v, and 6 of SR3's up to SR3o and 7 from SR3p: a line goes on the page
 * only when all of it fits, the space below its text too, as docx/layout now lays out all 69. Letting that space go below
 * the page, as in the body, would put SR1's eighth line on the page from SR1i. The line below OB1a is where it is below
 * OB1b, and below OB1c where it is below OB1d: Word cuts off the text that doesn't fit, and the box is as tall as it says.
 *
 * Usage: npm run run-ts -- scripts/layout-probes/word-split-rows-and-boxes.ts [folder]
 */
import { LineRuleType, Paragraph, Table, TableBorders, TableCell, TableRow, WidthType } from "docx";

import { ALL_BORDERS, type Child, TEXT_WIDTH, line, marker, probe, replaceMarkerRun, write } from "./stops2/kit";

const STEPS = 23;
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/** A table of one row and one cell of 10 lines at 1.15 lines, with the borders and the margin below given */
const splitRow = (name: string, { bordered, marginBottom }: { readonly bordered: boolean; readonly marginBottom: number }): Table =>
    new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH],
        borders: bordered ? ALL_BORDERS : TableBorders.NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: TEXT_WIDTH, type: WidthType.DXA },
                        margins: { top: 0, bottom: marginBottom, left: 108, right: 108 },
                        children: Array.from({ length: 10 }, (_, index) =>
                            line(`${name} line ${index + 1}`, { spacing: { line: 276, lineRule: LineRuleType.AUTO } }),
                        ),
                    }),
                ],
            }),
        ],
    });

const splitRows = (prefix: string, options: { readonly bordered: boolean; readonly marginBottom: number }): Child[] =>
    Array.from({ length: STEPS }, (_, step) => {
        const name = `${prefix}${LETTERS[step]}`;
        return probe(name, [
            line(`${name} spacer`, { spacing: { line: 11299 - 5 * step, lineRule: LineRuleType.EXACT } }),
            splitRow(name, options),
        ]);
    }).flat();

/** A text box in the line, 150 by 30 points, of lines of text, as VML, not sized to its text */
const box = (name: string, count: number, framed: boolean): string => {
    const text = Array.from(
        { length: count },
        (_, index) => `<w:p><w:r><w:t xml:space="preserve">${name} box ${index + 1}</w:t></w:r></w:p>`,
    ).join("");
    const outline = framed ? `strokeweight=".75pt"` : `stroked="f"`;
    const inset = framed ? "" : ` inset="0,0,0,0"`;
    return (
        `<w:r><w:pict><v:shape id="${name}" type="#_x0000_t202" style="width:150pt;height:30pt" ${outline}>` +
        `<v:textbox${inset}><w:txbxContent>${text}</w:txbxContent></v:textbox></v:shape></w:pict></w:r>`
    );
};

const BOXES = [
    ["OB1a", 5, false],
    ["OB1b", 1, false],
    ["OB1c", 5, true],
    ["OB1d", 1, true],
] as const;

// The shape type of a text box, which Word writes once before the first shape of it
const SHAPE_TYPE =
    `<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe">` +
    `<v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype>`;

const children: Child[] = [
    ...splitRows("SR1", { bordered: false, marginBottom: 0 }),
    ...splitRows("SR2", { bordered: true, marginBottom: 0 }),
    ...splitRows("SR3", { bordered: false, marginBottom: 300 }),
    ...BOXES.flatMap(([name]) => probe(name, [new Paragraph({ children: [marker(name)] })])),
];

await write({
    name: "word-split-rows-and-boxes",
    children,
    injections: BOXES.map(([name, count, framed], index) =>
        replaceMarkerRun(
            name,
            index === 0 ? box(name, count, framed).replace("<w:pict>", `<w:pict>${SHAPE_TYPE}`) : box(name, count, framed),
        ),
    ),
});
