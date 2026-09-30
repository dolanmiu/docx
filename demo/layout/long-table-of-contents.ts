// A table of contents over several pages, with its page numbers worked out by docx/layout, which lays the table out
// with the rest of the document. It is one of the documents scripts/compare-layout.sh checks against LibreOffice.
// See docs/usage/layout.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "notes on the plants of the northern hills gathered over three summers with where each was found".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 7) % WORDS.length]).join(" ");

const LEVELS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { after: 120 } } },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                ...Array.from({ length: 90 }, (_, index) => [
                    new Paragraph({
                        heading: LEVELS[index % 5 === 0 ? 0 : index % 5 < 3 ? 1 : 2],
                        children: [new TextRun(`${index + 1}. ${text(2 + (index % 5), index)}`)],
                    }),
                    new Paragraph({ children: [new TextRun(text(20 + ((index * 23) % 110), index))] }),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
