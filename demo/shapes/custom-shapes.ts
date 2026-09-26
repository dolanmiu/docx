// Custom shapes with several paths, holes, text areas and connection points of their own.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { type CustomShapePath, type IShapeCanvasChildOptions, ShapeCanvasRun, ShapeRun } from "docx/shapes";

const heading = (text: string): Paragraph => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

const space = (): TextRun => new TextRun("     ");

const centred = (text: string): Paragraph => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(text)] });

// A cylinder: its body, and its top in a lighter shade of the fill
const cylinder: readonly CustomShapePath[] = [
    { path: "M 0 12 A 50 12 0 0 0 100 12 V 88 A 50 12 0 0 1 0 88 Z" },
    { path: "M 0 12 A 50 12 0 0 1 100 12 A 50 12 0 0 1 0 12 Z", fill: "lighter" },
];

const circle = (radius: number): string =>
    `M ${50 - radius} 50 A ${radius} ${radius} 0 0 1 ${50 + radius} 50 A ${radius} ${radius} 0 0 1 ${50 - radius} 50 Z`;

const BUBBLE =
    "M 10 0 H 150 A 10 10 0 0 1 160 10 V 70 A 10 10 0 0 1 150 80 H 60 L 35 105 L 40 80 H 10 A 10 10 0 0 1 0 70 V 10 A 10 10 0 0 1 10 0 Z";

const arrow = { color: "404040", width: 1.25, endArrow: "triangle" } as const;

// A web app, its server and its database. The database's connection points are the middles of its top, sides and
// bottom, rather than the corners of its paths
const system: readonly IShapeCanvasChildOptions[] = [
    {
        id: "app",
        type: "roundedRectangle",
        text: "Web app",
        transformation: { offset: { left: 0, top: 45 }, width: 110, height: 44 },
        fill: "DEEBF7",
        line: "5B9BD5",
    },
    {
        id: "server",
        type: "rectangle",
        text: "Server",
        transformation: { offset: { left: 200, top: 45 }, width: 110, height: 44 },
        fill: "E2F0D9",
        line: "70AD47",
    },
    {
        id: "database",
        type: "custom",
        paths: cylinder,
        connectionPoints: [
            { x: 50, y: 0 },
            { x: 100, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
        ],
        textArea: { left: 0, top: 24, right: 100, bottom: 100 },
        text: "Orders",
        transformation: { offset: { left: 400, top: 17 }, width: 90, height: 100 },
        fill: "FFC000",
        line: "BF9000",
    },
    {
        id: "backups",
        type: "custom",
        paths: cylinder,
        connectionPoints: [
            { x: 50, y: 0 },
            { x: 100, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
        ],
        textArea: { left: 0, top: 24, right: 100, bottom: 100 },
        text: "Backups",
        transformation: { offset: { left: 400, top: 190 }, width: 90, height: 70 },
        fill: "D9D9D9",
        line: "7F7F7F",
    },
    { type: "connector", from: "app", to: "server", line: arrow, label: { text: "HTTPS", fill: "FFFFFF" } },
    { type: "connector", from: "server", to: "database", line: arrow, label: { text: "SQL", fill: "FFFFFF" } },
    { type: "connector", from: "database", to: "backups", line: arrow, label: { text: "Nightly", fill: "FFFFFF" } },
];

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Custom shapes")] }),

                heading("Several paths"),
                new Paragraph({
                    spacing: { after: 300 },
                    children: [
                        // A box whose top is lighter and whose right side is darker than its fill
                        new ShapeRun({
                            type: "custom",
                            paths: [
                                { path: "M 0 25 L 50 0 L 100 25 L 50 50 Z", fill: "lighter" },
                                { path: "M 0 25 L 50 50 L 50 110 L 0 85 Z" },
                                { path: "M 50 50 L 100 25 L 100 85 L 50 110 Z", fill: "darker" },
                            ],
                            transformation: { width: 80, height: 88 },
                            fill: "4472C4",
                            line: "2F5597",
                        }),
                        space(),
                        // A page with a folded corner, and lines of text that are only drawn, not filled
                        new ShapeRun({
                            type: "custom",
                            paths: [
                                { path: "M 0 0 H 70 L 100 30 V 130 H 0 Z" },
                                { path: "M 70 0 V 30 H 100", fill: "darker" },
                                { path: "M 15 55 H 85 M 15 75 H 85 M 15 95 H 60", fill: false },
                            ],
                            transformation: { width: 68, height: 88 },
                            fill: "F2F2F2",
                            line: "7F7F7F",
                        }),
                        space(),
                        new ShapeRun({
                            type: "custom",
                            paths: cylinder,
                            transformation: { width: 80, height: 88 },
                            fill: "FFC000",
                            line: "BF9000",
                        }),
                    ],
                }),

                heading("Holes"),
                new Paragraph({
                    spacing: { after: 300 },
                    children: [
                        // A part of a path inside another is a hole in it, whichever way round either is drawn
                        new ShapeRun({
                            type: "custom",
                            path: `${circle(50)} ${circle(28)}`,
                            transformation: { width: 88, height: 88 },
                            fill: "70AD47",
                            line: "548235",
                        }),
                        space(),
                        // A part inside a hole is filled again
                        new ShapeRun({
                            type: "custom",
                            path: `${circle(50)} ${circle(36)} ${circle(22)} ${circle(10)}`,
                            transformation: { width: 88, height: 88 },
                            fill: "C00000",
                            line: "none",
                        }),
                        space(),
                        // A plate with a keyhole
                        new ShapeRun({
                            type: "custom",
                            path: "M 0 6 A 6 6 0 0 1 6 0 H 54 A 6 6 0 0 1 60 6 V 84 A 6 6 0 0 1 54 90 H 6 A 6 6 0 0 1 0 84 Z M 24 44 A 12 12 0 1 1 36 44 L 40 70 H 20 Z",
                            transformation: { width: 59, height: 88 },
                            fill: "A5A5A5",
                            line: "7F7F7F",
                        }),
                    ],
                }),

                heading("Text areas"),
                new Paragraph({
                    spacing: { after: 300 },
                    children: [
                        // Without a text area, the text is in the middle of the whole shape, tail and all
                        new ShapeRun({
                            type: "custom",
                            path: BUBBLE,
                            transformation: { width: 180, height: 118 },
                            fill: "FBE5D6",
                            line: "ED7D31",
                            children: [centred("Without a text area")],
                        }),
                        space(),
                        // With one, it is in the middle of the bubble, clear of the tail
                        new ShapeRun({
                            type: "custom",
                            path: BUBBLE,
                            textArea: { left: 0, top: 0, right: 160, bottom: 80 },
                            transformation: { width: 180, height: 118 },
                            fill: "FBE5D6",
                            line: "ED7D31",
                            children: [centred("With a text area")],
                        }),
                    ],
                }),

                heading("Connection points"),
                new Paragraph({ children: [new ShapeCanvasRun({ children: system })] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
