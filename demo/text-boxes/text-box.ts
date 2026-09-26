// Simple example to add textbox to a document
import { Document, Packer, Paragraph, Textbox, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Textbox({
                    alignment: "center",
                    children: [
                        new Paragraph({
                            children: [new TextRun("Hi i'm a textbox!")],
                        }),
                    ],
                    style: {
                        width: "200pt",
                        height: "auto",
                    },
                }),
                new Textbox({
                    alignment: "center",
                    children: [
                        new Paragraph({
                            children: [new TextRun("Hi i'm a textbox with a hidden box!")],
                        }),
                    ],
                    style: {
                        width: "300pt",
                        height: 400,
                        visibility: "hidden",
                        zIndex: "auto",
                    },
                }),
                // A textbox in a paragraph's children is in that paragraph, after its text
                new Paragraph({
                    children: [
                        new TextRun("A textbox in a paragraph: "),
                        new Textbox({
                            children: [
                                new Paragraph({
                                    children: [new TextRun("Hi i'm a textbox in a paragraph!")],
                                }),
                            ],
                            style: {
                                width: "200pt",
                                height: "auto",
                            },
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
