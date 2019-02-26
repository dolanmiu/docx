// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();
const paragraph = new Paragraph();
const link = doc.createHyperlink("http://www.example.com", "Hyperlink");

link.bold();
paragraph.addHyperLink(link);
doc.addParagraph(paragraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
