// Page numbers worked out by docx/layout for headings kept with the paragraph after them, paragraphs kept on one page,
// widow and orphan control, and page breaks. It is one of the documents scripts/compare-layout.sh checks against
// LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, PageBreak, Paragraph, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS = "keep these lines together so that nothing is left alone at the bottom or the top of a page when it breaks".split(" ");
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 3 + seed * 7) % WORDS.length]).join(" ");

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: { run: { font: "Cambria", size: 24 }, paragraph: { spacing: { after: 120 } } },
            heading1: { run: { size: 36 }, paragraph: { spacing: { before: 360, after: 120 }, keepNext: true, keepLines: true } },
            heading2: { run: { size: 28 }, paragraph: { spacing: { before: 240, after: 60 }, keepNext: true } },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
                ...Array.from({ length: 14 }, (_, chapter) => [
                    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Part ${chapter + 1}`)] }),
                    ...Array.from(
                        { length: 2 + (chapter % 3) },
                        (_, index) =>
                            new Paragraph({ children: [new TextRun(text(25 + ((chapter * 31 + index * 17) % 140), chapter + index))] }),
                    ),
                    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Part ${chapter + 1}, kept with the next`)] }),
                    new Paragraph({ keepLines: chapter % 2 === 0, children: [new TextRun(text(70 + ((chapter * 23) % 90), chapter))] }),
                    new Paragraph({
                        widowControl: chapter % 3 !== 0,
                        children: [new TextRun(text(45 + ((chapter * 13) % 70), chapter * 2))],
                    }),
                ]).flat(),
                new Paragraph({ children: [new TextRun(text(40, 1)), new PageBreak()] }),
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("After a page break")] }),
                new Paragraph({ children: [new TextRun(text(60, 2))] }),
                new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("On a page of its own")] }),
                new Paragraph({ children: [new TextRun(text(60, 3))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
