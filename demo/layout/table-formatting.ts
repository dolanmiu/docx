// Page numbers worked out by docx/layout for tables whose formatting changes where their rows go: rows kept with the next
// row, borders of cells, and text that runs up a cell. The rows are kept on one page, or are short, as LibreOffice breaks
// rows without Word's widow control. It is one of the documents scripts/compare-layout.sh checks against LibreOffice. See
// docs/usage/layout.md.

import * as fs from "fs";
import {
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextDirection,
    TextRun,
    WidthType,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "each sample was taken from the shore at low tide and its place and depth were written down in the log".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 7) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const THICK = { style: BorderStyle.SINGLE, size: 24, color: "000000" };

// Each sample is a row of its name, kept with the next row, which says what was found, so the two go on the same page
const kept = (samples: number, seed: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        rows: Array.from({ length: samples }, (_, index) => [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                keepNext: true,
                                children: [new TextRun({ text: `Sample ${seed + 1}.${index + 1}`, bold: true })],
                            }),
                        ],
                    }),
                ],
            }),
            new TableRow({
                cantSplit: true,
                children: [new TableCell({ children: [new Paragraph(text(15 + ((seed * 31 + index * 17) % 60), seed + index))] })],
            }),
        ]).flat(),
    });

// Rows with thick borders above and below each cell, which make every row taller
const bordered = (rows: number, seed: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2400, 6626],
        rows: Array.from(
            { length: rows },
            (_, index) =>
                new TableRow({
                    cantSplit: true,
                    children: [`${seed + 1}.${index + 1}`, text(10 + ((seed * 13 + index * 23) % 40), seed * 3 + index)].map(
                        (words) => new TableCell({ borders: { top: THICK, bottom: THICK }, children: [new Paragraph(words)] }),
                    ),
                }),
        ),
    });

// Rows with the sample's place running up a narrow cell beside what was found, which makes them no taller
const upward = (rows: number, seed: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [900, 8126],
        rows: Array.from(
            { length: rows },
            (_, index) =>
                new TableRow({
                    children: [
                        new TableCell({
                            textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                            children: [new Paragraph(`Shore ${seed + index + 1}`)],
                        }),
                        new TableCell({ children: [new Paragraph(text(8 + ((seed * 19 + index * 41) % 20), seed + index * 2))] }),
                    ],
                }),
        ),
    });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 120 } } },
            heading1: { run: { size: 32 }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true } },
            heading2: { run: { size: 26 }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true } },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                ...Array.from({ length: 6 }, (_, survey) => [
                    heading(HeadingLevel.HEADING_1, `Survey ${survey + 1}`),
                    new Paragraph(text(30 + ((survey * 41) % 90), survey)),
                    heading(HeadingLevel.HEADING_2, `Samples of survey ${survey + 1}`),
                    kept(4 + ((survey * 5) % 5), survey),
                    heading(HeadingLevel.HEADING_2, `Measures of survey ${survey + 1}`),
                    bordered(5 + ((survey * 3) % 7), survey),
                    heading(HeadingLevel.HEADING_2, `Places of survey ${survey + 1}`),
                    upward(3 + ((survey * 7) % 4), survey),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
