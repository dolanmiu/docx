// Example of how you would merge cells together - Rows and Columns
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, WidthType } from "../build";

const doc = new Document();

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Hello")],
                    columnSpan: 2,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
            ],
        }),
    ],
});

const table2 = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("World")],
                    margins: {
                        top: 1000,
                        bottom: 1000,
                        left: 1000,
                        right: 1000,
                    },
                    columnSpan: 3,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
            ],
        }),
    ],
    width: 100,
    widthUnitType: WidthType.AUTO,
    columnWidths: [1000, 1000, 1000],
});

const table3 = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Foo")],
                }),
                new TableCell({
                    children: [new Paragraph("v")],
                    columnSpan: 3,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Bar1")],
                    shading: {
                        fill: "b79c2f",
                        val: ShadingType.REVERSE_DIAGONAL_STRIPE,
                        color: "auto",
                    },
                }),
                new TableCell({
                    children: [new Paragraph("Bar2")],
                    shading: {
                        fill: "42c5f4",
                        val: ShadingType.PERCENT_95,
                        color: "auto",
                    },
                }),
                new TableCell({
                    children: [new Paragraph("Bar3")],
                    shading: {
                        fill: "880aa8",
                        val: ShadingType.PERCENT_10,
                        color: "e2df0b",
                    },
                }),
                new TableCell({
                    children: [new Paragraph("Bar4")],
                    shading: {
                        fill: "FF0000",
                        val: ShadingType.CLEAR,
                        color: "auto",
                    },
                }),
            ],
        }),
    ],
    width: 7000,
    widthUnitType: WidthType.DXA,
    margins: {
        top: 400,
        bottom: 400,
        right: 400,
        left: 400,
    },
});

const table4 = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
            ],
        }),
    ],
    width: 100,
    widthUnitType: WidthType.PERCENTAGE,
});

doc.addSection({
    children: [
        table,
        new Paragraph({
            text: "Another table",
            heading: HeadingLevel.HEADING_2,
        }),
        table2,
        new Paragraph({
            text: "Another table",
            heading: HeadingLevel.HEADING_2,
        }),
        table3,
        new Paragraph("hi"),
        table4,
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
