// Page numbers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.createParagraph("First Page").pageBreak();
doc.createParagraph("Second Page");

const pageNumber = new TextRun("Page ").pageNumber();

const pageoneheader = new Paragraph("First Page Header ").right();

pageoneheader.addRun(pageNumber);
const firstPageHeader = doc.createFirstPageHeader();
firstPageHeader.addParagraph(pageoneheader);

const pagetwoheader = new Paragraph("My Title ").right();

pagetwoheader.addRun(pageNumber);
doc.Header.addParagraph(pagetwoheader);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
