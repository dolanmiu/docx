// Connectors: lines that join shapes, drawn from one shape to another.
// On a drawing canvas (ShapeCanvasRun), Word keeps them attached when the shapes are moved.
// See docs/usage/shapes.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    type IShapeCanvasChildOptions,
    Packer,
    Paragraph,
    ShapeCanvasRun,
    ShapeGroupRun,
    TextRun,
} from "docx";

const label = (text: string, color = "FFFFFF"): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color, bold: true, size: 18 })] });

const arrowLine = { color: "404040", width: 1.25, endArrow: "triangle" } as const;

// A flowchart that loops back when the review fails
const flowchart: readonly IShapeCanvasChildOptions[] = [
    {
        id: "start",
        type: "flowChartTerminator",
        transformation: { offset: { left: 20, top: 10 }, width: 120, height: 40 },
        fill: "4472C4",
        line: "none",
        children: [label("Start")],
    },
    {
        id: "draft",
        type: "flowChartProcess",
        transformation: { offset: { left: 20, top: 90 }, width: 120, height: 44 },
        fill: "ED7D31",
        line: "none",
        children: [label("Write draft")],
    },
    {
        id: "review",
        type: "flowChartDecision",
        transformation: { offset: { left: 20, top: 174 }, width: 120, height: 72 },
        fill: "70AD47",
        line: "none",
        children: [label("Approved?")],
    },
    {
        id: "fix",
        type: "flowChartProcess",
        transformation: { offset: { left: 220, top: 188 }, width: 110, height: 44 },
        fill: "FFC000",
        line: "none",
        children: [label("Fix comments", "000000")],
    },
    {
        id: "publish",
        type: "flowChartTerminator",
        transformation: { offset: { left: 20, top: 290 }, width: 120, height: 40 },
        fill: "4472C4",
        line: "none",
        children: [label("Publish")],
    },
    { type: "connector", from: "start", to: "draft", line: arrowLine },
    { type: "connector", from: "draft", to: "review", line: arrowLine },
    { type: "connector", from: "review", to: "publish", line: arrowLine },
    { type: "connector", from: "review", to: "fix", line: arrowLine },
    // Up from the top of "fix" and left into the side of "draft": one right-angled bend
    { type: "connector", from: { id: "fix", side: "top" }, to: { id: "draft", side: "right" }, route: "elbow", line: arrowLine },
];

// Two boxes joined by each kind of route
const routes = (route: "straight" | "elbow" | "curved"): readonly IShapeCanvasChildOptions[] => [
    { id: "a", type: "roundedRectangle", transformation: { width: 70, height: 36 }, fill: "DEEBF7", children: [label("A", "1F4E79")] },
    {
        id: "b",
        type: "roundedRectangle",
        transformation: { offset: { left: 130, top: 70 }, width: 70, height: 36 },
        fill: "DEEBF7",
        children: [label("B", "1F4E79")],
    },
    { type: "connector", from: "a", to: "b", route, line: { color: "2E75B6", width: 1.5, endArrow: "triangle" } },
];

// Connectors choose the facing sides unless you pick them. They go around the shapes when they have to
const sides: readonly IShapeCanvasChildOptions[] = [
    { id: "a", type: "ellipse", transformation: { offset: { left: 30, top: 40 }, width: 80, height: 50 }, fill: "E2F0D9" },
    { id: "b", type: "hexagon", transformation: { offset: { left: 250, top: 110 }, width: 90, height: 50 }, fill: "FBE5D6" },
    { type: "connector", from: { id: "a", side: "bottom" }, to: { id: "b", side: "left" }, route: "elbow", line: "548235" },
    { type: "connector", from: { id: "a", side: "top" }, to: { id: "b", side: "top" }, route: "elbow", line: "C55A11" },
    {
        type: "connector",
        from: { id: "a", side: "right" },
        to: { id: "b", side: "right" },
        route: "curved",
        line: { color: "7030A0", dash: "dash" },
    },
];

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ text: "A flowchart on a canvas", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("Move a shape in Word and its connectors follow."),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({
                            children: flowchart,
                            transformation: { width: 360, height: 340 },
                            fill: "F7F7F7",
                            altText: { name: "Review process", description: "Write a draft, have it reviewed, fix comments and publish" },
                        }),
                    ],
                }),

                new Paragraph({ text: "Straight, elbow and curved", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({ children: routes("straight") }),
                        new TextRun("    "),
                        new ShapeCanvasRun({ children: routes("elbow") }),
                        new TextRun("    "),
                        new ShapeCanvasRun({ children: routes("curved") }),
                    ],
                }),

                new Paragraph({ text: "Choosing sides", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ children: [new ShapeCanvasRun({ children: sides, line: "BFBFBF" })] }),

                new Paragraph({ text: "Connectors in a group", heading: HeadingLevel.HEADING_1 }),
                new Paragraph("A group draws connectors in the same way, but Word doesn't keep them attached when the shapes move."),
                new Paragraph({ children: [new ShapeGroupRun({ children: routes("elbow") })] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
