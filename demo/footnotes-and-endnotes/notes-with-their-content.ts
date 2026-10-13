// Footnotes and endnotes that bring their content with them: a reference run can be given its note's paragraphs,
// rather than the id of one in the document's footnotes or endnotes option, so content can be made before the document
// it goes in. Each run has a note of its own. See docs/usage/footnotes.md.

import * as fs from "fs";
import { Document, EndnoteReferenceRun, FootnoteReferenceRun, Packer, Paragraph, TextRun } from "docx";

const sourced = (claim: string, source: string): Paragraph =>
    new Paragraph({ children: [new TextRun(claim), new FootnoteReferenceRun({ children: [new Paragraph(source)] })] });

const doc = new Document({
    footnotes: { 1: { children: [new Paragraph("A footnote of the document's own.")] } },
    sections: [
        {
            children: [
                new Paragraph({ children: [new TextRun("A claim with a footnote of the document's own"), new FootnoteReferenceRun(1)] }),
                sourced("Sales were up 12%.", "The quarterly figures, page 4."),
                sourced("Costs fell.", "The annual report."),
                new Paragraph({
                    children: [
                        new TextRun("The method is described elsewhere"),
                        new EndnoteReferenceRun({ children: [new Paragraph("Smith, A Book, 2001, page 12.")] }),
                        new TextRun("."),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
