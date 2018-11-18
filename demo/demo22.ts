// This demo shows right to left for special languages
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph1 = new Paragraph().bidirectional();
const textRun1 = new TextRun("שלום עולם").rightToLeft();
paragraph1.addRun(textRun1);
doc.addParagraph(paragraph1);

const paragraph2 = new Paragraph().bidirectional();
const textRun2 = new TextRun("שלום עולם").bold().rightToLeft();
paragraph2.addRun(textRun2);
doc.addParagraph(paragraph2);

const paragraph3 = new Paragraph().bidirectional();
const textRun3 = new TextRun("שלום עולם").italics().rightToLeft();
paragraph3.addRun(textRun3);
doc.addParagraph(paragraph3);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
