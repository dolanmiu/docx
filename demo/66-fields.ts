// Use fields to include dynamic text
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Bookmark, Document, Packer, Paragraph, SimpleField, TextRun } from "../build";

const doc = new Document({
    creator: "Me",
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This document is called "),
                        new SimpleField("FILENAME", "My Document.docx"),
                        new TextRun(", was created on "),
                        new SimpleField('CREATEDATE  \\@ "d MMMM yyyy"'),
                        new TextRun(" by "),
                        new SimpleField("AUTHOR"),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("The document has "),
                        new SimpleField("NUMWORDS", "34"),
                        new TextRun(" words and if you'd print it "),
                        new Bookmark({
                            id: "TimesPrinted",
                            children: [new TextRun("42")],
                        }),
                        new TextRun(" times two-sided, you would need "),
                        new SimpleField("=INT((TimesPrinted+1)/2)"),
                        new TextRun(" sheets of paper."),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
