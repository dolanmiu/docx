// Add image to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Media, Packer, Paragraph, Table } from "../build";

const doc = new Document();

const table = new Table({
    rows: 4,
    columns: 4,
});

doc.addSection({
    children: [table],
});

table.getCell(2, 2).add(new Paragraph("Hello"));

const image = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));
table.getCell(1, 1).add(new Paragraph(image));

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
