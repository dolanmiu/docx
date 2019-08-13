// Add image to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Header, Media, Packer, Paragraph, Table } from "../build";

const doc = new Document();
const image = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));

const table = new Table({
    rows: 2,
    columns: 2,
});
table.getCell(1, 1).add(new Paragraph(image));

// Adding same table in the body and in the header
doc.addSection({
    headers: {
        default: new Header({
            children: [table],
        }),
    },
    children: [table],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
