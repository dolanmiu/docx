// Page numbers worked out by docx/layout for tables with cells merged down rows, whose text breaks across pages with the
// row of them that crosses the page, as Word breaks it (word-probes.docx U4a and U4b in scripts/layout-probes). It is one
// of the documents scripts/compare-layout.sh checks against LibreOffice, which breaks them the same way. Each entry
// beside a merged cell is a line, and the merged cells' text keeps more than one line on each page, as LibreOffice
// doesn't keep to widow control in table cells, where Word does. See docs/usage/layout.md.

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    VerticalMergeType,
    WidthType,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "each entry of the log says what was found on the survey where it was found and what should be done about it".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 11) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const cell = (words: string): TableCell => new TableCell({ children: [new Paragraph(words)] });

/**
 * A log of a survey's areas: each area's notes in a cell merged down the rows of its entries, which they are longer
 * than, so the last of its rows is taller to make room for them
 */
const log = (areas: readonly { readonly notes: number; readonly entries: number }[], survey: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2600, 1000, 5426],
        rows: [
            new TableRow({
                tableHeader: true,
                children: ["Area", "Entry", "Found"].map(
                    (title) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })] }),
                ),
            }),
            ...areas.flatMap(({ notes, entries }, area) =>
                Array.from(
                    { length: entries },
                    (_, entry) =>
                        new TableRow({
                            children: [
                                entry === 0
                                    ? new TableCell({
                                          verticalMerge: VerticalMergeType.RESTART,
                                          children: [new Paragraph(text(notes, survey + area))],
                                      })
                                    : new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph("")] }),
                                cell(`${survey + 1}.${area + 1}.${entry + 1}`),
                                cell(text(4 + ((survey + area + entry) % 5), survey * 3 + area + entry)),
                            ],
                        }),
                ),
            ),
        ],
    });

const SURVEYS = [
    {
        intro: 70,
        areas: [
            { notes: 60, entries: 2 },
            { notes: 90, entries: 3 },
            { notes: 40, entries: 2 },
        ],
    },
    {
        intro: 120,
        areas: [
            { notes: 110, entries: 2 },
            { notes: 50, entries: 4 },
        ],
    },
    {
        intro: 40,
        areas: [
            { notes: 80, entries: 3 },
            { notes: 130, entries: 2 },
            { notes: 60, entries: 2 },
        ],
    },
    {
        intro: 95,
        areas: [
            { notes: 70, entries: 2 },
            { notes: 100, entries: 3 },
        ],
    },
    {
        intro: 60,
        areas: [
            { notes: 140, entries: 2 },
            { notes: 45, entries: 2 },
            { notes: 85, entries: 3 },
        ],
    },
    {
        intro: 110,
        areas: [
            { notes: 75, entries: 3 },
            { notes: 120, entries: 2 },
        ],
    },
];

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
                ...SURVEYS.map(({ intro, areas }, survey) => [
                    heading(HeadingLevel.HEADING_1, `Survey ${survey + 1}`),
                    new Paragraph(text(intro, survey)),
                    log(areas, survey),
                    heading(HeadingLevel.HEADING_2, `After survey ${survey + 1}`),
                    new Paragraph(text(30 + ((survey * 23) % 60), survey + 5)),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
