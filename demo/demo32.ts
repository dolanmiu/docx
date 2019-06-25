// Example of how you would merge cells together
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, WidthType } from "../build";

const doc = new Document();

let table = new Table({
    rows: 2,
    columns: 2,
});

doc.addTable(table);

table.getCell(0, 0).addParagraph(new Paragraph("Hello"));
table.getRow(0).mergeCells(0, 1);

doc.addParagraph(
    new Paragraph({
        text: "Another table",
        heading: HeadingLevel.HEADING_2,
    }),
);

table = new Table({
    rows: 2,
    columns: 3,
    width: 100,
    widthUnitType: WidthType.AUTO,
    columnWidths: [1000, 1000, 1000],
});

doc.addTable(table);

table
    .getCell(0, 0)
    .addParagraph(new Paragraph("World"))
    .setMargins({
        top: 1000,
        bottom: 1000,
        left: 1000,
        right: 1000,
    });
table.getRow(0).mergeCells(0, 2);

doc.addParagraph(
    new Paragraph({
        text: "Another table",
        heading: HeadingLevel.HEADING_2,
    }),
);

table = new Table({
    rows: 2,
    columns: 4,
    width: 7000,
    widthUnitType: WidthType.DXA,
    margins: {
        top: 400,
        bottom: 400,
        right: 400,
        left: 400,
    },
});

doc.addTable(table);

table.getCell(0, 0).addParagraph(new Paragraph("Foo"));
table.getCell(0, 1).addParagraph(new Paragraph("v"));

table
    .getCell(1, 0)
    .addParagraph(new Paragraph("Bar1"))
    .setShading({
        fill: "b79c2f",
        val: ShadingType.REVERSE_DIAGONAL_STRIPE,
        color: "auto",
    });
table
    .getCell(1, 1)
    .addParagraph(new Paragraph("Bar2"))
    .setShading({
        fill: "42c5f4",
        val: ShadingType.PERCENT_95,
        color: "auto",
    });
table
    .getCell(1, 2)
    .addParagraph(new Paragraph("Bar3"))
    .setShading({
        fill: "880aa8",
        val: ShadingType.PERCENT_10,
        color: "e2df0b",
    });
table
    .getCell(1, 3)
    .addParagraph(new Paragraph("Bar4"))
    .setShading({
        fill: "FF0000",
        val: ShadingType.CLEAR,
        color: "auto",
    });

table.getRow(0).mergeCells(0, 3);

doc.addParagraph(new Paragraph("hi"));

table = new Table({
    rows: 2,
    columns: 2,
    width: 100,
    widthUnitType: WidthType.PERCENTAGE,
});

doc.addTable(table);

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
