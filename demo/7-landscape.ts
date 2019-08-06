// Example of how to set the document to landscape
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, PageOrientation, Paragraph } from "../build";

const doc = new Document();

doc.addSection({
    size: {
        orientation: PageOrientation.LANDSCAPE,
    },
    children: [new Paragraph("Hello World")],
});

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
