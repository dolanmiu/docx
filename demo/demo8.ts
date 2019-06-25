// Add text to header and footer
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

doc.add(new Paragraph("Hello World"));

doc.Header.add(new Paragraph("Header text"));
doc.Footer.add(new Paragraph("Footer text"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
