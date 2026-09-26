// Add text to header and footer

import * as fs from "fs";
import { AlignmentType, convertInchesToTwip, Document, Footer, Header, LevelFormat, Packer, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "footer-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            headers: {
                default: new Header({
                    children: [new Paragraph("Header text")],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph("This footer contains a numbered list:"),
                        new Paragraph({
                            text: "First item in the list",
                            numbering: {
                                reference: "footer-numbering",
                                level: 0,
                            },
                        }),
                        new Paragraph({
                            text: "Second item in the list",
                            numbering: {
                                reference: "footer-numbering",
                                level: 0,
                            },
                        }),
                        new Paragraph({
                            text: "Third item in the list",
                            numbering: {
                                reference: "footer-numbering",
                                level: 0,
                            },
                        }),
                    ],
                }),
            },
            children: [new Paragraph("Hello World")],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
