// Example of using tab stops

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TabStopPosition, TabStopType, TextRun } from "docx";

const columnWidth = TabStopPosition.MAX / 4;
const receiptTabStops = [
    // no need to define first left tab column
    // the right aligned tab column position should point to the end of column
    // i.e. in this case
    // (end position of 1st) + (end position of current)
    // columnWidth + columnWidth = columnWidth * 2

    { type: TabStopType.RIGHT, position: columnWidth * 2 },
    { type: TabStopType.RIGHT, position: columnWidth * 3 },
    { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
];
const twoTabStops = [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }];

const doc = new Document({
    defaultTabStop: 0,
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("Receipt 001")],
                }),
                new Paragraph({
                    tabStops: twoTabStops,
                    children: [
                        new TextRun({
                            text: "To Bob.\tBy Alice.",
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    tabStops: twoTabStops,
                    children: [new TextRun("Foo Inc\tBar Inc")],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    tabStops: receiptTabStops,

                    children: [
                        new TextRun({
                            text: "Item\tPrice\tQuantity\tSub-total",
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    tabStops: receiptTabStops,
                    text: "Item 3\t10\t5\t50",
                }),
                new Paragraph({
                    tabStops: receiptTabStops,
                    text: "Item 3\t10\t5\t50",
                }),
                new Paragraph({
                    tabStops: receiptTabStops,
                    text: "Item 3\t10\t5\t50",
                }),
                new Paragraph({
                    tabStops: receiptTabStops,
                    children: [
                        new TextRun({
                            text: "\t\t\tTotal: 200",
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});

const stream = Packer.toStream(doc);
stream.pipe(fs.createWriteStream("My Document.docx"));
