// Text, underlines, borders, shading, a table and the page in the colors of the document's theme, lighter or darker as
// Word's color menus offer them. Choosing other colors on Word's Design tab changes them all.
// See docs/usage/themes.md.

import * as fs from "fs";
import {
    BorderStyle,
    Document,
    HeadingLevel,
    type IBorderOptions,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    type ThemeColor,
    UnderlineType,
    WidthType,
} from "docx";

const line = (color: ThemeColor): IBorderOptions => ({ style: BorderStyle.SINGLE, size: 4, color });

const cell = (
    text: string,
    options: { readonly fill?: ThemeColor; readonly color?: ThemeColor; readonly bold?: boolean } = {},
): TableCell =>
    new TableCell({
        shading: options.fill ? { type: ShadingType.CLEAR, fill: options.fill } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text, bold: options.bold, color: options.color })] })],
    });

const rows: readonly (readonly string[])[] = [
    ["Harbour", "Opens at 6", "Busy"],
    ["Market", "Opens at 8", "Quiet"],
    ["Lighthouse", "Opens at 10", "Closed on Mondays"],
];

const doc = new Document({
    theme: {
        name: "Harbour",
        colors: { dark2: "1B3A4B", light2: "EEF2F3", accent1: "1F6F8B", accent2: "E07A5F", accent3: "3D9970" },
    },
    // The page, in the theme's second light color
    background: { color: { theme: "light2" } },
    styles: {
        default: {
            heading1: {
                run: { size: 32, color: { theme: "accent1", darker: 25 } },
                paragraph: { border: { bottom: { ...line({ theme: "accent1", lighter: 40 }), size: 8, space: 4 } } },
            },
            heading2: { run: { size: 26, color: { theme: "accent1" } }, paragraph: { spacing: { before: 240 } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("A document in its theme's colors")] }),
                new Paragraph({
                    spacing: { before: 120, after: 120 },
                    children: [
                        new TextRun("Text can be in "),
                        new TextRun({ text: "an accent color", color: { theme: "accent2" }, bold: true }),
                        new TextRun(", "),
                        new TextRun({ text: "a darker version of one", color: { theme: "accent3", darker: 50 } }),
                        new TextRun(", or "),
                        new TextRun({ text: "underlined in one", underline: { type: UnderlineType.WAVE, color: { theme: "accent2" } } }),
                        new TextRun(". "),
                        new TextRun({
                            text: "Shading",
                            shading: { type: ShadingType.CLEAR, fill: { theme: "accent3", lighter: 80 } },
                            border: line({ theme: "accent3" }),
                        }),
                        new TextRun(" and borders take them too."),
                    ],
                }),

                new Paragraph({
                    border: { left: { style: BorderStyle.SINGLE, size: 24, space: 8, color: { theme: "accent2" } } },
                    shading: { type: ShadingType.CLEAR, fill: { theme: "accent2", lighter: 80 } },
                    indent: { left: 200 },
                    spacing: { before: 120, after: 120 },
                    children: [
                        new TextRun({ text: "Note: ", bold: true, color: { theme: "accent2", darker: 25 } }),
                        new TextRun("a callout with a border and background in the theme's second accent color."),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A table")] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: line({ theme: "accent1" }),
                        bottom: line({ theme: "accent1" }),
                        left: line({ theme: "accent1" }),
                        right: line({ theme: "accent1" }),
                        insideHorizontal: line({ theme: "accent1", lighter: 40 }),
                        insideVertical: line({ theme: "accent1", lighter: 40 }),
                    },
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: ["Place", "Hours", "Notes"].map((text) =>
                                cell(text, { fill: { theme: "accent1" }, color: { theme: "light1" }, bold: true }),
                            ),
                        }),
                        // Banded rows
                        ...rows.map(
                            (row, index) =>
                                new TableRow({
                                    children: row.map((text) =>
                                        cell(text, { fill: index % 2 ? undefined : { theme: "accent1", lighter: 80 } }),
                                    ),
                                }),
                        ),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Lighter and darker")] }),
                new Paragraph({
                    spacing: { after: 60 },
                    children: [80, 60, 40].map(
                        (lighter) =>
                            new TextRun({
                                text: ` Lighter ${lighter}% `,
                                shading: { type: ShadingType.CLEAR, fill: { theme: "accent1", lighter } },
                            }),
                    ),
                }),
                new Paragraph({
                    children: [25, 50].map(
                        (darker) =>
                            new TextRun({
                                text: ` Darker ${darker}% `,
                                color: { theme: "light1" },
                                shading: { type: ShadingType.CLEAR, fill: { theme: "accent1", darker } },
                            }),
                    ),
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
