// Add image to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Media, Packer, Paragraph } from "../build";

const doc = new Document();

const table = doc.createTable(4, 4);
table.getCell(2, 2).addContent(new Paragraph("Hello"));

const image = Media.addImage(doc, "./demo/images/image1.jpeg");
table.getCell(1, 1).addContent(image.Paragraph);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
