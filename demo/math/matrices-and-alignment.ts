// Matrices, equations lined up with numbers, cases, and brackets of any characters: LaTeX's pmatrix, bmatrix, vmatrix,
// Vmatrix, align, aligned and cases (issue #2993). See docs/usage/math.md.

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { Math, MathBrackets, MathCases, type MathComponent, MathEquationArray, MathMatrix, MathRun, MathSuperScript } from "docx/math";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

// An equation on a line of its own, centred
const equation = (...children: MathComponent[]): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new Math({ children })] });

const run = (text: string): MathRun => new MathRun(text);
const words = (text: string): MathRun => new MathRun({ text, normalText: true });
const squared = (...children: MathComponent[]): MathSuperScript => new MathSuperScript({ children, superScript: [run("2")] });
const cells = (...rows: readonly string[][]): readonly (readonly MathComponent[])[][] => rows.map((row) => row.map((text) => [run(text)]));

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Matrices and alignment")] }),

                heading("Matrices"),
                new Paragraph("In round brackets (pmatrix), square brackets (bmatrix), bars (vmatrix) and double bars (Vmatrix):"),
                equation(new MathMatrix({ brackets: "round", rows: cells(["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]) })),
                equation(new MathMatrix({ brackets: "square", rows: cells(["1", "2"], ["3", "4"]) })),
                equation(new MathMatrix({ brackets: "verticalBars", rows: cells(["a", "b"], ["c", "d"]) })),
                equation(new MathMatrix({ brackets: "doubleVerticalBars", rows: cells(["a", "b"], ["c", "d"]) })),
                new Paragraph("Columns lined up on the left and on the right, with a shorter row given empty cells:"),
                equation(
                    run("A="),
                    new MathMatrix({
                        brackets: "square",
                        columnAlignment: ["left", "center", "right"],
                        rows: cells(["1", "20", "300"], ["4000", "5", "6"], ["7"]),
                    }),
                ),

                heading("Equations lined up, with numbers"),
                new Paragraph("Lined up at the = sign, each with a number (align):"),
                equation(
                    new MathEquationArray({
                        rows: [
                            { parts: [[run("y")], [run("=mx+b")]], equationNumber: "(1)" },
                            { parts: [[run("y′")], [run("=m")]], equationNumber: "(2)" },
                        ],
                    }),
                ),
                new Paragraph("Parts of one equation lined up (aligned), the rows after the first going on from it:"),
                equation(
                    new MathEquationArray({
                        rows: [
                            {
                                parts: [
                                    [squared(new MathBrackets({ children: [run("a+b")] }))],
                                    [run("="), new MathBrackets({ children: [run("a+b")] }), new MathBrackets({ children: [run("a+b")] })],
                                ],
                            },
                            { parts: [[], [run("="), squared(run("a")), run("+ab+ba+"), squared(run("b"))]] },
                            { parts: [[], [run("="), squared(run("a")), run("+2ab+"), squared(run("b"))]] },
                        ],
                    }),
                ),

                heading("Cases"),
                equation(
                    run("f(x)="),
                    new MathCases({
                        cases: [
                            { value: [run("1,")], condition: [words("if "), run("x>0")] },
                            { value: [run("0,")], condition: [words("if "), run("x=0")] },
                            { value: [run("−1,")], condition: [words("if "), run("x<0")] },
                        ],
                    }),
                ),
                equation(
                    run("f(x)="),
                    new MathCases({
                        cases: [
                            { value: [squared(run("x")), run(",")], condition: [words("if "), run("x≥0")] },
                            { value: [run("−"), squared(run("x")), run(",")], condition: [words("otherwise")] },
                        ],
                    }),
                ),

                heading("Brackets of any characters"),
                equation(
                    new MathBrackets({ open: "|", close: "|", children: [run("x")] }),
                    run(", "),
                    new MathBrackets({ open: "‖", close: "‖", children: [run("v")] }),
                    run(", "),
                    new MathBrackets({ open: "⟨", close: "⟩", separator: "|", items: [[run("a")], [run("b")]] }),
                    run(", "),
                    new MathBrackets({ open: "[", close: ")", children: [run("0,1")] }),
                ),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
