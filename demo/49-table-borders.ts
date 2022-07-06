// Add custom borders and no-borders to the table itself
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableBorders,
    TableCell,
    TableRow,
    TextDirection,
    VerticalAlign,
} from "../build";

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    borders: {
                        top: {
                            style: BorderStyle.DASH_SMALL_GAP,
                            size: 1,
                            color: "ff0000",
                        },
                        bottom: {
                            style: BorderStyle.DASH_SMALL_GAP,
                            size: 1,
                            color: "ff0000",
                        },
                        left: {
                            style: BorderStyle.DASH_SMALL_GAP,
                            size: 1,
                            color: "ff0000",
                        },
                        right: {
                            style: BorderStyle.DASH_SMALL_GAP,
                            size: 1,
                            color: "ff0000",
                        },
                    },
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

// Using the no-border convenience object. It is the same as writing this manually:
// const borders = {
//     top: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
//     bottom: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
//     left: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
//     right: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
//     insideHorizontal: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
//     insideVertical: {
//         style: BorderStyle.NONE,
//         size: 0,
//         color: "auto",
//     },
// };
const noBorderTable = new Table({
    borders: TableBorders.NONE,
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({}), new Paragraph({})],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    children: [new Paragraph({}), new Paragraph({})],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    children: [new Paragraph({ text: "bottom to top" }), new Paragraph({})],
                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                }),
                new TableCell({
                    children: [new Paragraph({ text: "top to bottom" }), new Paragraph({})],
                    textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah",
                            heading: HeadingLevel.HEADING_1,
                        }),
                    ],
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "This text should be in the middle of the cell",
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "Text above should be vertical from bottom to top",
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "Text above should be vertical from top to bottom",
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [{ children: [table, new Paragraph("Hello"), noBorderTable] }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
