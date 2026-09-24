// Diagrams: pictures and groups inside groups and canvases, connector labels, connecting to a point on a shape,
// connector margins, and connectors that go around other shapes.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { type IShapeCanvasChildOptions, type IShapeGroupChildOptions, ShapeCanvasRun, ShapeGroupRun } from "docx/shapes";

const label = (text: string, color = "FFFFFF"): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color, bold: true, size: 18 })] });

const arrow = { color: "404040", width: 1.25, endArrow: "triangle" } as const;

const logo = { type: "png", data: fs.readFileSync("./demo/images/linux-png.png") } as const;

// A card: a picture and a caption, grouped so they move together. Its children are positioned relative to each other
const card = (id: string, caption: string, left: number): IShapeCanvasChildOptions => ({
    type: "group",
    transformation: { offset: { left, top: 10 } },
    children: [
        { type: "roundedRectangle", transformation: { width: 110, height: 120 }, fill: "F2F2F2", line: "BFBFBF" },
        { id, type: "picture", image: logo, transformation: { offset: { left: 25, top: 10 }, width: 60, height: 70 } },
        {
            type: "rectangle",
            transformation: { offset: { left: 5, top: 88 }, width: 100, height: 24 },
            line: "none",
            children: [label(caption, "404040")],
        },
    ],
});

// Connectors on the canvas attach to the pictures inside the groups, and keep a label in the middle
const cards: readonly IShapeCanvasChildOptions[] = [
    card("build", "Build", 10),
    card("test", "Test", 200),
    card("ship", "Ship", 390),
    { type: "connector", from: "build", to: "test", line: arrow, label: { text: "passes", fill: "FFFFFF" } },
    { type: "connector", from: "test", to: "ship", line: arrow, label: { text: "approved", fill: "FFFFFF" } },
];

// A decision with Yes and No labels. The "No" branch leaves from the diamond's right-hand point and loops back
const decision: readonly IShapeCanvasChildOptions[] = [
    {
        id: "ask",
        type: "flowChartDecision",
        transformation: { offset: { left: 20, top: 10 }, width: 130, height: 70 },
        fill: "70AD47",
        line: "none",
        children: [label("Ready?")],
    },
    {
        id: "go",
        type: "flowChartTerminator",
        transformation: { offset: { left: 25, top: 130 }, width: 120, height: 40 },
        fill: "4472C4",
        line: "none",
        children: [label("Go")],
    },
    {
        id: "wait",
        type: "flowChartProcess",
        transformation: { offset: { left: 240, top: 20 }, width: 110, height: 50 },
        fill: "FFC000",
        line: "none",
        children: [label("Wait a day", "000000")],
    },
    { type: "connector", from: "ask", to: "go", line: arrow, label: { text: "Yes", fill: "FFFFFF" } },
    { type: "connector", from: { id: "ask", point: { x: 100, y: 50 } }, to: "wait", line: arrow, label: { text: "No", fill: "FFFFFF" } },
    // A short loop back: 10 pixels out from the shapes rather than the default quarter of an inch
    {
        type: "connector",
        from: { id: "wait", side: "top" },
        to: { id: "ask", side: "top" },
        route: "elbow",
        margin: 10,
        line: { ...arrow, dash: "dash" },
    },
];

// An elbow connector goes around a shape that is in its way
const detour: readonly IShapeCanvasChildOptions[] = [
    { id: "from", type: "ellipse", transformation: { offset: { top: 50 }, width: 70, height: 40 }, fill: "DEEBF7" },
    {
        type: "rectangle",
        transformation: { offset: { left: 150, top: 25 }, width: 60, height: 90 },
        fill: "FBE5D6",
        children: [label("In the way", "C55A11")],
    },
    { id: "to", type: "ellipse", transformation: { offset: { left: 290, top: 50 }, width: 70, height: 40 }, fill: "DEEBF7" },
    { type: "connector", from: "from", to: "to", route: "elbow", line: { color: "2E75B6", width: 1.5, endArrow: "triangle" } },
];

// A badge: a group inside a group, scaled to half size and turned
const badge = (left: number, rotation = 0): IShapeGroupChildOptions => ({
    type: "group",
    transformation: { offset: { left }, width: 40, height: 40, rotation },
    children: [
        { type: "ellipse", transformation: { width: 80, height: 80 }, fill: "5B9BD5", line: "none" },
        { type: "star5", transformation: { offset: { left: 15, top: 12 }, width: 50, height: 50 }, fill: "FFC000", line: "none" },
    ],
});

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ text: "Pictures and groups on a canvas", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("Each card is a group of a frame, a picture and a caption. The labelled connectors join the pictures."),
                new Paragraph({
                    children: [new ShapeCanvasRun({ children: cards, altText: { name: "Pipeline", description: "Build, test and ship" } })],
                }),

                new Paragraph({ text: "Labels and connection points", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ children: [new ShapeCanvasRun({ children: decision, fill: "F7F7F7" })] }),

                new Paragraph({ text: "Going around shapes", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ children: [new ShapeCanvasRun({ children: detour })] }),

                new Paragraph({ text: "Groups inside groups", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ children: [new ShapeGroupRun({ children: [badge(0), badge(60, 20), badge(120, 40)], decorative: true })] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
