// This demo shows right to left for special languages

import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: "שלום עולם",
                            rightToLeft: true,
                        }),
                    ],
                }),
                new Paragraph({
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: "שלום עולם",
                            bold: true,
                            rightToLeft: true,
                        }),
                    ],
                }),
                new Paragraph({
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: "שלום עולם",
                            italics: true,
                            rightToLeft: true,
                        }),
                    ],
                }),
                new Table({
                    visuallyRightToLeft: true,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("שלום עולם")],
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
                                    children: [new Paragraph("שלום עולם")],
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
