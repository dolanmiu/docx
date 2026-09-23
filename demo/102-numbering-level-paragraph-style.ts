import * as fs from "fs";
import { AlignmentType, Document, LevelFormat, Packer, Paragraph } from "docx";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "numberedListParagraph",
                name: "Numbered List Paragraph",
                paragraph: {
                    numbering: {
                        reference: "styled-numbering",
                        level: 0,
                    },
                    spacing: {
                        after: 120,
                    },
                },
            },
        ],
    },
    numbering: {
        config: [
            {
                reference: "styled-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: {
                            style: "numberedListParagraph",
                            paragraph: {
                                indent: {
                                    left: 720,
                                    hanging: 260,
                                },
                            },
                        },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "First styled list item",
                    style: "numberedListParagraph",
                }),
                new Paragraph({
                    text: "Second styled list item",
                    style: "numberedListParagraph",
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
