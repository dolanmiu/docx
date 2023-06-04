// Export to base64 string - Useful in a browser environment.

import * as fs from "fs";
import { Document, Packer, Paragraph, Tab, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new TextRun({
                            text: "Foo",
                            bold: true,
                        }),
                        new TextRun({
                            children: [new Tab(), "Bar"],
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBase64String(doc).then((str) => {
    fs.writeFileSync("My Document.docx", str);
});
