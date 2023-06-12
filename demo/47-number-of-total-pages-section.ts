// Multiple sections with total number of pages in each section

import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, PageNumber, NumberFormat, Paragraph, TextRun } from "docx";

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

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1,
                        formatType: NumberFormat.DECIMAL,
                    },
                },
            },
            headers: {
                default: header,
            },
            footers: {
                default: footer,
            },
            children: [
                new Paragraph({
                    children: [new TextRun("Section 1"), new PageBreak(), new TextRun("Section 1"), new PageBreak()],
                }),
            ],
        },
        {
            properties: {
                page: {
                    pageNumbers: {
                        start: 1,
                        formatType: NumberFormat.DECIMAL,
                    },
                },
            },
            headers: {
                default: header,
            },
            footers: {
                default: footer,
            },
            children: [
                new Paragraph({
                    children: [new TextRun("Section 2"), new PageBreak(), new TextRun("Section 2"), new PageBreak()],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
