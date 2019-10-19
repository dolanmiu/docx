// Footnotes
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    children: [
        new Paragraph({
            children: [new TextRun("Hello").referenceFootnote(1), new TextRun(" World!").referenceFootnote(2)],
        }),
        new Paragraph("Hello World").referenceFootnote(3),
    ],
});

doc.createFootnote(new Paragraph("Foo"));
doc.createFootnote(new Paragraph("Test"));
doc.createFootnote(new Paragraph("My amazing reference"));

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
