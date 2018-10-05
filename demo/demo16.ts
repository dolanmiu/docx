// Multiple sections and headers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, PageNumberFormat, PageOrientation, Paragraph } from "../build";

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

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
