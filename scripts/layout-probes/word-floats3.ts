// Probes of how Word lays out text around floating tables (`w:tblpPr`), where word-floats.ts and word-floats2.ts left
// it open: the room a floating table keeps text out of with borders of each width and none, with its cells' margins and
// indent, and where it goes down the page. Each probe starts a page, its first line names it ("H1 above"), and the
// paragraphs of a probe start with its name too, so word-floats.py can find each probe's page in pdftotext's HTML of a PDF
// saved from Word. Calibri 11, single spaced, no space before or after, on A4 with 1440 margins: 9026 twips of text, lines
// of 268.55 twips. The paragraphs after each table are justified, so each of their lines but the last ends where the room
// beside the table does. Each table is 3000 twips wide, of 6 rows of a line, unless the probe says otherwise. Lengths are
// in twips.
//
// The room beside a table at the left of the margins, 200 from the text right of it:
// H1:  without borders. word-floats2.docx's G25 put the text 3215 across, where one with 1-point borders put it 3220
// H2:  with borders of half a point, as docx writes a table's unless told otherwise
// H3:  with borders of 1 point, as word-floats.docx's F25 had
// H4:  with borders of 3 points
// H5:  with borders of 3 points left and right only
// H6:  with borders of 1 point, and cells' margins of 0 left and right
// H7:  with borders of 1 point, indented 500 (`w:tblInd`)
// H8:  without borders, at the right of the margins, 200 from the text left of it
// Down the page:
// H9:  200 after the paragraph before it and 300 before the paragraph after it, placed against the text (tblpY 0)
// H10: placed 2000 below the top margin
// H11: centred down the margins (tblpYSpec center)
// H12: centred across the page (tblpXSpec center), placed against the page
// H13: a table taller than the paragraph after it, then a second paragraph, which goes round it too
// H14: two tables that may not overlap (`w:tblOverlap` never), the second placed over the first
// H15: in 2 columns, at the right of the column (horzAnchor text)
//
// What Word showed, in word-floats3.pdf, saved from Word 16 for Mac on 2026-10-03 and read with word-floats.py:
//
// - H1 to H5: the room a table keeps the text out of is as wide as its rows with the halves of its borders left and right:
//   3010, 3020 and 3060 for borders of half a point, 1 point and 3 points all round, and 3060 for 3 points left and right
//   only. Without borders it is 3015, as G25's was
// - H6, H7: its cells' margins and its indent don't change where it is or its room
// - H8: without borders, at the right of the margins, its room is 3015 wide too, from 6011, and its cells' text 108 in
// - H9: it is below the space after the paragraph before, and the paragraph after it has all its space before below that,
//   as after a table: its first line is 500 below the paragraph before, where between the two paragraphs it would be 300
// - H10 to H12: placed 2000 below the top margin, centred down the margins, and centred across the page, as a drawing is
// - H13: the paragraph after the paragraph after one taller than it goes round it too
// - H14: of two that may not overlap, Word moves the second right of the first, to 10 past the first's distance from the
//   text, which the layout doesn't follow
// - H15: in 2 columns, placed against the column, at its right
//
// Usage: npm run run-ts -- scripts/layout-probes/word-floats3.ts, which writes build/word-probes/word-floats3.docx
// cspell:ignore tblp
import * as fs from "fs";

import {
    AlignmentType,
    BorderStyle,
    Document,
    type ISectionOptions,
    OverlapType,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    RelativeVerticalPosition,
    Table,
    TableAnchorType,
    TableBorders,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Float = NonNullable<ConstructorParameters<typeof Table>[0]["float"]>;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const prose = (count: number): string => Array.from({ length: count }, (_, i) => WORDS[(i * 7) % WORDS.length]).join(" ");

/** A justified paragraph of prose, starting with its probe's name */
const paragraph = (name: string, words: number, options: Options = {}): Paragraph =>
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, ...options, children: [new TextRun(`${name} ${prose(words)}`)] });

/** A probe: its line at the top of its page, then what is given */
const probe = (
    name: string,
    children: readonly (Paragraph | Table)[],
    properties: ISectionOptions["properties"] = {},
): ISectionOptions => ({
    properties,
    children: [line(`${name} above`), ...children],
});

const border = (
    size: number,
): { readonly style: (typeof BorderStyle)[keyof typeof BorderStyle]; readonly size: number; readonly color: string } => ({
    style: BorderStyle.SINGLE,
    size,
    color: "000000",
});
/** Borders of a width, in eighths of a point, on every side and between the cells */
const borders = (size: number): ConstructorParameters<typeof Table>[0]["borders"] => ({
    top: border(size),
    bottom: border(size),
    left: border(size),
    right: border(size),
    insideHorizontal: border(size),
    insideVertical: border(size),
});

type TableOptions = {
    readonly float: Float;
    readonly borders?: ConstructorParameters<typeof Table>[0]["borders"];
    readonly margins?: { readonly left: number; readonly right: number };
    readonly indent?: number;
    readonly rows?: number;
};

/** A table 3000 wide, floating as given, of rows of a line each naming its probe */
const table = (name: string, { float, borders: given = borders(8), margins, indent, rows = 6 }: TableOptions): Table =>
    new Table({
        width: { size: 3000, type: WidthType.DXA },
        columnWidths: [3000],
        borders: given,
        float,
        ...(margins ? { margins: { left: margins.left, right: margins.right } } : {}),
        ...(indent === undefined ? {} : { indent: { size: indent, type: WidthType.DXA } }),
        rows: Array.from(
            { length: rows },
            (_, i) =>
                new TableRow({
                    children: [new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [line(`${name} cell ${i + 1}`)] })],
                }),
        ),
    });

/** At the left or right of the margins, at the top of the paragraph after it, 200 from the text beside and below it */
const beside = (side: "left" | "right"): Float => ({
    horizontalAnchor: TableAnchorType.MARGIN,
    relativeHorizontalPosition: side === "left" ? RelativeHorizontalPosition.LEFT : RelativeHorizontalPosition.RIGHT,
    verticalAnchor: TableAnchorType.TEXT,
    absoluteVerticalPosition: 0,
    ...(side === "left" ? { rightFromText: 200 } : { leftFromText: 200 }),
    bottomFromText: 200,
});

const sections: ISectionOptions[] = [
    probe("H1", [table("H1", { float: beside("left"), borders: TableBorders.NONE }), paragraph("H1", 260)]),
    probe("H2", [table("H2", { float: beside("left"), borders: borders(4) }), paragraph("H2", 260)]),
    probe("H3", [table("H3", { float: beside("left") }), paragraph("H3", 260)]),
    probe("H4", [table("H4", { float: beside("left"), borders: borders(24) }), paragraph("H4", 260)]),
    probe("H5", [
        table("H5", {
            float: beside("left"),
            borders: { ...TableBorders.NONE, left: border(24), right: border(24) },
        }),
        paragraph("H5", 260),
    ]),
    probe("H6", [table("H6", { float: beside("left"), margins: { left: 0, right: 0 } }), paragraph("H6", 260)]),
    probe("H7", [table("H7", { float: beside("left"), indent: 500 }), paragraph("H7", 260)]),
    probe("H8", [table("H8", { float: beside("right"), borders: TableBorders.NONE }), paragraph("H8", 260)]),
    probe("H9", [
        line("H9 before", { spacing: { after: 200 } }),
        table("H9", { float: beside("left") }),
        paragraph("H9", 260, { spacing: { before: 300 } }),
    ]),
    probe("H10", [
        table("H10", { float: { ...beside("left"), verticalAnchor: TableAnchorType.MARGIN, absoluteVerticalPosition: 2000 } }),
        paragraph("H10", 400),
    ]),
    probe("H11", [
        table("H11", {
            float: { ...beside("left"), verticalAnchor: TableAnchorType.MARGIN, relativeVerticalPosition: RelativeVerticalPosition.CENTER },
        }),
        paragraph("H11", 700),
    ]),
    probe("H12", [
        table("H12", {
            float: {
                horizontalAnchor: TableAnchorType.PAGE,
                relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
                verticalAnchor: TableAnchorType.TEXT,
                absoluteVerticalPosition: 0,
                leftFromText: 200,
                rightFromText: 200,
                bottomFromText: 200,
            },
        }),
        paragraph("H12", 260),
    ]),
    probe("H13", [table("H13", { float: beside("left"), rows: 12 }), paragraph("H13", 40), paragraph("H13 second", 200)]),
    probe("H14", [
        table("H14a", { float: { ...beside("left"), overlap: OverlapType.NEVER } }),
        table("H14b", { float: { ...beside("left"), overlap: OverlapType.NEVER, absoluteVerticalPosition: 500 } }),
        paragraph("H14", 260),
    ]),
    probe(
        "H15",
        [
            table("H15", {
                float: {
                    ...beside("right"),
                    horizontalAnchor: TableAnchorType.TEXT,
                    relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
                },
            }),
            paragraph("H15", 300),
        ],
        { column: { count: 2, space: 720 } },
    ),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-floats3.docx", buffer));
