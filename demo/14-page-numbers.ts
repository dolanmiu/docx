// Page numbers

import * as fs from "fs";
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, PageNumber, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                titlePage: true,
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Header({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Header "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
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
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("My Title "),
                                new TextRun({
                                    children: ["Footer - Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                                }),
                            ],
                        }),
                    ],
                }),
                first: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                                new TextRun("First Page Footer "),
                                new TextRun({
                                    children: ["Page ", PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    children: [new TextRun("First Page"), new PageBreak()],
                }),
                new Paragraph("Second Page"),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
