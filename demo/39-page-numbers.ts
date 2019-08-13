// Example how to display page numbers
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageNumberFormat, Paragraph, TextRun } from "../build";

const doc = new Document({});

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph("Foo Bar corp. ")
                    .addRun(new TextRun("Page Number ").pageNumber())
                    .addRun(new TextRun(" to ").numberOfTotalPages()),
            ],
        }),
    },
    footers: {
        default: new Footer({
            children: [
                new Paragraph({
                    text: "Foo Bar corp. ",
                    alignment: AlignmentType.CENTER,
                })
                    .addRun(new TextRun("Page Number: ").pageNumber())
                    .addRun(new TextRun(" to ").numberOfTotalPages()),
            ],
        }),
    },
    properties: {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
    children: [
        new Paragraph("Hello World 1").pageBreak(),
        new Paragraph("Hello World 2").pageBreak(),
        new Paragraph("Hello World 3").pageBreak(),
        new Paragraph("Hello World 4").pageBreak(),
        new Paragraph("Hello World 5").pageBreak(),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
