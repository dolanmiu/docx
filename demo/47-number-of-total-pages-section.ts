// Multiple sections with total number of pages in each section
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, PageNumber, PageNumberFormat, Paragraph, TextRun } from "../build";

const doc = new Document();

const header = new Header({
    children: [
        new Paragraph({
            children: [
                new TextRun("Header on another page"),
                new TextRun({
                    children: ["Page number: ", PageNumber.CURRENT],
                }),
                new TextRun({
                    children: [" to ", PageNumber.TOTAL_PAGES_IN_SECTION],
                }),
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
