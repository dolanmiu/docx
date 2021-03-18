// Add image to table cell in a header and body
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Header, ImageRun, Packer, Paragraph, Table, TableCell, TableRow } from "../build";

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
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: fs.readFileSync("./demo/images/image1.jpeg"),
                                    transformation: {
                                        width: 100,
                                        height: 100,
                                    },
                                }),
                            ],
                        }),
                    ],
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
            ],
        }),
    ],
});

// Adding same table in the body and in the header
doc.addSection({
    headers: {
        default: new Header({
            children: [table],
        }),
    },
    children: [table],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
