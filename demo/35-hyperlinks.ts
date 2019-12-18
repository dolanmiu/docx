// Example on how to add hyperlinks to websites
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HyperlinkRef, Packer, Paragraph } from "../build";

const doc = new Document({
    hyperlinks: {
        myCoolLink: {
            link: "http://www.example.com",
            text: "Hyperlink",
        },
    },
});

doc.addSection({
    children: [
        new Paragraph({
            children: [new HyperlinkRef("myCoolLink")],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
