// Simple example to add comments to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, CommentRangeStart, CommentRangeEnd, CommentReference } from "../build";

const doc = new Document({
    comments: {
        children: [{ id: 0, author: "Ray Chen", date: new Date(), text: "comment text content" }],
    },
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new CommentRangeStart(0),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                        }),
                        new CommentRangeEnd(0),
                        new TextRun({
                            children: [new CommentReference(0)],
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
