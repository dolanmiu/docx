// Footnotes

import * as fs from "fs";
import { Document, FootnoteReferenceRun, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    footnotes: {
        1: { children: [new Paragraph("Foo"), new Paragraph("Bar")] },
        2: { children: [new Paragraph("Test")] },
        3: { children: [new Paragraph("My amazing reference")] },
        4: { children: [new Paragraph("Foo1")] },
        5: { children: [new Paragraph("Test1")] },
        6: { children: [new Paragraph("My amazing reference1")] },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Hello"],
                        }),
                        new FootnoteReferenceRun(1),
                        new TextRun({
                            children: [" World!"],
                        }),
                        new FootnoteReferenceRun(2),
                        new TextRun({
                            children: [" GitHub!"],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World"), new FootnoteReferenceRun(3)],
                }),
            ],
        },
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Hello"],
                        }),
                        new FootnoteReferenceRun(4),
                        new TextRun({
                            children: [" World!"],
                        }),
                        new FootnoteReferenceRun(5),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World Again"), new FootnoteReferenceRun(6)],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
