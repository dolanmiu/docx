// The page numbers of a template's table of contents, written by docx/layout once patchDocument has filled the template
// in, so they are those of the filled-in document. See docs/usage/layout.md.

import * as fs from "fs";
import { Document, Footer, HeadingLevel, Packer, PageNumber, Paragraph, PatchType, TableOfContents, TextRun, patchDocument } from "docx";
import { estimatePageNumbers } from "docx/layout";

// Words of different lengths, so the lines wrap in different places
const WORDS =
    "the survey of the coast found that the old harbour wall had moved in the winter storms and that the new one would need deeper footings".split(
        " ",
    );
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 5) % WORDS.length]).join(" ");

const CHAPTERS = ["The coast", "The harbour wall", "The footings", "The costs", "What is left to do"];

// A report template, as it might be made in Word: a table of contents, and a placeholder for each chapter's text. Its
// table of contents has no page numbers yet. Its updateFields is off, which patchDocument keeps as it is, so Word
// shows the page numbers docx/layout writes, and doesn't ask to update the fields
const template = new Document({
    features: { updateFields: false },
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES] })],
                        }),
                    ],
                }),
            },
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                ...CHAPTERS.flatMap((title, index) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
                    new Paragraph(`{{chapter${index + 1}}}`),
                ]),
            ],
        },
    ],
});

// Each chapter's text, of a different length, so the chapters move to later pages once the template is filled in
const chapterText = (chapter: number): readonly Paragraph[] =>
    Array.from(
        { length: 2 + ((chapter * 3) % 5) },
        (_, index) => new Paragraph(text(80 + ((chapter * 29 + index * 17) % 90), chapter + index)),
    );

Packer.toBuffer(template)
    .then((data) =>
        patchDocument({
            outputType: "nodebuffer",
            data,
            patches: Object.fromEntries(
                CHAPTERS.map((_, index) => [`chapter${index + 1}`, { type: PatchType.DOCUMENT, children: chapterText(index + 1) }]),
            ),
            // Lays out the filled-in document's pages as Word would, and writes the page numbers of its table of contents
            // and its number of pages
            pageNumbers: estimatePageNumbers,
        }),
    )
    .then((buffer) => {
        fs.writeFileSync("My Document.docx", buffer);
    });
