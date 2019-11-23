// Numbered lists
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { AlignmentType, Document, Packer, Paragraph } from "../build";

const doc = new Document({
    numbering: {
        config: [
            {
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
                ],
                reference: "my-crazy-reference",
            },
            {
                levels: [
                    {
                        level: 0,
                        format: "decimal",
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 720, hanging: 260 },
                            },
                        },
                    },
                ],
                reference: "my-number-numbering-reference",
            },
        ],
    },
});

doc.addSection({
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
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
