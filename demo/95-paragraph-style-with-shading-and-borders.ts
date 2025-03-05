import * as fs from "fs";
import { BorderStyle, Document, Packer, Paragraph, TextRun } from "docx";

const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "withSingleBlackBordersAndYellowShading",
                name: "Paragraph Style with Black Borders and Yellow Shading",
                basedOn: "Normal",
                paragraph: {
                    shading: {
                        color: "#fff000",
                        type: "solid",
                    },
                    border: {
                        top: {
                            style: BorderStyle.SINGLE,
                            color: "#000000",
                            size: 4,
                        },
                        bottom: {
                            style: BorderStyle.SINGLE,
                            color: "#000000",
                            size: 4,
                        },
                        left: {
                            style: BorderStyle.SINGLE,
                            color: "#000000",
                            size: 4,
                        },
                        right: {
                            style: BorderStyle.SINGLE,
                            color: "#000000",
                            size: 4,
                        },
                    },
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new Paragraph({
                    style: "withSingleBlackBordersAndYellowShading",
                    children: [
                        new TextRun({
                            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
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
