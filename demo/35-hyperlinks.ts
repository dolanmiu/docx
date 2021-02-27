// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { ExternalHyperlink, Document, Packer, Paragraph, Media, TextRun } from "../build";

const doc = new Document({});

const image1 = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));

doc.addSection({
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
