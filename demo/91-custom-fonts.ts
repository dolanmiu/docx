// Simple example to add text to a document

import * as fs from "fs";
import { Document, Packer, Paragraph, Tab, TextRun } from "docx";

const font = fs.readFileSync("./demo/assets/Pacifico.ttf");

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                            size: 40,
                        }),
                        new TextRun({
                            children: [new Tab(), "Github is the best"],
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
    fonts: [{ name: "4964cd56-5244-408a-adb3-058730e14d5a.ttf", data: font }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
