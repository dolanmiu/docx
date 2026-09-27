// cspell:ignore DEEBF
// Shapes sized to fit their text in the document's styles: Word's newer defaults of 11pt Calibri with space after
// each paragraph, a heading style, a character style and paragraph indents.
// See docs/usage/shapes.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { ShapeCanvasRun, ShapeGroupRun, ShapeRun } from "docx/shapes";

const arrow = { color: "404040", width: 1.25, endArrow: "triangle" } as const;

const doc = new Document({
    styles: {
        default: {
            // Word's defaults for new documents since 2013, which shapes measure their text in
            document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 160, line: 259 } } },
            heading2: { run: { font: "Calibri", size: 32, bold: true, color: "2F5496" }, paragraph: { spacing: { before: 240 } } },
        },
        characterStyles: [{ id: "Code", name: "Code", run: { font: "Courier New", size: 20 } }],
        paragraphStyles: [{ id: "Note", name: "Note", basedOn: "Normal", run: { italics: true }, paragraph: { indent: { left: 360 } } }],
    },
    sections: [
        {
            children: [
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Shapes in the document's styles")] }),
                new Paragraph(
                    "This document's text is 11pt Calibri with space after each paragraph. Shapes sized to fit their text measure it in the same styles.",
                ),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Text in the document's font")] }),
                new Paragraph({
                    children: [
                        // One line of `text` has no space after it, so it stays in the middle of the shape
                        new ShapeRun({
                            type: "roundedRectangle",
                            text: "Fits its text",
                            transformation: { width: "fitText", height: "fitText" },
                            fill: "DEEBF7",
                            line: { color: "5B9BD5" },
                        }),
                        new TextRun("   "),
                        // Paragraphs of the shape's own keep the space after them
                        new ShapeRun({
                            type: "rectangle",
                            children: [
                                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A heading")] }),
                                new Paragraph({
                                    children: [new TextRun("and a paragraph with "), new TextRun({ text: "code", style: "Code" })],
                                }),
                                new Paragraph({ style: "Note", children: [new TextRun("An indented note")] }),
                            ],
                            transformation: { width: 220, height: "fitText" },
                            fill: "FFF2CC",
                            line: { color: "BF9000" },
                        }),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A diagram")] }),
                new Paragraph({
                    children: [
                        new ShapeCanvasRun({
                            layout: { type: "flow", direction: "right" },
                            children: [
                                {
                                    id: "order",
                                    type: "flowChartTerminator",
                                    text: "Order received",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: "A5A5A5",
                                    line: "none",
                                },
                                {
                                    id: "stock",
                                    type: "flowChartDecision",
                                    text: "In stock?",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: "70AD47",
                                    line: "none",
                                },
                                {
                                    id: "ship",
                                    type: "flowChartProcess",
                                    text: "Ship it",
                                    transformation: { width: "fitText", height: "fitText" },
                                    fill: "4472C4",
                                    line: "none",
                                },
                                { type: "connector", from: "order", to: "stock", line: arrow },
                                {
                                    type: "connector",
                                    from: "stock",
                                    to: "ship",
                                    line: arrow,
                                    label: { text: "Yes", position: "start", fill: "FFFFFF" },
                                },
                            ],
                        }),
                    ],
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A group")] }),
                new Paragraph({
                    children: [
                        new ShapeGroupRun({
                            layout: { type: "grid", columns: 3 },
                            children: ["Small", "Medium sized", "A little longer"].map((text) => ({
                                type: "ellipse" as const,
                                text,
                                transformation: { width: "fitText" as const, height: "fitText" as const },
                                fill: "FBE5D6",
                                line: { color: "ED7D31" },
                            })),
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
