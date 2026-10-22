// Draw diagonal lines across table cells, such as a header cell split into a label for the columns and one for the rows

import * as fs from "fs";
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow } from "docx";

const cell = (text: string) => new TableCell({ children: [new Paragraph(text)] });

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("A header cell split by a diagonal down border:"),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ text: "Subject", alignment: AlignmentType.RIGHT }),
                                        new Paragraph("Student"),
                                    ],
                                    borders: {
                                        diagonalDown: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                                    },
                                }),
                                cell("Maths"),
                                cell("Physics"),
                            ],
                        }),
                        new TableRow({ children: [cell("Ada"), cell("92"), cell("88")] }),
                        new TableRow({ children: [cell("Grace"), cell("85"), cell("91")] }),
                    ],
                    columnWidths: [2400, 1600, 1600],
                }),
                new Paragraph("Both diagonals, crossing out a cell merged across two columns and two rows:"),
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [],
                                    columnSpan: 2,
                                    rowSpan: 2,
                                    borders: {
                                        diagonalDown: { style: BorderStyle.SINGLE, size: 8, color: "C00000" },
                                        diagonalUp: { style: BorderStyle.DASHED, size: 8, color: "0070C0" },
                                    },
                                }),
                                cell("Open"),
                            ],
                        }),
                        new TableRow({ children: [cell("Open")] }),
                        new TableRow({ children: [cell("Open"), cell("Open"), cell("Open")] }),
                    ],
                    columnWidths: [1600, 1600, 1600],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
