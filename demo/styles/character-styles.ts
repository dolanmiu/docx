// Custom character styles using JavaScript configuration

import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    styles: {
        characterStyles: [
            {
                id: "myRedStyle",
                name: "My Wonky Style",
                basedOn: "Normal",
                run: {
                    color: "990000",
                    italics: true,
                },
            },
            {
                id: "strong",
                name: "Strong",
                basedOn: "Normal",
                run: {
                    bold: true,
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Foo bar",
                            style: "myRedStyle",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "First Word",
                            style: "strong",
                        }),
                        new TextRun({
                            text: " - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
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
