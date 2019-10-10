// Custom styles using JavaScript configuration
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, UnderlineType } from "../build";

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
                        left: 720,
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
});

doc.addSection({
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
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
