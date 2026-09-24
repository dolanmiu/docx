// Shape groups: several shapes laid out, moved and resized together as one drawing.
// Each child is positioned with transformation.offset, in pixels, and connectors join shapes by their ids.
// See docs/usage/shapes.md.

import * as fs from "fs";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    type IShapeGroupChildOptions,
    Packer,
    Paragraph,
    ShapeGroupRun,
    TextRun,
    TextWrappingType,
    VerticalPositionRelativeFrom,
} from "docx";

const label = (text: string): Paragraph =>
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, color: "FFFFFF", bold: true })] });

// A connector from one shape to the next. The group draws it between the facing sides of the two shapes
const arrow = (from: string, to: string): IShapeGroupChildOptions => ({
    type: "connector",
    from,
    to,
    line: { color: "404040", width: 1.5, endArrow: "triangle" },
});

// A small flowchart: Start -> Process -> Decision -> End
const flowchart: readonly IShapeGroupChildOptions[] = [
    {
        id: "start",
        type: "flowChartTerminator",
        transformation: { width: 100, height: 44 },
        fill: "4472C4",
        line: "none",
        children: [label("Start")],
        altText: { name: "Start" },
    },
    {
        id: "draft",
        type: "flowChartProcess",
        transformation: { offset: { left: 130 }, width: 110, height: 44 },
        fill: "ED7D31",
        line: "none",
        children: [label("Draft")],
        altText: { name: "Draft" },
    },
    {
        id: "review",
        type: "flowChartDecision",
        transformation: { offset: { left: 270, top: -14 }, width: 110, height: 72 },
        fill: "70AD47",
        line: "none",
        children: [label("OK?")],
        altText: { name: "Review" },
    },
    {
        id: "publish",
        type: "flowChartTerminator",
        transformation: { offset: { left: 410 }, width: 100, height: 44 },
        fill: "4472C4",
        line: "none",
        children: [label("Publish")],
        altText: { name: "Publish" },
    },
    arrow("start", "draft"),
    arrow("draft", "review"),
    arrow("review", "publish"),
];

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Shape groups")] }),

                new Paragraph({ children: [new TextRun("A group is as big as the box around its shapes:")] }),
                new Paragraph({
                    spacing: { after: 240 },
                    children: [new ShapeGroupRun({ children: flowchart, altText: { name: "Publishing flowchart" } })],
                }),

                new Paragraph({ children: [new TextRun("Give the group a size to scale every shape in it:")] }),
                new Paragraph({
                    spacing: { after: 240 },
                    children: [new ShapeGroupRun({ children: flowchart, transformation: { width: 300, height: 42 } })],
                }),

                new Paragraph({ children: [new TextRun("Groups can float, rotate and flip like single shapes:")] }),
                new Paragraph({
                    children: [
                        new ShapeGroupRun({
                            children: [
                                {
                                    type: "ellipse",
                                    transformation: { width: 80, height: 80 },
                                    fill: { color: "5B9BD5", transparency: 30 },
                                    line: "none",
                                },
                                {
                                    type: "star5",
                                    transformation: { offset: { left: 15, top: 12 }, width: 50, height: 50 },
                                    fill: "FFC000",
                                    line: { color: "BF9000" },
                                },
                            ],
                            transformation: { width: 80, height: 80, rotation: 20 },
                            floating: {
                                horizontalPosition: {
                                    relative: HorizontalPositionRelativeFrom.MARGIN,
                                    align: HorizontalPositionAlign.RIGHT,
                                },
                                verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                                wrap: { type: TextWrappingType.SQUARE },
                            },
                            altText: { name: "Badge", description: "A gold star on a blue circle" },
                        }),
                        new TextRun(
                            "This badge is a group of an ellipse and a star, rotated by 20 degrees and floating at the right margin. " +
                                "The text wraps around the group as it would around a single shape or an image.",
                        ),
                    ],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
