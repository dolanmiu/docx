// Example of how to change page borders
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "../build";

const doc = new Document(undefined, {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
});

const paragraph = new Paragraph("Hello World");
const institutionText = new TextRun({
    text: "Foo bar",
    bold: true,
});
const dateText = new TextRun({
    text: "Github is the best",
    bold: true,
}).tab();
paragraph.addRun(institutionText);
paragraph.addRun(dateText);

doc.addParagraph(paragraph);

doc.addParagraph(new Paragraph({
    text: "Hello World",
    heading: HeadingLevel.HEADING_1,
}));
doc.addParagraph(new Paragraph("Foo bar"));
doc.addParagraph(new Paragraph("Github is the best"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
