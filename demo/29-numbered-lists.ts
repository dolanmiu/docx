// Numbered lists
// The lists can also be restarted by specifying the instance number

import * as fs from "fs";
import { AlignmentType, convertInchesToTwip, Document, HeadingLevel, LevelFormat, Packer, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
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
                ],
                reference: "my-crazy-reference",
            },
            {
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
                reference: "my-number-numbering-reference",
            },
            {
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL_ZERO,
                        text: "[%1]",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                            },
                        },
                    },
                ],
                reference: "padded-numbering-reference",
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "line with contextual spacing",
                    numbering: {
                        reference: "my-crazy-reference",
                        level: 0,
                    },
                    contextualSpacing: true,
                    spacing: {
                        before: 200,
                    },
                }),
                new Paragraph({
                    text: "line with contextual spacing",
                    numbering: {
                        reference: "my-crazy-reference",
                        level: 0,
                    },
                    contextualSpacing: true,
                    spacing: {
                        before: 200,
                    },
                }),
                new Paragraph({
                    text: "line without contextual spacing",
                    numbering: {
                        reference: "my-crazy-reference",
                        level: 0,
                    },
                    contextualSpacing: false,
                    spacing: {
                        before: 200,
                    },
                }),
                new Paragraph({
                    text: "line without contextual spacing",
                    numbering: {
                        reference: "my-crazy-reference",
                        level: 0,
                    },
                    contextualSpacing: false,
                    spacing: {
                        before: 200,
                    },
                }),
                new Paragraph({
                    text: "Step 1 - Add sugar",
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Step 2 - Add wheat",
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Step 3 - Put in oven",
                    numbering: {
                        reference: "my-number-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Next",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                        instance: 2,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                        instance: 2,
                    },
                }),
                new Paragraph({
                    text: "Next",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                        instance: 3,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                        instance: 3,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                        instance: 3,
                    },
                }),
                new Paragraph({
                    text: "Next",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "test",
                    numbering: {
                        reference: "padded-numbering-reference",
                        level: 0,
                    },
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
