/**
 * How the margins of a cell merged down rows size the rows below its first, in docx's default document. Each table has
 * margins of 720 on every side, a cell merged down two rows on the left, shaded to show it, and a cell without margins
 * on the right of its second row.
 *
 * A: the merge made with rowSpan, so docx adds the cell below, which has the table's margins
 * B: the merge made by hand with verticalMerge, the cell below with the table's margins, as A
 * C: as B, the cell below with no margins
 *
 * Word made the second row of A and B as tall as the first, the margins above and below and a line, and the second row of
 * C a line. In C, it drew the merged cell's shading about 720 below the table.
 */
// cspell:ignore DDEEFF
import * as fs from "fs";

import { Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, VerticalMergeType } from "docx";

const none = { top: 0, bottom: 0, left: 0, right: 0 };
const shade = { type: ShadingType.CLEAR, fill: "DDEEFF", color: "auto" };
const table = (kind: "rowSpan" | "byHand" | "byHandNoMargins"): Table =>
    new Table({
        margins: { top: 720, bottom: 720, left: 720, right: 720 },
        rows: [
            new TableRow({
                children: [
                    kind === "rowSpan"
                        ? new TableCell({ rowSpan: 2, shading: shade, children: [new Paragraph("I like big margins")] })
                        : new TableCell({
                              verticalMerge: VerticalMergeType.RESTART,
                              shading: shade,
                              children: [new Paragraph("I like big margins")],
                          }),
                    new TableCell({ children: [new Paragraph("Not gonna lie")] }),
                ],
            }),
            new TableRow({
                children: [
                    ...(kind === "rowSpan"
                        ? []
                        : [
                              new TableCell({
                                  verticalMerge: VerticalMergeType.CONTINUE,
                                  shading: shade,
                                  ...(kind === "byHandNoMargins" ? { margins: none } : {}),
                                  children: [],
                              }),
                          ]),
                    new TableCell({ margins: none, children: [new Paragraph("No margins plz")] }),
                ],
            }),
        ],
    });

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("A: rowSpan"),
                table("rowSpan"),
                new Paragraph("B: by hand, continuation cell with the table's margins"),
                table("byHand"),
                new Paragraph("C: by hand, continuation cell with no margins"),
                table("byHandNoMargins"),
            ],
        },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-merged-cell-margins.docx", buffer));
