// Chinese text - Chinese text need to use a Chinese font. And ascii text need to use a ascii font.
// Different from the `52-japanese.ts`.
//     `52-japanese.ts` will set all characters to use Japanese font.
//     `53-chinese.ts` will set Chinese characters to use Chinese font, and set ascii characters to use ascii font.

// Note that if the OS have not install `KaiTi` font, this demo doesn't work.

// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "../build";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: {
                    font: {
                        ascii: "Times",
                        eastAsia: "KaiTi",
                    },
                },
            },
        ],
    },
});

doc.addSection({
    children: [
        new Paragraph({
            text: "中文和英文 Chinese and English",
            heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
            text: "中文和英文 Chinese and English",
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: "中文和英文 Chinese and English",
                    font: { eastAsia: "SimSun" },  // set eastAsia to "SimSun".
                    // The ascii characters will use the default font ("Times") specified in paragraphStyles
                }),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
