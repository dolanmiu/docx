// Multiple sections with total number of pages in each section
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, PageNumberFormat, TextRun } from "../build";

const doc = new Document();


const header = doc.createHeader();
header.createParagraph("Header on another page");
const footer = doc.createFooter();
footer.createParagraph("Foo Bar corp. ")
    .center()
    .addRun(new TextRun("Page Number: ").pageNumber())
    .addRun(new TextRun(" to ").numberOfTotalPagesSection());

doc.addSection({
    headers: {
        default: header,
    },
    footers: {
        default: footer,
    },
    pageNumberStart: 1,
    pageNumberFormatType: PageNumberFormat.DECIMAL,
});

doc.createParagraph("Section 1").pageBreak();
doc.createParagraph("Section 1").pageBreak();

doc.addSection({
    headers: {
        default: header,
    },
    footers: {
        default: footer,
    },
    pageNumberStart: 1,
    pageNumberFormatType: PageNumberFormat.DECIMAL,
});

doc.createParagraph("Section 2").pageBreak();
doc.createParagraph("Section 2").pageBreak();

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
