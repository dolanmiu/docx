// Custom styles using JavaScript configuration

import * as fs from "fs";
import { Document, convertInchesToTwip, HeadingLevel, Packer, Paragraph, UnderlineType } from "docx";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "myWonkyStyle",
                name: "My Wonky Style",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    color: "990000",
                    italics: true,
                },
                paragraph: {
                    indent: {
                        left: convertInchesToTwip(0.5),
                    },
                    spacing: {
                        line: 276,
                    },
                },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    bold: true,
                    size: 26,
                    underline: {
                        type: UnderlineType.DOUBLE,
                        color: "FF0000",
                    },
                },
                paragraph: {
                    spacing: {
                        before: 240,
                        after: 120,
                    },
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Hello",
                    style: "myWonkyStyle",
                }),
                new Paragraph({
                    text: "World",
                    heading: HeadingLevel.HEADING_2,
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
