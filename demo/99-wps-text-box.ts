// WPS (WordProcessing Shape) text boxes - modern DrawingML-based alternative to legacy VML text boxes (demo 94)
// Demonstrates: basic text box, styled fill/outline, rotation, floating positioning, and vertical alignment
import * as fs from "fs";

import {
    Document,
    HorizontalPositionRelativeFrom,
    Packer,
    Paragraph,
    TextRun,
    VerticalAnchor,
    VerticalPositionRelativeFrom,
    WpsShapeRun,
} from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                // 1. Basic text box - minimal options
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    children: [new TextRun("This is a basic WPS text box with just width and height.")],
                                }),
                            ],
                            transformation: {
                                width: 4000000,
                                height: 800000,
                            },
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun("")] }),

                // 2. Styled text box - solid fill and outline
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: "Styled text box with a light blue background and dark blue border.",
                                            bold: true,
                                            color: "1F3864",
                                        }),
                                    ],
                                }),
                            ],
                            transformation: {
                                width: 4000000,
                                height: 800000,
                            },
                            solidFill: {
                                type: "rgb",
                                value: "D6E4F0",
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "2E74B5",
                                width: 25400,
                            },
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun("")] }),

                // 3. Rotated text box
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    children: [new TextRun("This text box is rotated 15 degrees.")],
                                }),
                            ],
                            transformation: {
                                width: 3000000,
                                height: 600000,
                                rotation: 15,
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "FF0000",
                                width: 12700,
                            },
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),

                // 4. Floating text box - positioned via offset
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    children: [new TextRun("Floating text box positioned at a specific offset on the page.")],
                                }),
                            ],
                            transformation: {
                                width: 3500000,
                                height: 700000,
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "70AD47",
                                width: 19050,
                            },
                            floating: {
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.PAGE,
                                    offset: 3500000,
                                },
                                verticalPosition: {
                                    relative: VerticalPositionRelativeFrom.PARAGRAPH,
                                    offset: 100000,
                                },
                            },
                        }),
                    ],
                }),

                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),

                // 5. Centered vertical alignment with custom margins
                new Paragraph({
                    children: [
                        new WpsShapeRun({
                            type: "wps",
                            children: [
                                new Paragraph({
                                    children: [new TextRun("Vertically centered text with custom margins.")],
                                }),
                            ],
                            transformation: {
                                width: 4000000,
                                height: 1200000,
                            },
                            solidFill: {
                                type: "rgb",
                                value: "FFF2CC",
                            },
                            outline: {
                                type: "solidFill",
                                solidFillType: "rgb",
                                value: "BF8F00",
                                width: 19050,
                            },
                            bodyProperties: {
                                verticalAnchor: VerticalAnchor.CENTER,
                                margins: {
                                    top: 72000,
                                    bottom: 72000,
                                    left: 144000,
                                    right: 144000,
                                },
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
