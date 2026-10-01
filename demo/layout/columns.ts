// Page numbers worked out by docx/layout for sections in columns: text that fills each column of a page before the next,
// column breaks, a section in columns that starts below the text before it on the same page, and columns evened out
// before a continuous section break, so the next section starts below the longest, with a table whose header row is
// repeated at the top of each column it goes on into. It is one of the documents scripts/compare-layout.sh checks against
// LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import {
    ColumnBreak,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 3) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const chapter = (title: string, parts: number, seed: number): readonly Paragraph[] => [
    heading(HeadingLevel.HEADING_1, title),
    ...Array.from({ length: parts }, (_, part) => [
        heading(HeadingLevel.HEADING_2, `${title}, part ${part + 1}`),
        ...Array.from(
            { length: 2 + ((seed + part) % 3) },
            (_, index) => new Paragraph(text(25 + ((seed * 37 + part * 19 + index * 41) % 110), seed + part + index)),
        ),
    ]).flat(),
];

/** A table of a header row and rows of a day and what was seen, as wide as a column of three */
const log = (entries: number, seed: number): Table =>
    new Table({
        width: { size: 2768, type: WidthType.DXA },
        columnWidths: [700, 2068],
        rows: [
            new TableRow({
                tableHeader: true,
                children: ["Day", "What was seen"].map(
                    (title) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })] }),
                ),
            }),
            ...Array.from(
                { length: entries },
                (_, index) =>
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                            new TableCell({ children: [new Paragraph(text(4 + ((seed * 31 + index * 23) % 14), seed + index))] }),
                        ],
                    }),
            ),
        ],
    });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Cambria", size: 22 }, paragraph: { spacing: { after: 100 } } },
            heading1: { run: { size: 30 }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true } },
            heading2: { run: { size: 24 }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true } },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                heading(HeadingLevel.HEADING_1, "Introduction"),
                new Paragraph(text(60, 1)),
            ],
        },
        {
            // Two columns, from below the introduction
            properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } },
            children: [
                ...chapter("The coast", 4, 1),
                new Paragraph({ children: [new TextRun(text(30, 2)), new ColumnBreak()] }),
                ...chapter("The river", 3, 2),
            ],
        },
        {
            // Three columns, below the two before them evened out
            properties: { type: SectionType.CONTINUOUS, column: { count: 3, space: 360 } },
            children: [...chapter("The lighthouse", 5, 3), ...chapter("The boats", 3, 4), log(24, 4)],
        },
        {
            // One column, below the three before it evened out
            properties: { type: SectionType.CONTINUOUS },
            children: [...chapter("What was found", 3, 5)],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
