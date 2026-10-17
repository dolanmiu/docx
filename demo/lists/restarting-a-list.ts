// Restart a numbered list after other paragraphs, such as headings, so it counts from 1 again

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, LevelFormat, Packer, Paragraph } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "steps",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.START,
                        style: { paragraph: { indent: { left: 720, hanging: 260 } } },
                    },
                    {
                        level: 1,
                        format: LevelFormat.LOWER_LETTER,
                        text: "%2)",
                        alignment: AlignmentType.START,
                        style: { paragraph: { indent: { left: 1440, hanging: 260 } } },
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({ text: "Ingredients", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Flour (1)", numbering: { reference: "steps", level: 0 } }),
                new Paragraph({ text: "Water (2)", numbering: { reference: "steps", level: 0 } }),
                new Paragraph({ text: "Method", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Mix the flour and water (1 again)", numbering: { reference: "steps", level: 0, restart: true } }),
                new Paragraph({ text: "Slowly (a)", numbering: { reference: "steps", level: 1 } }),
                new Paragraph({ text: "Knead the dough (2)", numbering: { reference: "steps", level: 0 } }),
                new Paragraph({ text: "Serving", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: "Slice the bread (1 again)", numbering: { reference: "steps", level: 0, restart: true } }),
                new Paragraph({ text: "Thickly (a, also restarted)", numbering: { reference: "steps", level: 1 } }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
