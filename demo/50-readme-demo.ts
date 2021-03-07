// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Media, Packer, Paragraph, Table, TableCell, TableRow, VerticalAlign } from "../build";

const doc = new Document();

const image1 = Media.addImage(doc, fs.readFileSync("./demo/images/image1.jpeg"));
const image2 = Media.addImage(doc, fs.readFileSync("./demo/images/pizza.gif"));

const table = new Table({
    rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph(image1)],
                    verticalAlign: VerticalAlign.CENTER,
                }),
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "Hello",
                            heading: HeadingLevel.HEADING_1,
                        }),
                    ],
                    verticalAlign: VerticalAlign.CENTER,
                }),
            ],
        }),
        new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            text: "World",
                            heading: HeadingLevel.HEADING_1,
                        }),
                    ],
                }),
                new TableCell({
                    children: [new Paragraph(image1)],
                }),
            ],
        }),
    ],
});

doc.addSection({
    children: [
        new Paragraph({
            text: "Hello World",
            heading: HeadingLevel.HEADING_1,
        }),
        table,
        new Paragraph(image2),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
