// Creates two paragraphs, one with a border and one without
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const paragraph = new Paragraph("No border!");

doc.addParagraph(paragraph);

const borderParagraph = new Paragraph("I have borders on my top and bottom sides!").createBorder();
borderParagraph.Borders.addTopBorder();
borderParagraph.Borders.addBottomBorder();

doc.addParagraph(borderParagraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
