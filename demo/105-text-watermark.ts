// Add a text watermark behind every page

import * as fs from "fs";
import { Document, Header, Packer, PageBreak, Paragraph, TextWatermark } from "docx";

const doc = new Document({
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextWatermark({ text: "DRAFT" })],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph("This section has Word's default diagonal, semi-transparent silver watermark."),
                new Paragraph({ children: [new PageBreak()] }),
                new Paragraph("The watermark repeats on every page of the section because it lives in the header."),
            ],
        },
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextWatermark({
                                    text: "CONFIDENTIAL",
                                    font: "Arial",
                                    color: "FF0000",
                                    opacity: 0.3,
                                    layout: "horizontal",
                                    bold: true,
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [new Paragraph("This section has a horizontal, bold, red watermark with a custom opacity.")],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
