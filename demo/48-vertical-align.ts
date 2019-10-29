// Example of making content of section vertically aligned
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, SectionVerticalAlignValue, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    properties: {
        valign: SectionVerticalAlignValue.Center,
    },
    children: [
        new Paragraph({
            children: [
                new TextRun("Hello World"),
                new TextRun({
                    text: "Foo Bar",
                    bold: true,
                }),
                new TextRun({
                    text: "Github is the best",
                    bold: true,
                }).tab(),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
