// Page numbers worked out by docx/layout for text in different fonts, sizes, spacing, indents and tab stops. It is one
// of the documents scripts/compare-layout.sh checks against LibreOffice. See docs/usage/layout.md.

import * as fs from "fs";
import { Document, HeadingLevel, LineRuleType, Packer, Paragraph, TabStopType, TableOfContents, TextRun } from "docx";
import { estimatePageNumbers } from "docx/layout";

const WORDS =
    "a letter from the valley described seventeen extraordinarily careful measurements of rainfall, river levels and the crossing times of the ferry".split(
        " ",
    );
const text = (words: number, seed: number): string =>
    Array.from({ length: words }, (_, index) => WORDS[(index * 5 + seed * 3) % WORDS.length]).join(" ");

const heading = (title: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] });

const FONTS = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New"];

const doc = new Document({
    pageNumbers: estimatePageNumbers,
    styles: {
        default: {
            document: {
                run: { font: "Calibri", size: 22 },
                paragraph: { spacing: { after: 160, line: 259, lineRule: LineRuleType.AUTO } },
            },
            heading1: {
                run: { font: "Calibri Light", size: 32, color: "2F5496" },
                paragraph: { spacing: { before: 240, after: 0 }, keepNext: true },
            },
        },
    },
    sections: [
        {
            children: [
                new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }),
                ...FONTS.flatMap((font, index) => [
                    heading(`Text in ${font}`),
                    ...[9, 11, 14].map(
                        (size, sizeIndex) =>
                            new Paragraph({
                                children: [new TextRun({ text: text(80 + sizeIndex * 40, index + sizeIndex), font, size: size * 2 })],
                            }),
                    ),
                    new Paragraph({ children: [new TextRun({ text: text(100, index * 2), font, bold: true })] }),
                ]),
                heading("Line spacing"),
                new Paragraph({ spacing: { line: 360, lineRule: LineRuleType.AUTO }, children: [new TextRun(text(160, 1))] }),
                new Paragraph({ spacing: { line: 480, lineRule: LineRuleType.AUTO }, children: [new TextRun(text(120, 2))] }),
                new Paragraph({ spacing: { line: 300, lineRule: LineRuleType.EXACT }, children: [new TextRun(text(140, 3))] }),
                new Paragraph({ spacing: { line: 400, lineRule: LineRuleType.AT_LEAST }, children: [new TextRun(text(140, 4))] }),
                heading("Space around paragraphs"),
                ...Array.from(
                    { length: 8 },
                    (_, index) =>
                        new Paragraph({
                            spacing: { before: index * 60, after: 240 - index * 20 },
                            children: [new TextRun(text(30 + index * 15, index))],
                        }),
                ),
                ...Array.from(
                    { length: 6 },
                    (_, index) =>
                        new Paragraph({
                            style: "ListParagraph",
                            contextualSpacing: true,
                            spacing: { before: 120, after: 120 },
                            children: [new TextRun(text(20 + index * 10, index))],
                        }),
                ),
                heading("Indents"),
                new Paragraph({ indent: { left: 1440 }, children: [new TextRun(text(120, 5))] }),
                new Paragraph({ indent: { left: 720, right: 1440 }, children: [new TextRun(text(120, 6))] }),
                new Paragraph({ indent: { firstLine: 720 }, children: [new TextRun(text(120, 7))] }),
                new Paragraph({
                    indent: { left: 1080, hanging: 1080 },
                    children: [new TextRun("Term:"), new TextRun({ text: `\t${text(90, 8)}` })],
                }),
                heading("Tab stops"),
                ...Array.from(
                    { length: 12 },
                    (_, index) =>
                        new Paragraph({
                            tabStops: [
                                { type: TabStopType.LEFT, position: 2880 },
                                { type: TabStopType.RIGHT, position: 9026 },
                            ],
                            children: [new TextRun(`Item ${index + 1}\t${text(3 + (index % 4), index)}\t${(index + 1) * 125}`)],
                        }),
                ),
                heading("Long words"),
                new Paragraph({
                    children: [
                        new TextRun(
                            `${text(20, 9)} ${"extraordinarily".repeat(6)} ${text(40, 10)} well-known well-kept long-running ${text(60, 11)}`,
                        ),
                    ],
                }),
                heading("The end"),
                new Paragraph({ children: [new TextRun(text(60, 12))] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
