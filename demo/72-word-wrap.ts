// Example on how to preserve word wrap text. Works with all languages.

import * as fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    wordWrap: true,
                    children: [
                        new TextRun("我今天遛狗去公园"),
                        new TextRun({
                            text: "456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345",
                        }),
                    ],
                }),
                new Paragraph({
                    wordWrap: true,
                    children: [
                        new TextRun(
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
                        ),
                        new TextRun({
                            text: "456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("我今天遛狗去公园"),
                        new TextRun({
                            text: "456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun(
                            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
                        ),
                        new TextRun({
                            text: "456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345456435234523456435564745673456345",
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
