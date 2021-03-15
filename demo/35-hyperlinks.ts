// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, ExternalHyperlink, Footer, FootnoteReferenceRun, Media, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    footnotes: {
        1: {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Click here for the "),
                        new ExternalHyperlink({
                            child: new TextRun({
                                text: "Footnotes external hyperlink",
                                style: "Hyperlink",
                            }),
                            link: "http://www.example.com",
                        }),
                    ],
                }),
            ],
        },
    },
});

const image1 = Media.addImage({
    document: doc,
    data: fs.readFileSync("./demo/images/image1.jpeg"),
    transformation: {
        width: 100,
        height: 100,
    },
});

doc.addSection({
    footers: {
        default: new Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Click here for the "),
                        new ExternalHyperlink({
                            child: new TextRun({
                                text: "Footer external hyperlink",
                                style: "Hyperlink",
                            }),
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
                            child: new TextRun({
                                text: "Header external hyperlink",
                                style: "Hyperlink",
                            }),
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
                    child: new TextRun({
                        text: "Anchor Text",
                        style: "Hyperlink",
                    }),
                    link: "http://www.example.com",
                }),
                new FootnoteReferenceRun(1),
            ],
        }),
        new Paragraph({
            children: [
                new ExternalHyperlink({
                    child: image1,
                    link: "http://www.google.com",
                }),
                new ExternalHyperlink({
                    child: new TextRun({
                        text: "BBC News Link",
                        style: "Hyperlink",
                    }),
                    link: "https://www.bbc.co.uk/news",
                }),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
