// Example of how you would create a table with float positions
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    RelativeVerticalPosition,
    TableAnchorType,
    WidthType,
} from "../build";

const doc = new Document();

const table = doc.createTable(2, 2).float({
    horizontalAnchor: TableAnchorType.MARGIN,
    verticalAnchor: TableAnchorType.MARGIN,
    relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
    relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
});
table.setFixedWidthLayout();
table.setWidth(WidthType.DXA, 4535);

table.getCell(0, 0).addContent(new Paragraph("Hello"));
table.getRow(0).mergeCells(0, 1);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
