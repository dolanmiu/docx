// The theme of a document made in Word, read with readTheme, so text and tables in the theme's fonts and
// colors look as they do in that document. field-trip.docx has Office 2007's theme: Cambria for headings, Calibri for
// body text, and its blue, red and green accents.
// See docs/usage/themes.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType, readTheme } from "docx";

const theme = readTheme(fs.readFileSync("./demo/assets/field-trip.docx"));

const header = (text: string): TableCell =>
    new TableCell({
        shading: { type: ShadingType.CLEAR, fill: { theme: "accent1" } },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: { theme: "light1" } })] })],
    });

const row = (cells: readonly string[], index: number): TableRow =>
    new TableRow({
        children: cells.map(
            (text) =>
                new TableCell({
                    // Banded rows, in the theme's first accent color, lighter by 80%
                    shading: index % 2 === 0 ? { type: ShadingType.CLEAR, fill: { theme: "accent1", lighter: 80 } } : undefined,
                    children: [new Paragraph(text)],
                }),
        ),
    });

const doc = new Document({
    theme,
    styles: {
        default: {
            document: { run: { font: { theme: "body" }, size: 22 } },
            heading1: { run: { font: { theme: "headings" }, size: 32, bold: true, color: { theme: "accent1", darker: 25 } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The theme of a document made in Word")] }),
                new Paragraph(
                    `This document has the theme of field-trip.docx, "${theme.name}", whose fonts and colors are those of Office 2007. The heading is in its font for headings, and the table in its first accent color.`,
                ),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ tableHeader: true, children: [header("Stop"), header("Time")] }),
                        ...[
                            ["Museum", "9:30"],
                            ["Park", "11:00"],
                            ["Lunch", "12:30"],
                            ["Back at school", "15:00"],
                        ].map(row),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
