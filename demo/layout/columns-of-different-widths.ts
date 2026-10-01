// Page numbers worked out by docx/layout for sections in columns of different widths: a narrow column beside a wide one,
// where a paragraph that goes on from one into the other is broken into lines again at the other's width, as Word breaks
// it, and columns of different widths evened out before a continuous section break. It is one of the documents
// scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import { Column, Document, HeadingLevel, Packer, Paragraph, SectionType, TableOfContents, TextRun } from "docx";
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

// The page's text is 9026 twips wide: a column of 2500 and one of 5806, with 720 between them
const narrowFirst = {
    count: 2,
    space: 720,
    equalWidth: false,
    children: [new Column({ width: 2500, space: 720 }), new Column({ width: 5806 })],
};
const wideFirst = {
    count: 2,
    space: 720,
    equalWidth: false,
    children: [new Column({ width: 5806, space: 720 }), new Column({ width: 2500 })],
};

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
            // A narrow column and a wide one, from below the introduction
            properties: { type: SectionType.CONTINUOUS, column: narrowFirst },
            children: [...chapter("The coast", 4, 1), ...chapter("The river", 3, 2)],
        },
        {
            // A wide column and a narrow one, on a new page
            properties: { column: wideFirst },
            children: [...chapter("The lighthouse", 4, 3)],
        },
        {
            // A narrow column and a wide one again, below the two before them evened out
            properties: { type: SectionType.CONTINUOUS, column: narrowFirst },
            children: [...chapter("The boats", 3, 4)],
        },
        {
            // One column, below the two before it evened out
            properties: { type: SectionType.CONTINUOUS },
            children: [...chapter("What was found", 2, 5)],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
