// Move + offset header and footer

import * as fs from "fs";
import { Document, Footer, Header, Packer, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            properties: {
                page: {
                    margin: {
                        header: 100,
                        footer: 50,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            text: "Header text",
                            indent: {
                                left: -400,
                            },
                        }),
                        new Paragraph({
                            text: "Some more header text",
                            indent: {
                                left: -600,
                            },
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            text: "Footer text",
                            indent: {
                                left: -400,
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
