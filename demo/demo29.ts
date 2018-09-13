// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

doc
    .createTable(2, 2)
    .getCell(0, 0)
    .addContent(new Paragraph("Hello"))
    .setHorizontalSpan(2);

doc.createParagraph("Another table").heading2();

doc
    .createTable(2, 3)
    .getCell(0, 0)
    .addContent(new Paragraph("World"))
    .setHorizontalSpan(3);

doc.createParagraph("Another table").heading2();

const table = doc.createTable(2, 4);
table
    .getCell(0, 0)
    .addContent(new Paragraph("Foo"))
    .setHorizontalSpan(4);

table.getCell(1, 0).addContent(new Paragraph("Bar1"));
table.getCell(1, 1).addContent(new Paragraph("Bar2"));
table.getCell(1, 2).addContent(new Paragraph("Bar3"));
table.getCell(1, 3).addContent(new Paragraph("Bar4"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
