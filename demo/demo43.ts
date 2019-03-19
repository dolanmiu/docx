// Add image to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph } from "../build";

const doc = new Document();

const table = doc.createTable({
    rows: 4,
    columns: 4,
});
table.getCell(2, 2).addParagraph(new Paragraph("Hello"));
table.getColumn(3).mergeCells(1, 2);
// table.getCell(3, 2).addParagraph(new Paragraph("Hello"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
