// Add image to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, Table } from "../build";

const doc = new Document();

const table = new Table({
    rows: 4,
    columns: 4,
});

doc.add(table);

table.getCell(2, 2).add(new Paragraph("Hello"));
table.getColumn(3).mergeCells(1, 2);
// table.getCell(3, 2).add(new Paragraph("Hello"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
