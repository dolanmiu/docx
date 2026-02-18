// Track Revisions for paragraph properties, section properties, tables
// docs/usage/change-tracking.md

import * as fs from "fs";
import {
    BorderStyle,
    Document,
    HeightRule,
    Packer,
    Paragraph,
    Table,
    TableCell,
    AlignmentType,
    TableRow,
    TextRun,
    VerticalAlignTable,
    WidthType,
    DeletedTextRun,
    InsertedTextRun,
} from "docx";

const REVISION_DATE = "2020-10-06T09:00:00Z";
const REVISION_AUTHOR = "Firstname Lastname";

const doc = new Document({
    features: {
        trackRevisions: true,
    },
    sections: [
        {
            properties: {},
            children: [
                // Paragraph properties revision
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: "Heading1",
                    revision: {
                        id: 10,
                        author: REVISION_AUTHOR,
                        date: REVISION_DATE,
                        alignment: AlignmentType.LEFT,
                    },
                    children: [
                        new TextRun({
                            text: "Paragraph properties revision",
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Paragraph({
                    children: [new TextRun({ text: "Table 1: Inserted and Deleted Table Row", bold: true })],
                }),
                new Table({
                    columnWidths: [2000, 2000],
                    layout: "fixed",
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell 1")] }),
                                new TableCell({ children: [new Paragraph("Cell 2")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun("Inserted row cell")],
                                            run: {
                                                insertion: {
                                                    id: 0,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun("Inserted row cell")],
                                            run: {
                                                insertion: {
                                                    id: 0,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                }),
                            ],
                            insertion: {
                                id: 0,
                                author: REVISION_AUTHOR,
                                date: REVISION_DATE,
                            },
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun("Deleted row cell")],
                                            run: {
                                                deletion: {
                                                    id: 1,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun("Deleted row cell")],
                                            run: {
                                                deletion: {
                                                    id: 1,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                }),
                            ],
                            deletion: {
                                id: 1,
                                author: REVISION_AUTHOR,
                                date: REVISION_DATE,
                            },
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Paragraph({
                    children: [new TextRun({ text: "Table 2: Inserted  Table Column", bold: true })],
                }),
                new Table({
                    columnWidths: [2000, 2000],
                    layout: "fixed",
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new InsertedTextRun({
                                                    text: "Inserted cell",
                                                    id: 2,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                }),
                                            ],
                                            run: {
                                                insertion: {
                                                    id: 2,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                    insertion: {
                                        id: 2,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                }),
                                new TableCell({ children: [new Paragraph("Cell")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new InsertedTextRun({
                                                    text: "Inserted cell",
                                                    id: 2,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                }),
                                            ],
                                            run: {
                                                insertion: {
                                                    id: 2,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                    insertion: {
                                        id: 2,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                }),
                                new TableCell({ children: [new Paragraph("Cell")] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Paragraph({
                    children: [new TextRun({ text: "Table 3: Deleted Table Column", bold: true })],
                }),
                new Table({
                    columnWidths: [2000, 2000],
                    layout: "fixed",
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell")] }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new DeletedTextRun({
                                                    text: "Deleted cell",
                                                    id: 3,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                }),
                                            ],
                                            run: {
                                                deletion: {
                                                    id: 3,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                    deletion: {
                                        id: 3,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell")] }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new DeletedTextRun({
                                                    text: "Deleted cell",
                                                    id: 3,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                }),
                                            ],
                                            run: {
                                                deletion: {
                                                    id: 3,
                                                    author: REVISION_AUTHOR,
                                                    date: REVISION_DATE,
                                                },
                                            },
                                        }),
                                    ],
                                    deletion: {
                                        id: 3,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Paragraph({
                    children: [new TextRun({ text: "Table 3: cell properties revision", bold: true })],
                }),
                new Table({
                    columnWidths: [2000, 2000],
                    rows: [
                        new TableRow({
                            height: { value: 600, rule: HeightRule.EXACT },
                            children: [
                                new TableCell({
                                    width: { size: 4000, type: WidthType.DXA },
                                    shading: {
                                        color: "#00FF00",
                                        fill: "#00FF00",
                                    },
                                    verticalAlign: VerticalAlignTable.CENTER,
                                    revision: {
                                        width: { size: 2000, type: WidthType.DXA },
                                        id: 4,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                        verticalAlign: VerticalAlignTable.TOP,
                                    },
                                    children: [new Paragraph("Cell 1")],
                                }),
                                new TableCell({
                                    width: { size: 2000, type: WidthType.DXA },
                                    shading: {
                                        color: "#00FF00",
                                        fill: "#00FF00",
                                    },
                                    revision: {
                                        width: { size: 2000, type: WidthType.DXA },
                                        id: 4,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                    children: [new Paragraph("Cell 2")],
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 4000, type: WidthType.DXA },
                                    revision: {
                                        width: { size: 2000, type: WidthType.DXA },
                                        id: 4,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                    children: [new Paragraph("Cell 3")],
                                }),
                                new TableCell({
                                    width: { size: 2000, type: WidthType.DXA },
                                    revision: {
                                        width: { size: 2000, type: WidthType.DXA },
                                        id: 4,
                                        author: REVISION_AUTHOR,
                                        date: REVISION_DATE,
                                    },
                                    children: [new Paragraph("Cell 4")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Paragraph({
                    children: [new TextRun({ text: "Table 4: row properties revision", bold: true })],
                }),
                new Table({
                    columnWidths: [2000, 2000],
                    layout: "fixed",
                    rows: [
                        new TableRow({
                            cantSplit: true,
                            tableHeader: true,
                            height: { value: 600, rule: HeightRule.EXACT },
                            revision: {
                                id: 5,
                                author: REVISION_AUTHOR,
                                date: REVISION_DATE,
                                tableHeader: false,
                                cantSplit: false,
                            },
                            children: [
                                new TableCell({ children: [new Paragraph("Cell 1")] }),
                                new TableCell({ children: [new Paragraph("Cell 2")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell 3")] }),
                                new TableCell({ children: [new Paragraph("Cell 4")] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),

                new Table({
                    columnWidths: [2000, 2000],
                    borders: {
                        top: {
                            style: BorderStyle.DASHED,
                            size: 5,
                            color: "FF0000",
                        },
                        bottom: {
                            style: BorderStyle.DASHED,
                            size: 5,
                            color: "FF0000",
                        },
                        left: {
                            style: BorderStyle.DASHED,
                            size: 5,
                            color: "FF0000",
                        },
                        right: {
                            style: BorderStyle.DASHED,
                            size: 5,
                            color: "FF0000",
                        },
                    },
                    layout: "fixed",
                    revision: {
                        id: 6,
                        author: REVISION_AUTHOR,
                        date: REVISION_DATE,
                        borders: {
                            top: {
                                style: BorderStyle.DOTTED,
                                size: 3,
                                color: "00FF00",
                            },
                            bottom: {
                                style: BorderStyle.DOTTED,
                                size: 3,
                                color: "00FF00",
                            },
                            left: {
                                style: BorderStyle.DOTTED,
                                size: 3,
                                color: "00FF00",
                            },
                            right: {
                                style: BorderStyle.DOTTED,
                                size: 3,
                                color: "00FF00",
                            },
                        },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell 1")] }),
                                new TableCell({ children: [new Paragraph("Cell 2")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Cell 3")] }),
                                new TableCell({ children: [new Paragraph("Cell 4")] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),
            ],
        },
        // Section properties revision
        {
            properties: {
                page: {
                    size: {
                        height: 11909,
                        width: 16834,
                    },
                    margin: {
                        bottom: 2440,
                        top: 2440,
                        left: 2440,
                        right: 2440,
                    },
                },
                revision: {
                    id: 20,
                    author: REVISION_AUTHOR,
                    date: REVISION_DATE,
                    page: {
                        margin: {
                            bottom: 1440,
                            top: 1440,
                            left: 1440,
                            right: 1440,
                        },
                    },
                },
            },
            children: [new Paragraph({ text: "Paragraph in different section with revision properties" })],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("98-track-revisions-2.docx", buffer);
    console.log("Document created successfully at 98-track-revisions-2.docx");
});
