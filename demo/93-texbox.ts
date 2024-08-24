// Simple example to add textbox to a document
import * as fs from "fs";
import { Document, Packer, Paragraph, Textbox, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Textbox({
                    options: {
                        alignment: "center",
                        children: [
                            new Paragraph({
                                children: [new TextRun("Hi i'm a textbox!")],
                            }),
                        ],
                    },
                    style: {
                        shapeStyle: {
                            width: "200pt",
                            height: "auto",
                        },
                    },
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
