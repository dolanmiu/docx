// Tables with percentage widths that render the same in Word, Google Docs and Apple Pages.
// The grid (w:tblGrid) is derived from the table and cell widths against the actual page size,
// so readers that lay tables out from the grid alone no longer collapse the columns (#1457).

import * as fs from "fs";
import { Document, PageOrientation, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const percentageTable = (): Table =>
    new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ width: { size: 90, type: WidthType.PERCENTAGE }, children: [new Paragraph("Hello")] }),
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [] }),
                ],
            }),
            new TableRow({
                children: [
                    new TableCell({ width: { size: 90, type: WidthType.PERCENTAGE }, children: [] }),
                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph("World")] }),
                ],
            }),
        ],
    });

const halfWidthTable = new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph("Half of the page")] }),
                new TableCell({ children: [new Paragraph("split equally")] }),
                new TableCell({ children: [new Paragraph("in three")] }),
            ],
        }),
    ],
});

const nestedTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
        new TableRow({
            children: [
                new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph("30%")] }),
                new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph("70%, containing a nested 100% table:"),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("nested 1")] }),
                                        new TableCell({ children: [new Paragraph("nested 2")] }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("100% table with 90% / 10% cells"),
                percentageTable(),
                new Paragraph("50% table, three equal columns"),
                halfWidthTable,
                new Paragraph("30% / 70% table with a nested table"),
                nestedTable,
            ],
        },
        {
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [new Paragraph("The same 100% table on a landscape page"), percentageTable()],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
