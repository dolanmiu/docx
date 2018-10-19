// Sequential Captions
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World 1->").addSequentialIdentifier("Caption").addRun(new TextRun(" text after sequencial caption 2->")).addSequentialIdentifier("Caption");
const paragraph2 = new Paragraph("Hello World 1->").addSequentialIdentifier("Label").addRun(new TextRun(" text after sequencial caption 2->")).addSequentialIdentifier("Label");
const paragraph3 = new Paragraph("Hello World 1->").addSequentialIdentifier("Another").addRun(new TextRun(" text after sequencial caption 3->")).addSequentialIdentifier("Label");
const paragraph4 = new Paragraph("Hello World 2->").addSequentialIdentifier("Another").addRun(new TextRun(" text after sequencial caption 4->")).addSequentialIdentifier("Label");

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);
doc.addParagraph(paragraph3);
doc.addParagraph(paragraph4);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
