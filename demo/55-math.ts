// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    Math,
    MathAngledBrackets,
    MathCurlyBrackets,
    MathFraction,
    MathFunction,
    MathPreSubSuperScript,
    MathRadical,
    MathRoundBrackets,
    MathRun,
    MathSquareBrackets,
    MathSubScript,
    MathSubSuperScript,
    MathSum,
    MathIntegral,
    MathSuperScript,
    Packer,
    Paragraph,
    TextRun,
} from "../build";

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRun("2+2"),
                                new MathFraction({
                                    numerator: [new MathRun("hi")],
                                    denominator: [new MathRun("2")],
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
                                new MathFraction({
                                    numerator: [
                                        new MathRun("1"),
                                        new MathRadical({
                                            children: [new MathRun("2")],
                                        }),
                                    ],
                                    denominator: [new MathRun("2")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSum({
                                    children: [new MathRun("test")],
                                }),
                                new MathSum({
                                    children: [
                                        new MathSuperScript({
                                            children: [new MathRun("e")],
                                            superScript: [new MathRun("2")],
                                        }),
                                    ],
                                    subScript: [new MathRun("i")],
                                }),
                                new MathSum({
                                    children: [
                                        new MathRadical({
                                            children: [new MathRun("i")],
                                        }),
                                    ],
                                    subScript: [new MathRun("i")],
                                    superScript: [new MathRun("10")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathIntegral({
                                    children: [new MathRun("test")],
                                }),
                                new MathIntegral({
                                    children: [
                                        new MathSuperScript({
                                            children: [new MathRun("e")],
                                            superScript: [new MathRun("2")],
                                        }),
                                    ],
                                    subScript: [new MathRun("i")],
                                }),
                                new MathIntegral({
                                    children: [
                                        new MathRadical({
                                            children: [new MathRun("i")],
                                        }),
                                    ],
                                    subScript: [new MathRun("i")],
                                    superScript: [new MathRun("10")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSuperScript({
                                    children: [new MathRun("test")],
                                    superScript: [new MathRun("hello")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubScript({
                                    children: [new MathRun("test")],
                                    subScript: [new MathRun("hello")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubScript({
                                    children: [new MathRun("x")],
                                    subScript: [
                                        new MathSuperScript({
                                            children: [new MathRun("y")],
                                            superScript: [new MathRun("2")],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubSuperScript({
                                    children: [new MathRun("test")],
                                    superScript: [new MathRun("hello")],
                                    subScript: [new MathRun("world")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathPreSubSuperScript({
                                    children: [new MathRun("test")],
                                    superScript: [new MathRun("hello")],
                                    subScript: [new MathRun("world")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubScript({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
                                    subScript: [new MathRun("4")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathSubScript({
                                    children: [
                                        new MathRadical({
                                            children: [
                                                new MathFraction({
                                                    numerator: [new MathRun("1")],
                                                    denominator: [new MathRun("2")],
                                                }),
                                            ],
                                            degree: [new MathRun("4")],
                                        }),
                                    ],
                                    subScript: [new MathRun("x")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRadical({
                                    children: [new MathRun("4")],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFunction({
                                    name: [
                                        new MathSuperScript({
                                            children: [new MathRun("cos")],
                                            superScript: [new MathRun("-1")],
                                        }),
                                    ],
                                    children: [new MathRun("100")],
                                }),
                                new MathRun("×"),
                                new MathFunction({
                                    name: [new MathRun("sin")],
                                    children: [new MathRun("360")],
                                }),
                                new MathRun("= x"),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathRoundBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
                                }),
                                new MathSquareBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
                                }),
                                new MathCurlyBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
                                }),
                                new MathAngledBrackets({
                                    children: [
                                        new MathFraction({
                                            numerator: [new MathRun("1")],
                                            denominator: [new MathRun("2")],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new Math({
                            children: [
                                new MathFraction({
                                    numerator: [
                                        new MathRadical({
                                            children: [new MathRun("4")],
                                        }),
                                    ],
                                    denominator: [new MathRun("2a")],
                                }),
                            ],
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
