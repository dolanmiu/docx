/**
 * Probes of how Word reads a length written with a unit that isn't a whole number of twips or half-points, for
 * docx/layout, after word-units showed it drops the fraction of "240.03pt" but rounds "8.46772cm" to the nearest twip,
 * and draws "11.3pt" at 11 points. Each is measured across the page, where Word's PDFs place text exactly, rather than
 * down it, where they place it on a grid of 4.8 twips. Each line's text names its probe and the length it gives, so the
 * lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-units.py reads. Calibri 11, single
 * spaced, no space before or after, on Letter pages with 1-inch margins unless a probe says otherwise.
 *
 * V1: left indents (`ST_SignedTwipsMeasure`) of about 4800 twips and -240 in each unit, against one of 4800 in twips
 * V2: a page's left margin (`ST_TwipsMeasure`) of 72.7 points and of 1440.6 twips in inches, against 1440
 * V3: runs of 20 letters in sizes (`ST_HpsMeasure`) that aren't whole half-points, against 10.5, 11, 11.5 and 12 points
 * V4: character spacing (`ST_SignedTwipsMeasure`) of 43.4, 50 and 43.92 twips, against 40
 * V5: a table's first column, its grid and its cells' widths, of 72.7 points and 1440.6 twips, against 1440
 * V6: a row at least 36.7 points tall, against 720 twips
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    Document,
    HeightRule,
    type ISectionOptions,
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

const LETTER = { width: 12240, height: 15840 } as const;
const MARGINS = { top: 1440, bottom: 1440, left: 1440, right: 1440 } as const;
const page = (children: readonly (Paragraph | Table)[], left: Length = 1440): ISectionOptions => ({
    properties: { page: { size: LETTER, margin: { ...MARGINS, left } } },
    children,
});

/** The length a probe gives, written as its text, after its name */
const named = (probe: string, length: Length): string => `${probe} ${length}`;

// V1: about 4800.4 and 4800.6 twips in each unit, 240.5, 240.7 and 240.04 points, and -10.7 points and -240.6 twips. Whole
// points give 4800 for each in points; rounding down gives 4800, 4810, 4814 and 4800, and to the nearest twip 4801 for
// 240.04 points and for each 4800.6
const INDENTS: readonly Length[] = [
    "240.5pt",
    "240.7pt",
    "240.04pt",
    "3.33361in",
    "3.33375in",
    "84.6737mm",
    "84.67724mm",
    "8.46737cm",
    "8.46772cm",
    "20.0017pc",
    "20.0025pc",
    "20.0025pi",
    "-10.7pt",
    "-0.16708in",
];

// V3: 10.5 points, then 11.7 and 11.75 (23.4 and 23.5 half-points), 0.4 inches (57.6), "1cm" and "10mm"
// (56.69), and 0.95 picas (22.8)
const SIZES: readonly Length[] = [21, 22, 23, 24, "10.5pt", "11.7pt", "11.75pt", "0.4in", "1cm", "10mm", "0.95pc", "0.95pi"];

// V4: 2.17 points (43.4 twips), 2.5 points (50) and 0.0305 inches (43.92)
const SPACINGS: readonly Length[] = [40, "2.17pt", "2.5pt", "0.0305in"];

/** V5: a table laid out fixed whose first column is this wide, in its grid and its cell, and a second of 2 inches */
const table = (probe: string, first: Length): Table =>
    new Table({
        layout: TableLayoutType.FIXED,
        // As wide as its columns, so their widths aren't scaled to fit it
        width: { size: 0, type: WidthType.AUTO },
        // docx's columnWidths takes only numbers, but writes the universal measure its element allows, as an imported
        // document may have it. Each cell has its width, so docx doesn't size the cells from these
        columnWidths: [first, 2880] as readonly number[],
        rows: [
            new TableRow({
                children: [
                    new TableCell({ width: { size: first, type: WidthType.DXA }, children: [new Paragraph(named(probe, first))] }),
                    new TableCell({ width: { size: 2880, type: WidthType.DXA }, children: [new Paragraph(`${probe} cell B`)] }),
                ],
            }),
        ],
    });

/** V6: a row at least this tall, and a line after the table */
const row = (probe: string, height: Length): (Paragraph | Table)[] => [
    new Table({
        width: { size: 4320, type: WidthType.DXA },
        columnWidths: [4320],
        rows: [
            new TableRow({
                height: { value: height, rule: HeightRule.ATLEAST },
                children: [new TableCell({ width: { size: 4320, type: WidthType.DXA }, children: [new Paragraph(named(probe, height))] })],
            }),
        ],
    }),
    new Paragraph(`${probe} after`),
];

const sections: ISectionOptions[] = [
    page([
        new Paragraph({ indent: { left: 4800 }, children: [new TextRun(named("V1", 4800))] }),
        ...INDENTS.map((left) => new Paragraph({ indent: { left }, children: [new TextRun(named("V1", left))] })),
    ]),
    page([new Paragraph(named("V2", 1440))]),
    page([new Paragraph(named("V2", "72.7pt"))], "72.7pt"),
    page([new Paragraph(named("V2", "1.000417in"))], "1.000417in"),
    page(
        SIZES.map(
            (size) =>
                new Paragraph({
                    children: [new TextRun(`${named("V3", size)} `), new TextRun({ text: "x".repeat(20), size })],
                }),
        ),
    ),
    page(
        SPACINGS.map(
            (spacing) =>
                new Paragraph({
                    // docx's option takes a number, but writes the universal measure its element allows
                    children: [
                        new TextRun(`${named("V4", spacing)} `),
                        new TextRun({ text: "x".repeat(20), characterSpacing: spacing as number }),
                    ],
                }),
        ),
    ),
    page([table("V5", 1440), new Paragraph("V5 gap"), table("V5", "72.7pt"), new Paragraph("V5 gap"), table("V5", "1.000417in")]),
    page([...row("V6", 720), new Paragraph("V6 gap"), ...row("V6", "36.7pt")]),
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
    },
    sections,
});

mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => writeFileSync("build/word-probes/word-units2.docx", buffer));
