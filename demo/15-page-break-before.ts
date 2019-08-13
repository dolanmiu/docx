// Page break before example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

doc.addSection({
    children: [
        new Paragraph("Hello World"),
        new Paragraph({
            text: "Hello World on another page",
            pageBreakBefore: true,
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
