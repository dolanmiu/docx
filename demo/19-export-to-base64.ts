// Export to base64 string - Useful in a browser environment.
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    children: [
        new Paragraph({
            children: [
                new TextRun("Hello World"),
                new TextRun({
                    text: "Foo",
                    bold: true,
                }),
                new TextRun({
                    text: "\tBar",
                    bold: true,
                }),
            ],
        }),
    ],
});

Packer.toBase64String(doc).then((str) => {
    fs.writeFileSync("My Document.docx", str);
});
