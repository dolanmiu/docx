// This demo shows right to left for special languages
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    children: [
        new Paragraph({
            bidirectional: true,
            children: [
                new TextRun({
                    text: "שלום עולם",
                    rightToLeft: true,
                }),
            ],
        }),
        new Paragraph({
            bidirectional: true,
            children: [
                new TextRun({
                    text: "שלום עולם",
                    bold: true,
                    rightToLeft: true,
                }),
            ],
        }),
        new Paragraph({
            bidirectional: true,
            children: [
                new TextRun({
                    text: "שלום עולם",
                    italics: true,
                    rightToLeft: true,
                }),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
