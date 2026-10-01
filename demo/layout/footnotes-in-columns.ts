// Page numbers worked out by docx/layout for a document whose chapters each open with a summary in two columns, evened
// out before the text across the page below it, with a footnote at the bottom of the page, which the text stays above.
// It is one of the documents scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import { Document, FootnoteReferenceRun, HeadingLevel, Packer, Paragraph, SectionType, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "the tides were measured at the harbour wall each morning and the readings sent inland by the first train".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 3) % WORDS.length]).join(" ");

const heading = (level: (typeof HeadingLevel)[keyof typeof HeadingLevel], title: string): Paragraph =>
    new Paragraph({ heading: level, children: [new TextRun(title)] });

const CHAPTERS = ["The harbour wall", "The morning readings", "The first train", "What the tables showed"];

// One footnote for each chapter's summary, short enough to take a line in a column
const footnotes = Object.fromEntries(
    CHAPTERS.map((title, index) => [index + 1, { children: [new Paragraph(`Read again in ${1890 + index}.`)] }]),
);

const chapter = (title: string, index: number) => [
    // The chapter's heading, at the top of a new page
    { children: [heading(HeadingLevel.HEADING_1, title)] },
    {
        // Its summary in two columns, evened out before the text below it, with a footnote referred to from the first
        properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } },
        children: [
            new Paragraph({ children: [new TextRun(text(40 + index * 9, index)), new FootnoteReferenceRun(index + 1)] }),
            new Paragraph(text(55 + ((index * 19) % 30), index + 1)),
        ],
    },
    {
        // Its text, across the page, from below the summary
        properties: { type: SectionType.CONTINUOUS },
        children: Array.from({ length: 3 }, (_, part) => [
            heading(HeadingLevel.HEADING_2, `${title}, part ${part + 1}`),
            ...Array.from(
                { length: 2 + ((index + part) % 3) },
                (_, paragraph) => new Paragraph(text(60 + ((index * 41 + part * 29 + paragraph * 37) % 120), index + part + paragraph)),
            ),
        ]).flat(),
    },
];

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Cambria", size: 22 }, paragraph: { spacing: { after: 120 } } },
            heading1: { run: { size: 32 }, paragraph: { spacing: { after: 200 }, keepNext: true } },
            heading2: { run: { size: 24 }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true } },
        },
    },
    footnotes,
    sections: [
        {
            children: [new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }), new Paragraph(text(50, 0))],
        },
        ...CHAPTERS.flatMap(chapter),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
