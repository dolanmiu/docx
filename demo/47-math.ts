// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, Math, MathDenominator, MathFraction, MathNumerator, MathRun, MathSum, Packer, Paragraph, TextRun } from "../build";

const doc = new Document();

doc.addSection({
    properties: {},
    children: [
        new Paragraph({
            children: [
                new Math({
                    children: [
                        new MathRun("2+2"),
                        new MathFraction({
                            numerator: new MathNumerator("hi"),
                            denominator: new MathDenominator("2"),
                        }),
                    ],
                }),
                new TextRun({
                    text: "Foo Bar",
                    bold: true,
                }),
            ],
        }),
        new Paragraph({
            children: [
                new Math({
                    children: [
                        new MathSum({
                            child: new MathRun("test"),
                        }),
                    ],
                }),
            ],
        }),
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
