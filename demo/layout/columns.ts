// Page numbers worked out by docx/layout for sections in columns: text that fills each column of a page before the next,
// column breaks, and a section in columns that starts below the text before it on the same page. It is one of the
// documents scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import { ColumnBreak, Document, HeadingLevel, Packer, Paragraph, SectionType, TableOfContents, TextRun } from "docx";
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
            properties: { type: SectionType.NEXT_PAGE, column: { count: 3, space: 360 } },
            children: [...chapter("The lighthouse", 5, 3), ...chapter("The boats", 3, 4)],
        },
        {
            properties: { type: SectionType.NEXT_PAGE },
            children: [...chapter("What was found", 3, 5)],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
