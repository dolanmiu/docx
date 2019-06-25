// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, Table } from "../build";

const doc = new Document();

const table = new Table({
    rows: 4,
    columns: 4,
});

doc.addTable(table);

table.getCell(2, 2).addParagraph(new Paragraph("Hello"));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
