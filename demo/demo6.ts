// Example of how to change page borders
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document(undefined, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
});

const paragraph = new Paragraph("Hello World");
const institutionText = new TextRun("Foo bar").bold();
const dateText = new TextRun("Github is the best").tab().bold();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

doc.createParagraph("Hello World").heading1();
doc.createParagraph("Foo bar");
doc.createParagraph("Github is the best");

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
