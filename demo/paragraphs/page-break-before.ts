// Page break before example

import * as fs from "fs";
import { Document, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("Hello World"),
                new Paragraph({
                    text: "Hello World on another page",
                    pageBreakBefore: true,
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
