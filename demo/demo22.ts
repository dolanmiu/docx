// This demo shows right to left for special languages
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph1 = new Paragraph({
    bidirectional: true,
});
const textRun1 = new TextRun({
    text: "שלום עולם",
    rightToLeft: true,
});
paragraph1.addRun(textRun1);
doc.addParagraph(paragraph1);

const paragraph2 = new Paragraph({
    bidirectional: true,
});
const textRun2 = new TextRun({
    text: "שלום עולם",
    bold: true,
    rightToLeft: true,
});
paragraph2.addRun(textRun2);
doc.addParagraph(paragraph2);

const paragraph3 = new Paragraph({
    bidirectional: true,
});
const textRun3 = new TextRun({
    text: "שלום עולם",
    italics: true,
    rightToLeft: true,
});
paragraph3.addRun(textRun3);
doc.addParagraph(paragraph3);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
