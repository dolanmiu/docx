// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HyperlinkRef, HyperlinkType, Packer, Paragraph, Media } from "../build";

const doc = new Document({
    hyperlinks: {
        myCoolLink: {
            link: "http://www.example.com",
            text: "Hyperlink",
            type: HyperlinkType.EXTERNAL,
        },
        myOtherLink: {
            link: "http://www.google.com",
            text: "Google Link",
            type: HyperlinkType.EXTERNAL,
        },
    },
});

const image1 = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));

doc.addSection({
    children: [
        new Paragraph({
            children: [new HyperlinkRef("myCoolLink")],
        }),
        new Paragraph({
            children: [image1, new HyperlinkRef("myOtherLink")],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
