// Example of how you would create a table and add data to it
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Packer, Paragraph, VerticalAlign } from "../build";

const doc = new Document();

const table = doc.createTable({
    rows: 2,
    columns: 2,
});
table
    .getCell(1, 1)
    .addParagraph(new Paragraph("This text should be in the middle of the cell"))
    .setVerticalAlign(VerticalAlign.CENTER);

table
    .getCell(1, 0)
    .addParagraph(
        new Paragraph(
            "Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah",
        ).heading1(),
    );

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
