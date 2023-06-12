// Example how to display page numbers

import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, PageNumber, NumberFormat, Paragraph, TextRun } from "docx";

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
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("Foo Bar corp. "),
                                new TextRun({
                                    children: ["Page Number ", PageNumber.CURRENT],
                                }),
                                new TextRun({
                                    children: [" to ", PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun("Foo Bar corp. "),
                                new TextRun({
                                    children: ["Page Number: ", PageNumber.CURRENT],
                                }),
                                new TextRun({
                                    children: [" to ", PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    children: [new TextRun("Hello World 1"), new PageBreak()],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World 2"), new PageBreak()],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World 3"), new PageBreak()],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World 4"), new PageBreak()],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World 5"), new PageBreak()],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
