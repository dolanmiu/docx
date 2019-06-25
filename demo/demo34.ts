// Example of how you would create a table with float positions
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    RelativeVerticalPosition,
    Table,
    TableAnchorType,
    WidthType,
} from "../build";

const doc = new Document();

const table = new Table({
    rows: 2,
    columns: 2,
    float: {
        horizontalAnchor: TableAnchorType.MARGIN,
        verticalAnchor: TableAnchorType.MARGIN,
        relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
        relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
    },
    width: 4535,
    widthUnitType: WidthType.DXA,
});

doc.addTable(table);
table.setFixedWidthLayout();

table.getCell(0, 0).addParagraph(new Paragraph("Hello"));
table.getRow(0).mergeCells(0, 1);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
