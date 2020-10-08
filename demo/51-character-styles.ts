// Custom character styles using JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

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
        ],
    },
});

doc.addSection({
    children: [
        new Paragraph({
            children: [
                new TextRun({
                    text: "Foo bar",
                    style: "myRedStyle",
                }),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
