// Example of how you would create a table with float positions
// Import from 'docx' rather than '../build' if you install from npm
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
} from "../build";

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
    float: {
        horizontalAnchor: TableAnchorType.MARGIN,
        verticalAnchor: TableAnchorType.MARGIN,
        relativeHorizontalPosition: RelativeHorizontalPosition.RIGHT,
        relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
        overlap: OverlapType.NEVER,
    },
    width: {
        size: 4535,
        type: WidthType.DXA,
    },
    layout: TableLayoutType.FIXED,
});

doc.addSection({
    children: [table],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
