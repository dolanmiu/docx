// Example of how you would create a table and add data to it

import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";

const styles = fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8");

// Create a table and pass the XML Style
const table = new Table({
    style: "MyCustomTableStyle",
    width: {
        size: 9070,
        type: WidthType.DXA,
    },
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Header Colum 1")],
                }),
                new TableCell({
                    children: [new Paragraph("Header Colum 2")],
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph("Column Content 3")],
                }),
                new TableCell({
                    children: [new Paragraph("Column Content 2")],
                }),
            ],
        }),
    ],
});

const doc = new Document({
    title: "Title",
    externalStyles: styles,
    sections: [
        {
            children: [table],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
