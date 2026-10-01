// A document whose page numbers docx/layout writes, without updateFields, to open in Word: whether Word asks "This
// document contains fields that may refer to other files. Do you want to update the fields in this document?". Every
// number in it is one docx/layout writes, so no field is written dirty. word-no-prompt.py reads Word's PDF of it, and
// checks each number against the page Word put its heading on. Calibri 11 on A4, the size docx writes by default.
//
// NP1: a table of contents filled in from the headings, with links (`hyperlink`), on the first page
// NP2: page references, one before its bookmark and one after it, one of them a link
// NP3: a page reference in the header, to a bookmark in the last section
// NP4: the page's number, the number of pages (NUMPAGES) and the number of pages of the section (SECTIONPAGES) in the
//      footer, in two sections of different numbers of pages
// cspell:ignore NUMPAGES SECTIONPAGES
import * as fs from "fs";
import {
    Bookmark,
    Document,
    Footer,
    Header,
    HeadingLevel,
    Packer,
    PageNumber,
    PageReference,
    Paragraph,
    TableOfContents,
    TextRun,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

// Words of different lengths, so the lines wrap in different places
const WORDS =
    "the report sets out how the harbour was rebuilt after the storm, what it cost, which parts are finished and what is still to be done before winter".split(
        " ",
    );
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 7 + seed * 5) % WORDS.length]).join(" ");

const chapter = (number: number): readonly Paragraph[] => [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`NP chapter ${number}`)] }),
    ...Array.from({ length: 3 }, (_, index) => new Paragraph(text(90 + ((number * 37 + index * 19) % 120), number + index))),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`NP section ${number}.1`)] }),
    new Paragraph(text(150, number * 3)),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`NP section ${number}.2`)] }),
    new Paragraph(text(110, number * 7)),
];

const footer = new Footer({
    children: [
        new Paragraph({
            children: [
                new TextRun({
                    children: [
                        "NP4 page ",
                        PageNumber.CURRENT,
                        " of ",
                        PageNumber.TOTAL_PAGES,
                        ", section of ",
                        PageNumber.TOTAL_PAGES_IN_SECTION,
                    ],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    // No updateFields: Word should open the document without asking, and show the numbers as they are written
    pageNumbers: estimatePageNumbers,
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph({ children: [new TextRun("NP3 the appendix is on page "), new PageReference("appendix")] })],
                }),
            },
            footers: { default: footer },
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-3" }),
                new Paragraph({
                    children: [
                        new TextRun("NP2a the costs are on page "),
                        new PageReference("costs", { hyperlink: true }),
                        new TextRun(" end"),
                    ],
                }),
                ...[1, 2, 3].flatMap(chapter),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new Bookmark({ id: "costs", children: [new TextRun("NP costs")] })],
                }),
                new Paragraph(text(120, 11)),
                new Paragraph({ children: [new TextRun("NP2b the costs were on page "), new PageReference("costs"), new TextRun(" end")] }),
            ],
        },
        {
            footers: { default: footer },
            children: [
                ...[4, 5].flatMap(chapter),
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new Bookmark({ id: "appendix", children: [new TextRun("NP appendix")] })],
                }),
                new Paragraph(text(140, 13)),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.mkdirSync("build/word-probes", { recursive: true });
    fs.writeFileSync("build/word-probes/word-no-prompt.docx", buffer);
});
