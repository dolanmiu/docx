// Files embedded in a document, which open from it: a workbook shown as its table, a Word document and a sound shown as icons

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { EmbeddedFileRun } from "docx/embedded-files";

// A Word document to embed, made with docx too
const letter = new Document({
    sections: [
        {
            children: [
                new Paragraph({ text: "Dear reader,", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("This letter is in the report."),
            ],
        },
    ],
});

Packer.toBuffer(letter).then((letterData) => {
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({ text: "Quarterly report", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph("The budget, which opens in Excel when double-clicked:"),
                    new Paragraph({
                        children: [
                            new EmbeddedFileRun({
                                fileName: "budget.xlsx",
                                data: fs.readFileSync("./demo/assets/embedded-files/budget.xlsx"),
                                preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/budget.png") },
                                transformation: { width: 241, height: 111 },
                                altText: "Sales and costs for January to March",
                            }),
                        ],
                    }),
                    new Paragraph("A letter, which opens in Word, and a sound, which Word for Windows plays:"),
                    new Paragraph({
                        children: [
                            new EmbeddedFileRun({
                                fileName: "letter.docx",
                                data: letterData,
                                preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/letter-icon.png") },
                                transformation: { width: 96, height: 96 },
                                displayAsIcon: true,
                            }),
                            new EmbeddedFileRun({
                                fileName: "tone.wav",
                                data: fs.readFileSync("./demo/assets/embedded-files/tone.wav"),
                                preview: { type: "png", data: fs.readFileSync("./demo/assets/embedded-files/tone-icon.png") },
                                transformation: { width: 96, height: 96 },
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("My Document.docx", buffer);
    });
});
