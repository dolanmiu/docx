/**
 * Probes of lengths written with units, as OOXML's universal measure ("1in", "2.5cm", "12pt"), which docx writes for a
 * length given as a string, for docx/layout. Each probe starts a page, and each line's text names its probe, so the lines
 * can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-units.py reads. Calibri 11, single
 * spaced, no space before or after, on Letter pages with 1-inch margins unless a probe says otherwise.
 *
 * U1 to U6: lengths in whole units, each beside the same length in numbers where it can be: a page's size and margins,
 * a run's size, a paragraph's indents, character spacing, a table's widths and row height, and the space between columns
 * U7: a bottom margin of a fraction of a twip, which leaves room for 40 lines of 12 points or 39, as Word rounds it
 * U8: a run's size of a fraction of a half-point, whose lines are as tall as that size or as Word rounds it
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    AlignmentType,
    Document,
    Header,
    HeightRule,
    type ISectionOptions,
    LineRuleType,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Length = number | `${number}${"mm" | "cm" | "in" | "pt" | "pc" | "pi"}`;
type Run = ConstructorParameters<typeof TextRun>[0] & object;

const LETTER = { width: 12240, height: 15840 } as const;
const MARGINS = { top: 1440, bottom: 1440, left: 1440, right: 1440 } as const;

// More lines than fit on a page of the smallest of them
const FILL = 80;
const fill = (probe: string, run: Run = {}, options: ConstructorParameters<typeof Paragraph>[0] & object = {}): Paragraph[] =>
    Array.from({ length: FILL }, (_, i) => new Paragraph({ ...options, children: [new TextRun({ ...run, text: `${probe} ${i + 1}` })] }));

const LONG = "of the river and the coast and the mouth of the river where the boat was made on the sand";

/** U5: a table laid out fixed, 3 inches wide in columns of 1 and 2 inches, of one row at least half an inch tall */
const table = (probe: string, length: (twips: number, measure: Length) => Length): Table =>
    new Table({
        layout: TableLayoutType.FIXED,
        width: { size: length(4320, "3in"), type: WidthType.DXA },
        // docx's columnWidths takes only numbers, but writes the universal measure its element allows, as an imported
        // document may have it. Each cell has its width, so docx doesn't size the cells from these
        columnWidths: [length(1440, "1in"), length(2880, "2in")] as readonly number[],
        rows: [
            new TableRow({
                height: { value: length(720, "0.5in"), rule: HeightRule.ATLEAST },
                children: [
                    new TableCell({
                        width: { size: length(1440, "1in"), type: WidthType.DXA },
                        children: [new Paragraph(`${probe} cell A`)],
                    }),
                    new TableCell({
                        width: { size: length(2880, "2in"), type: WidthType.DXA },
                        children: [new Paragraph(`${probe} cell B`)],
                    }),
                ],
            }),
        ],
    });

const inNumbers = (twips: number): Length => twips;
const withUnits = (_: number, measure: Length): Length => measure;

/** U7: Letter pages with 1-inch margins but at the bottom, with lines of exactly 12 points */
const bottomMargin = (probe: string, bottom: Length): ISectionOptions => ({
    properties: { page: { size: LETTER, margin: { ...MARGINS, bottom } } },
    children: fill(probe, {}, { spacing: { line: 240, lineRule: LineRuleType.EXACT } }),
});

const sections: ISectionOptions[] = [
    // U1: a page 8.5 by 11 inches, with margins of 1 inch at the top and bottom, 1.5 inches on the left and 1 on the right,
    // and the header half an inch down: 48 lines of Calibri 11, from 2160 twips across to 10800
    {
        properties: {
            page: {
                size: { width: "8.5in", height: "11in" },
                margin: { top: "1in", bottom: "1in", left: "1.5in", right: "1in", header: "0.5in", footer: "0.5in" },
            },
        },
        headers: { default: new Header({ children: [new Paragraph("U1 header")] }) },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("U1 right")] }), ...fill("U1")],
    },

    // U2: a run of 12 points, given as "12pt" (a) and as 24 half-points (b)
    { properties: { page: { size: LETTER, margin: MARGINS } }, children: fill("U2a", { size: "12pt" }) },
    { properties: { page: { size: LETTER, margin: MARGINS } }, children: fill("U2b", { size: 24 }) },

    // U3: a paragraph indented 1 inch on the left with a hanging indent of a quarter of an inch, and one right-aligned and
    // indented half an inch on the right, given in units (a) and in twips (b)
    {
        properties: { page: { size: LETTER, margin: MARGINS } },
        children: (
            [
                ["U3a", withUnits],
                ["U3b", inNumbers],
            ] as const
        ).flatMap(([probe, length]) => [
            new Paragraph({
                indent: { left: length(1440, "1in"), hanging: length(360, "0.25in") },
                children: [new TextRun(`${probe} hanging ${LONG}`)],
            }),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                indent: { right: length(720, "0.5in") },
                children: [new TextRun(`${probe} right`)],
            }),
            new Paragraph({ indent: { firstLine: length(720, "36pt") }, children: [new TextRun(`${probe} first line`)] }),
        ]),
    },

    // U4: 20 letters spaced 2 points apart, given as "2pt" (a) and as 40 twips (b)
    {
        properties: { page: { size: LETTER, margin: MARGINS } },
        children: (
            [
                ["U4a", "2pt"],
                ["U4b", 40],
            ] as const
        ).map(
            ([probe, characterSpacing]) =>
                new Paragraph({
                    // docx's option takes a number, but writes the universal measure its element allows, as an imported
                    // document may have it
                    children: [
                        new TextRun(`${probe} `),
                        new TextRun({ text: "x".repeat(20), characterSpacing: characterSpacing as number }),
                        new TextRun(" end"),
                    ],
                }),
        ),
    },

    // U5: the table in units (a) and in twips (b), each followed by a line
    {
        properties: { page: { size: LETTER, margin: MARGINS } },
        children: [table("U5a", withUnits), new Paragraph("U5a after"), table("U5b", inNumbers), new Paragraph("U5b after")],
    },

    // U6: 2 columns an inch apart, each 2.75 inches wide
    {
        properties: { page: { size: LETTER, margin: MARGINS }, column: { count: 2, space: "1in" } },
        children: fill("U6").concat(fill("U6 more")),
    },

    // U7: the bottom margin at 4800 twips (a) and 4801 (b), which leave 9600 and 9599 twips for lines of 240: 40 lines, and
    // 39. Then 4800.4 twips, as "240.02pt" (c) and "8.46737cm" (e), and 4800.6, as "240.03pt" (d) and "8.46772cm" (f): 39
    // lines each when the margin is exact, 40 at c and e and 39 at d and f when Word rounds it to a twip, and 40 at each
    // when it rounds it down
    bottomMargin("U7a", 4800),
    bottomMargin("U7b", 4801),
    bottomMargin("U7c", "240.02pt"),
    bottomMargin("U7d", "240.03pt"),
    bottomMargin("U7e", "8.46737cm"),
    bottomMargin("U7f", "8.46772cm"),

    // U8: runs of 11.2, 11.25 and 11.3 points, 22.4, 22.5 and 22.6 half-points, then 11 and 11.5 points to compare. Calibri's
    // lines are 24.414 twips a point: 268.55 at 11, 273.43 at 11.2, 274.66 at 11.25, 275.88 at 11.3 and 280.76 at 11.5
    ...(
        [
            ["U8a", "11.2pt"],
            ["U8b", "11.25pt"],
            ["U8c", "11.3pt"],
            ["U8d", 22],
            ["U8e", 23],
        ] as const
    ).map(([probe, size]): ISectionOptions => ({
        properties: { page: { size: LETTER, margin: MARGINS } },
        children: fill(probe, { size }),
    })),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-units.docx", buffer));
