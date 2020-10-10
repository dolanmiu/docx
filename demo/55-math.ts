// Simple example to add text to a document
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    Document,
    Math,
    MathAngledBrackets,
    MathCurlyBrackets,
    MathDenominator,
    MathFraction,
    MathFunction,
    MathNumerator,
    MathPreSubSuperScript,
    MathRadical,
    MathRoundBrackets,
    MathRun,
    MathSquareBrackets,
    MathSubScript,
    MathSubSuperScript,
    MathSum,
    MathSuperScript,
    Packer,
    Paragraph,
    TextRun,
} from "../build";

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
                        new MathSum({
                            child: new MathSuperScript({
                                child: new MathRun("e"),
                                superScript: new MathRun("2"),
                            }),
                            subScript: new MathRun("i"),
                        }),
                        new MathSum({
                            child: new MathRadical({
                                child: new MathRun("i"),
                            }),
                            subScript: new MathRun("i"),
                            superScript: new MathRun("10"),
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
                            child: new MathRun("test"),
                            superScript: new MathRun("hello"),
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
                            child: new MathRun("test"),
                            subScript: new MathRun("hello"),
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
                            child: new MathRun("x"),
                            subScript: new MathSuperScript({
                                child: new MathRun("y"),
                                superScript: new MathRun("2"),
                            }),
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
                            child: new MathRun("test"),
                            superScript: new MathRun("hello"),
                            subScript: new MathRun("world"),
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
                            child: new MathRun("test"),
                            superScript: new MathRun("hello"),
                            subScript: new MathRun("world"),
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
                            child: new MathFraction({
                                numerator: new MathNumerator("1"),
                                denominator: new MathDenominator("2"),
                            }),
                            subScript: new MathRun("4"),
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
                            child: new MathRadical({
                                child: new MathFraction({
                                    numerator: new MathNumerator("1"),
                                    denominator: new MathDenominator("2"),
                                }),
                                degree: new MathRun("4"),
                            }),
                            subScript: new MathRun("x"),
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
                            child: new MathRun("4"),
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
                            name: new MathSuperScript({
                                child: new MathRun("cos"),
                                superScript: new MathRun("-1"),
                            }),
                            child: new MathRun("100"),
                        }),
                        new MathRun("×"),
                        new MathFunction({
                            name: new MathRun("sin"),
                            child: new MathRun("360"),
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
                            child: new MathFraction({
                                numerator: new MathNumerator("1"),
                                denominator: new MathDenominator("2"),
                            }),
                        }),
                        new MathSquareBrackets({
                            child: new MathFraction({
                                numerator: new MathNumerator("1"),
                                denominator: new MathDenominator("2"),
                            }),
                        }),
                        new MathCurlyBrackets({
                            child: new MathFraction({
                                numerator: new MathNumerator("1"),
                                denominator: new MathDenominator("2"),
                            }),
                        }),
                        new MathAngledBrackets({
                            child: new MathFraction({
                                numerator: new MathNumerator("1"),
                                denominator: new MathDenominator("2"),
                            }),
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
                            numerator: new Math({
                                children: [
                                    new MathRadical({
                                        child: new MathRun("4"),
                                    }),
                                ],
                            }),
                            demoninator: new MathRun("2a"),
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
