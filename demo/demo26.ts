// Creates two paragraphs, one with a border and one without
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("No border!");

doc.addParagraph(paragraph);

const borderParagraph = new Paragraph({
    text: "I have borders on my top and bottom sides!",
    border: {
        top: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
        bottom: {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        },
    },
});

doc.addParagraph(borderParagraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
