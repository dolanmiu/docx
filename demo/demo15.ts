// Page break before example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World");
const paragraph2 = new Paragraph("Hello World on another page").pageBreakBefore();

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
