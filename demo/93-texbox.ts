// Simple example to add check boxes to a document
import * as fs from "fs";
import { Document, Packer, Paragraph, Textbox, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Textbox({
                    children: [
                        new Paragraph({
                            children: [new TextRun("HELLO WORLD!!!")],
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
