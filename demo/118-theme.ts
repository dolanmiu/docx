// A document with a theme of its own: its colors, Cambria for headings and Calibri for body text. The text uses the
// theme's fonts and the shapes its colors, so both change when the theme changes on Word's Design tab.
// See docs/usage/themes.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { type ShapeColor, ShapeCanvasRun, ShapeRun, type ShapeThemeColorName } from "docx/shapes";

// A square in one of the theme's colors
const swatch = (fill: ShapeColor): ShapeRun =>
    new ShapeRun({ type: "rectangle", transformation: { width: 36, height: 36 }, fill, line: "none" });

const between = (runs: readonly ShapeRun[]): readonly (ShapeRun | TextRun)[] =>
    runs.flatMap((run, index) => (index ? [new TextRun("  "), run] : [run]));

const accents: readonly ShapeThemeColorName[] = ["accent1", "accent2", "accent3", "accent4", "accent5", "accent6"];

const arrow = { color: { theme: "dark2" }, width: 1.25, endArrow: "triangle" } as const;

const doc = new Document({
    theme: {
        name: "Harbour",
        colors: {
            dark2: "1B3A4B",
            light2: "EEF2F3",
            accent1: "1F6F8B",
            accent2: "E07A5F",
            accent3: "3D9970",
            accent4: "F2C14E",
            accent5: "6C5B7B",
            accent6: "8D99AE",
        },
        fonts: { headings: "Cambria", body: "Calibri" },
    },
    styles: {
        default: {
            document: { run: { font: { theme: "body" }, size: 22 }, paragraph: { spacing: { after: 120 } } },
            heading1: { run: { font: { theme: "headings" }, size: 32, color: "1B3A4B" } },
            heading2: { run: { font: { theme: "headings" }, size: 26, color: "1F6F8B" }, paragraph: { spacing: { before: 240 } } },
        },
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("A theme of its own")] }),
                new Paragraph({
                    children: [
                        new TextRun("This document's theme has colors of its own, "),
                        new TextRun({ text: "Cambria for headings", font: { theme: "headings" } }),
                        new TextRun(
                            " and Calibri for body text. Its text uses the theme's fonts and its shapes the theme's colors, so choosing other colors or fonts on Word's Design tab changes them all.",
                        ),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The theme's colors")] }),
                new Paragraph({ children: between(accents.map((theme) => swatch({ theme }))) }),
                // As Word's color menus offer them: lighter and darker versions of each color
                new Paragraph({
                    children: between([
                        swatch({ theme: "accent1", lighter: 80 }),
                        swatch({ theme: "accent1", lighter: 60 }),
                        swatch({ theme: "accent1", lighter: 40 }),
                        swatch({ theme: "accent1" }),
                        swatch({ theme: "accent1", darker: 25 }),
                        swatch({ theme: "accent1", darker: 50 }),
                    ]),
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A diagram in the theme's colors")] }),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({
                            layout: { type: "flow", direction: "right" },
                            children: [
                                {
                                    id: "request",
                                    type: "flowChartTerminator",
                                    text: "Request",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: { theme: "accent1", lighter: 80 },
                                    line: { theme: "accent1" },
                                },
                                {
                                    id: "approved",
                                    type: "flowChartDecision",
                                    text: "Approved?",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: { theme: "accent2", lighter: 60 },
                                    line: { theme: "accent2" },
                                },
                                {
                                    id: "order",
                                    type: "flowChartProcess",
                                    text: "Place the order",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: { theme: "accent3", lighter: 80 },
                                    line: { theme: "accent3" },
                                },
                                {
                                    id: "reply",
                                    type: "flowChartProcess",
                                    text: "Explain why",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: { theme: "light2" },
                                    line: { theme: "dark2", lighter: 40 },
                                },
                                { type: "connector", from: "request", to: "approved", line: arrow },
                                {
                                    type: "connector",
                                    from: "approved",
                                    to: "order",
                                    line: arrow,
                                    label: { text: "Yes", fill: { theme: "light1" } },
                                },
                                {
                                    type: "connector",
                                    from: { id: "approved", side: "bottom" },
                                    to: "reply",
                                    route: "elbow",
                                    line: arrow,
                                    label: { text: "No", fill: { theme: "light1" } },
                                },
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
