// Footnotes
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

doc.addSection({
    children: [new Paragraph("Hello World").referenceFootnote(1), new Paragraph("Hello World").referenceFootnote(2)],
});

doc.createFootnote(new Paragraph("Test"));
doc.createFootnote(new Paragraph("My amazing reference"));

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
