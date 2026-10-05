/**
 * Probes of text that runs up or down a table cell (`w:textDirection` on a cell), where docx/layout stops:
 *
 * - "text that runs up or down a cell of a table sized to its text" (column-widths.ts): how wide Word makes the column of
 *   such a cell in a table given no widths. `word-table-formats.docx` VT3 sized one to about a line (283 twips), which no
 *   rule explained. Five of the docx demos stop here (tables/cell-alignment-and-text-direction, tables/table-borders,
 *   tables/table-from-data-source, and the templates patch-document and custom-placeholder-delimiters).
 * - "a long word in text that runs up or down a table cell", "text that runs up or down a table cell across pages",
 *   "a footnote in text that runs up or down a table cell", "text running up or down a table cell with marks of different
 *   sizes, a picture or a table", "text in a table cell in a direction not yet followed".
 *
 * Each probe is on a page of its own, between a line above and a line below it. Calibri 11 on A4 with inch margins. The
 * column widths come from the borders Word draws (single, half a point), and the row's height from the line below.
 *
 * TV1a to TV1l: a table given no widths, of a cell with text running up (btLr) or down (tbRl), and a cell beside it:
 *   a: "TV1a up", one short line up, beside "TV1a beside" (control: VT3's case)
 *   b: as a, down (tbRl)
 *   c: up, two paragraphs of one short line
 *   d: up, text of 20 points; e: up, text of 8 points
 *   f: up, a paragraph of 40 words, beside a cell of 3 lines
 *   g: up, a short line, beside a cell of 60 words, which the table's width holds to the page
 *   h: three cells, the middle one up
 *   i: up, with left and right cell margins of 300
 *   j: up, in a row of an exact height of 1500
 *   k: up, beside a cell with a width of its own of 3000 (the table still given no width)
 *   l: up, its cell's own width 1200 in a table given no width
 * TV2a, TV2b: a table whose cells have widths (600 and 8426), the narrow cell up, with a word of 30 letters, and of
 *   80 letters
 * TV3a, TV3b: a row that breaks across pages: 60 lines in the cell beside one running up (a) and down (b), after 40
 *   lines on the page
 * TV4: a footnote reference in text running up a cell
 * TV5a to TV5d: a cell running up with two paragraphs of 11 and 20 points (a), a mark of 20 and text of 11 (b), a
 *   picture of 40 points (c), and a table of one cell in it (d)
 * TV6a to TV6c: the other directions Word writes, tbRlV, lrTbV and tbLrV, with "TV6a 縦書き abc" in each
 *
 * Usage: npm run run-ts -- scripts/layout-probes/stops2/word-stops-vertical-cells.ts [folder]
 */
import { HeightRule, TableRow, TextDirection, WidthType } from "docx";

import {
    type Child,
    PAGE,
    Paragraph,
    Table,
    TableCell,
    TextRun,
    cell,
    fill,
    footnote,
    line,
    marker,
    picture,
    probe,
    prose,
    replaceMarkerRun,
    table,
    withProperty,
    write,
} from "./kit";

const UP = TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT;
const DOWN = TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT;

const vertical = (
    content: string | readonly Child[],
    direction: (typeof TextDirection)[keyof typeof TextDirection] = UP,
    options = {},
): TableCell => cell(content, { textDirection: direction, ...options });

const TV1: readonly (readonly [string, readonly (string | TableCell)[], object?])[] = [
    ["TV1a", [vertical("TV1a up"), "TV1a beside"]],
    ["TV1b", [vertical("TV1b down", DOWN), "TV1b beside"]],
    ["TV1c", [vertical("TV1c up 1\nTV1c up 2"), "TV1c beside"]],
    ["TV1d", [vertical([line("TV1d up", {}, { size: 40 })]), "TV1d beside"]],
    ["TV1e", [vertical([line("TV1e up", {}, { size: 16 })]), "TV1e beside"]],
    ["TV1f", [vertical(`TV1f ${prose(40)}`), "TV1f beside 1\nTV1f beside 2\nTV1f beside 3"]],
    ["TV1g", [vertical("TV1g up"), `TV1g ${prose(60)}`]],
    ["TV1h", ["TV1h left", vertical("TV1h up"), "TV1h right"]],
    ["TV1i", [vertical("TV1i up", UP, { margins: { left: 300, right: 300 } }), "TV1i beside"]],
    ["TV1k", [vertical("TV1k up"), cell("TV1k beside", { width: { size: 3000, type: WidthType.DXA } })]],
    ["TV1l", [vertical("TV1l up", UP, { width: { size: 1200, type: WidthType.DXA } }), "TV1l beside"]],
];

const children: Child[] = [
    ...TV1.flatMap(([name, cells]) => probe(name, [table([cells])])),
    ...probe("TV1j", [
        new Table({
            rows: [
                new TableRow({
                    height: { value: 1500, rule: HeightRule.EXACT },
                    children: [vertical("TV1j up"), cell("TV1j beside")],
                }),
            ],
        }),
    ]),
    ...[30, 80].flatMap((letters, index) =>
        probe(`TV2${"ab"[index]}`, [
            new Table({
                columnWidths: [600, 8426],
                width: { size: 9026, type: WidthType.DXA },
                rows: [
                    new TableRow({
                        children: [
                            vertical(`TV2${"ab"[index]} ${"abcdefghij".repeat(letters / 10)}`, UP, {
                                width: { size: 600, type: WidthType.DXA },
                            }),
                            cell(`TV2${"ab"[index]} beside`, { width: { size: 8426, type: WidthType.DXA } }),
                        ],
                    }),
                ],
            }),
        ]),
    ),
    ...[UP, DOWN].flatMap((direction, index) => {
        const name = `TV3${"ab"[index]}`;
        return probe(name, [
            ...fill(name, 40),
            table([[vertical(`${name} ${direction === UP ? "up" : "down"}`, direction), cell(fill(`${name} cell`, 60))]]),
        ]);
    }),
    ...probe("TV4", [
        table([[vertical([new Paragraph({ children: [new TextRun("TV4 up"), footnote(line("TV4 note"))] })]), "TV4 beside"]]),
    ]),
    ...probe("TV5a", [table([[vertical([line("TV5a up 11"), line("TV5a up 20", {}, { size: 40 })]), "TV5a beside"]])]),
    ...probe("TV5b", [
        table([[vertical([new Paragraph({ run: { size: 40 }, children: [new TextRun({ text: "TV5b up", size: 22 })] })]), "TV5b beside"]]),
    ]),
    ...probe("TV5c", [table([[vertical([new Paragraph({ children: [new TextRun("TV5c up "), picture(40)] })]), "TV5c beside"]])]),
    ...probe("TV5d", [table([[vertical([table([["TV5d inner"]]), line("TV5d up")]), "TV5d beside"]])]),
    ...["tbRlV", "lrTbV", "tbLrV"].flatMap((direction, index) => {
        const name = `TV6${"abc"[index]}`;
        return probe(name, [
            table([
                [cell([new Paragraph({ children: [marker(`DIR_${direction}`), new TextRun(`${name} 縦書き abc`)] })]), `${name} beside`],
            ]),
        ]);
    }),
];

// The directions docx doesn't write: the cell's direction goes into its properties
const directionInjections = ["tbRlV", "lrTbV", "tbLrV"].map((direction) => (parts: Map<string, string>) => {
    const text = parts.get("word/document.xml")!;
    const at = text.indexOf(`@@DIR_${direction}@@`);
    const cellStart = text.lastIndexOf("<w:tc>", at);
    const withDirection = withProperty(
        text,
        "w:tcPr",
        `<w:textDirection w:val="${direction}"/>`,
        cellStart + "<w:tc>".length,
        text.indexOf("<w:p", cellStart),
    );
    parts.set("word/document.xml", withDirection);
    replaceMarkerRun(`DIR_${direction}`, "")(parts);
});

await write({ name: "word-stops-vertical-cells", sections: [{ properties: PAGE, children }], injections: directionInjections });
