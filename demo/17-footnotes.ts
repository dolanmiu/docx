// Footnotes

import * as fs from "fs";
import {
    AlignmentType,
    convertInchesToTwip,
    Document,
    FootnoteReferenceRun,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    TextRun,
} from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "footnote-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    footnotes: {
        1: { children: [new Paragraph("Foo"), new Paragraph("Bar")] },
        2: {
            children: [
                new Paragraph("This footnote contains a numbered list:"),
                new Paragraph({
                    text: "First item in the list",
                    numbering: {
                        reference: "footnote-numbering",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Second item in the list",
                    numbering: {
                        reference: "footnote-numbering",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Third item in the list",
                    numbering: {
                        reference: "footnote-numbering",
                        level: 0,
                    },
                }),
            ],
        },
        3: {
            children: [
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
                            text: "It's a cat",
                        }),
                    ],
                }),
            ],
        },
        4: { children: [new Paragraph("Foo1")] },
        5: { children: [new Paragraph("Test1")] },
        6: { children: [new Paragraph("My amazing reference1")] },
    },
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Hello"],
                        }),
                        new FootnoteReferenceRun(1),
                        new TextRun({
                            children: [" World!"],
                        }),
                        new FootnoteReferenceRun(2),
                        new TextRun({
                            children: [" GitHub!"],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World"), new FootnoteReferenceRun(3)],
                }),
            ],
        },
        {
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: ["Hello"],
                        }),
                        new FootnoteReferenceRun(4),
                        new TextRun({
                            children: [" World!"],
                        }),
                        new FootnoteReferenceRun(5),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun("Hello World Again"), new FootnoteReferenceRun(6)],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
