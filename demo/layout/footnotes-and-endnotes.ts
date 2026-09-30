// Page numbers worked out by docx/layout for pages with footnotes at their bottom, which take room from the text, and a
// document with endnotes after its text. It is one of the documents scripts/compare-layout.sh checks against LibreOffice.
// See docs/usage/layout.md.

import * as fs from "fs";
import {
    Document,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    HeadingLevel,
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

const WORDS = "the letters were sent from the harbour office to the families of the crew each spring before the boats went out".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 5) % WORDS.length]).join(" ");

// Footnotes of a line each: the layout stops at a footnote of more lines that doesn't fit below its reference, which Word
// and LibreOffice continue on the next page
const FOOTNOTES = Array.from({ length: 40 }, (_, index) => index + 1);
const footnotes = Object.fromEntries(
    FOOTNOTES.map((id) => [id, { children: [new Paragraph({ children: [new TextRun(text(3 + ((id * 17) % 8), id))] })] }]),
);
const endnotes = Object.fromEntries(
    [1, 2, 3, 4, 5, 6].map((id) => [id, { children: [new Paragraph(text(30 + id * 11, id)), new Paragraph(text(20, id + 3))] }]),
);

let footnote = 0;
let endnote = 0;
/** A paragraph with a footnote after some of its sentences, and an endnote now and then */
const noted = (words: number, seed: number): Paragraph =>
    new Paragraph({
        children: [
            new TextRun(text(words, seed)),
            ...(seed % 2 === 0 && footnote < FOOTNOTES.length ? [new FootnoteReferenceRun(++footnote)] : []),
            new TextRun(` ${text(Math.floor(words / 2), seed + 1)}`),
            ...(seed % 3 === 0 && footnote < FOOTNOTES.length ? [new FootnoteReferenceRun(++footnote)] : []),
            ...(seed % 5 === 4 && endnote < 6 ? [new EndnoteReferenceRun(++endnote)] : []),
        ],
    });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    footnotes,
    endnotes,
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
                ...Array.from({ length: 9 }, (_, chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Chapter ${chapter + 1}`)] }),
                    ...Array.from({ length: 2 + (chapter % 3) }, (_, index) =>
                        noted(30 + ((chapter * 29 + index * 43) % 90), chapter + index),
                    ),
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Chapter ${chapter + 1}, the crew`)] }),
                    ...(chapter % 3 === 1
                        ? [
                              new Table({
                                  width: { size: 9026, type: WidthType.DXA },
                                  columnWidths: [3000, 6026],
                                  rows: Array.from(
                                      { length: 4 },
                                      (_, index) =>
                                          new TableRow({
                                              cantSplit: true,
                                              children: [
                                                  new TableCell({ children: [new Paragraph(`Boat ${index + 1}`)] }),
                                                  new TableCell({ children: [noted(8 + ((index * 13) % 20), index * 2)] }),
                                              ],
                                          }),
                                  ),
                              }),
                          ]
                        : []),
                    noted(40 + ((chapter * 31) % 70), chapter * 2),
                ]).flat(),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
