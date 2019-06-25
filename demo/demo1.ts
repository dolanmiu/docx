// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World");
const institutionText = new TextRun({
    text: "Foo Bar",
    bold: true,
});
const dateText = new TextRun({
    text: "Github is the best",
    bold: true,
}).tab();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.add(paragraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
