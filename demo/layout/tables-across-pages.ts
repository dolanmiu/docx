// Page numbers worked out by docx/layout for tables whose rows break across pages, rows kept whole on one page, and rows
// of a set height. It is one of the documents scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    HeightRule,
    Packer,
    Paragraph,
    Table,
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

const cell = (...paragraphs: readonly string[]): TableCell => new TableCell({ children: paragraphs.map((words) => new Paragraph(words)) });

const log = (entries: number, seed: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1400, 5226, 2400],
        rows: [
            new TableRow({
                tableHeader: true,
                children: ["Entry", "Found", "To do"].map(
                    (title) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })] }),
                ),
            }),
            ...Array.from({ length: entries }, (_, index) => {
                const kind = (seed + index) % 5;
                const found = text(20 + ((seed * 37 + index * 53) % 160), seed + index);
                const todo = text(8 + ((seed * 13 + index * 29) % 50), seed * 2 + index);
                return new TableRow({
                    // Some rows are kept on one page, and some are set to a height taller than their text
                    cantSplit: kind === 1,
                    ...(kind === 3 ? { height: { value: 1400 + ((seed * 97 + index * 61) % 1600), rule: HeightRule.ATLEAST } } : {}),
                    children: [
                        cell(`${seed + 1}.${index + 1}`),
                        cell(...(kind === 2 ? [found, text(30, index)] : [found])),
                        cell(...(kind === 4 ? [todo, "", todo] : [todo])),
                    ],
                });
            }),
        ],
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
                ...Array.from({ length: 12 }, (_, survey) => [
                    heading(HeadingLevel.HEADING_1, `Survey ${survey + 1}`),
                    new Paragraph(text(30 + ((survey * 41) % 90), survey)),
                    log(3 + ((survey * 7) % 6), survey),
                    heading(HeadingLevel.HEADING_2, `After survey ${survey + 1}`),
                    new Paragraph(text(20 + ((survey * 23) % 60), survey + 5)),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
