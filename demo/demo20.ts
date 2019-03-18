// Add custom borders to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { BorderStyle, Document, Packer, Paragraph } from "../build";

const doc = new Document();

const table = doc.createTable({
    rows: 4,
    columns: 4,
});
table
    .getCell(2, 2)
    .addParagraph(new Paragraph("Hello"))
    .Borders.addTopBorder(BorderStyle.DASH_DOT_STROKED, 3, "red")
    .addBottomBorder(BorderStyle.DOUBLE, 3, "blue")
    .addStartBorder(BorderStyle.DOT_DOT_DASH, 3, "green")
    .addEndBorder(BorderStyle.DOT_DOT_DASH, 3, "#ff8000");

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
