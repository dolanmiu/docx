// Creates two paragraphs, one with a border and one without
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { BorderStyle, Document, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph("No border!"),
                new Paragraph({
                    text: "I have borders on my top and bottom sides!",
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                        bottom: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                }),
                new Paragraph({
                    text: "",
                    border: {
                        top: {
                            color: "auto",
                            space: 1,
                            style: BorderStyle.SINGLE,
                            size: 6,
                        },
                    },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "This will ",
                        }),
                        new TextRun({
                            text: "have a border.",
                            border: {
                                color: "auto",
                                space: 1,
                                style: BorderStyle.SINGLE,
                                size: 6,
                            },
                        }),
                        new TextRun({
                            text: " This will not.",
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
