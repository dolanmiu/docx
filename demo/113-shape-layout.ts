// cspell:ignore DEEBF
// Diagrams without positions: shapes sized to fit their text, flowcharts, org charts and grids laid out
// automatically, connector ends spread along a side, and labels at the start or end of a connector.
// See docs/usage/shapes.md.

import * as fs from "fs";
import {
    Document,
    HeadingLevel,
    type IShapeCanvasChildOptions,
    Packer,
    Paragraph,
    ShapeCanvasRun,
    ShapeGroupRun,
    ShapeRun,
    TextRun,
} from "docx";

const arrow = { color: "404040", width: 1.25, endArrow: "triangle" } as const;
const plain = { color: "7F7F7F", width: 1 } as const;

// A step in a flowchart: as wide as its text, and 40 pixels tall
const step = (id: string, text: string, fill = "4472C4"): IShapeCanvasChildOptions => ({
    id,
    type: "flowChartProcess",
    text,
    transformation: { width: "fitText", height: 40 },
    fill,
    line: "none",
});

// A flowchart laid out in levels. Connectors between levels leave the bottom of one shape and arrive at the top of the
// next, and the connector back from "Fix it" loops round the side. The "No" label moves down its connector to keep
// clear of the "Yes" label
const flowchart: readonly IShapeCanvasChildOptions[] = [
    { id: "start", type: "flowChartTerminator", text: "Start", transformation: { width: 100, height: 36 }, fill: "A5A5A5", line: "none" },
    step("draft", "Write the draft"),
    {
        id: "review",
        type: "flowChartDecision",
        text: "Approved?",
        transformation: { width: "fitText", height: 70 },
        fill: "70AD47",
        line: "none",
    },
    step("publish", "Publish"),
    step("fix", "Fix it", "ED7D31"),
    { id: "end", type: "flowChartTerminator", text: "End", transformation: { width: 100, height: 36 }, fill: "A5A5A5", line: "none" },
    { type: "connector", from: "start", to: "draft", line: arrow },
    { type: "connector", from: "draft", to: "review", line: arrow },
    {
        type: "connector",
        from: "review",
        to: "publish",
        route: "elbow",
        line: arrow,
        label: { text: "Yes", position: "start", fill: "FFFFFF" },
    },
    { type: "connector", from: "review", to: "fix", route: "elbow", line: arrow, label: { text: "No", position: "start", fill: "FFFFFF" } },
    { type: "connector", from: "fix", to: "draft", route: "elbow", line: arrow },
    { type: "connector", from: "publish", to: "end", line: arrow },
];

// An org chart laid out as a tree. Connectors without arrowheads leave each box from one point
const person = (id: string, name: string, role: string, fill = "DEEBF7"): IShapeCanvasChildOptions => ({
    id,
    type: "roundedRectangle",
    transformation: { width: "fitText", height: "fitText" },
    fill,
    line: "5B9BD5",
    children: [
        new Paragraph({ alignment: "center", children: [new TextRun({ text: name, bold: true, size: 20 })] }),
        new Paragraph({ alignment: "center", children: [new TextRun({ text: role, size: 16, color: "595959" })] }),
    ],
});
const reports = (from: string, ...to: readonly string[]): readonly IShapeCanvasChildOptions[] =>
    to.map((id) => ({ type: "connector", from, to: id, route: "elbow", line: plain }) as const);

const orgChart: readonly IShapeCanvasChildOptions[] = [
    person("ceo", "Ada Lovelace", "Chief Executive", "BDD7EE"),
    person("cto", "Alan Turing", "Technology"),
    person("cfo", "Grace Hopper", "Finance"),
    person("coo", "Edsger Dijkstra", "Operations"),
    person("dev", "Barbara Liskov", "Development"),
    person("qa", "Tony Hoare", "Quality"),
    person("ops", "Margaret Hamilton", "Infrastructure"),
    person("support", "Donald Knuth", "Support"),
    ...reports("ceo", "cto", "cfo", "coo"),
    ...reports("cto", "dev", "qa"),
    ...reports("coo", "ops", "support"),
];

// A pipeline running right. Two arrows arrive at "Test" and are spread along its side, and the two connectors
// between "Build" and "Deploy" are drawn side by side. It is a group, as LibreOffice joins the ends of connectors
// on a canvas at their connection sites
const pipeline: readonly IShapeCanvasChildOptions[] = [
    step("code", "Code"),
    step("docs", "Docs"),
    step("test", "Test"),
    step("build", "Build"),
    step("deploy", "Deploy", "70AD47"),
    { type: "connector", from: "code", to: "test", route: "elbow", line: arrow },
    { type: "connector", from: "docs", to: "test", route: "elbow", line: arrow },
    { type: "connector", from: "test", to: "build", line: arrow },
    { type: "connector", from: "build", to: "deploy", line: arrow, label: { text: "artefact", position: "start" } },
    { type: "connector", from: "deploy", to: "build", line: arrow, label: { text: "status", position: "start" } },
];

// Shapes in a grid, in the order given
const colours = ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"];
const grid = colours.map((fill, index): IShapeCanvasChildOptions => ({
    type: (["ellipse", "hexagon", "star5", "heart", "cloud", "sun"] as const)[index],
    transformation: { width: 50 + (index % 3) * 10, height: 50 },
    fill,
    line: "none",
}));

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Shapes that fit their text" }),
                new Paragraph({
                    children: [
                        new ShapeRun({
                            type: "rectangle",
                            text: "A rectangle",
                            transformation: { width: "fitText", height: "fitText" },
                            fill: "DEEBF7",
                        }),
                        new TextRun("  "),
                        new ShapeRun({
                            type: "ellipse",
                            text: "An ellipse",
                            transformation: { width: "fitText", height: 50 },
                            fill: "FBE5D6",
                        }),
                        new TextRun("  "),
                        new ShapeRun({
                            type: "rectangle",
                            transformation: { width: 120, height: "fitText" },
                            fill: "E2F0D9",
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "Wrapped at 120 pixels, in 12pt Arial", font: "Arial", size: 24 })],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: "A flowchart" }),
                new Paragraph({ children: [new ShapeCanvasRun({ layout: { type: "flow" }, children: flowchart })] }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: "An org chart" }),
                new Paragraph({ children: [new ShapeCanvasRun({ layout: { type: "tree" }, children: orgChart })] }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Spread and parallel connectors" }),
                new Paragraph({
                    children: [
                        new ShapeGroupRun({
                            layout: { type: "flow", direction: "right", spacing: 30, levelSpacing: 60 },
                            children: pipeline,
                        }),
                    ],
                }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: "A grid" }),
                new Paragraph({ children: [new ShapeGroupRun({ layout: { type: "grid", columns: 3, spacing: 20 }, children: grid })] }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
