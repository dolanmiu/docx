// Footnotes
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, FootnoteReferenceRun, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    footnotes: [
        new Paragraph("Foo"),
        new Paragraph("Test"),
        new Paragraph("My amazing reference"),
        new Paragraph("Foo1"),
        new Paragraph("Test1"),
        new Paragraph("My amazing reference1"),
    ],
});

doc.addSection({
    children: [
        new Paragraph({
            children: [
                new TextRun({
                    children: ["Hello", new FootnoteReferenceRun(1)],
                }),
                new TextRun({
                    children: [" World!", new FootnoteReferenceRun(2)],
                }),
            ],
        }),
        new Paragraph({
            children: [new TextRun("Hello World"), new FootnoteReferenceRun(3)],
        }),
    ],
});

doc.addSection({
    children: [
        new Paragraph({
            children: [
                new TextRun({
                    children: ["Hello", new FootnoteReferenceRun(4)],
                }),
                new TextRun({
                    children: [" World!", new FootnoteReferenceRun(5)],
                }),
            ],
        }),
        new Paragraph({
            children: [new TextRun("Hello World"), new FootnoteReferenceRun(6)],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
