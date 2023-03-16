// Patch a document with patches
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    ExternalHyperlink,
    HeadingLevel,
    ImageRun,
    Paragraph,
    patchDocument,
    PatchType,
    Table,
    TableCell,
    TableRow,
    TextDirection,
    TextRun,
    VerticalAlign,
} from "../build";

patchDocument(fs.readFileSync("demo/assets/simple-template.docx"), {
    patches: {
        name: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
        },
        table_heading_1: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Heading wow!")],
        },
        item_1: {
            type: PatchType.PARAGRAPH,
            children: [
                new TextRun("#657"),
                new ExternalHyperlink({
                    children: [
                        new TextRun({
                            text: "BBC News Link",
                        }),
                    ],
                    link: "https://www.bbc.co.uk/news",
                }),
            ],
        },
        paragraph_replace: {
            type: PatchType.DOCUMENT,
            children: [
                new Paragraph("Lorem ipsum paragraph"),
                new Paragraph("Another paragraph"),
                new Paragraph({
                    children: [
                        new TextRun("This is a "),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "Google Link",
                                }),
                            ],
                            link: "https://www.google.co.uk",
                        }),
                        new ImageRun({ data: fs.readFileSync("./demo/images/dog.png"), transformation: { width: 100, height: 100 } }),
                    ],
                }),
            ],
        },
        header_adjective: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun("Delightful Header")],
        },
        footer_text: {
            type: PatchType.PARAGRAPH,
            children: [
                new TextRun("replaced just as"),
                new TextRun(" well"),
                new ExternalHyperlink({
                    children: [
                        new TextRun({
                            text: "BBC News Link",
                        }),
                    ],
                    link: "https://www.bbc.co.uk/news",
                }),
            ],
        },
        image_test: {
            type: PatchType.PARAGRAPH,
            children: [new ImageRun({ data: fs.readFileSync("./demo/images/image1.jpeg"), transformation: { width: 100, height: 100 } })],
        },
        table: {
            type: PatchType.DOCUMENT,
            children: [
                new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({}), new Paragraph({})],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [new Paragraph({}), new Paragraph({})],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: "bottom to top" }), new Paragraph({})],
                                    textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
                                }),
                                new TableCell({
                                    children: [new Paragraph({ text: "top to bottom" }), new Paragraph({})],
                                    textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT,
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            text: "Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah Blah",
                                            heading: HeadingLevel.HEADING_1,
                                        }),
                                    ],
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            text: "This text should be in the middle of the cell",
                                        }),
                                    ],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            text: "Text above should be vertical from bottom to top",
                                        }),
                                    ],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            text: "Text above should be vertical from top to bottom",
                                        }),
                                    ],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        },
    },
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
