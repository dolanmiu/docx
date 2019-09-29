// Add image to table cell in a header and body
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Header, Media, Packer, Paragraph, Table, TableCell, TableRow } from "../build";

const doc = new Document();
const image = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));

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
                    children: [new Paragraph(image)],
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
