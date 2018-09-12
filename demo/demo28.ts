// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, VerticalAlign } from "../build";

const doc = new Document();

const table = doc.createTable(4, 4);
table
    .getCell(2, 2)
    .addContent(new Paragraph("This text should be in the middle of the cell"))
    .CellProperties.setVerticalAlign(VerticalAlign.CENTER);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
