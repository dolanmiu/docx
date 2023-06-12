// Example of how you would create a table and add data to it

import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const table = new Table({
    columnWidths: [3505, 5505],
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    width: {
                        size: 3505,
                        type: WidthType.DXA,
                    },
                    children: [new Paragraph("Hello")],
                }),
                new TableCell({
                    width: {
                        size: 5505,
                        type: WidthType.DXA,
                    },
                    children: [],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    width: {
                        size: 3505,
                        type: WidthType.DXA,
                    },
                    children: [],
                }),
                new TableCell({
                    width: {
                        size: 5505,
                        type: WidthType.DXA,
                    },
                    children: [new Paragraph("World")],
                }),
            ],
        }),
    ],
});

const table2 = new Table({
    columnWidths: [4505, 4505],
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    width: {
                        size: 4505,
                        type: WidthType.DXA,
                    },
                    children: [new Paragraph("Hello")],
                }),
                new TableCell({
                    width: {
                        size: 4505,
                        type: WidthType.DXA,
                    },
                    children: [],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    width: {
                        size: 4505,
                        type: WidthType.DXA,
                    },
                    children: [],
                }),
                new TableCell({
                    width: {
                        size: 4505,
                        type: WidthType.DXA,
                    },
                    children: [new Paragraph("World")],
                }),
            ],
        }),
    ],
});

const table3 = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Hello")],
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
                    children: [new Paragraph("World")],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ text: "Table with skewed widths" }),
                table,
                new Paragraph({ text: "Table with equal widths" }),
                table2,
                new Paragraph({ text: "Table without setting widths" }),
                table3,
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
