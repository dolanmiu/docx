// Multiple sections and headers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, PageNumberFormat, PageOrientation, Paragraph, TextRun } from "../build";

const doc = new Document();

const paragraph = new Paragraph("Hello World").pageBreak();

doc.addParagraph(paragraph);

const header = doc.createHeader();
header.createParagraph("Header on another page");
const footer = doc.createFooter();
footer.createParagraph("Footer on another page");

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

doc.createParagraph("hello");

doc.addSection({
    headers: {
        default: header,
    },
    footers: {
        default: footer,
    },
    pageNumberStart: 1,
    pageNumberFormatType: PageNumberFormat.DECIMAL,
    orientation: PageOrientation.LANDSCAPE,
});

doc.createParagraph("hello in landscape");

const header2 = doc.createHeader();
const pageNumber = new TextRun("Page number: ").pageNumber();
header2.createParagraph().addRun(pageNumber);

doc.addSection({
    headers: {
        default: header2,
    },
    orientation: PageOrientation.PORTRAIT,
});

doc.createParagraph("Page number in the header must be 2, because it continues from the previous section.");

doc.addSection({
    headers: {
        default: header2,
    },
    pageNumberFormatType: PageNumberFormat.UPPER_ROMAN,
    orientation: PageOrientation.PORTRAIT,
});

doc.createParagraph(
    "Page number in the header must be III, because it continues from the previous section, but is defined as upper roman.",
);

doc.addSection({
    headers: {
        default: header2,
    },
    pageNumberFormatType: PageNumberFormat.DECIMAL,
    pageNumberStart: 25,
    orientation: PageOrientation.PORTRAIT,
});

doc.createParagraph("Page number in the header must be 25, because it is defined to start at 25 and to be decimal in this section.");

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
