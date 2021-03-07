// Example of how to change page borders
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    margins: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    children: [
        new Paragraph({
            children: [
                new TextRun("Hello World"),
                new TextRun({
                    text: "Foo bar",
                    bold: true,
                }),
                new TextRun({
                    text: "\tGithub is the best",
                    bold: true,
                }),
            ],
        }),
        new Paragraph({
            text: "Hello World",
            heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph("Foo bar"),
        new Paragraph("Github is the best"),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
