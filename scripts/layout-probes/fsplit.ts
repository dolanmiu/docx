// Probes of how LibreOffice continues a footnote: a reference in the middle of a paragraph, the next page's own
// footnotes below a continued one, and a document that ends with a footnote continued. Calibri 11, 51 lines to a page.
import * as fs from "fs";
import { Document, FootnoteReferenceRun, Packer, Paragraph, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
const noteLines = (probe: string, count: number): Paragraph =>
    new Paragraph({
        children: Array.from(
            { length: count },
            (_, i) => new TextRun({ text: `${probe} note line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
        ),
    });

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    footnotes: {
        1: { children: [noteLines("S1", 8)] },
        2: { children: [noteLines("S2", 8)] },
        3: { children: [line("S2 own note")] },
        4: { children: [noteLines("S3", 8)] },
    },
    sections: [
        // S1: a paragraph of 10 lines from line 41, with the reference on its 4th line (line 44)
        {
            children: [
                ...fill("S1", 40),
                new Paragraph({
                    children: [
                        ...Array.from({ length: 10 }, (_, i) => [
                            new TextRun({ text: `S1 para line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
                            ...(i === 3 ? [new FootnoteReferenceRun(1)] : []),
                        ]).flat(),
                    ],
                }),
                ...fill("S1 after", 5),
            ],
        },
        // S2: an 8-line footnote continued, and a reference on the next page to a footnote of its own
        {
            children: [
                ...fill("S2", 43),
                new Paragraph({ children: [new TextRun("S2 ref"), new FootnoteReferenceRun(2)] }),
                ...fill("S2 after", 3),
                new Paragraph({ children: [new TextRun("S2 own ref"), new FootnoteReferenceRun(3)] }),
                ...fill("S2 more", 60),
            ],
        },
        // S3: the last line refers to a footnote that doesn't fit below it
        { children: [...fill("S3", 43), new Paragraph({ children: [new TextRun("S3 ref"), new FootnoteReferenceRun(4)] })] },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/fsplit.docx", buffer));
