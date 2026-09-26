// Numbered lists - With complex number text

import * as fs from "fs";
import { Document, Packer, Paragraph, LevelFormat } from "docx";

const doc = new Document({
    numbering: {
        config: [
            {
                reference: "ref1",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1",
                    },
                    {
                        level: 1,
                        format: LevelFormat.DECIMAL,
                        text: "%1.%2",
                    },
                    {
                        level: 2,
                        format: LevelFormat.DECIMAL,
                        text: "%1.%2.%3",
                    },
                ],
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "REF1 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "REF1 - lvl:1",
                    numbering: {
                        reference: "ref1",
                        level: 1,
                    },
                }),
                new Paragraph({
                    text: "REF1  - lvl:2",
                    numbering: {
                        reference: "ref1",
                        level: 2,
                    },
                }),
                new Paragraph({
                    text: "REF1 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "REF1 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "REF1 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "Random text",
                }),
                new Paragraph({
                    text: "REF1 - inst:1 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        instance: 1,
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "REF1 - inst:0 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        instance: 0,
                        level: 0,
                    },
                }),
                new Paragraph({
                    text: "REF1 - inst:0 - lvl:0",
                    numbering: {
                        reference: "ref1",
                        instance: 0,
                        level: 0,
                    },
                }),
            ],
        },
    ],
});

// Used to export the file into a .docx file
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
