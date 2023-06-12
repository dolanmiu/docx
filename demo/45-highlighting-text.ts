// Highlighting text

import * as fs from "fs";
import { AlignmentType, Document, Header, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun({
                                    text: "Hello World",
                                    color: "FF0000",
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
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
