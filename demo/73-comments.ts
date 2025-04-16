// Simple example to add comments to a document

import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun, CommentRangeStart, CommentRangeEnd, CommentReference, ImageRun } from "docx";

const doc = new Document({
    comments: {
        children: [
            {
                id: 0,
                author: "Ray Chen",
                date: new Date(),
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "some initial text content",
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new ImageRun({
                                type: "jpg",
                                data: fs.readFileSync("./demo/images/cat.jpg"),
                                transformation: {
                                    width: 100,
                                    height: 100,
                                },
                            }),
                            new TextRun({
                                text: "comment text content",
                            }),
                            new TextRun({ text: "", break: 1 }),
                            new TextRun({
                                text: "More text here",
                                bold: true,
                            }),
                        ],
                    }),
                ],
            },
            {
                id: 1,
                author: "Bob Ross",
                date: new Date(),
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Some initial text content",
                            }),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "comment text content",
                            }),
                        ],
                    }),
                ],
            },
            {
                id: 2,
                author: "John Doe",
                date: new Date(),
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Hello World",
                            }),
                        ],
                    }),
                ],
            },
            {
                id: 3,
                author: "Beatriz",
                date: new Date(),
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Another reply",
                            }),
                        ],
                    }),
                ],
            },
        ],
    },
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("Hello World"),
                        new CommentRangeStart(0),
                        new TextRun({
                            text: "Foo Bar",
                            bold: true,
                        }),
                        new CommentRangeEnd(0),
                        new TextRun({
                            children: [new CommentReference(0)],
                            bold: true,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new CommentRangeStart(1),
                        new CommentRangeStart(2),
                        new CommentRangeStart(3),
                        new TextRun({
                            text: "Some text which need commenting",
                            bold: true,
                        }),
                        new CommentRangeEnd(1),
                        new TextRun({
                            children: [new CommentReference(1)],
                            bold: true,
                        }),
                        new CommentRangeEnd(2),
                        new TextRun({
                            children: [new CommentReference(2)],
                            bold: true,
                        }),
                        new CommentRangeEnd(3),
                        new TextRun({
                            children: [new CommentReference(3)],
                            bold: true,
                        }),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
