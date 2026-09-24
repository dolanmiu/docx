// Shapes: preset shapes, lines and arrows, gradients, transparency, text in shapes and floating shapes.
// See docs/usage/shapes.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    HorizontalPositionRelativeFrom,
    Packer,
    Paragraph,
    ShapeRun,
    TextRun,
    TextWrappingSide,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const space = (): TextRun => new TextRun("   ");

const whiteText = (text: string): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color: "FFFFFF", bold: true })] });

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Shapes")] }),

                heading("Preset shapes"),
                new Paragraph({
                    children: [
                        new ShapeRun({ type: "rect", transformation: { width: 60, height: 60 }, fill: "4472C4", line: "none" }),
                        space(),
                        // Adjustments set a shape's handles. A roundRect's cornerRadius is a percent of its shorter side.
                        new ShapeRun({
                            type: "roundRect",
                            adjustments: { cornerRadius: 30 },
                            transformation: { width: 60, height: 60 },
                            fill: "ED7D31",
                        }),
                        space(),
                        new ShapeRun({ type: "ellipse", transformation: { width: 60, height: 60 }, fill: "A5A5A5" }),
                        space(),
                        new ShapeRun({ type: "triangle", transformation: { width: 60, height: 60 }, fill: "FFC000" }),
                        space(),
                        new ShapeRun({ type: "diamond", transformation: { width: 60, height: 60 }, fill: "5B9BD5" }),
                        space(),
                        new ShapeRun({ type: "star5", transformation: { width: 60, height: 60 }, fill: "70AD47" }),
                        space(),
                        new ShapeRun({ type: "heart", transformation: { width: 60, height: 60 }, fill: "C00000", line: "none" }),
                        space(),
                        new ShapeRun({ type: "rightArrow", transformation: { width: 80, height: 40 }, fill: "264478", line: "none" }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({ type: "hexagon", transformation: { width: 60, height: 52 } }),
                        space(),
                        new ShapeRun({ type: "cloud", transformation: { width: 80, height: 52 } }),
                        space(),
                        new ShapeRun({ type: "lightningBolt", transformation: { width: 52, height: 52 }, fill: "FFD966" }),
                        space(),
                        new ShapeRun({ type: "smileyFace", transformation: { width: 52, height: 52 }, fill: "FFE699" }),
                        space(),
                        new ShapeRun({ type: "flowChartMagneticDisk", transformation: { width: 52, height: 52 }, fill: "DDEBF7" }),
                        space(),
                        new ShapeRun({ type: "gear9", transformation: { width: 52, height: 52 }, fill: "BFBFBF" }),
                        space(),
                        // Angles are in degrees, clockwise from 3 o'clock
                        new ShapeRun({
                            type: "pie",
                            adjustments: { startAngle: 0, endAngle: 270 },
                            transformation: { width: 52, height: 52 },
                            fill: "7030A0",
                            line: "none",
                        }),
                    ],
                }),

                heading("Lines and arrows"),
                new Paragraph({ children: [new ShapeRun({ type: "line", transformation: { width: 400, height: 0 } })] }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { color: "2F5597", width: 2, dash: "dash" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { color: "7F7F7F", width: 1.5, dash: "sysDot" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { color: "C00000", width: 6, transparency: 40 },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { width: 1.5, endArrow: "triangle" },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 400, height: 0 },
                            line: { width: 1.5, startArrow: "oval", endArrow: { type: "stealth", width: "lg", length: "lg" } },
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        // A line runs from the top-left to the bottom-right of its box. Flip it to run from the bottom-left.
                        new ShapeRun({ type: "line", transformation: { width: 120, height: 60 }, line: { width: 1.5, endArrow: "arrow" } }),
                        space(),
                        new ShapeRun({
                            type: "line",
                            transformation: { width: 120, height: 60, flip: { vertical: true } },
                            line: { width: 1.5, endArrow: "arrow" },
                        }),
                        space(),
                        new ShapeRun({ type: "line", transformation: { width: 0, height: 60 }, line: { width: 1.5, endArrow: "diamond" } }),
                    ],
                }),

                heading("Gradients and transparency"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "rect",
                            transformation: { width: 160, height: 80 },
                            line: "none",
                            fill: {
                                type: "gradient",
                                angle: 90,
                                stops: [
                                    { position: 0, color: "9DC3E6" },
                                    { position: 100, color: "1F4E79" },
                                ],
                            },
                        }),
                        space(),
                        new ShapeRun({
                            type: "ellipse",
                            transformation: { width: 80, height: 80 },
                            line: "none",
                            fill: {
                                type: "gradient",
                                path: "circle",
                                stops: [
                                    { position: 0, color: "FFFFFF" },
                                    { position: 100, color: "ED7D31" },
                                ],
                            },
                        }),
                        space(),
                        new ShapeRun({
                            type: "roundRect",
                            transformation: { width: 160, height: 80 },
                            line: "none",
                            fill: {
                                type: "gradient",
                                stops: [
                                    { position: 0, color: "70AD47" },
                                    { position: 50, color: "FFC000" },
                                    { position: 100, color: "C00000", transparency: 60 },
                                ],
                            },
                        }),
                    ],
                }),
                // Three floating circles that overlap, each 50% transparent
                new Paragraph({
                    spacing: { after: 240 },
                    children: [
                        ...[
                            { left: 0, color: "FF0000" },
                            { left: 55, color: "00B050" },
                            { left: 110, color: "0070C0" },
                        ].map(
                            ({ left, color }) =>
                                new ShapeRun({
                                    type: "ellipse",
                                    transformation: { width: 90, height: 90 },
                                    fill: { color, transparency: 50 },
                                    line: "none",
                                    floating: {
                                        horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: left * 9525 },
                                        verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                        wrap: { type: TextWrappingType.TOP_AND_BOTTOM },
                                    },
                                }),
                        ),
                    ],
                }),

                heading("Text in shapes"),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "flowChartTerminator",
                            transformation: { width: 120, height: 48 },
                            fill: "4472C4",
                            line: "none",
                            children: [whiteText("Start")],
                        }),
                        space(),
                        new ShapeRun({
                            type: "flowChartProcess",
                            transformation: { width: 120, height: 48 },
                            fill: "ED7D31",
                            line: "none",
                            children: [whiteText("Do the work")],
                        }),
                        space(),
                        new ShapeRun({
                            type: "flowChartDecision",
                            transformation: { width: 120, height: 72 },
                            fill: "70AD47",
                            line: "none",
                            children: [whiteText("Done?")],
                        }),
                    ],
                }),

                heading("Floating shapes"),
                new Paragraph({
                    children: [
                        // A callout floating at the right of the text, with the text wrapping around it
                        new ShapeRun({
                            type: "wedgeRoundRectCallout",
                            adjustments: { pointerX: -70, pointerY: 20 },
                            transformation: { width: 180, height: 80 },
                            fill: "FFF2CC",
                            line: { color: "BF9000", width: 1.25 },
                            children: [
                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("Shapes can float, too!")] }),
                            ],
                            floating: {
                                horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 4000000 },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
                                margins: { left: 114300 },
                            },
                            altText: { name: "Callout", description: "A speech bubble saying that shapes can float" },
                        }),
                        new TextRun(
                            "A floating shape is positioned on the page rather than in the line of text. " +
                                "This callout is anchored to this paragraph and placed on the right, and the text wraps around it. " +
                                "Floating shapes use the same positioning and wrapping options as floating images.",
                        ),
                    ],
                }),
                new Paragraph({
                    spacing: { before: 480 },
                    children: [
                        new ShapeRun({
                            type: "rect",
                            transformation: { width: 140, height: 50, rotation: -15 },
                            fill: "E2F0D9",
                            line: { color: "548235", width: 2, dash: "lgDash" },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "APPROVED", bold: true, color: "548235" })],
                                }),
                            ],
                            floating: {
                                horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: 0 },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.TOP_AND_BOTTOM },
                            },
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
