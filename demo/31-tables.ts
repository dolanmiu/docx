// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, Table, VerticalAlign } from "../build";

const doc = new Document();

const table = new Table({
    rows: 2,
    columns: 2,
});

table
    .getCell(1, 1)
    .add(new Paragraph("This text should be in the middle of the cell"))
    .setVerticalAlign(VerticalAlign.CENTER);

table.getCell(1, 0).add(
    new Paragraph({
        text:
            "Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah",
        heading: HeadingLevel.HEADING_1,
    }),
);

doc.addSection({
    children: [table],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
