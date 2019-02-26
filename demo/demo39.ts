// Example how to display page numbers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, PageNumberFormat, TextRun } from "../build";

const doc = new Document(
    {},
    {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
);

doc.Header.createParagraph("Foo Bar corp. ")
    .addRun(new TextRun("Page Number ").pageNumber())
    .addRun(new TextRun(" to ").numberOfTotalPages());

doc.Footer.createParagraph("Foo Bar corp. ")
    .center()
    .addRun(new TextRun("Page Number: ").pageNumber())
    .addRun(new TextRun(" to ").numberOfTotalPages());

doc.createParagraph("Hello World 1").pageBreak();
doc.createParagraph("Hello World 2").pageBreak();
doc.createParagraph("Hello World 3").pageBreak();
doc.createParagraph("Hello World 4").pageBreak();
doc.createParagraph("Hello World 5").pageBreak();

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
