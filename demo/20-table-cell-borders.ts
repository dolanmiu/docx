// Add custom borders to table cell
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow } from "../build";

const doc = new Document();

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
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
                    children: [new Paragraph("Hello")],
                    borders: {
                        top: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "red",
                        },
                        bottom: {
                            style: BorderStyle.DOUBLE,
                            size: 3,
                            color: "blue",
                        },
                        left: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "green",
                        },
                        right: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "#ff8000",
                        },
                    },
                }),
                new TableCell({
                    children: [],
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
                    children: [],
                }),
                new TableCell({
                    children: [],
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
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
                new TableCell({
                    children: [],
                }),
            ],
        }),
    ],
});

doc.addSection({ children: [table] });

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
