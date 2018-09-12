// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const table = doc.createTable(2, 2);
table
    .getCell(0, 0)
    .addContent(new Paragraph("Hello"))
    .setHorizontalSpan(2);

doc.createParagraph("Another table").heading2();

const table2 = doc.createTable(2, 3);
table2
    .getCell(0, 0)
    .addContent(new Paragraph("World"))
    .setHorizontalSpan(3);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
