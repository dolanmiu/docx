// Page numbers worked out by docx/layout for tables, whose header rows are repeated on each page, numbered and bulleted
// lists, and pictures in the text. It is one of the documents scripts/compare-layout.sh checks against LibreOffice.
// See docs/usage/layout.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    ImageRun,
    LevelFormat,
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

const WORDS = "the inventory lists every tool in the workshop with where it is kept who last used it and when it is due back".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 3) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });
const image = fs.readFileSync("./demo/assets/images/image1.jpeg");

const table = (rows: number, seed: number): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [1800, 4426, 2800],
        rows: [
            new TableRow({
                tableHeader: true,
                children: ["Number", "Tool", "Kept in"].map(
                    (title) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })] }),
                ),
            }),
            ...Array.from(
                { length: rows },
                (_, index) =>
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(String(index + 1))] }),
                            new TableCell({ children: [new Paragraph(text(4 + ((index * 7 + seed) % 25), index + seed))] }),
                            new TableCell({
                                children: Array.from(
                                    { length: 1 + ((index + seed) % 3) },
                                    (_, line) => new Paragraph(text(3 + line, index + line)),
                                ),
                            }),
                        ],
                    }),
            ),
        ],
    });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    numbering: {
        config: [
            {
                reference: "steps",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
                    },
                    {
                        level: 1,
                        format: LevelFormat.LOWER_LETTER,
                        text: "%2)",
                        alignment: AlignmentType.START,
                        style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                heading("A table over several pages"),
                new Paragraph(text(40, 1)),
                table(45, 1),
                heading("A numbered list"),
                ...Array.from(
                    { length: 24 },
                    (_, index) =>
                        new Paragraph({
                            numbering: { reference: "steps", level: index % 4 === 3 ? 1 : 0 },
                            children: [new TextRun(text(12 + ((index * 17) % 60), index))],
                        }),
                ),
                heading("A bulleted list"),
                ...Array.from(
                    { length: 16 },
                    (_, index) =>
                        new Paragraph({
                            bullet: { level: index % 3 === 2 ? 1 : 0 },
                            children: [new TextRun(text(10 + ((index * 13) % 50), index * 2))],
                        }),
                ),
                heading("Pictures in the text"),
                ...Array.from(
                    { length: 6 },
                    (_, index) =>
                        new Paragraph({
                            children: [
                                new TextRun(`${text(20 + index * 5, index)} `),
                                new ImageRun({
                                    type: "jpg",
                                    data: image,
                                    transformation: { width: 120 + index * 40, height: 80 + index * 30 },
                                }),
                                new TextRun(` ${text(30, index + 1)}`),
                            ],
                        }),
                ),
                heading("Another table"),
                table(20, 7),
                heading("The end"),
                new Paragraph(text(50, 3)),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
