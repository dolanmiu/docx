// Example of how you would create a table and add data to it

import * as fs from "fs";
import { BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, VerticalAlign, TextDirection } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Table({
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
                }),
                new Paragraph("Table with borders"),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        bottom: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        left: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        right: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                    },
                                    children: [new Paragraph("Dash small gap border")],
                                }),
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        bottom: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        left: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                        right: {
                                            style: BorderStyle.DASH_SMALL_GAP,
                                            size: 1,
                                            color: "000000",
                                        },
                                    },
                                    children: [new Paragraph("Dash small gap border")],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        bottom: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        left: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        right: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                    },
                                    children: [new Paragraph("Double border")],
                                }),
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        bottom: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        left: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                        right: {
                                            style: BorderStyle.DOUBLE,
                                            size: 1,
                                            color: "ff0000",
                                        },
                                    },
                                    children: [new Paragraph("Double border")],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        bottom: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        left: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        right: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                    },
                                    children: [new Paragraph("Should have no border")],
                                }),
                                new TableCell({
                                    borders: {
                                        top: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        bottom: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        left: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                        right: {
                                            style: BorderStyle.NONE,
                                            size: 0,
                                            color: "ffffff",
                                        },
                                    },
                                    children: [new Paragraph("Should have no border")],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
