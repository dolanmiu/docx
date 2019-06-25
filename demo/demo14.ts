// Page numbers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.add(
    new Paragraph({
        text: "First Page",
    }).pageBreak(),
);
doc.add(new Paragraph("Second Page"));

const pageNumber = new TextRun("Page ").pageNumber();

const pageoneheader = new Paragraph({
    text: "First Page Header ",
    alignment: AlignmentType.RIGHT,
});

pageoneheader.addRun(pageNumber);
const firstPageHeader = doc.createFirstPageHeader();
firstPageHeader.add(pageoneheader);

const pagetwoheader = new Paragraph({
    text: "My Title ",
    alignment: AlignmentType.RIGHT,
});

pagetwoheader.addRun(pageNumber);
doc.Header.add(pagetwoheader);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
