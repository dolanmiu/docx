// Inline shapes: bars, rules and signature lines drawn in the flow of text (#257).
// Each shape is a ShapeRun, so it sits in a paragraph like any other run.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { ShapeRun } from "docx/shapes";

// A solid black bar, like the blanks on a printed form
const bar = (width: number, height = 4): ShapeRun =>
    new ShapeRun({ type: "rectangle", transformation: { width, height }, fill: "000000", line: "none" });

// A thin line to sign or write on
const writingLine = (width: number): ShapeRun =>
    new ShapeRun({ type: "line", transformation: { width, height: 0 }, line: { width: 0.75 } });

const cell = (children: readonly (ShapeRun | TextRun)[]): TableCell =>
    new TableCell({ children: [new Paragraph({ children: [...children] })] });

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Membership application")] }),

                // A rule across the full width of the text
                new Paragraph({ children: [bar(600, 3)] }),

                new Paragraph({ spacing: { before: 240 }, children: [new TextRun("Full name: "), bar(400)] }),
                new Paragraph({
                    spacing: { before: 240 },
                    children: [new TextRun("Date of birth: "), bar(140), new TextRun("    Nationality: "), bar(170)],
                }),
                new Paragraph({ spacing: { before: 240 }, children: [new TextRun("Email: "), bar(250, 2)] }),

                // A taller bar hides text, as in a redacted document
                new Paragraph({
                    spacing: { before: 480 },
                    children: [
                        new TextRun("The account holder, "),
                        new ShapeRun({ type: "rectangle", transformation: { width: 120, height: 14 }, fill: "000000", line: "none" }),
                        new TextRun(", agreed to the terms on "),
                        new ShapeRun({ type: "rectangle", transformation: { width: 70, height: 14 }, fill: "000000", line: "none" }),
                        new TextRun("."),
                    ],
                }),

                new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: "Previous addresses", bold: true })] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                cell([new TextRun({ text: "Address", bold: true })]),
                                cell([new TextRun({ text: "Years", bold: true })]),
                            ],
                        }),
                        new TableRow({ children: [cell([bar(380)]), cell([bar(80)])] }),
                        new TableRow({ children: [cell([bar(380)]), cell([bar(80)])] }),
                    ],
                }),

                new Paragraph({
                    spacing: { before: 720 },
                    children: [new TextRun("Signature: "), writingLine(260), new TextRun("    Date: "), writingLine(120)],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
