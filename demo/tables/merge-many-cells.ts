// Multiple cells merging in the same table - Rows and Columns

import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("0,0")],
                }),
                new TableCell({
                    children: [new Paragraph("0,1")],
                    columnSpan: 2,
                }),
                new TableCell({
                    children: [new Paragraph("0,3")],
                }),
                new TableCell({
                    children: [new Paragraph("0,4")],
                    columnSpan: 2,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("1,0")],
                    columnSpan: 2,
                }),
                new TableCell({
                    children: [new Paragraph("1,2")],
                    columnSpan: 2,
                }),
                new TableCell({
                    children: [new Paragraph("1,4")],
                    columnSpan: 2,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("2,0")],
                }),
                new TableCell({
                    children: [new Paragraph("2,1")],
                    columnSpan: 2,
                }),
                new TableCell({
                    children: [new Paragraph("2,3")],
                }),
                new TableCell({
                    children: [new Paragraph("2,4")],
                    columnSpan: 2,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("3,0")],
                }),
                new TableCell({
                    children: [new Paragraph("3,1")],
                }),
                new TableCell({
                    children: [new Paragraph("3,2")],
                }),
                new TableCell({
                    children: [new Paragraph("3,3")],
                }),
                new TableCell({
                    children: [new Paragraph("3,4")],
                }),
                new TableCell({
                    children: [new Paragraph("3,5")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("4,0")],
                    columnSpan: 5,
                }),
                new TableCell({
                    children: [new Paragraph("4,5")],
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
});

const table2 = new Table({
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
                new TableCell({
                    children: [new Paragraph("0,3")],
                }),
                new TableCell({
                    children: [new Paragraph("0,4")],
                }),
                new TableCell({
                    children: [new Paragraph("0,5")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("1,0")],
                }),
                new TableCell({
                    children: [new Paragraph("1,2")],
                }),
                new TableCell({
                    children: [new Paragraph("1,3")],
                }),
                new TableCell({
                    children: [new Paragraph("1,4")],
                }),
                new TableCell({
                    children: [new Paragraph("1,5")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("2,0")],
                }),
                new TableCell({
                    children: [new Paragraph("2,1")],
                }),
                new TableCell({
                    children: [new Paragraph("2,2")],
                }),
                new TableCell({
                    children: [new Paragraph("2,3")],
                }),
                new TableCell({
                    children: [new Paragraph("2,4")],
                }),
                new TableCell({
                    children: [new Paragraph("2,5")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("3,0")],
                }),
                new TableCell({
                    children: [new Paragraph("3,1")],
                }),
                new TableCell({
                    children: [new Paragraph("3,2")],
                }),
                new TableCell({
                    children: [new Paragraph("3,3")],
                }),
                new TableCell({
                    children: [new Paragraph("3,4")],
                }),
                new TableCell({
                    children: [new Paragraph("3,5")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("4,0")],
                }),
                new TableCell({
                    children: [new Paragraph("4,1")],
                }),
                new TableCell({
                    children: [new Paragraph("4,2")],
                }),
                new TableCell({
                    children: [new Paragraph("4,3")],
                }),
                new TableCell({
                    children: [new Paragraph("4,4")],
                }),
                new TableCell({
                    children: [new Paragraph("4,5")],
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
});

const doc = new Document({
    sections: [
        {
            children: [table, new Paragraph(""), table2],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
