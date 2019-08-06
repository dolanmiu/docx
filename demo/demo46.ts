import * as fs from "fs";
import { AlignmentType, Document, Header, Packer, Paragraph, ShadingType, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    headers: {
        default: new Header({
            children: [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: "Hello World",
                            color: "red",
                            bold: true,
                            size: 24,
                            font: {
                                name: "Garamond",
                            },
                            shadow: {
                                type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                                color: "00FFFF",
                                fill: "FF0000",
                            },
                        }),
                    ],
                }),
            ],
        }),
    },
    children: [],
});

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
