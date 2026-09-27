// cspell:ignore DEEBF FBE5D6 EDEDED
// A process in swimlanes: each step goes in the lane of the team that does it, and the flow runs along the lanes.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { type IShapeCanvasChildOptions, ShapeCanvasRun } from "docx/shapes";

const arrow = { color: "404040", width: 1.25, endArrow: "triangle" } as const;

// A step as wide as its text
const step = (id: string, text: string, lane: string, fill: string): IShapeCanvasChildOptions => ({
    id,
    lane,
    type: "flowChartProcess",
    text,
    transformation: { width: "fitText", height: 40 },
    fill,
    line: "none",
});

const process: readonly IShapeCanvasChildOptions[] = [
    {
        id: "start",
        lane: "Customer",
        type: "flowChartTerminator",
        text: "Report a problem",
        transformation: { width: "fitText", height: 36 },
        fill: "A5A5A5",
        line: "none",
    },
    step("log", "Log the ticket", "Support", "5B9BD5"),
    {
        id: "known",
        lane: "Support",
        type: "flowChartDecision",
        text: "Known issue?",
        transformation: { width: "fitText", height: 70 },
        fill: "70AD47",
        line: "none",
    },
    step("fix", "Fix the bug", "Engineering", "ED7D31"),
    step("reply", "Send the answer", "Support", "5B9BD5"),
    {
        id: "done",
        lane: "Customer",
        type: "flowChartTerminator",
        text: "Problem solved",
        transformation: { width: "fitText", height: 36 },
        fill: "A5A5A5",
        line: "none",
    },
    { type: "connector", from: "start", to: "log", route: "elbow", line: arrow },
    { type: "connector", from: "log", to: "known", line: arrow },
    { type: "connector", from: "known", to: "reply", line: arrow, label: { text: "Yes", position: "start", fill: "FFFFFF" } },
    {
        type: "connector",
        from: { id: "known", side: "right" },
        to: "fix",
        route: "elbow",
        line: arrow,
        label: { text: "No", position: "start", fill: "FFFFFF" },
    },
    { type: "connector", from: "fix", to: "reply", route: "elbow", line: arrow },
    { type: "connector", from: "reply", to: "done", route: "elbow", line: arrow },
];

// A shorter process, for lanes across the page
const order: readonly IShapeCanvasChildOptions[] = [
    step("order", "Order", "Customer", "A5A5A5"),
    step("pack", "Pack", "Warehouse", "5B9BD5"),
    step("ship", "Ship", "Courier", "ED7D31"),
    step("receive", "Receive", "Customer", "A5A5A5"),
    { type: "connector", from: "order", to: "pack", route: "elbow", line: arrow },
    { type: "connector", from: "pack", to: "ship", route: "elbow", line: arrow },
    { type: "connector", from: "ship", to: "receive", route: "elbow", line: arrow },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Swimlanes")] }),
                new Paragraph(
                    "A support process, with a lane for each team. The flow runs down the lanes, and connectors cross between them.",
                ),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({
                            layout: {
                                type: "flow",
                                spacing: 30,
                                levelSpacing: 40,
                                lanes: [
                                    { name: "Customer", fill: "F2F2F2" },
                                    { name: "Support", fill: "DEEBF7" },
                                    { name: "Engineering", fill: "FBE5D6" },
                                ],
                            },
                            children: process,
                        }),
                    ],
                }),
                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Lanes across the page")] }),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({
                            layout: {
                                type: "flow",
                                direction: "right",
                                spacing: 20,
                                levelSpacing: 40,
                                lanes: ["Customer", "Warehouse", "Courier"],
                            },
                            children: order,
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
