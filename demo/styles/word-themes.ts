// Word's own themes, colors and fonts, from docx/theme: a document in Word's Facet theme, with Word's Blue Green colors
// and Georgia for headings and body text, as Word's Design tab mixes them. The styles and the table use the theme's
// fonts and colors, so choosing another theme on Word's Design tab changes them all.
// See docs/usage/themes.md.

import * as fs from "fs";
import {
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    type ThemeColorName,
    WidthType,
} from "docx";
import { ColorSchemes, FontSchemes, Themes } from "docx/theme";

const accents: readonly ThemeColorName[] = ["accent1", "accent2", "accent3", "accent4", "accent5", "accent6"];

const cell = (text: string, fill: ThemeColorName, lighter?: number): TableCell =>
    new TableCell({
        shading: { type: ShadingType.CLEAR, fill: { theme: fill, lighter } },
        children: [new Paragraph({ children: [new TextRun({ text, color: { theme: lighter ? "dark1" : "light1" } })] })],
    });

const doc = new Document({
    theme: { ...Themes.FACET, colors: ColorSchemes.BLUE_GREEN, fonts: FontSchemes.GEORGIA },
    styles: {
        default: {
            document: { run: { font: { theme: "body" }, size: 22 }, paragraph: { spacing: { after: 120 } } },
            title: { run: { font: { theme: "headings" }, size: 56, color: { theme: "dark2" } } },
            heading1: {
                run: { font: { theme: "headings" }, size: 32, color: { theme: "accent1", darker: 25 } },
                paragraph: {
                    spacing: { before: 240 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: { theme: "accent1" }, space: 1 } },
                },
            },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Word's themes")] }),
                new Paragraph({
                    children: [
                        new TextRun("This document is in Word's Facet theme, with Word's Blue Green colors and Georgia, as "),
                        new TextRun({ text: "Design > Colors", bold: true }),
                        new TextRun(" and "),
                        new TextRun({ text: "Design > Fonts", bold: true }),
                        new TextRun(" mix them."),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The theme's colors")] }),
                new Paragraph("Each accent color, and each lighter by 60%, as Word's color menus offer them:"),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: accents.map((accent) => cell(accent, accent)) }),
                        new TableRow({ children: accents.map((accent) => cell("Lighter 60%", accent, 60)) }),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("The theme's fonts")] }),
                new Paragraph({
                    children: [
                        new TextRun("Body text is in the theme's font for body text, and "),
                        new TextRun({ text: "headings in its font for headings", font: { theme: "headings" } }),
                        new TextRun(". Both are Georgia here."),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
