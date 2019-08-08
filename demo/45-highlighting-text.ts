// Highlighting text
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Header, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: "Hello World",
                            color: "red",
                            bold: true,
                            size: 24,
                            font: {
                                name: "Garamond",
                            },
                            highlight: "yellow",
                        }),
                    ],
                }),
            ],
        }),
    },
    children: [],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
