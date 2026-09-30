// The page numbers of a table of contents and of page references, written with the document by docx/layout, so they
// show before Word updates the fields, and in applications that don't update them. See docs/usage/layout.md.

import * as fs from "fs";
import { Bookmark, Document, HeadingLevel, Packer, PageReference, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

// Words of different lengths, so the lines wrap in different places
const WORDS =
    "the report sets out how the harbour was rebuilt after the storm, what it cost, which parts are finished and what is still to be done before winter".split(
        " ",
    );
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 5) % WORDS.length]).join(" ");

const chapter = (number: number): readonly Paragraph[] => [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${number}`)] }),
    ...Array.from(
        { length: 3 },
        (_, index) => new Paragraph({ children: [new TextRun(text(90 + ((number * 37 + index * 19) % 120), number + index))] }),
    ),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Section ${number}.1`)] }),
    new Paragraph({ children: [new TextRun(text(150, number * 3))] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Section ${number}.2`)] }),
    new Paragraph({ children: [new TextRun(text(110, number * 7))] }),
];

const doc = new Document({
    // Word updates the fields when it opens the document, which checks the page numbers
    features: { updateFields: true },
    // Lays out the pages as Word would, and writes the page numbers of the table of contents and the page references
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                new Paragraph({
                    children: [
                        new TextRun("The costs are summarised on page "),
                        new PageReference("costs", { hyperlink: true }),
                        new TextRun("."),
                    ],
                }),
                ...[1, 2, 3, 4, 5].flatMap(chapter),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new Bookmark({ id: "costs", children: [new TextRun("Costs")] })],
                }),
                new Paragraph({ children: [new TextRun(text(120, 11))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
