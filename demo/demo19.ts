// Export to base64 string - Useful in a browser environment.
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World");
const institutionText = new TextRun({
    text: "Foo",
    bold: true,
});
const dateText = new TextRun({
    text: "Bar",
    bold: true,
}).tab();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.add(paragraph);

const packer = new Packer();

packer.toBase64String(doc).then((str) => {
    fs.writeFileSync("My Document.docx", str);
});
