// Example of making content of section vertically aligned

import * as fs from "fs";
import { Document, Packer, Paragraph, VerticalAlign, TextRun, Tab } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                verticalAlign: VerticalAlign.CENTER,
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
                            children: [new Tab(), "Github is the best"],
                            bold: true,
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
