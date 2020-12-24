// Numbering and bullet points example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, convertInchesToTwip, Document, LevelFormat, Packer, Paragraph } from "../build";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "my-crazy-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.UPPER_ROMAN,
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                    {
                        level: 1,
                        format: LevelFormat.DECIMAL,
                        text: "%2.",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.68) },
                            },
                        },
                    },
                    {
                        level: 2,
                        format: LevelFormat.LOWER_LETTER,
                        text: "%3)",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(1.18) },
                            },
                        },
                    },
                    {
                        level: 3,
                        format: LevelFormat.UPPER_LETTER,
                        text: "%4)",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 2880, hanging: 2420 },
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
        new Paragraph({
            text: "101 MSXFM",
            numbering: {
                reference: "my-crazy-numbering",
                level: 3,
            },
        }),
        new Paragraph({
            text: "back to level 1",
            numbering: {
                reference: "my-crazy-numbering",
                level: 1,
            },
        }),
        new Paragraph({
            text: "back to level 0",
            numbering: {
                reference: "my-crazy-numbering",
                level: 0,
            },
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
