// Page numbers worked out by docx/layout across sections in portrait and landscape, with their own margins, and with
// headers and footers tall enough to push the text down. It is one of the documents scripts/compare-layout.sh checks
// against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    Footer,
    Header,
    HeadingLevel,
    Packer,
    PageNumber,
    PageOrientation,
    Paragraph,
    SectionType,
    TableOfContents,
    TextRun,
} from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "each section of the survey has its own pages margins headers and footers and the text flows from one to the next".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 11) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });
const paragraphs = (count: number, seed: number): readonly Paragraph[] =>
    Array.from(
        { length: count },
        (_, index) => new Paragraph({ children: [new TextRun(text(60 + ((seed * 29 + index * 41) % 130), seed + index))] }),
    );

// With the number of pages, which docx/layout writes too
const pageNumberFooter = new Footer({
    children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES] })],
        }),
    ],
});

// Five lines, which reach below the top margin
const tallHeader = new Header({
    children: Array.from(
        { length: 5 },
        (_, index) =>
            new Paragraph({ children: [new TextRun({ text: `Survey of the coast, line ${index + 1} of the header`, size: 28 })] }),
    ),
});

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    sections: [
        {
            headers: { default: new Header({ children: [new Paragraph("Survey of the coast")] }) },
            footers: { default: pageNumberFooter },
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                heading("Portrait, with a short header"),
                ...paragraphs(8, 1),
                heading("More portrait pages"),
                ...paragraphs(6, 2),
            ],
        },
        {
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            headers: { default: tallHeader },
            children: [heading("Landscape, with a tall header"), ...paragraphs(9, 3), heading("More landscape pages"), ...paragraphs(5, 4)],
        },
        {
            properties: { page: { margin: { top: 720, bottom: 2880, left: 2160, right: 2160 } }, titlePage: true },
            headers: {
                default: new Header({ children: [new Paragraph("Narrow pages")] }),
                first: new Header({
                    children: Array.from({ length: 8 }, (_, index) => new Paragraph(`First page header, line ${index + 1}`)),
                }),
            },
            footers: {
                default: new Footer({ children: Array.from({ length: 6 }, (_, index) => new Paragraph(`Footer line ${index + 1}`)) }),
            },
            children: [
                heading("Narrow margins, and a first page of its own"),
                ...paragraphs(10, 5),
                heading("More narrow pages"),
                ...paragraphs(4, 6),
            ],
        },
        {
            properties: { type: SectionType.CONTINUOUS, page: { margin: { top: 720, bottom: 2880, left: 1440, right: 1440 } } },
            children: [heading("A continuous section"), ...paragraphs(6, 7)],
        },
        {
            properties: { type: SectionType.ODD_PAGE },
            children: [heading("A section on an odd page"), ...paragraphs(5, 8)],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
