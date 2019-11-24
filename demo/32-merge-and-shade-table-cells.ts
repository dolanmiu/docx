// Example of how you would merge cells together (Rows and Columns) and apply shading
// Also includes an example on how to center tables
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, WidthType } from "../build";

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
    alignment: AlignmentType.CENTER,
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
    width: {
        size: 100,
        type: WidthType.AUTO,
    },
    columnWidths: [1000, 1000, 1000],
});

const table3 = new Table({
    alignment: AlignmentType.CENTER,
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
    width: {
        size: 7000,
        type: WidthType.DXA,
    },
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
                    children: [new Paragraph("0,0")],
                    columnSpan: 2,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("1,0")],
                }),
                new TableCell({
                    children: [new Paragraph("1,1")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("2,0")],
                    columnSpan: 2,
                }),
            ],
        }),
    ],
    width: {
        size: 100,
        type: WidthType.PERCENTAGE,
    },
});

const table5 = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("0,0")],
                }),
                new TableCell({
                    children: [new Paragraph("0,1")],
                    rowSpan: 2,
                }),
                new TableCell({
                    children: [new Paragraph("0,2")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [new Paragraph("1,2")],
                    rowSpan: 2,
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
    width: {
        size: 100,
        type: WidthType.PERCENTAGE,
    },
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
        new Paragraph("Merging columns"),
        table4,
        new Paragraph("More Merging columns"),
        table5,
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
