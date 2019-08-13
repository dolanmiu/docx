// Multiple cells merging in the same table
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, Table } from "../build";

const doc = new Document();

const table = new Table({
    rows: 13,
    columns: 6,
});

let row = 0;
table.getCell(row, 0).add(new Paragraph("0,0"));
table.getCell(row, 1).add(new Paragraph("0,1"));
table.getCell(row, 3).add(new Paragraph("0,3"));
table.getCell(row, 4).add(new Paragraph("0,4"));
table.getRow(row).mergeCells(4, 5);
table.getRow(row).mergeCells(1, 2);
row = 1;
table.getCell(row, 0).add(new Paragraph("1,0"));
table.getCell(row, 2).add(new Paragraph("1,2"));
table.getCell(row, 4).add(new Paragraph("1,4"));
table.getRow(row).mergeCells(4, 5);
table.getRow(row).mergeCells(2, 3);
table.getRow(row).mergeCells(0, 1);

row = 2;
table.getCell(row, 0).add(new Paragraph("2,0"));
table.getCell(row, 1).add(new Paragraph("2,1"));
table.getCell(row, 2).add(new Paragraph("2,2"));
table.getCell(row, 3).add(new Paragraph("2,3"));
table.getCell(row, 4).add(new Paragraph("2,4"));
table.getRow(row).mergeCells(4, 5);
table.getRow(row).mergeCells(1, 2);
row = 3;
table.getCell(row, 0).add(new Paragraph("3,0"));
table.getCell(row, 1).add(new Paragraph("3,1"));
table.getCell(row, 2).add(new Paragraph("3,2"));
table.getCell(row, 3).add(new Paragraph("3,3"));
table.getCell(row, 4).add(new Paragraph("3,4"));
table.getCell(row, 5).add(new Paragraph("3,5"));
row = 4;
table.getCell(row, 0).add(new Paragraph("4,0"));
table.getCell(row, 5).add(new Paragraph("4,5"));
table.getRow(row).mergeCells(0, 4);

doc.addSection({
    children: [table],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
