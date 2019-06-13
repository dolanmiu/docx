// Page numbers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addParagraph(
    new Paragraph({
        text: "First Page",
    }).pageBreak(),
);
doc.addParagraph(new Paragraph("Second Page"));

const pageNumber = new TextRun("Page ").pageNumber();

const pageoneheader = new Paragraph({
    text: "First Page Header ",
    alignment: AlignmentType.RIGHT,
});

pageoneheader.addRun(pageNumber);
const firstPageHeader = doc.createFirstPageHeader();
firstPageHeader.addParagraph(pageoneheader);

const pagetwoheader = new Paragraph({
    text: "My Title ",
    alignment: AlignmentType.RIGHT,
});

pagetwoheader.addRun(pageNumber);
doc.Header.addParagraph(pagetwoheader);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
