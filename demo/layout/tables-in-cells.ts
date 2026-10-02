// Page numbers worked out by docx/layout for tables with tables in their cells, which break across pages between their
// rows, as Word breaks them (word-probes.docx U4c in scripts/layout-probes). It is one of the documents
// scripts/compare-layout.sh checks against LibreOffice, which breaks them the same way. Each row of a table in a cell is a
// line, and the cell beside it is a line, as LibreOffice doesn't keep to widow control in table cells, where Word does.
// The tables in cells have no borders, as LibreOffice breaks those with borders where Word doesn't, and draws no top
// border above the rest of them on the next page (word-nested-tables.docx N1b, N1c). They have a line after them, as
// LibreOffice gives the empty paragraph docx writes after a table that ends a cell no room. See docs/usage/layout.md.

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "each entry of the log says what was found on the survey where it was found and what should be done about it".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 11) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const line = (words: string): Paragraph => new Paragraph({ spacing: { after: 0 }, children: [new TextRun(words)] });

/** The entries of an area, a table of a row for each, without borders, in its cell of the log */
const entries = (count: number, area: string, seed: number): Table =>
    new Table({
        width: { size: 6800, type: WidthType.DXA },
        columnWidths: [800, 6000],
        borders: TableBorders.NONE,
        rows: Array.from(
            { length: count },
            (_, entry) =>
                new TableRow({
                    children: [
                        new TableCell({ children: [line(`${area}.${entry + 1}`)] }),
                        new TableCell({ children: [line(text(3 + ((seed + entry) % 5), seed + entry))] }),
                    ],
                }),
        ),
    });

/** A log of a survey's areas: each area's name, and a table of its entries beside it */
const log = (areas: readonly number[], survey: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
            new TableRow({
                tableHeader: true,
                children: ["Area", "Entries"].map(
                    (title) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })] }),
                ),
            }),
            ...areas.map(
                (count, area) =>
                    new TableRow({
                        children: [
                            new TableCell({ children: [line(`Area ${survey + 1}.${area + 1}`)] }),
                            new TableCell({
                                children: [entries(count, `${survey + 1}.${area + 1}`, survey * 7 + area), line(`${count} entries`)],
                            }),
                        ],
                    }),
            ),
        ],
    });

const SURVEYS = [
    { intro: 70, areas: [8, 30, 5] },
    { intro: 120, areas: [24, 12] },
    { intro: 40, areas: [6, 40, 9] },
    { intro: 95, areas: [18, 22] },
    { intro: 60, areas: [35, 4, 14] },
    { intro: 110, areas: [27, 16] },
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
