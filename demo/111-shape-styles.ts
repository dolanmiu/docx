// Shape styles: effects, pattern and picture fills, line styles, text layout, custom shapes and links.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { ShapeRun } from "docx/shapes";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const space = (): TextRun => new TextRun("     ");

const centred = (text: string, color = "000000"): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color, bold: true })] });

const photo = { type: "jpg", data: fs.readFileSync("./demo/images/cat.jpg") } as const;

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Shape styles")] }),

                heading("Effects"),
                new Paragraph({
                    spacing: { after: 400 },
                    children: [
                        // Word's "Offset: Bottom Right" shadow
                        new ShapeRun({
                            type: "roundedRectangle",
                            transformation: { width: 90, height: 60 },
                            fill: "DEEBF7",
                            line: "none",
                            effects: { shadow: {} },
                            children: [centred("Shadow")],
                        }),
                        space(),
                        new ShapeRun({
                            type: "ellipse",
                            transformation: { width: 60, height: 60 },
                            fill: "FFC000",
                            line: "none",
                            effects: { glow: { color: "FFC000", size: 8 } },
                        }),
                        space(),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 90, height: 60 },
                            fill: "70AD47",
                            line: "none",
                            effects: { softEdges: 6 },
                        }),
                        space(),
                        new ShapeRun({
                            type: "star5",
                            transformation: { width: 60, height: 60 },
                            fill: "C00000",
                            line: "none",
                            effects: { reflection: { size: 40 } },
                        }),
                        space(),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 90, height: 60 },
                            fill: "F2F2F2",
                            line: "none",
                            effects: { innerShadow: { blur: 6, distance: 3, angle: 225 } },
                            children: [centred("Inset")],
                        }),
                    ],
                }),

                heading("Pattern and picture fills"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 80, height: 60 },
                            fill: { type: "pattern", pattern: "wideUpwardDiagonal", color: "2F5597", backgroundColor: "DEEBF7" },
                        }),
                        space(),
                        new ShapeRun({
                            type: "ellipse",
                            transformation: { width: 60, height: 60 },
                            fill: { type: "pattern", pattern: "smallCheckerBoard", color: "404040" },
                        }),
                        space(),
                        // A photo cropped to a circle by the shape's outline
                        new ShapeRun({
                            type: "ellipse",
                            transformation: { width: 80, height: 80 },
                            fill: { type: "picture", image: photo },
                            line: { color: "FFFFFF", width: 3 },
                            effects: { shadow: { blur: 6, distance: 2 } },
                        }),
                        space(),
                        new ShapeRun({
                            type: "heart",
                            transformation: { width: 80, height: 80 },
                            fill: { type: "picture", image: photo, tile: { scale: 20, mirror: "both" } },
                            line: "none",
                        }),
                    ],
                }),

                heading("Line styles"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { color: "2F5597", width: 6, compound: "thickThin" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: {
                                color: "C55A11",
                                width: 3,
                                cap: "round",
                                dash: [
                                    { length: 0, gap: 2 },
                                    { length: 3, gap: 2 },
                                ],
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: {
                                width: 5,
                                gradient: {
                                    stops: [
                                        { position: 0, color: "4472C4" },
                                        { position: 100, color: "70AD47" },
                                    ],
                                },
                            },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "triangle",
                            transformation: { width: 60, height: 50 },
                            line: { color: "7030A0", width: 4, join: "round" },
                        }),
                        space(),
                        new ShapeRun({
                            type: "triangle",
                            transformation: { width: 60, height: 50 },
                            line: { color: "7030A0", width: 4, join: "miter" },
                        }),
                        space(),
                        new ShapeRun({
                            type: "triangle",
                            transformation: { width: 60, height: 50 },
                            line: { color: "7030A0", width: 4, join: "bevel" },
                        }),
                    ],
                }),

                heading("Text layout"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 140, height: 80 },
                            fill: "FFF2CC",
                            line: "BF9000",
                            children: [new Paragraph("Top left, with wide margins")],
                            textOptions: { verticalAlignment: "top", margins: { top: 8, right: 12, bottom: 8, left: 12 } },
                        }),
                        space(),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 40, height: 100 },
                            fill: "E2F0D9",
                            line: "548235",
                            children: [centred("Upwards")],
                            textOptions: { direction: "bottomToTop" },
                        }),
                        space(),
                        new ShapeRun({
                            type: "roundedRectangle",
                            transformation: { width: 120, height: 30 },
                            fill: "DEEBF7",
                            line: "2F5597",
                            children: [new Paragraph("This box grows to fit all of its text when Word lays it out.")],
                            textOptions: { resizeShapeToFitText: true },
                        }),
                    ],
                }),
                new Paragraph({
                    spacing: { before: 200 },
                    children: [
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 200, height: 80 },
                            line: "none",
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "WordArt", size: 48, bold: true, color: "2F5597" })],
                                }),
                            ],
                            textOptions: { warp: "archUp", wrap: false },
                        }),
                        space(),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 200, height: 80 },
                            line: "none",
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "Waves", size: 48, bold: true, color: "C55A11" })],
                                }),
                            ],
                            textOptions: { warp: "wave", wrap: false },
                        }),
                    ],
                }),

                heading("Custom shapes"),
                new Paragraph({
                    children: [
                        // The path is scaled so the box around it fills the shape
                        new ShapeRun({
                            type: "custom",
                            path: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
                            transformation: { width: 80, height: 76 },
                            fill: "FFC000",
                            line: "BF9000",
                        }),
                        space(),
                        new ShapeRun({
                            type: "custom",
                            path: "M 0 40 Q 25 0 50 40 T 100 40 L 100 60 L 0 60 Z",
                            transformation: { width: 120, height: 50 },
                            fill: {
                                type: "gradient",
                                angle: 90,
                                stops: [
                                    { position: 0, color: "9DC3E6" },
                                    { position: 100, color: "1F4E79" },
                                ],
                            },
                            line: "none",
                        }),
                        space(),
                        // Arcs: a speech bubble
                        new ShapeRun({
                            type: "custom",
                            path: "M 20 0 H 80 A 20 20 0 0 1 100 20 V 50 A 20 20 0 0 1 80 70 H 40 L 20 90 L 25 70 H 20 A 20 20 0 0 1 0 50 V 20 A 20 20 0 0 1 20 0 Z",
                            transformation: { width: 110, height: 90 },
                            fill: "E2F0D9",
                            line: { color: "548235", width: 1.5 },
                            children: [centred("Hello!", "548235")],
                            textOptions: { margins: { bottom: 20 } },
                        }),
                        space(),
                        // An open path, with arrowheads
                        new ShapeRun({
                            type: "custom",
                            path: "M 0 50 C 30 0 70 100 100 50",
                            transformation: { width: 120, height: 50 },
                            line: { color: "7030A0", width: 2, startArrow: "oval", endArrow: "triangle" },
                        }),
                    ],
                }),

                heading("Links and decorative shapes"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "roundedRectangle",
                            transformation: { width: 160, height: 40 },
                            fill: "4472C4",
                            line: "none",
                            children: [centred("Visit docx.js.org", "FFFFFF")],
                            link: "https://docx.js.org",
                            altText: { name: "Link", description: "A button that opens docx.js.org" },
                        }),
                    ],
                }),
                // A divider bar that screen readers skip
                new Paragraph({
                    spacing: { before: 200 },
                    children: [
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 600, height: 3 },
                            fill: "BFBFBF",
                            line: "none",
                            decorative: true,
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
