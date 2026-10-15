// Example of keeping groups of rows with a cell merged down them on one page, so the table only breaks between groups

import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, VerticalAlignTable } from "docx";

// Enough groups that the table runs over more than one page
const groups = Array.from({ length: 12 }, (_, group) => ({
    name: `Group ${group + 1}`,
    items: Array.from({ length: 3 + (group % 4) }, (__, item) => `Item ${item + 1} of group ${group + 1}`),
}));

const table = new Table({
    rows: groups.flatMap(({ name, items }) =>
        items.map(
            (item, index) =>
                new TableRow({
                    cantSplit: true,
                    // Keep each row with the next, but for the group's last. This keeps the cells docx adds below the
                    // merged cell with the next row too
                    keepNext: index < items.length - 1,
                    children: [
                        ...(index === 0
                            ? [
                                  new TableCell({
                                      rowSpan: items.length,
                                      verticalAlign: VerticalAlignTable.CENTER,
                                      children: [new Paragraph(name)],
                                  }),
                              ]
                            : []),
                        new TableCell({ children: [new Paragraph(item)] }),
                    ],
                }),
        ),
    ),
});

const doc = new Document({
    sections: [
        {
            children: [new Paragraph("Each group stays on one page: the table breaks between groups, never in one."), table],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
