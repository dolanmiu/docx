// Footnotes
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World").referenceFootnote(1);
const paragraph2 = new Paragraph("Hello World").referenceFootnote(2);

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);

doc.createFootnote(new Paragraph("Test"));
doc.createFootnote(new Paragraph("My amazing reference"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
