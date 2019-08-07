// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();
const paragraph = new Paragraph({});
const link = doc.createHyperlink("http://www.example.com", "Hyperlink");

paragraph.addHyperLink(link);
doc.addSection({
    children: [paragraph],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
