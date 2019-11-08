// Numbering and bullet points example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, Paragraph } from "../build";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-crazy-numbering",
                levels: [
                    {
                        level: 0,
                        format: "upperRoman",
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 260 },
                            },
                        },
                    },
                    {
                        level: 1,
                        format: "decimal",
                        text: "%2.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 1440, hanging: 980 },
                            },
                        },
                    },
                    {
                        level: 2,
                        format: "lowerLetter",
                        text: "%3)",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 2160, hanging: 1700 },
                            },
                        },
                    },
                ],
            },
        ],
    },
});

doc.addSection({
    children: [
        new Paragraph({
            text: "Hey you",
            numbering: {
                reference: "my-crazy-numbering",
                level: 0,
            },
        }),
        new Paragraph({
            text: "What's up fam",
            numbering: {
                reference: "my-crazy-numbering",
                level: 1,
            },
        }),
        new Paragraph({
            text: "Hello World 2",
            numbering: {
                reference: "my-crazy-numbering",
                level: 1,
            },
        }),
        new Paragraph({
            text: "Yeah boi",
            numbering: {
                reference: "my-crazy-numbering",
                level: 2,
            },
        }),
        new Paragraph({
            text: "Hey you",
            bullet: {
                level: 0,
            },
        }),
        new Paragraph({
            text: "What's up fam",
            bullet: {
                level: 1,
            },
        }),
        new Paragraph({
            text: "Hello World 2",
            bullet: {
                level: 2,
            },
        }),
        new Paragraph({
            text: "Yeah boi",
            bullet: {
                level: 3,
            },
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
