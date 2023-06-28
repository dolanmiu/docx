// Example on how to add hyperlinks to websites

import * as fs from "fs";
import { Document, ExternalHyperlink, Footer, FootnoteReferenceRun, ImageRun, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    styles: {
        default: {
            hyperlink: {
                run: {
                    color: "FF0000",
                    underline: {
                        color: "0000FF",
                    },
                },
            },
        },
    },
    footnotes: {
        1: {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Click here for the "),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "Footnotes external hyperlink",
                                    style: "Hyperlink",
                                }),
                            ],
                            link: "http://www.example.com",
                        }),
                    ],
                }),
            ],
        },
    },
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("Click here for the "),
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "Footer external hyperlink",
                                            style: "Hyperlink",
                                        }),
                                    ],
                                    link: "http://www.example.com",
                                }),
                            ],
                        }),
                    ],
                }),
            },
            headers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("Click here for the "),
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "Header external hyperlink",
                                            style: "Hyperlink",
                                        }),
                                    ],
                                    link: "http://www.google.com",
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    children: [
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "Anchor Text",
                                    style: "Hyperlink",
                                }),
                            ],
                            link: "http://www.example.com",
                        }),
                        new FootnoteReferenceRun(1),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ExternalHyperlink({
                            children: [
                                new ImageRun({
                                    data: fs.readFileSync("./demo/images/image1.jpeg"),
                                    transformation: {
                                        width: 100,
                                        height: 100,
                                    },
                                }),
                            ],
                            link: "http://www.google.com",
                        }),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "BBC News Link",
                                    style: "Hyperlink",
                                }),
                            ],
                            link: "https://www.bbc.co.uk/news",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "This is a hyperlink with formatting: ",
                        }),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "A ",
                                    style: "Hyperlink",
                                }),
                                new TextRun({
                                    text: "single ",
                                    bold: true,
                                    style: "Hyperlink",
                                }),
                                new TextRun({
                                    text: "link",
                                    doubleStrike: true,
                                    style: "Hyperlink",
                                }),
                                new TextRun({
                                    text: "1",
                                    superScript: true,
                                    style: "Hyperlink",
                                }),
                                new TextRun({
                                    text: "!",
                                    style: "Hyperlink",
                                }),
                            ],
                            link: "http://www.example.com",
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
