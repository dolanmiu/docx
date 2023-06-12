// Example of how you would create a table with float positions

import * as fs from "fs";
import {
    Document,
    OverlapType,
    Packer,
    Paragraph,
    RelativeHorizontalPosition,
    RelativeVerticalPosition,
    Table,
    TableAnchorType,
    TableCell,
    TableLayoutType,
    TableRow,
    WidthType,
} from "docx";

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
    float: {
        horizontalAnchor: TableAnchorType.MARGIN,
        verticalAnchor: TableAnchorType.MARGIN,
        relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
        relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
        overlap: OverlapType.NEVER,
        leftFromText: 1000,
        rightFromText: 2000,
        topFromText: 1500,
        bottomFromText: 30,
    },
    width: {
        size: 4535,
        type: WidthType.DXA,
    },
    layout: TableLayoutType.FIXED,
});

const doc = new Document({
    sections: [
        {
            children: [table],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
