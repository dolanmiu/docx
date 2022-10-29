// Exporting the document as a stream
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, Tab, TextRun } from "../build";

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

const stream = Packer.toStream(doc);
stream.pipe(fs.createWriteStream("My Document.docx"));
