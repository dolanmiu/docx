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
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
