// Multiple sections with total number of pages in each section
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, PageNumberFormat, TextRun, Header, Paragraph, Footer, PageBreak } from "../build";

const doc = new Document();

const header = new Header({
    children: [
        new Paragraph({
            children: [
                new TextRun("Header on another page"),
                new TextRun("Page Number: ").pageNumber(),
                new TextRun(" to ").numberOfTotalPagesSection(),
            ],
            alignment: AlignmentType.CENTER,
        }),
    ],
});

const footer = new Footer({
    children: [new Paragraph("Foo Bar corp. ")],
});

doc.addSection({
    headers: {
        default: header,
    },
    footers: {
        default: footer,
    },
    properties: {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
    children: [
        new Paragraph({
            children: [new TextRun("Section 1"), new PageBreak(), new TextRun("Section 1"), new PageBreak()],
        }),
    ],
});

doc.addSection({
    headers: {
        default: header,
    },
    footers: {
        default: footer,
    },
    properties: {
        pageNumberStart: 1,
        pageNumberFormatType: PageNumberFormat.DECIMAL,
    },
    children: [
        new Paragraph({
            children: [new TextRun("Section 2"), new PageBreak(), new TextRun("Section 2"), new PageBreak()],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
